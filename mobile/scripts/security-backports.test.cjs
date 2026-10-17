const test = require('node:test');
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const path = require('node:path');
const fs = require('node:fs');
const os = require('node:os');
const { backports, definitions } = require('./security-backports.cjs');
const root = path.resolve(__dirname, '..');
const resolve = name => require.resolve(name, { paths: [root] });
const image = require.resolve('image-size', {
  paths: [path.dirname(resolve('metro/package.json'))],
});
const decoder = require.resolve('decode-uri-component', {
  paths: [path.dirname(resolve('expo-router/package.json'))],
});

function isolated(source) {
  const result = spawnSync(process.execPath, ['-e', source], { timeout: 5000, encoding: 'utf8' });
  assert.ifError(result.error);
  assert.equal(result.status, 0, (result.stderr || result.stdout).split('\n').filter(line => line.length < 500).slice(-14).join('\n'));
}

test('all installed copies exactly match reviewed source hashes', () => {
  assert.ok(backports('check') >= 11);
  assert.equal(backports('apply'), backports('check'));
});
test('an unpatched or changed installation cannot pass verification', () => {
  const fixture = fs.mkdtempSync(path.join(os.tmpdir(), 'badenya-patch-check-'));
  try {
    fs.writeFileSync(
      path.join(fixture, 'package-lock.json'),
      JSON.stringify({ packages: { 'node_modules/braces': {} } })
    );
    const directory = path.join(fixture, 'node_modules/braces/lib');
    fs.mkdirSync(directory, { recursive: true });
    fs.writeFileSync(
      path.join(fixture, 'node_modules/braces/package.json'),
      JSON.stringify({ version: '3.0.3' })
    );
    fs.writeFileSync(path.join(directory, 'parse.js'), 'unreviewed source');
    assert.throws(() => backports('check', fixture), /Unverified/);
    assert.throws(() => backports('apply', fixture), /Unverified/);
  } finally {
    fs.rmSync(fixture, { recursive: true, force: true });
  }
});
test('deep patterns and direct ASTs terminate with a controlled error', () =>
  isolated(`
  const assert=require('node:assert/strict');const braces=require(${JSON.stringify(resolve('braces'))});
  for(const input of ['{'.repeat(4500)+'x'+'}'.repeat(4500),'('.repeat(4500)+'x'+')'.repeat(4500)]) {
    for(const action of [braces,braces.expand,braces.compile,braces.stringify]) assert.throws(()=>action(input),SyntaxError);
  }
  let ast={type:'text',value:'x'};for(let i=0;i<150;i++)ast={type:'root',nodes:[ast]};
  for(const action of [braces.expand,braces.compile,braces.stringify]) assert.throws(()=>action(ast),SyntaxError);
  assert.deepEqual(braces.expand('receipt-{1..3}.{png,jpg}'),['receipt-1.png','receipt-1.jpg','receipt-2.png','receipt-2.jpg','receipt-3.png','receipt-3.jpg']);
`));
test('RSA verification rejects unconsumed nested elements and preserves valid SHA256 signatures', () =>
  isolated(`
  const assert=require('node:assert/strict');const crypto=require('node:crypto');const forge=require(${JSON.stringify(resolve('node-forge'))});
  const keys=crypto.generateKeyPairSync('rsa',{modulusLength:1024,publicExponent:3,privateKeyEncoding:{format:'pem',type:'pkcs1'},publicKeyEncoding:{format:'pem',type:'spki'}});
  const key=forge.pki.privateKeyFromPem(keys.privateKey);const publicKey=forge.pki.publicKeyFromPem(keys.publicKey);
  global.window=globalThis;
  // The all-in-one UMD distribution initializes its optional jQuery adapter.
  global.jQuery={};
  const verifiers=[publicKey,...${JSON.stringify(['forge.min.js','forge.all.min.js'].map(name=>path.resolve(path.dirname(resolve('node-forge')),'../dist',name)))}.map(file=>require(file).pki.publicKeyFromPem(keys.publicKey))];
  const a=forge.asn1;const node=(type,constructed,value)=>a.create(a.Class.UNIVERSAL,type,constructed,value);
  const digest=forge.md.sha256.create().update('badenya regression').digest().getBytes();
  for(const includeNull of [false,true]) {
    const algorithm=[node(a.Type.OID,false,a.oidToDer(forge.oids.sha256).getBytes())];
    if(includeNull)algorithm.push(node(a.Type.NULL,false,''));
    const value=node(a.Type.SEQUENCE,true,[node(a.Type.SEQUENCE,true,algorithm),node(a.Type.OCTETSTRING,false,digest)]);
    const signature=key.sign(a.toDer(value).getBytes(),'NONE');
    for(const verifier of verifiers) assert.equal(verifier.verify(digest,signature),true);
    // OpenSSL expects the canonical NULL parameter; forge also supports omitted NULL.
    if(includeNull) assert.equal(crypto.verify('sha256',Buffer.from('badenya regression'),keys.publicKey,Buffer.from(signature,'binary')),true);
    value.value[0].value.push(node(a.Type.OCTETSTRING,false,'unconsumed attacker bytes'));
    const malformed=key.sign(a.toDer(value).getBytes(),'NONE');
    for(const verifier of verifiers) assert.throws(()=>verifier.verify(digest,malformed),/DigestInfo/);
    assert.equal(crypto.verify('sha256',Buffer.from('badenya regression'),keys.publicKey,Buffer.from(malformed,'binary')),false);
  }
`));
test('malformed ICNS, JXL and HEIF blocks cannot hang the Metro image parser', () =>
  isolated(`
  const assert=require('node:assert/strict');const size=require(${JSON.stringify(image)});
  const icns=Buffer.alloc(24);icns.write('icns');icns.writeUInt32BE(24,4);icns.write('ic07',8);icns.writeUInt32BE(8,12);icns.write('ic07',16);
  assert.throws(()=>size(icns),/Invalid ICNS/);
  const jxl=Buffer.concat([Buffer.from('0000000c4a584c200d0a870a','hex'),Buffer.from('000000006a786c70','hex')]);
  assert.throws(()=>size(jxl));
  const heif=Buffer.concat([Buffer.from('00000010667479706176696600000000','hex'),Buffer.from('000000006d657461','hex')]);
  assert.throws(()=>size(heif));
  const valid=Buffer.alloc(16);valid.write('icns');valid.writeUInt32BE(16,4);valid.write('ic07',8);valid.writeUInt32BE(8,12);
  const result=size(valid);assert.equal(result.width,128);assert.equal(result.height,128);
`));
test('malformed percent sequences decode in bounded time and retain CommonJS semantics', () =>
  isolated(`
  const assert=require('node:assert/strict');const decode=require(${JSON.stringify(decoder)});
  assert.equal(decode('cotisation+%E2%82%AC'),'cotisation €');
  assert.equal(decode('%E0%A4%A'),'\u0025E0\u0025A4\u0025A');
  assert.equal(decode('%FE%FF'),'��');
  assert.throws(()=>decode(null),TypeError);
  const input='%E0%A4%A'.repeat(5000);assert.equal(typeof decode(input),'string');
  const query=require(require.resolve('query-string',{paths:[${JSON.stringify(path.dirname(resolve('expo-router/package.json')))}]}));
  assert.equal(query.parse('name=Jean+Dupont').name,'Jean Dupont');
`));

// Every advisory must have both reviewed source and a regression category above.
test('backport provenance is recorded for all known advisories', () => {
  const ids = new Set(definitions.flatMap(patch => patch.advisories));
  assert.equal(ids.size, 5);
});

test('audit gate rejects any new advisory rather than ignoring a package name', () => {
  const { inspectAudit } = require('./audit-security.cjs');
  const make = url => ({
    metadata: { vulnerabilities: { high: 1 } },
    vulnerabilities: {
      braces: { via: [{ url }], nodes: ['node_modules/braces'] },
      micromatch: { via: ['braces'], nodes: ['node_modules/micromatch'] },
    },
  });
  assert.deepEqual(inspectAudit(make('https://github.com/advisories/GHSA-vfj7-8cjw-p6xm')), [
    'GHSA-vfj7-8cjw-p6xm',
  ]);
  assert.throws(
    () => inspectAudit(make('https://github.com/advisories/GHSA-new1-new2-new3')),
    /Unpatched advisory/
  );
  assert.throws(
    () => inspectAudit({ metadata: {}, error: { message: 'registry offline' } }),
    /Incomplete/
  );
});
test('postinstall reproducibly patches a clean copy and is idempotent', () => {
  const fixture = fs.mkdtempSync(path.join(os.tmpdir(), 'badenya-clean-backports-'));
  try {
    const lock = require('../package-lock.json');
    fs.writeFileSync(path.join(fixture, 'package-lock.json'), JSON.stringify(lock));
    for (const patch of definitions)
      for (const location of Object.keys(lock.packages).filter(
        location =>
          location === `node_modules/${patch.package}` ||
          location.endsWith(`/node_modules/${patch.package}`)
      )) {
        const directory = path.join(fixture, location);
        fs.mkdirSync(path.dirname(path.join(directory, patch.file)), { recursive: true });
        fs.writeFileSync(
          path.join(directory, 'package.json'),
          JSON.stringify({ version: patch.version })
        );
        let source = fs.readFileSync(path.join(root, location, patch.file), 'utf8');
        for (const edit of [...patch.edits].reverse())
          source = source.replace(edit.after, edit.before);
        fs.writeFileSync(path.join(directory, patch.file), source);
      }
    assert.throws(() => backports('check', fixture), /Unverified/);
    assert.equal(backports('apply', fixture), 11);
    assert.equal(backports('check', fixture), 11);
    assert.equal(backports('apply', fixture), 11);
  } finally {
    fs.rmSync(fixture, { recursive: true, force: true });
  }
});

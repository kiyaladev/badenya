// Reads the configured Badenya database; restores only into an owned temporary server.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { spawn } = require('node:child_process');
const dotenv = require('dotenv');
const { MongoClient, BSON } = require('mongoose').mongo;
const { MongoMemoryReplSet } = require('mongodb-memory-server');

const project = path.resolve(__dirname, '..');
const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const backup = path.join('/var/backups/badenya', `preflight-${stamp}`);
let source, restored, temporary;
const transientConfigs = [];
process.umask(0o077);

function privateFile(name, contents) {
  const filename = path.join(backup, name);
  fs.writeFileSync(filename, contents, { flag: 'wx', mode: 0o600 });
  return filename;
}
function tool(binary, args) {
  return new Promise((resolve, reject) => {
    // Keep the event loop running so the temporary mongod's output is drained.
    const child = spawn(binary, args, { stdio: ['ignore', 'ignore', 'pipe'] });
    let diagnostic = '';
    child.stderr.on('data', data => {
      diagnostic = (diagnostic + data).slice(-1024 * 1024);
    });
    let forcedStop;
    const timeout = setTimeout(() => {
      child.kill('SIGTERM');
      forcedStop = setTimeout(() => child.kill('SIGKILL'), 5000);
    }, 120000);
    child.once('error', reject);
    child.once('close', code => {
      clearTimeout(timeout);
      clearTimeout(forcedStop);
      if (code === 0) resolve();
      else {
        privateFile(`${binary}-error.txt`, diagnostic || 'Tool failed');
        reject(new Error(`${binary} failed; diagnostics retained privately`));
      }
    });
  });
}
async function fingerprint(db, name) {
  const hash = crypto.createHash('sha256');
  let count = 0;
  for await (const document of db.collection(name).find({}).sort({ _id: 1 })) {
    hash.update(BSON.serialize(document));
    count++;
  }
  return { count, digest: hash.digest('hex') };
}
async function run() {
  const cfg = dotenv.parse(fs.readFileSync(path.join(project, 'backend/.env')));
  if (!cfg.MONGODB_URI) throw new Error('Configured database URI missing');
  fs.mkdirSync(path.dirname(backup), { recursive: true, mode: 0o700 });
  fs.mkdirSync(backup, { mode: 0o700 });
  source = new MongoClient(cfg.MONGODB_URI, { serverSelectionTimeoutMS: 10000 });
  await source.connect();
  const db = source.db();
  const names = (await db.listCollections({}, { nameOnly: false }).toArray())
    .filter(c => c.type === 'collection' && !c.name.startsWith('system.'))
    .map(c => c.name).sort();
  const before = {};
  for (const name of names) before[name] = await fingerprint(db, name);
  const dumpConfig = privateFile('dump-config.yml', `uri: ${JSON.stringify(cfg.MONGODB_URI)}\n`);
  transientConfigs.push(dumpConfig);
  const archive = privateFile('database.archive.gz', '');
  await tool('mongodump', ['--quiet', `--config=${dumpConfig}`, `--db=${db.databaseName}`,
    '--numParallelCollections=1', '--gzip', `--archive=${archive}`]);
  console.log('Private preliminary archive created; checking isolated restore');
  const password = crypto.randomBytes(32).toString('hex');
  temporary = await MongoMemoryReplSet.create({
    binary: { systemBinary: '/usr/bin/mongod', version: '8.0.19' },
    replSet: { count: 1, ip: '127.0.0.1', auth: {
      enable: true, customRootName: 'restore-verifier', customRootPwd: password,
    } },
    instanceOpts: [{ launchTimeout: 120000 }],
  });
  const uri = new URL(temporary.getUri('restorecheck'));
  uri.username = 'restore-verifier';
  uri.password = password;
  uri.searchParams.set('authSource', 'admin');
  const restoreConfig = privateFile('restore-config.yml', `uri: ${JSON.stringify(uri.toString())}\n`);
  transientConfigs.push(restoreConfig);
  await tool('mongorestore', ['--quiet', `--config=${restoreConfig}`, '--gzip', `--archive=${archive}`,
    `--nsInclude=${db.databaseName}.*`, `--nsFrom=${db.databaseName}.*`, '--nsTo=restorecheck.*',
    '--numParallelCollections=1', '--stopOnError']);
  restored = new MongoClient(uri.toString());
  await restored.connect();
  let documents = 0;
  for (const name of names) {
    const actual = await fingerprint(restored.db(), name);
    if (actual.count !== before[name].count || actual.digest !== before[name].digest)
      throw new Error('Restored data differs from preliminary source read; live writes may require a new dump');
    documents += actual.count;
  }
  const report = {
    checkedAt: new Date().toISOString(), preliminary: true,
    sourceWritesPerformed: false, collections: names.length, documents,
    restoredDocumentsMatchSourceRead: true, authenticatedTemporaryReplica: true,
    archiveSha256: crypto.createHash('sha256').update(fs.readFileSync(archive)).digest('hex'),
    archiveBytes: fs.statSync(archive).size,
    finalQuiescedDumpRequired: true,
  };
  privateFile('verification.json', JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify({ ...report, backupDirectory: backup }, null, 2));
}
async function cleanup() {
  await Promise.allSettled([restored?.close(), source?.close()]);
  try {
    if (temporary) await temporary.stop();
  } finally {
    for (const file of transientConfigs) fs.rmSync(file, { force: true });
  }
}
run().catch(() => {
  console.error('Backup verification failed; no credentials or database contents printed.');
  process.exitCode = 1;
}).finally(cleanup);

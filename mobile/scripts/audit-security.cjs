const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const { backports, definitions } = require('./security-backports.cjs');
const root = path.resolve(__dirname, '..');

function inspectAudit(audit) {
  if (audit.error || !audit.metadata || !audit.vulnerabilities)
    throw new Error('Incomplete npm audit response');
  const known = new Map();
  for (const patch of definitions) for (const id of patch.advisories) known.set(id, patch.package);
  const covered = new Set();
  const lock = require('../package-lock.json');
  const visit = (name, chain, evidence) => {
    if (chain.has(name)) return;
    const record = audit.vulnerabilities[name];
    if (!record || !record.via?.length) throw new Error(`Unresolved vulnerability: ${name}`);
    const next = new Set([...chain, name]);
    for (const via of record.via) {
      if (typeof via === 'string') {
        visit(via, next, evidence);
        continue;
      }
      const id = /GHSA-[a-z0-9-]+$/i.exec(via.url || '')?.[0];
      if (!id || known.get(id) !== name)
        throw new Error(`Unpatched advisory: ${name} ${via.url || via.title}`);
      if (
        !record.nodes?.length ||
        record.nodes.some(node => !node.endsWith(`node_modules/${name}`) || !lock.packages[node])
      )
        throw new Error(`Unexpected affected location: ${name}`);
      covered.add(id);
      evidence.found = true;
    }
  };
  for (const name of Object.keys(audit.vulnerabilities)) {
    const evidence = { found: false };
    visit(name, new Set(), evidence);
    if (!evidence.found) throw new Error(`Unresolved advisory chain: ${name}`);
  }
  return [...covered].sort();
}

if (require.main === module) {
  try {
    // Source integrity is checked again after behavioral regressions (security:verify).
    backports('check');
    const result = spawnSync(
      process.platform === 'win32' ? 'npm.cmd' : 'npm',
      ['audit', '--json'],
      {
        cwd: root,
        encoding: 'utf8',
        timeout: 60000,
        maxBuffer: 10 * 1024 * 1024,
      }
    );
    if (result.error || ![0, 1].includes(result.status))
      throw result.error || new Error('npm audit did not finish normally');
    const audit = JSON.parse(result.stdout);
    if (process.env.SECURITY_AUDIT_REPORT)
      fs.writeFileSync(process.env.SECURITY_AUDIT_REPORT, JSON.stringify(audit, null, 2) + '\n');
    const covered = inspectAudit(audit);
    console.log(
      JSON.stringify(
        {
          rawNpmFindings: audit.metadata.vulnerabilities,
          verifiedBackports: covered,
          unhandledAdvisories: 0,
        },
        null,
        2
      )
    );
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
module.exports = { inspectAudit };

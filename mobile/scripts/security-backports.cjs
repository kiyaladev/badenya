const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const root = path.resolve(__dirname, '..');
const definitions = require('../patches/security-backports.json');
const digest = value => crypto.createHash('sha256').update(value).digest('hex');

/** Fail closed on missing copies, version drift or any unreviewed source change. */
function backports(mode = 'check', projectRoot = root) {
  const lock = JSON.parse(fs.readFileSync(path.join(projectRoot, 'package-lock.json'), 'utf8'));
  let verified = 0;
  for (const patch of definitions) {
    const locations = Object.keys(lock.packages).filter(
      location =>
        location === `node_modules/${patch.package}` ||
        location.endsWith(`/node_modules/${patch.package}`)
    );
    if (!locations.length) throw new Error(`Missing package in lock: ${patch.package}`);
    for (const location of locations) {
      const directory = path.join(projectRoot, location);
      const pkg = JSON.parse(fs.readFileSync(path.join(directory, 'package.json'), 'utf8'));
      if (pkg.version !== patch.version)
        throw new Error(`Review backport for ${patch.package}@${pkg.version}`);
      const file = path.join(directory, patch.file);
      const original = fs.readFileSync(file, 'utf8');
      if (digest(original) === patch.patchedSha256) {
        verified++;
        continue;
      }
      if (mode !== 'apply' || digest(original) !== patch.originalSha256)
        throw new Error(`Unverified security backport: ${location}/${patch.file}`);
      let updated = original;
      for (const edit of patch.edits) {
        if (updated.split(edit.before).length !== 2)
          throw new Error(`Ambiguous backport: ${patch.file}`);
        updated = updated.replace(edit.before, edit.after);
      }
      if (digest(updated) !== patch.patchedSha256)
        throw new Error(`Invalid backport result: ${patch.file}`);
      fs.writeFileSync(file, updated);
      verified++;
    }
  }
  return verified;
}

if (require.main === module) {
  try {
    console.log(
      `Verified ${backports(process.argv[2] || 'check')} security backports (upstream package versions unchanged)`
    );
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
module.exports = { backports, definitions };

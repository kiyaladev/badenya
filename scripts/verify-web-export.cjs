const fs = require('node:fs');
const path = require('node:path');
const directory = process.argv[2];
const expected = process.env.EXPO_PUBLIC_API_URL || 'https://badenya-api.naimba.com/api/v1';
const bundles = fs.readdirSync(path.join(directory, '_expo/static/js/web')).filter(name => name.endsWith('.js'));
let verified = false;
for (const bundle of bundles) {
  const source = fs.readFileSync(path.join(directory, '_expo/static/js/web', bundle), 'utf8');
  if (source.includes('import.meta')) throw new Error('Unsupported import.meta in web export');
  for (const module of source.split('__d(')) {
    if (!module.includes('API_BASE_URL') || !module.includes('/auth/refresh-token') || !module.includes('baseURL:')) continue;
    if (!module.includes(JSON.stringify(expected))) throw new Error('API module has stale or unexpected build URL; clear Metro cache');
    verified = true;
  }
}
if (!verified) throw new Error('Cannot verify the compiled API module');
console.log('Verified web export API URL and module compatibility');

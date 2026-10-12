import { cp, mkdir, readdir, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const app = fileURLToPath(new URL('../', import.meta.url));
const output = path.resolve(app, '../../taskflow');
const repository = path.resolve(app, '../..');
if (path.relative(repository, output) !== 'taskflow')
  throw new Error('Unexpected build destination.');
// Remove only generated files in this app's fixed destination. Preserve other files.
await mkdir(output, { recursive: true });
for (const name of await readdir(output)) {
  if (name === 'index.html' || name === 'favicon.svg' || name === 'assets') {
    const target = path.join(output, name);
    if (path.dirname(target) !== output) throw new Error('Generated file is outside TaskFlow.');
    await rm(target, { recursive: true, force: true });
  }
}
await cp(path.join(app, 'dist'), output, { recursive: true });
console.log('TaskFlow build copied to portfolio/taskflow/.');

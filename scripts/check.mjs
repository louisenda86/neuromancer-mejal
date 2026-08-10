/* Parses every inline <script> in index.html and reports the first syntax
   error with a line number. A broken inline module fails silently — the page
   still serves 200 and just never boots — so this runs before every deploy. */
import { readFile, writeFile, unlink } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const run = promisify(execFile);
const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const html = await readFile(resolve(projectRoot, 'index.html'), 'utf8');

const scripts = [...html.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/g)];
if (!scripts.length) {
  console.error('no inline scripts found — did the markup change?');
  process.exit(1);
}

let failed = 0;

for (const [index, match] of scripts.entries()) {
  const [, attrs, body] = match;
  if (/\ssrc=/.test(attrs)) continue;
  const isModule = /type\s*=\s*["']module["']/.test(attrs);
  const startLine = html.slice(0, match.index).split('\n').length;
  const file = resolve(tmpdir(), `nm-check-${index}.${isModule ? 'mjs' : 'js'}`);
  await writeFile(file, body);
  try {
    await run(process.execPath, ['--check', file]);
    console.log(`script #${index} (${isModule ? 'module' : 'classic'}, line ${startLine}): OK — ${body.length} chars`);
  } catch (error) {
    failed += 1;
    const text = String(error.stderr || error.message);
    const local = text.match(/nm-check-\d+\.m?js:(\d+)/);
    const where = local ? `index.html:${startLine + Number(local[1]) - 1}` : `index.html:~${startLine}`;
    console.error(`script #${index}: SYNTAX ERROR at ${where}`);
    console.error(text.split('\n').slice(0, 6).join('\n'));
  } finally {
    await unlink(file).catch(() => {});
  }
}

/* A stray </script> inside a string literal ends the block early and the rest
   of the module is parsed as markup. */
const inlineTerminator = html.match(/<script[^>]*>[\s\S]*?<\/script\s*>/g) || [];
console.log(`\n${scripts.length} script block(s), ${inlineTerminator.length} closed cleanly`);

if (failed) {
  console.error(`\n${failed} script block(s) failed to parse.`);
  process.exit(1);
}
console.log('all inline scripts parse.');

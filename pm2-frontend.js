import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

const vite = spawn('node', [join(__dirname, 'node_modules/vite/bin/vite.js'), '--host'], {
  stdio: 'inherit',
  shell: true
});

vite.on('close', (code) => {
  process.exit(code);
});
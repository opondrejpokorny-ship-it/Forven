import { spawnSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const frontendDir = resolve(scriptDir, '..');

const result = spawnSync('npm', ['run', 'build'], {
	cwd: frontendDir,
	env: {
		...process.env,
		FORVEN_PACKAGE_BUILD: '1',
	},
	stdio: 'inherit',
	shell: process.platform === 'win32',
});

process.exit(result.status ?? 1);

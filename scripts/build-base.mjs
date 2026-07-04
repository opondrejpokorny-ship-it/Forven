import { spawnSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const frontendDir = resolve(rootDir, 'frontend');
const sourceDir = resolve(frontendDir, 'build');
const distDir = resolve(rootDir, 'dist');

function run(command, args, options = {}) {
	const result = spawnSync(command, args, {
		cwd: rootDir,
		stdio: 'inherit',
		shell: process.platform === 'win32',
		...options,
	});
	if (result.status !== 0) {
		process.exit(result.status ?? 1);
	}
}

run('npm', ['--prefix', frontendDir, 'run', 'build'], {
	env: {
		...process.env,
		FORVEN_PACKAGE_BUILD: '1',
	},
});

if (!existsSync(sourceDir)) {
	console.error('Expected SvelteKit static build at frontend/build, but it was not created.');
	process.exit(1);
}

rmSync(distDir, { recursive: true, force: true });
mkdirSync(distDir, { recursive: true });
cpSync(sourceDir, distDir, { recursive: true });

console.log(`Static Base build written to ${distDir}`);

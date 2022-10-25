'use strict';
const fs = require('fs');
const path = require('path');
const cp = require('child_process');

// # runWithVersion(command)
async function runWithVersion(command) {

	// First of all we'll check if nvs is installed.
	let hasNvs = await run('where nvs') === 0;
	if (!hasNvs) {
		error('nvs was not found in the PATH! Please install nvs first from https://github.com/jasongin/nvs');
		process.exit(1);
	}

	// Read in the package.json file in the current cwd because it's here that 
	// we need to look for a version.
	const packagePath = path.join(process.cwd(), 'package.json');
	if (!fs.existsSync(packagePath)) {
		error(`No package.json found! Looking for "${packagePath}"`);
		process.exit(1);
	}

	// Now check for a Node version.
	const pkg = JSON.parse(fs.readFileSync(packagePath));
	let version = 'lts';
	if (pkg.engines && pkg.engines.node) {
		version = pkg.engines.node;
		log(`Using Node ${version}`);
	} else {
		log(`No Node version found in package.json. Using ${version}`);
	}

	// Check if the specified version of Node is already installed.
	log(`Checking for Node ${version}`);
	if (!await isInstalled(version)) {
		log(`Installing Node ${version}`);
		await add(version);
	}

	// Cool, now run the script.
	log(`Running ${command}`);
	await exec(version, command);

}
module.exports = runWithVersion;

// # run(cmd, opts)
// Simple wrapper around cp.exec() with a promise-based api.
function run(cmd, opts = {}) {
	return new Promise((resolve, reject) => {
		const child = cp.exec(cmd);
		if (opts.pipe) {
			child.stdout.pipe(process.stdout);
			child.stderr.pipe(process.stderr);
		}
		child.on('exit', code => resolve(code));
		child.on('error', err => reject(err));
	});
}

// # isInstalled(version)
// Runs `nvs which ${version}` to see if a binary for the desired version has 
// already been added.
async function isInstalled(version) {
	let code = await run(`nvs which ${version}`);
	return code === 0;
}

// # exec(version, command)
async function exec(version, command) {
	await run(`nvs exec ${version} ${command}`, { pipe: true });
}

// # add(version)
// Installs a Node.js version with nvs if not installed yet.
async function add(version) {
	await run(`nvs add ${version}`);
}

// # error(str)
function error(str) {
	console.error(`\u001b[31m${str}\u001b[0m`);
}

// # log(str)
function log(str) {
	console.error(`\u001b[33m${str}\u001b[0m`);
}

#!/usr/bin/env node
const run = require('./index.js');
const command = process.argv.slice(2).join(' ');
run(command);

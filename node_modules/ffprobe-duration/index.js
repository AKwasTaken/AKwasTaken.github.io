#!/usr/bin/env node

const { promisify } = require('util')
const exec = promisify(require('child_process').exec);

module.exports = main

async function main(filename) {
  const { stdout } = await exec(`ffprobe -v error -show_entries format=duration -of csv="p=0" "${filename}"`);
  return Number(stdout);
}

if (!module.parent) {
  /* cli mode */
  main(process.argv.slice(2).join(' ')).then(console.log).catch(error => {
    console.error(error);
    process.exitCode = 1;
  });
}

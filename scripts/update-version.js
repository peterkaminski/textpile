#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');

// Import version from source
const versionModule = await import('../public/version.js');
const version = versionModule.TEXTPILE_VERSION;

console.log(`Updating documentation to version ${version}...`);

// Update README.md
const readmePath = path.join(rootDir, 'README.md');
let readme = fs.readFileSync(readmePath, 'utf8');
readme = readme.replace(
  /\*\*Current Version\*\*: v[\d.]+/,
  `**Current Version**: v${version}`
);
fs.writeFileSync(readmePath, readme);
console.log('✓ Updated README.md');

// Update CONFIGURATION.md
const configPath = path.join(rootDir, 'CONFIGURATION.md');
let config = fs.readFileSync(configPath, 'utf8');
config = config.replace(
  /This is an instance of Textpile [\d.]+/,
  `This is an instance of Textpile ${version}`
);
fs.writeFileSync(configPath, config);
console.log('✓ Updated CONFIGURATION.md');

// Update package.json
const packagePath = path.join(rootDir, 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
packageJson.version = version;
fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2) + '\n');
console.log('✓ Updated package.json');

console.log(`\nVersion updated to ${version} in all documentation files.`);
console.log('\nNext steps:');
console.log('1. Update CHANGELOG.md manually (add release notes)');
console.log('2. git add -A');
console.log(`3. git commit -m "Release v${version}"`);
console.log(`4. git tag -a v${version} -m "Release v${version}"`);
console.log('5. git push origin main --tags');

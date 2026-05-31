#!/usr/bin/env node

import { cpSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { homedir } from 'os';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const SKILLS_DIR = join(homedir(), '.claude', 'skills');

const SKILLS = [
  'forge-contract-test',
  'forge-done',
  'forge-implement',
  'forge-init',
  'forge-tasks',
];

console.log('Installing @forge-workflow/module skills...\n');

mkdirSync(SKILLS_DIR, { recursive: true });

for (const skill of SKILLS) {
  cpSync(join(ROOT, skill), join(SKILLS_DIR, skill), { recursive: true, force: true });
  console.log(`  ✓ ${skill}`);
}

console.log(`\nInstalled to ${SKILLS_DIR}`);
console.log('Restart Claude Code, then run /forge-init in your module repo.');

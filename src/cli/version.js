import { existsSync, readJsonSync } from 'fs-extra';
import { execSync } from 'child_process';
import { join } from 'path';
import isEmpty from 'lodash/isEmpty';

export function match(args) {
  let out = (args.v || args.version);
  return out;
};

export let summary = '--version | -v - print the version';

export function run(log = console.log) {
  let pkg = readJsonSync(join(__dirname, '..', '..', 'package.json'));
  let projectRoot = join(__dirname, '../..');
  let gitDir = join(projectRoot, '.git');
  let gitSha = '';
  if (existsSync(gitDir)) {
    gitSha = execSync(`git --git-dir=${gitDir} --work-tree=${projectRoot} rev-parse --short HEAD`, { encoding: 'utf8' });
    gitSha = gitSha.trim();
  }
  let message = `version: ${pkg.version}`;
  message += isEmpty(gitSha) ? '' : `, git-sha: ${gitSha}`;
  log(message); 
  process.exit(0);
};

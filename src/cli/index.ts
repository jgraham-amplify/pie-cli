import * as _ from 'lodash';
import { Help } from './help';
import version from './version';
import pack from './pack';
import clean from './clean';
import serve from './serve';
import manifest from './manifest';
import { normalizeOpts } from './helper';

import CliCommand from './cli-command';
let commands: CliCommand[] = [
  version,
  pack,
  clean,
  serve,
  manifest
];

export default function (opts) {

  opts = normalizeOpts(opts);

  let help: CliCommand = new Help('pie', commands);

  let cmd: CliCommand = _.find(([help]).concat(commands), (cmd) => {
    return cmd.match(opts);
  }) || help;

  let result = cmd.run(opts);

  (result || Promise.resolve('done!'))
    .then((result) => {
      if (result) {
        console.log(result);
      }
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    })
};
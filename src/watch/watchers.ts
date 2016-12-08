import { buildLogger } from '../log-factory';
import * as chokidar from 'chokidar';
import { relative, resolve, join } from 'path';
import * as _ from 'lodash';
import * as fs from 'fs-extra';

const logger = buildLogger();

interface Roots {
  srcRoot: string;
  targetRoot: string;
}

export interface Watch {
  start: () => void;
}

export class BaseWatch implements Roots, Watch {

  private _watcher;
  constructor(private ignores) { }
  public srcRoot: string;
  public targetRoot: string;
  getDestination(path) {
    let relativePath = relative(this.srcRoot, path);
    let destination = join(this.targetRoot, relativePath);
    logger.silly(`[BaseWatch] [getDestination], path: ${path}, relativePath: ${relativePath}, destination: ${destination}`);
    return destination;
  }

  start(): void {

    logger.debug('[BaseWatch] [start] srcRoot: ', this.srcRoot);

    this._watcher = chokidar.watch(this.srcRoot, {
      ignored: _.concat(this.ignores, [
        /package\.json/,
        /[\/\\]\./,
        /.*node_modules.*/,
        /\.git.*/,
        /.*docs.*/,
        /.*\.d\.ts/,
        /typings/,
        /jsconfig\.json/
      ]),
      ignoreInitial: true,
      persistent: true
    });

    let onAdd = (path) => {
      logger.debug(`File added: ${path} - copy`);
      fs.copy(path, this.getDestination(path));
    };

    //TODO: Add file size change detection to prevent unnecessary updates
    let onChange = (path) => {
      logger.debug(`File changed: ${path} - copy`);
      fs.copy(path, this.getDestination(path));
    }

    let onUnlink = (path) => {
      logger.debug(`File unlinked: ${path} - delete`);
      fs.remove(this.getDestination(path));
    }

    let onError = (e) => logger.error(e);
    let onReady = () => {
      logger.info(`Watcher for ${this.srcRoot} - Ready`);
      logger.silly('watched: \n', this._watcher.getWatched());
    }

    this._watcher
      .on('add', onAdd)
      .on('change', onChange)
      .on('unlink', onUnlink)
      .on('error', onError)
      .on('ready', onReady);
  }
}


export class PackageWatch extends BaseWatch {
  constructor(private name: string, private relativePath: string, readonly rootDir: string, ignore: (string | RegExp)[] = []) {
    super(ignore);
  }

  get srcRoot() {
    return resolve(this.rootDir, this.relativePath);
  }

  get targetRoot() {
    return resolve(join(this.rootDir, 'node_modules', this.name));
  }
}


export class PieControllerWatch extends BaseWatch {

  constructor(private name, private relativePath, private rootDir) {
    super([]);
  }

  get srcRoot() {
    return resolve(join(this.rootDir, this.relativePath, 'controller'));
  }

  get targetRoot() {
    return resolve(join(this.rootDir, 'controllers', 'node_modules', `${this.name}-controller`));
  }
}

export class PieWatch {

  private client;
  private controller;

  constructor(name, relativePath, rootDir) {
    logger.debug('[PieWatch] constructor: ', name, relativePath, rootDir);
    this.client = new PackageWatch(name, relativePath, rootDir, [/.*controller.*/]);
    this.controller = new PieControllerWatch(name, relativePath, rootDir);
  }

  start() {
    this.client.start();
    this.controller.start();
  }
}

export class FileWatch implements Watch {
  private _watch;
  constructor(readonly filepath, readonly onChange: (string) => void) {
  }

  start() {
    logger.silly('[FileWatch] filepath: ', this.filepath);

    this._watch = chokidar.watch(this.filepath, { ignoreInitial: true });
    this._watch.on('change', () => {
      this.onChange(this.filepath);
    });

    this._watch.on('ready', () => {
      logger.silly('[FileWatch] ready for path: ', this.filepath);
    });
  }
}
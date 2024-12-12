import { spawn as cpSpawn, SpawnOptions } from 'child_process';
import debug from 'debug';
import { isSecret } from './helpers';

const d = debug('electron-notarize:spawn');

export interface SpawnResult {
  code: number | null;
  output: string;
}

export const spawn = (
  cmd: string,
  args: string[] = [],
  opts: SpawnOptions = {},
): Promise<SpawnResult> => {
  d(
    'spawning cmd:',
    cmd,
    'args:',
    args.map((arg) => (isSecret(arg) ? '*********' : arg)),
    'opts:',
    opts,
  );
  const child = cpSpawn(cmd, args, opts);
  const out: string[] = [];
  const dataHandler = (data: Buffer) => out.push(data.toString());
  child.stdout!.on('data', dataHandler);
  child.stderr!.on('data', dataHandler);
  return new Promise<SpawnResult>((resolve, reject) => {
    child.on('error', (err) => {
      reject(err);
    });
    child.on('exit', (code) => {
      d(`cmd ${cmd} terminated with code: ${code}`);
      resolve({
        code,
        output: out.join(''),
      });
    });
  });
};

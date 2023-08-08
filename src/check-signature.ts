import * as path from 'path';

import { spawn } from './spawn';
import type { NotarizeStapleOptions } from './types';
import debug from 'debug';
const d = debug('electron-notarize');

const spctl = async (opts: NotarizeStapleOptions) => {
  d('attempting to spctl asses app:', opts.appPath);
  const result = await spawn('spctl', ['-vvv', '--assess', path.basename(opts.appPath)], {
    cwd: path.dirname(opts.appPath),
  });

  return result;
};

const codesign = async (opts: NotarizeStapleOptions) => {
  d('attempting to check codesign of app:', opts.appPath);
  const result = await spawn(
    'codesign',
    ['-vvv', '--deep', '--strict', path.basename(opts.appPath)],
    {
      cwd: path.dirname(opts.appPath),
    },
  );

  return result;
};
export async function checkSignatures(opts: NotarizeStapleOptions): Promise<void> {
  const codesignResult = await codesign(opts);
  const spctlResult = await spctl(opts);

  let error = '';

  if (spctlResult.code !== 0) {
    d('spctl asses failed');
    error = `Failed to spctl asses your application with code: ${spctlResult.code}\n\n${spctlResult.output}\n`;
  }
  if (codesignResult.code !== 0) {
    d('codesign check failed');
    error += `Failed to codesign your application with code: ${codesignResult.code}\n\n${codesignResult.output}`;
  }

  if (error) {
    throw new Error(error);
  }
  d('codesign and spctl asses succeeded');
}

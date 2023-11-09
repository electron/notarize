import * as path from 'path';

import { spawn } from './spawn';
import { NotarizeStapleOptions } from './types';
import debug from 'debug';
const d = debug('electron-notarize');

const codesignDisplay = async (opts: NotarizeStapleOptions) => {
  const result = await spawn('codesign', ['-dv', '-vvvv', '--deep', path.basename(opts.appPath)], {
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
  const codesignInfo = await codesignDisplay(opts);

  let error = '';

  if (codesignInfo.code !== 0) {
    d('codesignInfo failed');
    error = `Failed to display codesign info on your application with code: ${codesignInfo.code}\n\n${codesignInfo.output}\n`;
  }
  if (codesignResult.code !== 0) {
    d('codesign check failed');
    error += `Failed to codesign your application with code: ${codesignResult.code}\n\n${codesignResult.output}\n\n${codesignInfo.output}`;
  }

  if (error) {
    throw new Error(error);
  }
  d('codesign assess succeeded');
}

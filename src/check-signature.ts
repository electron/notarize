import * as path from 'path';

import { spawn } from './spawn.js';
import { NotaryToolNotarizeAppOptions } from './types.js';
import debug from 'debug';
const d = debug('electron-notarize');

const codesignDisplay = async (opts: NotaryToolNotarizeAppOptions) => {
  const result = await spawn('codesign', ['-dv', '-vvvv', '--deep', path.basename(opts.appPath)], {
    cwd: path.dirname(opts.appPath),
  });
  return result;
};

const codesign = async (opts: NotaryToolNotarizeAppOptions) => {
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
export async function checkSignatures(opts: NotaryToolNotarizeAppOptions): Promise<void> {
  const fileExt = path.extname(opts.appPath);
  if (fileExt === '.dmg' || fileExt === '.pkg') {
    d('skipping codesign check for dmg or pkg file');
    return;
  }
  const [codesignResult, codesignInfo] = await Promise.all([codesign(opts), codesignDisplay(opts)]);
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

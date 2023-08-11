import debug from 'debug';
import fs from 'fs/promises';
import os from 'os';
import path from 'path';

const d = debug('electron-notarize:helpers');

export async function withTempDir<T>(fn: (dir: string) => Promise<T>) {
  const dir = await fs.mkdtemp(path.resolve(os.tmpdir(), 'electron-notarize-'));
  d('doing work inside temp dir:', dir);
  let result: T;
  try {
    result = await fn(dir);
  } catch (err) {
    d('work failed');
    await fs.rm(dir, { recursive: true, force: true });
    throw err;
  }
  d('work succeeded');
  await fs.rm(dir, { recursive: true, force: true });
  return result;
}

class Secret {
  constructor(private value: string) {}

  toString() {
    return this.value;
  }
  inspect() {
    return '******';
  }
}

export function makeSecret(s: string) {
  return new Secret(s) as any as string;
}

export function isSecret(s: string) {
  return (s as any) instanceof Secret;
}

export interface NotarizationInfo {
  uuid: string;
  date: Date;
  status: 'invalid' | 'in progress' | 'success';
  logFileUrl: string | null;
  // Only set when status != 'in progress'
  statusCode?: 0 | 2;
  statusMessage?: string;
}

export function parseNotarizationInfo(info: string): NotarizationInfo {
  const out = {} as any;
  const matchToProperty = <K extends keyof NotarizationInfo>(
    key: K,
    r: RegExp,
    modifier?: (s: string) => NotarizationInfo[K],
  ) => {
    const exec = r.exec(info);
    if (exec) {
      out[key] = modifier ? modifier(exec[1]) : exec[1];
    }
  };
  matchToProperty('uuid', /\n *RequestUUID: (.+?)\n/);
  matchToProperty('date', /\n *Date: (.+?)\n/, (d) => new Date(d));
  matchToProperty('status', /\n *Status: (.+?)\n/);
  matchToProperty('logFileUrl', /\n *LogFileURL: (.+?)\n/);
  matchToProperty('statusCode', /\n *Status Code: (.+?)\n/, (n) => parseInt(n, 10) as any);
  matchToProperty('statusMessage', /\n *Status Message: (.+?)\n/);

  if (out.logFileUrl === '(null)') {
    out.logFileUrl = null;
  }

  return out;
}

export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { describe, expect, it } from 'vitest';
import { parseNotarizationInfo, withTempDir } from '../src/helpers';

describe('helpers', () => {
  describe('parseNotarizationInfo', () => {
    it('build a NotarizationInfo object', () => {
      const output = `
RequestUUID: 123
Date: 2020-01-01
Status: unknown
      `;
      expect(parseNotarizationInfo(output)).toEqual({
        date: new Date('2020-01-01'),
        status: 'unknown',
        uuid: '123',
      });
    });
  });

  describe('withTempDir', async () => {
    it('creates a temporary directory and cleans it up afterwards', async () => {
      let tmp: string | undefined;
      await withTempDir(async (dir) => {
        tmp = dir;
      });
      expect(tmp).toBeDefined();
      expect(tmp).toContain(path.join(os.tmpdir(), 'electron-notarize-'));
      expect(fs.existsSync(tmp!)).toBe(false);
    });
  });
});

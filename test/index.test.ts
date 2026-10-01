import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../src/check-signature.js', () => ({
  checkSignatures: vi.fn().mockResolvedValue(undefined),
}));
vi.mock('../src/notarytool.js', () => ({
  isNotaryToolAvailable: vi.fn().mockResolvedValue(true),
  notarizeAndWaitForNotaryTool: vi.fn().mockResolvedValue(undefined),
}));
vi.mock('../src/staple.js', () => ({
  stapleApp: vi.fn(),
}));

import { notarize } from '../src/index.js';
import { notarizeAndWaitForNotaryTool } from '../src/notarytool.js';
import { stapleApp } from '../src/staple.js';

const options = {
  appPath: '/tmp/Test.app',
  keychainProfile: 'test',
};

describe('notarize', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    vi.mocked(stapleApp).mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('recovers on the fourth stapling attempt without submitting again', async () => {
    const error = new Error('stapling temporarily unavailable');
    vi.mocked(stapleApp)
      .mockRejectedValueOnce(error)
      .mockRejectedValueOnce(error)
      .mockRejectedValueOnce(error)
      .mockResolvedValueOnce(undefined);

    await Promise.all([expect(notarize(options)).resolves.toBeUndefined(), vi.runAllTimersAsync()]);
    expect(stapleApp).toHaveBeenCalledTimes(4);
    expect(notarizeAndWaitForNotaryTool).toHaveBeenCalledTimes(1);
  });

  it('rejects after three retries without submitting again', async () => {
    const error = new Error('stapling failed');
    vi.mocked(stapleApp).mockRejectedValue(error);

    await Promise.all([expect(notarize(options)).rejects.toBe(error), vi.runAllTimersAsync()]);
    expect(stapleApp).toHaveBeenCalledTimes(4);
    expect(notarizeAndWaitForNotaryTool).toHaveBeenCalledTimes(1);
  });
});

import { describe, expect, it } from 'vitest';
import { parseNotarytoolOutput } from '../src/notarytool.js';

describe('parseNotarytoolOutput', () => {
  it('parses valid JSON output', () => {
    const output = '{"status": "Accepted", "id": "123"}';
    expect(parseNotarytoolOutput(output)).toEqual({
      status: 'Accepted',
      id: '123',
    });
  });

  it('parses JSON with whitespace', () => {
    const output = '\n\n  {"status": "Accepted", "id": "456"}  \n';
    expect(parseNotarytoolOutput(output)).toEqual({
      status: 'Accepted',
      id: '456',
    });
  });

  it('parses JSON with warnings before it', () => {
    const output = 'Warning: Some warning message\n{"status": "Accepted", "id": "789"}';
    expect(parseNotarytoolOutput(output)).toEqual({
      status: 'Accepted',
      id: '789',
    });
  });

  it('parses JSON with warnings after it', () => {
    const output = '{"status": "Accepted", "id": "abc"}\nWarning: Some warning message';
    expect(parseNotarytoolOutput(output)).toEqual({
      status: 'Accepted',
      id: 'abc',
    });
  });

  it('parses JSON with warnings before and after it', () => {
    const output =
      'Warning: First warning\n{"status": "Invalid", "id": "def"}\nWarning: Second warning';
    expect(parseNotarytoolOutput(output)).toEqual({
      status: 'Invalid',
      id: 'def',
    });
  });

  it('throws error for invalid JSON', () => {
    const output = 'not json at all';
    expect(() => parseNotarytoolOutput(output)).toThrow(
      'Could not parse notarytool output: \n\nnot json at all',
    );
  });

  it('throws error for incomplete JSON', () => {
    const output = '{"status": "Accepted"';
    expect(() => parseNotarytoolOutput(output)).toThrow('Could not parse notarytool output');
  });

  it('parses nested JSON objects', () => {
    const output = '{"status": "Accepted", "data": {"nested": "value"}}';
    expect(parseNotarytoolOutput(output)).toEqual({
      status: 'Accepted',
      data: { nested: 'value' },
    });
  });
});

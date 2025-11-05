import { describe, expect, it } from 'vitest';

describe('parseNotarytoolOutput', () => {
  const parseNotarytoolOutput = (output: string): any => {
    const rawOut = output.trim();

    const jsonOut = rawOut.substring(rawOut.indexOf('{'), rawOut.lastIndexOf('}') + 1);
    const nonJsonLines = rawOut
      .split('\n')
      .filter((line) => !line.trim().startsWith('{') && !line.trim().endsWith('}'));
    if (nonJsonLines.length > 0) {
      console.debug('notarytool produced some non-JSON output:\n', nonJsonLines.join('\n'));
    }

    let parsed: any;
    try {
      parsed = JSON.parse(jsonOut);
    } catch (err) {
      throw new Error(`Could not parse notarytool output: \n\n${rawOut}`);
    }

    return parsed;
  };

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

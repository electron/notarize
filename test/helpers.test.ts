import { parseNotarizationInfo } from '../src/helpers';

describe('helpers', () => {
  describe('parseNotarizationInfo', () => {
    test('build a NotarizationInfo object', () => {
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
});

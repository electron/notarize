import {
  LegacyNotarizeApiKeyCredentials,
  LegacyNotarizeCredentials,
  LegacyNotarizePasswordCredentials,
} from '../src/types';
import { validateLegacyAuthorizationArgs } from '../src/validate-args';

describe('index', () => {
  describe('validateLegacyAuthorizationArgs', () => {
    test('password credentials provided', () => {
      const opts = {
        'appleId': 'fakeId',
        'appleIdPassword': 'fakePassword',
      } as LegacyNotarizePasswordCredentials;
      expect(validateLegacyAuthorizationArgs(opts)).toEqual(opts);
    });

    test('API key credentials provided', () => {
      const opts = {
        'appleApiKey': 'fakeApiKey',
        'appleApiIssuer': 'fakeApiIssuer',
      } as LegacyNotarizeApiKeyCredentials;
      expect(validateLegacyAuthorizationArgs(opts)).toEqual(opts);
    });

    test('credentials are required', () => {
      const opts = {} as LegacyNotarizeCredentials;
      expect(() => validateLegacyAuthorizationArgs(opts))
        .toThrowError(new Error('No authentication properties provided (e.g. appleId, appleApiKey)'));
    });

    test('only one kind of credentials', () => {
      const opts = {
        'appleId': 'fakeId',
        'appleApiKey': 'fakeApiKey',
      } as any;
      expect(() => validateLegacyAuthorizationArgs(opts))
        .toThrowError(new Error('Cannot use both password credentials and API key credentials at once'));
    });

    test('missing appleId', () => {
      const opts = {
        'appleIdPassword': 'fakePassword',
      } as any;
      expect(() => validateLegacyAuthorizationArgs(opts))
        .toThrowError(new Error('The appleId property is required when using notarization with appleIdPassword'));
    });

    test('missing appleIdPassword', () => {
      const opts = {
        'appleId': 'fakeId',
      } as any;
      expect(() => validateLegacyAuthorizationArgs(opts))
        .toThrowError(new Error('The appleIdPassword property is required when using notarization with appleId'));
    });

    test('missing appleApiKey', () => {
      const opts = {
        'appleApiIssuer': 'fakeApiIssuer',
      } as any;
      expect(() => validateLegacyAuthorizationArgs(opts))
        .toThrowError(new Error('The appleApiKey property is required when using notarization with appleApiIssuer'));
    });

    test('missing appleApiIssuer', () => {
      const opts = {
        'appleApiKey': 'fakeApiKey',
      } as any;
      expect(() => validateLegacyAuthorizationArgs(opts))
        .toThrowError(new Error('The appleApiIssuer property is required when using notarization with appleApiKey'));
    });
  });
});

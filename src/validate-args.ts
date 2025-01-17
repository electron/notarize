import {
  NotaryToolApiKeyCredentials,
  NotaryToolCredentials,
  NotaryToolKeychainCredentials,
  NotaryToolPasswordCredentials,
} from './types';

export function isNotaryToolPasswordCredentials(
  opts: NotaryToolCredentials,
): opts is NotaryToolPasswordCredentials {
  const creds = opts as NotaryToolPasswordCredentials;
  return (
    creds.appleId !== undefined || creds.appleIdPassword !== undefined || creds.teamId !== undefined
  );
}

export function isNotaryToolApiKeyCredentials(
  opts: NotaryToolCredentials,
): opts is NotaryToolApiKeyCredentials {
  const creds = opts as NotaryToolApiKeyCredentials;
  return (
    creds.appleApiIssuer !== undefined ||
    creds.appleApiKey !== undefined ||
    creds.appleApiKeyId !== undefined
  );
}

export function isNotaryToolKeychainCredentials(
  opts: NotaryToolCredentials,
): opts is NotaryToolKeychainCredentials {
  const creds = opts as NotaryToolKeychainCredentials;
  return creds.keychain !== undefined || creds.keychainProfile !== undefined;
}

/**
 * @internal
 */
export function validateNotaryToolAuthorizationArgs(
  opts: NotaryToolCredentials,
): NotaryToolCredentials {
  const isPassword = isNotaryToolPasswordCredentials(opts);
  const isApiKey = isNotaryToolApiKeyCredentials(opts);
  const isKeychain = isNotaryToolKeychainCredentials(opts);
  if ((isPassword ? 1 : 0) + (isApiKey ? 1 : 0) + (isKeychain ? 1 : 0) > 1) {
    throw new Error(
      'Cannot use password credentials, API key credentials and keychain credentials at once',
    );
  }
  if (isPassword) {
    const passwordCreds = opts as NotaryToolPasswordCredentials;
    if (!passwordCreds.appleId) {
      throw new Error(
        'The appleId property is required when using notarization with password credentials',
      );
    } else if (!passwordCreds.appleIdPassword) {
      throw new Error(
        'The appleIdPassword property is required when using notarization with password credentials',
      );
    } else if (!passwordCreds.teamId) {
      throw new Error(
        'The teamId property is required when using notarization with password credentials',
      );
    }
    return passwordCreds;
  }
  if (isApiKey) {
    const apiKeyCreds = opts as NotaryToolApiKeyCredentials;
    if (!apiKeyCreds.appleApiKey) {
      throw new Error(
        'The appleApiKey property is required when using notarization with ASC credentials',
      );
    } else if (!apiKeyCreds.appleApiIssuer) {
      throw new Error(
        'The appleApiIssuer property is required when using notarization with ASC credentials',
      );
    } else if (!apiKeyCreds.appleApiKeyId) {
      throw new Error(
        'The appleApiKeyId property is required when using notarization with ASC credentials',
      );
    }
    return apiKeyCreds;
  }
  if (isKeychain) {
    const keychainCreds = opts as NotaryToolKeychainCredentials;
    if (!keychainCreds.keychainProfile) {
      throw new Error(
        'The keychainProfile property is required when using notarization with keychain credentials',
      );
    }
    return keychainCreds;
  }
  throw new Error('No authentication properties provided (e.g. appleId, appleApiKey, keychain)');
}

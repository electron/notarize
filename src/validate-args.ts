import {
  NotarizeApiKeyCredentials,
  NotarizeCredentials,
  NotarizePasswordCredentials,
} from './index';

export function isPasswordCredentials(
  opts: NotarizeCredentials,
): opts is NotarizePasswordCredentials {
  const creds = opts as NotarizePasswordCredentials;
  return creds.appleId !== undefined || creds.appleIdPassword !== undefined;
}

export function isApiKeyCredentials(opts: NotarizeCredentials): opts is NotarizeApiKeyCredentials {
  const creds = opts as NotarizeApiKeyCredentials;
  return creds.appleApiKey !== undefined || creds.appleApiIssuer !== undefined;
}

export function validateAuthorizationArgs(opts: NotarizeCredentials): NotarizeCredentials {
  const isPassword = isPasswordCredentials(opts);
  const isApiKey = isApiKeyCredentials(opts);
  if (isPassword && isApiKey) {
    throw new Error('Cannot use both password credentials and API key credentials at once');
  }
  if (isPassword) {
    const passwordCreds = opts as NotarizePasswordCredentials;
    if (!passwordCreds.appleId) {
      throw new Error(
        'The appleId property is required when using notarization with appleIdPassword',
      );
    } else if (!passwordCreds.appleIdPassword) {
      throw new Error(
        'The appleIdPassword property is required when using notarization with appleId',
      );
    }
    return passwordCreds;
  }
  if (isApiKey) {
    const apiKeyCreds = opts as NotarizeApiKeyCredentials;
    if (!apiKeyCreds.appleApiKey) {
      throw new Error(
        'The appleApiKey property is required when using notarization with appleApiIssuer',
      );
    } else if (!apiKeyCreds.appleApiIssuer) {
      throw new Error(
        'The appleApiIssuer property is required when using notarization with appleApiKey',
      );
    }
    return apiKeyCreds;
  }
  throw new Error('No authentication properties provided (e.g. appleId, appleApiKey)');
}

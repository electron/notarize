/** @deprecated */
export interface LegacyNotarizePasswordCredentials {
  appleId: string;
  appleIdPassword: string;
}

export interface NotaryToolPasswordCredentials {
  appleId: string;
  appleIdPassword: string;
  teamId: string;
}

/** @deprecated */
export interface LegacyNotarizeApiKeyCredentials {
  appleApiKey: string;
  appleApiIssuer: string;
}

export interface NotaryToolApiKeyCredentials {
  appleApiKey: string;
  appleApiKeyId: string;
  appleApiIssuer: string;
}

export interface NotaryToolKeychainCredentials {
  keychainProfile: string;
  keychain?: string;
}

/** @deprecated */
export type LegacyNotarizeCredentials =
  | LegacyNotarizePasswordCredentials
  | LegacyNotarizeApiKeyCredentials;
export type NotaryToolCredentials =
  | NotaryToolPasswordCredentials
  | NotaryToolApiKeyCredentials
  | NotaryToolKeychainCredentials;
export type NotarizeCredentials = LegacyNotarizeCredentials | NotaryToolCredentials;

/** @deprecated */
export interface LegacyNotarizeAppOptions {
  appPath: string;
  appBundleId: string;
}

export interface NotaryToolNotarizeAppOptions {
  appPath: string;
}

export interface NotaryToolOptions {
  notarytoolPath?: string;
}

export interface TransporterOptions {
  ascProvider?: string;
}

export interface NotarizeResult {
  uuid: string;
}

/** @deprecated */
export type LegacyNotarizeStartOptions = LegacyNotarizeAppOptions &
  LegacyNotarizeCredentials &
  TransporterOptions;
export type NotaryToolStartOptions = NotaryToolNotarizeAppOptions &
  NotaryToolOptions &
  NotaryToolCredentials;
/** @deprecated */
export type LegacyNotarizeWaitOptions = NotarizeResult & LegacyNotarizeCredentials;
export type NotarizeStapleOptions = Pick<LegacyNotarizeAppOptions, 'appPath'>;

/** @deprecated */
export type NotarizeOptionsLegacy = { tool: 'legacy' } & LegacyNotarizeStartOptions;
export type NotarizeOptionsNotaryTool = { tool?: 'notarytool' } & NotaryToolStartOptions;
export type NotarizeOptions = NotarizeOptionsLegacy | NotarizeOptionsNotaryTool;

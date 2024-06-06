/**
 * @deprecated This interface was used for Apple's `altool`, which was sunset in 2023 and no longer works.
 * @category Legacy
 */
export interface LegacyNotarizePasswordCredentials {
  appleId: string;
  appleIdPassword: string;
}

/**
 * You can generate an [app-specific password](https://support.apple.com/en-us/102654) for your Apple ID
 * to notarize your Electron applications.
 *
 * This method also requires you to specify the [Team ID](https://developer.apple.com/help/account/manage-your-team/locate-your-team-id/)
 * of the Developer Team you want to notarize under. An Apple ID may be part of multiple Teams.
 *
 * @category Credential Strategies
 */
export interface NotaryToolPasswordCredentials {
  /**
   * The login username of your Apple Developer account.
   */
  appleId: string;
  /**
   * An [app-specific password](https://support.apple.com/en-us/102654) for your
   * Apple ID (**not** your Apple ID password).
   *
   * Do **not** hard code this password into your packaging scripts.
   */
  appleIdPassword: string;
  /**
   * The [Team ID](https://developer.apple.com/help/account/manage-your-team/locate-your-team-id/)
   * for the Developer Team you want to notarize under. Your Apple ID may be a member of multiple
   * teams.
   */
  teamId: string;
}

/**
 * @deprecated This interface was used for Apple's `altool`, which was sunset in 2023 and no longer works.
 * @category Legacy
 */
export interface LegacyNotarizeApiKeyCredentials {
  appleApiKey: string;
  appleApiIssuer: string;
}

/**
 * Credentials required for JSON Web Token (JWT) notarization using App Store Connect API keys.
 *
 * @category Credential Strategies
 */
export interface NotaryToolApiKeyCredentials {
  /**
   * File system path to the `.p8` private key of your App Store Connect API key.
   */
  appleApiKey: string;
  /**
   * App Store Connect API Key ID (e.g. `T9GPZ92M7K`).
   *
   */
  appleApiKeyId: string;
  /**
   * App Store Connect API Issuer ID. The issuer ID is a UUID format string
   * (e.g. `c055ca8c-e5a8-4836-b61d-aa5794eeb3f4`).
   */
  appleApiIssuer: string;
}

/**
 * Options required for authenticating notarytool by storing
 * credentials inside the system Keychain item.
 *
 * You can store {@link NotaryToolPasswordCredentials} or
 * {@link NotaryToolApiKeyCredentials} into the Keychain
 * using `xcrun notarytool store-credentials` and access the
 * stored secrets when signing your code.
 *
 * @category Credential Strategies
 */
export interface NotaryToolKeychainCredentials {
  /**
   * The name of the profile you provided when storing notarization credentials.
   */
  keychainProfile: string;
  /**
   * The name of the keychain or path to the keychain you stored notarization credentials in.
   * @defaultValue If omitted, the system default `login` keychain will be used.
   */
  keychain?: string;
}

/**
 * @deprecated This interface was used for Apple's `altool`, which was sunset in 2023 and no longer works.
 * @category Legacy
 */
export type LegacyNotarizeCredentials =
  | LegacyNotarizePasswordCredentials
  | LegacyNotarizeApiKeyCredentials;

/**
 * Credential options for authenticating `notarytool`. There are three valid stategies available:
 * 
 * - {@link NotaryToolPasswordCredentials} — Using an Apple ID and app-specific password
 * - {@link NotaryToolApiKeyCredentials} — Using an App Store Connect API key
 * - {@link NotaryToolKeychainCredentials} — Using one of the two above credential sets stored within the macOS Keychain
 * @category Credential Strategies
 */
export type NotaryToolCredentials =
  | NotaryToolPasswordCredentials
  | NotaryToolApiKeyCredentials
  | NotaryToolKeychainCredentials;

/**
 * @deprecated This interface was used for Apple's `altool`, which was sunset in 2023 and no longer works.
 * @category Legacy
 */
export interface LegacyNotarizeAppOptions {
  appPath: string;
  appBundleId: string;
}

/**
 * Non-credential options for notarizing your application with `notarytool`.
 * @category Core
 */
export interface NotaryToolNotarizeAppOptions {
  /**
   * Absolute path to your packaged and codesigned Electron application.
   */
  appPath: string;
}

/**
 * @deprecated This interface was used for Apple's `altool`, which was sunset in 2023 and no longer works.
 * @category Legacy
 */
interface TransporterOptions {
  ascProvider?: string;
}

/**
 * @deprecated This interface was used for Apple's `altool`, which was sunset in 2023 and no longer works.
 * @category Legacy
 */
interface NotarizeResult {
  uuid: string;
}

/**
 * @deprecated This type was used for Apple's `altool`, which was sunset in 2023 and no longer works.
 * @category Legacy
 */
export type LegacyNotarizeStartOptions = LegacyNotarizeAppOptions &
  LegacyNotarizeCredentials &
  TransporterOptions;

/**
 * @deprecated This type was used for Apple's `altool`, which was sunset in 2023 and no longer works.
 * @category Legacy
 */
export type LegacyNotarizeWaitOptions = NotarizeResult & LegacyNotarizeCredentials;

/**
 * @deprecated This type was used for Apple's `altool`, which was sunset in 2023 and no longer works.
 * @category Legacy
 */
export type NotarizeOptionsLegacy = { tool: 'legacy' } & LegacyNotarizeStartOptions;

/**
 * Options for notarizing your Electron app with `notarytool`.
 * @category Core
 */
export type NotaryToolStartOptions = NotaryToolNotarizeAppOptions & NotaryToolCredentials;

/**
 * Helper type that specifies that `@electron/notarize` is using the `notarytool` strategy.
 * @category Utility Types
 */
export type NotarizeOptionsNotaryTool = { tool?: 'notarytool' } & NotaryToolStartOptions;

/**
 * Options accepted by the `notarize` method.
 * @internal
 */
export type NotarizeOptions = NotarizeOptionsLegacy | NotarizeOptionsNotaryTool;

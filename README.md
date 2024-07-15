Electron Notarize
-----------

> Notarize your Electron apps seamlessly for macOS

[![CircleCI status](https://circleci.com/gh/electron/notarize.svg?style=shield)](https://circleci.com/gh/electron/notarize)
[![NPM package](https://img.shields.io/npm/v/@electron/notarize)](https://npm.im/@electron/notarize)

## Installation

```bash
npm install @electron/notarize --save-dev
```

## What is app "notarization"?

From Apple's docs in XCode:

> A notarized app is a macOS app that was uploaded to Apple for processing before it was distributed.
> When you export a notarized app from Xcode, it code signs the app with a Developer ID certificate
> and staples a ticket from Apple to the app. The ticket confirms that you previously uploaded the app to Apple.

> On macOS 10.14 and later, the user can launch notarized apps when Gatekeeper is enabled.
> When the user first launches a notarized app, Gatekeeper looks for the app’s ticket online.
> If the user is offline, Gatekeeper looks for the ticket that was stapled to the app.

As macOS 10.15 (Catalina), Apple has made notarization a hard requirement for all applications
distributed outside of the Mac App Store. App Store applications do not need to be notarized.

## Prerequisites

For notarization, you need the following things:

1. Xcode 13 or later installed on your Mac.
1. An [Apple Developer](https://developer.apple.com/) account.
1. [An app-specific password for your ADC account’s Apple ID](https://support.apple.com/HT204397).
1. Your app may need to be signed with `hardenedRuntime: true` option, with the `com.apple.security.cs.allow-jit` entitlement.

> [!NOTE]
> If you are using Electron 11 or below, you must add the `com.apple.security.cs.allow-unsigned-executable-memory` entitlement too.
> When using version 12+, this entitlement should not be applied as it increases your app's attack surface.

### Notarization on older macOS versions

Xcode 13 is available from macOS 11.3, but notarization can be performed on systems down to macOS 10.15
(see [TN3147](https://developer.apple.com/documentation/technotes/tn3147-migrating-to-the-latest-notarization-tool#Enable-notarization-on-an-older-version-of-macOS) for more information).

To achieve this, you can copy notarytool binary from a newer macOS version and provide its path as `notarytoolPath` option.

## API

`@electron/notarize` exposes a single `notarize` function that accepts the following parameters:
* `appPath` — the absolute path to your codesigned and packaged Electron application.
* `notarytoolPath` - String (optional) - Path of the notarytool binary ([more details](#notarization-on-older-macos-versions)) 
* additional options required for authenticating your Apple ID (see below)

The method returns a void Promise once app notarization is complete. Please note that notarization may take
many minutes.

If the notarization process is unusually log for your application, see Apple Developer's docs to
[Avoid long notarization response times and size limits](https://developer.apple.com/documentation/security/notarizing_macos_software_before_distribution/customizing_the_notarization_workflow#3561440).

### Usage with app-specific password

You can generate an [app-specific password](https://support.apple.com/en-us/102654) for your Apple ID
to notarize your Electron applications.

This method also requires you to specify the [Team ID](https://developer.apple.com/help/account/manage-your-team/locate-your-team-id/)
of the Developer Team you want to notarize under. An Apple ID may be part of multiple Teams.

```javascript
import { notarize } from '@electron/notarize';

await notarize({
  appPath,
  appleId, // Login name of your Apple Developer account
  appleIdPassword, // App-specific password
  teamId, // Team ID for your developer team
});
```

> [!IMPORTANT]
> **Never hard code your app-specific password into your packaging scripts.** Use an environment
> variable at a minimum.

### Usage with App Store Connect API key

Alternatively, you can also authenticate via JSON Web Token (JWT) with App Store Connect.

You can obtain an API key from [App Store Connect](https://appstoreconnect.apple.com/access/integrations/api).
Create a **Team Key** (not an _Individual Key_) with **App Manager** access.

Note down the Issuer ID (UUID format) and Key ID (10-character alphanumeric string),
and download the `.p8` API key file (`AuthKey_<appleApiKeyId>.p8`).
For security purposes, the private key can only be downloaded once.

Provide the absolute path to your API key as the `appleApiKey` argument.

```javascript
import { notarize } from '@electron/notarize';

await notarize({
  appPath,
  appleApiKey, // Absolute path to API key (e.g. `/path/to/AuthKey_X0X0X0X0X0.p8`)
  appleApiIssuer, // Issuer ID (e.g. `d5631714-a680-4b4b-8156-b4ed624c0845`)
});
```

### Usage with Keychain credentials

As an alternative to passing authentication options, you can also store your authentication
credentials (for both API key and app-specific password strategies) in the macOS Keychain
via the `xcrun notarytool` command-line utility.

This method has the advantage of validating your notarization credentials before submitting
your application for notarization.

For example:

```sh
# App-specific password strategy
xcrun notarytool store-credentials "my-app-password-profile"
  --apple-id "<AppleID>"
  --team-id <DeveloperTeamID>
  --password <app_specific_password>
```

```sh
# App Store Connect API key strategy
xcrun notarytool store-credentials "my-api-key-profile"
  --key "<PathToAPIKey>"
  --key-id <KeyID>
  --issuer <IssuerID>
```

Successful storage of your credentials will look like this:

```
This process stores your credentials securely in the Keychain. You reference these credentials later using a profile name.

Validating your credentials...
Success. Credentials validated.
Credentials saved to Keychain.
To use them, specify `--keychain-profile "my-api-key-profile"`
```

After successfully storing your credentials, pass the keychain profile name into
the `keychainProfile` parameter.

```javascript
import { notarize } from '@electron/notarize';

await notarize({
  appPath,
  keychainProfile,
});
```
## Troubleshooting

### Debug logging

[`debug`](https://www.npmjs.com/package/debug) is used to display logs and messages.
Run your notarization scripts with the `DEBUG=electron-notarize*` environment variable to log additional
debug information from this module.

### Validating credentials

When notarizing your application, you may run into issues with validating your notarization
credentials.

```
Error: HTTP status code: 401. Invalid credentials. Username or password is incorrect.
Use the app-specific password generated at appleid.apple.com. Ensure that all authentication arguments are correct.
```

[Storing your credentials in Keychain](#usage-with-keychain-credentials) will validate your credentials before
even GitHub.

### Validating app notarization

To validate that notarization worked, you can use the `stapler` command-line utility:

```sh
stapler validate path/to/notarized.app
```

### Apple documentation

Apple also provides additional debugging documentation on
[Resolving common notarization issues](https://developer.apple.com/documentation/security/notarizing_macos_software_before_distribution/resolving_common_notarization_issues).

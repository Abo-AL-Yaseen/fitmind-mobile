# Expo Push Credentials

This project uses Expo push tokens and Laravel sends through the Expo Push API.
Do not commit Firebase service account private key JSON files or Apple private keys.

## Current app IDs

- Android package: `com.anonymous.fitmind`
- iOS bundle identifier: `com.anonymous.fitmind`
- EAS project ID: `eea6f96a-513a-4849-8413-a1752eb13cde`
- Android Firebase config: `google-services.json`

## Manual Android credential setup

1. In Firebase Console, open the Firebase project used by `google-services.json`.
2. Confirm the Android app package is `com.anonymous.fitmind`.
3. Go to Project settings > Service accounts.
4. Generate a new private key for a service account, or use an existing service account with Firebase Messaging API Admin permissions.
5. Keep the downloaded JSON private and outside version control.
6. Run `eas credentials`.
7. Select Android, then the profile/application identifier for `com.anonymous.fitmind`.
8. Manage push notification credentials / Google Service Account for FCM V1.
9. Upload the service account JSON.
10. Build and install a new development build.

## Manual iOS credential setup

1. Use an Apple Developer Program account.
2. Confirm the bundle identifier is `com.anonymous.fitmind`.
3. Run `eas credentials` or let `eas build` prompt for credentials.
4. Select iOS, then manage Apple Push Notifications Key / APNs.
5. Let EAS create or reuse an Apple Push Notifications key.
6. Build and install a new iOS development build on a registered physical device.

Push notifications should be retested only after the relevant FCM/APNs credentials are uploaded to EAS and a fresh build is installed.

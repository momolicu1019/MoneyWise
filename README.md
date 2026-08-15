# MoneyWise

Multi-income financial helper for Android, built with **Expo** and **React Native**.

Salaries, expenses, calendar, breakdown, and savings stay on the device and sync to a hidden Google Drive app-data file after Google sign-in.

Expo apps are React Native (TypeScript), not Python. Python cannot be packaged or deployed through Expo.

## Run locally

```bash
npm install
npx expo start
```

Then open the project in Expo Go, or press `a` for Android.

The app works without Google. Data is stored on the device until you connect a Google account.

## Google Drive sync

1. Create a project in [Google Cloud Console](https://console.cloud.google.com/).
2. Enable the **Google Drive API**.
3. Configure the OAuth consent screen (External is fine for testing).
4. Create OAuth client IDs:
   - **Web application**
   - **Android** with package `com.moneywise.app` and your SHA-1
5. Copy `.env.example` to `.env` and paste the client IDs:

```
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=....apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=....apps.googleusercontent.com
```

6. Restart Expo after changing `.env`.

Google sign-in needs a development or production build (`npx expo run:android` or EAS). Expo Go cannot complete the OAuth redirect for a custom app scheme.

Get a debug SHA-1 after the first native build:

```bash
npx expo run:android
```

On Windows, SHA-1 is also listed in the EAS credentials page after `eas build`.

## Android build (EAS)

```bash
npx eas-cli login
npx eas-cli build --platform android --profile preview
```

That produces an APK you can install on a device. Use `--profile production` for a Play Store app bundle.

## App behavior

- **My Salaries** — add several incomes, each with its own color, pay frequency, and savings target.
- **Expense Calendar** — filter by one salary or all salaries. Tap an expense to edit or delete it.
- **Salary Breakdown** — donut chart of expenses, savings, and remaining for the calendar filter.
- **Savings Progress** — allotted savings for the selected salary (or all salaries).

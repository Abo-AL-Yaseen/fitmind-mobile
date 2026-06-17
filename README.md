# FitMind Mobile App

FitMind Mobile App is the React Native / Expo mobile application for the FitMind gym management and fitness platform. It provides a member-facing fitness experience for signing in, managing a profile, viewing dashboard data, booking sessions, working with workout and nutrition plans, reading gym news, receiving notifications, managing injuries, and chatting with the FitMind AI assistant.

This app is part of the FitMind graduation project.

## Main Features

- Member-only authentication with email/password login.
- Forgot password flow with OTP verification and reset-token based password reset.
- Change password flow for signed-in users.
- Subscription-aware access handling for login and dashboard API errors.
- Member dashboard built from live profile, goal, workout, and nutrition data.
- Profile completion and update flow with age, gender, height, weight, activity level, preferences, food allergies, and medical conditions.
- Injury management for creating, editing, deleting, and marking injuries as recovered.
- Workout plan screen for the latest accepted training plan, grouped by day, with exercise details, video links, instructions, common mistakes, local completion toggles, AI generation requests, and modification requests.
- Nutrition plan screen for the latest active nutrition plan/version, meal groups, calories, protein, carbs, fat, food details, AI generation requests, and modification requests.
- AI assistant chat that sends member questions to the backend AI endpoint and displays answers, warnings, and sources.
- Session booking for available coach sessions, including availability stats, date grouping, booked-state detection, and booking actions.
- My Schedule screen for booked sessions, grouped into upcoming, today, and past sessions, with cancellation support.
- News and offers listing with pagination, featured item display, details modal, publish/expiry metadata, and notification-driven deep linking.
- Notifications screen with unread/read states, mark-as-read, mark-all-as-read, and route handling.
- Expo push notification registration after login and backend push-token saving.
- Feedback and reports for equipment issues, suggestions, and trainer ratings, including create, edit, delete, and coach selection.
- Settings screen for profile edits, fitness goal updates, language selection, local notification toggles, password change, and logout.
- English and Arabic localization with runtime language switching and RTL layout support for Arabic.

## Tech Stack

- React Native 0.81
- Expo SDK 54
- React 19
- TypeScript
- React Navigation, using native stack and bottom tabs
- TanStack React Query for server-state queries, mutations, cache invalidation, and refetching
- Expo SecureStore for auth, reset, and language persistence
- Expo Notifications, Expo Device, and Expo Constants for push notifications
- Expo Dev Client and EAS build profiles
- Lucide React Native and Expo Vector Icons for icons
- Expo Linear Gradient, React Native Safe Area Context, React Native SVG, Gesture Handler, Reanimated, and Screens
- React Native Chart Kit, currently used by the static `ProgressScreen`

Axios is installed in `package.json`, but the inspected API layer currently uses a custom `fetch` wrapper instead of Axios.

## Project Structure

```text
.
|-- App.tsx                     # App providers: React Query, translations, safe area, navigation
|-- app.json                    # Expo app config, plugins, icons, splash, native identifiers
|-- eas.json                    # EAS build profiles
|-- index.ts                    # Expo root registration
|-- assets/                     # App icon, adaptive icon, splash icon, favicon
|-- android/                    # Native Android project generated for Expo run/build workflows
`-- src/
    |-- components/             # Shared UI components such as StatCard, ProgressBar, AITipCard
    |-- constants/              # Theme colors, spacing, radii, font sizes
    |-- data/                   # Static data used by dashboard, feedback, and progress UI
    |-- hooks/                  # React Query hooks grouped by domain
    |-- i18n/                   # Custom translation provider and English/Arabic dictionaries
    |-- navigation/             # Root stack, main tabs, top bar, notification navigation helpers
    |-- screens/                # App screens and feature UI
    |-- services/               # Backend API clients and notification services
    `-- utils/                  # Coach-session date/status formatting helpers
```

There is no separate `src/context` directory in the current codebase. Shared context is provided by `src/i18n/index.tsx` through `TranslationProvider`.

## Navigation Overview

The root navigator starts at `Login` and includes:

- `Login`
- `ForgotPassword`
- `ResetPassword`
- `MainTabs`
- `Assistant`
- `Profile`
- `ManageInjuries`
- `Feedback`
- `Settings`
- `News`
- `Notifications`
- `ChangePassword`

The main bottom tabs are:

- `Dashboard`
- `Sessions`
- `Schedule`
- `Workout`
- `Nutrition`

The mobile top bar provides quick access to:

- Notifications
- News
- Feedback
- Settings

Notification taps can route users to news details, sessions, schedule, workout, nutrition, dashboard, injuries, or settings based on the notification payload.

## API Integration

All backend calls go through `src/services/api.ts`, which defines `apiFetch`. The current base URL is configured as:

```ts
const API_BASE_URL = 'http://127.0.0.1:8000/api';
```

For local development on a physical device, replace `127.0.0.1` with a reachable LAN, tunnel, or development backend URL. For production, configure this value for the deployed Laravel API before building the app.

`apiFetch` automatically:

- prefixes requests with the API base URL
- sends `Accept: application/json` and `Content-Type: application/json`
- reads the bearer token from SecureStore
- attaches `Authorization: Bearer <token>` when a token exists
- normalizes common API error messages through `ApiError`

Safe storage key names used by the app include:

- `fitmind_token`
- `fitmind_role`
- `fitmind_user_id`
- `fitmind_user_name`
- `fitmind_email`
- `fitmind_reset_token`
- `fitmind_reset_email`
- `fitmind_language`

The mobile app communicates with the Laravel backend API for authentication, profile data, goals, dashboard summaries, workout plans, nutrition plans, sessions, news, notifications, feedback, injuries, coaches, and push-token saving.

The AI assistant sends messages to the backend route `/ai/chat`. The mobile app does not call the FastAPI AI service directly; AI traffic is routed through the backend API.

## Backend-Backed Domains

The services under `src/services` cover these API areas:

- Auth: login, logout, forgot password, OTP verification, reset password, change password
- Profile: current member profile create/update/read
- Dashboard: combined profile, goal, workout, and nutrition summary data
- Goals: current user goal lookup and upsert
- Workout: latest accepted workout plan, training-plan generation, training-plan modification
- Nutrition: latest active nutrition plan, foods, versions, generation, modification
- Sessions: available sessions, member bookings, booking, cancellation
- News: public news pagination and item details
- Notifications: list, unread count, read one, read all
- Push tokens: save Expo push token to backend
- Injuries: current member injuries CRUD and recovery status
- Feedback: my feedback CRUD and coach lookup for trainer ratings
- Assistant: backend AI chat

## Notifications

The app uses `expo-notifications` and registers the Expo Notifications plugin in `app.json`.

Implemented behavior:

- Foreground notifications are configured to show alerts, banners, list entries, sound, and badge updates.
- On successful login, the app requests notification permission, gets an Expo push token on physical devices, and posts it to `/save-token`.
- The notification screen reads notifications from `/notifications`.
- Unread count is read from `/notifications/unread-count`.
- Individual notifications can be marked read with `/notifications/{id}/read`.
- All notifications can be marked read with `/notifications/read-all`.
- Notification taps route through `routeNotificationData`.

Push notifications require a physical device, an EAS project configuration, and platform push credentials. The repository includes `PUSH_CREDENTIALS.md` with setup guidance. Do not commit Firebase service account private keys, Apple private keys, or other push credential secrets.

## Localization

Localization is implemented with a custom provider in `src/i18n/index.tsx`, not with an external i18n library.

Current languages:

- English (`en`)
- Arabic (`ar`)

The selected language is persisted in SecureStore under `fitmind_language`. When Arabic is selected, the provider enables RTL through React Native `I18nManager` and exposes `isRtl` / `direction` helpers used throughout screens and navigation UI.

## Installation and Setup

### Prerequisites

- Node.js and npm
- Expo tooling through `npx`
- Android Studio for Android builds
- Xcode for iOS builds on macOS
- A running FitMind Laravel backend API

### Install Dependencies

```bash
npm install
```

### Configure the API URL

Edit `src/services/api.ts` and set `API_BASE_URL` to the Laravel backend API URL for your environment.

Examples:

- Android emulator talking to host machine: use the host address expected by your emulator setup.
- Physical phone: use a LAN IP address or tunnel URL reachable from the device.
- Production build: use the deployed backend API URL.

Do not place private tokens, service account keys, or secret URLs in the README or in committed source files.

### Start Expo

```bash
npx expo start
```

From the Expo terminal UI, run on Android, iOS, or web as supported by your environment.

### Native / Dev Client Notes

This project includes `expo-dev-client` and EAS build profiles in `eas.json`.

For native development builds:

```bash
npm run android
npm run ios
```

Push notifications should be tested on a physical device with a fresh development build after push credentials are configured.

## Available Scripts

| Script | Command | Description |
| --- | --- | --- |
| `npm start` | `expo start` | Start the Expo development server. |
| `npm run android` | `expo run:android` | Build and run the native Android app. |
| `npm run ios` | `expo run:ios` | Build and run the native iOS app. |
| `npm run web` | `expo start --web` | Start Expo for web. |

No test, lint, or typecheck scripts are currently defined in `package.json`.

## Integration With the FitMind System

This repository is the mobile member app for the broader FitMind platform.

- The Laravel backend provides the API consumed by the app.
- AI assistant requests are sent to the backend AI route and can be handled by the FitMind AI service behind the backend.
- The separate FitMind web dashboard is used by admin and coach users, while this mobile app is focused on gym members.
- Accepted workout plans and active nutrition plan versions are surfaced in the member app based on backend status fields.
- Sessions, news, notifications, feedback, injuries, goals, and profile data are synchronized through backend API endpoints.

## Known Notes and Limitations

- `API_BASE_URL` is hard-coded in `src/services/api.ts`; there is no environment-file loader in the current codebase.
- Axios is installed but not used by the inspected service layer.
- `ProgressScreen.tsx` exists and uses static data from `src/data/progressData.ts`, but it is not registered in the current navigation tree.
- Settings notification toggles are local UI state in `SettingsScreen`; no backend persistence for those preferences is implemented in the inspected code.
- The root navigator currently starts at `Login`; persisted auth data is stored and used by services/screens, but there is no startup auth bootstrap screen in the current navigator.
- Push-token registration returns `null` on non-physical devices.

## Security Notes

- Do not expose auth tokens, reset tokens, API keys, Firebase service account private keys, Apple private keys, Expo credentials, or private backend URLs.
- `google-services.json` is referenced by the Expo Android config, but service account private key files must remain outside version control.
- Keep production API configuration and push credentials managed through the appropriate deployment or EAS credential workflow.

## Authors

- FitMind graduation project team

## License

License not specified.

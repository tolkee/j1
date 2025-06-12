# Task 01 - Mobile App Setup (Expo + Tamagui)

> **Status: ✅ Completed on 2024-06-01**

## Description

Set up the Jarvis mobile application using Expo and Tamagui for cross-platform development. Create the foundational structure with authentication integration and a welcome screen that connects to the Convex backend.

## Subtasks

### 1. Initialize Expo Project with Tamagui Template

- [x] Create `app/` folder in monorepo root
- [x] Initialize project using Tamagui Expo Router template: `pnpm create tamagui@latest --template expo-router`
- [x] Alternatively, if custom setup needed: `pnpm dlx create-expo-app -t expo-template-blank-typescript`
- [x] Update `app.json` to `app.config.ts` and set `userInterfaceStyle` to `"automatic"` for dark mode support
- [x] Set up proper folder structure (if not using template):
  - [x] `app/src/` for source code
  - [x] `app/src/components/` for reusable components
  - [x] `app/src/screens/` for screen components
  - [x] `app/src/hooks/` for custom hooks
  - [x] `app/src/types/` for TypeScript types

### 2. Configure Tamagui with Expo

- [x] Install core Tamagui packages: `@tamagui/config/v4` and `tamagui`
- [x] Install Tamagui babel plugin: `@tamagui/babel-plugin`
- [x] Configure `babel.config.js` with Tamagui babel plugin:
  ```js
  module.exports = function (api) {
    api.cache(true);
    return {
      presets: ["babel-preset-expo"],
      plugins: [
        [
          "@tamagui/babel-plugin",
          {
            components: ["tamagui"],
            config: "./tamagui.config.ts",
            logTimings: true,
            disableExtraction: process.env.NODE_ENV === "development",
          },
        ],
        "react-native-reanimated/plugin", // if using reanimated
      ],
    };
  };
  ```
- [x] Create `tamagui.config.ts` with default v4 config
- [x] Update `app/_layout.tsx` to include TamaguiProvider
- [x] Create `tamagui-web.css` import for web support
- [x] Configure Metro for monorepo (if needed)
- [x] Test Tamagui components render correctly with theming

### 3. Install and Configure Convex Client

- [x] Install Convex client: `convex`
- [x] Install React Native specific packages for Convex
- [x] Create `app/convex/_generated/` folder for generated types
- [x] Set up Convex provider in `App.tsx`
- [x] Configure environment variables for Convex URL
- [x] Test connection to Convex backend

### 4. Implement Authentication Flow

**Prerequisites:** [Task 01 - Convex Backend Setup](../../convex/doc/task/01-convex-setup.md) - Authentication configuration must be completed

- [x] Install authentication packages compatible with Expo
- [x] Create authentication context and provider
- [x] Implement login screen with Tamagui components
- [x] Implement registration screen with Tamagui components
- [x] Create authentication hook (`useAuth`)
- [x] Test authentication flow with Convex backend

### 5. Create Welcome Screen

**Prerequisites:** [Task 01 - Convex Backend Setup](../../convex/doc/task/01-convex-setup.md) - Welcome message service must be implemented

- [x] Create `WelcomeScreen.tsx` component
- [x] Integrate with Convex welcome message query
- [x] Design welcome screen UI with Tamagui components
- [x] Add user profile display (name, avatar placeholder)
- [x] Implement pull-to-refresh functionality
- [x] Add loading and error states

### 6. Setup Navigation with Expo Router

- [x] Ensure Expo Router is installed (included in Tamagui template or install separately)
- [x] Configure file-based routing structure in `app/` directory:
  - [x] `app/(tabs)/` for main tab navigation
  - [x] `app/(auth)/` for authentication screens
  - [x] `app/modal.tsx` for modal presentations
- [x] Update `app/_layout.tsx` with proper theme integration:
  ```tsx
  import {
    DarkTheme,
    DefaultTheme,
    ThemeProvider,
  } from "@react-navigation/native";
  import { Stack } from "expo-router";
  import { useColorScheme } from "react-native";
  import { TamaguiProvider } from "tamagui";
  import { tamaguiConfig } from "../tamagui.config";
  ```
- [x] Create authentication-aware navigation guards
- [x] Set up protected routes for authenticated users
- [x] Configure deep linking for future features
- [x] Test navigation flow between auth and welcome screens

### 7. Configure Development Environment

- [x] Ensure pnpm is installed and up to date: `npm install -g pnpm@latest`
- [x] Set up proper TypeScript configuration with Expo and Tamagui support
- [x] Configure ESLint and Prettier for code formatting (follow monorepo standards)
- [x] Set up development scripts in `package.json`:
  - [x] `expo start` for development server
  - [x] `expo start --web` for web development
  - [x] Build scripts for iOS and Android
- [x] Configure iOS and Android development builds
- [x] Set up Metro configuration for monorepo if needed
- [x] Document app setup in `app/doc/README.md`
- [x] Create component documentation structure

## Prerequisites

- [Task 01 - Convex Backend Setup](../../convex/doc/task/01-convex-setup.md) - Must be completed for authentication and welcome message integration
- pnpm package manager installed for dependency management
- Node.js and Expo CLI properly installed

## Acceptance Criteria

- [x] Expo app runs successfully on iOS simulator/device
- [x] Expo app runs successfully on Android emulator/device
- [x] Expo app runs successfully on web (`expo start --web`)
- [x] Tamagui components render with proper theming and dark mode support
- [x] Tamagui babel plugin is configured and optimizing components
- [x] User can register and login through the app
- [x] Welcome screen displays personalized message from Convex
- [x] Expo Router navigation works smoothly between screens
- [x] App handles authentication state properly with route guards
- [x] Development environment is fully configured with pnpm
- [x] All dependencies are properly installed and configured
- [x] Metro configuration works properly in monorepo setup

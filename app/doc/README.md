# Mobile App Documentation (Expo + Tamagui)

## Overview

This directory contains the Jarvis mobile application built with Expo and Tamagui for cross-platform iOS and Android development. The app provides a native mobile interface to access all Jarvis services and features.

## Tech Stack

- **Expo** - React Native development platform with managed workflow
- **Tamagui** - Universal UI system for React Native and Web
- **Expo Router** - File-based routing system
- **TypeScript** - Type safety and better developer experience
- **Convex Client** - Real-time connection to Jarvis backend

## Project Structure

```
app/
├── doc/                    # Technical documentation
│   ├── README.md          # This file
│   └── task/              # Implementation tasks
├── src/                   # Source code
│   ├── components/        # Reusable UI components
│   ├── screens/          # Screen components
│   ├── hooks/            # Custom React hooks
│   ├── types/            # TypeScript type definitions
│   └── utils/            # Utility functions
├── convex/               # Generated Convex types and client
├── app.json              # Expo configuration
├── tamagui.config.ts     # Tamagui configuration
└── package.json          # Dependencies and scripts
```

## Getting Started

1. Follow [Task 01 - Mobile App Setup](task/01-app-setup.md)
2. Run `npm start` to start Expo development server
3. Use Expo Go app or simulator to preview the app

## Key Features

- **Authentication** - User registration and login
- **Welcome Screen** - Personalized user greeting
- **Cross-platform** - Shared codebase for iOS and Android
- **Real-time Updates** - Live data synchronization with Convex

## Development Workflow

1. Create/modify components in `src/components/`
2. Build screens in `src/screens/`
3. Use Tamagui for consistent styling across platforms
4. Test on both iOS and Android simulators
5. Build development builds for testing on physical devices

## Environment Configuration

- Development: Uses Expo development builds
- Production: Uses EAS Build for app store deployment

## UI System

The app uses Tamagui for:

- Cross-platform component library
- Consistent theming and design tokens
- Responsive design capabilities
- Animation support
- Compile-time optimizations

---

_This documentation will be updated as the mobile app evolves._

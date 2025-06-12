# Task 02 - Jarvis Cloud Home Screen

## Description

Implement the main home screen of the Jarvis app featuring an Apple Watch-inspired cloud of applications interface. This screen will replace the entire tabs navigation structure, creating a single full-screen cloud interface at `app/index.tsx`. The interface displays all Jarvis services as interactive app icons in a dynamic, physics-based cloud layout with smooth zoom and pan gestures for natural navigation. The existing authentication system will be preserved, with user controls integrated as floating elements within the cloud interface.

## Subtasks

### 1. Research and Setup

- [x] Research best practices for React Native performance optimization
- [x] Install core animation and gesture libraries:
  - [x] Install `react-native-reanimated` v3 for high-performance animations
  - [x] Install `react-native-gesture-handler` for smooth gesture handling
  - [x] Install `react-native-svg` for custom layouts and shapes
  - [x] Install `d3-force` for physics-based force layout calculations
- [x] Configure Reanimated babel plugin in `babel.config.js`
- [x] Enable Hermes for optimal performance (already configured in Expo)
- [x] Set up gesture handler root provider in `app/_layout.tsx`

### 2. Service Registry Architecture

- [x] Create `lib/services/types.ts` with service definition interface:
  ```typescript
  interface JarvisService {
    id: string;
    name: string;
    icon: string; // Icon name or component
    color: string; // Vivid background color
    route: string; // Navigation route
    enabled: boolean;
  }
  ```
- [x] Create `lib/services/registry.ts` with service registry
- [x] Define initial services (placeholder for now):
  - Messages
  - Calendar
  - Tasks
  - Notes
  - Weather
  - Settings
  - etc.

### 3. Cloud Layout Engine

- [x] Create `components/CloudLayout/CloudLayoutEngine.ts`:
  - [x] Implement force-directed layout using d3-force
  - [x] Configure forces:
    - Center force to keep nodes centered
    - Collision force to prevent overlaps
    - Many-body force for natural spacing
    - Custom radial force for circular tendency
  - [x] Add position constraints for viewport boundaries
- [x] Create `lib/hooks/useCloudPhysics.ts`:
  - [x] Initialize d3-force simulation on native thread using worklets
  - [x] Update node positions at 60 FPS
  - [x] Handle dynamic node addition/removal

### 4. Service Node Component

- [x] Create `components/ServiceNode/ServiceNode.tsx`:
  - [x] Circular node with vivid background color
  - [x] White icon in center (using @tamagui/lucide-icons)
  - [x] Animated scale on hover/press
  - [x] Shadow and glow effects
- [x] Implement `lib/hooks/useServiceNodeAnimation.ts` hook:
  - [x] Scale animation on press
  - [x] Opacity fade on navigation
  - [x] Bounce effect on release

### 5. Gesture Implementation

- [x] Create `components/CloudView/CloudView.tsx` main container:
  - [x] Implement pinch-to-zoom gesture:
    - [x] Track scale with `useSharedValue`
    - [x] Apply scale transform to cloud container
    - [x] Clamp zoom levels (min: 0.5, max: 3.0)
  - [x] Implement pan gesture:
    - [x] Track translation with `useSharedValue`
    - [x] Apply translation with spring physics
    - [x] Add momentum on release
  - [x] Combine gestures using `Gesture.Simultaneous()`

### 6. Home Screen Implementation

- [x] Remove tabs navigation structure:
  - [x] Remove `app/(tabs)/_layout.tsx` tab navigation
  - [x] Remove `app/(tabs)/two.tsx` secondary tab screen
  - [x] Update `app/_layout.tsx` to remove tabs route and redirect directly to home
- [x] Replace `app/(tabs)/index.tsx` with single cloud home screen at `app/index.tsx`:
  - [x] Preserve existing authentication integration with `useAuth` hook
  - [x] Import and render CloudView as main component
  - [x] Map services to ServiceNode components
  - [x] Handle service selection and navigation using Expo Router
  - [x] Add background gradient or pattern
  - [x] Integrate user info and logout into cloud interface (floating elements)
  - [x] Make it full-screen without any navigation bars or tabs
- [x] Implement `lib/hooks/useHomeScreen.ts` hook:
  - [x] Load services from registry
  - [x] Handle navigation to service screens
  - [x] Track analytics events

### 7. Performance Optimization

- [ ] Implement view recycling for off-screen nodes
- [ ] Use `runOnUI` for all animation calculations
- [ ] Optimize re-renders with React.memo and useMemo
- [ ] Profile with Flipper and React DevTools
- [ ] Target 60 FPS on mid-range devices

### 8. Visual Polish

- [ ] Add subtle parallax effect to background
- [ ] Implement smooth fade-in animation on mount
- [ ] Add haptic feedback on node selection
- [ ] Create loading skeleton while services initialize
- [ ] Add accessibility labels and hints

### 9. Navigation Integration

- [x] Set up Expo Router structure for services:
  - [ ] Create navigation types in `lib/navigation/types.ts`
  - [x] Add individual service routes as stack screens from home
  - [ ] Implement shared element transitions (future)
- [x] Configure deep linking for services using Expo Router
- [x] Handle back navigation from service screens to cloud home
- [x] Ensure smooth transitions from cloud nodes to service screens

### 10. Testing

- [ ] Write unit tests for physics calculations
- [ ] Test gesture interactions on different devices
- [ ] Verify performance on low-end devices
- [ ] Test with different numbers of services
- [ ] Ensure accessibility compliance

## Prerequisites

- [Task 01 - App Initial Setup](mdc:01-app-initial-setup.md) - Expo and Tamagui must be configured
- Authentication system is already in place (`contexts/AuthContext.tsx`)
- Current tabs navigation structure at `app/(tabs)/` will be completely removed and replaced

## Acceptance Criteria

- [ ] Single full-screen cloud home interface without tabs or navigation bars
- [ ] Cloud displays all Jarvis services in a dynamic physics-based layout
- [ ] Smooth pinch-to-zoom works with natural physics
- [ ] Pan gestures feel responsive with momentum
- [ ] Service nodes have appealing visual design with white icons
- [ ] Tapping a service navigates to its dedicated screen
- [ ] User info and logout are accessible via floating UI elements
- [ ] Animations run at consistent 60 FPS
- [ ] Layout adapts to different screen sizes
- [ ] All interactions feel natural and Apple Watch-like
- [ ] Seamless navigation from cloud nodes to individual service screens

# CoachT - AI-Powered Martial Arts Coach

## Overview

CoachT is an AI-powered Taekwondo coaching application that uses pose detection and motion analysis to provide real-time feedback on martial arts techniques. The system analyzes user movements through computer vision, compares them against reference forms, and delivers instant coaching feedback to help users improve their technique.

## System Architecture

The application follows a modern full-stack monorepo architecture with clear separation between client and server:

- **Frontend**: React-based SPA with TypeScript
- **Backend**: Express.js server with TypeScript
- **Database**: PostgreSQL (via Neon Serverless)
- **Build System**: Vite for frontend bundling, ESBuild for server bundling
- **Deployment**: Configured for Replit with autoscale deployment

## Key Components

### Frontend Architecture
- **React Components**: Modular component structure with shadcn/ui design system
- **State Management**: React Context API with React Query for server state
- **Routing**: Wouter for lightweight client-side routing
- **Styling**: Tailwind CSS with custom design tokens
- **AI/ML**: TensorFlow.js integration for real-time pose detection using MediaPipe and MoveNet models
- **Animation**: Framer Motion for smooth UI transitions and effects

### Backend Architecture
- **API Layer**: RESTful endpoints built with Express.js
- **Authentication**: Session-based auth using Passport.js with LocalStrategy
- **Database ORM**: Drizzle ORM for type-safe database operations
- **Session Storage**: PostgreSQL-backed session store
- **File Handling**: Support for image uploads and video processing

### Database Schema
The PostgreSQL database includes these core tables:
- `users`: User authentication and basic profile data
- `user_profiles`: Extended profile information with goals and gallery images
- `recordings`: User practice session recordings
- `tracking_settings`: User preferences for pose detection
- `early_access_signups`: Marketing signup collection
- `martial_arts_videos`: Reference technique videos
- `pose_sequences`: Pre-extracted pose data for reference comparisons
- `pose_keypoints`: Individual keypoint data for pose analysis

### AI/ML Components
- **Pose Detection**: Real-time pose estimation using TensorFlow.js
- **Joint Analysis**: Custom joint angle calculations for technique scoring
- **Movement Comparison**: Dynamic Time Warping (DTW) algorithm for comparing user movements to reference forms
- **Scoring Engine**: AI-powered feedback system that analyzes form, timing, and technique execution

## Data Flow

1. **User Registration/Login**: Session-based authentication flow
2. **Camera Access**: Browser MediaDevices API for video stream
3. **Pose Detection**: Real-time analysis of user movements using TensorFlow.js
4. **Movement Analysis**: Joint angle calculations and movement pattern recognition
5. **Comparison Engine**: DTW-based comparison against reference movements
6. **Feedback Generation**: AI-powered coaching tips and scoring
7. **Progress Tracking**: Session data storage and historical analysis

## External Dependencies

### Frontend Dependencies
- **TensorFlow.js**: Machine learning and pose detection (`@tensorflow/tfjs-*`)
- **MediaPipe**: Advanced pose estimation (`@mediapipe/pose`)
- **shadcn/ui**: Component library built on Radix UI primitives
- **Framer Motion**: Animation library for smooth interactions
- **React Query**: Server state management
- **Wouter**: Lightweight routing solution

### Backend Dependencies
- **Neon Database**: Serverless PostgreSQL (`@neondatabase/serverless`)
- **Drizzle ORM**: Type-safe database toolkit
- **Passport.js**: Authentication middleware
- **Express Session**: Session management
- **Resend**: Email service integration (optional)

### Development Tools
- **Vite**: Frontend build system with HMR
- **ESBuild**: Fast server bundling
- **TypeScript**: Type safety across the stack
- **Tailwind CSS**: Utility-first styling

## Deployment Strategy

The application is configured for deployment on Replit with the following setup:

- **Development**: `npm run dev` starts both frontend and backend in development mode
- **Build**: `npm run build` creates optimized production bundles
- **Production**: `npm run start` serves the built application
- **Database**: Automated migrations with `npm run db:push`
- **Port Configuration**: Frontend on 5173, backend on 5000
- **Autoscale Deployment**: Configured for automatic scaling based on demand

The deployment includes:
- PostgreSQL module for database support
- Node.js 20 runtime environment
- Web module for HTTP handling
- Object storage integration for media files

## Changelog

Changelog:
- June 16, 2025. Initial setup
- June 17, 2025. Added comprehensive internship application system with resume upload capabilities, form validation, and database storage
- June 17, 2025. Redesigned MarketingLanding (renovate) page with CoachT branding, removed developer portal, replaced early access with "Start now" linking to /early, simplified content for better readability
- June 18, 2025. Created revolutionary welcome page with silhouette zoom interaction, floating martial arts terms, and complete website content integration. Implemented scroll-triggered animations and competitive edge messaging focused on advancing to next belt faster.
- June 18, 2025. Updated routing structure: Root domain (/) now defaults to auth page for immediate signup/login. Marketing welcome page moved to /welcome route. Added belt progression section with 3D effects and comprehensive user journey mapping.
- January 11, 2025. Implemented comprehensive mobile camera optimization across all challenge pages and SnapFeedback. Added mobile-specific camera utilities with device detection, optimal constraints (720p max, 30fps), and dynamic screen fitting. Updated all challenge pages to use new mobile-optimized camera setup for better mobile performance. Added mobile-specific CSS classes for fullscreen challenge layouts.
- January 11, 2025. Resolved Capacitor dependency conflicts preventing deployment. Upgraded all Capacitor packages to version 7.x (@capacitor/core@7.4.2, @capacitor/cli@7.4.2, @capacitor/android@7.4.2, @capacitor/ios@7.4.2, @capacitor/browser@7.0.1, @capacitor/app@7.0.1). Temporarily removed @codetrix-studio/capacitor-google-auth package due to incompatibility with Capacitor 7.x. Updated native Google authentication to gracefully fallback to browser-based login. Application now deploys successfully with all peer dependencies aligned.
- January 13, 2025. Implemented comprehensive PWA installation prompt system with localStorage tracking. Added PWAInstallPrompt component with device-specific instructions (Android/iOS/Desktop) and native install button support. Integrated PWAInstallButton for returning users on all key pages (WelcomePage, AuthPage, Home, MobileLanding). System shows friendly modal for first-time mobile visitors with step-by-step installation guidance, then provides unobtrusive install button for subsequent visits. Features gradient styling consistent with CoachT brand and proper animation effects.

## User Preferences

Preferred communication style: Simple, everyday language.
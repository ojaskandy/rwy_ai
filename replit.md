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
- January 13, 2025. Implemented comprehensive onboarding gating system with Stripe payment integration. Added database fields for payment tracking (hasCompletedOnboarding, hasPaid, hasCodeBypass, stripeCustomerId, stripeSubscriptionId). Created full onboarding flow with 6 questions followed by payment step supporting both Stripe payments ($29.99) and discount code bypass. Integrated payment system with OnboardingPayment component using Stripe Elements. Updated ProtectedRoute to automatically redirect users to onboarding when needed. Added API endpoints for payment processing, discount code validation, and onboarding status management. System now gates access to main application until payment is completed or valid discount code is entered.
- January 14, 2025. Updated onboarding payment system with new subscription pricing structure. Replaced single payment with two-tier subscription model: Monthly ($12/month) and Yearly ($96/year, equivalent to $8/month with 33.3% savings). Added beautiful pricing display with "Most Popular" badge on yearly plan, feature comparisons, and trust indicators. Enhanced discount code system with additional codes (COACHTFREE, SECRETACCESS, BLACKBELT) for free access bypass. Maintained existing payment flow with improved CoachT-compatible design featuring gradients, cards, and smooth animations.
- July 15, 2025. Fixed Partnership page UI improvements: Changed "Benefits" to "See Benefits" with clear button styling, emphasized "Empower your students" text, and added an enticing Schedule Demo button with gradient colors, animations, and glow effects. Updated WelcomePage heading from "Your Child's Martial Arts Mastery" to "Master Martial Arts" to fit in 2 lines maximum. Redirected all "Start Training" links from /early to /auth for proper user flow.
- July 20, 2025. Implemented comprehensive authentication flow improvements to ensure consistent user routing based on payment and onboarding status. Enhanced all login methods (Google OAuth, Magic Link, regular login, profile completion, and session restoration) to fetch /api/user-status after authentication and route users to /app only if both hasPaid and hasCompletedOnboarding are true, otherwise to /onboarding. This ensures proper user flow regardless of browser session, cookies, or incognito mode. Updated WelcomePage main heading from "Master Martial Arts" to "The AI Martial Arts Coach" split across two lines for better branding alignment.
- July 22, 2025. Successfully migrated CoachT application from Replit Agent to standard Replit environment. Fixed critical port configuration issues by updating server to use port 5000 for Replit compatibility. Resolved workflow startup problems and ensured proper client/server separation. Application now runs cleanly with full-stack architecture intact, featuring React frontend with TypeScript, Express.js backend, and all existing features preserved including pose detection, AI coaching, and payment integration.
- July 23, 2025. Integrated Runway AI logo across the application. Added logo to welcome page navigation and hero section, plus small logo in main app header. Logo properly imported from attached assets and displays consistently with brand identity. Updated browser tab title from "CoachT | AI Taekwondo Coach" to "Runway AI | AI Pageant Coach" and added pageant-focused meta descriptions for improved SEO and branding consistency.
- July 23, 2025. Completely rebuilt Interview Coach with proper Question Mode and Rounds Mode functionality as specified. Question Mode: user selects time limit → random question → record/transcribe → AI grades → option to continue/quit. Rounds Mode: user selects number of questions and time limit → full simulation → comprehensive feedback at end. Fixed timer visual alignment issues (blue dot now aligns perfectly with pink progress bar). Added 7 time options (1-10 minutes). Integrated OpenAI API (GPT-4o) for thorough, brutally honest response grading with pageant-specific criteria. Added proper grading step UI with spinning animation and professional feedback display.
- July 23, 2025. Enhanced Calendar UX with improved "Add Event" functionality. Made Add Event button more prominent (larger size, gradient design) with dedicated mobile section. Completely reorganized event creation modal to prioritize AI-powered event description at the top with beautiful gradient styling, followed by manual entry section at bottom. Fixed mobile responsiveness issues with proper viewport scaling (95vw on mobile, max-h-95vh) and sticky action buttons. Added 2025 year awareness with smart date defaults. Improved modal design with white background, better spacing, and clearer visual hierarchy.

## User Preferences

Preferred communication style: Simple, everyday language.
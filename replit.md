# CoachT - AI-Powered Martial Arts Coach

## Overview
CoachT is an AI-powered application designed to provide real-time feedback on martial arts techniques. It uses pose detection and motion analysis to help users improve their form through computer vision, comparing movements against reference forms and delivering instant coaching. The project aims to empower users to advance their martial arts skills more rapidly.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture
The application is built as a full-stack monorepo.
- **Frontend**: React-based SPA with TypeScript, utilizing shadcn/ui for components, React Context and React Query for state, Wouter for routing, and Tailwind CSS for styling. It integrates TensorFlow.js, MediaPipe, and MoveNet for AI/ML capabilities, and Framer Motion for UI animations.
- **Backend**: Express.js server with TypeScript, providing RESTful endpoints. Authentication is session-based using Passport.js, and Drizzle ORM is used for type-safe PostgreSQL operations.
- **Database**: PostgreSQL (Neon Serverless) for user data, recordings, settings, and reference materials.
- **AI/ML Components**: Features real-time pose estimation with TensorFlow.js, custom joint angle calculations, Dynamic Time Warping (DTW) for movement comparison, and an AI-powered scoring engine for feedback on form, timing, and technique.
- **Deployment**: Configured for Replit with autoscale deployment, using Vite for frontend and ESBuild for backend bundling.

## External Dependencies

- **Frontend**:
    - TensorFlow.js: Machine learning and pose detection.
    - MediaPipe: Advanced pose estimation.
    - shadcn/ui: Component library.
    - Framer Motion: Animation library.
    - React Query: Server state management.
    - Wouter: Lightweight routing.

- **Backend**:
    - Neon Database: Serverless PostgreSQL.
    - Drizzle ORM: Type-safe database toolkit.
    - Passport.js: Authentication middleware.
    - Express Session: Session management.
    - Resend: Email service integration (optional).

- **Development Tools**:
    - Vite: Frontend build system.
    - ESBuild: Fast server bundling.
    - TypeScript: Type safety.
    - Tailwind CSS: Utility-first styling.
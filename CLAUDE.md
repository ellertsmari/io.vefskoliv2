# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Learning Management System (LMS) for Vefskóli at Tækniskóli built with Next.js, TypeScript, MongoDB, and NextAuth. The system manages guides (projects), student returns (submissions), feedback, and graded reviews.

## Common Commands

```bash
# Development
npm run dev          # Start development server on localhost:3000
yarn dev

# Testing
npm run test         # Run Jest tests
npm run test-watch   # Run tests in watch mode

# Build & Deploy
npm run build        # Build production version
npm run start        # Start production server
npm run lint         # Run ESLint

# Database setup required
# Add MONGODB_CONNECTION to your env files
```

## Architecture & Key Concepts

### Data Flow
- **Guides**: Learning projects defined in `app/models/guide.ts` with schema requirements
- **Returns**: Student submissions for guides (`app/models/return.ts`)
- **Reviews**: Used for both feedback and graded feedback (`app/models/review.ts`)  
- **Users**: Student and teacher accounts with NextAuth authentication

### Status System
The app calculates and displays various statuses for each guide per user:
- **ReturnStatus**: NOT_RETURNED → AWAITING_FEEDBACK → PASSED/FAILED/HALL_OF_FAME
- **FeedbackStatus**: Tracks giving feedback on other students' returns
- **GradesGivenStatus**: Tracks grading other students' feedback
- **GradesReceivedStatus**: Tracks receiving grades on your own feedback

### Key Files
- `app/serverActions/getGuides.ts`: Main data fetching logic
- `types/guideTypes.ts`: Core type definitions for guide statuses and extended types
- `app/models/`: Mongoose schemas and type definitions
- `jest.config.ts`: Test configuration with custom module aliases

### Module System
Uses path aliases configured in both `jest.config.ts` and likely `tsconfig.json`:
- `components/`, `UIcomponents/`, `serverActions/`, `models/`, `types/`, etc.

### Authentication
NextAuth v5 beta with custom pages and authorization callbacks in `auth.config.ts`.

## Current Branch Context

Working on `feature/open-guides` branch with modifications to:
- Guide pages and routing
- Top bar navigation
- Server actions and MongoDB connection
- Public guide utilities and serialization
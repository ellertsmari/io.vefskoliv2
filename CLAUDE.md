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

## Guide Organization & Categorization

**IMPORTANT**: All guides must be organized by both category and module:

### Categories (Required)
Guides MUST be categorized into one of these 4 types:
- **"code"**: Programming and development guides
- **"design"**: Visual design and UI/UX guides  
- **"speciality code"**: Advanced/specialized programming topics
- **"speciality design"**: Advanced/specialized design topics

Defined in: `app/constants/guideCategories.ts`

### Modules (Required)
Guides MUST be assigned to a module with:
- **number**: Module sequence number (integer) - **⚠️ WARNING: Often undefined in database**
- **title**: Module name (e.g., "Preparation", "Introductory Course", "The fundamentals")

Structure defined in: `app/models/guide.ts` → `guideModuleSchema`

**⚠️ CRITICAL DATABASE ISSUE**: 
- `module.number` is frequently undefined/null in the database
- **NEVER rely on `module.number` for sorting or logic**
- **ALWAYS use `module.title` as the primary identifier**
- **ALWAYS provide fallbacks**: `guide.module?.number || 0`
- Use `module.title` for grouping and filtering instead

### Edit Guides Feature
Teachers can manage guides via `/LMS/edit-guides`:
- Filter by category and module
- Edit guide properties including category selection
- Categories are enforced via dropdown (no free text)

## Current Branch Context

Working on `feature/teacher-edit-guides` branch with:
- Complete edit guides functionality for teachers
- Category and module filtering
- Form validation with predefined categories
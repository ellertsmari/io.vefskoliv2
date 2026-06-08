# Peer Review Workflow

This document describes the peer review system and the requirements for students to complete a guide.

## Overview

The peer review system is designed to ensure students learn from each other through structured feedback. Each guide follows a cycle of: **Submit** -> **Review Others** -> **Receive Feedback**. Teachers then grade the reviews students gave.

## Requirements for Completing a Guide

For a student to pass a guide, they must complete ALL of the following:

| Step | Requirement | Current Implementation |
|------|-------------|----------------------|
| 1. Submit Return | Submit their project work | Implemented |
| 2. Give Feedback | Review **2 other students'** projects | Implemented |
| 3. Receive Feedback | Wait for **2 reviews** from peers | Implemented |

The reviews a student gives are then graded **by teachers** (see below). Students do not grade reviews.

## Auto-graded guides (exception to the above)

Most guides use the peer-review flow described here. A guide may instead be marked
as an **auto-graded interactive exercise**, in which case the peer-review cycle is
**skipped entirely**:

- The guide has `gradingMode: "auto"` and an `exercise` (a list of tasks; phase 1
  supports multiple-choice **quiz** tasks).
- The student answers the exercise on the guide page; it is **graded server-side**
  (`submitExercise` action) against an answer key that is never sent to the client.
- The grade is the best attempt's score (0–10) and flows through the normal grade /
  progress UI. There are **no reviews and no review-grading** for these guides, so
  the review/grade statuses are `NOT_APPLICABLE`.
- Students may retry; each submission is stored as an `ExerciseAttempt` and the
  highest-scoring attempt wins.

Related code: `app/models/guide.ts` (`gradingMode`, `exercise`),
`app/models/exerciseAttempt.ts`, `app/utils/exerciseUtils.ts` (grading +
answer-key stripping), `app/serverActions/submitExercise.ts`, and the auto branch
in `extendGuides` (`app/utils/guideUtils.ts`).

Everything below applies to **peer-reviewed** guides only.

## Business Rules

### Feedback (Reviews)
- Each student must give feedback to **2 different students** per guide
- Students cannot review their own work
- Students cannot review the same return twice
- Feedback includes a vote (PASS / NO PASS / RECOMMEND) and a comment

### Grading (Review of Reviews)
- Grading is **teacher-only**. Students give reviews but never grade them.
- Teachers grade the reviews students gave; the grade contributes to that reviewer's score for the guide
- Teachers can grade and re-grade any review (e.g. via the reports page)
- Grades are on a scale of 0-10

### Pass/Fail Criteria
- A return **passes** if it receives 2+ reviews with majority PASS votes
- A return **fails** if it receives 2+ NO_PASS votes
- A return is **AWAITING_FEEDBACK** until it has 2 reviews
- A return can achieve **HALL OF FAME** status with RECOMMEND votes

## UI/UX Requirements (TODO)

The following UI improvements are needed to make the peer review process more intuitive for students:

### High Priority

- [ ] **Progress indicator for feedback given**: Show students they need to give 2 reviews
  - Display "Reviews Given: 1/2" or similar
  - Show notification/prompt when less than 2 reviews given

- [ ] **Progress indicator for grades given**: Show students they need to grade 2 reviews
  - Display "Reviews Graded: 0/2" or similar
  - Show notification/prompt when grades are needed

- [ ] **Clear call-to-action buttons**:
  - "Give Feedback" button should be prominent when < 2 feedback given
  - "Grade Review" button should be prominent when grades are needed

### Medium Priority

- [ ] **Onboarding/Tutorial**: First-time explanation of the peer review process
- [ ] **Status dashboard**: Overview of all requirements at a glance
- [ ] **Email notifications**: Remind students when action is needed

### Visual Indicators

Currently implemented:
- Bell icon (!) when action is required
- Green tick when passed
- Red cross when failed
- Hourglass when awaiting feedback
- Purple star for Hall of Fame
- Student cap icon when graded

Suggested improvements:
- [ ] Add progress bars for each requirement
- [ ] Color-code guide cards based on what action is needed
- [ ] Add tooltips explaining what each status means

## Data Flow

```
Student A submits return
    |
    v
Student B & C review Student A's return (feedbackReceived for A)
    |
    v
A teacher grades the reviews written by B & C
    |
    v
Student A can see feedback but NOT the grades those reviewers received
Student B & C can see the grades they received for their reviews
```

## Related Code

- **Models**: `app/models/return.ts`, `app/models/review.ts`
- **Server Actions**: `app/serverActions/getGuides.ts`, `app/serverActions/returnGrade.ts`
- **Status Calculation**: `app/utils/guideUtils.ts`
- **UI Components**: `app/guides/components/guideCardStatuses/`

## Constants (Currently Hardcoded)

These values are currently hardcoded throughout the codebase. Consider creating a constants file:

```typescript
// Suggested: app/constants/guideRules.ts
export const GUIDE_RULES = {
  REQUIRED_FEEDBACK_COUNT: 2,    // Reviews needed to pass
  REQUIRED_GRADES_COUNT: 2,      // Reviews to grade
  FAILURE_THRESHOLD: 2,          // NO_PASS votes to fail
  MAX_GRADE: 10,
  MIN_GRADE: 0,
} as const;
```

## Authorization Rules

The `returnGrade` server action enforces:
1. User must be logged in
2. User must have the **teacher** role (`session.user.role === "teacher"`) — this is the single source of grading authorization; there is no student grading path anywhere in the app
3. Review must exist

Teachers can grade and re-grade any review.

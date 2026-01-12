---
name: Testing Infrastructure Setup
overview: Set up Vitest, React Testing Library, MSW, and Playwright testing infrastructure for the React frontend, including configuration files, test scripts, and folder structure.
todos:
  - id: "1"
    content: Update package.json with dev dependencies (vitest, testing libraries, msw, playwright, jsdom)
    status: completed
  - id: "2"
    content: Add test scripts to package.json (test, test:unit, test:integration, test:e2e, test:e2e:ui)
    status: completed
  - id: "3"
    content: Create vitest.config.js with jsdom environment and setupFiles configuration
    status: completed
  - id: "4"
    content: Create src/tests/setupTests.js with @testing-library/jest-dom import
    status: completed
  - id: "5"
    content: Create playwright.config.ts with baseURL configuration
    status: completed
  - id: "6"
    content: Create e2e/smoke.spec.ts with minimal placeholder test
    status: completed
  - id: "7"
    content: Create folder structure (src/tests/unit, src/tests/integration, src/tests/msw, e2e)
    status: completed
---

# Testing Infrastructure Setup Plan

## Overview
Add comprehensive testing infrastructure to `family-app/frontend` with Vitest for unit/integration tests, React Testing Library for component testing, MSW for API mocking, and Playwright for E2E tests.

## Current State
- Vite-based React app (port 5173)
- JSX files (not TypeScript for source code)
- No existing test infrastructure
- Config files use `.js` extension

## Implementation Tasks

### 1. Update package.json
**File**: `family-app/frontend/package.json`

Add dev dependencies:
- `vitest`
- `@testing-library/react`
- `@testing-library/user-event`
- `@testing-library/jest-dom`
- `jsdom`
- `msw`
- `playwright`

Add test scripts:
- `"test": "vitest"`
- `"test:unit": "vitest src/tests/unit"`
- `"test:integration": "vitest src/tests/integration"`
- `"test:e2e": "playwright test"`
- `"test:e2e:ui": "playwright test --ui"`

### 2. Create Vitest Configuration
**File**: `family-app/frontend/vitest.config.js`

Configure:
- Test environment: `jsdom`
- Setup files: `src/tests/setupTests.js`
- Include pattern: `src/tests/**/*.test.{js,jsx,ts,tsx}`
- Use Vite config as base (import from vite.config.js)

### 3. Create Test Setup File
**File**: `family-app/frontend/src/tests/setupTests.js`

Include:
- Import `@testing-library/jest-dom` for extended matchers
- Optional: MSW handler reset after each test (commented or ready for MSW setup)

### 4. Create Playwright Configuration
**File**: `family-app/frontend/playwright.config.ts`

Configure:
- Base URL: `http://localhost:5173`
- TypeScript config (as requested)
- Default test settings

### 5. Create Sample E2E Test
**File**: `family-app/frontend/e2e/smoke.spec.ts`

Minimal placeholder test:
- Opens home page
- Checks for title or basic element
- Non-blocking (may fail if app not running)

### 6. Create Folder Structure
Create directories:
- `src/tests/unit/`
- `src/tests/integration/`
- `src/tests/msw/`
- `e2e/`

## Files to Create/Modify

**New Files:**
- `family-app/frontend/vitest.config.js`
- `family-app/frontend/src/tests/setupTests.js`
- `family-app/frontend/playwright.config.ts`
- `family-app/frontend/e2e/smoke.spec.ts`

**Modified Files:**
- `family-app/frontend/package.json` (add dependencies and scripts)

**New Directories:**
- `family-app/frontend/src/tests/unit/`
- `family-app/frontend/src/tests/integration/`
- `family-app/frontend/src/tests/msw/`
- `family-app/frontend/e2e/`

## Notes
- Vitest config will extend Vite config for consistency
- Playwright config uses TypeScript (`.ts`) as requested
- Test setup file uses `.js` to match project conventions
- All test scripts will be ready to run (may fail if no tests exist, but configs will be valid)
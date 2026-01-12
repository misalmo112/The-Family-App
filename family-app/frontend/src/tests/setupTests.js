import { expect, beforeAll, afterEach, afterAll } from 'vitest';
import * as matchers from '@testing-library/jest-dom/matchers';
import { server } from './msw/server.js';

// Extend Vitest's expect with jest-dom matchers
expect.extend(matchers);

// Start MSW server before all tests
beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' });
});

// Reset handlers after each test to ensure test isolation
afterEach(() => {
  server.resetHandlers();
});

// Close MSW server after all tests
afterAll(() => {
  server.close();
});

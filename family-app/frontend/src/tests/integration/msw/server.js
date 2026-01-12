import { setupServer } from 'msw/node';
import { handlers } from './handlers.js';

// Create MSW server with integration test handlers
export const server = setupServer(...handlers);

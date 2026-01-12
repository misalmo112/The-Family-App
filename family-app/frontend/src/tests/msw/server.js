import { setupServer } from 'msw/node';
import { handlers } from './handlers.js';

// Create MSW server with all handlers
export const server = setupServer(...handlers);

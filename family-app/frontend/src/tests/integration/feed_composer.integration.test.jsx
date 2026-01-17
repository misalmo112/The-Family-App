import { describe, it, expect, beforeAll, afterEach, afterAll, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server } from './msw/server.js';
import { renderWithProviders } from './test-utils.jsx';
import Feed from '../../pages/Feed/index.jsx';

// Start MSW server before all tests
beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' });
});

// Reset handlers after each test
afterEach(() => {
  server.resetHandlers();
  localStorage.clear();
});

afterAll(() => {
  server.close();
});

describe('Feed with Composer Integration', () => {
  beforeEach(() => {
    localStorage.setItem('token', 'mock-token');
    localStorage.setItem('activeFamilyId', '1');
  });

  it('should create MESSAGE via composer', async () => {
    const user = userEvent.setup();

    // Mock feed endpoint
    server.use(
      http.get(/.*\/api\/feed\/$/, () => {
        return HttpResponse.json({
          results: [],
          count: 0,
          page: 1,
        });
      }),
      http.post(/.*\/api\/feed\/posts\/$/, async ({ request }) => {
        const body = await request.json();
        return HttpResponse.json({
          id: 1,
          type: body.type,
          text: body.text,
          author_user: 'testuser',
          created_at: new Date().toISOString(),
        }, { status: 201 });
      })
    );

    renderWithProviders(<Feed />, {
      initialEntries: ['/feed'],
    });

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/type a message/i)).toBeInTheDocument();
    });

    const input = screen.getByPlaceholderText(/type a message/i);
    const sendButton = screen.getByRole('button', { name: /send/i });

    await user.type(input, 'Test message');
    await user.click(sendButton);

    await waitFor(() => {
      expect(screen.getByText('Test message')).toBeInTheDocument();
    });
  });

  it('should create POST via composer', async () => {
    const user = userEvent.setup();

    server.use(
      http.get(/.*\/api\/feed\/$/, () => {
        return HttpResponse.json({
          results: [],
          count: 0,
          page: 1,
        });
      }),
      http.post(/.*\/api\/feed\/posts\/$/, async ({ request }) => {
        const body = await request.json();
        return HttpResponse.json({
          id: 1,
          type: body.type,
          text: body.text,
          author_user: 'testuser',
          created_at: new Date().toISOString(),
        }, { status: 201 });
      })
    );

    renderWithProviders(<Feed />, {
      initialEntries: ['/feed'],
    });

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/type a message/i)).toBeInTheDocument();
    });

    // Switch to POST
    const postButton = screen.getByRole('button', { name: /post/i });
    await user.click(postButton);

    const input = screen.getByPlaceholderText(/write a post/i);
    const sendButton = screen.getByRole('button', { name: /send/i });

    await user.type(input, 'Test post');
    await user.click(sendButton);

    await waitFor(() => {
      expect(screen.getByText('Test post')).toBeInTheDocument();
    });
  });

  it('should update feed after creating post', async () => {
    const user = userEvent.setup();
    let callCount = 0;

    server.use(
      http.get(/.*\/api\/feed\/$/, () => {
        callCount++;
        return HttpResponse.json({
          results: callCount > 1 ? [
            {
              id: 1,
              type: 'MESSAGE',
              text: 'Test message',
              author_user: 'testuser',
              created_at: new Date().toISOString(),
            },
          ] : [],
          count: callCount > 1 ? 1 : 0,
          page: 1,
        });
      }),
      http.post(/.*\/api\/feed\/posts\/$/, async ({ request }) => {
        const body = await request.json();
        return HttpResponse.json({
          id: 1,
          type: body.type,
          text: body.text,
          author_user: 'testuser',
          created_at: new Date().toISOString(),
        }, { status: 201 });
      })
    );

    renderWithProviders(<Feed />, {
      initialEntries: ['/feed'],
    });

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/type a message/i)).toBeInTheDocument();
    });

    const input = screen.getByPlaceholderText(/type a message/i);
    const sendButton = screen.getByRole('button', { name: /send/i });

    await user.type(input, 'Test message');
    await user.click(sendButton);

    // Feed should update with new post (optimistic update)
    await waitFor(() => {
      expect(screen.getByText('Test message')).toBeInTheDocument();
    });
  });

  it('should handle error in composer', async () => {
    const user = userEvent.setup();

    server.use(
      http.get(/.*\/api\/feed\/$/, () => {
        return HttpResponse.json({
          results: [],
          count: 0,
          page: 1,
        });
      }),
      http.post(/.*\/api\/feed\/posts\/$/, () => {
        return HttpResponse.json(
          { error: 'Not authorized' },
          { status: 403 }
        );
      })
    );

    renderWithProviders(<Feed />, {
      initialEntries: ['/feed'],
    });

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/type a message/i)).toBeInTheDocument();
    });

    const input = screen.getByPlaceholderText(/type a message/i);
    const sendButton = screen.getByRole('button', { name: /send/i });

    await user.type(input, 'Test message');
    await user.click(sendButton);

    await waitFor(() => {
      expect(screen.getByText(/not authorized/i)).toBeInTheDocument();
    });
  });
});

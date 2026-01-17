import { describe, it, expect, beforeAll, afterEach, afterAll, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server } from './msw/server.js';
import { renderWithProviders } from './test-utils.jsx';
import Feed from '../../pages/Feed/index.jsx';

beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' });
});

afterEach(() => {
  server.resetHandlers();
  localStorage.clear();
});

afterAll(() => {
  server.close();
});

describe('Comments Integration', () => {
  beforeEach(() => {
    localStorage.setItem('token', 'mock-token');
    localStorage.setItem('activeFamilyId', '1');
  });

  it('should expand comments section and load comments', async () => {
    const user = userEvent.setup();

    server.use(
      http.get(/.*\/api\/feed\/$/, () => {
        return HttpResponse.json({
          results: [
            {
              id: 1,
              type: 'POST',
              text: 'Test post',
              author_user: 'user1',
              author_person_id: 123,
              created_at: new Date().toISOString(),
            },
          ],
          count: 1,
        });
      }),
      http.get(/.*\/api\/feed\/posts\/1\/comments\/$/, () => {
        return HttpResponse.json({
          results: [
            {
              id: 1,
              text: 'First comment',
              author_user: 'user2',
              author_person_name: 'User Two',
              created_at: new Date().toISOString(),
            },
          ],
          count: 1,
        });
      })
    );

    renderWithProviders(<Feed />, {
      initialEntries: ['/feed'],
    });

    await waitFor(() => {
      expect(screen.getByText('Test post')).toBeInTheDocument();
    });

    const expandButton = screen.getByText(/view comment/i);
    await user.click(expandButton);

    await waitFor(() => {
      expect(screen.getByText('First comment')).toBeInTheDocument();
    });
  });

  it('should create comment and update list immediately', async () => {
    const user = userEvent.setup();

    server.use(
      http.get(/.*\/api\/feed\/$/, () => {
        return HttpResponse.json({
          results: [
            {
              id: 1,
              type: 'POST',
              text: 'Test post',
              author_user: 'user1',
              author_person_id: 123,
              created_at: new Date().toISOString(),
            },
          ],
          count: 1,
        });
      }),
      http.get(/.*\/api\/feed\/posts\/1\/comments\/$/, () => {
        return HttpResponse.json({
          results: [],
          count: 0,
        });
      }),
      http.post(/.*\/api\/feed\/posts\/1\/comments\/$/, async ({ request }) => {
        const body = await request.json();
        return HttpResponse.json({
          id: 1,
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
      expect(screen.getByText('Test post')).toBeInTheDocument();
    });

    const expandButton = screen.getByText(/view comment/i);
    await user.click(expandButton);

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/write a comment/i)).toBeInTheDocument();
    });

    const input = screen.getByPlaceholderText(/write a comment/i);
    const sendButton = screen.getByRole('button', { name: /send/i });

    await user.type(input, 'New comment');
    await user.click(sendButton);

    // Comment should appear immediately (optimistic update)
    await waitFor(() => {
      expect(screen.getByText('New comment')).toBeInTheDocument();
    });
  });

  it('should show comments on POST cards', async () => {
    server.use(
      http.get(/.*\/api\/feed\/$/, () => {
        return HttpResponse.json({
          results: [
            {
              id: 1,
              type: 'POST',
              text: 'Test post',
              author_user: 'user1',
              author_person_id: 123,
              created_at: new Date().toISOString(),
            },
          ],
          count: 1,
        });
      }),
      http.get(/.*\/api\/feed\/posts\/1\/comments\/$/, () => {
        return HttpResponse.json({
          results: [
            {
              id: 1,
              text: 'Comment on post',
              author_user: 'user2',
              created_at: new Date().toISOString(),
            },
          ],
          count: 1,
        });
      })
    );

    renderWithProviders(<Feed />, {
      initialEntries: ['/feed'],
    });

    await waitFor(() => {
      expect(screen.getByText('Test post')).toBeInTheDocument();
    });

    // Comments section should be available
    expect(screen.getByText(/view comment/i)).toBeInTheDocument();
  });

  it('should hide comments on MESSAGE items', async () => {
    server.use(
      http.get(/.*\/api\/feed\/$/, () => {
        return HttpResponse.json({
          results: [
            {
              id: 1,
              type: 'MESSAGE',
              text: 'Test message',
              author_user: 'user1',
              author_person_id: 123,
              created_at: new Date().toISOString(),
            },
          ],
          count: 1,
        });
      })
    );

    renderWithProviders(<Feed />, {
      initialEntries: ['/feed'],
    });

    await waitFor(() => {
      expect(screen.getByText('Test message')).toBeInTheDocument();
    });

    // Comments section should NOT be available for MESSAGE
    expect(screen.queryByText(/view comment/i)).not.toBeInTheDocument();
  });
});

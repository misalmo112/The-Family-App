import { describe, it, expect, beforeAll, afterEach, afterAll, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server } from './msw/server.js';
import { renderWithProviders } from './test-utils.jsx';
import PersonProfile from '../../pages/PersonProfile';

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

describe('PersonProfile Integration', () => {
  beforeEach(() => {
    localStorage.setItem('token', 'mock-token');
    localStorage.setItem('activeFamilyId', '1');
  });

  it('should show toggle when viewing own profile', async () => {
    server.use(
      http.get(/.*\/api\/feed\/$/, ({ request }) => {
        const url = new URL(request.url);
        const scope = url.searchParams.get('scope');
        
        if (scope === 'all_families') {
          // Author check succeeds
          return HttpResponse.json({
            results: [],
            count: 0,
          });
        }
        
        return HttpResponse.json({
          results: [
            {
              id: 1,
              type: 'POST',
              text: 'My post',
              author_user: 'testuser',
              author_person_id: 123,
              created_at: new Date().toISOString(),
            },
          ],
          count: 1,
        });
      })
    );

    renderWithProviders(<PersonProfile />, {
      initialEntries: ['/people/123'],
    });

    await waitFor(() => {
      expect(screen.getByText(/all families/i)).toBeInTheDocument();
    });
  });

  it('should not show toggle when viewing other person profile', async () => {
    server.use(
      http.get(/.*\/api\/feed\/$/, ({ request }) => {
        const url = new URL(request.url);
        const scope = url.searchParams.get('scope');
        
        if (scope === 'all_families') {
          // Author check fails
          return HttpResponse.json(
            { error: 'Not authorized' },
            { status: 403 }
          );
        }
        
        return HttpResponse.json({
          results: [
            {
              id: 1,
              type: 'POST',
              text: 'Other person post',
              author_user: 'otheruser',
              author_person_id: 456,
              created_at: new Date().toISOString(),
            },
          ],
          count: 1,
        });
      })
    );

    renderWithProviders(<PersonProfile />, {
      initialEntries: ['/people/456'],
    });

    await waitFor(() => {
      expect(screen.queryByText(/all families/i)).not.toBeInTheDocument();
    });
  });

  it('should fetch across families when toggle is enabled', async () => {
    const user = userEvent.setup();

    server.use(
      http.get(/.*\/api\/feed\/$/, ({ request }) => {
        const url = new URL(request.url);
        const scope = url.searchParams.get('scope');
        
        if (scope === 'all_families') {
          // Author check
          if (url.searchParams.get('author_person_id') === '123' && !url.searchParams.get('type')) {
            return HttpResponse.json({
              results: [],
              count: 0,
            });
          }
          // All families view
          return HttpResponse.json({
            results: [
              {
                id: 1,
                type: 'POST',
                text: 'Post in family 1',
                author_user: 'testuser',
                author_person_id: 123,
                family_name: 'Family 1',
                created_at: new Date().toISOString(),
              },
              {
                id: 2,
                type: 'POST',
                text: 'Post in family 2',
                author_user: 'testuser',
                author_person_id: 123,
                family_name: 'Family 2',
                created_at: new Date().toISOString(),
              },
            ],
            count: 2,
          });
        }
        
        return HttpResponse.json({
          results: [
            {
              id: 1,
              type: 'POST',
              text: 'Post in family 1',
              author_user: 'testuser',
              author_person_id: 123,
              created_at: new Date().toISOString(),
            },
          ],
          count: 1,
        });
      })
    );

    renderWithProviders(<PersonProfile />, {
      initialEntries: ['/people/123'],
    });

    await waitFor(() => {
      expect(screen.getByText(/all families/i)).toBeInTheDocument();
    });

    const toggle = screen.getByRole('checkbox');
    await user.click(toggle);

    await waitFor(() => {
      expect(screen.getByText('Family 1')).toBeInTheDocument();
      expect(screen.getByText('Family 2')).toBeInTheDocument();
    });
  });

  it('should show 403 error for non-member access', async () => {
    server.use(
      http.get(/.*\/api\/feed\/$/, ({ request }) => {
        const url = new URL(request.url);
        const scope = url.searchParams.get('scope');
        
        if (scope === 'all_families') {
          return HttpResponse.json(
            { error: 'Not authorized' },
            { status: 403 }
          );
        }
        
        return HttpResponse.json(
          { error: 'You are not a member of this family' },
          { status: 403 }
        );
      })
    );

    renderWithProviders(<PersonProfile />, {
      initialEntries: ['/people/999'],
    });

    await waitFor(() => {
      expect(screen.getByText(/not a member of this family/i)).toBeInTheDocument();
    });
  });
});

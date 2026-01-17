import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import PersonProfile from '../../pages/PersonProfile';
import { getFeed } from '../../services/feed';
import { useFamily } from '../../context/FamilyContext';

// Mock dependencies
vi.mock('../../services/feed', () => ({
  getFeed: vi.fn(),
}));

vi.mock('../../context/FamilyContext', () => ({
  useFamily: vi.fn(),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: () => ({ personId: '123' }),
    useNavigate: () => vi.fn(),
    Link: ({ children, to, ...props }) => <a href={to} {...props}>{children}</a>,
  };
});

// Mock PageTransition
vi.mock('../../components/PageTransition', () => ({
  default: ({ children }) => <div>{children}</div>,
}));

describe('PersonProfile Component', () => {
  const mockUseFamily = {
    activeFamilyId: 1,
    activeFamilyName: 'Test Family',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    useFamily.mockReturnValue(mockUseFamily);
  });

  const renderPersonProfile = () => {
    return render(
      <MemoryRouter>
        <PersonProfile />
      </MemoryRouter>
    );
  };

  describe('Loading states', () => {
    it('should render loading state initially', () => {
      // Mock checking author status
      getFeed.mockImplementation((params) => {
        if (params.scope === 'all_families') {
          return Promise.resolve({ results: [], count: 0 });
        }
        return new Promise(() => {}); // Never resolves to show loading
      });

      renderPersonProfile();
      // Should show MUI skeletons while loading
      expect(document.querySelectorAll('.MuiSkeleton-root').length).toBeGreaterThan(0);
    });

    it('should fetch posts on mount', async () => {
      const mockPosts = {
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
      };

      // Mock author check (scope=all_families)
      getFeed.mockImplementation((params) => {
        if (params.scope === 'all_families') {
          return Promise.resolve({ results: [], count: 0 });
        }
        return Promise.resolve(mockPosts);
      });

      renderPersonProfile();

      await waitFor(() => {
        expect(getFeed).toHaveBeenCalled();
      });
    });
  });

  describe('Posts display', () => {
    it('should display posts for person', async () => {
      const mockPosts = {
        results: [
          {
            id: 1,
            type: 'POST',
            text: 'Test post',
            author_user: 'user1',
            author_person_id: 123,
            author_person_name: 'User One',
            created_at: new Date().toISOString(),
          },
        ],
        count: 1,
      };

      getFeed.mockImplementation((params) => {
        if (params.scope === 'all_families') {
          return Promise.resolve({ results: [], count: 0 });
        }
        return Promise.resolve(mockPosts);
      });

      renderPersonProfile();

      await waitFor(() => {
        expect(screen.getByText('Test post')).toBeInTheDocument();
      });
    });

    it('should show empty state when no posts', async () => {
      const mockPosts = {
        results: [],
        count: 0,
      };

      getFeed.mockImplementation((params) => {
        if (params.scope === 'all_families') {
          return Promise.resolve({ results: [], count: 0 });
        }
        return Promise.resolve(mockPosts);
      });

      renderPersonProfile();

      await waitFor(() => {
        expect(screen.getByText(/no posts yet/i)).toBeInTheDocument();
      });
    });
  });

  describe('All Families toggle', () => {
    it('should show toggle only for author', async () => {
      const mockPosts = {
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
      };

      // Mock author check - succeeds (user is author)
      getFeed.mockImplementation((params) => {
        if (params.scope === 'all_families') {
          return Promise.resolve(mockPosts); // Author check succeeds
        }
        return Promise.resolve(mockPosts);
      });

      renderPersonProfile();

      await waitFor(() => {
        expect(screen.getAllByText(/all families/i).length).toBeGreaterThan(0);
      });
    });

    it('should not show toggle for non-author', async () => {
      const mockPosts = {
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
      };

      // Mock author check - fails (user is not author)
      getFeed.mockImplementation((params) => {
        if (params.scope === 'all_families') {
          return Promise.reject({
            response: { status: 403, data: { error: 'Not authorized' } },
          });
        }
        return Promise.resolve(mockPosts);
      });

      renderPersonProfile();

      await waitFor(() => {
        expect(screen.queryAllByText(/all families/i)).toHaveLength(0);
      });
    });

    it('should toggle between single family and all families', async () => {
      const user = userEvent.setup();
      const mockPosts = {
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
      };

      // Mock author check - succeeds
      getFeed.mockImplementation((params) => {
        if (params.scope === 'all_families') {
          return Promise.resolve(mockPosts);
        }
        return Promise.resolve(mockPosts);
      });

      renderPersonProfile();

      await waitFor(() => {
        expect(screen.getAllByText(/all families/i).length).toBeGreaterThan(0);
      });

      const toggle = screen.getAllByLabelText(/all families/i)[0];
      await user.click(toggle);

      await waitFor(() => {
        expect(getFeed).toHaveBeenCalledWith(
          expect.objectContaining({
            scope: 'all_families',
          })
        );
      });
    });

    it('should display family labels when viewing all families', async () => {
      const user = userEvent.setup();
      const mockPostsAllFamilies = {
        results: [
          {
            id: 1,
            type: 'POST',
            text: 'Test post',
            author_user: 'user1',
            author_person_id: 123,
            family_name: 'Family 1',
            created_at: new Date().toISOString(),
          },
        ],
        count: 1,
      };

      getFeed.mockImplementation((params) => {
        if (params.scope === 'all_families') {
          return Promise.resolve(mockPostsAllFamilies);
        }
        return Promise.resolve({
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
      });

      renderPersonProfile();

      await waitFor(() => {
        expect(screen.getAllByText(/all families/i).length).toBeGreaterThan(0);
      });

      const toggle = screen.getAllByLabelText(/all families/i)[0];
      await user.click(toggle);

      await waitFor(() => {
        expect(screen.getAllByText('Family 1').length).toBeGreaterThan(0);
      });
    });
  });

  describe('Error handling', () => {
    it('should handle 403 error (non-member)', async () => {
      getFeed.mockImplementation((params) => {
        if (params.scope === 'all_families') {
          return Promise.reject({
            response: { status: 403, data: { error: 'Not authorized' } },
          });
        }
        return Promise.reject({
          response: {
            status: 403,
            data: { error: 'You are not a member of this family' },
          },
        });
      });

      renderPersonProfile();

      await waitFor(() => {
        expect(
          screen.getByText(/not a member of this family/i)
        ).toBeInTheDocument();
      });
    });

    it('should handle 404 error (person not found)', async () => {
      getFeed.mockImplementation((params) => {
        if (params.scope === 'all_families') {
          return Promise.reject({
            response: { status: 403, data: { error: 'Not authorized' } },
          });
        }
        return Promise.reject({
          response: {
            status: 404,
            data: { error: 'Person not found' },
          },
        });
      });

      renderPersonProfile();

      await waitFor(() => {
        expect(screen.getByText(/person not found/i)).toBeInTheDocument();
      });
    });

    it('should handle network errors', async () => {
      getFeed.mockImplementation((params) => {
        if (params.scope === 'all_families') {
          return Promise.reject({
            response: { status: 403, data: { error: 'Not authorized' } },
          });
        }
        return Promise.reject(new Error('Network error'));
      });

      renderPersonProfile();

      await waitFor(() => {
        expect(screen.getByText(/network error/i)).toBeInTheDocument();
      });
    });
  });
});

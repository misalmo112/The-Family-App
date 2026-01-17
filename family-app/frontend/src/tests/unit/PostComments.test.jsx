import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import PostComments from '../../components/PostComments';
import { getComments, createComment } from '../../services/feed';

// Mock the feed service
vi.mock('../../services/feed', () => ({
  getComments: vi.fn(),
  createComment: vi.fn(),
}));

describe('PostComments Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderPostComments = (props = {}) => {
    const defaultProps = {
      postId: 1,
      postType: 'POST',
      ...props,
    };
    return render(
      <MemoryRouter>
        <PostComments {...defaultProps} />
      </MemoryRouter>
    );
  };

  describe('Type validation', () => {
    it('should render null for MESSAGE type posts', () => {
      const { container } = renderPostComments({ postType: 'MESSAGE' });
      expect(container.firstChild).toBeNull();
    });

    it('should render comments section for POST type', () => {
      renderPostComments({ postType: 'POST' });
      expect(screen.getAllByText(/view comment/i)[0]).toBeInTheDocument();
    });

    it('should render comments section for ANNOUNCEMENT type', () => {
      renderPostComments({ postType: 'ANNOUNCEMENT' });
      expect(screen.getAllByText(/view comment/i)[0]).toBeInTheDocument();
    });
  });

  describe('Lazy loading', () => {
    it('should not fetch comments on initial render', () => {
      renderPostComments();
      expect(getComments).not.toHaveBeenCalled();
    });

    it('should fetch comments when expanded', async () => {
      const mockComments = {
        results: [
          {
            id: 1,
            text: 'First comment',
            author_user: 'user1',
            author_person_name: 'User One',
            created_at: new Date().toISOString(),
          },
        ],
        count: 1,
      };
      getComments.mockResolvedValue(mockComments);

      renderPostComments();
      const expandButton = screen.getAllByText(/view comment/i)[0];
      await userEvent.click(expandButton);

      await waitFor(() => {
        expect(getComments).toHaveBeenCalledWith(1, 1);
      });
    });

    it('should display loading state while fetching', async () => {
      // Create a promise that we can control
      let resolvePromise;
      const promise = new Promise((resolve) => {
        resolvePromise = resolve;
      });
      getComments.mockReturnValue(promise);

      renderPostComments();
      const expandButton = screen.getAllByText(/view comment/i)[0];
      await userEvent.click(expandButton);

      // Should show loading indicator
      expect(screen.getByRole('progressbar')).toBeInTheDocument();

      // Resolve the promise
      resolvePromise({
        results: [],
        count: 0,
      });

      await waitFor(() => {
        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
      });
    });
  });

  describe('Comments display', () => {
    it('should display comment count when collapsed', async () => {
      const mockComments = {
        results: [
          {
            id: 1,
            text: 'First comment',
            author_user: 'user1',
            author_person_name: 'User One',
            created_at: new Date().toISOString(),
          },
          {
            id: 2,
            text: 'Second comment',
            author_user: 'user2',
            author_person_name: 'User Two',
            created_at: new Date().toISOString(),
          },
        ],
        count: 2,
      };
      getComments.mockResolvedValue(mockComments);

      renderPostComments();
      const expandButton = screen.getAllByText(/view comment/i)[0];
      await userEvent.click(expandButton);

      await waitFor(() => {
        // While expanded, button label is "Hide Comments". Collapse to see count.
        expect(screen.getAllByText(/hide comments/i)[0]).toBeInTheDocument();
      });

      // Collapse and verify count shows on the button label
      await userEvent.click(screen.getAllByText(/hide comments/i)[0]);
      await waitFor(() => {
        expect(screen.getAllByText(/2 comments/i)[0]).toBeInTheDocument();
      });
    });

    it('should display comments list with author info', async () => {
      const mockComments = {
        results: [
          {
            id: 1,
            text: 'First comment',
            author_user: 'user1',
            author_person_name: 'User One',
            author_person_id: 10,
            created_at: new Date().toISOString(),
          },
        ],
        count: 1,
      };
      getComments.mockResolvedValue(mockComments);

      renderPostComments();
      const expandButton = screen.getAllByText(/view comment/i)[0];
      await userEvent.click(expandButton);

      await waitFor(() => {
        expect(screen.getByText('First comment')).toBeInTheDocument();
        expect(screen.getByText('User One')).toBeInTheDocument();
      });
    });

    it('should handle empty comments state', async () => {
      const mockComments = {
        results: [],
        count: 0,
      };
      getComments.mockResolvedValue(mockComments);

      renderPostComments();
      const expandButton = screen.getAllByText(/view comment/i)[0];
      await userEvent.click(expandButton);

      await waitFor(() => {
        expect(screen.getByText(/no comments yet/i)).toBeInTheDocument();
      });
    });
  });

  describe('Comment creation', () => {
    it('should submit new comment successfully', async () => {
      const user = userEvent.setup();
      const mockComments = {
        results: [],
        count: 0,
      };
      const mockNewComment = {
        id: 1,
        text: 'New comment',
        author_user: 'user1',
        author_person_name: 'User One',
        created_at: new Date().toISOString(),
      };

      getComments.mockResolvedValue(mockComments);
      createComment.mockResolvedValue(mockNewComment);

      renderPostComments();
      const expandButtons = screen.getAllByText(/view comment/i);
      const expandButton = expandButtons[0];
      await user.click(expandButton);

      await waitFor(() => {
        expect(screen.getAllByPlaceholderText(/write a comment/i).length).toBeGreaterThan(0);
      });

      const input = screen.getAllByPlaceholderText(/write a comment/i)[0];
      const sendButtons = screen.getAllByRole('button');
      const sendButton =
        sendButtons.find(
          (btn) =>
            btn.querySelector('[data-testid="SendIcon"]') ||
            btn.querySelector('svg[data-testid="SendIcon"]') ||
            btn.getAttribute('type') === 'submit'
        ) || screen.getByRole('button', { name: /send/i });

      await user.type(input, 'New comment');
      await user.click(sendButton);

      await waitFor(() => {
        expect(createComment).toHaveBeenCalledWith(1, 'New comment');
        expect(screen.getByText('New comment')).toBeInTheDocument();
      });
    });

    it('should clear input after successful submission', async () => {
      const user = userEvent.setup();
      const mockComments = {
        results: [],
        count: 0,
      };
      const mockNewComment = {
        id: 1,
        text: 'New comment',
        author_user: 'user1',
        created_at: new Date().toISOString(),
      };

      getComments.mockResolvedValue(mockComments);
      createComment.mockResolvedValue(mockNewComment);

      renderPostComments();
      const expandButtons = screen.getAllByText(/view comment/i);
      const expandButton = expandButtons[0];
      await user.click(expandButton);

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/write a comment/i)).toBeInTheDocument();
      });

      const input = screen.getByPlaceholderText(/write a comment/i);
      const sendButtons = screen.getAllByRole('button');
      const sendButton =
        sendButtons.find(
          (btn) =>
            btn.querySelector('[data-testid="SendIcon"]') ||
            btn.querySelector('svg[data-testid="SendIcon"]') ||
            btn.getAttribute('type') === 'submit'
        ) || screen.getByRole('button', { name: /send/i });

      await user.type(input, 'New comment');
      await user.click(sendButton);

      await waitFor(() => {
        expect(input.value).toBe('');
      });
    });

    it('should show error on comment creation failure', async () => {
      const user = userEvent.setup();
      const mockComments = {
        results: [],
        count: 0,
      };
      const mockError = {
        response: {
          status: 403,
          data: { error: 'Comments are not allowed on MESSAGE type posts' },
        },
      };

      getComments.mockResolvedValue(mockComments);
      createComment.mockRejectedValue(mockError);

      renderPostComments();
      const expandButtons = screen.getAllByText(/view comment/i);
      const expandButton = expandButtons[0];
      await user.click(expandButton);

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/write a comment/i)).toBeInTheDocument();
      });

      const input = screen.getByPlaceholderText(/write a comment/i);
      const sendButtons = screen.getAllByRole('button');
      const sendButton =
        sendButtons.find(
          (btn) =>
            btn.querySelector('[data-testid="SendIcon"]') ||
            btn.querySelector('svg[data-testid="SendIcon"]') ||
            btn.getAttribute('type') === 'submit'
        ) || screen.getByRole('button', { name: /send/i });

      await user.type(input, 'New comment');
      await user.click(sendButton);

      await waitFor(() => {
        // Component maps 403 to a generic message
        expect(screen.getByText(/not authorized to comment/i)).toBeInTheDocument();
      });
    });

    it('should disable submit button when text is empty', async () => {
      const mockComments = {
        results: [],
        count: 0,
      };
      getComments.mockResolvedValue(mockComments);

      renderPostComments();
      const expandButton = screen.getAllByText(/view comment/i)[0];
      await userEvent.click(expandButton);

      await waitFor(() => {
        const sendButtons = screen.getAllByRole('button');
        const sendButton = sendButtons.find(btn => 
          btn.querySelector('[data-testid="SendIcon"]') || 
          btn.querySelector('svg[data-testid="SendIcon"]') ||
          btn.getAttribute('type') === 'submit'
        );
        expect(sendButton).toBeDisabled();
      });
    });

    it('should show optimistic update - comment appears immediately', async () => {
      const user = userEvent.setup();
      const mockComments = {
        results: [],
        count: 0,
      };
      const mockNewComment = {
        id: 1,
        text: 'New comment',
        author_user: 'user1',
        author_person_name: 'User One',
        created_at: new Date().toISOString(),
      };

      getComments.mockResolvedValue(mockComments);
      createComment.mockResolvedValue(mockNewComment);

      renderPostComments();
      const expandButtons = screen.getAllByText(/view comment/i);
      const expandButton = expandButtons[0];
      await user.click(expandButton);

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/write a comment/i)).toBeInTheDocument();
      });

      const input = screen.getByPlaceholderText(/write a comment/i);
      const sendButtons = screen.getAllByRole('button');
      const sendButton =
        sendButtons.find(
          (btn) =>
            btn.querySelector('[data-testid="SendIcon"]') ||
            btn.querySelector('svg[data-testid="SendIcon"]') ||
            btn.getAttribute('type') === 'submit'
        ) || screen.getByRole('button', { name: /send/i });

      await user.type(input, 'New comment');
      await user.click(sendButton);

      // Comment should appear immediately (optimistic update)
      await waitFor(() => {
        expect(screen.getByText('New comment')).toBeInTheDocument();
      }, { timeout: 1000 });
    });
  });

  describe('Expand/collapse', () => {
    it('should toggle between expanded and collapsed states', async () => {
      const user = userEvent.setup();
      const mockComments = {
        results: [],
        count: 0,
      };
      getComments.mockResolvedValue(mockComments);

      renderPostComments();
      // Use getAllByText and take first if multiple exist
      const expandButtons = screen.getAllByText(/view comment/i);
      const expandButton = expandButtons[0];

      // Initially collapsed
      expect(screen.queryAllByPlaceholderText(/write a comment/i)).toHaveLength(0);

      // Expand
      await user.click(expandButton);
      await waitFor(() => {
        expect(screen.getByText(/hide comments/i)).toBeInTheDocument();
        expect(screen.getByPlaceholderText(/write a comment/i)).toBeInTheDocument();
      });

      // Collapse
      const collapseButton = screen.getByText(/hide comments/i);
      await user.click(collapseButton);
      await waitFor(() => {
        expect(screen.queryAllByPlaceholderText(/write a comment/i)).toHaveLength(0);
      });
    });
  });
});

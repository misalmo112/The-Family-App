import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import Feed from '../../pages/Feed/index.jsx';
import { getFeed, createPost } from '../../services/feed';
import { useFamily } from '../../context/FamilyContext';

// Mock dependencies
vi.mock('../../services/feed', () => ({
  getFeed: vi.fn(),
  createPost: vi.fn(),
}));

vi.mock('../../context/FamilyContext', () => ({
  useFamily: vi.fn(),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => vi.fn(),
    Link: ({ children, to, ...props }) => <a href={to} {...props}>{children}</a>,
  };
});

// Mock PageTransition
vi.mock('../../components/PageTransition', () => ({
  default: ({ children }) => <div>{children}</div>,
}));

vi.mock('../../components/Loading/SkeletonPost', () => ({
  SkeletonPostList: () => <div data-testid="skeleton">Loading...</div>,
}));

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

describe('Feed Component', () => {
  const mockUseFamily = {
    activeFamilyId: 1,
    activeFamilyName: 'Test Family',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    useFamily.mockReturnValue(mockUseFamily);
  });

  const renderFeed = () => {
    // Ensure activeFamilyId is set in context
    useFamily.mockReturnValue(mockUseFamily);
    return render(
      <MemoryRouter>
        <Feed />
      </MemoryRouter>
    );
  };

  describe('Timeline rendering', () => {
    it('should render MessageBubble for MESSAGE type', async () => {
      const mockPosts = {
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
      };
      getFeed.mockResolvedValue(mockPosts);

      renderFeed();

      await waitFor(() => {
        expect(screen.getByText('Test message')).toBeInTheDocument();
      });
    });

    it('should render PostCard for POST type', async () => {
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
      getFeed.mockResolvedValue(mockPosts);

      renderFeed();

      await waitFor(() => {
        expect(screen.getByText('Test post')).toBeInTheDocument();
        expect(screen.getByText('POST')).toBeInTheDocument();
      });
    });

    it('should render AnnouncementCard for ANNOUNCEMENT type', async () => {
      const mockPosts = {
        results: [
          {
            id: 1,
            type: 'ANNOUNCEMENT',
            text: 'Test announcement',
            author_user: 'user1',
            author_person_id: 123,
            created_at: new Date().toISOString(),
          },
        ],
        count: 1,
      };
      getFeed.mockResolvedValue(mockPosts);

      renderFeed();

      await waitFor(() => {
        expect(screen.getByText('Test announcement')).toBeInTheDocument();
        expect(screen.getByText('ANNOUNCEMENT')).toBeInTheDocument();
      });
    });
  });

  describe('Composer', () => {
    it('should default to MESSAGE type', async () => {
      getFeed.mockResolvedValue({ results: [], count: 0 });

      renderFeed();

      // Wait for feed to finish loading and composer to render
      // The composer should be visible even when feed is empty
      await waitFor(() => {
        expect(getFeed).toHaveBeenCalled();
        // Composer should render after loading completes
        expect(screen.getByPlaceholderText(/type a message/i)).toBeInTheDocument();
      }, { timeout: 3000 });
    });

    it('should toggle between MESSAGE and POST', async () => {
      const user = userEvent.setup();
      getFeed.mockResolvedValue({ results: [], count: 0 });

      renderFeed();

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/type a message/i)).toBeInTheDocument();
      });

      // Find the POST toggle button - ToggleButtonGroup contains buttons
      const postButton = screen.getByText(/post/i).closest('button');
      if (postButton) {
        await user.click(postButton);
      } else {
        // Try finding by role - ToggleButton has button role
        const buttons = screen.getAllByRole('button');
        const postBtn = buttons.find(btn => btn.textContent?.toLowerCase().includes('post'));
        if (postBtn) await user.click(postBtn);
      }

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/write a post/i)).toBeInTheDocument();
      });
    });

    it('should create MESSAGE when submitted', async () => {
      const user = userEvent.setup();
      const mockNewPost = {
        id: 1,
        type: 'MESSAGE',
        text: 'New message',
        author_user: 'user1',
        created_at: new Date().toISOString(),
      };

      getFeed.mockResolvedValue({ results: [], count: 0 });
      createPost.mockResolvedValue(mockNewPost);

      renderFeed();

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/type a message/i)).toBeInTheDocument();
      });

      const input = screen.getByPlaceholderText(/type a message/i);
      // Find send button - it's an IconButton with Send icon
      const sendButtons = screen.getAllByRole('button');
      const sendButton = sendButtons.find(btn => 
        btn.querySelector('[data-testid="SendIcon"]') || 
        btn.querySelector('svg[data-testid="SendIcon"]')
      ) || screen.getByRole('button', { name: /send/i });

      await user.type(input, 'New message');
      await user.click(sendButton);

      await waitFor(() => {
        expect(createPost).toHaveBeenCalledWith({
          familyId: 1,
          type: 'MESSAGE',
          text: 'New message',
          imageUrl: undefined,
        });
      });
    });

    it('should create POST when submitted', async () => {
      const user = userEvent.setup();
      const mockNewPost = {
        id: 1,
        type: 'POST',
        text: 'New post',
        author_user: 'user1',
        created_at: new Date().toISOString(),
      };

      getFeed.mockResolvedValue({ results: [], count: 0 });
      createPost.mockResolvedValue(mockNewPost);

      renderFeed();

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/type a message/i)).toBeInTheDocument();
      });

      // Switch to POST - find button containing "Post" text
      const postButton = screen.getByText(/post/i).closest('button');
      if (postButton) {
        await user.click(postButton);
      }

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/write a post/i)).toBeInTheDocument();
      });

      const input = screen.getByPlaceholderText(/write a post/i);
      const sendButtons = screen.getAllByRole('button');
      const sendButton = sendButtons.find(btn => 
        btn.querySelector('[data-testid="SendIcon"]') || 
        btn.querySelector('svg[data-testid="SendIcon"]')
      ) || screen.getByRole('button', { name: /send/i });

      await user.type(input, 'New post');
      await user.click(sendButton);

      await waitFor(() => {
        expect(createPost).toHaveBeenCalledWith({
          familyId: 1,
          type: 'POST',
          text: 'New post',
          imageUrl: undefined,
        });
      });
    });

    it('should show error on composer failure', async () => {
      const user = userEvent.setup();
      const mockError = {
        response: {
          status: 403,
          data: { error: 'Not authorized' },
        },
      };

      getFeed.mockResolvedValue({ results: [], count: 0 });
      createPost.mockRejectedValue(mockError);

      renderFeed();

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/type a message/i)).toBeInTheDocument();
      });

      const input = screen.getByPlaceholderText(/type a message/i);
      const sendButtons = screen.getAllByRole('button');
      const sendButton = sendButtons.find(btn => 
        btn.querySelector('[data-testid="SendIcon"]') || 
        btn.querySelector('svg[data-testid="SendIcon"]')
      ) || screen.getByRole('button', { name: /send/i });

      await user.type(input, 'New message');
      await user.click(sendButton);

      await waitFor(() => {
        expect(screen.getByText(/not authorized/i)).toBeInTheDocument();
      });
    });

    it('should clear composer after successful submit', async () => {
      const user = userEvent.setup();
      const mockNewPost = {
        id: 1,
        type: 'MESSAGE',
        text: 'New message',
        author_user: 'user1',
        created_at: new Date().toISOString(),
      };

      getFeed.mockResolvedValue({ results: [], count: 0 });
      createPost.mockResolvedValue(mockNewPost);

      renderFeed();

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/type a message/i)).toBeInTheDocument();
      });

      const input = screen.getByPlaceholderText(/type a message/i);
      const sendButtons = screen.getAllByRole('button');
      const sendButton = sendButtons.find(btn => 
        btn.querySelector('[data-testid="SendIcon"]') || 
        btn.querySelector('svg[data-testid="SendIcon"]')
      ) || screen.getByRole('button', { name: /send/i });

      await user.type(input, 'New message');
      await user.click(sendButton);

      await waitFor(() => {
        expect(input.value).toBe('');
      });
    });

    it('should refresh feed after composer submit (optimistic update)', async () => {
      const user = userEvent.setup();
      const mockNewPost = {
        id: 1,
        type: 'MESSAGE',
        text: 'New message',
        author_user: 'user1',
        created_at: new Date().toISOString(),
      };

      getFeed.mockResolvedValue({ results: [], count: 0 });
      createPost.mockResolvedValue(mockNewPost);

      renderFeed();

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/type a message/i)).toBeInTheDocument();
      });

      const input = screen.getByPlaceholderText(/type a message/i);
      const sendButtons = screen.getAllByRole('button');
      const sendButton = sendButtons.find(btn => 
        btn.querySelector('[data-testid="SendIcon"]') || 
        btn.querySelector('svg[data-testid="SendIcon"]')
      ) || screen.getByRole('button', { name: /send/i });

      await user.type(input, 'New message');
      await user.click(sendButton);

      // New post should appear in feed immediately (optimistic update)
      await waitFor(() => {
        expect(screen.getByText('New message')).toBeInTheDocument();
      });
    });
  });
});

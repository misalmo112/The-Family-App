import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getFeed, getComments, createComment } from '../../services/feed';
import api from '../../services/api';

// Mock the api module
vi.mock('../../services/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

describe('Feed Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getFeed', () => {
    it('should call API with only familyId (backward compatibility)', async () => {
      const mockResponse = {
        data: {
          results: [{ id: 1, text: 'Test post' }],
          count: 1,
          page: 1,
        },
      };
      api.get.mockResolvedValue(mockResponse);

      const result = await getFeed({ familyId: 123 });

      expect(api.get).toHaveBeenCalledWith('/api/feed/', {
        params: {
          family_id: 123,
          page: 1,
        },
      });
      expect(result).toEqual(mockResponse.data);
    });

    it('should call API with familyId and page', async () => {
      const mockResponse = {
        data: {
          results: [{ id: 1, text: 'Test post' }],
          count: 1,
          page: 2,
        },
      };
      api.get.mockResolvedValue(mockResponse);

      const result = await getFeed({ familyId: 123, page: 2 });

      expect(api.get).toHaveBeenCalledWith('/api/feed/', {
        params: {
          family_id: 123,
          page: 2,
        },
      });
      expect(result).toEqual(mockResponse.data);
    });

    it('should include type filter when provided', async () => {
      const mockResponse = {
        data: {
          results: [{ id: 1, type: 'POST', text: 'Test post' }],
          count: 1,
        },
      };
      api.get.mockResolvedValue(mockResponse);

      await getFeed({ familyId: 123, type: 'POST' });

      expect(api.get).toHaveBeenCalledWith('/api/feed/', {
        params: {
          family_id: 123,
          page: 1,
          type: 'POST',
        },
      });
    });

    it('should include authorPersonId filter when provided', async () => {
      const mockResponse = {
        data: {
          results: [{ id: 1, author_person_id: 456, text: 'Test post' }],
          count: 1,
        },
      };
      api.get.mockResolvedValue(mockResponse);

      await getFeed({ familyId: 123, authorPersonId: 456 });

      expect(api.get).toHaveBeenCalledWith('/api/feed/', {
        params: {
          family_id: 123,
          page: 1,
          author_person_id: 456,
        },
      });
    });

    it('should include scope parameter when provided', async () => {
      const mockResponse = {
        data: {
          results: [{ id: 1, text: 'Test post' }],
          count: 1,
        },
      };
      api.get.mockResolvedValue(mockResponse);

      await getFeed({ familyId: 123, scope: 'all_families' });

      expect(api.get).toHaveBeenCalledWith('/api/feed/', {
        params: {
          family_id: 123,
          page: 1,
          scope: 'all_families',
        },
      });
    });

    it('should include multiple filters when provided', async () => {
      const mockResponse = {
        data: {
          results: [{ id: 1, type: 'POST', author_person_id: 456, text: 'Test post' }],
          count: 1,
        },
      };
      api.get.mockResolvedValue(mockResponse);

      await getFeed({
        familyId: 123,
        type: 'POST',
        authorPersonId: 456,
        scope: 'all_families',
        page: 2,
      });

      expect(api.get).toHaveBeenCalledWith('/api/feed/', {
        params: {
          family_id: 123,
          page: 2,
          type: 'POST',
          author_person_id: 456,
          scope: 'all_families',
        },
      });
    });

    it('should not include undefined optional params', async () => {
      const mockResponse = {
        data: {
          results: [{ id: 1, text: 'Test post' }],
          count: 1,
        },
      };
      api.get.mockResolvedValue(mockResponse);

      await getFeed({ familyId: 123, type: undefined, authorPersonId: undefined });

      expect(api.get).toHaveBeenCalledWith('/api/feed/', {
        params: {
          family_id: 123,
          page: 1,
        },
      });
    });

    it('should handle paginated response', async () => {
      const mockResponse = {
        data: {
          results: [{ id: 1, text: 'Test post' }],
          count: 1,
          page: 1,
          page_size: 20,
          total_pages: 1,
          has_next: false,
          has_previous: false,
        },
      };
      api.get.mockResolvedValue(mockResponse);

      const result = await getFeed({ familyId: 123 });

      expect(result).toEqual(mockResponse.data);
    });

    it('should handle non-paginated response (array)', async () => {
      const mockResponse = {
        data: [{ id: 1, text: 'Test post' }],
      };
      api.get.mockResolvedValue(mockResponse);

      const result = await getFeed({ familyId: 123 });

      expect(result).toEqual({
        results: [{ id: 1, text: 'Test post' }],
        count: 1,
      });
    });
  });

  describe('getComments', () => {
    it('should fetch comments for a post', async () => {
      const mockResponse = {
        data: {
          results: [
            { id: 1, text: 'First comment', post_id: 123 },
            { id: 2, text: 'Second comment', post_id: 123 },
          ],
          count: 2,
          page: 1,
        },
      };
      api.get.mockResolvedValue(mockResponse);

      const result = await getComments(123);

      expect(api.get).toHaveBeenCalledWith('/api/feed/posts/123/comments/', {
        params: {
          page: 1,
        },
      });
      expect(result).toEqual(mockResponse.data);
    });

    it('should handle pagination', async () => {
      const mockResponse = {
        data: {
          results: [{ id: 1, text: 'Comment', post_id: 123 }],
          count: 10,
          page: 2,
          page_size: 5,
          total_pages: 2,
          has_next: false,
          has_previous: true,
        },
      };
      api.get.mockResolvedValue(mockResponse);

      const result = await getComments(123, 2);

      expect(api.get).toHaveBeenCalledWith('/api/feed/posts/123/comments/', {
        params: {
          page: 2,
        },
      });
      expect(result).toEqual(mockResponse.data);
    });

    it('should handle non-paginated response (array)', async () => {
      const mockResponse = {
        data: [{ id: 1, text: 'Comment', post_id: 123 }],
      };
      api.get.mockResolvedValue(mockResponse);

      const result = await getComments(123);

      expect(result).toEqual({
        results: [{ id: 1, text: 'Comment', post_id: 123 }],
        count: 1,
      });
    });
  });

  describe('createComment', () => {
    it('should create a comment with text only', async () => {
      const mockResponse = {
        data: {
          id: 1,
          post_id: 123,
          text: 'New comment',
          author_user: 'testuser',
        },
      };
      api.post.mockResolvedValue(mockResponse);

      const result = await createComment(123, 'New comment');

      expect(api.post).toHaveBeenCalledWith('/api/feed/posts/123/comments/', {
        text: 'New comment',
      });
      expect(result).toEqual(mockResponse.data);
    });

    it('should create a comment with text and authorPersonId', async () => {
      const mockResponse = {
        data: {
          id: 1,
          post_id: 123,
          text: 'New comment',
          author_person_id: 456,
          author_user: 'testuser',
        },
      };
      api.post.mockResolvedValue(mockResponse);

      const result = await createComment(123, 'New comment', 456);

      expect(api.post).toHaveBeenCalledWith('/api/feed/posts/123/comments/', {
        text: 'New comment',
        author_person_id: 456,
      });
      expect(result).toEqual(mockResponse.data);
    });

    it('should not include authorPersonId when not provided', async () => {
      const mockResponse = {
        data: {
          id: 1,
          post_id: 123,
          text: 'New comment',
        },
      };
      api.post.mockResolvedValue(mockResponse);

      await createComment(123, 'New comment', undefined);

      expect(api.post).toHaveBeenCalledWith('/api/feed/posts/123/comments/', {
        text: 'New comment',
      });
    });

    it('should handle errors', async () => {
      const mockError = {
        response: {
          status: 403,
          data: { error: 'Comments are not allowed on MESSAGE type posts' },
        },
      };
      api.post.mockRejectedValue(mockError);

      await expect(createComment(123, 'New comment')).rejects.toEqual(mockError);
    });
  });
});

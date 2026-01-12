import { http, HttpResponse } from 'msw';

/**
 * MSW request handlers for integration tests
 */

// POST /api/auth/token/ - Authentication endpoint
// Accepts any username/password and returns JWT tokens
export const authHandler = http.post(
  // Match both absolute URL and relative path
  /.*\/api\/auth\/token\/$/,
  async ({ request }) => {
    const body = await request.json();
    
    // Accept any username/password combination
    // Return JWT token response format
    return HttpResponse.json({
      access: 'mock-access-token-12345',
      refresh: 'mock-refresh-token-12345',
    }, { status: 200 });
  }
);

// GET /api/families/ - Get all families for authenticated user
export const familiesHandler = http.get(
  // Match both absolute URL and relative path
  /.*\/api\/families\/$/,
  () => {
    return HttpResponse.json([
      {
        id: 1,
        name: 'K Family',
        code: 'KFAM',
        created_at: '2024-01-01T00:00:00Z',
      },
      {
        id: 2,
        name: 'Rahman Family',
        code: 'RFAM',
        created_at: '2024-01-02T00:00:00Z',
      },
    ], { status: 200 });
  }
);

// GET /api/feed/ - Get feed posts for a family
// Returns paginated response with posts
export const feedHandler = http.get(
  // Match both absolute URL and relative path
  /.*\/api\/feed\/$/,
  ({ request }) => {
    const url = new URL(request.url);
    const familyId = url.searchParams.get('family_id');
    const page = parseInt(url.searchParams.get('page') || '1', 10);
    
    // Generate mock posts - ensure at least one post with recognizable text
    const posts = [
      {
        id: 1,
        family_id: parseInt(familyId, 10),
        family_name: familyId === '1' ? 'K Family' : 'Rahman Family',
        author_user: 'testuser',
        author_person_id: null,
        author_person_name: null,
        type: 'POST',
        text: 'Hello family! This is a test post.',
        image_url: null,
        created_at: new Date().toISOString(),
      },
      {
        id: 2,
        family_id: parseInt(familyId, 10),
        family_name: familyId === '1' ? 'K Family' : 'Rahman Family',
        author_user: 'testuser',
        author_person_id: null,
        author_person_name: null,
        type: 'ANNOUNCEMENT',
        text: 'Family gathering this weekend!',
        image_url: null,
        created_at: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
      },
    ];
    
    const PAGE_SIZE = 20;
    const totalCount = posts.length;
    const totalPages = Math.ceil(totalCount / PAGE_SIZE);
    
    // Return paginated format matching backend response
    return HttpResponse.json({
      results: posts,
      count: totalCount,
      page: page,
      page_size: PAGE_SIZE,
      total_pages: totalPages,
      has_next: page < totalPages,
      has_previous: page > 1,
    }, { status: 200 });
  }
);

// Export all handlers as an array
export const handlers = [authHandler, familiesHandler, feedHandler];

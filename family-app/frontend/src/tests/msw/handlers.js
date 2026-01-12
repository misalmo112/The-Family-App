import { http, HttpResponse } from 'msw';

/**
 * MSW request handlers for MVP endpoints
 * Handlers use regex patterns to match both absolute and relative URLs
 */

// POST /api/auth/token/ - Authentication endpoint
// Accepts any username/password and returns fake tokens
export const authHandler = http.post(
  // Match both absolute URL and relative path
  /.*\/api\/auth\/token\/$/,
  async ({ request }) => {
    const body = await request.json();
    
    // Accept any username/password combination
    // Return fake tokens
    return HttpResponse.json({
      access: 'fake-access',
      refresh: 'fake-refresh',
    });
  }
);

// GET /api/families/ - Get all families for authenticated user
export const familiesHandler = http.get(
  /.*\/api\/families\/$/,
  () => {
    return HttpResponse.json([
      { id: 1, name: 'K Family', code: 'ABC123' },
      { id: 2, name: 'Rahman Family', code: 'XYZ999' },
    ]);
  }
);

// GET /api/feed/ - Get feed posts for a family
// Reads family_id query parameter and returns paginated posts
export const feedHandler = http.get(
  /.*\/api\/feed\/$/,
  ({ request }) => {
    const url = new URL(request.url);
    const familyId = url.searchParams.get('family_id');
    
    // Generate mock posts based on family_id
    // For different family_ids, return different posts
    const posts = [];
    
    if (familyId === '1') {
      posts.push(
        {
          id: 1,
          type: 'POST',
          text: 'Welcome to the K Family feed!',
          created_at: new Date().toISOString(),
        },
        {
          id: 2,
          type: 'ANNOUNCEMENT',
          text: 'Family gathering this weekend!',
          created_at: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
        }
      );
    } else if (familyId === '2') {
      posts.push(
        {
          id: 3,
          type: 'POST',
          text: 'Hello from Rahman Family!',
          created_at: new Date().toISOString(),
        },
        {
          id: 4,
          type: 'POST',
          text: 'Sharing some family news.',
          created_at: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
        }
      );
    } else {
      // Default posts for any other family_id
      posts.push(
        {
          id: 5,
          type: 'POST',
          text: 'Default family post',
          created_at: new Date().toISOString(),
        }
      );
    }
    
    // Return paginated format
    return HttpResponse.json({
      results: posts,
    });
  }
);

// Export all handlers as an array
export const handlers = [authHandler, familiesHandler, feedHandler];

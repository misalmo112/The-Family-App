---
name: Feed+CreatePost Frontend
overview: Implement a working feed page and create-post flow in `family-app/frontend` using the existing `FamilyContext` activeFamilyId and the backend feed endpoints. Wire existing `/feed` and `/post` routes to the new pages so a newly-created post shows up after redirect.
todos:
  - id: add-feed-service
    content: Create `family-app/frontend/src/services/feed.js` with `getFeed` + `createPost` using `src/api/axios.js` and backend endpoints.
    status: completed
  - id: homefeed-page
    content: Create `family-app/frontend/src/pages/HomeFeed/index.jsx` to fetch and display posts (type/text/created_at) for `activeFamilyId`.
    status: completed
  - id: createpost-page
    content: Create `family-app/frontend/src/pages/CreatePost/index.jsx` form and POST submission; navigate to `/feed` on success.
    status: completed
  - id: wire-routes
    content: Update `family-app/frontend/src/pages/Feed.jsx` to render `HomeFeed`, and `family-app/frontend/src/pages/Post.jsx` to render `CreatePost` (keeps `App.jsx` unchanged).
    status: completed
---

### Goal

- Implement **HomeFeed** that calls `GET /api/feed/?family_id=<activeFamilyId>` and renders each post’s **type**, **text**, and **created_at**.
- Implement **CreatePost** that posts to `POST /api/feed/posts/` with `family_id` from `FamilyContext`, then navigates to **`/feed`**.
- Ensure acceptance: **a created post appears in the feed after submit** (via redirect + refetch on mount).

### Key constraints / decisions

- Frontend root is `family-app/frontend/src/`.
- Keep existing router (`/feed`, `/post`) intact by turning the current placeholder pages into thin wrappers that render the new pages, instead of changing route definitions.
  - `App.jsx` routes `/feed` -> `./pages/Feed` and `/post` -> `./pages/Post`:
```1:29:c:\Users\misal\OneDrive\Belgeler\Projects\Github\The-Family-App\family-app\frontend\src\App.jsx
import Feed from './pages/Feed';
import Post from './pages/Post';
// ...
<Route path="feed" element={<Feed />} />
<Route path="post" element={<Post />} />
```

  - `src/pages/Feed.jsx` and `src/pages/Post.jsx` are placeholders today:
```1:16:c:\Users\misal\OneDrive\Belgeler\Projects\Github\The-Family-App\family-app\frontend\src\pages\Feed.jsx
const Feed = () => {
  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Feed
      </Typography>
      <Typography variant="body1">
        Family feed page - coming soon
      </Typography>
    </Box>
  );
};
```


### Implementation approach

- **API layer**: add `src/services/feed.js` using the existing axios instance `src/api/axios.js` (which attaches `localStorage['token']` via interceptor).
  - `getFeed({ familyId, page })` → `GET /api/feed/` with `params: { family_id: familyId, page }`.
  - `createPost({ familyId, type, text, imageUrl })` → `POST /api/feed/posts/` with body `{ family_id, type, text, image_url }`.
  - Handle response shape: feed endpoint returns `{ results: [...] }` (fallback to raw list if needed).

- **HomeFeed page** (`src/pages/HomeFeed/index.jsx`):
  - Read `activeFamilyId` from `useFamily()`.
  - If no active family, navigate to `/families`.
  - On mount and when `activeFamilyId` changes: call `getFeed(...)` and render a list showing `type`, `text`, and `created_at` (format via `new Date(created_at).toLocaleString()`).

- **CreatePost page** (`src/pages/CreatePost/index.jsx`):
  - Controlled form fields:
    - `type` select: `POST | ANNOUNCEMENT`
    - `text` (required)
    - `image_url` (optional)
  - On submit: call `createPost(...)` with `family_id = activeFamilyId`.
  - On success: `navigate('/feed')`.

- **Routing glue (minimal)**:
  - Update `src/pages/Feed.jsx` to render the new `HomeFeed` component (so `/feed` shows the actual feed).
  - Update `src/pages/Post.jsx` to render the new `CreatePost` component (so `/post` becomes the create-post page).

### Test plan

- Log in → select a family → open `/feed` and confirm posts load.
- Go to `/post` → submit a `POST` with text.
- Confirm you land back on `/feed` and the new post appears at/near the top.
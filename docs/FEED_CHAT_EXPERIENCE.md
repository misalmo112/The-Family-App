# Feed Chat Experience - Implementation Documentation

This document defines how to evolve the Feed into a WhatsApp-like family chat
while keeping the existing backend structure and core logic simple.

Key constraints:
- Messages and posts are distinct.
- Only posts show on a person's profile page.
- Comments/replies exist only for posts.
- Announcements are inline.
- Only members of the same family can view a person's posts.

---

## 1) Goals and Product Behavior

### Primary UX
- The family feed feels like a chat timeline (messages stacked by time).
- Users can send short text messages.
- Users can publish long-form posts in the same timeline.
- Announcements are shown inline but visually distinct.

### Person Profile
- A person profile page shows only POSTS made by that person.
- Users can only view posts when both viewer and author belong to the same family.
- If the author belongs to multiple families, the viewer only sees posts made
  inside the currently active family context.
- The author can view all of their own posts across families, with a clear
  family label on each post.

### Comments
- Comments are allowed only on posts and announcements.
- Comments are text-only.

---

## 2) Data Model Changes (Backend)

### Update PostTypeChoices
Current types:
- POST
- ANNOUNCEMENT

Add:
- MESSAGE (short chat message)

### Add Comments Model
Create a new model: `PostComment` in `apps.feed.models`.

Fields:
- post (FK -> Post)
- author_user (FK -> User)
- author_person (FK -> Person, optional)
- text (TextField)
- created_at (DateTime)

Notes:
- Comments are text-only (no image field).
- Restrict comments to PostType POST or ANNOUNCEMENT.

---

## 3) Backend API Changes

### Feed Listing
Endpoint: `GET /api/feed/?family_id=<id>`
Add optional filters:
- `type=MESSAGE|POST|ANNOUNCEMENT`
- `author_person_id=<id>`

Rules:
- Always filter by `family_id`.
- Viewer must be an ACTIVE member of the family.
- If `author_person_id` is provided, ensure it belongs to the same family.
- If used for profile page, also set `type=POST`.
- If the viewer is the same user as the author, allow an optional
  `scope=all_families` mode to return all posts across families; otherwise
  default to the active family only.

### Create Feed Item
Endpoint: `POST /api/feed/posts/`
Payload:
- family_id
- type (MESSAGE, POST, ANNOUNCEMENT)
- text (required)
- image_url only for POST/ANNOUNCEMENT (but not used for MESSAGE)

Rules:
- If type = MESSAGE, ignore/deny image_url.

### Comments
Add endpoints:
- `GET /api/feed/posts/<id>/comments/`
- `POST /api/feed/posts/<id>/comments/`

Rules:
- Viewer must be a family member.
- Post must belong to that family.
- Commenting allowed only on POST or ANNOUNCEMENT.

---

## 4) Backend Code Structure (Where to Implement)

### Models
File: `family-app/backend/apps/feed/models.py`
- Add `MESSAGE` to PostTypeChoices.
- Add `PostComment` model.

### Serializers
File: `family-app/backend/apps/feed/serializers.py`
- Update PostCreateSerializer to allow MESSAGE.
- Add `PostCommentSerializer` and `PostCommentCreateSerializer`.

### Views
File: `family-app/backend/apps/feed/views.py`
- In PostListView, add filtering:
  - `type` param
  - `author_person_id` param
- Add comment views (list + create).

### URLs
File: `family-app/backend/apps/feed/urls.py`
- Add routes for comments.

### Permissions
Use same membership checks as existing feed list/create:
- Must be active member of family.
- author_person must belong to family.

---

## 5) Frontend UX Plan

### Feed (WhatsApp-like)
File: `family-app/frontend/src/pages/Feed/index.jsx` (or a redesign of HomeFeed)
- Render a unified timeline of:
  - MESSAGE as chat bubble.
  - POST as content card.
  - ANNOUNCEMENT as inline banner.
- Keep posts long-form (more padding, title optional in future).

### Composer
Embed a composer at the bottom:
- Default mode: MESSAGE.
- Toggle to POST (long-form).
- Submits via same endpoint with different type.

### Profile Page
New route: `/people/:personId`
- Call `/api/feed/?family_id=<active>&author_person_id=<id>&type=POST`
- Show posts only.
- If person is not in the same family, show error/redirect.
- If the viewer is the same user as the author, optionally allow a toggle to
  "All Families" which uses `scope=all_families` and shows a family label.

### Comments UI
In a POST card:
- Load comments (lazy load, expandable).
- Add text-only comment input.

---

## 6) Access Control and Family Boundaries

Rules enforced on backend:
- Any feed or profile query requires family membership.
- `author_person_id` must belong to same family as `family_id`.
- Comments must belong to posts in the same family.

Frontend should:
- Always include `family_id` from active family context.
- Handle 403 and show a clean “not authorized” message.

---

## 7) Migration and Compatibility

### Migration
- Add migration for `PostComment`.
- Update PostTypeChoices to include MESSAGE.

### Existing data
- Existing posts remain type POST or ANNOUNCEMENT.
- No breaking change for older clients if MESSAGE is optional.

---

## 8) Testing Plan (Backend)

Add tests in `family-app/backend/tests/`:
- Create MESSAGE via feed endpoint.
- Ensure MESSAGE ignores image_url.
- Filter feed by type and author_person_id.
- Profile query returns only POST.
- Comments allowed on POST, blocked on MESSAGE.
- Cross-family access blocked (403).

---

## 9) Future Extensions (Optional)

- Reactions on messages and posts.
- Threaded replies.
- Media comments (not in current scope).

---

## 10) Summary

This plan keeps the backend simple (only a new post type and a comment model),
enables a WhatsApp-like experience with a unified timeline, and ensures family
privacy by enforcing membership checks on all feed and profile views.

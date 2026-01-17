---
name: Add MESSAGE type and PostComment model
overview: Add MESSAGE type to PostTypeChoices, create PostComment model with foreign keys to Post, User, and Person, and update serializers to handle MESSAGE type validation and PostComment serialization.
todos:
  - id: "1"
    content: Add MESSAGE = 'MESSAGE', 'Message' to PostTypeChoices in models.py
    status: completed
  - id: "2"
    content: Add PostComment model with post, author_user, author_person, text, created_at fields
    status: completed
  - id: "3"
    content: Update PostCreateSerializer.validate() to enforce image_url must be null/absent for MESSAGE type
    status: completed
  - id: "4"
    content: Add PostCommentSerializer (read-only ModelSerializer) with all fields
    status: completed
  - id: "5"
    content: Add PostCommentCreateSerializer (write Serializer) with validation for post access and author_person
    status: completed
  - id: "6"
    content: Generate migration using makemigrations command
    status: completed
---

# Add MESSAGE Type and PostComment Model

## Overview
This plan adds a new MESSAGE post type and introduces a PostComment model to enable commenting on posts. The implementation follows the existing feed app structure and maintains simple core logic without extra business logic in views.

## Changes Required

### 1. Update PostTypeChoices in `family-app/backend/apps/feed/models.py`
- Add `MESSAGE = 'MESSAGE', 'Message'` to the `PostTypeChoices` enum
- This will allow posts to be created with type MESSAGE

### 2. Add PostComment Model in `family-app/backend/apps/feed/models.py`
Create a new model with the following fields:
- `post` - ForeignKey to `Post` with `related_name='comments'` and `on_delete=models.CASCADE`
- `author_user` - ForeignKey to `settings.AUTH_USER_MODEL` with `on_delete=models.CASCADE`
- `author_person` - ForeignKey to `'graph.Person'` with `null=True`, `blank=True`, `on_delete=models.SET_NULL`
- `text` - TextField for comment content
- `created_at` - DateTimeField with `auto_now_add=True`
- Meta class with `db_table = 'feed_postcomment'` and ordering by `-created_at`

### 3. Update Serializers in `family-app/backend/apps/feed/serializers.py`

#### 3.1 Update PostCreateSerializer
- Extend the `validate()` method to enforce: if `type == PostTypeChoices.MESSAGE`, then `image_url` must be `None` or absent
- Add validation error: `{"image_url": "MESSAGE type posts cannot have an image_url"}`

#### 3.2 Add PostCommentSerializer (read-only)
- ModelSerializer for PostComment
- Fields: `id`, `post_id`, `author_user` (StringRelatedField), `author_person_id`, `author_person_name` (SerializerMethodField), `text`, `created_at`
- All fields read-only

#### 3.3 Add PostCommentCreateSerializer (write)
- Serializer (not ModelSerializer) for creating comments
- Fields: `post_id` (required), `author_person_id` (optional, nullable), `text` (required)
- Validation:
  - Check user is authenticated
  - Check post exists and user has access to the post's family (via FamilyMembership)
  - If `author_person_id` provided, validate it belongs to the same family as the post
- `create()` method: create PostComment with `author_user=request.user`

### 4. Create Migration
- Run `python manage.py makemigrations feed` to generate migration
- Migration will include:
  - Adding `MESSAGE` choice to Post.type field
  - Creating PostComment model with all fields and relationships
- Expected migration name: `0002_postcomment_and_message_type.py` (or similar based on Django's naming)

## Implementation Details

### Model Structure
```python
class PostComment(models.Model):
    post = models.ForeignKey('feed.Post', on_delete=models.CASCADE, related_name='comments')
    author_user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    author_person = models.ForeignKey('graph.Person', on_delete=models.SET_NULL, null=True, blank=True)
    text = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
```

### Validation Logic
In `PostCreateSerializer.validate()`:
```python
if attrs.get('type') == PostTypeChoices.MESSAGE:
    if attrs.get('image_url'):
        raise serializers.ValidationError(
            {"image_url": "MESSAGE type posts cannot have an image_url"}
        )
```

## Files to Modify

1. `family-app/backend/apps/feed/models.py` - Add MESSAGE choice and PostComment model
2. `family-app/backend/apps/feed/serializers.py` - Update PostCreateSerializer validation and add PostComment serializers
3. `family-app/backend/apps/feed/migrations/0002_*.py` - New migration file (generated)

## Acceptance Criteria Verification

- ✅ MESSAGE can be created with text only (validated in PostCreateSerializer)
- ✅ PostComment model exists with all required fields
- ✅ PostComment serializes correctly with author_user, author_person, text, created_at
- ✅ Migration runs without errors
- ✅ Follows existing code structure in apps.feed
- ✅ No extra business logic in views (validation in serializers only)
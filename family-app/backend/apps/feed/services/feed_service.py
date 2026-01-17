from django.core.exceptions import ValidationError
from apps.feed.models import Post, PostTypeChoices
from apps.families.models import FamilyMembership
from apps.graph.models import Person


def validate_family_membership(user, family_id):
    """
    Validate that a user is an active member of a family.
    
    Args:
        user: User instance
        family_id: Family ID to check
        
    Returns:
        FamilyMembership instance if valid, None otherwise
        
    Raises:
        ValidationError: If user is not a member
    """
    membership = FamilyMembership.objects.filter(
        user=user,
        family_id=family_id,
        status=FamilyMembership.Status.ACTIVE
    ).first()
    
    if not membership:
        raise ValidationError("You are not a member of this family.")
    
    return membership


def validate_person_in_family(person_id, family_id):
    """
    Validate that a person belongs to a specific family.
    
    Args:
        person_id: Person ID to check
        family_id: Family ID to validate against
        
    Returns:
        Person instance if valid
        
    Raises:
        ValidationError: If person doesn't exist or doesn't belong to family
    """
    person = Person.objects.filter(
        id=person_id,
        family_id=family_id
    ).first()
    
    if not person:
        raise ValidationError("Person does not exist in this family.")
    
    return person


def can_view_all_families(user, author_person_id):
    """
    Check if a user can view posts across all families for a given person.
    This is only allowed if the user has an active membership with that person.
    
    Args:
        user: User instance
        author_person_id: Person ID to check
        
    Returns:
        bool: True if user can view all families, False otherwise
    """
    # Check if user has a membership with this person
    membership = FamilyMembership.objects.filter(
        user=user,
        person_id=author_person_id,
        status=FamilyMembership.Status.ACTIVE
    ).first()
    
    return membership is not None


def get_filtered_posts(family_id, user, filters):
    """
    Get filtered posts based on provided filters.
    
    Args:
        family_id: Family ID (can be None if scope=all_families)
        user: User instance making the request
        filters: Dict with keys:
            - type: Optional post type filter
            - author_person_id: Optional person ID filter
            - scope: Optional scope ('all_families' or None)
            
    Returns:
        QuerySet of filtered posts
        
    Raises:
        ValidationError: If validation fails
    """
    post_type = filters.get('type')
    author_person_id = filters.get('author_person_id')
    scope = filters.get('scope')
    
    # Handle scope=all_families
    if scope == 'all_families':
        if not author_person_id:
            raise ValidationError("author_person_id is required when scope=all_families.")
        
        # Verify the person belongs to the user
        if not can_view_all_families(user, author_person_id):
            raise ValidationError("You can only view your own posts across all families.")
        
        # Filter posts where author_user is the request user and author_person_id matches
        posts = Post.objects.filter(
            author_user=user,
            author_person_id=author_person_id
        ).select_related(
            'author_user', 'author_person', 'family'
        )
        
        # Apply type filter if provided
        if post_type:
            if post_type not in [PostTypeChoices.POST, PostTypeChoices.ANNOUNCEMENT, PostTypeChoices.MESSAGE]:
                raise ValidationError(
                    f"type must be one of: {PostTypeChoices.POST}, {PostTypeChoices.ANNOUNCEMENT}, {PostTypeChoices.MESSAGE}."
                )
            posts = posts.filter(type=post_type)
        else:
            # Default to POST for profile view
            posts = posts.filter(type=PostTypeChoices.POST)
    else:
        # Standard family-scoped query
        if not family_id:
            raise ValidationError("family_id is required.")
        
        # Validate membership
        validate_family_membership(user, family_id)
        
        # Get posts
        posts = Post.objects.filter(
            family_id=family_id
        ).select_related(
            'author_user', 'author_person', 'family'
        )
        
        # Apply type filter if provided
        if post_type:
            if post_type not in [PostTypeChoices.POST, PostTypeChoices.ANNOUNCEMENT, PostTypeChoices.MESSAGE]:
                raise ValidationError(
                    f"type must be one of: {PostTypeChoices.POST}, {PostTypeChoices.ANNOUNCEMENT}, {PostTypeChoices.MESSAGE}."
                )
            posts = posts.filter(type=post_type)
        
        # Apply author_person_id filter if provided
        if author_person_id:
            # Validate that the person belongs to the specified family
            validate_person_in_family(author_person_id, family_id)
            
            posts = posts.filter(author_person_id=author_person_id)
            
            # Default to type=POST if not supplied when author_person_id is provided
            if not post_type:
                posts = posts.filter(type=PostTypeChoices.POST)
    
    # Order by newest first
    return posts.order_by('-created_at')

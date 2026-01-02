from django.apps import apps
from django.core.exceptions import ValidationError
from django.db import transaction

from apps.families.models import Family, FamilyMembership, JoinRequest


def create_family_with_membership(name, creator):
    """
    Create a family with an admin membership and Person node for the creator.
    
    Args:
        name: Family name
        creator: User instance who is creating the family
        
    Returns:
        Family instance
    """
    Person = apps.get_model('graph', 'Person')
    
    with transaction.atomic():
        # Create family (code will be auto-generated)
        family = Family.objects.create(name=name, created_by=creator)
        
        # Derive first_name and last_name from username
        username_parts = creator.username.split(' ', 1)
        first_name = username_parts[0] if username_parts else creator.username
        last_name = username_parts[1] if len(username_parts) > 1 else ''
        
        # Create Person node for creator
        person = Person.objects.create(
            family=family,
            first_name=first_name,
            last_name=last_name
        )
        
        # Create admin membership
        FamilyMembership.objects.create(
            user=creator,
            family=family,
            person=person,
            role=FamilyMembership.Role.ADMIN,
            status=FamilyMembership.Status.ACTIVE
        )
        
        return family


def create_join_request(family_code, user, chosen_person_id=None, new_person_payload=None):
    """
    Create a join request for a family.
    
    Args:
        family_code: Family code to join
        user: User instance making the request
        chosen_person_id: Optional ID of existing Person to use
        new_person_payload: Optional dict with first_name/last_name for new Person
        
    Returns:
        JoinRequest instance
        
    Raises:
        ValidationError: If validation fails
    """
    # Validate family exists
    try:
        family = Family.objects.get(code=family_code.upper())
    except Family.DoesNotExist:
        raise ValidationError(f"Family with code '{family_code}' does not exist.")
    
    # Validate user is not already a member
    if FamilyMembership.objects.filter(user=user, family=family).exists():
        raise ValidationError("User is already a member of this family.")
    
    # Validate either chosen_person_id OR new_person_payload provided
    if not chosen_person_id and not new_person_payload:
        raise ValidationError("Either chosen_person_id or new_person_payload must be provided.")
    
    if chosen_person_id and new_person_payload:
        raise ValidationError("Cannot provide both chosen_person_id and new_person_payload.")
    
    # Validate chosen_person exists if provided
    chosen_person = None
    if chosen_person_id:
        Person = apps.get_model('graph', 'Person')
        try:
            chosen_person = Person.objects.get(pk=chosen_person_id)
        except Person.DoesNotExist:
            raise ValidationError(f"Person with id '{chosen_person_id}' does not exist.")
    
    # Create join request
    join_request = JoinRequest.objects.create(
        family=family,
        requested_by=user,
        chosen_person=chosen_person,
        new_person_payload=new_person_payload,
        status=JoinRequest.Status.PENDING
    )
    
    return join_request


def approve_join_request(join_request_id, reviewer):
    """
    Approve a join request and create membership.
    
    Args:
        join_request_id: ID of JoinRequest to approve
        reviewer: User instance approving the request
        
    Returns:
        FamilyMembership instance
        
    Raises:
        ValidationError: If validation fails
    """
    Person = apps.get_model('graph', 'Person')
    
    try:
        join_request = JoinRequest.objects.select_related('family').get(pk=join_request_id)
    except JoinRequest.DoesNotExist:
        raise ValidationError(f"Join request with id '{join_request_id}' does not exist.")
    
    # Validate join request is pending
    if join_request.status != JoinRequest.Status.PENDING:
        raise ValidationError(f"Join request is already {join_request.status.lower()}.")
    
    # Validate reviewer is ADMIN of the family
    try:
        membership = FamilyMembership.objects.get(
            user=reviewer,
            family=join_request.family,
            role=FamilyMembership.Role.ADMIN,
            status=FamilyMembership.Status.ACTIVE
        )
    except FamilyMembership.DoesNotExist:
        raise ValidationError("Only family admins can approve join requests.")
    
    with transaction.atomic():
        # Determine which Person to use
        if join_request.chosen_person:
            person = join_request.chosen_person
        elif join_request.new_person_payload:
            # Create new Person from payload
            payload = join_request.new_person_payload
            person = Person.objects.create(
                family=join_request.family,
                first_name=payload.get('first_name', ''),
                last_name=payload.get('last_name', ''),
                gender=payload.get('gender', 'UNKNOWN')
            )
        else:
            raise ValidationError("Join request has no person associated.")
        
        # Create membership
        family_membership = FamilyMembership.objects.create(
            user=join_request.requested_by,
            family=join_request.family,
            person=person,
            role=FamilyMembership.Role.MEMBER,
            status=FamilyMembership.Status.ACTIVE
        )
        
        # Update join request
        join_request.status = JoinRequest.Status.APPROVED
        join_request.reviewed_by = reviewer
        join_request.save(update_fields=['status', 'reviewed_by', 'updated_at'])
        
        return family_membership


def reject_join_request(join_request_id, reviewer):
    """
    Reject a join request.
    
    Args:
        join_request_id: ID of JoinRequest to reject
        reviewer: User instance rejecting the request
        
    Returns:
        JoinRequest instance
        
    Raises:
        ValidationError: If validation fails
    """
    try:
        join_request = JoinRequest.objects.select_related('family').get(pk=join_request_id)
    except JoinRequest.DoesNotExist:
        raise ValidationError(f"Join request with id '{join_request_id}' does not exist.")
    
    # Validate join request is pending
    if join_request.status != JoinRequest.Status.PENDING:
        raise ValidationError(f"Join request is already {join_request.status.lower()}.")
    
    # Validate reviewer is ADMIN of the family
    try:
        FamilyMembership.objects.get(
            user=reviewer,
            family=join_request.family,
            role=FamilyMembership.Role.ADMIN,
            status=FamilyMembership.Status.ACTIVE
        )
    except FamilyMembership.DoesNotExist:
        raise ValidationError("Only family admins can reject join requests.")
    
    # Update join request
    join_request.status = JoinRequest.Status.REJECTED
    join_request.reviewed_by = reviewer
    join_request.save(update_fields=['status', 'reviewed_by', 'updated_at'])
    
    return join_request


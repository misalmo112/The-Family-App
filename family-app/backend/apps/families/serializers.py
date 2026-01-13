from rest_framework import serializers
from apps.families.models import Family, FamilyMembership, JoinRequest


class FamilySerializer(serializers.ModelSerializer):
    """Serializer for Family model"""
    code = serializers.CharField(read_only=True)
    created_by = serializers.StringRelatedField(read_only=True)
    # Optional person profile fields for family creation
    first_name = serializers.CharField(write_only=True, required=False, allow_blank=True)
    last_name = serializers.CharField(write_only=True, required=False, allow_blank=True)
    dob = serializers.DateField(write_only=True, required=False, allow_null=True)
    gender = serializers.ChoiceField(
        choices=['MALE', 'FEMALE', 'OTHER', 'UNKNOWN'],
        write_only=True,
        required=False,
        allow_blank=True
    )
    
    class Meta:
        model = Family
        fields = [
            'id', 'name', 'code', 'created_by', 'created_at', 'updated_at',
            'first_name', 'last_name', 'dob', 'gender'
        ]
        read_only_fields = ['id', 'code', 'created_by', 'created_at', 'updated_at']


class FamilyMembershipSerializer(serializers.ModelSerializer):
    """Serializer for FamilyMembership model"""
    user = serializers.StringRelatedField()
    family = serializers.StringRelatedField()
    person = serializers.PrimaryKeyRelatedField(read_only=True)
    
    class Meta:
        model = FamilyMembership
        fields = ['id', 'user', 'family', 'person', 'role', 'status', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


class JoinRequestSerializer(serializers.ModelSerializer):
    """Serializer for JoinRequest model"""
    family = serializers.StringRelatedField(read_only=True)
    requested_by = serializers.StringRelatedField(read_only=True)
    chosen_person_id = serializers.IntegerField(source='chosen_person.id', read_only=True, allow_null=True)
    reviewed_by = serializers.StringRelatedField(read_only=True, allow_null=True)
    
    class Meta:
        model = JoinRequest
        fields = [
            'id', 'family', 'requested_by', 'chosen_person_id', 
            'new_person_payload', 'status', 'reviewed_by', 
            'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'family', 'requested_by', 'chosen_person_id', 
            'status', 'reviewed_by', 'created_at', 'updated_at'
        ]


class JoinRequestCreateSerializer(serializers.Serializer):
    """Serializer for creating join requests"""
    code = serializers.CharField(max_length=8, required=True)
    chosen_person_id = serializers.IntegerField(required=False, allow_null=True)
    new_person_payload = serializers.DictField(required=False, allow_null=True)
    
    def validate(self, attrs):
        """Validate that either chosen_person_id or new_person_payload is provided"""
        chosen_person_id = attrs.get('chosen_person_id')
        new_person_payload = attrs.get('new_person_payload')
        
        if not chosen_person_id and not new_person_payload:
            raise serializers.ValidationError(
                "Either chosen_person_id or new_person_payload must be provided."
            )
        
        if chosen_person_id and new_person_payload:
            raise serializers.ValidationError(
                "Cannot provide both chosen_person_id and new_person_payload."
            )
        
        # Validate new_person_payload structure if provided
        if new_person_payload:
            if not isinstance(new_person_payload, dict):
                raise serializers.ValidationError(
                    "new_person_payload must be a dictionary."
                )
            # Note: first_name and last_name are optional, but at least one should be present
            if 'first_name' not in new_person_payload and 'last_name' not in new_person_payload:
                raise serializers.ValidationError(
                    "new_person_payload must contain at least 'first_name' or 'last_name'."
                )
        
        return attrs


class JoinRequestListSerializer(serializers.ModelSerializer):
    """Serializer for listing join requests (admin view)"""
    family = FamilySerializer(read_only=True)
    requested_by = serializers.StringRelatedField()
    chosen_person_id = serializers.IntegerField(source='chosen_person.id', read_only=True, allow_null=True)
    reviewed_by = serializers.StringRelatedField(read_only=True, allow_null=True)
    
    class Meta:
        model = JoinRequest
        fields = [
            'id', 'family', 'requested_by', 'chosen_person_id',
            'new_person_payload', 'status', 'reviewed_by',
            'created_at', 'updated_at'
        ]

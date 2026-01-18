# Serializers for graph app
from rest_framework import serializers
from apps.graph.models import Person, Relationship, RelationshipTypeChoices
from apps.families.models import Family


class PersonSerializer(serializers.ModelSerializer):
    """Serializer for Person model"""
    family_id = serializers.IntegerField(write_only=True, required=False)
    relation_to_viewer = serializers.CharField(read_only=True, required=False)
    has_user_account = serializers.SerializerMethodField(read_only=True)
    
    class Meta:
        model = Person
        fields = ['id', 'family', 'family_id', 'first_name', 'last_name', 'dob', 'gender', 'created_at', 'updated_at', 'relation_to_viewer', 'has_user_account']
        read_only_fields = ['id', 'family', 'created_at', 'updated_at', 'relation_to_viewer', 'has_user_account']
    
    def get_has_user_account(self, obj):
        """Check if Person has an active FamilyMembership (linked to a user account)"""
        from apps.families.models import FamilyMembership
        return FamilyMembership.objects.filter(
            person=obj,
            status=FamilyMembership.Status.ACTIVE
        ).exists()
    
    def validate(self, attrs):
        """Handle family_id to family conversion"""
        family_id = attrs.pop('family_id', None)
        if family_id:
            from apps.families.models import Family
            try:
                attrs['family'] = Family.objects.get(id=family_id)
            except Family.DoesNotExist:
                raise serializers.ValidationError({'family_id': 'Family not found.'})
        return attrs
    
    def to_representation(self, instance):
        """Handle both Person objects and dicts with person and relation_to_viewer"""
        if isinstance(instance, dict):
            # Handle node dict from topology service
            person = instance.get('person')
            relation = instance.get('relation_to_viewer', None)
            ret = super().to_representation(person)
            if relation is not None:
                ret['relation_to_viewer'] = relation
            return ret
        else:
            # Handle regular Person instance
            ret = super().to_representation(instance)
            # Only include relation_to_viewer if it was set via context
            if 'relation_to_viewer' in self.context:
                ret['relation_to_viewer'] = self.context['relation_to_viewer']
            elif hasattr(instance, 'relation_to_viewer'):
                ret['relation_to_viewer'] = instance.relation_to_viewer
            # has_user_account is computed via SerializerMethodField, so it's already included
            return ret


class RelationshipSerializer(serializers.ModelSerializer):
    """Serializer for Relationship model"""
    family_id = serializers.IntegerField(write_only=True)
    from_person_id = serializers.IntegerField(write_only=True)
    to_person_id = serializers.IntegerField(write_only=True)
    type = serializers.ChoiceField(choices=RelationshipTypeChoices.choices)
    from_person = PersonSerializer(read_only=True)
    to_person = PersonSerializer(read_only=True)
    
    class Meta:
        model = Relationship
        fields = ['id', 'family_id', 'type', 'from_person_id', 'to_person_id', 'from_person', 'to_person', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at', 'from_person', 'to_person']
    
    def validate(self, attrs):
        """Validate that persons exist and belong to the family"""
        family_id = attrs.get('family_id')
        from_person_id = attrs.get('from_person_id')
        to_person_id = attrs.get('to_person_id')
        
        # Get family
        try:
            family = Family.objects.get(id=family_id)
        except Family.DoesNotExist:
            raise serializers.ValidationError({'family_id': 'Family not found.'})
        
        # Get persons
        try:
            from_person = Person.objects.get(id=from_person_id)
        except Person.DoesNotExist:
            raise serializers.ValidationError({'from_person_id': 'Person not found.'})
        
        try:
            to_person = Person.objects.get(id=to_person_id)
        except Person.DoesNotExist:
            raise serializers.ValidationError({'to_person_id': 'Person not found.'})
        
        # Validate persons belong to the family
        if from_person.family_id != family_id:
            raise serializers.ValidationError({'from_person_id': 'Person does not belong to this family.'})
        
        if to_person.family_id != family_id:
            raise serializers.ValidationError({'to_person_id': 'Person does not belong to this family.'})
        
        # Store objects for use in view
        attrs['family'] = family
        attrs['from_person'] = from_person
        attrs['to_person'] = to_person
        
        return attrs


class EdgeSerializer(serializers.Serializer):
    """Serializer for graph edge"""
    from_ = serializers.IntegerField(source='from')
    to = serializers.IntegerField()
    type = serializers.CharField()
    
    def to_representation(self, instance):
        """Convert from_ to from in output"""
        ret = super().to_representation(instance)
        if 'from_' in ret:
            ret['from'] = ret.pop('from_')
        return ret


class RelationshipSuggestionSerializer(serializers.Serializer):
    """Serializer for relationship suggestions"""
    type = serializers.CharField()
    from_person_id = serializers.IntegerField()
    to_person_id = serializers.IntegerField()
    relationship_type = serializers.CharField()
    reason = serializers.CharField()
    confidence = serializers.ChoiceField(choices=['high', 'medium', 'low'])


class BulkFamilyUnitSerializer(serializers.Serializer):
    """Serializer for bulk family unit creation"""
    family_id = serializers.IntegerField()
    parent1_id = serializers.IntegerField(required=False, allow_null=True)
    parent2_id = serializers.IntegerField(required=False, allow_null=True)
    children_ids = serializers.ListField(
        child=serializers.IntegerField(),
        min_length=1
    )
    
    def validate(self, attrs):
        if not attrs.get('parent1_id') and not attrs.get('parent2_id'):
            raise serializers.ValidationError('At least one parent is required')
        return attrs


class BulkRelationshipRequestSerializer(serializers.Serializer):
    """Serializer for a single relationship request in bulk operation"""
    viewer_id = serializers.IntegerField()
    target_id = serializers.IntegerField()
    label = serializers.CharField(max_length=50)
    
    def validate(self, attrs):
        """Validate that viewer_id and target_id are different"""
        if attrs['viewer_id'] == attrs['target_id']:
            raise serializers.ValidationError('Viewer and target cannot be the same person')
        return attrs


class BulkRelationshipSerializer(serializers.Serializer):
    """Serializer for bulk relationship creation"""
    family_id = serializers.IntegerField()
    relationships = BulkRelationshipRequestSerializer(many=True, min_length=1)
    
    def validate(self, attrs):
        """Validate that all person IDs exist and belong to the family"""
        family_id = attrs['family_id']
        try:
            family = Family.objects.get(id=family_id)
        except Family.DoesNotExist:
            raise serializers.ValidationError({'family_id': 'Family not found.'})
        
        # Collect all person IDs
        person_ids = set()
        for rel in attrs['relationships']:
            person_ids.add(rel['viewer_id'])
            person_ids.add(rel['target_id'])
        
        # Verify all persons exist and belong to the family
        persons = Person.objects.filter(id__in=person_ids, family=family)
        found_ids = set(persons.values_list('id', flat=True))
        missing_ids = person_ids - found_ids
        
        if missing_ids:
            raise serializers.ValidationError({
                'relationships': f'Persons with IDs {missing_ids} not found or do not belong to this family.'
            })
        
        attrs['family'] = family
        return attrs


class TopologyResponseSerializer(serializers.Serializer):
    """Serializer for topology response"""
    family_id = serializers.IntegerField()
    viewer_person_id = serializers.IntegerField()
    nodes = serializers.SerializerMethodField()
    edges = EdgeSerializer(many=True)
    
    def get_nodes(self, obj):
        """Serialize nodes with relation_to_viewer"""
        # obj can be a dict or an object with attributes
        if isinstance(obj, dict):
            nodes_data = obj.get('nodes', [])
        else:
            nodes_data = getattr(obj, 'nodes', [])
        
        # Convert node dicts to serialized format
        serialized_nodes = []
        for node_data in nodes_data:
            if isinstance(node_data, dict):
                person = node_data.get('person')
                relation = node_data.get('relation_to_viewer')
                if person:
                    person_dict = PersonSerializer(person).data
                    person_dict['relation_to_viewer'] = relation
                    serialized_nodes.append(person_dict)
            else:
                # Fallback for Person objects
                person_dict = PersonSerializer(node_data).data
                serialized_nodes.append(person_dict)
        return serialized_nodes

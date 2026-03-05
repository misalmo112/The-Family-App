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
    label = serializers.CharField(required=False, allow_blank=True)
    from_person = PersonSerializer(read_only=True)
    to_person = PersonSerializer(read_only=True)
    
    class Meta:
        model = Relationship
        fields = ['id', 'family_id', 'type', 'from_person_id', 'to_person_id', 'label', 'from_person', 'to_person', 'created_at', 'updated_at']
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
    """Serializer for bulk family unit creation.
    Accepts either IDs or names for parents and children; names are resolved or create Person (like bulk relationships).
    """
    family_id = serializers.IntegerField()
    parent1_id = serializers.IntegerField(required=False, allow_null=True)
    parent2_id = serializers.IntegerField(required=False, allow_null=True)
    parent1_name = serializers.CharField(required=False, allow_blank=True)
    parent2_name = serializers.CharField(required=False, allow_blank=True)
    children_ids = serializers.ListField(
        child=serializers.IntegerField(),
        required=False,
        default=list
    )
    children_names = serializers.ListField(
        child=serializers.CharField(),
        required=False,
        default=list
    )

    def validate(self, attrs):
        parent1_id = attrs.get('parent1_id')
        parent2_id = attrs.get('parent2_id')
        parent1_name = (attrs.get('parent1_name') or '').strip()
        parent2_name = (attrs.get('parent2_name') or '').strip()
        children_ids = attrs.get('children_ids') or []
        children_names = [n.strip() for n in (attrs.get('children_names') or []) if (n or '').strip()]

        has_parent1 = bool(parent1_id or parent1_name)
        has_parent2 = bool(parent2_id or parent2_name)
        if not has_parent1 and not has_parent2:
            raise serializers.ValidationError('At least one parent is required (by ID or name).')
        if not children_ids and not children_names:
            raise serializers.ValidationError('At least one child is required (by IDs or names).')
        return attrs


class BulkRelationshipRequestSerializer(serializers.Serializer):
    """Serializer for a single relationship request in bulk operation.
    Accepts either (viewer_id, target_id) or (viewer_name, target_name)."""
    viewer_id = serializers.IntegerField(required=False, allow_null=True)
    target_id = serializers.IntegerField(required=False, allow_null=True)
    viewer_name = serializers.CharField(required=False, allow_blank=True)
    target_name = serializers.CharField(required=False, allow_blank=True)
    label = serializers.CharField(max_length=50)
    
    def validate(self, attrs):
        """Require either both IDs or both names; if IDs, they must differ."""
        has_ids = attrs.get('viewer_id') is not None and attrs.get('target_id') is not None
        viewer_name = (attrs.get('viewer_name') or '').strip()
        target_name = (attrs.get('target_name') or '').strip()
        has_names = bool(viewer_name and target_name)
        if has_ids and has_names:
            raise serializers.ValidationError('Provide either viewer_id/target_id or viewer_name/target_name, not both.')
        if not has_ids and not has_names:
            raise serializers.ValidationError('Provide either viewer_id and target_id, or viewer_name and target_name.')
        if has_ids and attrs['viewer_id'] == attrs['target_id']:
            raise serializers.ValidationError('Viewer and target cannot be the same person')
        return attrs


class BulkRelationshipSerializer(serializers.Serializer):
    """Serializer for bulk relationship creation"""
    family_id = serializers.IntegerField()
    relationships = BulkRelationshipRequestSerializer(many=True, min_length=1)
    
    def validate(self, attrs):
        """Validate shape; leave name resolution to the view (after admin check)."""
        family_id = attrs['family_id']
        try:
            family = Family.objects.get(id=family_id)
        except Family.DoesNotExist:
            raise serializers.ValidationError({'family_id': 'Family not found.'})
        attrs['family'] = family

        normalized = []
        for rel in attrs['relationships']:
            viewer_id = rel.get('viewer_id')
            target_id = rel.get('target_id')
            viewer_name = (rel.get('viewer_name') or '').strip()
            target_name = (rel.get('target_name') or '').strip()
            has_ids = viewer_id is not None and target_id is not None
            has_names = bool(viewer_name and target_name)
            if has_names and not has_ids:
                if viewer_name.lower() == target_name.lower():
                    raise serializers.ValidationError({
                        'relationships': 'Viewer and target cannot be the same person.'
                    })
                normalized.append({'viewer_name': viewer_name, 'target_name': target_name, 'label': rel['label']})
            elif has_ids and not has_names:
                if viewer_id == target_id:
                    raise serializers.ValidationError({
                        'relationships': 'Viewer and target cannot be the same person.'
                    })
                normalized.append({'viewer_id': viewer_id, 'target_id': target_id, 'label': rel['label']})
            else:
                raise serializers.ValidationError({
                    'relationships': 'Each relationship must have viewer_id and target_id, or viewer_name and target_name.'
                })
        attrs['relationships'] = normalized

        # Validate that any ID-based items refer to persons in this family
        person_ids = set()
        for rel in attrs['relationships']:
            if 'viewer_id' in rel:
                person_ids.add(rel['viewer_id'])
                person_ids.add(rel['target_id'])
        if person_ids:
            persons = Person.objects.filter(id__in=person_ids, family=family)
            found_ids = set(persons.values_list('id', flat=True))
            missing_ids = person_ids - found_ids
            if missing_ids:
                raise serializers.ValidationError({
                    'relationships': f'Persons with IDs {missing_ids} not found or do not belong to this family.'
                })
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

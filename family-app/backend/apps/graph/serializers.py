# Serializers for graph app
from rest_framework import serializers
from apps.graph.models import Person, Relationship, RelationshipTypeChoices
from apps.families.models import Family


class PersonSerializer(serializers.ModelSerializer):
    """Serializer for Person model"""
    family_id = serializers.IntegerField(write_only=True, required=False)
    relation_to_viewer = serializers.CharField(read_only=True, required=False)
    
    class Meta:
        model = Person
        fields = ['id', 'family', 'family_id', 'first_name', 'last_name', 'dob', 'gender', 'created_at', 'updated_at', 'relation_to_viewer']
        read_only_fields = ['id', 'family', 'created_at', 'updated_at', 'relation_to_viewer']
    
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
            return ret


class RelationshipSerializer(serializers.ModelSerializer):
    """Serializer for Relationship model"""
    family_id = serializers.IntegerField(write_only=True)
    from_person_id = serializers.IntegerField(write_only=True)
    to_person_id = serializers.IntegerField(write_only=True)
    type = serializers.ChoiceField(choices=RelationshipTypeChoices.choices)
    
    class Meta:
        model = Relationship
        fields = ['id', 'family_id', 'type', 'from_person_id', 'to_person_id', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']
    
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

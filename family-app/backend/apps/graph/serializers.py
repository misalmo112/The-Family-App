# Serializers for graph app
from rest_framework import serializers
from apps.graph.models import Person


class PersonSerializer(serializers.ModelSerializer):
    """Serializer for Person model"""
    
    class Meta:
        model = Person
        fields = ['id', 'family', 'first_name', 'last_name', 'dob', 'gender', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


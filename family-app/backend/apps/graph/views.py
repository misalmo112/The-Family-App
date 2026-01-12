# Views for graph app
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from django.core.exceptions import ValidationError
from apps.graph.models import Person, RelationshipTypeChoices
from apps.graph.serializers import PersonSerializer, RelationshipSerializer
from apps.graph.services.relationship_service import add_parent, add_spouse


def is_family_admin(user, family):
    """Check if user is ADMIN of the family"""
    try:
        from apps.families.models import FamilyMembership
        membership = FamilyMembership.objects.get(user=user, family=family)
        return membership.role == 'ADMIN'
    except:
        return False


def is_family_member(user, family):
    """Check if user is a member of the family"""
    try:
        from apps.families.models import FamilyMembership
        return FamilyMembership.objects.filter(user=user, family=family).exists()
    except:
        return False


class PersonView(APIView):
    """List persons for a family or create a new person"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """List persons for a family (member of that family)"""
        family_id = request.query_params.get('family_id')
        if not family_id:
            return Response(
                {'error': 'family_id query parameter is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Get family object
        try:
            from apps.families.models import Family
            family = get_object_or_404(Family, id=family_id)
        except:
            return Response(
                {'error': 'Family not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        # Check if user is a member of that family
        if not is_family_member(request.user, family):
            return Response(
                {'error': 'You must be a member of this family to view persons'},
                status=status.HTTP_403_FORBIDDEN
            )

        # Filter persons by family
        persons = Person.objects.filter(family=family)
        serializer = PersonSerializer(persons, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        """Create a new person (ADMIN of that family only)"""
        serializer = PersonSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        # Get family from validated data (serializer converts family ID to Family object)
        family = serializer.validated_data.get('family')
        if not family:
            return Response(
                {'error': 'family is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Check if user is ADMIN of that family
        if not is_family_admin(request.user, family):
            return Response(
                {'error': 'Only family admins can create persons'},
                status=status.HTTP_403_FORBIDDEN
            )

        # Create person
        person = serializer.save()
        return Response(PersonSerializer(person).data, status=status.HTTP_201_CREATED)


class RelationshipView(APIView):
    """Create relationships between persons (ADMIN of family only)"""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        """Create a new relationship"""
        serializer = RelationshipSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        # Get validated data
        family = serializer.validated_data.get('family')
        relationship_type = serializer.validated_data.get('type')
        from_person = serializer.validated_data.get('from_person')
        to_person = serializer.validated_data.get('to_person')

        # Check if user is ADMIN of that family
        if not is_family_admin(request.user, family):
            return Response(
                {'error': 'Only family admins can create relationships'},
                status=status.HTTP_403_FORBIDDEN
            )

        # Route to appropriate service method based on type
        try:
            if relationship_type == RelationshipTypeChoices.PARENT_OF:
                relationship = add_parent(family, from_person, to_person)
                return Response(
                    RelationshipSerializer(relationship).data,
                    status=status.HTTP_201_CREATED
                )
            elif relationship_type == RelationshipTypeChoices.SPOUSE_OF:
                relationship_ab, relationship_ba = add_spouse(family, from_person, to_person)
                # Return both relationships
                return Response(
                    {
                        'relationship_ab': RelationshipSerializer(relationship_ab).data,
                        'relationship_ba': RelationshipSerializer(relationship_ba).data
                    },
                    status=status.HTTP_201_CREATED
                )
            else:
                return Response(
                    {'error': f'Unsupported relationship type: {relationship_type}'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        except ValidationError as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )


class TopologyView(APIView):
    """Get family graph topology"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Get topology for a family"""
        family_id = request.query_params.get('family_id')
        viewer_person_id = request.query_params.get('viewer_person_id')
        
        # Validate required query params
        if not family_id:
            return Response(
                {'error': 'family_id query parameter is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if not viewer_person_id:
            return Response(
                {'error': 'viewer_person_id query parameter is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Convert to integers
        try:
            family_id = int(family_id)
            viewer_person_id = int(viewer_person_id)
        except ValueError:
            return Response(
                {'error': 'family_id and viewer_person_id must be valid integers'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get family object
        try:
            from apps.families.models import Family
            family = get_object_or_404(Family, id=family_id)
        except:
            return Response(
                {'error': 'Family not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Check if user is a member of that family
        if not is_family_member(request.user, family):
            return Response(
                {'error': 'You must be a member of this family to view topology'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Get topology data using service
        try:
            from apps.graph.services.topology_service import get_family_topology
            topology_data = get_family_topology(family_id, viewer_person_id)
        except ValueError as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            return Response(
                {'error': 'Person not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Serialize and return response
        from apps.graph.serializers import TopologyResponseSerializer
        serializer = TopologyResponseSerializer(topology_data)
        return Response(serializer.data, status=status.HTTP_200_OK)

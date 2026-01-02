# Views for graph app
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from apps.graph.models import Person
from apps.graph.serializers import PersonSerializer


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


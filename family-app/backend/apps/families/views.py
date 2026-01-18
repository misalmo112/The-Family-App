from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from django.core.exceptions import ValidationError

from apps.families.models import Family, JoinRequest, FamilyMembership
from apps.families.serializers import (
    FamilySerializer,
    JoinRequestSerializer,
    JoinRequestCreateSerializer,
    JoinRequestListSerializer
)
from apps.families.services.family_service import (
    create_family_with_membership,
    create_join_request,
    approve_join_request,
    reject_join_request
)


class FamilyView(APIView):
    """List families or create a new family"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """List families the user belongs to"""
        # Get families where user has a membership
        memberships = FamilyMembership.objects.filter(
            user=request.user,
            status=FamilyMembership.Status.ACTIVE
        ).select_related('family')
        
        families = [membership.family for membership in memberships]
        serializer = FamilySerializer(families, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        """Create a new family"""
        serializer = FamilySerializer(data=request.data)
        if serializer.is_valid():
            try:
                family = create_family_with_membership(
                    name=serializer.validated_data['name'],
                    creator=request.user
                )
                response_serializer = FamilySerializer(family)
                return Response(response_serializer.data, status=status.HTTP_201_CREATED)
            except Exception as e:
                return Response(
                    {'error': str(e)},
                    status=status.HTTP_400_BAD_REQUEST
                )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class JoinRequestCreateView(APIView):
    """Submit a join request"""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = JoinRequestCreateSerializer(data=request.data)
        if serializer.is_valid():
            try:
                join_request = create_join_request(
                    family_code=serializer.validated_data['code'],
                    user=request.user,
                    chosen_person_id=serializer.validated_data.get('chosen_person_id'),
                    new_person_payload=serializer.validated_data.get('new_person_payload')
                )
                response_serializer = JoinRequestSerializer(join_request)
                return Response(response_serializer.data, status=status.HTTP_201_CREATED)
            except ValidationError as e:
                return Response(
                    {'error': str(e)},
                    status=status.HTTP_400_BAD_REQUEST
                )
            except Exception as e:
                return Response(
                    {'error': str(e)},
                    status=status.HTTP_400_BAD_REQUEST
                )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class JoinRequestListView(APIView):
    """List pending join requests for families where user is admin"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # Get families where user is ADMIN
        admin_memberships = FamilyMembership.objects.filter(
            user=request.user,
            role=FamilyMembership.Role.ADMIN,
            status=FamilyMembership.Status.ACTIVE
        ).select_related('family')
        
        family_ids = [membership.family_id for membership in admin_memberships]
        
        # Get pending join requests for these families
        join_requests = JoinRequest.objects.filter(
            family_id__in=family_ids,
            status=JoinRequest.Status.PENDING
        ).select_related('family', 'requested_by', 'chosen_person', 'reviewed_by')
        
        serializer = JoinRequestListSerializer(join_requests, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class JoinRequestApproveView(APIView):
    """Approve a join request"""
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        # Extract optional person_id from request body
        person_id = request.data.get('person_id')
        
        try:
            membership = approve_join_request(
                join_request_id=pk,
                reviewer=request.user,
                person_id=person_id
            )
            return Response(
                {
                    'message': 'Join request approved successfully',
                    'membership_id': membership.id
                },
                status=status.HTTP_200_OK
            )
        except ValidationError as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )


class JoinRequestRejectView(APIView):
    """Reject a join request"""
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            join_request = reject_join_request(
                join_request_id=pk,
                reviewer=request.user
            )
            return Response(
                {
                    'message': 'Join request rejected successfully',
                    'join_request_id': join_request.id
                },
                status=status.HTTP_200_OK
            )
        except ValidationError as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )


class MyJoinRequestsView(APIView):
    """List join requests made by the current user"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """List all join requests made by the current user"""
        join_requests = JoinRequest.objects.filter(
            requested_by=request.user
        ).select_related('family').order_by('-created_at')
        
        serializer = JoinRequestListSerializer(join_requests, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class FamilyAdminCheckView(APIView):
    """Check if current user is admin of a family"""
    permission_classes = [IsAuthenticated]

    def get(self, request, family_id):
        """Check if user is admin of the family"""
        try:
            family = Family.objects.get(id=family_id)
        except Family.DoesNotExist:
            return Response(
                {'error': 'Family not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Check if user is admin
        is_admin = FamilyMembership.objects.filter(
            user=request.user,
            family=family,
            role=FamilyMembership.Role.ADMIN,
            status=FamilyMembership.Status.ACTIVE
        ).exists()
        
        return Response({'is_admin': is_admin}, status=status.HTTP_200_OK)

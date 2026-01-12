from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated

from apps.feed.models import Post
from apps.feed.serializers import PostSerializer, PostCreateSerializer
from apps.families.models import FamilyMembership


class PostCreateView(APIView):
    """Create a new post in a family feed"""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = PostCreateSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            post = serializer.save()
            response_serializer = PostSerializer(post)
            return Response(response_serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class PostListView(APIView):
    """List posts for a family feed with pagination"""
    permission_classes = [IsAuthenticated]
    PAGE_SIZE = 20

    def get(self, request):
        family_id = request.query_params.get('family_id')
        
        if not family_id:
            return Response(
                {'error': 'family_id query parameter is required.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Validate family_id is an integer
        try:
            family_id = int(family_id)
        except ValueError:
            return Response(
                {'error': 'family_id must be a valid integer.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Check if user is a member of the family
        membership = FamilyMembership.objects.filter(
            user=request.user,
            family_id=family_id,
            status=FamilyMembership.Status.ACTIVE
        ).first()

        if not membership:
            return Response(
                {'error': 'You are not a member of this family.'},
                status=status.HTTP_403_FORBIDDEN
            )

        # Get pagination parameters
        page = request.query_params.get('page', 1)
        try:
            page = int(page)
            if page < 1:
                page = 1
        except ValueError:
            page = 1

        # Calculate offset
        offset = (page - 1) * self.PAGE_SIZE

        # Get posts ordered by newest first
        posts = Post.objects.filter(
            family_id=family_id
        ).select_related(
            'author_user', 'author_person', 'family'
        ).order_by('-created_at')

        # Get total count for pagination info
        total_count = posts.count()
        total_pages = (total_count + self.PAGE_SIZE - 1) // self.PAGE_SIZE if total_count > 0 else 1

        # Apply pagination
        posts = posts[offset:offset + self.PAGE_SIZE]

        serializer = PostSerializer(posts, many=True)
        
        return Response({
            'results': serializer.data,
            'count': total_count,
            'page': page,
            'page_size': self.PAGE_SIZE,
            'total_pages': total_pages,
            'has_next': page < total_pages,
            'has_previous': page > 1
        }, status=status.HTTP_200_OK)

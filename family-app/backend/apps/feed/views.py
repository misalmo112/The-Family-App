from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated

from apps.feed.models import Post, PostTypeChoices
from apps.feed.serializers import PostSerializer, PostCreateSerializer, PostCommentSerializer, PostCommentCreateSerializer
from apps.families.models import FamilyMembership
from apps.graph.models import Person


class PostCreateView(APIView):
    """Create a new post in a family feed"""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = PostCreateSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            post = serializer.save()
            response_serializer = PostSerializer(post, context={'request': request})
            return Response(response_serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class PostListView(APIView):
    """List posts for a family feed with pagination"""
    permission_classes = [IsAuthenticated]
    PAGE_SIZE = 20

    def get(self, request):
        family_id = request.query_params.get('family_id')
        post_type = request.query_params.get('type')
        author_person_id = request.query_params.get('author_person_id')
        scope = request.query_params.get('scope')
        
        # Validate family_id (required unless scope=all_families)
        if not family_id and scope != 'all_families':
            return Response(
                {'error': 'family_id query parameter is required.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Validate family_id is an integer if provided
        if family_id:
            try:
                family_id = int(family_id)
            except ValueError:
                return Response(
                    {'error': 'family_id must be a valid integer.'},
                    status=status.HTTP_400_BAD_REQUEST
                )

        # Handle scope=all_families
        if scope == 'all_families':
            # Only allow if author_person_id is provided and belongs to the user
            if not author_person_id:
                return Response(
                    {'error': 'author_person_id is required when scope=all_families.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            try:
                author_person_id = int(author_person_id)
            except ValueError:
                return Response(
                    {'error': 'author_person_id must be a valid integer.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Verify the person belongs to the user (check if user has a membership with that person)
            person = Person.objects.filter(id=author_person_id).first()
            if not person:
                return Response(
                    {'error': 'Person does not exist.'},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # Check if user has a membership with this person
            membership = FamilyMembership.objects.filter(
                user=request.user,
                person_id=author_person_id,
                status=FamilyMembership.Status.ACTIVE
            ).first()
            
            if not membership:
                return Response(
                    {'error': 'You can only view your own posts across all families.'},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            # Filter posts where author_user is the request user and author_person_id matches
            posts = Post.objects.filter(
                author_user=request.user,
                author_person_id=author_person_id
            ).select_related(
                'author_user', 'author_person', 'family'
            )
            
            # Apply type filter if provided
            if post_type:
                if post_type not in [PostTypeChoices.POST, PostTypeChoices.ANNOUNCEMENT, PostTypeChoices.MESSAGE]:
                    return Response(
                        {'error': f'type must be one of: {PostTypeChoices.POST}, {PostTypeChoices.ANNOUNCEMENT}, {PostTypeChoices.MESSAGE}.'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                posts = posts.filter(type=post_type)
            else:
                # Default to POST for profile view
                posts = posts.filter(type=PostTypeChoices.POST)
        else:
            # Standard family-scoped query
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

            # Get posts ordered by newest first
            posts = Post.objects.filter(
                family_id=family_id
            ).select_related(
                'author_user', 'author_person', 'family'
            )

            # Apply type filter if provided
            if post_type:
                if post_type not in [PostTypeChoices.POST, PostTypeChoices.ANNOUNCEMENT, PostTypeChoices.MESSAGE]:
                    return Response(
                        {'error': f'type must be one of: {PostTypeChoices.POST}, {PostTypeChoices.ANNOUNCEMENT}, {PostTypeChoices.MESSAGE}.'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                posts = posts.filter(type=post_type)

            # Apply author_person_id filter if provided
            if author_person_id:
                try:
                    author_person_id = int(author_person_id)
                except ValueError:
                    return Response(
                        {'error': 'author_person_id must be a valid integer.'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                
                # #region agent log
                import json
                log_data = {
                    'location': 'feed/views.py:142',
                    'message': 'PostListView.get - before author_person_id filter',
                    'data': {
                        'author_person_id': author_person_id,
                        'family_id': family_id,
                        'post_type': post_type,
                        'user_id': request.user.id,
                        'posts_count_before': posts.count(),
                    },
                    'timestamp': int(__import__('time').time() * 1000),
                    'sessionId': 'debug-session',
                    'runId': 'post-fix',
                    'hypothesisId': 'A'
                }
                try:
                    with open(r'c:\Users\misal\OneDrive\Belgeler\Projects\Github\The-Family-App\.cursor\debug.log', 'a', encoding='utf-8') as f:
                        f.write(json.dumps(log_data) + '\n')
                except: pass
                # #endregion
                
                # Validate that the person belongs to the specified family
                person = Person.objects.filter(
                    id=author_person_id,
                    family_id=family_id
                ).first()
                
                if not person:
                    return Response(
                        {'error': 'Person does not exist in this family.'},
                        status=status.HTTP_404_NOT_FOUND
                    )
                
                posts = posts.filter(author_person_id=author_person_id)
                
                # Default to type=POST if not supplied when author_person_id is provided
                if not post_type:
                    posts = posts.filter(type=PostTypeChoices.POST)

                # #region agent log
                log_data2 = {
                    'location': 'feed/views.py:163',
                    'message': 'PostListView.get - after author_person_id filter',
                    'data': {
                        'author_person_id': author_person_id,
                        'post_type': post_type or 'POST',
                        'posts_count_after': posts.count(),
                        'post_ids': list(posts.values_list('id', flat=True)[:10]),
                        'post_author_person_ids': list(posts.values_list('author_person_id', flat=True)[:10]),
                        'post_types': list(posts.values_list('type', flat=True)[:10]),
                    },
                    'timestamp': int(__import__('time').time() * 1000),
                    'sessionId': 'debug-session',
                    'runId': 'post-fix',
                    'hypothesisId': 'A'
                }
                try:
                    with open(r'c:\Users\misal\OneDrive\Belgeler\Projects\Github\The-Family-App\.cursor\debug.log', 'a', encoding='utf-8') as f:
                        f.write(json.dumps(log_data2) + '\n')
                except: pass
                # #endregion

        # Order by newest first
        posts = posts.order_by('-created_at')

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

        # Get total count for pagination info
        total_count = posts.count()
        total_pages = (total_count + self.PAGE_SIZE - 1) // self.PAGE_SIZE if total_count > 0 else 1

        # Apply pagination
        posts = posts[offset:offset + self.PAGE_SIZE]

        serializer = PostSerializer(posts, many=True, context={'request': request})
        
        return Response({
            'results': serializer.data,
            'count': total_count,
            'page': page,
            'page_size': self.PAGE_SIZE,
            'total_pages': total_pages,
            'has_next': page < total_pages,
            'has_previous': page > 1
        }, status=status.HTTP_200_OK)


class PostCommentView(APIView):
    """List and create comments for a post"""
    permission_classes = [IsAuthenticated]
    PAGE_SIZE = 20

    def _validate_post_access(self, post_id):
        """Helper method to validate post access and return post or error response"""
        try:
            post = Post.objects.select_related('family', 'author_user', 'author_person').get(id=post_id)
        except Post.DoesNotExist:
            return None, Response(
                {'error': 'Post does not exist.'},
                status=status.HTTP_404_NOT_FOUND
            )

        # Check if user is a member of the post's family
        membership = FamilyMembership.objects.filter(
            user=self.request.user,
            family=post.family,
            status=FamilyMembership.Status.ACTIVE
        ).first()

        if not membership:
            return None, Response(
                {'error': 'You are not a member of this post\'s family.'},
                status=status.HTTP_403_FORBIDDEN
            )

        # Verify post type is POST or ANNOUNCEMENT (comments not allowed on MESSAGE)
        if post.type == PostTypeChoices.MESSAGE:
            return None, Response(
                {'error': 'Comments are not allowed on MESSAGE type posts.'},
                status=status.HTTP_403_FORBIDDEN
            )

        return post, None

    def get(self, request, post_id):
        """List comments for a post"""
        post, error_response = self._validate_post_access(post_id)
        if error_response:
            return error_response

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

        # Get comments ordered by newest first
        comments = post.comments.select_related(
            'author_user', 'author_person'
        ).order_by('-created_at')

        # Get total count for pagination info
        total_count = comments.count()
        total_pages = (total_count + self.PAGE_SIZE - 1) // self.PAGE_SIZE if total_count > 0 else 1

        # Apply pagination
        comments = comments[offset:offset + self.PAGE_SIZE]

        serializer = PostCommentSerializer(comments, many=True)

        return Response({
            'results': serializer.data,
            'count': total_count,
            'page': page,
            'page_size': self.PAGE_SIZE,
            'total_pages': total_pages,
            'has_next': page < total_pages,
            'has_previous': page > 1
        }, status=status.HTTP_200_OK)

    def post(self, request, post_id):
        """Create a comment on a post"""
        post, error_response = self._validate_post_access(post_id)
        if error_response:
            return error_response

        # Prepare data with post_id from URL
        data = request.data.copy()
        data['post_id'] = post_id

        serializer = PostCommentCreateSerializer(data=data, context={'request': request})
        if serializer.is_valid():
            comment = serializer.save()
            response_serializer = PostCommentSerializer(comment)
            return Response(response_serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

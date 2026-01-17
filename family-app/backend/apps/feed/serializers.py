from rest_framework import serializers
from apps.feed.models import Post, PostComment, PostTypeChoices
from apps.families.models import FamilyMembership
from apps.graph.models import Person


class PostSerializer(serializers.ModelSerializer):
    """Serializer for Post model (listing/retrieval)"""
    author_user = serializers.StringRelatedField(read_only=True)
    author_person_id = serializers.IntegerField(source='author_person.id', read_only=True, allow_null=True)
    author_person_name = serializers.SerializerMethodField()
    family_id = serializers.IntegerField(source='family.id', read_only=True)
    family_name = serializers.CharField(source='family.name', read_only=True)
    photo_url = serializers.SerializerMethodField()
    voice_message_url = serializers.SerializerMethodField()
    file_attachment_url = serializers.SerializerMethodField()

    class Meta:
        model = Post
        fields = [
            'id', 'family_id', 'family_name', 'author_user', 
            'author_person_id', 'author_person_name', 'type', 
            'text', 'image_url', 'photo_url', 'voice_message_url', 
            'file_attachment_url', 'created_at'
        ]
        read_only_fields = fields

    def get_author_person_name(self, obj):
        if obj.author_person:
            return f"{obj.author_person.first_name} {obj.author_person.last_name}"
        return None

    def get_photo_url(self, obj):
        if obj.photo:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.photo.url)
            return obj.photo.url
        return None

    def get_voice_message_url(self, obj):
        if obj.voice_message:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.voice_message.url)
            return obj.voice_message.url
        return None

    def get_file_attachment_url(self, obj):
        if obj.file_attachment:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.file_attachment.url)
            return obj.file_attachment.url
        return None


class PostCreateSerializer(serializers.Serializer):
    """Serializer for creating posts"""
    family_id = serializers.IntegerField(required=True)
    author_person_id = serializers.IntegerField(required=False, allow_null=True)
    type = serializers.ChoiceField(choices=PostTypeChoices.choices, default=PostTypeChoices.POST)
    text = serializers.CharField(required=True)
    image_url = serializers.URLField(required=False, allow_null=True, allow_blank=True)
    photo = serializers.ImageField(required=False, allow_null=True)
    voice_message = serializers.FileField(required=False, allow_null=True)
    file_attachment = serializers.FileField(required=False, allow_null=True)

    def validate(self, attrs):
        request = self.context.get('request')
        if not request or not request.user:
            raise serializers.ValidationError("Authentication required.")

        family_id = attrs.get('family_id')
        author_person_id = attrs.get('author_person_id')
        post_type = attrs.get('type', PostTypeChoices.POST)
        image_url = attrs.get('image_url')
        photo = attrs.get('photo')
        voice_message = attrs.get('voice_message')
        file_attachment = attrs.get('file_attachment')

        # Check if user is a member of the family
        membership = FamilyMembership.objects.filter(
            user=request.user,
            family_id=family_id,
            status=FamilyMembership.Status.ACTIVE
        ).first()

        if not membership:
            raise serializers.ValidationError(
                {"family_id": "You are not a member of this family."}
            )

        # If author_person_id is provided, validate it belongs to the same family
        if author_person_id:
            person = Person.objects.filter(
                id=author_person_id,
                family_id=family_id
            ).first()
            if not person:
                raise serializers.ValidationError(
                    {"author_person_id": "Person does not exist in this family."}
                )

        # Validation based on post type
        if post_type == PostTypeChoices.MESSAGE:
            # MESSAGE type: cannot have photo or image_url
            if image_url:
                raise serializers.ValidationError(
                    {"image_url": "MESSAGE type posts cannot have an image_url"}
                )
            if photo:
                raise serializers.ValidationError(
                    {"photo": "MESSAGE type posts cannot have a photo"}
                )
            # MESSAGE type: can have voice_message OR file_attachment (not both)
            if voice_message and file_attachment:
                raise serializers.ValidationError(
                    {"voice_message": "MESSAGE type posts cannot have both voice_message and file_attachment"}
                )
        else:
            # POST/ANNOUNCEMENT types: cannot have voice_message or file_attachment
            if voice_message:
                raise serializers.ValidationError(
                    {"voice_message": f"{post_type} type posts cannot have a voice_message"}
                )
            if file_attachment:
                raise serializers.ValidationError(
                    {"file_attachment": f"{post_type} type posts cannot have a file_attachment"}
                )

        return attrs

    def create(self, validated_data):
        request = self.context.get('request')
        
        # Handle empty string for image_url
        image_url = validated_data.get('image_url')
        if image_url == '':
            image_url = None

        # #region agent log
        import json
        log_data = {
            'location': 'feed/serializers.py:142',
            'message': 'PostCreateSerializer.create - before create',
            'data': {
                'family_id': validated_data.get('family_id'),
                'author_user_id': request.user.id if request.user else None,
                'author_person_id': validated_data.get('author_person_id'),
                'type': validated_data.get('type', PostTypeChoices.POST),
                'text_length': len(validated_data.get('text', '')),
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

        post = Post.objects.create(
            family_id=validated_data['family_id'],
            author_user=request.user,
            author_person_id=validated_data.get('author_person_id'),
            type=validated_data.get('type', PostTypeChoices.POST),
            text=validated_data['text'],
            image_url=image_url,
            photo=validated_data.get('photo'),
            voice_message=validated_data.get('voice_message'),
            file_attachment=validated_data.get('file_attachment')
        )

        # #region agent log
        log_data2 = {
            'location': 'feed/serializers.py:153',
            'message': 'PostCreateSerializer.create - after create',
            'data': {
                'post_id': post.id,
                'author_person_id': post.author_person_id,
                'type': post.type,
                'author_user_id': post.author_user.id,
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

        return post


class PostCommentSerializer(serializers.ModelSerializer):
    """Serializer for PostComment model (listing/retrieval)"""
    author_user = serializers.StringRelatedField(read_only=True)
    author_person_id = serializers.IntegerField(source='author_person.id', read_only=True, allow_null=True)
    author_person_name = serializers.SerializerMethodField()
    post_id = serializers.IntegerField(source='post.id', read_only=True)

    class Meta:
        model = PostComment
        fields = [
            'id', 'post_id', 'author_user', 
            'author_person_id', 'author_person_name', 
            'text', 'created_at'
        ]
        read_only_fields = fields

    def get_author_person_name(self, obj):
        if obj.author_person:
            return f"{obj.author_person.first_name} {obj.author_person.last_name}"
        return None


class PostCommentCreateSerializer(serializers.Serializer):
    """Serializer for creating post comments"""
    post_id = serializers.IntegerField(required=True)
    author_person_id = serializers.IntegerField(required=False, allow_null=True)
    text = serializers.CharField(required=True)

    def validate(self, attrs):
        request = self.context.get('request')
        if not request or not request.user:
            raise serializers.ValidationError("Authentication required.")

        post_id = attrs.get('post_id')
        author_person_id = attrs.get('author_person_id')

        # Check if post exists
        try:
            post = Post.objects.get(id=post_id)
        except Post.DoesNotExist:
            raise serializers.ValidationError(
                {"post_id": "Post does not exist."}
            )

        # Check if user is a member of the post's family
        membership = FamilyMembership.objects.filter(
            user=request.user,
            family=post.family,
            status=FamilyMembership.Status.ACTIVE
        ).first()

        if not membership:
            raise serializers.ValidationError(
                {"post_id": "You are not a member of this post's family."}
            )

        # If author_person_id is provided, validate it belongs to the same family as the post
        if author_person_id:
            person = Person.objects.filter(
                id=author_person_id,
                family=post.family
            ).first()
            if not person:
                raise serializers.ValidationError(
                    {"author_person_id": "Person does not exist in this post's family."}
                )

        return attrs

    def create(self, validated_data):
        request = self.context.get('request')
        
        comment = PostComment.objects.create(
            post_id=validated_data['post_id'],
            author_user=request.user,
            author_person_id=validated_data.get('author_person_id'),
            text=validated_data['text']
        )
        return comment

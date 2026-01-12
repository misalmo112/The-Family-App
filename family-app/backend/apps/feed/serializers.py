from rest_framework import serializers
from apps.feed.models import Post, PostTypeChoices
from apps.families.models import FamilyMembership
from apps.graph.models import Person


class PostSerializer(serializers.ModelSerializer):
    """Serializer for Post model (listing/retrieval)"""
    author_user = serializers.StringRelatedField(read_only=True)
    author_person_id = serializers.IntegerField(source='author_person.id', read_only=True, allow_null=True)
    author_person_name = serializers.SerializerMethodField()
    family_id = serializers.IntegerField(source='family.id', read_only=True)
    family_name = serializers.CharField(source='family.name', read_only=True)

    class Meta:
        model = Post
        fields = [
            'id', 'family_id', 'family_name', 'author_user', 
            'author_person_id', 'author_person_name', 'type', 
            'text', 'image_url', 'created_at'
        ]
        read_only_fields = fields

    def get_author_person_name(self, obj):
        if obj.author_person:
            return f"{obj.author_person.first_name} {obj.author_person.last_name}"
        return None


class PostCreateSerializer(serializers.Serializer):
    """Serializer for creating posts"""
    family_id = serializers.IntegerField(required=True)
    author_person_id = serializers.IntegerField(required=False, allow_null=True)
    type = serializers.ChoiceField(choices=PostTypeChoices.choices, default=PostTypeChoices.POST)
    text = serializers.CharField(required=True)
    image_url = serializers.URLField(required=False, allow_null=True, allow_blank=True)

    def validate(self, attrs):
        request = self.context.get('request')
        if not request or not request.user:
            raise serializers.ValidationError("Authentication required.")

        family_id = attrs.get('family_id')
        author_person_id = attrs.get('author_person_id')

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

        return attrs

    def create(self, validated_data):
        request = self.context.get('request')
        
        # Handle empty string for image_url
        image_url = validated_data.get('image_url')
        if image_url == '':
            image_url = None

        post = Post.objects.create(
            family_id=validated_data['family_id'],
            author_user=request.user,
            author_person_id=validated_data.get('author_person_id'),
            type=validated_data.get('type', PostTypeChoices.POST),
            text=validated_data['text'],
            image_url=image_url
        )
        return post

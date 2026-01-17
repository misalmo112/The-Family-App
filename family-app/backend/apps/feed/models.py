from django.conf import settings
from django.db import models


class PostTypeChoices(models.TextChoices):
    POST = 'POST', 'Post'
    ANNOUNCEMENT = 'ANNOUNCEMENT', 'Announcement'
    MESSAGE = 'MESSAGE', 'Message'


class Post(models.Model):
    """Post in the family feed"""
    family = models.ForeignKey(
        'families.Family',
        on_delete=models.CASCADE,
        related_name='posts'
    )
    author_user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='feed_posts'
    )
    author_person = models.ForeignKey(
        'graph.Person',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='feed_posts'
    )
    type = models.CharField(
        max_length=20,
        choices=PostTypeChoices.choices,
        default=PostTypeChoices.POST
    )
    text = models.TextField()
    image_url = models.URLField(null=True, blank=True)
    photo = models.ImageField(upload_to='photos/%Y/%m/%d/', null=True, blank=True)
    voice_message = models.FileField(upload_to='voice/%Y/%m/%d/', null=True, blank=True)
    file_attachment = models.FileField(upload_to='attachments/%Y/%m/%d/', null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'feed_post'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.author_user.username} - {self.type} in {self.family.name}"


class PostComment(models.Model):
    """Comment on a post in the family feed"""
    post = models.ForeignKey(
        'feed.Post',
        on_delete=models.CASCADE,
        related_name='comments'
    )
    author_user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='feed_comments'
    )
    author_person = models.ForeignKey(
        'graph.Person',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='feed_comments'
    )
    text = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'feed_postcomment'
        ordering = ['-created_at']

    def __str__(self):
        return f"Comment by {self.author_user.username} on post {self.post.id}"

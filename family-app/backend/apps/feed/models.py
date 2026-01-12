from django.conf import settings
from django.db import models


class PostTypeChoices(models.TextChoices):
    POST = 'POST', 'Post'
    ANNOUNCEMENT = 'ANNOUNCEMENT', 'Announcement'


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
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'feed_post'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.author_user.username} - {self.type} in {self.family.name}"

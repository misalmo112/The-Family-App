from django.contrib.auth.models import AbstractUser
from django.db import models
from apps.graph.models import GenderChoices


class User(AbstractUser):
    """Custom user model extending AbstractUser"""
    is_superadmin = models.BooleanField(default=False)
    email = models.EmailField(unique=True, blank=False, null=False)
    dob = models.DateField(null=True, blank=True)
    gender = models.CharField(
        max_length=10,
        choices=GenderChoices.choices,
        default=GenderChoices.UNKNOWN
    )


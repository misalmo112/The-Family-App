from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    """Custom user model extending AbstractUser"""
    is_superadmin = models.BooleanField(default=False)


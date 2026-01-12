from django.db import models


class GenderChoices(models.TextChoices):
    MALE = 'MALE', 'Male'
    FEMALE = 'FEMALE', 'Female'
    OTHER = 'OTHER', 'Other'
    UNKNOWN = 'UNKNOWN', 'Unknown'


class RelationshipTypeChoices(models.TextChoices):
    PARENT_OF = 'PARENT_OF', 'Parent Of'
    SPOUSE_OF = 'SPOUSE_OF', 'Spouse Of'


class Person(models.Model):
    """Person node in the family graph"""
    family = models.ForeignKey(
        'families.Family',
        on_delete=models.CASCADE,
        related_name='persons'
    )
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    dob = models.DateField(null=True, blank=True)
    gender = models.CharField(
        max_length=10,
        choices=GenderChoices.choices,
        default=GenderChoices.UNKNOWN
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'graph_person'
        ordering = ['last_name', 'first_name']

    def __str__(self):
        return f"{self.first_name} {self.last_name}"


class Relationship(models.Model):
    """Relationship between Person nodes in the family graph"""
    family = models.ForeignKey(
        'families.Family',
        on_delete=models.CASCADE,
        related_name='relationships'
    )
    from_person = models.ForeignKey(
        'graph.Person',
        on_delete=models.CASCADE,
        related_name='outgoing_relationships'
    )
    to_person = models.ForeignKey(
        'graph.Person',
        on_delete=models.CASCADE,
        related_name='incoming_relationships'
    )
    type = models.CharField(
        max_length=20,
        choices=RelationshipTypeChoices.choices
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'graph_relationship'
        unique_together = [('family', 'from_person', 'to_person', 'type')]
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.from_person} {self.get_type_display()} {self.to_person}"


from django.urls import path
from apps.graph.views import PersonView, TopologyView, RelationshipView, RelationshipSuggestionsView, RelationshipCompletionView, BulkFamilyUnitView, BulkRelationshipView

app_name = 'graph'

urlpatterns = [
    path('persons/', PersonView.as_view(), name='person-list-create'),
    path('topology/', TopologyView.as_view(), name='topology'),
    path('relationships/', RelationshipView.as_view(), name='relationship-list-create'),
    path('relationships/<int:pk>/', RelationshipView.as_view(), name='relationship-delete'),
    path('relationships/suggestions/', RelationshipSuggestionsView.as_view(), name='relationship-suggestions'),
    path('relationships/completion/', RelationshipCompletionView.as_view(), name='relationship-completion'),
    path('relationships/bulk/', BulkRelationshipView.as_view(), name='bulk-relationship-create'),
    path('family-units/', BulkFamilyUnitView.as_view(), name='bulk-family-unit'),
]


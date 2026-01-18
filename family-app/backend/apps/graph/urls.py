from django.urls import path
from apps.graph.views import PersonView, TopologyView, RelationshipView

app_name = 'graph'

urlpatterns = [
    path('persons/', PersonView.as_view(), name='person-list-create'),
    path('topology/', TopologyView.as_view(), name='topology'),
    path('relationships/', RelationshipView.as_view(), name='relationship-list-create'),
    path('relationships/<int:pk>/', RelationshipView.as_view(), name='relationship-delete'),
]


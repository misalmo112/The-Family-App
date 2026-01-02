from django.urls import path
from apps.graph.views import PersonView

app_name = 'graph'

urlpatterns = [
    path('persons/', PersonView.as_view(), name='person-list-create'),
]


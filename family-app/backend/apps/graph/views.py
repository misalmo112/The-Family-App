# Views for graph app
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from django.core.exceptions import ValidationError
from apps.graph.models import Person, Relationship, RelationshipTypeChoices
from apps.graph.serializers import PersonSerializer, RelationshipSerializer, RelationshipSuggestionSerializer, BulkFamilyUnitSerializer, BulkRelationshipSerializer
from apps.graph.services.relationship_service import add_parent, add_spouse, delete_relationship
from apps.graph.services.relationship_suggestions import get_related_suggestions
from apps.graph.services.relationship_completion import analyze_missing_relationships
from apps.graph.services.bulk_relationship_service import create_family_unit, create_bulk_relationships


def is_family_admin(user, family):
    """Check if user is ADMIN of the family"""
    try:
        from apps.families.models import FamilyMembership
        membership = FamilyMembership.objects.get(user=user, family=family)
        return membership.role == 'ADMIN'
    except:
        return False


def is_family_member(user, family):
    """Check if user is a member of the family"""
    try:
        from apps.families.models import FamilyMembership
        return FamilyMembership.objects.filter(user=user, family=family).exists()
    except:
        return False


class PersonView(APIView):
    """List persons for a family or create a new person"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """List persons for a family (member of that family)"""
        family_id = request.query_params.get('family_id')
        if not family_id:
            return Response(
                {'error': 'family_id query parameter is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Get family object
        try:
            from apps.families.models import Family
            family = get_object_or_404(Family, id=family_id)
        except:
            return Response(
                {'error': 'Family not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        # Check if user is a member of that family
        if not is_family_member(request.user, family):
            return Response(
                {'error': 'You must be a member of this family to view persons'},
                status=status.HTTP_403_FORBIDDEN
            )

        # Filter persons by family
        persons = Person.objects.filter(family=family)
        serializer = PersonSerializer(persons, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        """Create a new person (ADMIN of that family only)"""
        serializer = PersonSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        # Get family from validated data (serializer converts family ID to Family object)
        family = serializer.validated_data.get('family')
        if not family:
            return Response(
                {'error': 'family is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Check if user is ADMIN of that family
        if not is_family_admin(request.user, family):
            return Response(
                {'error': 'Only family admins can create persons'},
                status=status.HTTP_403_FORBIDDEN
            )

        # Create person
        person = serializer.save()
        return Response(PersonSerializer(person).data, status=status.HTTP_201_CREATED)


class RelationshipView(APIView):
    """Create, list, and delete relationships between persons (ADMIN of family only for create/delete)"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """List relationships for a family (member of that family)"""
        family_id = request.query_params.get('family_id')
        if not family_id:
            return Response(
                {'error': 'family_id query parameter is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Get family object
        try:
            from apps.families.models import Family
            family = get_object_or_404(Family, id=family_id)
        except:
            return Response(
                {'error': 'Family not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        # Check if user is a member of that family
        if not is_family_member(request.user, family):
            return Response(
                {'error': 'You must be a member of this family to view relationships'},
                status=status.HTTP_403_FORBIDDEN
            )

        # Filter relationships by family
        relationships = Relationship.objects.filter(family=family).select_related('from_person', 'to_person')
        serializer = RelationshipSerializer(relationships, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        """Create a new relationship"""
        serializer = RelationshipSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        # Get validated data
        family = serializer.validated_data.get('family')
        relationship_type = serializer.validated_data.get('type')
        from_person = serializer.validated_data.get('from_person')
        to_person = serializer.validated_data.get('to_person')

        # Check if user is ADMIN of that family
        if not is_family_admin(request.user, family):
            return Response(
                {'error': 'Only family admins can create relationships'},
                status=status.HTTP_403_FORBIDDEN
            )

        # Route to appropriate service method based on type
        try:
            if relationship_type == RelationshipTypeChoices.PARENT_OF:
                relationship = add_parent(family, from_person, to_person)
                return Response(
                    RelationshipSerializer(relationship).data,
                    status=status.HTTP_201_CREATED
                )
            elif relationship_type == RelationshipTypeChoices.SPOUSE_OF:
                relationship_ab, relationship_ba = add_spouse(family, from_person, to_person)
                # Return both relationships
                return Response(
                    {
                        'relationship_ab': RelationshipSerializer(relationship_ab).data,
                        'relationship_ba': RelationshipSerializer(relationship_ba).data
                    },
                    status=status.HTTP_201_CREATED
                )
            else:
                return Response(
                    {'error': f'Unsupported relationship type: {relationship_type}'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        except ValidationError as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

    def delete(self, request, pk=None):
        """Delete a relationship (ADMIN of family only)"""
        import json
        import os
        import traceback
        DEBUG_LOG_PATH = r'c:\Users\misal\OneDrive\Belgeler\Projects\Github\The-Family-App\.cursor\debug.log'
        def _log_debug(location, message, data, hypothesis_id):
            try:
                log_entry = {
                    'location': location,
                    'message': message,
                    'data': data,
                    'timestamp': __import__('time').time() * 1000,
                    'sessionId': 'debug-session',
                    'runId': 'run1',
                    'hypothesisId': hypothesis_id
                }
                with open(DEBUG_LOG_PATH, 'a', encoding='utf-8') as f:
                    f.write(json.dumps(log_entry) + '\n')
            except:
                pass
        _log_debug('views.py:179', 'Delete endpoint called', {'pk': pk, 'has_pk': pk is not None}, 'D')
        # Get relationship ID from URL parameter or request body
        relationship_id = pk or request.data.get('id')
        _log_debug('views.py:183', 'Relationship ID extracted', {'relationship_id': relationship_id, 'from_pk': pk is not None}, 'D')
        if not relationship_id:
            _log_debug('views.py:185', 'Missing relationship ID', {}, 'D')
            return Response(
                {'error': 'Relationship ID is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Get relationship
        try:
            relationship = get_object_or_404(Relationship, id=relationship_id)
            _log_debug('views.py:192', 'Relationship found', {'relationship_id': relationship.id, 'type': relationship.type, 'family_id': relationship.family.id}, 'D')
        except Exception as e:
            _log_debug('views.py:195', 'Relationship not found', {'relationship_id': relationship_id, 'error': str(e)}, 'D')
            return Response(
                {'error': 'Relationship not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        # Check if user is ADMIN of that family
        is_admin = is_family_admin(request.user, relationship.family)
        _log_debug('views.py:200', 'Admin check', {'is_admin': is_admin, 'user': request.user.username, 'family_id': relationship.family.id}, 'D')
        if not is_admin:
            return Response(
                {'error': 'Only family admins can delete relationships'},
                status=status.HTTP_403_FORBIDDEN
            )

        # Delete the relationship(s)
        try:
            _log_debug('views.py:207', 'Calling delete_relationship service', {'relationship_id': relationship.id, 'type': relationship.type}, 'D')
            deleted_relationships = delete_relationship(relationship)
            _log_debug('views.py:208', 'delete_relationship service success', {'deleted_count': len(deleted_relationships)}, 'D')
            
            # Optional: Create audit log entry
            try:
                from apps.admin_panel.services.audit import log_action
                log_action(
                    actor_user=request.user,
                    action_type='RELATIONSHIP_DELETE',
                    entity_type='Relationship',
                    entity_id=str(relationship_id),
                    family_id=relationship.family.id,
                    before={
                        'from_person_id': relationship.from_person.id,
                        'to_person_id': relationship.to_person.id,
                        'type': relationship.type
                    },
                    after=None
                )
            except ImportError:
                # Audit service not available, continue without logging
                pass
            
            _log_debug('views.py:229', 'Returning success response', {'status': 204}, 'D')
            return Response(status=status.HTTP_204_NO_CONTENT)
        except ValidationError as e:
            _log_debug('views.py:231', 'ValidationError in delete', {'error': str(e), 'error_type': type(e).__name__}, 'D')
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            _log_debug('views.py:236', 'Unexpected exception in delete', {'error': str(e), 'error_type': type(e).__name__, 'traceback': traceback.format_exc()}, 'D')
            return Response(
                {'error': f'Error deleting relationship: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class TopologyView(APIView):
    """Get family graph topology"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Get topology for a family"""
        family_id = request.query_params.get('family_id')
        viewer_person_id = request.query_params.get('viewer_person_id')
        
        # Validate required query params
        if not family_id:
            return Response(
                {'error': 'family_id query parameter is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if not viewer_person_id:
            return Response(
                {'error': 'viewer_person_id query parameter is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Convert to integers
        try:
            family_id = int(family_id)
            viewer_person_id = int(viewer_person_id)
        except ValueError:
            return Response(
                {'error': 'family_id and viewer_person_id must be valid integers'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get family object
        try:
            from apps.families.models import Family
            family = get_object_or_404(Family, id=family_id)
        except:
            return Response(
                {'error': 'Family not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Check if user is a member of that family
        if not is_family_member(request.user, family):
            return Response(
                {'error': 'You must be a member of this family to view topology'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Get topology data using service
        try:
            from apps.graph.services.topology_service import get_family_topology
            topology_data = get_family_topology(family_id, viewer_person_id)
        except ValueError as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            return Response(
                {'error': 'Person not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Serialize and return response
        from apps.graph.serializers import TopologyResponseSerializer
        serializer = TopologyResponseSerializer(topology_data)
        return Response(serializer.data, status=status.HTTP_200_OK)


class RelationshipSuggestionsView(APIView):
    """Get relationship suggestions after creating a relationship"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """Get suggestions for a newly created relationship"""
        family_id = request.query_params.get('family_id')
        from_person_id = request.query_params.get('from_person_id')
        to_person_id = request.query_params.get('to_person_id')
        relationship_type = request.query_params.get('relationship_type')
        
        # Validate required parameters
        if not all([family_id, from_person_id, to_person_id, relationship_type]):
            return Response(
                {'error': 'family_id, from_person_id, to_person_id, and relationship_type are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Convert to integers
        try:
            family_id = int(family_id)
            from_person_id = int(from_person_id)
            to_person_id = int(to_person_id)
        except ValueError:
            return Response(
                {'error': 'family_id, from_person_id, and to_person_id must be valid integers'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate relationship type
        if relationship_type not in [RelationshipTypeChoices.PARENT_OF, RelationshipTypeChoices.SPOUSE_OF]:
            return Response(
                {'error': 'relationship_type must be PARENT_OF or SPOUSE_OF'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get family object
        try:
            from apps.families.models import Family
            family = get_object_or_404(Family, id=family_id)
        except:
            return Response(
                {'error': 'Family not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Check if user is a member of that family
        if not is_family_member(request.user, family):
            return Response(
                {'error': 'You must be a member of this family to view suggestions'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Get suggestions
        try:
            suggestions = get_related_suggestions(family_id, from_person_id, to_person_id, relationship_type)
            serializer = RelationshipSuggestionSerializer(suggestions, many=True)
            return Response({'suggestions': serializer.data}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response(
                {'error': f'Error generating suggestions: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class RelationshipCompletionView(APIView):
    """Get missing relationship suggestions for a family"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """Get suggestions for missing relationships"""
        family_id = request.query_params.get('family_id')
        person_id = request.query_params.get('person_id')  # Optional
        
        # Validate required parameters
        if not family_id:
            return Response(
                {'error': 'family_id query parameter is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Convert to integers
        try:
            family_id = int(family_id)
            if person_id:
                person_id = int(person_id)
        except ValueError:
            return Response(
                {'error': 'family_id and person_id must be valid integers'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get family object
        try:
            from apps.families.models import Family
            family = get_object_or_404(Family, id=family_id)
        except:
            return Response(
                {'error': 'Family not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Check if user is a member of that family
        if not is_family_member(request.user, family):
            return Response(
                {'error': 'You must be a member of this family to view completion suggestions'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Get suggestions
        try:
            import json
            import os
            DEBUG_LOG_PATH = r'c:\Users\misal\OneDrive\Belgeler\Projects\Github\The-Family-App\.cursor\debug.log'
            def _log_debug(location, message, data, hypothesis_id):
                try:
                    log_entry = {
                        'location': location,
                        'message': message,
                        'data': data,
                        'timestamp': __import__('time').time() * 1000,
                        'sessionId': 'debug-session',
                        'runId': 'run1',
                        'hypothesisId': hypothesis_id
                    }
                    with open(DEBUG_LOG_PATH, 'a', encoding='utf-8') as f:
                        f.write(json.dumps(log_entry) + '\n')
                except:
                    pass
            _log_debug('views.py:418', 'Calling analyze_missing_relationships', {'family_id': family_id, 'person_id': person_id}, 'D')
            suggestions = analyze_missing_relationships(family_id, person_id)
            _log_debug('views.py:420', 'Got suggestions from service', {'suggestion_count': len(suggestions)}, 'D')
            serializer = RelationshipSuggestionSerializer(suggestions, many=True)
            _log_debug('views.py:421', 'Serialized suggestions', {'serialized_count': len(serializer.data)}, 'D')
            return Response({'suggestions': serializer.data}, status=status.HTTP_200_OK)
        except Exception as e:
            import traceback
            _log_debug('views.py:425', 'Exception in completion view', {'error': str(e), 'error_type': type(e).__name__, 'traceback': traceback.format_exc()}, 'D')
            return Response(
                {'error': f'Error analyzing relationships: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class BulkFamilyUnitView(APIView):
    """Create a family unit (parents + children) in one operation"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        """Create a family unit with parents and children"""
        serializer = BulkFamilyUnitSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        from apps.families.models import Family
        family = get_object_or_404(Family, id=serializer.validated_data['family_id'])
        if not is_family_admin(request.user, family):
            return Response(
                {'error': 'Only family admins can create family units'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        result = create_family_unit(
            family,
            serializer.validated_data.get('parent1_id'),
            serializer.validated_data.get('parent2_id'),
            serializer.validated_data['children_ids']
        )
        
        if result['success']:
            return Response({
                'created_count': len(result['created']),
                'relationships': RelationshipSerializer(result['created'], many=True).data
            }, status=status.HTTP_201_CREATED)
        else:
            # Partial success - some relationships created, some failed
            return Response({
                'created_count': len(result['created']),
                'errors': result['errors'],
                'relationships': RelationshipSerializer(result['created'], many=True).data
            }, status=status.HTTP_207_MULTI_STATUS)


class BulkRelationshipView(APIView):
    """Create multiple relationships using user-friendly labels in one operation"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        """Create multiple relationships from labels"""
        serializer = BulkRelationshipSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        family = serializer.validated_data['family']
        if not is_family_admin(request.user, family):
            return Response(
                {'error': 'Only family admins can create relationships'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        relationship_requests = serializer.validated_data['relationships']
        
        result = create_bulk_relationships(family, relationship_requests)
        
        response_data = {
            'created_count': len(result['created']),
            'failed_count': len(result['failed']),
            'relationships': RelationshipSerializer(result['created'], many=True).data,
            'warnings': result['warnings']
        }
        
        if result['failed']:
            response_data['failed'] = [
                {
                    'viewer_id': req['request']['viewer_id'],
                    'target_id': req['request']['target_id'],
                    'label': req['request']['label'],
                    'error': req['error']
                }
                for req in result['failed']
            ]
        
        if result['success']:
            return Response(response_data, status=status.HTTP_201_CREATED)
        elif len(result['created']) > 0:
            # Partial success
            return Response(response_data, status=status.HTTP_207_MULTI_STATUS)
        else:
            # All failed
            return Response(response_data, status=status.HTTP_400_BAD_REQUEST)

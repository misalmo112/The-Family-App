import api from './api';

/**
 * Fetch persons list for a family
 * @param {Object} params - Query parameters
 * @param {number} params.familyId - The family ID
 * @returns {Promise<Array>} Array of person objects
 */
export const getPersons = async ({ familyId }) => {
  const response = await api.get('/api/graph/persons/', {
    params: {
      family_id: familyId,
    },
  });
  return response.data;
};

/**
 * Fetch topology for a family from a viewer's perspective
 * @param {Object} params - Query parameters
 * @param {number} params.familyId - The family ID
 * @param {number} params.viewerPersonId - The person ID viewing the topology
 * @returns {Promise<Object>} Topology object with nodes and edges
 */
export const getTopology = async ({ familyId, viewerPersonId }) => {
  const response = await api.get('/api/graph/topology/', {
    params: {
      family_id: familyId,
      viewer_person_id: viewerPersonId,
    },
  });
  return response.data;
};

/**
 * Create a new person in a family (admin only)
 * @param {Object} params - Person parameters
 * @param {number} params.familyId - The family ID
 * @param {string} params.firstName - First name
 * @param {string} params.lastName - Last name
 * @param {string} params.dob - Date of birth (optional, format: YYYY-MM-DD)
 * @param {string} params.gender - Gender (MALE, FEMALE, OTHER, UNKNOWN)
 * @returns {Promise<Object>} Created person object
 */
export const createPerson = async ({ familyId, firstName, lastName, dob, gender }) => {
  const response = await api.post('/api/graph/persons/', {
    family_id: familyId,
    first_name: firstName,
    last_name: lastName,
    dob: dob || null,
    gender: gender || 'UNKNOWN',
  });
  return response.data;
};

/**
 * Create a relationship between two persons
 * @param {Object} params - Relationship parameters
 * @param {number} params.familyId - The family ID
 * @param {number} params.fromPersonId - The person ID for the "from" side
 * @param {number} params.toPersonId - The person ID for the "to" side
 * @param {string} params.type - Relationship type ('PARENT_OF' or 'SPOUSE_OF')
 * @param {string} [params.label] - Optional label (e.g. 'mother', 'father') to auto-set parent gender
 * @returns {Promise<Object>} Created relationship object(s)
 */
export const createRelationship = async ({ familyId, fromPersonId, toPersonId, type, label }) => {
  const body = {
    family_id: familyId,
    from_person_id: fromPersonId,
    to_person_id: toPersonId,
    type: type,
  };
  if (label) body.label = label;
  const response = await api.post('/api/graph/relationships/', body);
  return response.data;
};

/**
 * Get all relationships for a family
 * @param {Object} params - Query parameters
 * @param {number} params.familyId - The family ID
 * @returns {Promise<Array>} Array of relationship objects
 */
export const getRelationships = async ({ familyId }) => {
  const response = await api.get('/api/graph/relationships/', {
    params: {
      family_id: familyId,
    },
  });
  return response.data;
};

/**
 * Delete a relationship
 * @param {number} relationshipId - The relationship ID to delete
 * @returns {Promise<void>}
 */
export const deleteRelationship = async (relationshipId) => {
  // #region agent log
  const deleteUrl = `/api/graph/relationships/${relationshipId}/`;
  fetch('http://127.0.0.1:7243/ingest/6368f2fd-ba5e-49e7-ab28-982fbdfb0612',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'graph.js:95',message:'deleteRelationship called',data:{relationshipId,deleteUrl,baseURL:api.defaults.baseURL,fullUrl:`${api.defaults.baseURL}${deleteUrl}`},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
  // #endregion
  try {
    const response = await api.delete(deleteUrl);
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/6368f2fd-ba5e-49e7-ab28-982fbdfb0612',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'graph.js:99',message:'deleteRelationship API success',data:{status:response.status,relationshipId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    return response.data;
  } catch (err) {
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/6368f2fd-ba5e-49e7-ab28-982fbdfb0612',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'graph.js:103',message:'deleteRelationship API error',data:{error:err.message,errorCode:err.code,status:err.response?.status,responseData:err.response?.data,relationshipId,requestUrl:deleteUrl,hasResponse:!!err.response,isNetworkError:err.message==='Network Error'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
    // #endregion
    throw err;
  }
};

/**
 * Get relationship suggestions after creating a relationship
 * @param {Object} params - Query parameters
 * @param {number} params.familyId - The family ID
 * @param {number} params.fromPersonId - The person ID for the "from" side
 * @param {number} params.toPersonId - The person ID for the "to" side
 * @param {string} params.type - Relationship type ('PARENT_OF' or 'SPOUSE_OF')
 * @returns {Promise<Array>} Array of suggestion objects
 */
export const getRelationshipSuggestions = async ({ familyId, fromPersonId, toPersonId, type }) => {
  const response = await api.get('/api/graph/relationships/suggestions/', {
    params: {
      family_id: familyId,
      from_person_id: fromPersonId,
      to_person_id: toPersonId,
      relationship_type: type,
    },
  });
  return response.data.suggestions;
};

/**
 * Get relationship completion suggestions for a family
 * @param {Object} params - Query parameters
 * @param {number} params.familyId - The family ID
 * @param {number|null} params.personId - Optional person ID to analyze
 * @returns {Promise<Array>} Array of suggestion objects
 */
export const getRelationshipCompletion = async ({ familyId, personId = null }) => {
  // #region agent log
  fetch('http://127.0.0.1:7243/ingest/6368f2fd-ba5e-49e7-ab28-982fbdfb0612',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'graph.js:128',message:'getRelationshipCompletion called',data:{familyId,personId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
  // #endregion
  try {
    const params = { family_id: familyId };
    if (personId != null && personId !== '') params.person_id = personId;
    const response = await api.get('/api/graph/relationships/completion/', { params });
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/6368f2fd-ba5e-49e7-ab28-982fbdfb0612',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'graph.js:136',message:'API response received',data:{status:response.status,hasSuggestions:!!response.data.suggestions,suggestionsCount:response.data.suggestions?.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    return response.data.suggestions;
  } catch (err) {
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/6368f2fd-ba5e-49e7-ab28-982fbdfb0612',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'graph.js:140',message:'API call failed',data:{error:err.message,status:err.response?.status,data:err.response?.data},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
    // #endregion
    throw err;
  }
};

/**
 * Create a family unit (parents + children) in one operation.
 * Accepts either IDs or names; names are resolved or create Person (like bulk relationships).
 * @param {Object} params - Family unit parameters
 * @param {number} params.familyId - The family ID
 * @param {number|null} params.parent1Id - First parent ID (optional if parent1Name provided)
 * @param {number|null} params.parent2Id - Second parent ID (optional if parent2Name provided)
 * @param {string} [params.parent1Name] - First parent full name (creates person if not found)
 * @param {string} [params.parent2Name] - Second parent full name (creates person if not found)
 * @param {Array<number>} [params.childrenIds] - Array of child person IDs
 * @param {Array<string>} [params.childrenNames] - Array of child full names (creates persons if not found)
 * @returns {Promise<Object>} Created relationships and result
 */
export const createFamilyUnit = async ({
  familyId,
  parent1Id,
  parent2Id,
  parent1Name,
  parent2Name,
  childrenIds,
  childrenNames,
}) => {
  const payload = {
    family_id: familyId,
    parent1_id: parent1Id ?? null,
    parent2_id: parent2Id ?? null,
    children_ids: childrenIds ?? [],
    children_names: childrenNames ?? [],
  };
  if ((parent1Name || '').trim()) {
    payload.parent1_name = parent1Name.trim();
  }
  if ((parent2Name || '').trim()) {
    payload.parent2_name = parent2Name.trim();
  }
  const response = await api.post('/api/graph/family-units/', payload);
  return response.data;
};

/**
 * Create multiple relationships in bulk using user-friendly labels.
 * Each relationship may use viewer_id/target_id (manual tab) or viewer_name/target_name (CSV; backend resolves or creates persons).
 * @param {Object} params - Bulk relationship parameters
 * @param {number} params.familyId - The family ID
 * @param {Array<Object>} params.relationships - Array of { viewerId, targetId, label } or { viewer_name, target_name, label }
 * @returns {Promise<Object>} Result with created relationships, failed relationships, and warnings
 */
export const createBulkRelationships = async ({ familyId, relationships }) => {
  const response = await api.post('/api/graph/relationships/bulk/', {
    family_id: familyId,
    relationships: relationships.map((rel) => {
      if (rel.viewer_name != null && rel.target_name != null) {
        return { viewer_name: rel.viewer_name, target_name: rel.target_name, label: rel.label };
      }
      return { viewer_id: rel.viewerId, target_id: rel.targetId, label: rel.label };
    }),
  });
  return response.data;
};

/**
 * Get the current user's person ID in a family
 * Uses heuristic: tries to fetch posts with scope=all_families for each person
 * The person that succeeds is the current user's person
 * @param {number} familyId - The family ID
 * @returns {Promise<number|null>} Person ID or null if not found
 */
export const getCurrentUserPersonId = async (familyId) => {
  try {
    // Import getFeed dynamically to avoid circular dependency
    const { getFeed } = await import('./feed');
    const { getProfile } = await import('./auth');
    
    // Get current user profile
    const profile = await getProfile();
    if (!profile?.username) {
      return null;
    }
    
    // Get all persons in the family
    const persons = await getPersons({ familyId });
    if (!persons || persons.length === 0) {
      return null;
    }
    
    // Try to find the person ID by attempting to fetch posts with scope=all_families
    // The first person ID that works is the user's person ID
    for (const person of persons) {
      try {
        await getFeed({
          familyId: familyId,
          authorPersonId: person.id,
          type: 'POST',
          scope: 'all_families',
          page: 1,
        });
        // If successful, this is the user's person ID
        return person.id;
      } catch (err) {
        // Not this person, continue
        continue;
      }
    }
    
    // If no person worked with scope=all_families, return null
    return null;
  } catch (err) {
    console.error('Error getting current user person ID:', err);
    return null;
  }
};
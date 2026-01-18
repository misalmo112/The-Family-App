/**
 * Relationship Translator Service
 * 
 * Translates user-friendly relationship labels (father, mother, uncle, etc.)
 * into the minimal set of PARENT_OF and SPOUSE_OF edges required by the backend.
 */

// Direct relationships that map to a single edge
const DIRECT_LABELS = ['father', 'mother', 'son', 'daughter', 'husband', 'wife', 'spouse'];

// Indirect relationships that may require multiple edges or intermediate persons
const INDIRECT_LABELS = [
  'brother', 'sister', 
  'grandfather', 'grandmother', 'grandson', 'granddaughter',
  'uncle', 'aunt', 'nephew', 'niece', 'cousin',
  'father-in-law', 'mother-in-law'
];

// Gender-specific labels
const MALE_LABELS = ['father', 'son', 'husband', 'brother', 'grandfather', 'grandson', 'uncle', 'nephew', 'father-in-law'];
const FEMALE_LABELS = ['mother', 'daughter', 'wife', 'sister', 'grandmother', 'granddaughter', 'aunt', 'niece', 'mother-in-law'];
const GENDER_NEUTRAL_LABELS = ['spouse', 'cousin'];

/**
 * Translate a relationship label into the required edges
 * @param {string} label - Relationship label (e.g., 'father', 'uncle')
 * @param {number} viewerId - ID of the person viewing (the "from" perspective)
 * @param {number} targetId - ID of the target person
 * @param {Object} topology - Topology object with nodes and edges
 * @returns {Object} { edges: Array, missingPersons: Array, warnings: Array }
 */
export function translateLabel(label, viewerId, targetId, topology) {
  const edges = [];
  const missingPersons = [];
  const warnings = [];

  // Normalize label to lowercase
  const normalizedLabel = label.toLowerCase();

  switch (normalizedLabel) {
    case 'father':
    case 'mother':
      // Target is parent of viewer -> PARENT_OF from target to viewer
      edges.push({
        from: targetId,
        to: viewerId,
        type: 'PARENT_OF'
      });
      break;

    case 'son':
    case 'daughter':
      // Viewer is parent of target -> PARENT_OF from viewer to target
      edges.push({
        from: viewerId,
        to: targetId,
        type: 'PARENT_OF'
      });
      break;

    case 'husband':
    case 'wife':
    case 'spouse':
      // SPOUSE_OF (backend creates bidirectional)
      edges.push({
        from: viewerId,
        to: targetId,
        type: 'SPOUSE_OF'
      });
      break;

    case 'brother':
    case 'sister':
      // Requires: viewer and target share a parent
      // Check if viewer has a parent
      const viewerParents = getParents(viewerId, topology);
      if (viewerParents.length === 0) {
        missingPersons.push({
          role: 'viewer_parent',
          message: `To add ${getPersonName(targetId, topology)} as your ${label}, you need at least one parent. Please add your parent first.`
        });
      } else {
        // Check if target is already a sibling (shares parent)
        const targetParents = getParents(targetId, topology);
        const commonParents = viewerParents.filter(p => targetParents.includes(p));
        
        if (commonParents.length === 0) {
          // Need to make target a child of one of viewer's parents
          // Use the first parent found
          const sharedParent = viewerParents[0];
          edges.push({
            from: sharedParent,
            to: targetId,
            type: 'PARENT_OF'
          });
        }
        // If they already share a parent, no edge needed (relationship already exists)
      }
      break;

    case 'grandfather':
    case 'grandmother':
      // Requires: viewer -> parent -> grandparent
      const viewerParentsForGrand = getParents(viewerId, topology);
      if (viewerParentsForGrand.length === 0) {
        missingPersons.push({
          role: 'viewer_parent',
          message: `To add ${getPersonName(targetId, topology)} as your ${label}, you need a parent first. Please add your parent.`
        });
      } else {
        // Check if target is already a grandparent
        const parentId = viewerParentsForGrand[0];
        const grandparentParents = getParents(parentId, topology);
        if (!grandparentParents.includes(targetId)) {
          // Need to add: parent -> target (PARENT_OF)
          edges.push({
            from: targetId,
            to: parentId,
            type: 'PARENT_OF'
          });
        }
      }
      break;

    case 'grandson':
    case 'granddaughter':
      // Requires: viewer -> child -> grandchild
      const viewerChildren = getChildren(viewerId, topology);
      if (viewerChildren.length === 0) {
        missingPersons.push({
          role: 'viewer_child',
          message: `To add ${getPersonName(targetId, topology)} as your ${label}, you need a child first. Please add your child.`
        });
      } else {
        // Check if target is already a grandchild
        const childId = viewerChildren[0];
        const childChildren = getChildren(childId, topology);
        if (!childChildren.includes(targetId)) {
          // Need to add: child -> target (PARENT_OF)
          edges.push({
            from: childId,
            to: targetId,
            type: 'PARENT_OF'
          });
        }
      }
      break;

    case 'uncle':
    case 'aunt':
      // Requires: viewer -> parent -> grandparent -> parent's sibling (uncle/aunt)
      const viewerParentsForUncle = getParents(viewerId, topology);
      if (viewerParentsForUncle.length === 0) {
        missingPersons.push({
          role: 'viewer_parent',
          message: `To add ${getPersonName(targetId, topology)} as your ${label}, you need a parent first. Please add your parent.`
        });
      } else {
        const parentId = viewerParentsForUncle[0];
        const parentParents = getParents(parentId, topology);
        if (parentParents.length === 0) {
          missingPersons.push({
            role: 'parent_parent',
            message: `To add ${getPersonName(targetId, topology)} as your ${label}, your parent needs a parent (your grandparent) first.`
          });
        } else {
          // Check if target is already a sibling of parent
          const grandparentId = parentParents[0];
          const grandparentChildren = getChildren(grandparentId, topology);
          if (!grandparentChildren.includes(targetId) && targetId !== parentId) {
            // Need to add: grandparent -> target (PARENT_OF)
            edges.push({
              from: grandparentId,
              to: targetId,
              type: 'PARENT_OF'
            });
          }
        }
      }
      break;

    case 'nephew':
    case 'niece':
      // Requires: viewer -> parent -> sibling -> sibling's child
      const viewerParentsForNephew = getParents(viewerId, topology);
      if (viewerParentsForNephew.length === 0) {
        missingPersons.push({
          role: 'viewer_parent',
          message: `To add ${getPersonName(targetId, topology)} as your ${label}, you need a parent first. Please add your parent.`
        });
      } else {
        const parentId = viewerParentsForNephew[0];
        const parentChildren = getChildren(parentId, topology);
        // Find a sibling (another child of the same parent)
        const siblings = parentChildren.filter(id => id !== viewerId);
        if (siblings.length === 0) {
          missingPersons.push({
            role: 'sibling',
            message: `To add ${getPersonName(targetId, topology)} as your ${label}, you need a sibling first. Please add your sibling.`
          });
        } else {
          // Use first sibling found
          const siblingId = siblings[0];
          const siblingChildren = getChildren(siblingId, topology);
          if (!siblingChildren.includes(targetId)) {
            // Need to add: sibling -> target (PARENT_OF)
            edges.push({
              from: siblingId,
              to: targetId,
              type: 'PARENT_OF'
            });
          }
        }
      }
      break;

    case 'cousin':
      // Requires: viewer -> parent -> grandparent -> parent's sibling -> cousin
      const viewerParentsForCousin = getParents(viewerId, topology);
      if (viewerParentsForCousin.length === 0) {
        missingPersons.push({
          role: 'viewer_parent',
          message: `To add ${getPersonName(targetId, topology)} as your cousin, you need a parent first. Please add your parent.`
        });
      } else {
        const parentId = viewerParentsForCousin[0];
        const parentParents = getParents(parentId, topology);
        if (parentParents.length === 0) {
          missingPersons.push({
            role: 'parent_parent',
            message: `To add ${getPersonName(targetId, topology)} as your cousin, your parent needs a parent (your grandparent) first.`
          });
        } else {
          const grandparentId = parentParents[0];
          const grandparentChildren = getChildren(grandparentId, topology);
          // Find a parent's sibling (another child of grandparent, not the parent)
          const parentSiblings = grandparentChildren.filter(id => id !== parentId);
          if (parentSiblings.length === 0) {
            missingPersons.push({
              role: 'parent_sibling',
              message: `To add ${getPersonName(targetId, topology)} as your cousin, your parent needs a sibling (your uncle/aunt) first.`
            });
          } else {
            const parentSiblingId = parentSiblings[0];
            const parentSiblingChildren = getChildren(parentSiblingId, topology);
            if (!parentSiblingChildren.includes(targetId)) {
              // Need to add: parent's sibling -> target (PARENT_OF)
              edges.push({
                from: parentSiblingId,
                to: targetId,
                type: 'PARENT_OF'
              });
            }
          }
        }
      }
      break;

    case 'father-in-law':
    case 'mother-in-law':
      // Requires: viewer -> spouse -> spouse's parent
      const spouseId = getSpouse(viewerId, topology);
      if (!spouseId) {
        missingPersons.push({
          role: 'spouse',
          message: `To add ${getPersonName(targetId, topology)} as your ${label}, you need a spouse first. Please add your spouse.`
        });
      } else {
        // Check if target is already spouse's parent
        const spouseParents = getParents(spouseId, topology);
        if (!spouseParents.includes(targetId)) {
          // Need to add: target -> spouse (PARENT_OF)
          edges.push({
            from: targetId,
            to: spouseId,
            type: 'PARENT_OF'
          });
        }
        // If target is already spouse's parent, no edge needed (relationship already exists)
      }
      break;

    default:
      warnings.push(`Unknown relationship label: ${label}`);
  }

  return { edges, missingPersons, warnings };
}

/**
 * Validate a relationship before creating it
 * @param {number} viewerId - ID of the viewer person
 * @param {number} targetId - ID of the target person
 * @param {string} label - Relationship label
 * @param {Object} topology - Topology object with nodes and edges
 * @returns {Object} { valid: boolean, errors: Array, warnings: Array }
 */
export function validateRelationship(viewerId, targetId, label, topology) {
  const errors = [];
  const warnings = [];
  const normalizedLabel = label.toLowerCase();

  // No self-relation
  if (viewerId === targetId) {
    errors.push('Cannot create relationship to yourself');
    return { valid: false, errors, warnings };
  }

  // Check if persons exist in topology
  const viewerNode = topology.nodes.find(n => n.id === viewerId);
  const targetNode = topology.nodes.find(n => n.id === targetId);

  if (!viewerNode) {
    errors.push('Viewer person not found');
    return { valid: false, errors, warnings };
  }

  if (!targetNode) {
    errors.push('Target person not found');
    return { valid: false, errors, warnings };
  }

  // Max 2 parents check
  if (['father', 'mother'].includes(normalizedLabel)) {
    const existingParents = topology.edges.filter(
      e => e.to === viewerId && e.type === 'PARENT_OF'
    );
    if (existingParents.length >= 2) {
      errors.push('Person already has 2 parents. Maximum allowed is 2.');
      return { valid: false, errors, warnings };
    }
  }

  // Max 2 parents check for in-law relationships (check spouse's parents)
  if (['father-in-law', 'mother-in-law'].includes(normalizedLabel)) {
    const spouseId = getSpouse(viewerId, topology);
    if (spouseId) {
      const spouseParents = topology.edges.filter(
        e => e.to === spouseId && e.type === 'PARENT_OF'
      );
      if (spouseParents.length >= 2) {
        errors.push('Your spouse already has 2 parents. Maximum allowed is 2.');
        return { valid: false, errors, warnings };
      }
    }
  }

  // Check for duplicate relationships
  const translation = translateLabel(normalizedLabel, viewerId, targetId, topology);
  
  // Check if any of the edges already exist
  for (const edge of translation.edges) {
    const exists = topology.edges.some(
      e => e.from === edge.from && 
           e.to === edge.to && 
           e.type === edge.type
    );
    if (exists) {
      errors.push('This relationship already exists');
      break;
    }
  }

  // Gender consistency warning (not blocking)
  if (MALE_LABELS.includes(normalizedLabel) && targetNode.gender === 'FEMALE') {
    warnings.push(`${label} typically refers to a male, but the selected person is female`);
  } else if (FEMALE_LABELS.includes(normalizedLabel) && targetNode.gender === 'MALE') {
    warnings.push(`${label} typically refers to a female, but the selected person is male`);
  }

  // Check for missing persons (indirect relationships)
  if (translation.missingPersons.length > 0) {
    errors.push(...translation.missingPersons.map(mp => mp.message));
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings: [...warnings, ...translation.warnings]
  };
}

/**
 * Get available relationship labels for a given viewer and target
 * @param {number} viewerId - ID of the viewer person
 * @param {number} targetId - ID of the target person
 * @param {Object} topology - Topology object
 * @returns {Array} Array of available label strings
 */
export function getAvailableLabels(viewerId, targetId, topology) {
  if (viewerId === targetId) {
    return ['self'];
  }

  const allLabels = [...DIRECT_LABELS, ...INDIRECT_LABELS];
  const available = [];

  for (const label of allLabels) {
    const validation = validateRelationship(viewerId, targetId, label, topology);
    if (validation.valid) {
      available.push(label);
    }
  }

  return available;
}

/**
 * Get parents of a person
 * @param {number} personId - Person ID
 * @param {Object} topology - Topology object
 * @returns {Array} Array of parent person IDs
 */
function getParents(personId, topology) {
  return topology.edges
    .filter(e => e.to === personId && e.type === 'PARENT_OF')
    .map(e => e.from);
}

/**
 * Get children of a person
 * @param {number} personId - Person ID
 * @param {Object} topology - Topology object
 * @returns {Array} Array of child person IDs
 */
function getChildren(personId, topology) {
  return topology.edges
    .filter(e => e.from === personId && e.type === 'PARENT_OF')
    .map(e => e.to);
}

/**
 * Get spouse of a person
 * @param {number} personId - Person ID
 * @param {Object} topology - Topology object
 * @returns {number|null} Spouse person ID or null if no spouse
 */
function getSpouse(personId, topology) {
  // Find SPOUSE_OF edges where personId is either from or to
  const spouseEdge = topology.edges.find(
    e => (e.from === personId || e.to === personId) && e.type === 'SPOUSE_OF'
  );
  if (!spouseEdge) return null;
  // Return the other person in the spouse relationship
  return spouseEdge.from === personId ? spouseEdge.to : spouseEdge.from;
}

/**
 * Get person name from topology
 * @param {number} personId - Person ID
 * @param {Object} topology - Topology object
 * @returns {string} Person name
 */
function getPersonName(personId, topology) {
  const node = topology.nodes.find(n => n.id === personId);
  if (!node) return `Person ${personId}`;
  return `${node.first_name || ''} ${node.last_name || ''}`.trim() || `Person ${personId}`;
}

/**
 * Check if a label is direct (maps to single edge)
 * @param {string} label - Relationship label
 * @returns {boolean}
 */
export function isDirectLabel(label) {
  return DIRECT_LABELS.includes(label.toLowerCase());
}

/**
 * Check if a label is indirect (may require multiple edges)
 * @param {string} label - Relationship label
 * @returns {boolean}
 */
export function isIndirectLabel(label) {
  return INDIRECT_LABELS.includes(label.toLowerCase());
}

/**
 * Translate multiple relationship requests to edges
 * Handles dependencies between relationships and aggregates results
 * @param {Array<Object>} requests - Array of {viewerId, targetId, label} objects
 * @param {Object} topology - Topology object with nodes and edges
 * @returns {Object} { edges: Array, missingPersons: Array, warnings: Array, requestResults: Array }
 */
export function translateBulkRelationships(requests, topology) {
  const allEdges = [];
  const allMissingPersons = [];
  const allWarnings = [];
  const requestResults = [];
  
  // Process each request
  for (const request of requests) {
    const { viewerId, targetId, label } = request;
    
    // Translate this relationship
    const translation = translateLabel(label, viewerId, targetId, topology);
    
    // Track which edges came from which request
    const requestEdges = translation.edges.map(edge => ({
      ...edge,
      _request: request, // Store reference to original request
    }));
    
    allEdges.push(...requestEdges);
    allMissingPersons.push(...translation.missingPersons.map(mp => ({
      ...mp,
      request,
    })));
    allWarnings.push(...translation.warnings.map(w => ({
      message: w,
      request,
    })));
    
    requestResults.push({
      request,
      edges: translation.edges,
      missingPersons: translation.missingPersons,
      warnings: translation.warnings,
      valid: translation.missingPersons.length === 0 && translation.warnings.length === 0,
    });
  }
  
  // Remove duplicate edges (same from, to, type)
  const uniqueEdges = [];
  const edgeKeys = new Set();
  
  for (const edge of allEdges) {
    const key = `${edge.from}-${edge.to}-${edge.type}`;
    if (!edgeKeys.has(key)) {
      edgeKeys.add(key);
      uniqueEdges.push(edge);
    }
  }
  
  return {
    edges: uniqueEdges,
    missingPersons: allMissingPersons,
    warnings: allWarnings,
    requestResults,
  };
}
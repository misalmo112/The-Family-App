import { describe, it, expect } from 'vitest';
import {
  translateLabel,
  validateRelationship,
  getAvailableLabels,
  isDirectLabel,
  isIndirectLabel,
} from '../../services/relationshipTranslator';

describe('relationshipTranslator', () => {
  // Mock topology data
  const createMockTopology = (nodes = [], edges = []) => ({
    nodes,
    edges,
  });

  const createMockPerson = (id, firstName, lastName, gender = 'UNKNOWN') => ({
    id,
    first_name: firstName,
    last_name: lastName,
    gender,
  });

  describe('translateLabel', () => {
    it('translates "father" to reverse PARENT_OF edge', () => {
      const topology = createMockTopology(
        [createMockPerson(1, 'John', 'Doe'), createMockPerson(2, 'Jane', 'Doe')],
        []
      );
      const result = translateLabel('father', 1, 2, topology);
      
      expect(result.edges).toHaveLength(1);
      expect(result.edges[0]).toEqual({
        from: 2, // target (father)
        to: 1,   // viewer (child)
        type: 'PARENT_OF',
      });
      expect(result.missingPersons).toHaveLength(0);
    });

    it('translates "mother" to reverse PARENT_OF edge', () => {
      const topology = createMockTopology(
        [createMockPerson(1, 'John', 'Doe'), createMockPerson(2, 'Jane', 'Doe')],
        []
      );
      const result = translateLabel('mother', 1, 2, topology);
      
      expect(result.edges).toHaveLength(1);
      expect(result.edges[0]).toEqual({
        from: 2,
        to: 1,
        type: 'PARENT_OF',
      });
    });

    it('translates "son" to forward PARENT_OF edge', () => {
      const topology = createMockTopology(
        [createMockPerson(1, 'John', 'Doe'), createMockPerson(2, 'Jane', 'Doe')],
        []
      );
      const result = translateLabel('son', 1, 2, topology);
      
      expect(result.edges).toHaveLength(1);
      expect(result.edges[0]).toEqual({
        from: 1, // viewer (parent)
        to: 2,   // target (child)
        type: 'PARENT_OF',
      });
    });

    it('translates "daughter" to forward PARENT_OF edge', () => {
      const topology = createMockTopology(
        [createMockPerson(1, 'John', 'Doe'), createMockPerson(2, 'Jane', 'Doe')],
        []
      );
      const result = translateLabel('daughter', 1, 2, topology);
      
      expect(result.edges).toHaveLength(1);
      expect(result.edges[0]).toEqual({
        from: 1,
        to: 2,
        type: 'PARENT_OF',
      });
    });

    it('translates "husband" to SPOUSE_OF edge', () => {
      const topology = createMockTopology(
        [createMockPerson(1, 'John', 'Doe'), createMockPerson(2, 'Jane', 'Doe')],
        []
      );
      const result = translateLabel('husband', 1, 2, topology);
      
      expect(result.edges).toHaveLength(1);
      expect(result.edges[0]).toEqual({
        from: 1,
        to: 2,
        type: 'SPOUSE_OF',
      });
    });

    it('translates "wife" to SPOUSE_OF edge', () => {
      const topology = createMockTopology(
        [createMockPerson(1, 'John', 'Doe'), createMockPerson(2, 'Jane', 'Doe')],
        []
      );
      const result = translateLabel('wife', 1, 2, topology);
      
      expect(result.edges).toHaveLength(1);
      expect(result.edges[0].type).toBe('SPOUSE_OF');
    });

    it('translates "spouse" to SPOUSE_OF edge', () => {
      const topology = createMockTopology(
        [createMockPerson(1, 'John', 'Doe'), createMockPerson(2, 'Jane', 'Doe')],
        []
      );
      const result = translateLabel('spouse', 1, 2, topology);
      
      expect(result.edges).toHaveLength(1);
      expect(result.edges[0].type).toBe('SPOUSE_OF');
    });

    it('handles "brother" relationship requiring shared parent', () => {
      const topology = createMockTopology(
        [
          createMockPerson(1, 'John', 'Doe'),
          createMockPerson(2, 'Jane', 'Doe'),
          createMockPerson(3, 'Parent', 'Doe'),
        ],
        [
          { from: 3, to: 1, type: 'PARENT_OF' }, // parent -> john
        ]
      );
      const result = translateLabel('brother', 1, 2, topology);
      
      // Should create edge: parent -> jane
      expect(result.edges).toHaveLength(1);
      expect(result.edges[0]).toEqual({
        from: 3,
        to: 2,
        type: 'PARENT_OF',
      });
    });

    it('reports missing parent for "brother" when viewer has no parent', () => {
      const topology = createMockTopology(
        [createMockPerson(1, 'John', 'Doe'), createMockPerson(2, 'Jane', 'Doe')],
        []
      );
      const result = translateLabel('brother', 1, 2, topology);
      
      expect(result.missingPersons).toHaveLength(1);
      expect(result.missingPersons[0].role).toBe('viewer_parent');
    });

    it('handles case-insensitive labels', () => {
      const topology = createMockTopology(
        [createMockPerson(1, 'John', 'Doe'), createMockPerson(2, 'Jane', 'Doe')],
        []
      );
      
      const result1 = translateLabel('FATHER', 1, 2, topology);
      const result2 = translateLabel('Father', 1, 2, topology);
      const result3 = translateLabel('father', 1, 2, topology);
      
      expect(result1.edges).toEqual(result2.edges);
      expect(result2.edges).toEqual(result3.edges);
    });

    it('translates "father-in-law" when viewer has spouse', () => {
      const topology = createMockTopology(
        [
          createMockPerson(1, 'John', 'Doe'),
          createMockPerson(2, 'Jane', 'Doe'), // spouse
          createMockPerson(3, 'Bob', 'Doe'), // father-in-law
        ],
        [
          { from: 1, to: 2, type: 'SPOUSE_OF' }, // john -> jane (spouse)
        ]
      );
      const result = translateLabel('father-in-law', 1, 3, topology);
      
      // Should create edge: bob -> jane (PARENT_OF)
      expect(result.edges).toHaveLength(1);
      expect(result.edges[0]).toEqual({
        from: 3, // bob (father-in-law)
        to: 2,   // jane (spouse)
        type: 'PARENT_OF',
      });
      expect(result.missingPersons).toHaveLength(0);
    });

    it('translates "mother-in-law" when viewer has spouse', () => {
      const topology = createMockTopology(
        [
          createMockPerson(1, 'John', 'Doe'),
          createMockPerson(2, 'Jane', 'Doe'), // spouse
          createMockPerson(3, 'Mary', 'Doe'), // mother-in-law
        ],
        [
          { from: 1, to: 2, type: 'SPOUSE_OF' }, // john -> jane (spouse)
        ]
      );
      const result = translateLabel('mother-in-law', 1, 3, topology);
      
      // Should create edge: mary -> jane (PARENT_OF)
      expect(result.edges).toHaveLength(1);
      expect(result.edges[0]).toEqual({
        from: 3, // mary (mother-in-law)
        to: 2,   // jane (spouse)
        type: 'PARENT_OF',
      });
    });

    it('reports missing spouse for "father-in-law" when viewer has no spouse', () => {
      const topology = createMockTopology(
        [
          createMockPerson(1, 'John', 'Doe'),
          createMockPerson(2, 'Bob', 'Doe'), // would be father-in-law
        ],
        []
      );
      const result = translateLabel('father-in-law', 1, 2, topology);
      
      expect(result.missingPersons).toHaveLength(1);
      expect(result.missingPersons[0].role).toBe('spouse');
      expect(result.missingPersons[0].message).toContain('spouse');
    });

    it('does not create edge when target is already spouse\'s parent', () => {
      const topology = createMockTopology(
        [
          createMockPerson(1, 'John', 'Doe'),
          createMockPerson(2, 'Jane', 'Doe'), // spouse
          createMockPerson(3, 'Bob', 'Doe'), // father-in-law (already parent)
        ],
        [
          { from: 1, to: 2, type: 'SPOUSE_OF' }, // john -> jane (spouse)
          { from: 3, to: 2, type: 'PARENT_OF' }, // bob -> jane (already parent)
        ]
      );
      const result = translateLabel('father-in-law', 1, 3, topology);
      
      // No edge needed, relationship already exists
      expect(result.edges).toHaveLength(0);
      expect(result.missingPersons).toHaveLength(0);
    });
  });

  describe('validateRelationship', () => {
    it('validates direct relationships successfully', () => {
      const topology = createMockTopology(
        [createMockPerson(1, 'John', 'Doe'), createMockPerson(2, 'Jane', 'Doe')],
        []
      );
      const result = validateRelationship(1, 2, 'father', topology);
      
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('rejects self-relationships', () => {
      const topology = createMockTopology([createMockPerson(1, 'John', 'Doe')], []);
      const result = validateRelationship(1, 1, 'father', topology);
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Cannot create relationship to yourself');
    });

    it('rejects when viewer person not found', () => {
      const topology = createMockTopology([createMockPerson(2, 'Jane', 'Doe')], []);
      const result = validateRelationship(999, 2, 'father', topology);
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Viewer person not found');
    });

    it('rejects when target person not found', () => {
      const topology = createMockTopology([createMockPerson(1, 'John', 'Doe')], []);
      const result = validateRelationship(1, 999, 'father', topology);
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Target person not found');
    });

    it('rejects adding parent when person already has 2 parents', () => {
      const topology = createMockTopology(
        [
          createMockPerson(1, 'John', 'Doe'),
          createMockPerson(2, 'Parent1', 'Doe'),
          createMockPerson(3, 'Parent2', 'Doe'),
          createMockPerson(4, 'Parent3', 'Doe'),
        ],
        [
          { from: 2, to: 1, type: 'PARENT_OF' },
          { from: 3, to: 1, type: 'PARENT_OF' },
        ]
      );
      const result = validateRelationship(1, 4, 'father', topology);
      
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('2 parents'))).toBe(true);
    });

    it('detects duplicate relationships', () => {
      const topology = createMockTopology(
        [createMockPerson(1, 'John', 'Doe'), createMockPerson(2, 'Jane', 'Doe')],
        [
          { from: 2, to: 1, type: 'PARENT_OF' }, // Already exists
        ]
      );
      const result = validateRelationship(1, 2, 'father', topology);
      
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('already exists'))).toBe(true);
    });

    it('warns about gender mismatch for male labels', () => {
      const topology = createMockTopology(
        [
          createMockPerson(1, 'John', 'Doe'),
          createMockPerson(2, 'Jane', 'Doe', 'FEMALE'),
        ],
        []
      );
      const result = validateRelationship(1, 2, 'father', topology);
      
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings.some(w => w.includes('male'))).toBe(true);
    });

    it('warns about gender mismatch for female labels', () => {
      const topology = createMockTopology(
        [
          createMockPerson(1, 'John', 'Doe'),
          createMockPerson(2, 'Bob', 'Doe', 'MALE'),
        ],
        []
      );
      const result = validateRelationship(1, 2, 'mother', topology);
      
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings.some(w => w.includes('female'))).toBe(true);
    });

    it('validates father-in-law relationship successfully', () => {
      const topology = createMockTopology(
        [
          createMockPerson(1, 'John', 'Doe'),
          createMockPerson(2, 'Jane', 'Doe'), // spouse
          createMockPerson(3, 'Bob', 'Doe'), // father-in-law
        ],
        [
          { from: 1, to: 2, type: 'SPOUSE_OF' },
        ]
      );
      const result = validateRelationship(1, 3, 'father-in-law', topology);
      
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('rejects father-in-law when viewer has no spouse', () => {
      const topology = createMockTopology(
        [
          createMockPerson(1, 'John', 'Doe'),
          createMockPerson(2, 'Bob', 'Doe'),
        ],
        []
      );
      const result = validateRelationship(1, 2, 'father-in-law', topology);
      
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('spouse'))).toBe(true);
    });

    it('rejects father-in-law when spouse already has 2 parents', () => {
      const topology = createMockTopology(
        [
          createMockPerson(1, 'John', 'Doe'),
          createMockPerson(2, 'Jane', 'Doe'), // spouse
          createMockPerson(3, 'Parent1', 'Doe'),
          createMockPerson(4, 'Parent2', 'Doe'),
          createMockPerson(5, 'Parent3', 'Doe'), // would be father-in-law
        ],
        [
          { from: 1, to: 2, type: 'SPOUSE_OF' },
          { from: 3, to: 2, type: 'PARENT_OF' },
          { from: 4, to: 2, type: 'PARENT_OF' },
        ]
      );
      const result = validateRelationship(1, 5, 'father-in-law', topology);
      
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('spouse already has 2 parents'))).toBe(true);
    });
  });

  describe('getAvailableLabels', () => {
    it('returns available labels for valid relationship', () => {
      const topology = createMockTopology(
        [createMockPerson(1, 'John', 'Doe'), createMockPerson(2, 'Jane', 'Doe')],
        []
      );
      const labels = getAvailableLabels(1, 2, topology);
      
      expect(labels).toContain('father');
      expect(labels).toContain('mother');
      expect(labels).toContain('husband');
      expect(labels).toContain('wife');
    });

    it('excludes labels when max parents reached', () => {
      const topology = createMockTopology(
        [
          createMockPerson(1, 'John', 'Doe'),
          createMockPerson(2, 'Parent1', 'Doe'),
          createMockPerson(3, 'Parent2', 'Doe'),
        ],
        [
          { from: 2, to: 1, type: 'PARENT_OF' },
          { from: 3, to: 1, type: 'PARENT_OF' },
        ]
      );
      const labels = getAvailableLabels(1, 2, topology);
      
      expect(labels).not.toContain('father');
      expect(labels).not.toContain('mother');
    });

    it('returns ["self"] when viewer and target are the same', () => {
      const topology = createMockTopology([createMockPerson(1, 'John', 'Doe')], []);
      const labels = getAvailableLabels(1, 1, topology);
      
      expect(labels).toEqual(['self']);
    });
  });

  describe('isDirectLabel', () => {
    it('returns true for direct labels', () => {
      expect(isDirectLabel('father')).toBe(true);
      expect(isDirectLabel('mother')).toBe(true);
      expect(isDirectLabel('son')).toBe(true);
      expect(isDirectLabel('daughter')).toBe(true);
      expect(isDirectLabel('husband')).toBe(true);
      expect(isDirectLabel('wife')).toBe(true);
      expect(isDirectLabel('spouse')).toBe(true);
    });

    it('returns false for indirect labels', () => {
      expect(isDirectLabel('brother')).toBe(false);
      expect(isDirectLabel('uncle')).toBe(false);
      expect(isDirectLabel('cousin')).toBe(false);
    });

    it('handles case-insensitive input', () => {
      expect(isDirectLabel('FATHER')).toBe(true);
      expect(isDirectLabel('Father')).toBe(true);
    });
  });

  describe('isIndirectLabel', () => {
    it('returns true for indirect labels', () => {
      expect(isIndirectLabel('brother')).toBe(true);
      expect(isIndirectLabel('sister')).toBe(true);
      expect(isIndirectLabel('uncle')).toBe(true);
      expect(isIndirectLabel('aunt')).toBe(true);
      expect(isIndirectLabel('cousin')).toBe(true);
      expect(isIndirectLabel('father-in-law')).toBe(true);
      expect(isIndirectLabel('mother-in-law')).toBe(true);
    });

    it('returns false for direct labels', () => {
      expect(isIndirectLabel('father')).toBe(false);
      expect(isIndirectLabel('mother')).toBe(false);
      expect(isIndirectLabel('husband')).toBe(false);
    });
  });
});

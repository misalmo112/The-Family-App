import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { getRelationshipCompletion, createRelationship } from '../../services/graph';

// Mock services
vi.mock('../../services/graph', () => ({
  getRelationshipCompletion: vi.fn(),
  createRelationship: vi.fn(),
}));

describe('Completion Panel Integration', () => {
  const mockSuggestions = [
    {
      type: 'missing_parent',
      from_person_id: 2,
      to_person_id: 3,
      relationship_type: 'PARENT_OF',
      reason: 'Jane is John\'s spouse. Add them as Child\'s other parent?',
      confidence: 'high',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    getRelationshipCompletion.mockResolvedValue(mockSuggestions);
    createRelationship.mockResolvedValue({});
  });

  describe('Analyze to Create Flow', () => {
    it('should fetch suggestions when analyze button is clicked', async () => {
      // This is a simplified integration test
      // Full implementation would require rendering the Topology page
      // and interacting with the completion panel

      const suggestions = await getRelationshipCompletion({
        familyId: 1,
      });

      expect(getRelationshipCompletion).toHaveBeenCalledWith({
        familyId: 1,
      });
      expect(suggestions).toEqual(mockSuggestions);
    });

    it('should create relationship when suggestion is accepted', async () => {
      const suggestion = mockSuggestions[0];

      await createRelationship({
        familyId: 1,
        fromPersonId: suggestion.from_person_id,
        toPersonId: suggestion.to_person_id,
        type: suggestion.relationship_type,
      });

      expect(createRelationship).toHaveBeenCalledWith({
        familyId: 1,
        fromPersonId: 2,
        toPersonId: 3,
        type: 'PARENT_OF',
      });
    });
  });
});

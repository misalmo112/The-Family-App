import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import RelationshipSuggestions from '../../components/RelationshipSuggestions';
import { createRelationship } from '../../services/graph';

// Mock the graph service
vi.mock('../../services/graph', () => ({
  createRelationship: vi.fn(),
}));

describe('RelationshipSuggestions Component', () => {
  const mockPersons = [
    { id: 1, first_name: 'John', last_name: 'Doe' },
    { id: 2, first_name: 'Jane', last_name: 'Doe' },
    { id: 3, first_name: 'Child', last_name: 'Doe' },
  ];

  const mockSuggestions = [
    {
      type: 'parent_spouse',
      from_person_id: 2,
      to_person_id: 3,
      relationship_type: 'PARENT_OF',
      reason: 'Jane is John\'s spouse. Add them as Child\'s other parent?',
      confidence: 'high',
    },
  ];

  const defaultProps = {
    open: true,
    onClose: vi.fn(),
    familyId: 1,
    suggestions: mockSuggestions,
    persons: mockPersons,
    onSuccess: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    createRelationship.mockResolvedValue({});
  });

  const renderComponent = (props = {}) => {
    return render(<RelationshipSuggestions {...defaultProps} {...props} />);
  };

  describe('Rendering', () => {
    it('should render suggestions dialog when open', () => {
      renderComponent();
      expect(screen.getByText(/Relationship Suggestions/i)).toBeInTheDocument();
      expect(screen.getByText(/Based on the relationship you just added/i)).toBeInTheDocument();
    });

    it('should not render when closed', () => {
      renderComponent({ open: false });
      expect(screen.queryByText(/Relationship Suggestions/i)).not.toBeInTheDocument();
    });

    it('should display suggestions with person names', () => {
      renderComponent();
      expect(screen.getByText(/Jane is John's spouse/i)).toBeInTheDocument();
    });

    it('should show all suggestions selected by default', () => {
      renderComponent();
      const checkboxes = screen.getAllByRole('checkbox');
      // All checkboxes should be checked (including the select all if present)
      checkboxes.forEach((checkbox) => {
        if (checkbox.closest('label')?.textContent.includes('Jane')) {
          expect(checkbox).toBeChecked();
        }
      });
    });
  });

  describe('User Interactions', () => {
    it('should allow selecting/deselecting suggestions', async () => {
      const user = userEvent.setup();
      renderComponent();

      const checkboxes = screen.getAllByRole('checkbox');
      const suggestionCheckbox = checkboxes.find((cb) =>
        cb.closest('label')?.textContent.includes('Jane')
      );

      if (suggestionCheckbox) {
        await user.click(suggestionCheckbox);
        expect(suggestionCheckbox).not.toBeChecked();
      }
    });

    it('should create selected relationships on confirm', async () => {
      const user = userEvent.setup();
      renderComponent();

      const createButton = screen.getByRole('button', { name: /Create Selected/i });
      await user.click(createButton);

      await waitFor(() => {
        expect(createRelationship).toHaveBeenCalledWith({
          familyId: 1,
          fromPersonId: 2,
          toPersonId: 3,
          type: 'PARENT_OF',
        });
      });
    });

    it('should call onSuccess after successful creation', async () => {
      const user = userEvent.setup();
      const onSuccess = vi.fn();
      renderComponent({ onSuccess });

      const createButton = screen.getByRole('button', { name: /Create Selected/i });
      await user.click(createButton);

      await waitFor(() => {
        expect(onSuccess).toHaveBeenCalled();
      });
    });

    it('should handle API errors gracefully', async () => {
      const user = userEvent.setup();
      createRelationship.mockRejectedValueOnce(new Error('API Error'));

      renderComponent();

      const createButton = screen.getByRole('button', { name: /Create Selected/i });
      await user.click(createButton);

      await waitFor(() => {
        expect(screen.getByText(/Some relationships failed to create/i)).toBeInTheDocument();
      });
    });

    it('should disable create button when no suggestions selected', async () => {
      const user = userEvent.setup();
      renderComponent();

      // Deselect all suggestions
      const checkboxes = screen.getAllByRole('checkbox');
      for (const checkbox of checkboxes) {
        if (checkbox.checked) {
          await user.click(checkbox);
        }
      }

      const createButton = screen.getByRole('button', { name: /Create Selected/i });
      expect(createButton).toBeDisabled();
    });

    it('should close dialog when close button is clicked', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();
      renderComponent({ onClose });

      const closeButton = screen.getByRole('button', { name: /Close/i });
      await user.click(closeButton);

      expect(onClose).toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty suggestions list', () => {
      renderComponent({ suggestions: [] });
      expect(screen.getByText(/Relationship Suggestions/i)).toBeInTheDocument();
      const createButton = screen.getByRole('button', { name: /Create Selected/i });
      expect(createButton).toBeDisabled();
    });

    it('should handle missing person names gracefully', () => {
      const suggestionsWithMissingPerson = [
        {
          ...mockSuggestions[0],
          from_person_id: 999, // Person not in list
        },
      ];
      renderComponent({ suggestions: suggestionsWithMissingPerson });
      expect(screen.getByText(/Person 999/i)).toBeInTheDocument();
    });
  });
});

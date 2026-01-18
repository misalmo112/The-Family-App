import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import RelationshipTypeSelector from '../../components/RelationshipTypeSelector';

describe('RelationshipTypeSelector Component', () => {
  const mockFromPerson = {
    id: 1,
    first_name: 'John',
    last_name: 'Doe',
  };

  const mockToPerson = {
    id: 2,
    first_name: 'Jane',
    last_name: 'Doe',
  };

  const defaultProps = {
    open: true,
    onClose: vi.fn(),
    fromPerson: mockFromPerson,
    toPerson: mockToPerson,
    onConfirm: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderComponent = (props = {}) => {
    return render(<RelationshipTypeSelector {...defaultProps} {...props} />);
  };

  describe('Rendering', () => {
    it('should render dialog with relationship type options', () => {
      renderComponent();
      expect(screen.getByText(/Create Relationship/i)).toBeInTheDocument();
      expect(screen.getByText(/Parent-Child Relationship/i)).toBeInTheDocument();
      expect(screen.getByText(/Spouse Relationship/i)).toBeInTheDocument();
    });

    it('should not render when closed', () => {
      renderComponent({ open: false });
      expect(screen.queryByText(/Create Relationship/i)).not.toBeInTheDocument();
    });

    it('should display person names', () => {
      renderComponent();
      expect(screen.getByText(/John Doe/i)).toBeInTheDocument();
      expect(screen.getByText(/Jane Doe/i)).toBeInTheDocument();
    });

    it('should show direction selector for PARENT_OF', () => {
      renderComponent();
      expect(screen.getByText(/John Doe is parent of Jane Doe/i)).toBeInTheDocument();
      expect(screen.getByText(/Jane Doe is parent of John Doe/i)).toBeInTheDocument();
    });

    it('should show info message for SPOUSE_OF', async () => {
      const user = userEvent.setup();
      renderComponent();

      // Select SPOUSE_OF
      const spouseOption = screen.getByLabelText(/Spouse Relationship/i);
      await user.click(spouseOption);

      expect(screen.getByText(/Spouse relationships are bidirectional/i)).toBeInTheDocument();
    });
  });

  describe('Relationship Type Selection', () => {
    it('should default to PARENT_OF', () => {
      renderComponent();
      const parentOption = screen.getByLabelText(/Parent-Child Relationship/i);
      expect(parentOption).toBeChecked();
    });

    it('should allow switching to SPOUSE_OF', async () => {
      const user = userEvent.setup();
      renderComponent();

      const spouseOption = screen.getByLabelText(/Spouse Relationship/i);
      await user.click(spouseOption);

      expect(spouseOption).toBeChecked();
    });

    it('should hide direction selector when SPOUSE_OF is selected', async () => {
      const user = userEvent.setup();
      renderComponent();

      const spouseOption = screen.getByLabelText(/Spouse Relationship/i);
      await user.click(spouseOption);

      // Direction selector should not be visible for SPOUSE_OF
      // (it's conditionally rendered)
      expect(screen.queryByText(/Direction/i)).not.toBeInTheDocument();
    });
  });

  describe('Direction Selection', () => {
    it('should default to forward direction', () => {
      renderComponent();
      const forwardOption = screen.getByLabelText(/John Doe is parent of Jane Doe/i);
      expect(forwardOption).toBeChecked();
    });

    it('should allow selecting reverse direction', async () => {
      const user = userEvent.setup();
      renderComponent();

      const reverseOption = screen.getByLabelText(/Jane Doe is parent of John Doe/i);
      await user.click(reverseOption);

      expect(reverseOption).toBeChecked();
    });
  });

  describe('Confirmation', () => {
    it('should create relationship on confirm with PARENT_OF forward', async () => {
      const user = userEvent.setup();
      const onConfirm = vi.fn();
      renderComponent({ onConfirm });

      const createButton = screen.getByRole('button', { name: /Create Relationship/i });
      await user.click(createButton);

      expect(onConfirm).toHaveBeenCalledWith({
        fromPersonId: 1,
        toPersonId: 2,
        type: 'PARENT_OF',
      });
    });

    it('should create relationship on confirm with PARENT_OF reverse', async () => {
      const user = userEvent.setup();
      const onConfirm = vi.fn();
      renderComponent({ onConfirm });

      // Select reverse direction
      const reverseOption = screen.getByLabelText(/Jane Doe is parent of John Doe/i);
      await user.click(reverseOption);

      const createButton = screen.getByRole('button', { name: /Create Relationship/i });
      await user.click(createButton);

      expect(onConfirm).toHaveBeenCalledWith({
        fromPersonId: 2,
        toPersonId: 1,
        type: 'PARENT_OF',
      });
    });

    it('should create relationship on confirm with SPOUSE_OF', async () => {
      const user = userEvent.setup();
      const onConfirm = vi.fn();
      renderComponent({ onConfirm });

      // Select SPOUSE_OF
      const spouseOption = screen.getByLabelText(/Spouse Relationship/i);
      await user.click(spouseOption);

      const createButton = screen.getByRole('button', { name: /Create Relationship/i });
      await user.click(createButton);

      expect(onConfirm).toHaveBeenCalledWith({
        fromPersonId: 1,
        toPersonId: 2,
        type: 'SPOUSE_OF',
      });
    });

    it('should close dialog after confirmation', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();
      renderComponent({ onClose });

      const createButton = screen.getByRole('button', { name: /Create Relationship/i });
      await user.click(createButton);

      expect(onClose).toHaveBeenCalled();
    });

    it('should close dialog when cancel is clicked', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();
      renderComponent({ onClose });

      const cancelButton = screen.getByRole('button', { name: /Cancel/i });
      await user.click(cancelButton);

      expect(onClose).toHaveBeenCalled();
    });
  });
});

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render } from '@testing-library/react';
import FamilyGraph from '../../components/FamilyGraph';

// Mock ReactFlow
vi.mock('reactflow', () => ({
  default: ({ children, onNodeDragStart, onNodeDragStop, onPaneClick, nodesDraggable }) => (
    <div data-testid="reactflow">
      <div data-testid="nodes-draggable">{nodesDraggable ? 'true' : 'false'}</div>
      <button
        data-testid="trigger-drag-start"
        onClick={() => onNodeDragStart?.({}, { data: { person: { id: 1 } } })}
      >
        Drag Start
      </button>
      <button
        data-testid="trigger-drag-stop"
        onClick={() => onNodeDragStop?.({}, { data: { person: { id: 2 } } })}
      >
        Drag Stop
      </button>
      <button data-testid="trigger-pane-click" onClick={onPaneClick}>
        Pane Click
      </button>
      {children}
    </div>
  ),
  Background: () => <div data-testid="background" />,
  Controls: () => <div data-testid="controls" />,
  MiniMap: () => <div data-testid="minimap" />,
}));

describe('FamilyGraph Component', () => {
  const mockTopology = {
    nodes: [
      { id: 1, label: 'John Doe', relation_to_viewer: 'self' },
      { id: 2, label: 'Jane Doe', relation_to_viewer: 'spouse' },
    ],
    edges: [
      { from: 1, to: 2, type: 'SPOUSE_OF' },
    ],
  };

  const defaultProps = {
    topology: mockTopology,
    viewerPersonId: 1,
    currentUserPersonId: 1,
    edgeCreationMode: false,
    onNodeDragStart: vi.fn(),
    onNodeDragStop: vi.fn(),
    onPaneClick: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderComponent = (props = {}) => {
    return render(<FamilyGraph {...defaultProps} {...props} />);
  };

  describe('Rendering', () => {
    it('should render ReactFlow component', () => {
      const { getByTestId } = renderComponent();
      expect(getByTestId('reactflow')).toBeInTheDocument();
    });

    it('should render background, controls, and minimap', () => {
      const { getByTestId } = renderComponent();
      expect(getByTestId('background')).toBeInTheDocument();
      expect(getByTestId('controls')).toBeInTheDocument();
      expect(getByTestId('minimap')).toBeInTheDocument();
    });
  });

  describe('Edge Creation Mode', () => {
    it('should disable node dragging when edge creation mode is enabled', () => {
      const { getByTestId } = renderComponent({ edgeCreationMode: true });
      expect(getByTestId('nodes-draggable').textContent).toBe('false');
    });

    it('should enable node dragging when edge creation mode is disabled', () => {
      const { getByTestId } = renderComponent({ edgeCreationMode: false });
      expect(getByTestId('nodes-draggable').textContent).toBe('true');
    });
  });

  describe('Drag Handlers', () => {
    it('should call onNodeDragStart when node drag starts', () => {
      const onNodeDragStart = vi.fn();
      const { getByTestId } = renderComponent({ onNodeDragStart, edgeCreationMode: true });

      const triggerButton = getByTestId('trigger-drag-start');
      triggerButton.click();

      expect(onNodeDragStart).toHaveBeenCalled();
    });

    it('should call onNodeDragStop when node drag stops', () => {
      const onNodeDragStop = vi.fn();
      const { getByTestId } = renderComponent({ onNodeDragStop, edgeCreationMode: true });

      const triggerButton = getByTestId('trigger-drag-stop');
      triggerButton.click();

      expect(onNodeDragStop).toHaveBeenCalled();
    });

    it('should call onPaneClick when pane is clicked', () => {
      const onPaneClick = vi.fn();
      const { getByTestId } = renderComponent({ onPaneClick });

      const triggerButton = getByTestId('trigger-pane-click');
      triggerButton.click();

      expect(onPaneClick).toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty topology', () => {
      const { getByTestId } = renderComponent({
        topology: { nodes: [], edges: [] },
      });
      expect(getByTestId('reactflow')).toBeInTheDocument();
    });

    it('should handle missing handlers gracefully', () => {
      const { getByTestId } = renderComponent({
        onNodeDragStart: undefined,
        onNodeDragStop: undefined,
        onPaneClick: undefined,
      });
      expect(getByTestId('reactflow')).toBeInTheDocument();
    });
  });
});

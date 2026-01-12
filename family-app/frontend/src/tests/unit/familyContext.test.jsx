import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor, cleanup, within } from '@testing-library/react';
import { FamilyProvider, useFamily } from '../../context/FamilyContext';

// Test component to access family context
const TestComponent = () => {
  const {
    activeFamilyId,
    activeFamilyName,
    setActiveFamily,
    clearActiveFamily,
  } = useFamily();
  return (
    <div>
      <div data-testid="activeFamilyId">
        {activeFamilyId ? activeFamilyId.toString() : 'null'}
      </div>
      <div data-testid="activeFamilyName">
        {activeFamilyName || 'null'}
      </div>
      <button
        data-testid="set-family-btn"
        onClick={() => setActiveFamily(1, 'Test Family')}
      >
        Set Family
      </button>
      <button
        data-testid="set-family-2-btn"
        onClick={() => setActiveFamily(2, 'Another Family')}
      >
        Set Family 2
      </button>
      <button
        data-testid="clear-family-btn"
        onClick={clearActiveFamily}
      >
        Clear Family
      </button>
    </div>
  );
};

describe('FamilyContext', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
  });

  afterEach(() => {
    // Clean up rendered components after each test
    cleanup();
  });

  describe('setActiveFamily()', () => {
    it('persists to localStorage', async () => {
      const { container } = render(
        <FamilyProvider>
          <TestComponent />
        </FamilyProvider>
      );
      const { getByTestId } = within(container);

      const setFamilyBtn = getByTestId('set-family-btn');
      setFamilyBtn.click();

      await waitFor(() => {
        const stored = localStorage.getItem('activeFamily');
        expect(stored).not.toBeNull();
        const parsed = JSON.parse(stored);
        expect(parsed.activeFamilyId).toBe(1);
        expect(parsed.activeFamilyName).toBe('Test Family');
      });

      expect(getByTestId('activeFamilyId')).toHaveTextContent('1');
      expect(getByTestId('activeFamilyName')).toHaveTextContent(
        'Test Family'
      );
    });

    it('updates localStorage when family changes', async () => {
      const { container } = render(
        <FamilyProvider>
          <TestComponent />
        </FamilyProvider>
      );
      const { getByTestId } = within(container);

      // Set first family
      const setFamilyBtn = getByTestId('set-family-btn');
      setFamilyBtn.click();

      await waitFor(() => {
        expect(getByTestId('activeFamilyId')).toHaveTextContent('1');
      });

      // Change to second family
      const setFamily2Btn = getByTestId('set-family-2-btn');
      setFamily2Btn.click();

      await waitFor(() => {
        const stored = localStorage.getItem('activeFamily');
        const parsed = JSON.parse(stored);
        expect(parsed.activeFamilyId).toBe(2);
        expect(parsed.activeFamilyName).toBe('Another Family');
      });

      expect(getByTestId('activeFamilyId')).toHaveTextContent('2');
      expect(getByTestId('activeFamilyName')).toHaveTextContent(
        'Another Family'
      );
    });
  });

  describe('initialization', () => {
    it('loads from localStorage on mount', async () => {
      const storedData = {
        activeFamilyId: 5,
        activeFamilyName: 'Stored Family',
      };
      localStorage.setItem('activeFamily', JSON.stringify(storedData));

      const { container } = render(
        <FamilyProvider>
          <TestComponent />
        </FamilyProvider>
      );
      const { getByTestId } = within(container);

      await waitFor(() => {
        expect(getByTestId('activeFamilyId')).toHaveTextContent('5');
        expect(getByTestId('activeFamilyName')).toHaveTextContent(
          'Stored Family'
        );
      });
    });

    it('does not load when localStorage is empty', () => {
      localStorage.clear();

      const { container } = render(
        <FamilyProvider>
          <TestComponent />
        </FamilyProvider>
      );
      const { getByTestId } = within(container);

      expect(getByTestId('activeFamilyId')).toHaveTextContent('null');
      expect(getByTestId('activeFamilyName')).toHaveTextContent('null');
    });

    it('handles invalid JSON in localStorage gracefully', () => {
      localStorage.setItem('activeFamily', 'invalid-json');

      // Should not throw error
      const { container } = render(
        <FamilyProvider>
          <TestComponent />
        </FamilyProvider>
      );
      const { getByTestId } = within(container);

      // Should default to null values
      expect(getByTestId('activeFamilyId')).toHaveTextContent('null');
      expect(getByTestId('activeFamilyName')).toHaveTextContent('null');
    });
  });

  describe('clearActiveFamily()', () => {
    it('removes from localStorage', async () => {
      // Set a family first
      const storedData = {
        activeFamilyId: 3,
        activeFamilyName: 'Family to Clear',
      };
      localStorage.setItem('activeFamily', JSON.stringify(storedData));

      const { container } = render(
        <FamilyProvider>
          <TestComponent />
        </FamilyProvider>
      );
      const { getByTestId } = within(container);

      // Wait for initial load
      await waitFor(() => {
        expect(getByTestId('activeFamilyId')).toHaveTextContent('3');
      });

      // Clear the family
      const clearBtn = getByTestId('clear-family-btn');
      clearBtn.click();

      await waitFor(() => {
        expect(localStorage.getItem('activeFamily')).toBeNull();
      });

      expect(getByTestId('activeFamilyId')).toHaveTextContent('null');
      expect(getByTestId('activeFamilyName')).toHaveTextContent('null');
    });
  });
});

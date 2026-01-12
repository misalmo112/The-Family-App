import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor, cleanup, within } from '@testing-library/react';
import { AuthProvider, useAuth } from '../../context/AuthContext';
import api from '../../services/api';

// Mock the api service
vi.mock('../../services/api', () => ({
  default: {
    post: vi.fn(),
  },
}));

// Test component to access auth context
const TestComponent = () => {
  const { token, isAuthenticated, login, logout } = useAuth();
  return (
    <div>
      <div data-testid="token">{token || 'no-token'}</div>
      <div data-testid="isAuthenticated">{isAuthenticated ? 'true' : 'false'}</div>
      <button
        data-testid="login-btn"
        onClick={() => login('testuser', 'testpass')}
      >
        Login
      </button>
      <button data-testid="logout-btn" onClick={logout}>
        Logout
      </button>
    </div>
  );
};

describe('AuthContext', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    // Clear all mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Clean up rendered components after each test
    cleanup();
  });

  describe('login()', () => {
    it('stores token in localStorage after successful API call', async () => {
      const mockToken = 'test-access-token-123';
      api.post.mockResolvedValueOnce({
        data: { access: mockToken },
      });

      const { container } = render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );
      const { getByTestId } = within(container);

      const loginBtn = getByTestId('login-btn');
      loginBtn.click();

      await waitFor(() => {
        expect(localStorage.getItem('token')).toBe(mockToken);
      });

      await waitFor(() => {
        expect(getByTestId('token')).toHaveTextContent(mockToken);
        expect(getByTestId('isAuthenticated')).toHaveTextContent('true');
      });

      expect(api.post).toHaveBeenCalledWith('/api/auth/token/', {
        username: 'testuser',
        password: 'testpass',
      });
    });

    it('handles login error gracefully', async () => {
      const errorMessage = 'Invalid credentials';
      api.post.mockRejectedValueOnce({
        response: {
          data: { detail: errorMessage },
        },
      });

      const { container } = render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );
      const { getByTestId } = within(container);

      const loginBtn = getByTestId('login-btn');
      loginBtn.click();

      await waitFor(() => {
        expect(localStorage.getItem('token')).toBeNull();
      });

      expect(getByTestId('isAuthenticated')).toHaveTextContent('false');
    });
  });

  describe('logout()', () => {
    it('clears token from localStorage', async () => {
      const mockToken = 'test-token';
      localStorage.setItem('token', mockToken);

      const { container } = render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );
      const { getByTestId } = within(container);

      // Wait for initial load
      await waitFor(() => {
        expect(getByTestId('token')).toHaveTextContent(mockToken);
        expect(getByTestId('isAuthenticated')).toHaveTextContent('true');
      });

      const logoutBtn = getByTestId('logout-btn');
      logoutBtn.click();

      await waitFor(() => {
        expect(localStorage.getItem('token')).toBeNull();
      });

      expect(getByTestId('token')).toHaveTextContent('no-token');
      expect(getByTestId('isAuthenticated')).toHaveTextContent('false');
    });
  });

  describe('initialization', () => {
    it('loads token from localStorage on mount', async () => {
      const mockToken = 'stored-token-456';
      localStorage.setItem('token', mockToken);

      const { container } = render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );
      const { getByTestId } = within(container);

      await waitFor(() => {
        expect(getByTestId('token')).toHaveTextContent(mockToken);
        expect(getByTestId('isAuthenticated')).toHaveTextContent('true');
      });
    });

    it('does not authenticate when no token in localStorage', () => {
      localStorage.clear();

      const { container } = render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );
      const { getByTestId } = within(container);

      expect(getByTestId('token')).toHaveTextContent('no-token');
      expect(getByTestId('isAuthenticated')).toHaveTextContent('false');
    });
  });
});

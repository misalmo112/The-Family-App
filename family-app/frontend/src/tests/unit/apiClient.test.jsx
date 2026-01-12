import { describe, it, expect, beforeEach, vi } from 'vitest';
import api from '../../services/api';

describe('apiClient', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    // Clear any pending requests
    vi.clearAllMocks();
  });

  describe('Authorization header', () => {
    it('adds Authorization header when token exists in localStorage', async () => {
      const mockToken = 'test-bearer-token-789';
      localStorage.setItem('token', mockToken);

      // Mock the underlying request to capture the config
      // We'll intercept the request by spying on the api instance's request method
      // Since we can't easily mock axios.create after the module loads,
      // we'll test by making a request and checking if the interceptor modified it
      
      // The api instance has interceptors set up, so when we make a request,
      // the interceptor should add the Authorization header
      // We need to mock the actual HTTP call but let the interceptor run
      
      // Use vi.spyOn to intercept the request after interceptors run
      // Actually, axios interceptors run before the request, so we can't easily spy
      // Let's test the interceptor directly by accessing it
      
      // Better approach: Test the interceptor function by calling it directly
      // The interceptor is stored in api.interceptors.request.handlers
      const requestHandlers = api.interceptors.request.handlers;
      expect(requestHandlers.length).toBeGreaterThan(0);
      
      // Get the interceptor function (fulfilled handler)
      const interceptor = requestHandlers[0].fulfilled;
      
      // Create a test config
      const testConfig = {
        headers: {},
        url: '/api/test',
        method: 'get',
      };

      // Call the interceptor function
      const modifiedConfig = interceptor(testConfig);

      expect(modifiedConfig.headers.Authorization).toBe(`Bearer ${mockToken}`);
    });

    it('does not add Authorization header when token does not exist', () => {
      localStorage.clear();

      // Get the interceptor function
      const requestHandlers = api.interceptors.request.handlers;
      const interceptor = requestHandlers[0].fulfilled;

      const testConfig = {
        headers: {},
        url: '/api/test',
        method: 'get',
      };

      // Call the interceptor function
      const modifiedConfig = interceptor(testConfig);

      expect(modifiedConfig.headers.Authorization).toBeUndefined();
    });

    it('adds Authorization header with correct Bearer format', () => {
      const mockToken = 'test-token-abc-123';
      localStorage.setItem('token', mockToken);

      const requestHandlers = api.interceptors.request.handlers;
      const interceptor = requestHandlers[0].fulfilled;

      const testConfig = {
        headers: {},
        url: '/api/test',
        method: 'get',
      };

      const modifiedConfig = interceptor(testConfig);

      expect(modifiedConfig.headers.Authorization).toBe(`Bearer ${mockToken}`);
      expect(modifiedConfig.headers.Authorization).toMatch(/^Bearer .+$/);
    });
  });

  describe('request interceptor behavior', () => {
    it('preserves existing headers when adding Authorization', () => {
      const mockToken = 'token-123';
      localStorage.setItem('token', mockToken);

      const requestHandlers = api.interceptors.request.handlers;
      const interceptor = requestHandlers[0].fulfilled;

      const requestConfig = {
        headers: {
          'Content-Type': 'application/json',
          'X-Custom-Header': 'custom-value',
        },
        url: '/api/test',
        method: 'post',
      };

      const modifiedConfig = interceptor(requestConfig);

      expect(modifiedConfig.headers.Authorization).toBe(`Bearer ${mockToken}`);
      expect(modifiedConfig.headers['Content-Type']).toBe('application/json');
      expect(modifiedConfig.headers['X-Custom-Header']).toBe('custom-value');
    });

    it('does not add Authorization header for empty token string', () => {
      localStorage.setItem('token', '');

      const requestHandlers = api.interceptors.request.handlers;
      const interceptor = requestHandlers[0].fulfilled;

      const requestConfig = {
        headers: {},
        url: '/api/test',
        method: 'get',
      };

      const modifiedConfig = interceptor(requestConfig);

      // Empty string is falsy in JavaScript, so it will NOT add the header
      expect(modifiedConfig.headers.Authorization).toBeUndefined();
    });

    it('returns config unchanged when no token exists', () => {
      localStorage.clear();

      const requestHandlers = api.interceptors.request.handlers;
      const interceptor = requestHandlers[0].fulfilled;

      const originalConfig = {
        headers: {
          'Content-Type': 'application/json',
        },
        url: '/api/test',
        method: 'get',
      };

      const modifiedConfig = interceptor(originalConfig);

      expect(modifiedConfig).toEqual(originalConfig);
      expect(modifiedConfig.headers.Authorization).toBeUndefined();
    });
  });
});

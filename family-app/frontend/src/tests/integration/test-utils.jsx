import React from 'react';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '../../context/AuthContext';
import { FamilyProvider } from '../../context/FamilyContext';
import App from '../../App.jsx';

/**
 * Custom render function that wraps components with all necessary providers
 * @param {React.ReactElement} ui - The component to render
 * @param {Object} options - Render options
 * @param {string[]} options.initialEntries - Initial router entries (defaults to ['/login'])
 * @param {Object} options.routerOptions - Additional MemoryRouter options
 * @returns {Object} Render result with additional utilities
 */
export function renderWithProviders(ui, options = {}) {
  const {
    initialEntries = ['/login'],
    routerOptions = {},
    ...renderOptions
  } = options;

  // Clear localStorage before each render to ensure clean state
  localStorage.clear();

  // Check if rendering App component (which has its own router)
  const isApp = React.isValidElement(ui) && ui.type === App;
  
  // Wrapper component with all providers
  function Wrapper({ children }) {
    // If rendering App, don't wrap with MemoryRouter (App will use its own)
    // Otherwise, wrap with MemoryRouter for other components
    const content = (
      <AuthProvider>
        <FamilyProvider>
          {children}
        </FamilyProvider>
      </AuthProvider>
    );

    if (isApp) {
      return content;
    }

    return (
      <MemoryRouter initialEntries={initialEntries} {...routerOptions}>
        {content}
      </MemoryRouter>
    );
  }

  // If rendering App, pass MemoryRouter with initialEntries as RouterComponent prop
  const componentToRender = isApp && React.isValidElement(ui)
    ? React.cloneElement(ui, { 
        RouterComponent: (props) => <MemoryRouter initialEntries={initialEntries} {...routerOptions} {...props} />
      })
    : ui;

  const renderResult = render(componentToRender, { wrapper: Wrapper, ...renderOptions });

  return {
    ...renderResult,
    // Re-export render utilities
    rerender: (newUi) => renderResult.rerender(newUi),
  };
}

// Re-export everything from @testing-library/react
export * from '@testing-library/react';

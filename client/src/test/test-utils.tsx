import { render } from '@testing-library/react';
import type { ReactElement } from 'react';

export function renderWithProviders(ui: ReactElement) {
  return render(ui);
}

// Re-export everything from testing library
export * from '@testing-library/react';
export { renderWithProviders as render };

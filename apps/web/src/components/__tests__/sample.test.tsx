import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

describe('Frontend Component Test Mẫu (Vitest + Testing Library)', () => {
  it('render thành phần giao diện mẫu thành công', () => {
    render(<div data-testid="brewlite-header">BrewLite Coffee App</div>);
    const element = screen.getByTestId('brewlite-header');
    expect(element).toBeInTheDocument();
    expect(element).toHaveTextContent('BrewLite Coffee App');
  });
});

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@/test/test-utils';
import userEvent from '@testing-library/user-event';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

describe('Form Components Integration', () => {
  describe('Input Component', () => {
    it('renders input with label', () => {
      render(
        <div>
          <Label htmlFor="test-input">Test Label</Label>
          <Input id="test-input" placeholder="Enter text" />
        </div>
      );

      expect(screen.getByLabelText('Test Label')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Enter text')).toBeInTheDocument();
    });

    it('handles user input correctly', async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();

      render(
        <Input
          placeholder="Type here"
          onChange={handleChange}
          data-testid="test-input"
        />
      );

      const input = screen.getByTestId('test-input');
      
      await user.type(input, 'Hello World');
      
      expect(input).toHaveValue('Hello World');
      expect(handleChange).toHaveBeenCalled();
    });

    it('applies correct CSS classes', () => {
      render(
        <Input
          className="custom-class"
          data-testid="styled-input"
        />
      );

      const input = screen.getByTestId('styled-input');
      expect(input).toHaveClass('custom-class');
      // Check for default shadcn/ui input classes
      expect(input).toHaveClass('flex', 'h-10', 'w-full', 'rounded-md', 'border');
    });

    it('handles disabled state', () => {
      render(<Input disabled data-testid="disabled-input" />);
      
      const input = screen.getByTestId('disabled-input');
      expect(input).toBeDisabled();
      expect(input).toHaveClass('disabled:cursor-not-allowed');
    });

    it('supports different input types', () => {
      const { rerender } = render(<Input type="text" data-testid="input" />);
      expect(screen.getByTestId('input')).toHaveAttribute('type', 'text');

      rerender(<Input type="email" data-testid="input" />);
      expect(screen.getByTestId('input')).toHaveAttribute('type', 'email');

      rerender(<Input type="password" data-testid="input" />);
      expect(screen.getByTestId('input')).toHaveAttribute('type', 'password');
    });
  });

  describe('Label Component', () => {
    it('renders label with correct text', () => {
      render(<Label>Test Label</Label>);
      expect(screen.getByText('Test Label')).toBeInTheDocument();
    });

    it('associates with input correctly', () => {
      render(
        <div>
          <Label htmlFor="associated-input">Associated Label</Label>
          <Input id="associated-input" />
        </div>
      );

      const label = screen.getByText('Associated Label');
      const input = screen.getByRole('textbox');
      
      expect(label).toHaveAttribute('for', 'associated-input');
      expect(input).toHaveAttribute('id', 'associated-input');
    });

    it('applies peer styling classes', () => {
      render(<Label data-testid="styled-label">Styled Label</Label>);
      
      const label = screen.getByTestId('styled-label');
      expect(label).toHaveClass('peer-disabled:cursor-not-allowed', 'peer-disabled:opacity-70');
    });
  });

  describe('Form Integration', () => {
    it('creates accessible form field', async () => {
      const user = userEvent.setup();
      
      render(
        <form>
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              type="text"
              placeholder="Enter your username"
              required
            />
          </div>
          <button type="submit">Submit</button>
        </form>
      );

      // Check accessibility relationship
      const input = screen.getByRole('textbox', { name: 'Username' });
      expect(input).toBeRequired();
      expect(input).toHaveAttribute('placeholder', 'Enter your username');

      // Test interaction
      await user.type(input, 'testuser');
      expect(input).toHaveValue('testuser');

      // Test form submission (would need more complex setup for actual form handling)
      const submitButton = screen.getByRole('button', { name: 'Submit' });
      expect(submitButton).toBeInTheDocument();
    });
  });
});
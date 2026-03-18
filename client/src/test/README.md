# Testing Setup

This project uses **Vitest** for unit testing, **React Testing Library** for component testing, and **jsdom** for DOM simulation.

## Test Structure

```
client/src/test/
├── setup.ts              # Test setup and global mocks
├── test-utils.tsx         # Custom render function with providers
├── components/            # Component tests
│   └── Button.test.tsx
├── schema.test.ts         # Schema validation tests
└── utils.test.ts          # Utility function tests
```

## Available Scripts

- `npm test` - Run tests in watch mode
- `npm run test:run` - Run tests once
- `npm run test:coverage` - Run tests with coverage report
- `npm run test:ui` - Open Vitest UI (interactive testing)

## Writing Tests

### Component Testing

Use the custom `render` function from `test-utils.tsx` which includes necessary providers:

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@/test/test-utils';
import { MyComponent } from '@/components/MyComponent';

describe('MyComponent', () => {
  it('renders correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText('Expected text')).toBeInTheDocument();
  });
});
```

### Utility Function Testing

For pure functions, use standard Vitest:

```ts
import { describe, it, expect } from 'vitest';
import { myUtilFunction } from '@/lib/utils';

describe('myUtilFunction', () => {
  it('should return expected result', () => {
    expect(myUtilFunction('input')).toBe('expected output');
  });
});
```

### Schema/Validation Testing

Test Zod schemas to ensure data validation works correctly:

```ts
import { describe, it, expect } from 'vitest';
import { mySchema } from '@shared/schema';

describe('mySchema', () => {
  it('should validate correct data', () => {
    const result = mySchema.safeParse(validData);
    expect(result.success).toBe(true);
  });
});
```

## Test Configuration

### Global Mocks

The `setup.ts` file includes global mocks for:
- `matchMedia` - For components that use media queries
- `ResizeObserver` - For components that observe element resizing
- `IntersectionObserver` - For components that use intersection observation

### Coverage

Coverage reports are generated in the `coverage/` directory and include:
- Text output in terminal
- JSON report for CI/CD
- HTML report for detailed analysis

### Path Aliases

Tests can use the same path aliases as the main application:
- `@/` - Points to `client/src/`
- `@shared/` - Points to `shared/`

## Best Practices

1. **Test Behavior, Not Implementation** - Focus on what the component does, not how it does it
2. **Use Descriptive Test Names** - Test names should clearly describe what is being tested
3. **Arrange, Act, Assert** - Structure tests with clear setup, action, and assertion phases
4. **Mock External Dependencies** - Use mocks for API calls, external libraries, etc.
5. **Test Edge Cases** - Include tests for error states, empty data, and boundary conditions

## CI/CD Integration

For continuous integration, use:
```bash
npm run test:run
```

This will run all tests once and exit with a non-zero code if any tests fail.
# Mobile Testing Setup Guide

## Overview

This guide describes how to set up Jest and React Native Testing Library for the Badenya mobile app.

## Installation

```bash
cd mobile
npm install --save-dev jest @testing-library/react-native @testing-library/jest-native @types/jest jest-expo
```

## Configuration

### 1. Create `jest.config.js`

```javascript
module.exports = {
  preset: 'jest-expo',
  setupFilesAfterEnv: ['@testing-library/jest-native/extend-expect'],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg)'
  ],
  collectCoverageFrom: [
    'app/**/*.{ts,tsx}',
    'components/**/*.{ts,tsx}',
    'store/**/*.{ts,tsx}',
    'services/**/*.{ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  testMatch: [
    '**/__tests__/**/*.test.{ts,tsx}',
    '**/*.test.{ts,tsx}',
  ],
};
```

### 2. Update `package.json`

Add the following scripts:

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage"
  }
}
```

## Testing Structure

### Directory Structure

```
mobile/
├── __tests__/
│   ├── components/
│   │   ├── ui/
│   │   │   ├── Button.test.tsx
│   │   │   ├── Input.test.tsx
│   │   │   └── Card.test.tsx
│   │   └── TransactionItem.test.tsx
│   ├── screens/
│   │   ├── auth/
│   │   │   ├── login.test.tsx
│   │   │   └── register.test.tsx
│   │   └── dashboard.test.tsx
│   ├── store/
│   │   ├── authStore.test.ts
│   │   ├── groupStore.test.ts
│   │   └── transactionStore.test.ts
│   └── services/
│       ├── auth.service.test.ts
│       └── group.service.test.ts
├── app/
├── components/
├── store/
└── services/
```

## Example Tests

### 1. Component Test Example

```typescript
// __tests__/components/ui/Button.test.tsx
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Button } from '@/components/ui';

describe('Button Component', () => {
  it('should render correctly', () => {
    const { getByText } = render(
      <Button onPress={() => {}}>Click Me</Button>
    );
    
    expect(getByText('Click Me')).toBeTruthy();
  });

  it('should call onPress when clicked', () => {
    const mockOnPress = jest.fn();
    const { getByText } = render(
      <Button onPress={mockOnPress}>Click Me</Button>
    );
    
    fireEvent.press(getByText('Click Me'));
    expect(mockOnPress).toHaveBeenCalledTimes(1);
  });

  it('should be disabled when loading', () => {
    const { getByText } = render(
      <Button onPress={() => {}} loading>Click Me</Button>
    );
    
    const button = getByText('Click Me').parent;
    expect(button?.props.accessibilityState?.disabled).toBe(true);
  });
});
```

### 2. Store Test Example

```typescript
// __tests__/store/authStore.test.ts
import { renderHook, act } from '@testing-library/react-native';
import { useAuthStore } from '@/store/authStore';

describe('AuthStore', () => {
  beforeEach(() => {
    // Reset store before each test
    const { result } = renderHook(() => useAuthStore());
    act(() => {
      result.current.logout();
    });
  });

  it('should initialize with no user', () => {
    const { result } = renderHook(() => useAuthStore());
    
    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('should set user on login', () => {
    const { result } = renderHook(() => useAuthStore());
    const mockUser = {
      id: '1',
      fullName: 'Test User',
      email: 'test@example.com',
    };
    
    act(() => {
      result.current.setUser(mockUser);
    });
    
    expect(result.current.user).toEqual(mockUser);
    expect(result.current.isAuthenticated).toBe(true);
  });
});
```

### 3. Service Test Example

```typescript
// __tests__/services/auth.service.test.ts
import { authService } from '@/services/auth.service';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('AuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('login', () => {
    it('should return user and tokens on successful login', async () => {
      const mockResponse = {
        data: {
          status: 'success',
          data: {
            user: { id: '1', email: 'test@example.com' },
            tokens: {
              accessToken: 'access-token',
              refreshToken: 'refresh-token',
            },
          },
        },
      };

      mockedAxios.post.mockResolvedValue(mockResponse);

      const result = await authService.login('test@example.com', 'password');

      expect(mockedAxios.post).toHaveBeenCalledWith(
        '/auth/login',
        { email: 'test@example.com', password: 'password' }
      );
      expect(result).toEqual(mockResponse.data.data);
    });

    it('should throw error on failed login', async () => {
      mockedAxios.post.mockRejectedValue(new Error('Invalid credentials'));

      await expect(
        authService.login('test@example.com', 'wrong-password')
      ).rejects.toThrow('Invalid credentials');
    });
  });
});
```

### 4. Navigation Test Example

```typescript
// __tests__/screens/dashboard.test.tsx
import React from 'react';
import { render } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import DashboardScreen from '@/app/(tabs)/dashboard';

const mockNavigation = {
  navigate: jest.fn(),
};

describe('DashboardScreen', () => {
  it('should render correctly', () => {
    const { getByText } = render(
      <NavigationContainer>
        <DashboardScreen navigation={mockNavigation} />
      </NavigationContainer>
    );
    
    expect(getByText(/dashboard/i)).toBeTruthy();
  });
});
```

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## Coverage Goals

- **Overall:** > 70%
- **Components:** > 80%
- **Store:** > 90%
- **Services:** > 80%
- **Utils:** > 90%

## Best Practices

1. **Test User Behavior, Not Implementation**
   - Focus on what the user sees and does
   - Avoid testing internal state or implementation details

2. **Use Proper Queries**
   - Prefer `getByText`, `getByRole`, `getByLabelText`
   - Avoid `getByTestId` unless necessary

3. **Mock External Dependencies**
   - Mock API calls, AsyncStorage, SecureStore
   - Mock navigation if testing screens

4. **Test Loading and Error States**
   - Test loading indicators
   - Test error messages
   - Test empty states

5. **Keep Tests Fast**
   - Avoid unnecessary delays
   - Use fake timers for timeouts

## CI/CD Integration

The tests will run automatically on:
- Pull requests
- Pushes to main branch
- Before deployments

## Troubleshooting

### Common Issues

**Issue:** `Cannot find module '@/components/ui'`
**Solution:** Ensure `moduleNameMapper` is configured in `jest.config.js`

**Issue:** `Invariant Violation: Element type is invalid`
**Solution:** Check that all components are properly exported and imported

**Issue:** `TypeError: Cannot read property 'navigate' of undefined`
**Solution:** Mock navigation properly or wrap component in NavigationContainer

## References

- [React Native Testing Library](https://callstack.github.io/react-native-testing-library/)
- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Expo Testing](https://docs.expo.dev/guides/testing-with-jest/)

## Next Steps

1. Install dependencies
2. Create jest.config.js
3. Write tests for existing components
4. Achieve >70% coverage
5. Add tests to CI/CD pipeline

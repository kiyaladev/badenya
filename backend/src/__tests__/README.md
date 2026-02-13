# Backend Testing Guide

## Overview

This directory contains tests for the Badenya backend API.

## Test Structure

```
src/__tests__/
├── helpers/          # Test helper utilities
│   └── db.ts        # Database connection helpers
├── utils/           # Unit tests for utility functions
│   ├── crypto.test.ts
│   ├── jwt.test.ts
│   └── password.test.ts
└── integration/     # Integration tests for API endpoints (TODO)
```

## Running Tests

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch

# Run specific test file
npm test -- crypto.test.ts

# Run tests matching a pattern
npm test -- --testPathPatterns="utils"
```

## Test Coverage

Current test coverage:
- ✅ Utils (crypto, jwt, password): 100% coverage
- ⏳ Models: Pending (requires database setup)
- ⏳ Controllers: Pending
- ⏳ Services: Pending
- ⏳ Middleware: Pending
- ⏳ Integration Tests: Pending

## Writing Tests

### Unit Tests

Unit tests focus on testing individual functions or methods in isolation.

Example:
```typescript
import { hashPassword } from '../../utils/password';

describe('Password Utils', () => {
  it('should hash a password', async () => {
    const password = 'testPassword123';
    const hashed = await hashPassword(password);
    
    expect(hashed).toBeDefined();
    expect(hashed).not.toBe(password);
  });
});
```

### Integration Tests

Integration tests test the API endpoints end-to-end.

Example (requires database setup):
```typescript
import request from 'supertest';
import app from '../../index';

describe('Auth API', () => {
  it('POST /auth/register should create a new user', async () => {
    const response = await request(app)
      .post('/auth/register')
      .send({
        fullName: 'Test User',
        email: 'test@example.com',
        password: 'password123',
      });
    
    expect(response.status).toBe(201);
    expect(response.body.status).toBe('success');
  });
});
```

## Environment Variables

Tests use the following environment variables:
- `TEST_MONGODB_URI`: MongoDB connection string for tests (default: mongodb://localhost:27017/badenya_test)
- `JWT_SECRET`: Test JWT secret key
- `JWT_REFRESH_SECRET`: Test refresh token secret key

## Database Setup for Integration Tests

Integration tests require a MongoDB instance. You can:

1. Use a local MongoDB instance
2. Use MongoDB Atlas test cluster
3. Use MongoDB Memory Server (requires internet access to download MongoDB binary)

Set the `TEST_MONGODB_URI` environment variable:
```bash
export TEST_MONGODB_URI="mongodb://localhost:27017/badenya_test"
```

## Next Steps

1. Add integration tests for authentication endpoints
2. Add tests for group management
3. Add tests for transaction handling
4. Add tests for voting system
5. Increase coverage to >70%

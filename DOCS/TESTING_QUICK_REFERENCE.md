# 🚀 Quick Reference - Testing Commands

## Running Tests

```bash
cd backend

# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch

# Run specific test file
npm test -- password.test.ts

# Run tests matching pattern
npm test -- --testPathPatterns="utils"
npm test -- --testPathPatterns="integration"
npm test -- --testPathPatterns="middleware"
```

## Test Status

Test counts and coverage change as the code evolves. Use the commands above
to get the current results rather than relying on a snapshot in this guide.

## Test Files Location

```
backend/src/__tests__/
├── helpers/
│   ├── db.ts           # Database connection helper
│   └── app.ts          # Test app factory
├── utils/
│   ├── password.test.ts   # 7 tests
│   ├── crypto.test.ts     # 9 tests
│   └── jwt.test.ts        # 10 tests
├── middleware/
│   └── validation.test.ts # 5 tests
└── integration/
    └── api.test.ts        # 8 tests
```

## Documentation

- `backend/src/__tests__/README.md` - Testing guide
- `../mobile/TESTING_SETUP.md` - Mobile test setup
- `../mobile/RELEASE_TESTING.md` - Mobile release test checklist
- `FIREBASE_SETUP.md` - Firebase configuration

## Next Steps

1. Add controller tests (auth, group, transaction)
2. Add service tests (notification, report)
3. Increase coverage to >50%
4. Test authentication flows
5. Add model validation tests

## Project Status

See `STATUS_2025-10-12.md` for the current project status and known
environment-dependent test limitations.

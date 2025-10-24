# AdminPanel Tests

## Setup

To run these tests, you need to install the required testing dependencies:

```bash
npm install --save-dev vitest @testing-library/react @testing-library/jest-dom jsdom
```

## Running Tests

```bash
# Run tests once
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm test -- --coverage
```

## Test Coverage

The AdminPanel tests cover:

1. **Firestore Batch Operations**
   - Syncing local storage data to Firestore using batch writes
   - Handling Firebase permission-denied errors during sync
   - Processing large datasets in batches (500 operations per batch)

2. **Custom URL Management**
   - Updating custom URLs using Firestore updateDoc
   - Deleting custom URLs and updating related audio mappings
   - Handling Firebase errors during URL operations

3. **Error Handling**
   - Permission-denied errors
   - Service unavailable errors
   - Not-found errors
   - Generic Firebase errors

## Requirements Covered

- **Requirement 3.1**: Custom URLs stored in Firestore
- **Requirement 3.2**: Audio mappings stored in Firestore
- **Requirement 3.3**: Tafseer entries stored in Firestore
- **Requirement 3.4**: Upsert operations and error handling

## Notes

- Tests use Vitest as the testing framework
- Firebase Firestore functions are mocked to avoid actual database calls
- Tests focus on core functionality and error handling scenarios

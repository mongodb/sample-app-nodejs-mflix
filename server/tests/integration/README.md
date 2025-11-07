# Integration Tests

This directory contains integration tests for the Express MongoDB application. Unlike unit tests, these tests make actual HTTP requests to the Express app using `supertest` and connect to a real MongoDB instance to verify end-to-end functionality.

## Overview

The integration tests are organized into three main categories:

1. **Movie CRUD Integration Tests** (`movie.integration.test.ts`)
   - Tests basic CRUD API endpoints using `supertest`
   - Makes actual HTTP requests to the Express app
   - Tests pagination, filtering, and sorting via API
   - Automatically skipped if `MONGODB_URI` is not set

2. **MongoDB Search Integration Tests** (`mongodbSearch.integration.test.ts`)
   - Tests the MongoDB Search API endpoint using `supertest`
   - Makes actual HTTP requests to test the `/api/movies/search` endpoint
   - Tests search by plot, directors, cast, pagination, and search operators
   - Automatically skipped if `ENABLE_SEARCH_TESTS` is not set

3. **Advanced Endpoints Integration Tests** (`advancedEndpoints.integration.test.ts`)
   - Tests advanced API endpoints using `supertest`
   - Makes actual HTTP requests to test:
     - **Aggregation endpoints**: Movies with comments, statistics by year, directors with most movies
     - **MongoDB Search endpoint**: Compound queries, phrase matching, fuzzy matching
     - **Vector Search endpoint**: Semantic similarity search using embeddings
   - Aggregation tests automatically run if `MONGODB_URI` is set
   - MongoDB Search tests require `ENABLE_SEARCH_TESTS=true`
   - Vector Search tests require `VOYAGE_API_KEY` to be set

**Note:** Tests use `describeIntegration`, `describeSearch`, and `describeVectorSearch` wrappers (from `setup.ts` and test files) that automatically skip entire test suites when the required environment variables are not set.

## Testing Approach

These integration tests use **supertest** to make actual HTTP requests to the Express application, testing the complete request/response cycle including:
- Routing
- Request parsing
- Controller logic
- Database operations
- Response formatting
- Error handling

This approach ensures that the API endpoints work correctly from the client's perspective.

## Requirements

### Basic Integration Tests (CRUD and Aggregations)

- **MONGODB_URI** environment variable must be set
- MongoDB instance must be accessible (can be local MongoDB or Atlas)

### MongoDB Search Tests

- **MongoDB instance** with Search enabled (local MongoDB or Atlas)
- **MONGODB_URI** environment variable
- **ENABLE_SEARCH_TESTS=true** environment variable to enable tests

### Vector Search Tests

- **MONGODB_URI** environment variable must be set
- **VOYAGE_API_KEY** environment variable must be set with a valid Voyage AI API key
- MongoDB instance must have the `embedded_movies` collection with vector embeddings
- Vector search index must be configured on the `embedded_movies` collection

## Running the Tests

### Run All Integration Tests

```bash
npm run test:integration
```

### Run Specific Test File

```bash
# Run only CRUD tests
npx jest --config jest.integration.config.json tests/integration/movie.integration.test.ts

# Run only Search tests (requires Search-enabled MongoDB)
npx jest --config jest.integration.config.json tests/integration/mongodbSearch.integration.test.ts

# Run only Advanced Endpoints tests (aggregations, search, vector search)
npx jest --config jest.integration.config.json tests/integration/advancedEndpoints.integration.test.ts
```

### Set Environment Variables

#### Using .env file

Create a `.env` file in the `server/js-express` directory:

```env
MONGODB_URI=mongodb://localhost:27017/sample_mflix
# or for Atlas
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/sample_mflix?retryWrites=true&w=majority

# Optional: Enable Search tests (requires Search-enabled MongoDB)
ENABLE_SEARCH_TESTS=true

# Optional: Enable Vector Search tests (requires Voyage AI API key)
VOYAGE_API_KEY=your-voyage-ai-api-key
```

## Test Structure

### Setup and Teardown

All integration tests follow an **idempotent pattern** to ensure they can be run multiple times without side effects:

- **Global Setup** (`beforeAll` in `setup.ts`): Connects to MongoDB once before all tests
- **Global Teardown** (`afterAll` in `setup.ts`): Closes MongoDB connection after all tests
- **Pre-Test Cleanup** (`beforeAll` in test files): Removes any orphaned test data from previous runs
- **Post-Test Cleanup** (`afterEach` in test files): Removes test data created during each test

This ensures:
- Tests can be run multiple times without conflicts
- The dataset is left in an untouched state after test execution
- Tests are isolated from each other
- Failed test runs don't affect subsequent runs

## Troubleshooting

### Tests are Skipped

If you see "⚠️  Skipping integration tests - MONGODB_URI not set":

1. Make sure `MONGODB_URI` environment variable is set
2. Verify the connection string is correct
3. Check that MongoDB is running and accessible

### Search Tests are Skipped

If you see "⚠️  Skipping MongoDB Search tests - ENABLE_SEARCH_TESTS not set":

1. Set `ENABLE_SEARCH_TESTS=true` environment variable
2. Verify your MongoDB instance has Search enabled (available in both local MongoDB and Atlas)
3. For local MongoDB, ensure you're running a version that supports Search

### Vector Search Tests are Skipped

If you see "⚠️  Vector Search tests skipped - VOYAGE_API_KEY not set":

1. Set `VOYAGE_API_KEY` environment variable with your Voyage AI API key
2. Verify your MongoDB instance has the `embedded_movies` collection
3. Ensure the vector search index is configured on the `embedded_movies` collection
4. The `embedded_movies` collection should have documents with `plot_embedding_voyage_3_large` field

### Connection Errors

If tests fail with connection errors:

1. Verify `MONGODB_URI` is correct
2. Check that MongoDB is running and accessible
3. For Atlas: Verify your IP address is whitelisted
4. For Atlas: Verify database user credentials are correct
5. For local MongoDB: Verify the connection string format is correct

### Index Creation Timeout

If search tests fail with "Search index did not become ready within 120 seconds":

1. Check that your MongoDB instance has Search enabled
2. Verify the search index is being created (check logs or admin UI)
3. The index creation time varies by instance type and data size
4. For Atlas free tier clusters, index creation may take longer
5. For local MongoDB, ensure Search is properly configured

### Test Timeouts

Integration tests have a 2-minute timeout (120 seconds) to accommodate:

- Network latency
- Index creation and polling
- Document indexing delays

If tests timeout, you may need to:

1. Check your network connection
2. Use a faster MongoDB instance
3. Increase the timeout in `jest.integration.config.json`

## Differences from Unit Tests

| Aspect | Unit Tests | Integration Tests |
|--------|-----------|-------------------|
| HTTP Requests | Mocked with Jest | Real HTTP requests via supertest |
| Database | Mocked with Jest | Real MongoDB instance |
| Speed | Fast (milliseconds) | Slower (seconds) |
| Dependencies | None | Requires MongoDB |
| Isolation | Complete | Requires cleanup |
| CI/CD | Always run | Conditional (requires MONGODB_URI) |
| Purpose | Test business logic | Test end-to-end API functionality |

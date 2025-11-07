/**
 * Integration Test Setup
 *
 * This file runs before all integration tests and sets up the test environment.
 * Unlike unit tests, integration tests connect to a real MongoDB instance.
 */

import { connectToDatabase, closeDatabaseConnection } from "../../src/config/database";
import dotenv from "dotenv";

// Set test environment variables
dotenv.config();
process.env.NODE_ENV = "test";

// Increase timeout for database operations in integration tests
// Integration tests may take longer due to network calls and index creation
jest.setTimeout(120000); // 2 minutes

/**
 * Check if integration tests should run
 * Integration tests are skipped unless MONGODB_URI is set
 */
export function isIntegrationTestEnabled(): boolean {
  return !!process.env.MONGODB_URI;
}

/**
 * Check if Search tests should run
 * Search tests require MongoDB with Search enabled and are opt-in via environment variable
 */
export function isSearchTestEnabled(): boolean {
  return process.env.ENABLE_SEARCH_TESTS === "true" && isIntegrationTestEnabled();
}

/**
 * Check if Vector Search tests should run
 * Vector Search tests require VOYAGE_API_KEY environment variable
 */
export function isVectorSearchEnabled(): boolean {
    return !!process.env.VOYAGE_API_KEY && process.env.VOYAGE_API_KEY.trim().length > 0;
}

// Track whether we've already shown the skip messages to avoid duplicates
let hasShownIntegrationSkipMessage = false;
let hasShownSearchSkipMessage = false;

/**
 * Get the appropriate describe function based on whether integration tests are enabled
 * Usage: describeIntegration("My Test Suite", () => { ... })
 * This will skip the entire suite if MONGODB_URI is not set
 */
export const describeIntegration: jest.Describe = isIntegrationTestEnabled()
  ? describe
  : ((...args: Parameters<jest.Describe>) => {
      if (!hasShownIntegrationSkipMessage) {
        console.log(`
⚠️  Integration tests skipped: MONGODB_URI environment variable is not set
   To run integration tests, set MONGODB_URI to your MongoDB connection string
   Example: MONGODB_URI=mongodb://localhost:27017/sample_mflix npm run test:integration
`);
        hasShownIntegrationSkipMessage = true;
      }
      return describe.skip(...args);
    }) as jest.Describe;

/**
 * Get the appropriate describe function based on whether search tests are enabled
 * Usage: describeSearch("My Search Test Suite", () => { ... })
 * This will skip the entire suite if ENABLE_SEARCH_TESTS is not set
 */
export const describeSearch: jest.Describe = isSearchTestEnabled()
  ? describe
  : ((...args: Parameters<jest.Describe>) => {
      if (!hasShownSearchSkipMessage) {
        console.log(`
⚠️  Search tests skipped: ENABLE_SEARCH_TESTS environment variable is not set
   To run Search integration tests, set ENABLE_SEARCH_TESTS=true
   Example: MONGODB_URI=mongodb://localhost:27017/sample_mflix ENABLE_SEARCH_TESTS=true npm run test:integration
`);
        hasShownSearchSkipMessage = true;
      }
      return describe.skip(...args);
    }) as jest.Describe;

/**
 * Conditional describe for Vector Search tests
 */
/**
 * Get the appropriate describe function based on whether Vector Search tests are enabled
 * Usage: describeVectorSearch("My Vector Search Test Suite", () => { ... })
 * This will skip the entire suite if VOYAGE_API_KEY is not set
 */
export const describeVectorSearch: jest.Describe = isVectorSearchEnabled()
    ? describe
    : ((...args: Parameters<jest.Describe>) => {
        if (!hasShownSearchSkipMessage) {
            console.log(`
⚠️  Vector Search tests skipped: VOYAGE_API_KEY environment variable is not set
   To run Vector Search integration tests, set VOYAGE_API_KEY in your .env file
   Example: VOYAGE_API_KEY=your-api-key npm run test:integration
`);
            hasShownSearchSkipMessage = true;
        }
        return describe.skip(...args);
    }) as jest.Describe;

// Global setup - runs once before all tests
beforeAll(async () => {
  try {
    await connectToDatabase();
  } catch (error) {
    console.error("❌ Failed to connect to MongoDB:", error);
    throw error;
  }
});

// Global teardown - runs once after all tests
afterAll(async () => {
  if (!isIntegrationTestEnabled()) {
    return;
  }

  try {
    await closeDatabaseConnection();
  } catch (error) {
    console.error("❌ Failed to close MongoDB connection:", error);
  }
});


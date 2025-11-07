/**
 * Jest Test Setup
 *
 * This file runs before all tests and sets up global test configuration,
 * including environment variables and mock implementations.
 */

// Set test environment variables
process.env.NODE_ENV = "test";
process.env.MONGODB_URI = "mongodb://localhost:27017/test_sample_mflix";
process.env.PORT = "3002";

// Increase timeout for database operations in tests
jest.setTimeout(30000);

// Global test utilities can be added here
global.console = {
  ...console,
  // Suppress console.log in tests unless needed for debugging
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

/**
 * Test Utilities and Helpers
 *
 * This file contains common utilities, test data, and helper functions
 * used across unit tests to ensure consistency and reduce duplication.
 */

import { ObjectId } from "mongodb";
import { Request, Response } from "express";

export const TEST_OBJECT_IDS = {
  VALID: "507f1f77bcf86cd799439011",
  VALID_2: "507f1f77bcf86cd799439012",
  INVALID: "invalid-id",
};

// ==================== SAMPLE MOVIE DATA ====================

export const SAMPLE_MOVIE = {
  _id: TEST_OBJECT_IDS.VALID,
  title: "Test Movie",
  year: 2024,
  plot: "A test movie",
  genres: ["Action"],
};

export const SAMPLE_MOVIES = [
  {
    _id: TEST_OBJECT_IDS.VALID,
    title: "Test Movie 1",
    year: 2024,
    plot: "A test movie",
    genres: ["Action"],
  },
  {
    _id: TEST_OBJECT_IDS.VALID + "-b",
    title: "Test Movie 2",
    year: 2024,
    plot: "Another test movie",
    genres: ["Comedy"],
  },
];

export const SAMPLE_SEARCH_RESULTS = [
  {
    _id: new ObjectId(),
    title: "Space Adventure",
    year: 2024,
    plot: "An epic space adventure across the galaxy",
    genres: ["Sci-Fi", "Adventure"],
  },
  {
    _id: new ObjectId(),
    title: "Space Quest",
    year: 2023,
    plot: "A thrilling space adventure to save humanity",
    genres: ["Sci-Fi", "Action"],
  },
];

export const SAMPLE_VECTOR_RESULTS = [
  {
    _id: new ObjectId(),
    score: 0.85,
  },
  {
    _id: new ObjectId(),
    score: 0.78,
  },
];

export const SAMPLE_VECTOR_MOVIES = [
  {
    _id: new ObjectId(),
    title: "Space Raiders",
    plot: "A futuristic space adventure",
    poster: "https://example.com/poster1.jpg",
    year: 2024,
    genres: ["Sci-Fi", "Action"],
    directors: ["John Director"],
    cast: ["Actor One", "Actor Two"],
  },
  {
    _id: new ObjectId(),
    title: "Galaxy Quest",
    plot: "An epic space journey",
    poster: "https://example.com/poster2.jpg",
    year: 2023,
    genres: ["Sci-Fi", "Comedy"],
    directors: ["Jane Director"],
    cast: ["Actor Three", "Actor Four"],
  },
];

export const SAMPLE_COMMENTS_AGGREGATION = [
  {
    _id: new ObjectId(),
    title: "Test Movie",
    year: 2024,
    genres: ["Action", "Drama"],
    imdbRating: 8.5,
    recentComments: [
      {
        _id: new ObjectId(),
        userName: "John Doe",
        userEmail: "john@example.com",
        text: "Great movie!",
        date: new Date("2024-01-01"),
      },
    ],
    totalComments: 5,
  },
];

export const SAMPLE_YEARS_AGGREGATION = [
  {
    year: 2024,
    movieCount: 10,
    averageRating: 7.5,
    highestRating: 9.0,
    lowestRating: 6.0,
    totalVotes: 5000,
  },
  {
    year: 2023,
    movieCount: 15,
    averageRating: 7.8,
    highestRating: 9.5,
    lowestRating: 6.5,
    totalVotes: 7500,
  },
];

export const SAMPLE_DIRECTORS_AGGREGATION = [
  {
    director: "Christopher Nolan",
    movieCount: 10,
    averageRating: 8.5,
  },
  {
    director: "Steven Spielberg",
    movieCount: 25,
    averageRating: 8.2,
  },
];

// ==================== REQUEST/RESPONSE DATA ====================

export const SAMPLE_REQUESTS = {
  CREATE_MOVIE: {
    title: "New Movie",
    year: 2024,
    plot: "A new movie plot",
    genres: ["Action"],
  },
  UPDATE_MOVIE: {
    title: "Updated Movie Title",
    year: 2025,
    plot: "Updated plot",
  },
  BATCH_CREATE: [
    { title: "Batch Movie 1", year: 2024 },
    { title: "Batch Movie 2", year: 2024 },
  ],
};

export const SAMPLE_RESPONSES = {
  INSERT_ONE: {
    acknowledged: true,
    insertedId: new ObjectId(),
  },
  INSERT_MANY: {
    acknowledged: true,
    insertedCount: 2,
    insertedIds: [new ObjectId(), new ObjectId()],
  },
  UPDATE_ONE: {
    matchedCount: 1,
    modifiedCount: 1,
  },
  UPDATE_MANY: {
    matchedCount: 5,
    modifiedCount: 3,
  },
  DELETE_ONE: {
    deletedCount: 1,
  },
  DELETE_MANY: {
    deletedCount: 10,
  },
};

// ==================== MOCK HELPER FUNCTIONS ====================

/**
 * Creates mock Express request object with default values
 */
export function createMockRequest(overrides: Partial<Request> = {}): Partial<Request> {
  return {
    query: {},
    params: {},
    body: {},
    ...overrides,
  };
}

/**
 * Creates mock Express response object with spies
 */
export function createMockResponse(): {
  mockJson: jest.Mock;
  mockStatus: jest.Mock;
  mockResponse: Partial<Response>;
} {
  const mockJson = jest.fn();
  const mockStatus = jest.fn().mockReturnThis();

  const mockResponse = {
    json: mockJson,
    status: mockStatus,
    setHeader: jest.fn(),
  };

  return { mockJson, mockStatus, mockResponse };
}

/**
 * Creates mock Voyage AI API response for vector search tests
 */
export function createMockVoyageResponse(dimensions = 2048) {
  return {
    data: [
      {
        embedding: new Array(dimensions).fill(0.1),
      },
    ],
  };
}

// ==================== TEST ASSERTION HELPERS ====================

/**
 * Asserts that a success response was created correctly
 */
export function expectSuccessResponse(
  mockCreateSuccessResponse: jest.Mock,
  data: any,
  message: string
) {
  expect(mockCreateSuccessResponse).toHaveBeenCalledWith(data, message);
}

/**
 * Asserts that an error response was created correctly
 */
export function expectErrorResponse(
  mockStatus: jest.Mock,
  mockJson: jest.Mock,
  statusCode: number,
  errorMessage: string,
  errorCode: string,
  mockCreateErrorResponse?: jest.Mock
) {
  expect(mockStatus).toHaveBeenCalledWith(statusCode);
  if (mockCreateErrorResponse) {
    expect(mockCreateErrorResponse).toHaveBeenCalledWith(errorMessage, errorCode);
  }
  expect(mockJson).toHaveBeenCalledWith({
    success: false,
    message: errorMessage,
    error: {
      message: errorMessage,
      code: errorCode,
      details: undefined,
    },
    timestamp: "2024-01-01T00:00:00.000Z",
  });
}
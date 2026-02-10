/**
 * Unit Tests for Movie Controller
 *
 * These tests verify the business logic of movie controller functions
 * without requiring actual database connections.
 */

import { Request, Response } from "express";
import { ObjectId } from "mongodb";
import { 
  TEST_OBJECT_IDS, 
  SAMPLE_REQUESTS,
  SAMPLE_RESPONSES,
  SAMPLE_MOVIE,
  SAMPLE_MOVIES,
  SAMPLE_SEARCH_RESULTS,
  SAMPLE_VECTOR_RESULTS,
  SAMPLE_VECTOR_MOVIES,
  SAMPLE_COMMENTS_AGGREGATION,
  SAMPLE_YEARS_AGGREGATION,
  SAMPLE_DIRECTORS_AGGREGATION,
  createMockRequest,
  createMockResponse,
  createMockVoyageResponse,
  expectSuccessResponse,
  expectErrorResponse
} from "../utils/testHelpers";

// Mock fetch globally for vector search tests
global.fetch = jest.fn();

// Test Data Constants - Using constants from testHelpers
const TEST_MOVIE_ID = TEST_OBJECT_IDS.VALID;
const INVALID_MOVIE_ID = TEST_OBJECT_IDS.INVALID;

// Mock Voyage AI API response
const MOCK_VOYAGE_RESPONSE = createMockVoyageResponse();

// Create mock collection methods
const mockFind = jest.fn();
const mockFindOne = jest.fn();
const mockInsertOne = jest.fn();
const mockInsertMany = jest.fn();
const mockUpdateOne = jest.fn();
const mockUpdateMany = jest.fn();
const mockDeleteOne = jest.fn();
const mockDeleteMany = jest.fn();
const mockFindOneAndDelete = jest.fn();
const mockAggregate = jest.fn();
const mockToArray = jest.fn();

// Create mock database module
const mockGetCollection = jest.fn(() => ({
  find: mockFind.mockReturnValue({
    toArray: mockToArray,
    limit: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    sort: jest.fn().mockReturnThis(),
  }),
  findOne: mockFindOne,
  insertOne: mockInsertOne,
  insertMany: mockInsertMany,
  updateOne: mockUpdateOne,
  updateMany: mockUpdateMany,
  deleteOne: mockDeleteOne,
  deleteMany: mockDeleteMany,
  findOneAndDelete: mockFindOneAndDelete,
  aggregate: mockAggregate.mockReturnValue({
    toArray: mockToArray,
  }),
}));

// Mock the database module
jest.mock("../../src/config/database", () => ({
  getCollection: mockGetCollection,
}));

// Mock the error handler utilities
const mockCreateSuccessResponse = jest.fn((data: any, message: string) => ({
  success: true,
  message,
  data,
  timestamp: "2024-01-01T00:00:00.000Z",
}));

const mockCreateErrorResponse = jest.fn(
  (message: string, code?: string, details?: any) => ({
    success: false,
    message,
    error: {
      message,
      code,
      details,
    },
    timestamp: "2024-01-01T00:00:00.000Z",
  })
);

const mockValidateRequiredFields = jest.fn();

jest.mock("../../src/utils/errorHandler", () => ({
  createSuccessResponse: mockCreateSuccessResponse,
  createErrorResponse: mockCreateErrorResponse,
  validateRequiredFields: mockValidateRequiredFields,
}));

// Import controller methods after mocks
import {
  getAllMovies,
  getMovieById,
  createMovie,
  createMoviesBatch,
  updateMovie,
  updateMoviesBatch,
  deleteMovie,
  deleteMoviesBatch,
  findAndDeleteMovie,
  searchMovies,
  vectorSearchMovies,
  getMoviesWithMostRecentComments,
  getMoviesByYearWithStats,
  getDirectorsWithMostMovies,
} from "../../src/controllers/movieController";

describe("Movie Controller Tests", () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockJson: jest.Mock;
  let mockStatus: jest.Mock;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Setup fresh response mock
    const responseMocks = createMockResponse();
    mockJson = responseMocks.mockJson;
    mockStatus = responseMocks.mockStatus;
    mockResponse = responseMocks.mockResponse;

    mockRequest = createMockRequest();
  });

  describe("getAllMovies", () => {
    it("should successfully retrieve movies", async () => {
      mockToArray.mockResolvedValue(SAMPLE_MOVIES);

      await getAllMovies(mockRequest as Request, mockResponse as Response);

      expect(mockGetCollection).toHaveBeenCalledWith("movies");
      expect(mockFind).toHaveBeenCalledWith({});
      expectSuccessResponse(
        mockCreateSuccessResponse,
        SAMPLE_MOVIES,
        "Found 2 movies"
      );
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        message: "Found 2 movies",
        data: SAMPLE_MOVIES,
        timestamp: "2024-01-01T00:00:00.000Z",
      });
    });

    it("should handle empty results", async () => {
      mockToArray.mockResolvedValue([]);

      await getAllMovies(mockRequest as Request, mockResponse as Response);

      expectSuccessResponse(mockCreateSuccessResponse, [], "Found 0 movies");
    });

    it("should handle database errors", async () => {
      const errorMessage = "Database connection failed";
      mockToArray.mockRejectedValue(new Error(errorMessage));

      await expect(
        getAllMovies(mockRequest as Request, mockResponse as Response)
      ).rejects.toThrow(errorMessage);
    });

    it("should handle query parameters for filtering", async () => {
      const testMovies = [{ _id: TEST_MOVIE_ID, title: "Action Movie" }];
      mockRequest.query = {
        genre: "Action",
        year: "2010",
        minRating: "7.0",
        limit: "10",
        sortBy: "year",
        sortOrder: "desc",
      };
      mockToArray.mockResolvedValue(testMovies);

      await getAllMovies(mockRequest as Request, mockResponse as Response);

      expect(mockFind).toHaveBeenCalledWith({
        genres: { $regex: new RegExp("Action", "i") },
        year: 2010,
        "imdb.rating": { $gte: 7.0 },
      });
      expect(mockCreateSuccessResponse).toHaveBeenCalledWith(
        testMovies,
        "Found 1 movies"
      );
    });

  });

  describe("getMovieById", () => {
    it("should successfully retrieve a movie by valid ID", async () => {
      mockRequest = createMockRequest({ params: { id: TEST_MOVIE_ID } });
      mockFindOne.mockResolvedValue(SAMPLE_MOVIE);

      await getMovieById(mockRequest as Request, mockResponse as Response);

      expect(mockGetCollection).toHaveBeenCalledWith("movies");
      expect(mockFindOne).toHaveBeenCalledWith({
        _id: new ObjectId(TEST_MOVIE_ID),
      });
      expectSuccessResponse(
        mockCreateSuccessResponse,
        SAMPLE_MOVIE,
        "Movie retrieved successfully"
      );
      expect(mockJson).toHaveBeenCalled();
    });

    it("should return 400 for invalid ObjectId format", async () => {
      mockRequest = createMockRequest({ params: { id: INVALID_MOVIE_ID } });

      await getMovieById(mockRequest as Request, mockResponse as Response);

      expectErrorResponse(
        mockStatus,
        mockJson,
        400,
        "Invalid movie ID format",
        "INVALID_OBJECT_ID"
      );
    });

    it("should return 404 when movie not found", async () => {
      mockRequest = createMockRequest({ params: { id: TEST_MOVIE_ID } });
      mockFindOne.mockResolvedValue(null);

      await getMovieById(mockRequest as Request, mockResponse as Response);

      expectErrorResponse(
        mockStatus,
        mockJson,
        404,
        "Movie not found",
        "MOVIE_NOT_FOUND"
      );
    });

    it("should handle database errors", async () => {
      mockRequest = createMockRequest({ params: { id: TEST_MOVIE_ID } });
      const errorMessage = "Database error";
      mockFindOne.mockRejectedValue(new Error(errorMessage));

      await expect(
        getMovieById(mockRequest as Request, mockResponse as Response)
      ).rejects.toThrow(errorMessage);
    });
  });

  describe("createMovie", () => {
    it("should successfully create a movie", async () => {
      const movieData = SAMPLE_REQUESTS.CREATE_MOVIE;
      const insertResult = SAMPLE_RESPONSES.INSERT_ONE;
      const createdMovie = { _id: insertResult.insertedId, ...movieData };

      mockRequest.body = movieData;
      mockInsertOne.mockResolvedValue(insertResult);
      mockFindOne.mockResolvedValue(createdMovie);

      await createMovie(mockRequest as Request, mockResponse as Response);

      expect(mockValidateRequiredFields).toHaveBeenCalledWith(movieData, [
        "title",
      ]);
      expect(mockInsertOne).toHaveBeenCalledWith(movieData);
      expect(mockFindOne).toHaveBeenCalledWith({
        _id: insertResult.insertedId,
      });
      expect(mockStatus).toHaveBeenCalledWith(201);
      expect(mockCreateSuccessResponse).toHaveBeenCalledWith(
        createdMovie,
        "Movie 'New Movie' created successfully"
      );
    });

    it("should handle validation errors", async () => {
      const movieData = {
        /* missing title */
      };
      mockRequest.body = movieData;

      const error = new Error("Missing required fields: title");
      mockValidateRequiredFields.mockImplementation(() => {
        throw error;
      });

      await expect(
        createMovie(mockRequest as Request, mockResponse as Response)
      ).rejects.toThrow("Missing required fields: title");
    });

    it("should handle insert acknowledgment failure", async () => {
      const movieData = { title: "Test Movie" };
      mockRequest.body = movieData;
      mockValidateRequiredFields.mockImplementation(() => {}); // Don't throw validation error
      mockInsertOne.mockResolvedValue({ acknowledged: false });

      await expect(
        createMovie(mockRequest as Request, mockResponse as Response)
      ).rejects.toThrow("Movie insertion was not acknowledged by the database");
    });
  });

  describe("createMoviesBatch", () => {
    it("should successfully create multiple movies", async () => {
      const moviesData = SAMPLE_REQUESTS.BATCH_CREATE;
      const insertResult = SAMPLE_RESPONSES.INSERT_MANY;

      mockRequest.body = moviesData;
      mockValidateRequiredFields.mockImplementation(() => {}); // Don't throw validation error
      mockInsertMany.mockResolvedValue(insertResult);

      await createMoviesBatch(mockRequest as Request, mockResponse as Response);

      expect(mockInsertMany).toHaveBeenCalledWith(moviesData);
      expect(mockStatus).toHaveBeenCalledWith(201);
      expect(mockCreateSuccessResponse).toHaveBeenCalledWith(
        {
          insertedCount: 2,
          insertedIds: insertResult.insertedIds,
        },
        "Successfully created 2 movies"
      );
    });

    it("should return 400 for invalid input (not an array)", async () => {
      mockRequest.body = { title: "Single Movie" };

      await createMoviesBatch(mockRequest as Request, mockResponse as Response);

      expectErrorResponse(
        mockStatus,
        mockJson,
        400,
        "Request body must be a non-empty array of movie objects",
        "INVALID_INPUT"
      );
    });

    it("should return 400 for empty array", async () => {
      mockRequest.body = [];

      await createMoviesBatch(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
    });
  });

  describe("updateMovie", () => {
    it("should successfully update a movie", async () => {
      const updateData = { title: "Updated Movie" };
      const updateResult = { matchedCount: 1, modifiedCount: 1 };
      const updatedMovie = { _id: TEST_MOVIE_ID, title: "Updated Movie" };

      mockRequest.params = { id: TEST_MOVIE_ID };
      mockRequest.body = updateData;
      mockUpdateOne.mockResolvedValue(updateResult);
      mockFindOne.mockResolvedValue(updatedMovie);

      await updateMovie(mockRequest as Request, mockResponse as Response);

      expect(mockUpdateOne).toHaveBeenCalledWith(
        { _id: new ObjectId(TEST_MOVIE_ID) },
        { $set: updateData }
      );
      expect(mockFindOne).toHaveBeenCalledWith({
        _id: new ObjectId(TEST_MOVIE_ID),
      });
      expect(mockCreateSuccessResponse).toHaveBeenCalledWith(
        updatedMovie,
        "Movie updated successfully. Modified 1 field(s)."
      );
    });

    it("should return 400 for invalid ObjectId", async () => {
      mockRequest.params = { id: INVALID_MOVIE_ID };
      mockRequest.body = { title: "Updated" };

      await updateMovie(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
    });

    it("should return 400 for empty update data", async () => {
      mockRequest.params = { id: TEST_MOVIE_ID };
      mockRequest.body = {};

      await updateMovie(mockRequest as Request, mockResponse as Response);

      expectErrorResponse(
        mockStatus,
        mockJson,
        400,
        "No update data provided",
        "NO_UPDATE_DATA"
      );
    });

    it("should return 404 when movie not found", async () => {
      mockRequest.params = { id: TEST_MOVIE_ID };
      mockRequest.body = { title: "Updated" };
      mockUpdateOne.mockResolvedValue({ matchedCount: 0, modifiedCount: 0 });

      await updateMovie(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(404);
    });
  });

  describe("deleteMovie", () => {
    it("should successfully delete a movie", async () => {
      const deleteResult = { deletedCount: 1 };

      mockRequest.params = { id: TEST_MOVIE_ID };
      mockDeleteOne.mockResolvedValue(deleteResult);

      await deleteMovie(mockRequest as Request, mockResponse as Response);

      expect(mockDeleteOne).toHaveBeenCalledWith({
        _id: new ObjectId(TEST_MOVIE_ID),
      });
      expect(mockCreateSuccessResponse).toHaveBeenCalledWith(
        { deletedCount: 1 },
        "Movie deleted successfully"
      );
    });

    it("should return 400 for invalid ObjectId", async () => {
      mockRequest.params = { id: INVALID_MOVIE_ID };

      await deleteMovie(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
    });

    it("should return 404 when movie not found", async () => {
      mockRequest.params = { id: TEST_MOVIE_ID };
      mockDeleteOne.mockResolvedValue({ deletedCount: 0 });

      await deleteMovie(mockRequest as Request, mockResponse as Response);

      expectErrorResponse(
        mockStatus,
        mockJson,
        404,
        "Movie not found",
        "MOVIE_NOT_FOUND"
      );
    });

    it("should handle database errors", async () => {
      mockRequest.params = { id: TEST_MOVIE_ID };
      const errorMessage = "Database error";
      mockDeleteOne.mockRejectedValue(new Error(errorMessage));

      await expect(
        deleteMovie(mockRequest as Request, mockResponse as Response)
      ).rejects.toThrow(errorMessage);
    });
  });

  describe("updateMoviesBatch", () => {
    it("should successfully update multiple movies", async () => {
      const filter = { year: 2023 };
      const update = { genre: "Updated Genre" };
      const updateResult = { matchedCount: 5, modifiedCount: 3 };

      mockRequest.body = { filter, update };
      mockUpdateMany.mockResolvedValue(updateResult);

      await updateMoviesBatch(mockRequest as Request, mockResponse as Response);

      expect(mockUpdateMany).toHaveBeenCalledWith(filter, { $set: update });
      expect(mockCreateSuccessResponse).toHaveBeenCalledWith(
        {
          matchedCount: 5,
          modifiedCount: 3,
        },
        "Update operation completed. Matched 5 documents, modified 3 documents."
      );
    });

    it("should return 400 when filter is missing", async () => {
      mockRequest.body = { update: { title: "Updated" } };

      await updateMoviesBatch(mockRequest as Request, mockResponse as Response);

      expectErrorResponse(
        mockStatus,
        mockJson,
        400,
        "Both filter and update objects are required",
        "MISSING_REQUIRED_FIELDS"
      );
    });

    it("should return 400 when update is empty", async () => {
      mockRequest.body = { filter: { year: 2023 }, update: {} };

      await updateMoviesBatch(mockRequest as Request, mockResponse as Response);

      expectErrorResponse(
        mockStatus,
        mockJson,
        400,
        "Update object cannot be empty",
        "EMPTY_UPDATE"
      );
    });
  });

  describe("deleteMoviesBatch", () => {
    it("should successfully delete multiple movies", async () => {
      const filter = { year: { $lt: 2000 } };
      const deleteResult = { deletedCount: 10 };

      mockRequest.body = { filter };
      mockDeleteMany.mockResolvedValue(deleteResult);

      await deleteMoviesBatch(mockRequest as Request, mockResponse as Response);

      expect(mockDeleteMany).toHaveBeenCalledWith(filter);
      expect(mockCreateSuccessResponse).toHaveBeenCalledWith(
        { deletedCount: 10 },
        "Delete operation completed. Removed 10 documents."
      );
    });

    it("should return 400 when filter is missing", async () => {
      mockRequest.body = {};

      await deleteMoviesBatch(mockRequest as Request, mockResponse as Response);

      expectErrorResponse(
        mockStatus,
        mockJson,
        400,
        "Filter object is required and cannot be empty. This prevents accidental deletion of all documents.",
        "MISSING_FILTER"
      );
    });

    it("should return 400 when filter is empty", async () => {
      mockRequest.body = { filter: {} };

      await deleteMoviesBatch(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
    });
  });

  describe("findAndDeleteMovie", () => {
    it("should successfully find and delete a movie", async () => {
      const deletedMovie = { _id: TEST_MOVIE_ID, title: "Deleted Movie" };

      mockRequest.params = { id: TEST_MOVIE_ID };
      mockFindOneAndDelete.mockResolvedValue(deletedMovie);

      await findAndDeleteMovie(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockFindOneAndDelete).toHaveBeenCalledWith({
        _id: new ObjectId(TEST_MOVIE_ID),
      });
      expect(mockCreateSuccessResponse).toHaveBeenCalledWith(
        deletedMovie,
        "Movie found and deleted successfully"
      );
    });

    it("should return 400 for invalid ObjectId", async () => {
      mockRequest.params = { id: INVALID_MOVIE_ID };

      await findAndDeleteMovie(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockStatus).toHaveBeenCalledWith(400);
    });

    it("should return 404 when movie not found", async () => {
      mockRequest.params = { id: TEST_MOVIE_ID };
      mockFindOneAndDelete.mockResolvedValue(null);

      await findAndDeleteMovie(
        mockRequest as Request,
        mockResponse as Response
      );

      expectErrorResponse(
        mockStatus,
        mockJson,
        404,
        "Movie not found",
        "MOVIE_NOT_FOUND"
      );
    });

    it("should handle database errors", async () => {
      mockRequest.params = { id: TEST_MOVIE_ID };
      const errorMessage = "Database error";
      mockFindOneAndDelete.mockRejectedValue(new Error(errorMessage));

      await expect(
        findAndDeleteMovie(mockRequest as Request, mockResponse as Response)
      ).rejects.toThrow(errorMessage);
    });
  });

  // ==================== SEARCH ENDPOINTS TESTS ====================

  describe("searchMovies", () => {
    beforeEach(() => {
      // Reset environment variables
      delete process.env.NODE_ENV;
    });

    it("should successfully search movies by plot", async () => {
      const searchResults = [
        {
          totalCount: [{ count: 2 }],
          results: SAMPLE_SEARCH_RESULTS,
        },
      ];

      mockRequest.query = { plot: "space adventure" };
      mockToArray.mockResolvedValue(searchResults);

      await searchMovies(mockRequest as Request, mockResponse as Response);

      expect(mockGetCollection).toHaveBeenCalledWith("movies");
      expect(mockAggregate).toHaveBeenCalled();
      expect(mockCreateSuccessResponse).toHaveBeenCalledWith(
        {
          movies: SAMPLE_SEARCH_RESULTS,
          totalCount: 2,
        },
        "Found 2 movies matching the search criteria"
      );
    });

    it("should handle search with multiple fields", async () => {
      const searchResults = [
        {
          totalCount: [{ count: 1 }],
          results: [SAMPLE_SEARCH_RESULTS[0]],
        },
      ];

      mockRequest.query = {
        plot: "space",
        directors: "Nolan",
        cast: "DiCaprio",
      };
      mockToArray.mockResolvedValue(searchResults);

      await searchMovies(mockRequest as Request, mockResponse as Response);

      expect(mockAggregate).toHaveBeenCalled();
      expect(mockCreateSuccessResponse).toHaveBeenCalledWith(
        {
          movies: [SAMPLE_SEARCH_RESULTS[0]],
          totalCount: 1,
        },
        "Found 1 movies matching the search criteria"
      );
    });

    it("should return 400 when no search parameters provided", async () => {
      mockRequest.query = {};

      await searchMovies(mockRequest as Request, mockResponse as Response);

      expectErrorResponse(
        mockStatus,
        mockJson,
        400,
        "At least one search parameter must be provided",
        "NO_SEARCH_PARAMETERS"
      );
    });

    it("should return 400 for invalid search operator", async () => {
      mockRequest.query = {
        plot: "adventure",
        searchOperator: "invalid",
      };

      await searchMovies(mockRequest as Request, mockResponse as Response);

      expectErrorResponse(
        mockStatus,
        mockJson,
        400,
        "Invalid search_operator 'invalid'. Must be one of: must, should, mustNot, filter",
        "INVALID_SEARCH_OPERATOR"
      );
    });

    it("should handle pagination parameters", async () => {
      const searchResults = [
        {
          totalCount: [{ count: 10 }],
          results: SAMPLE_SEARCH_RESULTS,
        },
      ];

      mockRequest.query = {
        plot: "adventure",
        limit: "5",
        skip: "10",
      };
      mockToArray.mockResolvedValue(searchResults);

      await searchMovies(mockRequest as Request, mockResponse as Response);

      expect(mockCreateSuccessResponse).toHaveBeenCalledWith(
        {
          movies: SAMPLE_SEARCH_RESULTS,
          totalCount: 10,
        },
        "Found 10 movies matching the search criteria"
      );
    });

    it("should return empty results when no matches found", async () => {
      const searchResults = [
        {
          totalCount: [],
          results: [],
        },
      ];

      mockRequest.query = { plot: "nonexistent" };
      mockToArray.mockResolvedValue(searchResults);

      await searchMovies(mockRequest as Request, mockResponse as Response);

      expect(mockCreateSuccessResponse).toHaveBeenCalledWith(
        {
          movies: [],
          totalCount: 0,
        },
        "Found 0 movies matching the search criteria"
      );
    });
  });

  describe("vectorSearchMovies", () => {
    const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

    beforeEach(() => {
      process.env.VOYAGE_API_KEY = "test-api-key";
      mockFetch.mockClear();
    });

    afterEach(() => {
      delete process.env.VOYAGE_API_KEY;
    });

    it("should successfully perform vector search", async () => {
      // Mock Voyage AI API response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(MOCK_VOYAGE_RESPONSE),
      } as any);

      // Ensure SAMPLE_VECTOR_RESULTS and SAMPLE_VECTOR_MOVIES have matching IDs
      const vectorResultsWithMatchingIds = SAMPLE_VECTOR_RESULTS.map((result, index) => ({
        ...result,
        _id: SAMPLE_VECTOR_MOVIES[index]._id,
      }));

      // Mock database responses - first call for embedded_movies collection (vector search)
      mockToArray
        .mockResolvedValueOnce(vectorResultsWithMatchingIds)
        // Second call for movies collection (complete movie data)
        .mockResolvedValueOnce(SAMPLE_VECTOR_MOVIES);

      mockRequest.query = { q: "space adventure", limit: "3" };

      await vectorSearchMovies(mockRequest as Request, mockResponse as Response);

      expect(mockFetch).toHaveBeenCalledWith(
        "https://api.voyageai.com/v1/embeddings",
        expect.objectContaining({
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer test-api-key",
          },
        })
      );

      // Should call embedded_movies collection first, then movies collection
      expect(mockGetCollection).toHaveBeenCalledWith("embedded_movies");
      expect(mockGetCollection).toHaveBeenCalledWith("movies");
      expect(mockAggregate).toHaveBeenCalledTimes(2);

      // Verify the final result structure includes all movie fields
      const expectedResults = SAMPLE_VECTOR_MOVIES.map((movie, index) => ({
        _id: movie._id.toString(),
        title: movie.title,
        plot: movie.plot,
        poster: movie.poster,
        year: movie.year,
        genres: movie.genres,
        directors: movie.directors,
        cast: movie.cast,
        score: SAMPLE_VECTOR_RESULTS[index].score,
      }));

      expect(mockCreateSuccessResponse).toHaveBeenCalledWith(
        expectedResults,
        "Found 2 similar movies for query: 'space adventure'"
      );
    });

    it("should return 400 when query is missing", async () => {
      mockRequest.query = {};

      await vectorSearchMovies(mockRequest as Request, mockResponse as Response);

      expectErrorResponse(
        mockStatus,
        mockJson,
        400,
        "Search query is required",
        "MISSING_QUERY_PARAMETER"
      );
    });

    it("should return 400 when query is empty", async () => {
      mockRequest.query = { q: "" };

      await vectorSearchMovies(mockRequest as Request, mockResponse as Response);

      expectErrorResponse(
        mockStatus,
        mockJson,
        400,
        "Search query is required",
        "MISSING_QUERY_PARAMETER"
      );
    });

    it("should return 400 when VOYAGE_API_KEY is not configured", async () => {
      delete process.env.VOYAGE_API_KEY;

      mockRequest.query = { q: "test" };

      await vectorSearchMovies(mockRequest as Request, mockResponse as Response);

      expectErrorResponse(
        mockStatus,
        mockJson,
        400,
        "Vector search unavailable: VOYAGE_API_KEY not configured. Please add your API key to the .env file",
        "SERVICE_UNAVAILABLE"
      );
    });

    it("should handle Voyage AI authentication errors with 401 status", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        text: () => Promise.resolve("Unauthorized"),
      } as any);

      mockRequest.query = { q: "test" };

      await vectorSearchMovies(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(401);
      expect(mockCreateErrorResponse).toHaveBeenCalledWith(
        "Invalid Voyage AI API key. Please check your VOYAGE_API_KEY in the .env file",
        "VOYAGE_AUTH_ERROR",
        "Please verify your VOYAGE_API_KEY is correct in the .env file"
      );
    });

    it("should handle other Voyage AI API errors with 503 status", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: () => Promise.resolve("Internal Server Error"),
      } as any);

      mockRequest.query = { q: "test" };

      await vectorSearchMovies(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(503);
      expect(mockCreateErrorResponse).toHaveBeenCalledWith(
        "Vector search service unavailable",
        "VOYAGE_API_ERROR",
        expect.stringContaining("Voyage AI API returned status 500")
      );
    });

    it("should use default limit when not provided", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(MOCK_VOYAGE_RESPONSE),
      } as any);

      // Mock empty results from vector search
      mockToArray
        .mockResolvedValueOnce([]) // empty vector search results
        .mockResolvedValueOnce([]); // empty movie results

      mockRequest.query = { q: "test" };

      await vectorSearchMovies(mockRequest as Request, mockResponse as Response);

      expect(mockCreateSuccessResponse).toHaveBeenCalledWith(
        [],
        "No similar movies found for query: 'test'"
      );
    });
  });

  // ==================== AGGREGATION ENDPOINTS TESTS ====================

  describe("getMoviesWithMostRecentComments", () => {
    beforeEach(() => {
      // Reset mocks for aggregation tests to avoid interference from vector search tests
      mockToArray.mockReset();
    });

    it("should successfully get movies with comments", async () => {
      mockRequest.query = { limit: "10" };
      mockToArray.mockResolvedValue(SAMPLE_COMMENTS_AGGREGATION);

      await getMoviesWithMostRecentComments(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockGetCollection).toHaveBeenCalledWith("movies");
      expect(mockAggregate).toHaveBeenCalled();

      const expectedResults = SAMPLE_COMMENTS_AGGREGATION.map((result) => ({
        _id: result._id.toString(),
        title: result.title,
        year: result.year,
        genres: result.genres,
        imdbRating: result.imdbRating,
        recentComments: result.recentComments.map((comment) => ({
          _id: comment._id?.toString(),
          userName: comment.userName,
          userEmail: comment.userEmail,
          text: comment.text,
          date: comment.date,
        })),
        totalComments: result.totalComments,
      }));

      expect(mockCreateSuccessResponse).toHaveBeenCalledWith(
        expectedResults,
        "Found 5 comments from 1 movie"
      );
    });

    it("should filter by specific movieId when provided", async () => {
      mockRequest.query = { movieId: TEST_MOVIE_ID };
      mockToArray.mockResolvedValue(SAMPLE_COMMENTS_AGGREGATION);

      await getMoviesWithMostRecentComments(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockAggregate).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            $match: expect.objectContaining({
              _id: new ObjectId(TEST_MOVIE_ID),
            }),
          }),
        ])
      );
    });

    it("should return 400 for invalid movieId format", async () => {
      mockRequest.query = { movieId: INVALID_MOVIE_ID };

      await getMoviesWithMostRecentComments(
        mockRequest as Request,
        mockResponse as Response
      );

      expectErrorResponse(
        mockStatus,
        mockJson,
        400,
        "Invalid movie ID format",
        "INVALID_OBJECT_ID"
      );
    });

    it("should handle empty results", async () => {
      mockRequest.query = {};
      mockToArray.mockResolvedValue([]);

      await getMoviesWithMostRecentComments(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockCreateSuccessResponse).toHaveBeenCalledWith(
        [],
        "Found 0 comments from 0 movies"
      );
    });

    it("should use default limit when not provided", async () => {
      mockRequest.query = {};
      mockToArray.mockResolvedValue(SAMPLE_COMMENTS_AGGREGATION);

      await getMoviesWithMostRecentComments(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockAggregate).toHaveBeenCalled();
    });
  });

  describe("getMoviesByYearWithStats", () => {
    it("should successfully get movies statistics by year", async () => {
      mockRequest.query = {};
      mockToArray.mockResolvedValue(SAMPLE_YEARS_AGGREGATION);

      await getMoviesByYearWithStats(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockGetCollection).toHaveBeenCalledWith("movies");
      expect(mockAggregate).toHaveBeenCalled();
      expect(mockCreateSuccessResponse).toHaveBeenCalledWith(
        SAMPLE_YEARS_AGGREGATION,
        "Aggregated statistics for 2 years"
      );
    });

    it("should handle empty results", async () => {
      mockRequest.query = {};
      mockToArray.mockResolvedValue([]);

      await getMoviesByYearWithStats(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockCreateSuccessResponse).toHaveBeenCalledWith(
        [],
        "Aggregated statistics for 0 years"
      );
    });

    it("should handle database errors", async () => {
      mockRequest.query = {};
      const errorMessage = "Aggregation failed";
      mockToArray.mockRejectedValue(new Error(errorMessage));

      await expect(
        getMoviesByYearWithStats(mockRequest as Request, mockResponse as Response)
      ).rejects.toThrow(errorMessage);
    });
  });

  describe("getDirectorsWithMostMovies", () => {
    it("should successfully get directors statistics", async () => {
      mockRequest.query = { limit: "20" };
      mockToArray.mockResolvedValue(SAMPLE_DIRECTORS_AGGREGATION);

      await getDirectorsWithMostMovies(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockGetCollection).toHaveBeenCalledWith("movies");
      expect(mockAggregate).toHaveBeenCalled();
      expect(mockCreateSuccessResponse).toHaveBeenCalledWith(
        SAMPLE_DIRECTORS_AGGREGATION,
        "Found 2 directors with most movies"
      );
    });

    it("should handle custom limit parameter", async () => {
      mockRequest.query = { limit: "10" };
      mockToArray.mockResolvedValue(SAMPLE_DIRECTORS_AGGREGATION.slice(0, 1));

      await getDirectorsWithMostMovies(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockCreateSuccessResponse).toHaveBeenCalledWith(
        SAMPLE_DIRECTORS_AGGREGATION.slice(0, 1),
        "Found 1 directors with most movies"
      );
    });

    it("should use default limit when not provided", async () => {
      mockRequest.query = {};
      mockToArray.mockResolvedValue(SAMPLE_DIRECTORS_AGGREGATION);

      await getDirectorsWithMostMovies(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockAggregate).toHaveBeenCalled();
    });

    it("should handle empty results", async () => {
      mockRequest.query = {};
      mockToArray.mockResolvedValue([]);

      await getDirectorsWithMostMovies(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockCreateSuccessResponse).toHaveBeenCalledWith(
        [],
        "Found 0 directors with most movies"
      );
    });

    it("should handle database errors", async () => {
      mockRequest.query = {};
      const errorMessage = "Aggregation pipeline failed";
      mockToArray.mockRejectedValue(new Error(errorMessage));

      await expect(
        getDirectorsWithMostMovies(mockRequest as Request, mockResponse as Response)
      ).rejects.toThrow(errorMessage);
    });
  });
});

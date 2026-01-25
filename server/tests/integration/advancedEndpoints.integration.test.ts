/**
 * Advanced Endpoints Integration Tests
 *
 * These tests verify the advanced MongoDB API endpoints including:
 * - MongoDB Search
 * - Vector Search
 * - Aggregation pipelines ($lookup, $group, $unwind)
 *
 * These tests use supertest to make actual HTTP requests to the Express app,
 * testing the full request/response cycle including routing, controllers, and database operations.
 *
 * Requirements:
 * - MONGODB_URI environment variable must be set
 * - MongoDB instance must be accessible
 * - For Search tests: ENABLE_SEARCH_TESTS=true
 * - For Vector Search tests: VOYAGE_API_KEY must be set
 */

import request from "supertest";
import { ObjectId } from "mongodb";
import { app } from "../../src/app";
import { getCollection } from "../../src/config/database";
import { describeIntegration, describeSearch, describeVectorSearch } from "./setup";

describeIntegration("Advanced Endpoints Integration Tests", () => {
  let testMovieIds: string[] = [];
  let testCommentIds: ObjectId[] = [];

  beforeAll(async () => {
    // Clean up any orphaned test data from previous failed runs
    const moviesCollection = getCollection("movies");
    const commentsCollection = getCollection("comments");

    await moviesCollection.deleteMany({
      $or: [
        { title: { $regex: /^Test Advanced Movie/ } },
        { title: { $regex: /^Test Aggregation Movie/ } },
        { title: { $regex: /^Test Director Movie/ } },
        { title: { $regex: /^Test Year Stats Movie/ } },
      ],
    });

    await commentsCollection.deleteMany({
      name: { $regex: /^Test User/ },
    });
  });

  afterEach(async () => {
    // Clean up test data after each test
    if (testMovieIds.length > 0) {
      const moviesCollection = getCollection("movies");
      await moviesCollection.deleteMany({
        _id: { $in: testMovieIds.map((id) => new ObjectId(id)) },
      });
      testMovieIds = [];
    }

    if (testCommentIds.length > 0) {
      const commentsCollection = getCollection("comments");
      await commentsCollection.deleteMany({
        _id: { $in: testCommentIds },
      });
      testCommentIds = [];
    }
  });

  describe("GET /api/movies/aggregations/reportingByComments", () => {
    test("should return movies with their most recent comments", async () => {
      // Create test movie via API
      const testMovie = {
        title: "Test Aggregation Movie 1",
        year: 2024,
        plot: "A test movie for aggregation",
        genres: ["Drama"],
        imdb: { rating: 8.5 },
      };

      const createResponse = await request(app)
        .post("/api/movies")
        .send(testMovie)
        .expect(201);

      const movieId = createResponse.body.data._id;
      testMovieIds.push(movieId);

      // Create test comments directly in database (no API endpoint for comments)
      const commentsCollection = getCollection("comments");
      const testComments = [
        {
          movie_id: new ObjectId(movieId),
          name: "Test User 1",
          email: "test1@example.com",
          text: "Great movie!",
          date: new Date("2024-01-15"),
        },
        {
          movie_id: new ObjectId(movieId),
          name: "Test User 2",
          email: "test2@example.com",
          text: "Loved it!",
          date: new Date("2024-01-20"),
        },
        {
          movie_id: new ObjectId(movieId),
          name: "Test User 3",
          email: "test3@example.com",
          text: "Amazing!",
          date: new Date("2024-01-25"),
        },
      ];

      const commentsResult = await commentsCollection.insertMany(testComments);
      testCommentIds.push(...Object.values(commentsResult.insertedIds));

      // Test the API endpoint
      const response = await request(app)
        .get("/api/movies/aggregations/reportingByComments")
        .query({ limit: 10 })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data)).toBe(true);

      // Find our test movie in the results
      const testMovieResult = response.body.data.find(
        (m: any) => m._id === movieId
      );

      expect(testMovieResult).toBeDefined();
      expect(testMovieResult.title).toBe("Test Aggregation Movie 1");
      expect(testMovieResult.totalComments).toBe(3);
      expect(testMovieResult.recentComments).toHaveLength(3);

      // Verify comments are sorted by date (most recent first)
      expect(testMovieResult.recentComments[0].userName).toBe("Test User 3");
      expect(testMovieResult.recentComments[1].userName).toBe("Test User 2");
      expect(testMovieResult.recentComments[2].userName).toBe("Test User 1");
    });

    test("should limit recent comments per movie", async () => {
      // Create test movie
      const testMovie = {
        title: "Test Aggregation Movie Limit",
        year: 2024,
        plot: "A test movie",
        imdb: { rating: 7.5 },
      };

      const createResponse = await request(app)
        .post("/api/movies")
        .send(testMovie)
        .expect(201);

      testMovieIds.push(createResponse.body.data._id);

      // Create many comments
      const commentsCollection = getCollection("comments");
      const manyComments = Array.from({ length: 10 }, (_, i) => ({
        movie_id: new ObjectId(createResponse.body.data._id),
        name: `Test User ${i}`,
        email: `test${i}@example.com`,
        text: `Comment ${i}`,
        date: new Date(`2024-01-${i + 1}`),
      }));

      const commentsResult = await commentsCollection.insertMany(manyComments);
      testCommentIds.push(...Object.values(commentsResult.insertedIds));

      // Request with limit of 3 recent comments
      const response = await request(app)
        .get("/api/movies/aggregations/reportingByComments")
        .query({ limit: 3 })
        .expect(200);

      expect(response.body.success).toBe(true);
      const testMovieResult = response.body.data.find(
        (m: any) => m._id === createResponse.body.data._id
      );

      if (testMovieResult) {
        // Should have all 10 comments total
        expect(testMovieResult.totalComments).toBe(10);
        // But only 3 recent comments returned
        expect(testMovieResult.recentComments.length).toBe(3);
      }
    });

    test("should handle movies with no comments", async () => {
      // Create a movie without comments
      const testMovie = {
        title: "Test Aggregation Movie No Comments",
        year: 2024,
        plot: "A movie with no comments",
      };

      const createResponse = await request(app)
        .post("/api/movies")
        .send(testMovie)
        .expect(201);

      testMovieIds.push(createResponse.body.data._id);

      // The endpoint should only return movies with comments
      const response = await request(app)
        .get("/api/movies/aggregations/reportingByComments")
        .query({ limit: 100 })
        .expect(200);

      const movieWithNoComments = response.body.data.find(
        (m: any) => m._id === createResponse.body.data._id
      );

      // Movie without comments should not be in results
      expect(movieWithNoComments).toBeUndefined();
    });
  });

  describe("GET /api/movies/aggregations/reportingByYear", () => {
    test("should return movie statistics grouped by year", async () => {
      // Create test movies for a specific year
      const testYear = 2023;
      const testMovies = [
        {
          title: "Test Year Stats Movie 1",
          year: testYear,
          plot: "First test movie",
          imdb: { rating: 8.0, votes: 1000 },
        },
        {
          title: "Test Year Stats Movie 2",
          year: testYear,
          plot: "Second test movie",
          imdb: { rating: 9.0, votes: 2000 },
        },
      ];

      for (const movie of testMovies) {
        const createResponse = await request(app)
          .post("/api/movies")
          .send(movie)
          .expect(201);
        testMovieIds.push(createResponse.body.data._id);
      }

      // Test the API endpoint
      const response = await request(app)
        .get("/api/movies/aggregations/reportingByYear")
        .query({ limit: 50 })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data)).toBe(true);

      // Find our test year in the results
      const yearStats = response.body.data.find(
        (y: any) => y.year === testYear
      );

      expect(yearStats).toBeDefined();
      expect(yearStats.movieCount).toBeGreaterThanOrEqual(2);
      expect(yearStats.averageRating).toBeDefined();

      // Check ratings if they exist (our test movies have ratings)
      if (yearStats.highestRating !== null) {
        expect(yearStats.highestRating).toBeGreaterThanOrEqual(8.0);
      }
      if (yearStats.lowestRating !== null) {
        expect(yearStats.lowestRating).toBeLessThanOrEqual(9.0);
      }
    });

    test("should sort results by year in descending order", async () => {
      const response = await request(app)
        .get("/api/movies/aggregations/reportingByYear")
        .query({ limit: 10 })
        .expect(200);

      expect(response.body.success).toBe(true);
      const data = response.body.data;

      // Verify years are in descending order
      for (let i = 0; i < data.length - 1; i++) {
        expect(data[i].year).toBeGreaterThanOrEqual(data[i + 1].year);
      }
    });
  });

  describe("GET /api/movies/aggregations/reportingByDirectors", () => {
    test("should return directors with their movie counts and verify response structure", async () => {
      // Test the API endpoint
      const response = await request(app)
        .get("/api/movies/aggregations/reportingByDirectors")
        .query({ limit: 20 })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);

      // Verify the response structure
      const firstDirector = response.body.data[0];
      expect(firstDirector).toHaveProperty("director");
      expect(firstDirector).toHaveProperty("movieCount");
      expect(firstDirector).toHaveProperty("averageRating");

      // Verify directors are sorted by movie count (descending)
      expect(firstDirector.movieCount).toBeGreaterThan(0);

      // Verify all directors have the expected structure
      response.body.data.forEach((director: any) => {
        expect(typeof director.director).toBe("string");
        expect(typeof director.movieCount).toBe("number");
        expect(director.movieCount).toBeGreaterThan(0);
        if (director.averageRating !== null) {
          expect(typeof director.averageRating).toBe("number");
        }
      });
    });
  });
});

describeSearch("MongoDB Search Integration Tests", () => {
  let testMovieIds: string[] = [];

  beforeAll(async () => {
    if (!process.env.ENABLE_SEARCH_TESTS) {
      console.log(`
⚠️  MongoDB Search tests skipped: ENABLE_SEARCH_TESTS environment variable is not set
   To run MongoDB Search integration tests, set ENABLE_SEARCH_TESTS=true in your .env file
   Example: ENABLE_SEARCH_TESTS=true npm run test:integration
`);
      return;
    }

    // Clean up any orphaned test data from previous failed runs
    const moviesCollection = getCollection("movies");
    await moviesCollection.deleteMany({
      title: { $regex: /^Test Search Movie/ },
    });
  });

  afterEach(async () => {
    if (!process.env.ENABLE_SEARCH_TESTS) {
      return;
    }

    // Clean up test data after each test
    if (testMovieIds.length > 0) {
      const moviesCollection = getCollection("movies");
      await moviesCollection.deleteMany({
        _id: { $in: testMovieIds.map((id) => new ObjectId(id)) },
      });
      testMovieIds = [];
    }
  });

  describe("GET /api/movies/search", () => {
    test("should search movies by plot using phrase matching", async () => {
      // Create test movies with specific plots
      const testMovies = [
        {
          title: "Test Search Movie 1",
          year: 2024,
          plot: "A detective solving a mysterious crime in the city",
          genres: ["Mystery", "Thriller"],
        },
        {
          title: "Test Search Movie 2",
          year: 2024,
          plot: "An epic space adventure across the galaxy",
          genres: ["Sci-Fi", "Adventure"],
        },
      ];

      for (const movie of testMovies) {
        const createResponse = await request(app)
          .post("/api/movies")
          .send(movie)
          .expect(201);
        testMovieIds.push(createResponse.body.data._id);
      }

      // Wait for search index to update
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Test search for "detective solving"
      const response = await request(app)
        .get("/api/movies/search")
        .query({ plot: "detective solving", searchOperator: "must", limit: 10 })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.movies).toBeDefined();
      expect(Array.isArray(response.body.data.movies)).toBe(true);

      // Find our test movie in the results
      const foundMovie = response.body.data.movies.find(
        (m: any) => m.title === "Test Search Movie 1"
      );

      if (foundMovie) {
        expect(foundMovie.plot).toContain("detective solving");
      }
    });

    test("should search movies by directors", async () => {
      const testMovie = {
        title: "Test Search Movie Director",
        year: 2024,
        plot: "A test movie",
        directors: ["Christopher Nolan"],
      };

      const createResponse = await request(app)
        .post("/api/movies")
        .send(testMovie)
        .expect(201);
      testMovieIds.push(createResponse.body.data._id);

      // Wait for search index to update
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Test search for director
      const response = await request(app)
        .get("/api/movies/search")
        .query({ directors: "Christopher Nolan", limit: 10 })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.movies).toBeDefined();
    });

    test("should support pagination with skip and limit", async () => {
      const response = await request(app)
        .get("/api/movies/search")
        .query({ plot: "love", limit: 5, skip: 0 })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.movies.length).toBeLessThanOrEqual(5);
      expect(response.body.data.totalCount).toBeDefined();
    });

    test("should return error when no search parameters provided", async () => {
      const response = await request(app)
        .get("/api/movies/search")
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });
  });

  describe("GET /api/movies/genres", () => {
    test("should return list of distinct genres", async () => {
      const response = await request(app)
        .get("/api/movies/genres")
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);

      // Verify genres are strings
      response.body.data.forEach((genre: any) => {
        expect(typeof genre).toBe("string");
        expect(genre.length).toBeGreaterThan(0);
      });
    });

    test("should return genres sorted alphabetically", async () => {
      const response = await request(app)
        .get("/api/movies/genres")
        .expect(200);

      expect(response.body.success).toBe(true);
      const genres = response.body.data;

      // Verify alphabetical sorting
      for (let i = 0; i < genres.length - 1; i++) {
        expect(genres[i].localeCompare(genres[i + 1])).toBeLessThanOrEqual(0);
      }
    });

    test("should include common genres like Action, Drama, Comedy", async () => {
      const response = await request(app)
        .get("/api/movies/genres")
        .expect(200);

      expect(response.body.success).toBe(true);
      const genres = response.body.data;

      // The sample_mflix dataset should contain these common genres
      expect(genres).toContain("Action");
      expect(genres).toContain("Drama");
      expect(genres).toContain("Comedy");
    });
  });
});


describeVectorSearch("Vector Search Integration Tests", () => {
  let testMovieIds: string[] = [];

  afterEach(async () => {
    // Clean up test data after each test
    if (testMovieIds.length > 0) {
      const moviesCollection = getCollection("movies");
      await moviesCollection.deleteMany({
        _id: { $in: testMovieIds.map((id) => new ObjectId(id)) },
      });
      testMovieIds = [];
    }
  });

  describe("GET /api/movies/vector-search", () => {
    test("should perform vector search and return similar movies", async () => {
      const response = await request(app)
        .get("/api/movies/vector-search")
        .query({ q: "space adventure", limit: 5 })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data)).toBe(true);

      // If results are returned, verify structure
      if (response.body.data.length > 0) {
        const firstResult = response.body.data[0];
        expect(firstResult).toHaveProperty("_id");
        expect(firstResult).toHaveProperty("title");
        expect(firstResult).toHaveProperty("score");
        expect(typeof firstResult.score).toBe("number");

        // Verify scores are in descending order
        for (let i = 0; i < response.body.data.length - 1; i++) {
          expect(response.body.data[i].score).toBeGreaterThanOrEqual(
            response.body.data[i + 1].score
          );
        }
      }
    });

    test("should respect limit parameter", async () => {
      const limit = 3;
      const response = await request(app)
        .get("/api/movies/vector-search")
        .query({ q: "detective mystery", limit })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBeLessThanOrEqual(limit);
    });

    test("should return error when query parameter is missing", async () => {
      const response = await request(app)
        .get("/api/movies/vector-search")
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });

    test("should handle empty query string", async () => {
      const response = await request(app)
        .get("/api/movies/vector-search")
        .query({ q: "" })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });
});

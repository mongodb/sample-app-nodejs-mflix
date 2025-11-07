/**
 * Movie CRUD Integration Tests
 *
 * These tests verify the full API functionality for movie CRUD operations.
 * Unlike unit tests, these tests make actual HTTP requests to the Express app
 * and connect to a real MongoDB instance.
 *
 * Requirements:
 * - MONGODB_URI environment variable must be set
 * - MongoDB instance must be accessible
 */

import request from "supertest";
import { ObjectId } from "mongodb";
import { app } from "../../src/app";
import { getCollection } from "../../src/config/database";
import { describeIntegration } from "./setup";

describeIntegration("Movie CRUD API Integration Tests", () => {
  let testMovieIds: string[] = [];

  beforeAll(async () => {
    // Clean up any orphaned test data from previous failed runs
    // This ensures tests are idempotent
    const moviesCollection = getCollection("movies");
    await moviesCollection.deleteMany({
      $or: [
        { title: { $regex: /^Integration Test Movie/ } },
        { title: { $regex: /^Find By ID Test Movie/ } },
        { title: { $regex: /^Action Movie 202[0-9]/ } },
        { title: { $regex: /^Drama Movie 202[0-9]/ } },
        { title: { $regex: /^Pagination Test Movie/ } },
        { title: { $regex: /^Original Title/ } },
        { title: { $regex: /^Updated Title/ } },
        { title: { $regex: /^Movie [0-9]/ } },
        { title: { $regex: /^Movie to Delete/ } },
        { title: { $regex: /^Delete Test/ } },
        { title: { $regex: /^Find and Delete Test/ } },
        { title: { $regex: /^Batch Test Movie/ } },
      ],
    });
  });

  afterEach(async () => {
    // Clean up test movies after each test
    if (testMovieIds.length > 0) {
      const moviesCollection = getCollection("movies");
      await moviesCollection.deleteMany({
        _id: { $in: testMovieIds.map((id) => new ObjectId(id)) },
      });
      testMovieIds = [];
    }
  });

  describe("POST /api/movies - Create Single Movie", () => {
    test("should create a single movie", async () => {
      const newMovie = {
        title: "Integration Test Movie",
        year: 2024,
        plot: "A movie created during integration testing",
        genres: ["Test", "Drama"],
      };

      const response = await request(app)
        .post("/api/movies")
        .send(newMovie)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data._id).toBeDefined();
      expect(response.body.data.title).toBe(newMovie.title);
      expect(response.body.data.year).toBe(newMovie.year);
      expect(response.body.data.plot).toBe(newMovie.plot);
      expect(response.body.data.genres).toEqual(newMovie.genres);

      testMovieIds.push(response.body.data._id.toString());
    });

    test("should return 400 when title is missing", async () => {
      const invalidMovie = {
        year: 2024,
        plot: "Missing title",
      };

      const response = await request(app)
        .post("/api/movies")
        .send(invalidMovie)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });
  });

  describe("POST /api/movies/batch - Create Multiple Movies", () => {
    test("should create multiple movies", async () => {
      const newMovies = [
        {
          title: "Batch Test Movie 1",
          year: 2024,
          plot: "First test movie",
          genres: ["Test"],
        },
        {
          title: "Batch Test Movie 2",
          year: 2024,
          plot: "Second test movie",
          genres: ["Test"],
        },
        {
          title: "Batch Test Movie 3",
          year: 2024,
          plot: "Third test movie",
          genres: ["Test"],
        },
      ];

      const response = await request(app)
        .post("/api/movies/batch")
        .send(newMovies)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.insertedCount).toBe(3);
      expect(response.body.data.insertedIds).toBeDefined();
      expect(Object.keys(response.body.data.insertedIds).length).toBe(3);

      // Extract IDs from the insertedIds object
      const ids = Object.values(response.body.data.insertedIds) as string[];
      testMovieIds.push(...ids);
    });

    test("should return 400 when request body is not an array", async () => {
      const response = await request(app)
        .post("/api/movies/batch")
        .send({ title: "Single Movie" })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });
  });

  describe("GET /api/movies/:id - Get Movie by ID", () => {
    test("should get a movie by ID", async () => {
      // Create a test movie
      const newMovie = {
        title: "Find By ID Test Movie",
        year: 2024,
        plot: "Testing get by ID",
      };

      const createResponse = await request(app)
        .post("/api/movies")
        .send(newMovie)
        .expect(201);

      const movieId = createResponse.body.data._id.toString();
      testMovieIds.push(movieId);

      // Get the movie by ID
      const response = await request(app)
        .get(`/api/movies/${movieId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data._id).toBe(movieId);
      expect(response.body.data.title).toBe(newMovie.title);
    });

    test("should return 404 for non-existent movie", async () => {
      const fakeId = new ObjectId().toString();

      const response = await request(app)
        .get(`/api/movies/${fakeId}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });

    test("should return 400 for invalid ObjectId format", async () => {
      const response = await request(app)
        .get("/api/movies/invalid-id")
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });
  });

  describe("GET /api/movies - Get All Movies with Filters", () => {
    test("should get movies with year filter", async () => {
      // Create a test movie with a specific year
      const testMovie = {
        title: "Action Movie 2024",
        year: 2024,
        genres: ["Action"],
      };

      const createResponse = await request(app)
        .post("/api/movies")
        .send(testMovie)
        .expect(201);

      testMovieIds.push(createResponse.body.data._id.toString());

      // Get movies from 2024
      const response = await request(app)
        .get("/api/movies")
        .query({ year: 2024 })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);

      // Verify all returned movies have year 2024
      const allHaveCorrectYear = response.body.data.every(
        (m: any) => m.year === 2024
      );
      expect(allHaveCorrectYear).toBe(true);
    });

    test("should get movies with genre filter", async () => {
      // Create a test movie with a specific genre
      const testMovie = {
        title: "Action Movie 2024",
        year: 2024,
        genres: ["Action", "Thriller"],
      };

      const createResponse = await request(app)
        .post("/api/movies")
        .send(testMovie)
        .expect(201);

      testMovieIds.push(createResponse.body.data._id.toString());

      // Get action movies
      const response = await request(app)
        .get("/api/movies")
        .query({ genre: "Action" })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);

      // Verify all returned movies have "Action" in their genres
      const allHaveActionGenre = response.body.data.every((m: any) =>
        m.genres && m.genres.some((g: string) => /action/i.test(g))
      );
      expect(allHaveActionGenre).toBe(true);
    });

    test("should support pagination with limit and skip", async () => {
      const response = await request(app)
        .get("/api/movies")
        .query({ limit: 5, skip: 0 })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeLessThanOrEqual(5);
    });
  });

  describe("PATCH /api/movies/:id - Update Single Movie", () => {
    test("should update a single movie", async () => {
      // Create a test movie
      const newMovie = {
        title: "Original Title",
        year: 2024,
        plot: "Original plot",
      };

      const createResponse = await request(app)
        .post("/api/movies")
        .send(newMovie)
        .expect(201);

      const movieId = createResponse.body.data._id.toString();
      testMovieIds.push(movieId);

      // Update the movie
      const updateData = {
        title: "Updated Title",
        plot: "Updated plot",
      };

      const response = await request(app)
        .patch(`/api/movies/${movieId}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.title).toBe("Updated Title");
      expect(response.body.data.plot).toBe("Updated plot");
      expect(response.body.data.year).toBe(2024); // Unchanged field
    });

    test("should return 404 for non-existent movie", async () => {
      const fakeId = new ObjectId().toString();

      const response = await request(app)
        .patch(`/api/movies/${fakeId}`)
        .send({ title: "Updated" })
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe("PATCH /api/movies - Update Multiple Movies", () => {
    test("should update multiple movies", async () => {
      // Create test movies
      const testMovies = [
        { title: "Movie 1", year: 2024, rated: "PG" },
        { title: "Movie 2", year: 2024, rated: "PG" },
        { title: "Movie 3", year: 2024, rated: "R" },
      ];

      const createdIds: string[] = [];
      for (const movie of testMovies) {
        const createResponse = await request(app)
          .post("/api/movies")
          .send(movie)
          .expect(201);
        createdIds.push(createResponse.body.data._id.toString());
        testMovieIds.push(createResponse.body.data._id.toString());
      }

      // Update all PG movies to PG-13
      const response = await request(app)
        .patch("/api/movies")
        .send({
          filter: { _id: { $in: createdIds }, rated: "PG" },
          update: { rated: "PG-13" },
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.modifiedCount).toBe(2);
    });
  });

  describe("DELETE /api/movies/:id - Delete Single Movie", () => {
    test("should delete a single movie", async () => {
      // Create a test movie
      const newMovie = {
        title: "Movie to Delete",
        year: 2024,
      };

      const createResponse = await request(app)
        .post("/api/movies")
        .send(newMovie)
        .expect(201);

      const movieId = createResponse.body.data._id.toString();
      testMovieIds.push(movieId);

      // Delete the movie
      const response = await request(app)
        .delete(`/api/movies/${movieId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.deletedCount).toBe(1);

      // Verify deletion - should return 404
      await request(app).get(`/api/movies/${movieId}`).expect(404);

      // Remove from tracking since it's successfully deleted
      testMovieIds = testMovieIds.filter((id) => id !== movieId);
    });

    test("should return 404 when deleting non-existent movie", async () => {
      const fakeId = new ObjectId().toString();

      const response = await request(app)
        .delete(`/api/movies/${fakeId}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe("DELETE /api/movies/:id/find-and-delete - Find and Delete", () => {
    test("should atomically find and delete a movie", async () => {
      // Create a test movie
      const newMovie = {
        title: "Find and Delete Test",
        year: 2024,
        plot: "Testing find and delete",
      };

      const createResponse = await request(app)
        .post("/api/movies")
        .send(newMovie)
        .expect(201);

      const movieId = createResponse.body.data._id.toString();
      testMovieIds.push(movieId);

      // Find and delete
      const response = await request(app)
        .delete(`/api/movies/${movieId}/find-and-delete`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data._id).toBe(movieId);
      expect(response.body.data.title).toBe(newMovie.title);

      // Verify deletion
      await request(app).get(`/api/movies/${movieId}`).expect(404);

      // Remove from tracking
      testMovieIds = testMovieIds.filter((id) => id !== movieId);
    });
  });

  describe("DELETE /api/movies - Delete Multiple Movies", () => {
    test("should delete multiple movies", async () => {
      // Create test movies
      const testMovies = [
        { title: "Delete Test 1", year: 2024 },
        { title: "Delete Test 2", year: 2024 },
        { title: "Delete Test 3", year: 2024 },
      ];

      const createdIds: string[] = [];
      for (const movie of testMovies) {
        const createResponse = await request(app)
          .post("/api/movies")
          .send(movie)
          .expect(201);
        createdIds.push(createResponse.body.data._id.toString());
        testMovieIds.push(createResponse.body.data._id.toString());
      }

      // Delete all test movies using filter
      const response = await request(app)
        .delete("/api/movies")
        .send({ filter: { _id: { $in: createdIds } } })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.deletedCount).toBe(3);

      // Verify deletion
      for (const id of createdIds) {
        await request(app).get(`/api/movies/${id}`).expect(404);
      }

      // Remove from tracking
      testMovieIds = testMovieIds.filter((id) => !createdIds.includes(id));
    });

    test("should return 400 when filter is missing", async () => {
      const response = await request(app)
        .delete("/api/movies")
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });
});


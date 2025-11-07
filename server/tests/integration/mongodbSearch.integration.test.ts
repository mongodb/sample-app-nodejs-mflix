/**
 * MongoDB Search API Integration Tests
 *
 * These tests verify the MongoDB Search API endpoints with actual HTTP requests.
 * The tests require:
 * - A MongoDB Atlas instance with Search enabled
 * - MONGODB_URI environment variable
 * - ENABLE_SEARCH_TESTS=true environment variable to enable tests
 * - movieSearchIndex must be configured in Atlas
 *
 * Note: These tests are disabled by default and should only be run against a test MongoDB Atlas instance.
 */

import request from "supertest";
import { app } from "../../src/app";
import { describeSearch } from "./setup";

describeSearch("MongoDB API Integration Tests", () => {

  describe("GET /api/movies/search - Search by plot", () => {
    test("should find movies with plot search", async () => {
      const response = await request(app)
        .get("/api/movies/search")
        .query({ plot: "detective mystery" })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.movies).toBeDefined();
      expect(Array.isArray(response.body.data.movies)).toBe(true);
      expect(response.body.data.totalCount).toBeDefined();
    });

    test("should return empty results when no movies match search query", async () => {
      const response = await request(app)
        .get("/api/movies/search")
        .query({ plot: "xyzabc123nonexistent" })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.movies).toBeDefined();
      expect(response.body.data.movies.length).toBe(0);
      expect(response.body.data.totalCount).toBe(0);
    });
  });

  describe("GET /api/movies/search - Search by directors", () => {
    test("should find movies by director name", async () => {
      const response = await request(app)
        .get("/api/movies/search")
        .query({ directors: "Spielberg" })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.movies).toBeDefined();
      expect(Array.isArray(response.body.data.movies)).toBe(true);
    });
  });

  describe("GET /api/movies/search - Search by cast", () => {
    test("should find movies by cast member", async () => {
      const response = await request(app)
        .get("/api/movies/search")
        .query({ cast: "Tom Hanks" })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.movies).toBeDefined();
      expect(Array.isArray(response.body.data.movies)).toBe(true);
    });
  });

  describe("GET /api/movies/search - Pagination", () => {
    test("should respect limit parameter", async () => {
      const response = await request(app)
        .get("/api/movies/search")
        .query({ plot: "adventure", limit: 5 })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.movies).toBeDefined();
      expect(response.body.data.movies.length).toBeLessThanOrEqual(5);
    });

    test("should support pagination with skip and limit", async () => {
      // Get first page
      const firstPage = await request(app)
        .get("/api/movies/search")
        .query({ plot: "adventure", limit: 5, skip: 0 })
        .expect(200);

      // Get second page
      const secondPage = await request(app)
        .get("/api/movies/search")
        .query({ plot: "adventure", limit: 5, skip: 5 })
        .expect(200);

      expect(firstPage.body.success).toBe(true);
      expect(secondPage.body.success).toBe(true);

      // If we have enough results, verify different pages
      if (
        firstPage.body.data.movies.length > 0 &&
        secondPage.body.data.movies.length > 0
      ) {
        const firstPageIds = firstPage.body.data.movies.map((m: any) => m._id);
        const secondPageIds = secondPage.body.data.movies.map((m: any) => m._id);

        // Verify no overlap between pages
        const hasOverlap = firstPageIds.some((id: string) =>
          secondPageIds.includes(id)
        );
        expect(hasOverlap).toBe(false);
      }
    });
  });

  describe("GET /api/movies/search - Search operators", () => {
    test("should support compound search with must operator", async () => {
      const response = await request(app)
        .get("/api/movies/search")
        .query({ plot: "detective", directors: "Nolan", searchOperator: "must" })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
    });

    test("should support compound search with should operator", async () => {
      const response = await request(app)
        .get("/api/movies/search")
        .query({
          plot: "adventure",
          cast: "Harrison Ford",
          searchOperator: "should",
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
    });
  });

  describe("GET /api/movies/search - Error handling", () => {
    test("should return 400 when no search parameters provided", async () => {
      const response = await request(app)
        .get("/api/movies/search")
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });

    test("should return 400 for invalid search operator", async () => {
      const response = await request(app)
        .get("/api/movies/search")
        .query({ plot: "adventure", searchOperator: "invalid" })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });
  });
});
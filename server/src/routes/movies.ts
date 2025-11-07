/**
 * Movies API Routes
 *
 * This module defines the routing endpoints for movie operations.
 *
 * Implemented operations:
 * - insertOne() - Create a single movie
 * - insertMany() - Create multiple movies
 * - findOne() - Get a single movie by ID
 * - find() - Get multiple movies with filtering and pagination
 * - updateOne() - Update a single movie
 * - updateMany() - Update multiple movies
 * - deleteOne() - Delete a single movie
 * - deleteMany() - Delete multiple movies
 * - findOneAndDelete() - Find and delete a movie in one operation
 */

import express from "express";
import { asyncHandler } from "../utils/errorHandler";
import * as movieController from "../controllers/movieController";

const router = express.Router();

/**
 * @swagger
 * /api/movies:
 *   get:
 *     summary: Get all movies
 *     description: Retrieves multiple movies with optional filtering, sorting, and pagination. Demonstrates the MongoDB find() operation.
 *     tags: [Movies]
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Text search query (searches title, plot, fullplot)
 *         example: shawshank
 *       - in: query
 *         name: genre
 *         schema:
 *           type: string
 *         description: Filter by genre
 *         example: Drama
 *       - in: query
 *         name: year
 *         schema:
 *           type: integer
 *         description: Filter by year
 *         example: 1994
 *       - in: query
 *         name: minRating
 *         schema:
 *           type: number
 *         description: Minimum IMDB rating
 *         example: 8.0
 *       - in: query
 *         name: maxRating
 *         schema:
 *           type: number
 *         description: Maximum IMDB rating
 *         example: 10.0
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *           maximum: 100
 *         description: Number of results to return
 *       - in: query
 *         name: skip
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Number of documents to skip for pagination
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           default: title
 *         description: Field to sort by
 *         example: year
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: asc
 *         description: Sort direction
 *     responses:
 *       200:
 *         description: List of movies
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         movies:
 *                           type: array
 *                           items:
 *                             $ref: '#/components/schemas/Movie'
 *                         count:
 *                           type: integer
 *                         limit:
 *                           type: integer
 *                         skip:
 *                           type: integer
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get("/", asyncHandler(movieController.getAllMovies));

/**
 * @swagger
 * /api/movies/search:
 *   get:
 *     summary: Search movies using MongoDB Search
 *     description: Search movies using MongoDB Search across multiple fields with compound queries and fuzzy matching. Demonstrates MongoDB Search capabilities.
 *     tags: [Movies]
 *     parameters:
 *       - in: query
 *         name: plot
 *         schema:
 *           type: string
 *         description: Search in plot field using phrase matching
 *         example: detective solving mystery
 *       - in: query
 *         name: fullplot
 *         schema:
 *           type: string
 *         description: Search in fullplot field using phrase matching
 *         example: crime investigation
 *       - in: query
 *         name: directors
 *         schema:
 *           type: string
 *         description: Search for directors with fuzzy matching
 *         example: Christopher Nolan
 *       - in: query
 *         name: writers
 *         schema:
 *           type: string
 *         description: Search for writers with fuzzy matching
 *         example: Quentin Tarantino
 *       - in: query
 *         name: cast
 *         schema:
 *           type: string
 *         description: Search for cast members with fuzzy matching
 *         example: Tom Hanks
 *       - in: query
 *         name: searchOperator
 *         schema:
 *           type: string
 *           enum: [must, should, mustNot, filter]
 *           default: must
 *         description: Search operator for compound queries
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *           maximum: 100
 *         description: Number of results to return
 *       - in: query
 *         name: skip
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Number of documents to skip for pagination
 *     responses:
 *       200:
 *         description: Search results
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         movies:
 *                           type: array
 *                           items:
 *                             $ref: '#/components/schemas/Movie'
 *                         count:
 *                           type: integer
 *                         limit:
 *                           type: integer
 *                         skip:
 *                           type: integer
 *       400:
 *         description: Bad request - invalid search operator or no search parameters provided
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get("/search", asyncHandler(movieController.searchMovies));

/**
 * @swagger
 * /api/movies/vector-search:
 *   get:
 *     summary: Search movies using MongoDB Vector Search
 *     description: Search movies using MongoDB Vector Search for semantic similarity. Demonstrates vector search using embeddings to find movies with similar plots. Requires VOYAGE_API_KEY to be configured.
 *     tags: [Movies]
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: Search query for semantic similarity
 *         example: space exploration and alien encounters
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *           maximum: 50
 *         description: Number of results to return
 *     responses:
 *       200:
 *         description: Vector search results with similarity scores
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         allOf:
 *                           - $ref: '#/components/schemas/Movie'
 *                           - type: object
 *                             properties:
 *                               score:
 *                                 type: number
 *                                 description: Vector similarity score
 *       400:
 *         description: Bad request - missing query parameter or VOYAGE_API_KEY not configured
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get("/vector-search", asyncHandler(movieController.vectorSearchMovies));

/**
 * @swagger
 * /api/movies/aggregations/reportingByComments:
 *   get:
 *     summary: Get movies with their most recent comments
 *     description: Aggregate movies with their most recent comments using MongoDB $lookup aggregation. Demonstrates joining collections and sorting by nested fields.
 *     tags: [Movies]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *           maximum: 50
 *         description: Number of recent comments to include per movie
 *       - in: query
 *         name: movieId
 *         schema:
 *           type: string
 *         description: Optional MongoDB ObjectId to filter for a specific movie
 *         example: 573a1390f29313caabcd4135
 *     responses:
 *       200:
 *         description: Movies with their most recent comments
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                           title:
 *                             type: string
 *                           year:
 *                             type: integer
 *                           genres:
 *                             type: array
 *                             items:
 *                               type: string
 *                           imdbRating:
 *                             type: number
 *                           recentComments:
 *                             type: array
 *                             items:
 *                               type: object
 *                               properties:
 *                                 _id:
 *                                   type: string
 *                                 userName:
 *                                   type: string
 *                                 userEmail:
 *                                   type: string
 *                                 text:
 *                                   type: string
 *                                 date:
 *                                   type: string
 *                                   format: date-time
 *       400:
 *         description: Invalid movie ID format
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get("/aggregations/reportingByComments", asyncHandler(movieController.getMoviesWithMostRecentComments));

/**
 * @swagger
 * /api/movies/aggregations/reportingByYear:
 *   get:
 *     summary: Get movie statistics by year
 *     description: Aggregate movies by year with statistics including count, average rating, highest/lowest ratings, and total votes. Demonstrates MongoDB $group aggregation for statistical calculations.
 *     tags: [Movies]
 *     responses:
 *       200:
 *         description: Movie statistics grouped by year
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           year:
 *                             type: integer
 *                             example: 1994
 *                           movieCount:
 *                             type: integer
 *                             example: 150
 *                           averageRating:
 *                             type: number
 *                             example: 7.25
 *                           highestRating:
 *                             type: number
 *                             example: 9.3
 *                           lowestRating:
 *                             type: number
 *                             example: 4.5
 *                           totalVotes:
 *                             type: integer
 *                             example: 1500000
 */
router.get("/aggregations/reportingByYear", asyncHandler(movieController.getMoviesByYearWithStats));

/**
 * @swagger
 * /api/movies/aggregations/reportingByDirectors:
 *   get:
 *     summary: Get directors with the most movies
 *     description: Aggregate directors with the most movies, including their movie count and average rating. Demonstrates MongoDB $unwind and $group for array aggregation.
 *     tags: [Movies]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *           maximum: 100
 *         description: Number of directors to return
 *     responses:
 *       200:
 *         description: Directors with the most movies
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           director:
 *                             type: string
 *                             example: Steven Spielberg
 *                           movieCount:
 *                             type: integer
 *                             example: 25
 *                           averageRating:
 *                             type: number
 *                             example: 7.85
 */
router.get("/aggregations/reportingByDirectors", asyncHandler(movieController.getDirectorsWithMostMovies));

/**
 * GET /api/movies/:id
 *
 * Retrieves a single movie by its ObjectId.
 * Demonstrates the findOne() operation.
 * @swagger
 * /api/movies/{id}:
 *   get:
 *     summary: Get a movie by ID
 *     description: Retrieves a single movie by its MongoDB ObjectId. Demonstrates the findOne() operation.
 *     tags: [Movies]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB ObjectId of the movie
 *         example: 573a1390f29313caabcd4135
 *     responses:
 *       200:
 *         description: Movie found
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Movie'
 *       400:
 *         description: Invalid ObjectId format
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Movie not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get("/:id", asyncHandler(movieController.getMovieById));

/**
 * @swagger
 * /api/movies:
 *   post:
 *     summary: Create a new movie
 *     description: Creates a single new movie document. Demonstrates the MongoDB insertOne() operation.
 *     tags: [Movies]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateMovieRequest'
 *     responses:
 *       201:
 *         description: Movie created successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         insertedId:
 *                           type: string
 *                           description: MongoDB ObjectId of the created movie
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post("/", asyncHandler(movieController.createMovie));

/**
 * @swagger
 * /api/movies/batch:
 *   post:
 *     summary: Create multiple movies
 *     description: Creates multiple movie documents in a single operation. Demonstrates the MongoDB insertMany() operation.
 *     tags: [Movies]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: array
 *             items:
 *               $ref: '#/components/schemas/CreateMovieRequest'
 *           example:
 *             - title: "Movie One"
 *               year: 2024
 *               genres: ["Action"]
 *             - title: "Movie Two"
 *               year: 2024
 *               genres: ["Drama"]
 *     responses:
 *       201:
 *         description: Movies created successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         insertedCount:
 *                           type: integer
 *                         insertedIds:
 *                           type: object
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post("/batch", asyncHandler(movieController.createMoviesBatch));

/**
 * @swagger
 * /api/movies/{id}:
 *   patch:
 *     summary: Update a movie
 *     description: Updates a single movie document by ID. Demonstrates the MongoDB updateOne() operation.
 *     tags: [Movies]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB ObjectId of the movie
 *         example: 573a1390f29313caabcd4135
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateMovieRequest'
 *           example:
 *             title: "Updated Movie Title"
 *             year: 2024
 *     responses:
 *       200:
 *         description: Movie updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         matchedCount:
 *                           type: integer
 *                         modifiedCount:
 *                           type: integer
 *       400:
 *         description: Invalid ObjectId or validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Movie not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.patch("/:id", asyncHandler(movieController.updateMovie));

/**
 * @swagger
 * /api/movies:
 *   patch:
 *     summary: Update multiple movies
 *     description: Updates multiple movies based on a filter. Demonstrates the MongoDB updateMany() operation.
 *     tags: [Movies]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - filter
 *               - update
 *             properties:
 *               filter:
 *                 type: object
 *                 description: MongoDB filter criteria
 *                 example:
 *                   year: 1994
 *               update:
 *                 type: object
 *                 description: Fields to update
 *                 example:
 *                   rated: "PG-13"
 *     responses:
 *       200:
 *         description: Movies updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         matchedCount:
 *                           type: integer
 *                         modifiedCount:
 *                           type: integer
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.patch("/", asyncHandler(movieController.updateMoviesBatch));

/**
 * @swagger
 * /api/movies/{id}/find-and-delete:
 *   delete:
 *     summary: Find and delete a movie
 *     description: Finds and deletes a movie in a single atomic operation. Demonstrates the MongoDB findOneAndDelete() operation.
 *     tags: [Movies]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB ObjectId of the movie
 *         example: 573a1390f29313caabcd4135
 *     responses:
 *       200:
 *         description: Movie found and deleted
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Movie'
 *       400:
 *         description: Invalid ObjectId format
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Movie not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.delete(
  "/:id/find-and-delete",
  asyncHandler(movieController.findAndDeleteMovie)
);

/**
 * @swagger
 * /api/movies/{id}:
 *   delete:
 *     summary: Delete a movie
 *     description: Deletes a single movie document by ID. Demonstrates the MongoDB deleteOne() operation.
 *     tags: [Movies]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB ObjectId of the movie
 *         example: 573a1390f29313caabcd4135
 *     responses:
 *       200:
 *         description: Movie deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         deletedCount:
 *                           type: integer
 *       400:
 *         description: Invalid ObjectId format
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Movie not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.delete("/:id", asyncHandler(movieController.deleteMovie));

/**
 * @swagger
 * /api/movies:
 *   delete:
 *     summary: Delete multiple movies
 *     description: Deletes multiple movies based on a filter. Demonstrates the MongoDB deleteMany() operation.
 *     tags: [Movies]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - filter
 *             properties:
 *               filter:
 *                 type: object
 *                 description: MongoDB filter criteria (cannot be empty to prevent accidental deletion of all documents)
 *                 example:
 *                   year: 1990
 *     responses:
 *       200:
 *         description: Movies deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         deletedCount:
 *                           type: integer
 *       400:
 *         description: Validation error (missing or empty filter)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.delete("/", asyncHandler(movieController.deleteMoviesBatch));

export default router;

/**
 * Movie Controller
 *
 * This file contains all the business logic for movie operations.
 * Each method demonstrates different MongoDB operations using the Node.js driver.
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

import { Request, Response } from "express";
import { ObjectId, Sort, Document } from "mongodb";
import { getCollection } from "../config/database";
import {
  createErrorResponse,
  createSuccessResponse,
  validateRequiredFields,
} from "../utils/errorHandler";
import {
  CreateMovieRequest,
  UpdateMovieRequest,
  RawSearchQuery,
  MovieFilter,
  VectorSearchResult,
  MovieWithCommentsResult,
  SearchMoviesResponse,
  RawMovieSearchQuery,
  SearchPhrase,
  AggregationComment,
  VoyageAIResponse,
} from "../types";

/**
 * GET /api/movies
 *
 * Retrieves multiple movies with optional filtering, sorting, and pagination.
 * Demonstrates the find() operation with various query options.
 *
 * Query parameters:
 * - q: Text search query (searches title, plot, fullplot)
 * - genre: Filter by genre
 * - year: Filter by year
 * - minRating: Minimum IMDB rating
 * - maxRating: Maximum IMDB rating
 * - limit: Number of results (default: 20, max: 100)
 * - skip: Number of documents to skip for pagination
 * - sortBy: Field to sort by (default: title)
 * - sortOrder: Sort direction - asc or desc (default: asc)
 */
export async function getAllMovies(req: Request, res: Response): Promise<void> {
  const moviesCollection = getCollection("movies");

  // Extract and validate query parameters
  const {
    q,
    genre,
    year,
    minRating,
    maxRating,
    limit = "20",
    skip = "0",
    sortBy = "title",
    sortOrder = "asc",
  }: RawSearchQuery = req.query;

  // Build MongoDB query filter
  // This demonstrates how to construct complex queries with multiple conditions
  const filter: MovieFilter = {};

  // Text search by using MongoDB's text index
  // This requires the text index we created in the database verification
  if (q) {
    filter.$text = { $search: q };
  }

  // Genre filtering
  if (genre) {
    filter.genres = { $regex: new RegExp(genre, "i") };
  }

  // Year filtering
  if (year) {
    filter.year = parseInt(year);
  }

  // Rating range filtering
  // Demonstrates nested field queries (imdb.rating)
  if (minRating || maxRating) {
    filter["imdb.rating"] = {};
    if (minRating) {
      filter["imdb.rating"].$gte = parseFloat(minRating);
    }
    if (maxRating) {
      filter["imdb.rating"].$lte = parseFloat(maxRating);
    }
  }

  // Parse and validate pagination parms for invalid inputs
  const limitNum = Math.min(
    Math.max(
      parseInt(limit) || 20, // Default to 20 if invalid
      1 // Min 1 result
    ),
    100 // Cap at 100 results for performance
  );
  const skipNum = Math.max(
    parseInt(skip) || 0, // Default to 0 if invalid
    0 // skip must be positive number
  );

  // Build sort object
  // Demonstrates dynamic sorting based on user input
  const sort: Sort = {
    [sortBy]: sortOrder === "desc" ? -1 : 1,
  };

  // Execute the find operation with all options
  const movies = await moviesCollection
    .find(filter)
    .sort(sort)
    .limit(limitNum)
    .skip(skipNum)
    .toArray();

  // Return successful response
  res.json(createSuccessResponse(movies, `Found ${movies.length} movies`));
}

/**
 * GET /api/movies/:id
 *
 * Retrieves a single movie by its ObjectId.
 * Demonstrates the findOne() operation.
 */
export async function getMovieById(req: Request, res: Response): Promise<void> {
  const { id } = req.params;

  // Validate ObjectId format
  if (!ObjectId.isValid(id)) {
    res
      .status(400)
      .json(
        createErrorResponse("Invalid movie ID format", "INVALID_OBJECT_ID")
      );
    return;
  }

  const moviesCollection = getCollection("movies");

  // Use findOne() to get a single document by _id
  const movie = await moviesCollection.findOne({ _id: new ObjectId(id) });

  if (!movie) {
    res
      .status(404)
      .json(createErrorResponse("Movie not found", "MOVIE_NOT_FOUND"));
    return;
  }

  res.json(createSuccessResponse(movie, "Movie retrieved successfully"));
}

/**
 * POST /api/movies
 *
 * Creates a single new movie document.
 * Demonstrates the insertOne() operation.
 */
export async function createMovie(req: Request, res: Response): Promise<void> {
  const movieData: CreateMovieRequest = req.body;

  // Validate required fields
  // The title field is the minimum requirement for a movie
  validateRequiredFields(movieData, ["title"]);

  const moviesCollection = getCollection("movies");

  // Use insertOne() to create a single document
  // This operation returns information about the insertion including the new _id
  const result = await moviesCollection.insertOne(movieData);

  if (!result.acknowledged) {
    throw new Error("Movie insertion was not acknowledged by the database");
  }

  // Retrieve the created document to return complete data
  const createdMovie = await moviesCollection.findOne({
    _id: result.insertedId,
  });

  res
    .status(201)
    .json(
      createSuccessResponse(
        createdMovie,
        `Movie '${movieData.title}' created successfully`
      )
    );
}

/**
 * POST /api/movies/batch
 *
 * Creates multiple movie documents in a single operation.
 * Demonstrates the insertMany() operation.
 */
export async function createMoviesBatch(
  req: Request,
  res: Response
): Promise<void> {
  const moviesData: CreateMovieRequest[] = req.body;

  // Validate that we have an array of movies
  if (!Array.isArray(moviesData) || moviesData.length === 0) {
    res
      .status(400)
      .json(
        createErrorResponse(
          "Request body must be a non-empty array of movie objects",
          "INVALID_INPUT"
        )
      );
    return;
  }

  // Validate each movie has required fields
  moviesData.forEach((movie, index) => {
    try {
      validateRequiredFields(movie, ["title"]);
    } catch (error) {
      throw new Error(
        `Movie at index ${index}: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  });

  const moviesCollection = getCollection("movies");

  // Use insertMany() to create multiple documents
  const result = await moviesCollection.insertMany(moviesData);

  if (!result.acknowledged) {
    throw new Error(
      "Batch movie insertion was not acknowledged by the database"
    );
  }

  res.status(201).json(
    createSuccessResponse(
      {
        insertedCount: result.insertedCount,
        insertedIds: result.insertedIds,
      },
      `Successfully created ${result.insertedCount} movies`
    )
  );
}

/**
 * PATCH /api/movies/:id
 *
 * Updates a single movie document.
 * Demonstrates the updateOne() operation.
 */
export async function updateMovie(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const updateData: UpdateMovieRequest = req.body;

  // Validate ObjectId format
  if (!ObjectId.isValid(id)) {
    res
      .status(400)
      .json(
        createErrorResponse("Invalid movie ID format", "INVALID_OBJECT_ID")
      );
    return;
  }

  // Ensure we have something to update
  if (Object.keys(updateData).length === 0) {
    res
      .status(400)
      .json(createErrorResponse("No update data provided", "NO_UPDATE_DATA"));
    return;
  }

  const moviesCollection = getCollection("movies");

  // Use updateOne() to update a single document
  // $set operator replaces the value of fields with specified values
  const result = await moviesCollection.updateOne(
    { _id: new ObjectId(id) },
    { $set: updateData }
  );

  if (result.matchedCount === 0) {
    res
      .status(404)
      .json(createErrorResponse("Movie not found", "MOVIE_NOT_FOUND"));
    return;
  }

  // Retrieve the updated document to return complete data
  const updatedMovie = await moviesCollection.findOne({
    _id: new ObjectId(id),
  });

  res.json(
    createSuccessResponse(
      updatedMovie,
      `Movie updated successfully. Modified ${result.modifiedCount} field(s).`
    )
  );
}

/**
 * PATCH /api/movies
 *
 * Updates multiple movies based on a filter.
 * Demonstrates the updateMany() operation.
 */
export async function updateMoviesBatch(
  req: Request,
  res: Response
): Promise<void> {
  const { filter, update } = req.body;

  // Validate input
  if (!filter || !update) {
    res
      .status(400)
      .json(
        createErrorResponse(
          "Both filter and update objects are required",
          "MISSING_REQUIRED_FIELDS"
        )
      );
    return;
  }

  if (Object.keys(update).length === 0) {
    res
      .status(400)
      .json(
        createErrorResponse("Update object cannot be empty", "EMPTY_UPDATE")
      );
    return;
  }

  const moviesCollection = getCollection("movies");

  // Handle ObjectId conversion for _id fields in $in queries
  let processedFilter = { ...filter };
  if (filter._id && filter._id.$in && Array.isArray(filter._id.$in)) {
    // Convert string IDs to ObjectId instances
    processedFilter._id = {
      $in: filter._id.$in.map((id: string) => {
        if (ObjectId.isValid(id)) {
          return new ObjectId(id);
        }
        throw new Error(`Invalid ObjectId: ${id}`);
      })
    };
  }

  // Use updateMany() to update multiple documents
  // This is useful for bulk operations like updating all movies from a certain year
  const result = await moviesCollection.updateMany(processedFilter, { $set: update });

  res.json(
    createSuccessResponse(
      {
        matchedCount: result.matchedCount,
        modifiedCount: result.modifiedCount,
      },
      `Update operation completed. Matched ${result.matchedCount} documents, modified ${result.modifiedCount} documents.`
    )
  );
}

/**
 * DELETE /api/movies/:id
 *
 * Deletes a single movie document.
 * Demonstrates the deleteOne() operation.
 */
export async function deleteMovie(req: Request, res: Response): Promise<void> {
  const { id } = req.params;

  // Validate ObjectId format
  if (!ObjectId.isValid(id)) {
    res
      .status(400)
      .json(
        createErrorResponse("Invalid movie ID format", "INVALID_OBJECT_ID")
      );
    return;
  }

  const moviesCollection = getCollection("movies");

  // Use deleteOne() to remove a single document
  const result = await moviesCollection.deleteOne({ _id: new ObjectId(id) });

  if (result.deletedCount === 0) {
    res
      .status(404)
      .json(createErrorResponse("Movie not found", "MOVIE_NOT_FOUND"));
    return;
  }

  res.json(
    createSuccessResponse(
      { deletedCount: result.deletedCount },
      "Movie deleted successfully"
    )
  );
}

/**
 * DELETE /api/movies
 *
 * Deletes multiple movies based on a filter.
 * Demonstrates the deleteMany() operation.
 */
export async function deleteMoviesBatch(
  req: Request,
  res: Response
): Promise<void> {
  const { filter } = req.body;

  // Validate input
  if (!filter || Object.keys(filter).length === 0) {
    res
      .status(400)
      .json(
        createErrorResponse(
          "Filter object is required and cannot be empty. This prevents accidental deletion of all documents.",
          "MISSING_FILTER"
        )
      );
    return;
  }

  const moviesCollection = getCollection("movies");

  // Handle ObjectId conversion for _id fields in $in queries
  let processedFilter = { ...filter };
  if (filter._id && filter._id.$in && Array.isArray(filter._id.$in)) {
    // Convert string IDs to ObjectId instances
    processedFilter._id = {
      $in: filter._id.$in.map((id: string) => {
        if (ObjectId.isValid(id)) {
          return new ObjectId(id);
        }
        throw new Error(`Invalid ObjectId: ${id}`);
      })
    };
  }

  // Use deleteMany() to remove multiple documents
  // This operation is useful for cleanup tasks like removing all movies from a certain year
  const result = await moviesCollection.deleteMany(processedFilter);

  res.json(
    createSuccessResponse(
      { deletedCount: result.deletedCount },
      `Delete operation completed. Removed ${result.deletedCount} documents.`
    )
  );
}

/**
 * DELETE /api/movies/:id/find-and-delete
 *
 * Finds and deletes a movie in a single atomic operation.
 * Demonstrates the findOneAndDelete() operation.
 */
export async function findAndDeleteMovie(
  req: Request,
  res: Response
): Promise<void> {
  const { id } = req.params;

  // Validate ObjectId format
  if (!ObjectId.isValid(id)) {
    res
      .status(400)
      .json(
        createErrorResponse("Invalid movie ID format", "INVALID_OBJECT_ID")
      );
    return;
  }

  const moviesCollection = getCollection("movies");

  // Use findOneAndDelete() to find and delete in a single atomic operation
  // This is useful when you need to return the deleted document
  // or ensure the document exists before deletion
  const deletedMovie = await moviesCollection.findOneAndDelete({
    _id: new ObjectId(id),
  });

  if (!deletedMovie) {
    res
      .status(404)
      .json(createErrorResponse("Movie not found", "MOVIE_NOT_FOUND"));
    return;
  }

  res.json(
    createSuccessResponse(deletedMovie, "Movie found and deleted successfully")
  );
}

/**
 * GET /api/movies/search
 *
 * Search movies using MongoDB Search across multiple fields.
 * Demonstrates MongoDB Search with compound queries.
 */
export async function searchMovies(req: Request, res: Response): Promise<void> {
  const moviesCollection = getCollection("movies");

  const {
    plot,
    fullplot,
    directors,
    writers,
    cast,
    limit = "20",
    skip = "0",
    searchOperator = "must",
  }: RawMovieSearchQuery = req.query;

  // Validate search operator
  const validOperators = ["must", "should", "mustNot", "filter"];
  if (!validOperators.includes(searchOperator)) {
    res
      .status(400)
      .json(
        createErrorResponse(
          `Invalid search_operator '${searchOperator}'. Must be one of: ${validOperators.join(", ")}`,
          "INVALID_SEARCH_OPERATOR"
        )
      );
    return;
  }

  // Build search phrases array
  const searchPhrases: SearchPhrase[] = [];

  if (plot) {
    searchPhrases.push({
      phrase: {
        query: plot,
        path: "plot",
      },
    });
  }

  if (fullplot) {
    searchPhrases.push({
      phrase: {
        query: fullplot,
        path: "fullplot",
      },
    });
  }

  if (directors) {
    searchPhrases.push({
      text: {
        query: directors,
        path: "directors",
        fuzzy: { maxEdits: 1, prefixLength: 5 },
      },
    });
  }

  if (writers) {
    searchPhrases.push({
      text: {
        query: writers,
        path: "writers",
        fuzzy: { maxEdits: 1, prefixLength: 5 },
      },
    });
  }

  if (cast) {
    searchPhrases.push({
      text: {
        query: cast,
        path: "cast",
        fuzzy: { maxEdits: 1, prefixLength: 5 },
      },
    });
  }

  if (searchPhrases.length === 0) {
    res
      .status(400)
      .json(
        createErrorResponse(
          "At least one search parameter must be provided",
          "NO_SEARCH_PARAMETERS"
        )
      );
    return;
  }

  // Parse pagination parameters
  const limitNum = Math.min(Math.max(parseInt(limit) || 20, 1), 100);
  const skipNum = Math.max(parseInt(skip) || 0, 0);

  // Build aggregation pipeline
  const pipeline = [
    {
      $search: {
        index: "movieSearchIndex",
        compound: {
          [searchOperator]: searchPhrases,
        },
      },
    },
    {
      $facet: {
        totalCount: [{ $count: "count" }],
        results: [
          { $skip: skipNum },
          { $limit: limitNum },
          {
            $project: {
              _id: 1,
              title: 1,
              year: 1,
              plot: 1,
              fullplot: 1,
              released: 1,
              runtime: 1,
              poster: 1,
              genres: 1,
              directors: 1,
              writers: 1,
              cast: 1,
              countries: 1,
              languages: 1,
              rated: 1,
              awards: 1,
              imdb: 1,
            },
          },
        ],
      },
    },
  ];

  const results = await moviesCollection.aggregate(pipeline).toArray();
  const facetResult = results[0] || {};
  const totalCount = facetResult.totalCount?.[0]?.count || 0;
  const movies = facetResult.results || [];

  const response: SearchMoviesResponse = {
    movies,
    totalCount,
  };

  res.json(
    createSuccessResponse(
      response,
      `Found ${totalCount} movies matching the search criteria`
    )
  );
}

/**
 * GET /api/movies/vector-search
 *
 * Search movies using MongoDB Vector Search for semantic similarity.
 * Demonstrates vector search using embeddings to find similar plots.
 */
export async function vectorSearchMovies(req: Request, res: Response): Promise<void> {
  const { q, limit = "10" } = req.query;

  // Validate query parameter
  if (!q || typeof q !== "string" || q.trim().length === 0) {
    res
      .status(400)
      .json(
        createErrorResponse(
          "Search query is required",
          "MISSING_QUERY_PARAMETER"
        )
      );
    return;
  }

  // Check if Voyage AI API key is configured
  if (!process.env.VOYAGE_API_KEY || process.env.VOYAGE_API_KEY.trim().length === 0) {
    res
      .status(400)
      .json(
        createErrorResponse(
          "Vector search unavailable: VOYAGE_API_KEY not configured. Please add your API key to the .env file",
          "SERVICE_UNAVAILABLE"
        )
      );
    return;
  }

  // Validate and set limit (default: 20, min: 1, max: 50)
  const limitNum = Math.min(Math.max(parseInt(limit as string) || 20, 1), 50);

  try {
    // Generate embedding using Voyage AI REST API
    const queryVector = await generateVoyageEmbedding(q.trim(), process.env.VOYAGE_API_KEY);

    // Get embedded movies collection for vector search
    const embeddedMoviesCollection = getCollection("embedded_movies");

    // Step 1: Build the $vectorSearch aggregation pipeline for embedded_movies
    const vectorSearchPipeline = [
      {
        $vectorSearch: {
          index: "vector_index",
          path: "plot_embedding_voyage_3_large",
          queryVector: queryVector,
          numCandidates: limitNum * 20, // We recommend searching 20 times higher than the limit to improve result relevance
          limit: limitNum,
        },
      },
      {
        $project: {
          _id: 1,
          score: { $meta: "vectorSearchScore" },
        },
      },
    ];

    // Execute vector search to get movie IDs and scores
    const vectorResults = await embeddedMoviesCollection.aggregate(vectorSearchPipeline).toArray();

    if (vectorResults.length === 0) {
      res.json(
        createSuccessResponse(
          [],
          `No similar movies found for query: '${q}'`
        )
      );
      return;
    }

    // Extract movie IDs and create score mapping
    const movieIds = vectorResults.map(doc => doc._id);
    const scoreMap = new Map();
    vectorResults.forEach(doc => {
      scoreMap.set(doc._id.toString(), doc.score);
    });

    // Step 2: Fetch complete movie data from the movies collection
    const moviesCollection = getCollection("movies");
    
    // Build aggregation pipeline to safely handle year field and get complete movie data
    const moviesPipeline = [
      {
        $match: {
          _id: { $in: movieIds }
        }
      },
      {
        $project: {
          _id: 1,
          title: 1,
          plot: 1,
          poster: 1,
          genres: 1,
          directors: 1,
          cast: 1,
          // Safely convert year to integer, handling strings and dirty data
          year: {
            $cond: {
              if: {
                $and: [
                  { $ne: ["$year", null] },
                  { $eq: [{ $type: "$year" }, "int"] }
                ]
              },
              then: "$year",
              else: null
            }
          }
        }
      }
    ];

    const movieResults = await moviesCollection.aggregate(moviesPipeline).toArray();

    // Step 3: Combine movie data with vector search scores
    const finalResults: VectorSearchResult[] = movieResults.map(movie => {
      const movieIdStr = movie._id.toString();
      const score = scoreMap.get(movieIdStr) || 0;

      return {
        _id: movieIdStr,
        title: movie.title || '',
        plot: movie.plot,
        poster: movie.poster,
        year: movie.year,
        genres: movie.genres || [],
        directors: movie.directors || [],
        cast: movie.cast || [],
        score: score,
      };
    });

    // Sort results by score (highest first) to maintain relevance order
    finalResults.sort((a, b) => b.score - a.score);

    res.json(
      createSuccessResponse(
        finalResults,
        `Found ${finalResults.length} similar movies for query: '${q}'`
      )
    );
  } catch (error) {
    console.error("Vector search error:", error);
    res
      .status(500)
      .json(
        createErrorResponse(
          "Error performing vector search",
          "VECTOR_SEARCH_ERROR",
          error instanceof Error ? error.message : "Unknown error"
        )
      );
  }
}

/**
 * GET /api/movies/aggregations/reportingByComments
 *
 * Aggregate movies with their most recent comments.
 * Demonstrates MongoDB $lookup aggregation to join collections.
 */
export async function getMoviesWithMostRecentComments(
  req: Request,
  res: Response
): Promise<void> {
  const moviesCollection = getCollection("movies");
  const { limit = "10", movieId } = req.query;

  const limitNum = Math.min(Math.max(parseInt(limit as string) || 10, 1), 50);

  // Build aggregation pipeline
  const pipeline: Document[] = [
    // STAGE 1: Initial filter for data quality - filters bad data in
    // the collection
    {
      $match: {
        year: { $type: "number", $gte: 1800, $lte: 2030 },
      },
    },
  ];

  // Add movie ID filter if provided
  if (movieId && typeof movieId === "string") {
    if (!ObjectId.isValid(movieId)) {
      res
        .status(400)
        .json(
          createErrorResponse("Invalid movie ID format", "INVALID_OBJECT_ID")
        );
      return;
    }
    pipeline[0].$match._id = new ObjectId(movieId);
  }

  // Add remaining pipeline stages
  pipeline.push(
    // STAGE 2: Join with comments collection
    {
      $lookup: {
        from: "comments",
        localField: "_id",
        foreignField: "movie_id",
        as: "comments",
      },
    },
    // STAGE 3: Filter movies with at least one comment
    {
      $match: {
        comments: { $ne: [] },
      },
    },
    // STAGE 4: Add computed fields
    {
      $addFields: {
        recentComments: {
          $slice: [
            {
              $sortArray: {
                input: "$comments",
                sortBy: { date: -1 },
              },
            },
            limitNum,
          ],
        },
        mostRecentCommentDate: {
          $max: "$comments.date",
        },
      },
    },
    // STAGE 5: Sort by most recent comment date
    {
      $sort: { mostRecentCommentDate: -1 },
    },
    // STAGE 6: Limit results
    {
      $limit: movieId ? 50 : 20,
    },
    // STAGE 7: Shape final output
    {
      $project: {
        title: 1,
        year: 1,
        genres: 1,
        _id: 1,
        imdbRating: "$imdb.rating",
        recentComments: {
          $map: {
            input: "$recentComments",
            as: "comment",
            in: {
              _id: "$$comment._id",
              userName: "$$comment.name",
              userEmail: "$$comment.email",
              text: "$$comment.text",
              date: "$$comment.date",
            },
          },
        },
        totalComments: { $size: "$comments" },
      },
    }
  );

  const results = await moviesCollection.aggregate(pipeline).toArray();

  // Convert ObjectId to string for response
  const processedResults: MovieWithCommentsResult[] = results.map((result) => ({
    _id: result._id.toString(),
    title: result.title,
    year: result.year,
    genres: result.genres,
    imdbRating: result.imdbRating,
    recentComments: result.recentComments.map((comment: AggregationComment) => ({
      _id: comment._id?.toString(),
      userName: comment.userName,
      userEmail: comment.userEmail,
      text: comment.text,
      date: comment.date,
    })),
    totalComments: result.totalComments,
  }));

  // Calculate total comments across all movies
  const totalComments = processedResults.reduce(
    (sum, result) => sum + (result.totalComments || 0),
    0
  );

  const message = movieId
    ? `Found ${totalComments} comments from movie`
    : `Found ${totalComments} comments from ${processedResults.length} movie${
        processedResults.length !== 1 ? "s" : ""
      }`;

  res.json(createSuccessResponse(processedResults, message));
}

/**
 * GET /api/movies/aggregations/reportingByYear
 *
 * Aggregate movies by year with statistics.
 * Demonstrates MongoDB $group aggregation for statistical calculations.
 */
export async function getMoviesByYearWithStats(
  req: Request,
  res: Response
): Promise<void> {
  const moviesCollection = getCollection("movies");

  const pipeline = [
    // STAGE 1: Data quality filter
    {
      $match: {
        year: { $type: "number", $gte: 1800, $lte: 2030 },
      },
    },
    // STAGE 2: Group by year and calculate statistics
    {
      $group: {
        _id: "$year",
        movieCount: { $sum: 1 },
        averageRating: {
          $avg: {
            $cond: [
              {
                $and: [
                  { $ne: ["$imdb.rating", null] },
                  { $ne: ["$imdb.rating", ""] },
                  { $eq: [{ $type: "$imdb.rating" }, "double"] },
                ],
              },
              "$imdb.rating",
              "$$REMOVE",
            ],
          },
        },
        highestRating: {
          $max: {
            $cond: [
              {
                $and: [
                  { $ne: ["$imdb.rating", null] },
                  { $ne: ["$imdb.rating", ""] },
                  { $eq: [{ $type: "$imdb.rating" }, "double"] },
                ],
              },
              "$imdb.rating",
              "$$REMOVE",
            ],
          },
        },
        lowestRating: {
          $min: {
            $cond: [
              {
                $and: [
                  { $ne: ["$imdb.rating", null] },
                  { $ne: ["$imdb.rating", ""] },
                  { $eq: [{ $type: "$imdb.rating" }, "double"] },
                ],
              },
              "$imdb.rating",
              "$$REMOVE",
            ],
          },
        },
        totalVotes: { $sum: "$imdb.votes" },
      },
    },
    // STAGE 3: Shape final output
    {
      $project: {
        year: "$_id",
        movieCount: 1,
        averageRating: { $round: ["$averageRating", 2] },
        highestRating: 1,
        lowestRating: 1,
        totalVotes: 1,
        _id: 0,
      },
    },
    // STAGE 4: Sort by year (newest first)
    {
      $sort: { year: -1 },
    },
  ];

  const results = await moviesCollection.aggregate(pipeline).toArray();

  res.json(
    createSuccessResponse(
      results,
      `Aggregated statistics for ${results.length} years`
    )
  );
}

/**
 * GET /api/movies/aggregations/reportingByDirectors
 *
 * Aggregate directors with the most movies.
 * Demonstrates MongoDB $unwind and $group for array aggregation.
 */
export async function getDirectorsWithMostMovies(
  req: Request,
  res: Response
): Promise<void> {
  const moviesCollection = getCollection("movies");
  const { limit = "20" } = req.query;

  const limitNum = Math.min(Math.max(parseInt(limit as string) || 20, 1), 100);

  const pipeline = [
    // STAGE 1: Data quality filter
    {
      $match: {
        directors: { $exists: true, $ne: null, $not: { $eq: [] } },
        year: { $type: "number", $gte: 1800, $lte: 2030 },
      },
    },
    // STAGE 2: Unwind directors array
    {
      $unwind: "$directors",
    },
    // STAGE 3: Clean director names
    {
      $match: {
        directors: { $nin: [null, ""] },
      },
    },
    // STAGE 4: Group by director
    {
      $group: {
        _id: "$directors",
        movieCount: { $sum: 1 },
        averageRating: { $avg: "$imdb.rating" },
      },
    },
    // STAGE 5: Sort by movie count
    {
      $sort: { movieCount: -1 },
    },
    // STAGE 6: Limit results
    {
      $limit: limitNum,
    },
    // STAGE 7: Shape final output
    {
      $project: {
        director: "$_id",
        movieCount: 1,
        averageRating: { $round: ["$averageRating", 2] },
        _id: 0,
      },
    },
  ];

  const results = await moviesCollection.aggregate(pipeline).toArray();

  res.json(
    createSuccessResponse(
      results,
      `Found ${results.length} directors with most movies`
    )
  );
}

/**
 * Generates a vector embedding using the Voyage AI REST API.
 * 
 * This function calls the Voyage AI API directly to generate embeddings with 2048 dimensions.
 * The voyage-3-large model supports multiple dimensions (256, 512, 1024, 2048), and we explicitly
 * request 2048 to match the vector search index configuration.
 * 
 * @param text The text to generate an embedding for
 * @param apiKey The Voyage AI API key
 * @returns Promise<number[]> representing the embedding vector
 */
async function generateVoyageEmbedding(text: string, apiKey: string): Promise<number[]> {
  // Build the request body with output_dimension set to 2048
  const requestBody = {
    input: [text],
    model: "voyage-3-large",
    output_dimension: 2048,
    input_type: "query"
  };

  try {
    const response = await fetch("https://api.voyageai.com/v1/embeddings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Voyage AI API returned status ${response.status}: ${errorText}`);
    }

    const data = await response.json() as VoyageAIResponse;
    
    // Extract the embedding from the response
    if (!data.data || !data.data[0] || !data.data[0].embedding) {
      throw new Error("Invalid response format from Voyage AI API");
    }

    return data.data[0].embedding;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to generate embedding: ${error.message}`);
    }
    throw new Error("Failed to generate embedding: Unknown error");
  }
}

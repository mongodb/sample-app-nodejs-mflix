/**
 * Swagger/OpenAPI Configuration
 *
 * This module configures swagger-jsdoc to generate OpenAPI documentation
 * from JSDoc comments in the codebase.
 */

import swaggerJsdoc from "swagger-jsdoc";

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "MongoDB Sample MFlix API",
      version: "1.0.0",
      description:
        "Express.js backend demonstrating MongoDB operations with the sample_mflix dataset. " +
        "This API provides CRUD operations for movies, including text search, filtering, pagination, and batch operations.",
      contact: {
        name: "API Support",
      },
      license: {
        name: "Apache 2.0",
        url: "https://www.apache.org/licenses/LICENSE-2.0.html",
      },
    },
    servers: [
      {
        url: "http://localhost:3001",
        description: "Development server",
      },
    ],
    tags: [
      {
        name: "Movies",
        description: "Movie CRUD operations and queries",
      },
      {
        name: "Info",
        description: "API information",
      },
    ],
    components: {
      schemas: {
        Movie: {
          type: "object",
          required: ["title"],
          properties: {
            _id: {
              type: "string",
              description: "MongoDB ObjectId",
              example: "573a1390f29313caabcd4135",
            },
            title: {
              type: "string",
              description: "Movie title",
              example: "The Shawshank Redemption",
            },
            year: {
              type: "integer",
              description: "Release year",
              example: 1994,
            },
            plot: {
              type: "string",
              description: "Short plot summary",
              example: "Two imprisoned men bond over a number of years...",
            },
            fullplot: {
              type: "string",
              description: "Full plot description",
            },
            runtime: {
              type: "integer",
              description: "Runtime in minutes",
              example: 142,
            },
            poster: {
              type: "string",
              description: "URL to movie poster",
            },
            genres: {
              type: "array",
              items: {
                type: "string",
              },
              description: "Movie genres",
              example: ["Drama"],
            },
            directors: {
              type: "array",
              items: {
                type: "string",
              },
              description: "Movie directors",
              example: ["Frank Darabont"],
            },
            writers: {
              type: "array",
              items: {
                type: "string",
              },
              description: "Movie writers",
            },
            cast: {
              type: "array",
              items: {
                type: "string",
              },
              description: "Movie cast",
              example: ["Tim Robbins", "Morgan Freeman"],
            },
            countries: {
              type: "array",
              items: {
                type: "string",
              },
              description: "Countries of origin",
              example: ["USA"],
            },
            languages: {
              type: "array",
              items: {
                type: "string",
              },
              description: "Languages",
              example: ["English"],
            },
            rated: {
              type: "string",
              description: "MPAA rating",
              example: "R",
            },
            awards: {
              type: "object",
              properties: {
                wins: {
                  type: "integer",
                  example: 21,
                },
                nominations: {
                  type: "integer",
                  example: 42,
                },
                text: {
                  type: "string",
                  example: "Nominated for 7 Oscars. Another 21 wins & 42 nominations.",
                },
              },
            },
            imdb: {
              type: "object",
              properties: {
                rating: {
                  type: "number",
                  format: "float",
                  example: 9.3,
                },
                votes: {
                  type: "integer",
                  example: 2343110,
                },
                id: {
                  type: "integer",
                  example: 111161,
                },
              },
            },
            tomatoes: {
              type: "object",
              properties: {
                viewer: {
                  type: "object",
                  properties: {
                    rating: {
                      type: "number",
                      format: "float",
                    },
                    numReviews: {
                      type: "integer",
                    },
                    meter: {
                      type: "integer",
                    },
                  },
                },
                critic: {
                  type: "object",
                  properties: {
                    rating: {
                      type: "number",
                      format: "float",
                    },
                    numReviews: {
                      type: "integer",
                    },
                    meter: {
                      type: "integer",
                    },
                  },
                },
              },
            },
            metacritic: {
              type: "integer",
              example: 80,
            },
            type: {
              type: "string",
              example: "movie",
            },
          },
        },
        CreateMovieRequest: {
          type: "object",
          required: ["title"],
          properties: {
            title: {
              type: "string",
              description: "Movie title (required)",
              example: "My New Movie",
            },
            year: {
              type: "integer",
              example: 2024,
            },
            plot: {
              type: "string",
              example: "An exciting new film...",
            },
            fullplot: {
              type: "string",
            },
            genres: {
              type: "array",
              items: {
                type: "string",
              },
              example: ["Action", "Adventure"],
            },
            directors: {
              type: "array",
              items: {
                type: "string",
              },
              example: ["Jane Director"],
            },
            writers: {
              type: "array",
              items: {
                type: "string",
              },
            },
            cast: {
              type: "array",
              items: {
                type: "string",
              },
            },
            countries: {
              type: "array",
              items: {
                type: "string",
              },
            },
            languages: {
              type: "array",
              items: {
                type: "string",
              },
            },
            rated: {
              type: "string",
            },
            runtime: {
              type: "integer",
            },
            poster: {
              type: "string",
            },
          },
        },
        UpdateMovieRequest: {
          type: "object",
          properties: {
            title: {
              type: "string",
            },
            year: {
              type: "integer",
            },
            plot: {
              type: "string",
            },
            genres: {
              type: "array",
              items: {
                type: "string",
              },
            },
          },
          description: "All fields are optional for partial updates",
        },
        SuccessResponse: {
          type: "object",
          properties: {
            success: {
              type: "boolean",
              example: true,
            },
            message: {
              type: "string",
              example: "Operation completed successfully",
            },
            data: {
              type: "object",
              description: "Response data (varies by endpoint)",
            },
          },
        },
        ErrorResponse: {
          type: "object",
          properties: {
            success: {
              type: "boolean",
              example: false,
            },
            error: {
              type: "object",
              properties: {
                message: {
                  type: "string",
                  example: "An error occurred",
                },
                code: {
                  type: "string",
                  example: "ERROR_CODE",
                },
                details: {
                  type: "string",
                },
              },
            },
          },
        },
      },
    },
  },
  // Path to the API routes files where JSDoc comments are located
  apis: ["./src/routes/*.ts", "./src/app.ts"],
};

export const swaggerSpec = swaggerJsdoc(options);


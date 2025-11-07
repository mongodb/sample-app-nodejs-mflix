/**
 * Database Configuration and Connection Management
 *
 * This module handles MongoDB connection setup using the Node.js driver
 * and implements pre-flight checks to ensure the application has all
 * necessary indexes and sample data.
 */

import { MongoClient, Db, Collection, Document } from "mongodb";

let client: MongoClient;
let database: Db;

async function _connectToDatabase(): Promise<Db> {
  // Return existing connection if already established
  // This prevents creating multiple connections unnecessarily
  if (database) {
    return database;
  }

  // Retrieve MongoDB connection string from environment variables
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error(
      "MONGODB_URI environment variable is not defined. Please check your .env file and ensure it contains a valid MongoDB connection string."
    );
  }

  try {
    // Create new MongoDB client instance
    client = new MongoClient(uri);

    // Connect to MongoDB
    await client.connect();

    // Get reference to the sample_mflix database
    database = client.db("sample_mflix");

    console.log(`Connected to database: ${database.databaseName}`);

    return database;
  } catch (error) {
    throw error;
  }
}

let connect$: Promise<Db>;
/**
 * Establishes connection to MongoDB by using the connection string from environment variables
 *
 * @returns Promise<Db> - The connected database instance
 * @throws Error if connection fails or if MONGODB_URI is not provided
 */
export async function connectToDatabase(): Promise<Db> {
  // connect$ only gets assigned exactly once on the first request, ensuring all subsequent requests use the same connect$ promise.
  connect$ ??= _connectToDatabase();
  return await connect$;
}

/**
 * Gets a reference to a specific collection in the database
 *
 * @param collectionName - Name of the collection to access
 * @returns Collection instance
 * @throws Error if database is not connected
 */
export function getCollection<T extends Document>(
  collectionName: string
): Collection<T> {
  if (!database) {
    throw new Error("Database not connected.");
  }

  return database.collection(collectionName);
}

/**
 * Closes the database connection
 * This should be called when the application is shutting down
 */
export async function closeDatabaseConnection(): Promise<void> {
  if (client) {
    await client.close();
    console.log("Database connection closed");
  }
}

/**
 * Verifies that all required indexes exist and sample data is present
 *
 * If any requirements are missing, this function will attempt to create them.
 */
export async function verifyRequirements(): Promise<void> {
  try {
    const db = await connectToDatabase();

    // Check if the movies collection exists and has data
    await verifyMoviesCollection(db);
    console.log("All database requirements verified successfully");
  } catch (error) {
    console.error("Requirements verification failed:", error);
    throw error;
  }
}

/**
 * Verifies the movies collection and creates necessary indexes
 */
async function verifyMoviesCollection(db: Db): Promise<void> {
  const moviesCollection = db.collection("movies");

  // Check if collection has documents
  const movieCount = await moviesCollection.estimatedDocumentCount();

  if (movieCount === 0) {
    console.warn(
      "Movies collection is empty. Please ensure sample_mflix data is loaded."
    );
  }

  // Create text search index on plot field for full-text search
  try {
    await moviesCollection.createIndex(
      { plot: "text", title: "text", fullplot: "text" },
      {
        name: "text_search_index",
        background: true,
      }
    );
    console.log("Text search index created for movies collection");
  } catch (error) {
    console.error("Could not create text search index:", error);
  }
}

# JavaScript Express.js MongoDB Sample MFlix Application

This is a full-stack movie browsing application built with Express.js and Next.js, demonstrating MongoDB operations using the `sample_mflix` dataset. The application showcases CRUD operations, aggregations, and MongoDB Search using the native MongoDB Node.js driver.

## Project Structure

```
├── README.md
├── client/                 # Next.js frontend (TypeScript)
└── server                  # Express.js backend
    ├── src/
    ├── package.json
    ├── .env.example
    └── tsconfig.json
```

## Prerequisites

- **Node.js 22** or higher
- **MongoDB Atlas cluster or local deployment** with the `sample_mflix` dataset loaded
  - [Load sample data](https://www.mongodb.com/docs/atlas/sample-data/)
- **npm** (included with Node.js)
- **Voyage AI API key** (For MongoDB Vector Search)
  - [Get a Voyage AI API key](https://www.voyageai.com/)

## Getting Started

### 1. Configure the Backend

Navigate to the Express server directory:

```bash
cd server
```

Create a `.env` file from the example:

```bash
cp .env.example .env
```

Edit the `.env` file and set your MongoDB connection string:

```env
# MongoDB Connection
# Replace with your MongoDB Atlas connection string or local MongoDB URI
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/sample_mflix?retryWrites=true&w=majority

# Voyage AI Configuration
# API key for Voyage AI embedding model (required for Vector Search)
VOYAGE_API_KEY=your_voyage_api_key

# Server Configuration
PORT=3001
NODE_ENV=development

# CORS Configuration
# Allowed origin for cross-origin requests (frontend URL)
# For multiple origins, separate with commas
CORS_ORIGIN=http://localhost:3000

# Optional: Enable MongoDB Search tests
# Uncomment the following line to enable Search tests
# ENABLE_SEARCH_TESTS=true
```

**Note:** Replace `<username>`, `<password>`, and `<cluster>` with
your actual MongoDB Atlas credentials. Replace `your_voyage_api_key` with
your key.

### 2. Install Backend Dependencies

From the `server` directory, run:

```bash
npm install
```

### 3. Start the Backend Server

From the `server` directory, run:

```bash
# Development mode with hot reloading
npm run dev
```


Or for production mode, run:

```bash
npm run build
npm start
```

The server will start on `http://localhost:3001`. You can verify it's running by visiting:
- API root: http://localhost:3001/
- API documentation (Swagger UI): http://localhost:3001/api-docs

### 4. Configure and Start the Frontend

Open a new terminal and navigate to the client directory:

```bash
cd client
```

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

The Next.js application will start on `http://localhost:3000`.

### 5. Access the Application

Open your browser and navigate to:
- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:3001
- **API Documentation:** http://localhost:3001/api-docs

## Features

- **Browse Movies:** View a paginated list of movies from the
  sample_mflix dataset
- **CRUD Operations:** Create, read, update and delete movies by using
  the MongoDB Node.js driver
- **Search:** Search movies with filters by using MongoDB Search
- **Vector Search:** Search movie plots with similar search terms by
  using MongoDB Vector Search
- **Aggregations:** View data aggregations and analytics built with
  aggregation pipelines

## Development

### Backend Development

The Express.js backend uses:
- **Express.js 5** for REST API
- **MongoDB Node.js Driver** for database operations
- **TypeScript** for type safety
- **Swagger** for API documentation
- **Jest** for testing

To run tests:

```bash
cd server
npm test
```

To run tests with coverage:

```bash
cd server
npm run test:coverage
```

### Frontend Development

The Next.js frontend uses:
- **React 19** with TypeScript
- **Next.js 16** with App Router
- **Turbopack** for fast development builds

#### Development Mode

For active development with hot reloading and fast refresh:

```bash
cd client
npm run dev
```

This starts the development server on `http://localhost:3000` with Turbopack for fast rebuilds.

#### Production Build

To create an optimized production build and run it:

```bash
cd client
npm run build  # Creates optimized production build
npm start      # Starts production server
```

The production build:
- Minifies and optimizes JavaScript and CSS
- Optimizes images and assets
- Generates static pages where possible
- Provides better performance for end users

#### Linting

To check code quality:

```bash
cd client
npm run lint
```

## Issues

If you have problems running the sample app, please check the following:

- [ ] Verify that you have set your MongoDB connection string in the `.env` file.
- [ ] Verify that you have started the Express server.
- [ ] Verify that you have started the Next.js client.
- [ ] Verify that you have no firewalls blocking access to the server or client ports.

If you have verified the above and still have issues, please
[open an issue](https://github.com/mongodb/docs-sample-apps/issues/new/choose)
on the source repository `mongodb/docs-sample-apps`.

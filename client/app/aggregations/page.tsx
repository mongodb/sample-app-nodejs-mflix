import React from 'react';
import { fetchMoviesWithComments, fetchMoviesByYear, fetchDirectorStats } from '../lib/api';
import { MovieWithComments, YearlyStats, DirectorStats } from '../types/aggregations';
import styles from './aggregations.module.css';

export default async function AggregationsPage() {
  const MOVIES_WITH_COMMENTS_LIMIT = 5;
  const DIRECTOR_STATS_LIMIT = 15;

  // Fetch all aggregation data with error handling
  const [commentsResult, yearResult, directorsResult] = await Promise.allSettled([
    fetchMoviesWithComments(MOVIES_WITH_COMMENTS_LIMIT),
    fetchMoviesByYear(),
    fetchDirectorStats(DIRECTOR_STATS_LIMIT)
  ]);

  // Process results with fallbacks
  const commentsData = commentsResult.status === 'fulfilled' ? commentsResult.value : { success: false, error: 'Failed to fetch comments data' };
  const yearData = yearResult.status === 'fulfilled' ? yearResult.value : { success: false, error: 'Failed to fetch year data' };
  const directorsData = directorsResult.status === 'fulfilled' ? directorsResult.value : { success: false, error: 'Failed to fetch directors data' };

  if (process.env.NODE_ENV === 'development') {
    console.log('Aggregations SSR: Data fetch completed', {
      comments: commentsData.success,
      year: yearData.success,
      directors: directorsData.success
    });
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Movie Analytics Aggregations</h1>
      <p className={styles.subtitle}>
        Explore movie data through various aggregations and insights
      </p>

      {/* Movies with Recent Comments Section */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Movies with Recent Comments</h2>
        {commentsData.success && commentsData.data ? (
          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Movie Title</th>
                  <th>Year</th>
                  <th>Rating</th>
                  <th>Total Comments</th>
                  <th>Recent Comments</th>
                </tr>
              </thead>
              <tbody>
                {(commentsData.data as MovieWithComments[]).map((movie) => (
                  <tr key={movie._id}>
                    <td className={styles.movieTitle}>{movie.title}</td>
                    <td>{movie.year}</td>
                    <td>{movie.imdbRating ? movie.imdbRating.toFixed(1) : 'N/A'}</td>
                    <td>{movie.totalComments}</td>
                    <td>
                      <div className={styles.commentsContainer}>
                        {movie.recentComments?.slice(0, 2).map((comment, index) => (
                          <div key={`${movie._id}-${comment.date}-${index}`} className={styles.comment}>
                            <div className={styles.commentText}>
                              &ldquo;{(comment.text || 'No text').slice(0, 80)}{comment.text?.length > 80 ? '...' : ''}&rdquo;
                            </div>
                            <div className={styles.commentMeta}>
                              by {comment.userName} on {new Date(comment.date).toLocaleDateString()}
                            </div>
                          </div>
                        )) || <div>No recent comments</div>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className={styles.error}>
            Failed to load movies with comments: {commentsData.error || 'Unknown error'}
          </div>
        )}
      </section>

      {/* Movies by Year Section */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Movies by Year Statistics</h2>
        {yearData.success && yearData.data ? (
          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Year</th>
                  <th>Movie Count</th>
                  <th>Average Rating</th>
                  <th>Highest Rating</th>
                  <th>Lowest Rating</th>
                  <th>Total Votes</th>
                </tr>
              </thead>
              <tbody>
                {(yearData.data as YearlyStats[]).slice(0, 20).map((yearStats) => (
                  <tr key={yearStats.year}>
                    <td className={styles.year}>{yearStats.year}</td>
                    <td>{yearStats.movieCount}</td>
                    <td>{yearStats.averageRating ? yearStats.averageRating.toFixed(2) : 'N/A'}</td>
                    <td>{yearStats.highestRating ? yearStats.highestRating.toFixed(1) : 'N/A'}</td>
                    <td>{yearStats.lowestRating ? yearStats.lowestRating.toFixed(1) : 'N/A'}</td>
                    <td>{yearStats.totalVotes?.toLocaleString() || 'N/A'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className={styles.error}>
            Failed to load yearly statistics: {yearData.error || 'Unknown error'}
          </div>
        )}
      </section>

      {/* Directors with Most Movies Section */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Directors with Most Movies</h2>
        {directorsData.success && directorsData.data ? (
          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Director</th>
                  <th>Movie Count</th>
                  <th>Average Rating</th>
                </tr>
              </thead>
              <tbody>
                {(directorsData.data as DirectorStats[]).map((director, index) => (
                  <tr key={director.director}>
                    <td className={styles.rank}>#{index + 1}</td>
                    <td className={styles.directorName}>{director.director}</td>
                    <td>{director.movieCount}</td>
                    <td>{director.averageRating ? director.averageRating.toFixed(2) : 'N/A'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className={styles.error}>
            Failed to load director statistics: {directorsData.error || 'Unknown error'}
          </div>
        )}
      </section>
    </div>
  );
}
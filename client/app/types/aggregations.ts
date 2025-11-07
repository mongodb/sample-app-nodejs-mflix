// Type definitions for aggregations page

export interface MovieWithComments {
  _id: string;
  title: string;
  year: number;
  genres: string[];
  imdbRating: number;
  totalComments: number;
  recentComments: Array<{
    userName: string;
    userEmail: string;
    text: string;
    date: string;
  }>;
}

export interface YearlyStats {
  year: number;
  movieCount: number;
  averageRating: number;
  highestRating: number;
  lowestRating: number;
  totalVotes: number;
}

export interface DirectorStats {
  director: string;
  movieCount: number;
  averageRating: number;
}
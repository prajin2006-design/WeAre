export interface Movie {
  id: string;
  title: string;
  description: string;
  year: number;
  genre: string[];
  rating: string;
  duration: string;
  poster: string;
  backdrop: string;
  progress?: number;
  isOriginal?: boolean;
  isSeries?: boolean;
  score?: number;
  seasons?: number;
}

export interface ContentRow {
  title: string;
  movies: Movie[];
}

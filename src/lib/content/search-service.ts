import { ContentItem } from '@/types/content';
import { DynamicCatalogService } from '@/lib/tmdb/dynamic-catalog';
import { MovieService } from './movie-service';
import { SeriesService } from './series-service';

export const SearchService = {
  async search(query: string, genre?: string): Promise<ContentItem[]> {
    const cleanQuery = query?.trim() || '';
    if (!cleanQuery) return [];

    try {
      const searchRes = await DynamicCatalogService.search({
        query: cleanQuery,
        type: 'all',
        page: 1,
      });

      if (searchRes && searchRes.items && searchRes.items.length > 0) {
        let results = searchRes.items;
        if (genre && genre.toLowerCase() !== 'all') {
          const gLower = genre.toLowerCase();
          results = results.filter((item) =>
            item.genres.some((g) => g.toLowerCase() === gLower)
          );
        }
        return results;
      }
    } catch (err) {
      console.warn('[SearchService.search] Dynamic TMDB search notice:', err);
    }

    // Fallback search across local catalogue
    const [allMovies, allSeries] = await Promise.all([
      MovieService.getPopular(40),
      SeriesService.getPopular(20),
    ]);

    let results: ContentItem[] = [...allMovies, ...allSeries];

    if (cleanQuery) {
      results = results.filter((item) => {
        const matchesTitle = item.title.toLowerCase().includes(cleanQuery);
        const matchesDesc = item.description.toLowerCase().includes(cleanQuery);
        const matchesCast = item.cast.some((c) => c.toLowerCase().includes(cleanQuery));
        const matchesGenre = item.genres.some((g) => g.toLowerCase().includes(cleanQuery));
        const matchesYear = item.release_year.toString() === cleanQuery;
        return matchesTitle || matchesDesc || matchesCast || matchesGenre || matchesYear;
      });
    }

    if (genre && genre.toLowerCase() !== 'all') {
      const gLower = genre.toLowerCase();
      results = results.filter((item) =>
        item.genres.some((g) => g.toLowerCase() === gLower)
      );
    }

    return results;
  },
};

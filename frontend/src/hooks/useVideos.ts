import useSWRInfinite from 'swr/infinite';
import { api } from '@/lib/api';

export interface VideoSummary {
  id: string;
  app_name: string;
  status: 'pending' | 'processing' | 'done' | 'failed';
  source: 'form' | 'editor';
  has_code: boolean;
  render_status: string | null;
  thumbnail: string | null;
  created_at: string;
}

interface VideosResponse {
  videos: VideoSummary[];
  nextCursor: string | null;
}

const fetcher = (url: string) => api.get<VideosResponse>(url);

export function useVideos(order: 'desc' | 'asc' = 'desc') {
  const { data, size, setSize, isLoading, isValidating, mutate } = useSWRInfinite<VideosResponse>(
    (pageIndex, previousData) => {
      if (previousData && !previousData.nextCursor) return null;
      const cursor = previousData?.nextCursor ? `&cursor=${previousData.nextCursor}` : '';
      return `/videos?order=${order}${cursor}`;
    },
    fetcher,
    { revalidateOnFocus: false, revalidateIfStale: false }
  );

  const videos = data?.flatMap((p) => p.videos) ?? [];
  const hasMore = !!data?.[size - 1]?.nextCursor;

  return { videos, hasMore, isLoading, isLoadingMore: isValidating && size > 1, loadMore: () => setSize(size + 1), mutate };
}

export interface VideoComment {
  text: string;
  likeCount: number;
  authorName: string;
}

export interface VideoData {
  title: string;
  channelTitle: string;
  viewCount: string;
  likeCount: string;
  publishedAt: string;
  comments: VideoComment[];
}

export async function fetchYouTubeData(
  productName: string,
  apiKey: string
): Promise<{ videos: VideoData[]; totalComments: number; contextText: string }> {
  // Search for top videos about this product
  const searchQuery = encodeURIComponent(`${productName} review honest opinion`);
  const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${searchQuery}&type=video&maxResults=5&order=relevance&relevanceLanguage=en&key=${apiKey}`;

  const searchRes = await fetch(searchUrl, { next: { revalidate: 3600 } });
  if (!searchRes.ok) {
    throw new Error(`YouTube search failed: ${searchRes.status}`);
  }

  const searchData = await searchRes.json();
  const videoIds: string[] = searchData.items?.map(
    (item: { id: { videoId: string } }) => item.id.videoId
  ) ?? [];

  if (videoIds.length === 0) {
    throw new Error("No videos found");
  }

  // Fetch video details + comments in parallel
  const videoPromises = videoIds.map((id) =>
    fetchVideoWithComments(id, apiKey)
  );
  const videos = (await Promise.allSettled(videoPromises))
    .filter(
      (r): r is PromiseFulfilledResult<VideoData> => r.status === "fulfilled"
    )
    .map((r) => r.value);

  // Build context text for AI
  const allComments = videos.flatMap((v) => v.comments);
  const totalComments = allComments.length;

  const contextText = videos
    .map(
      (v) =>
        `VIDEO: "${v.title}" (${v.viewCount} views)\n` +
        `TOP COMMENTS:\n` +
        v.comments
          .slice(0, 15)
          .map((c) => `- ${c.text}`)
          .join("\n")
    )
    .join("\n\n---\n\n");

  return { videos, totalComments, contextText };
}

async function fetchVideoWithComments(
  videoId: string,
  apiKey: string
): Promise<VideoData> {
  const [videoRes, commentsRes] = await Promise.all([
    fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics&id=${videoId}&key=${apiKey}`
    ),
    fetch(
      `https://www.googleapis.com/youtube/v3/commentThreads?part=snippet&videoId=${videoId}&maxResults=50&order=relevance&key=${apiKey}`
    ),
  ]);

  const [videoData, commentsData] = await Promise.all([
    videoRes.json(),
    commentsRes.json(),
  ]);

  const video = videoData.items?.[0];
  const snippet = video?.snippet ?? {};
  const stats = video?.statistics ?? {};

  const comments: VideoComment[] =
    commentsData.items?.map(
      (item: {
        snippet: {
          topLevelComment: {
            snippet: {
              textDisplay: string;
              likeCount: number;
              authorDisplayName: string;
            };
          };
        };
      }) => ({
        text: item.snippet.topLevelComment.snippet.textDisplay,
        likeCount: item.snippet.topLevelComment.snippet.likeCount ?? 0,
        authorName:
          item.snippet.topLevelComment.snippet.authorDisplayName ?? "Anonymous",
      })
    ) ?? [];

  // Sort by like count to get most relevant comments
  comments.sort((a, b) => b.likeCount - a.likeCount);

  return {
    title: snippet.title ?? "Unknown",
    channelTitle: snippet.channelTitle ?? "Unknown",
    viewCount: stats.viewCount ?? "0",
    likeCount: stats.likeCount ?? "0",
    publishedAt: snippet.publishedAt ?? "",
    comments: comments.slice(0, 30), // top 30 comments per video
  };
}

import { NEWS_KEYWORDS } from "@/lib/news/keywords";

export function isRelevantNews(title: string): boolean {
  const lowerTitle = title.toLowerCase();

  return NEWS_KEYWORDS.some((keyword) =>
    lowerTitle.includes(keyword.toLowerCase()),
  );
}

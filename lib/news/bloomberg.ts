import Parser from "rss-parser";
import { NewsItem } from "./types";
import { isRelevantNews } from "./isRelevantNews";

export async function getBloombergNews(): Promise<NewsItem[]> {
  const parser = new Parser();

  const feed = await parser.parseURL("https://www.bloombergtechnoz.com/rss");

  return feed.items
    .filter(
      (item) =>
        item.title && item.link && item.pubDate && isRelevantNews(item.title),
    )
    .map((item) => ({
      title: item.title!,
      link: item.link!,
      source: "Bloomberg Technoz",
      publishedAt: new Date(item.pubDate!).toISOString(),
    }));
}

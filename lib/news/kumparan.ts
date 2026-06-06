import Parser from "rss-parser";
import { NewsItem } from "./types";
import { isRelevantNews } from "./isRelevantNews";

export async function getKumparanNews(): Promise<NewsItem[]> {
  const parser = new Parser();

  const feed = await parser.parseURL("https://lapi.kumparan.com/v2.0/rss/");

  return feed.items
    .filter((item) => item.title && item.link && isRelevantNews(item.title))
    .map((item) => ({
      title: item.title!,
      link: item.link!,
      source: "Kumparan",
    }));
}

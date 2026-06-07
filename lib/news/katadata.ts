import * as cheerio from "cheerio";
import { NewsItem } from "./types";
import { isRelevantNews } from "./isRelevantNews";

export async function getKatadataNews(): Promise<NewsItem[]> {
  const response = await fetch("https://katadata.co.id/finansial/bursa", {
    cache: "no-store",
  });

  const html = await response.text();

  const $ = cheerio.load(html);

  const news: NewsItem[] = [];

  $("a").each((_, element) => {
    const title = $(element).text().trim();

    const link = $(element).attr("href");

    if (
      title &&
      link &&
      link.includes("/finansial/bursa/") &&
      isRelevantNews(title)
    ) {
      news.push({
        title,
        link,
        source: "Katadata",
        publishedAt: new Date().toISOString(),
      });
    }
  });

  const uniqueNews = news.filter(
    (item, index, self) =>
      index === self.findIndex((n) => n.link === item.link),
  );

  return uniqueNews.slice(0, 20);
}

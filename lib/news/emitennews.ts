import * as cheerio from "cheerio";
import { NewsItem } from "./types";
import { isRelevantNews } from "./isRelevantNews";

export async function getEmitenNews(): Promise<NewsItem[]> {
  const response = await fetch("https://www.emitennews.com/category/emiten", {
    cache: "no-store",
  });

  const html = await response.text();

  const $ = cheerio.load(html);

  const news: NewsItem[] = [];

  $("a").each((_, element) => {
    const title = $(element)
      .text()
      .replace(/\s+/g, " ")
      .replace(/\d+\s+(jam|hari)\s+yang\s+lalu/gi, "")
      .trim();

    const link = $(element).attr("href");

    if (title && link && link.includes("/news/") && isRelevantNews(title)) {
      news.push({
        title,
        link,
        source: "EmitenNews",
      });
    }
  });

  const uniqueNews = news.filter(
    (item, index, self) =>
      index === self.findIndex((n) => n.link === item.link),
  );

  return uniqueNews.slice(0, 20);
}

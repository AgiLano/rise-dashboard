import * as cheerio from "cheerio";
import { NewsItem } from "./types";
import { isRelevantNews } from "./isRelevantNews";

async function getArticleDate(url: string): Promise<string> {
  try {
    const response = await fetch(url, {
      cache: "no-store",
    });

    const html = await response.text();

    const $ = cheerio.load(html);

    const rawDate = $(".time-posted").first().text().trim();

    if (!rawDate) {
      return new Date().toISOString();
    }

    const match = rawDate.match(/(\d{2})\/(\d{2})\/(\d{4}),\s*(\d{2}):(\d{2})/);

    if (!match) {
      return new Date().toISOString();
    }

    const [, day, month, year, hour, minute] = match;

    return new Date(
      `${year}-${month}-${day}T${hour}:${minute}:00+07:00`,
    ).toISOString();
  } catch {
    return new Date().toISOString();
  }
}

export async function getEmitenNews(): Promise<NewsItem[]> {
  const response = await fetch("https://www.emitennews.com/category/emiten", {
    cache: "no-store",
  });

  const html = await response.text();

  const $ = cheerio.load(html);

  const news: Omit<NewsItem, "publishedAt">[] = [];

  $("a").each((_, element) => {
    const title = $(element)
      .text()
      .replace(/\s+/g, " ")
      .replace(/\d+\s+(detik|menit|jam|hari)\s+yang\s+lalu/gi, "")
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

  const limitedNews = uniqueNews.slice(0, 10);

  const newsWithDate = await Promise.all(
    limitedNews.map(async (item) => ({
      ...item,
      publishedAt: await getArticleDate(item.link),
    })),
  );

  return newsWithDate;
}

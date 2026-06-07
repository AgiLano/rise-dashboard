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

    const rawDate = $(".detail-date").first().text().trim();

    if (!rawDate) {
      return new Date().toISOString();
    }

    const months: Record<string, string> = {
      Januari: "01",
      Februari: "02",
      Maret: "03",
      April: "04",
      Mei: "05",
      Juni: "06",
      Juli: "07",
      Agustus: "08",
      September: "09",
      Oktober: "10",
      November: "11",
      Desember: "12",
    };

    const match = rawDate.match(
      /(\d{1,2})\s+([A-Za-z]+)\s+(\d{4}),\s+(\d{2}):(\d{2})/,
    );

    if (!match) {
      return new Date().toISOString();
    }

    const [, day, monthName, year, hour, minute] = match;

    const month = months[monthName];

    if (!month) {
      return new Date().toISOString();
    }

    return new Date(
      `${year}-${month}-${day.padStart(2, "0")}T${hour}:${minute}:00+07:00`,
    ).toISOString();
  } catch {
    return new Date().toISOString();
  }
}

export async function getKatadataNews(): Promise<NewsItem[]> {
  const response = await fetch("https://katadata.co.id/finansial/bursa", {
    cache: "no-store",
  });

  const html = await response.text();

  const $ = cheerio.load(html);

  const news: Omit<NewsItem, "publishedAt">[] = [];

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

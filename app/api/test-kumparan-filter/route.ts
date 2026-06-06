import Parser from "rss-parser";
import { isRelevantNews } from "@/lib/news/isRelevantNews";

export async function GET() {
  try {
    const parser = new Parser();

    const feed = await parser.parseURL("https://lapi.kumparan.com/v2.0/rss/");

    const relevantNews = feed.items
      .filter((item) => item.title && isRelevantNews(item.title))
      .map((item) => ({
        title: item.title,
        link: item.link,
      }));

    return Response.json({
      totalRSS: feed.items.length,
      totalRelevant: relevantNews.length,
      news: relevantNews,
    });
  } catch (error) {
    return Response.json(
      {
        success: false,
        error: String(error),
      },
      { status: 500 },
    );
  }
}

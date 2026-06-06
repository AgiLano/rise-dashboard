import { sendDiscordMessage } from "@/lib/discord";
import { getAllNews } from "@/lib/news/getAllNews";
import { formatDiscordNews } from "@/lib/news/formatDiscordNews";

export async function GET() {
  try {
    const news = await getAllNews();

    const topFiveNews = news.slice(0, 5);

    for (const item of topFiveNews) {
      await sendDiscordMessage(formatDiscordNews(item));
    }

    return Response.json({
      success: true,
      totalSent: topFiveNews.length,
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

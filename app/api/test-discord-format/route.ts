import { getAllNews } from "@/lib/news/getAllNews";
import { formatDiscordNews } from "@/lib/news/formatDiscordNews";

export async function GET() {
  try {
    const news = await getAllNews();

    const latestNews = news[0];

    return Response.json({
      message: formatDiscordNews(latestNews),
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

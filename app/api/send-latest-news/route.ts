import { sendDiscordMessage } from "@/lib/discord";
import { getAllNews } from "@/lib/news/getAllNews";
import { formatDiscordNews } from "@/lib/news/formatDiscordNews";

export async function GET() {
  try {
    const news = await getAllNews();

    if (news.length === 0) {
      return Response.json({
        success: false,
        message: "Tidak ada berita",
      });
    }

    const latestNews = news[0];

    await sendDiscordMessage(formatDiscordNews(latestNews));

    return Response.json({
      success: true,
      sent: latestNews,
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

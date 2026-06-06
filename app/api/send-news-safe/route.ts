import { redis } from "@/lib/redis";
import { getAllNews } from "@/lib/news/getAllNews";
import { formatDiscordNews } from "@/lib/news/formatDiscordNews";
import { sendDiscordMessage } from "@/lib/discord";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");

  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json(
      {
        success: false,
        message: "Unauthorized",
      },
      { status: 401 },
    );
  }

  try {
    const news = await getAllNews();

    let sentCount = 0;

    for (const item of news.slice(0, 10)) {
      const alreadySent = await redis.get(item.link);

      if (alreadySent) {
        continue;
      }

      await sendDiscordMessage(formatDiscordNews(item));

      await redis.set(item.link, "sent");

      sentCount++;
    }

    return Response.json({
      success: true,
      sentCount,
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

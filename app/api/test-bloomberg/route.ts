import { getBloombergNews } from "@/lib/news/bloomberg";

export async function GET() {
  try {
    const news = await getBloombergNews();

    return Response.json({
      total: news.length,
      latest: news[0],
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

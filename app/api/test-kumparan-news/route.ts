import { getKumparanNews } from "@/lib/news/kumparan";

export async function GET() {
  try {
    const news = await getKumparanNews();

    return Response.json({
      total: news.length,
      latest: news[0] ?? null,
      news,
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

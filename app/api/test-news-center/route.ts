import { getAllNews } from "@/lib/news/getAllNews";

export async function GET() {
  try {
    const news = await getAllNews();

    return Response.json({
      total: news.length,
      latest: news.slice(0, 10),
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

import { getKatadataNews } from "@/lib/news/katadata";

export async function GET() {
  const news = await getKatadataNews();

  return Response.json({
    total: news.length,
    news: news.slice(0, 10),
  });
}

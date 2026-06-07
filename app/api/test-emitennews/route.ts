import { getEmitenNews } from "@/lib/news/emitennews";

export async function GET() {
  const news = await getEmitenNews();

  return Response.json({
    total: news.length,
    news: news.slice(0, 10),
  });
}

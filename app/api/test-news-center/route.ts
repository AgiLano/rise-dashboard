import { getAllNews } from "@/lib/news/getAllNews";

export async function GET() {
  try {
    const news = await getAllNews();

    const sources = {
      bloomberg: news.filter((item) => item.source === "Bloomberg Technoz")
        .length,

      kumparan: news.filter((item) => item.source === "Kumparan").length,

      emitennews: news.filter((item) => item.source === "EmitenNews").length,
    };

    return Response.json({
      total: news.length,
      sources,
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

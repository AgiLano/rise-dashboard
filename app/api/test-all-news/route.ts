import { getBloombergNews } from "@/lib/news/bloomberg";
import { getKumparanNews } from "@/lib/news/kumparan";

export async function GET() {
  try {
    const bloombergNews = await getBloombergNews();
    const kumparanNews = await getKumparanNews();

    const allNews = [...bloombergNews, ...kumparanNews];

    return Response.json({
      total: allNews.length,
      sources: {
        bloomberg: bloombergNews.length,
        kumparan: kumparanNews.length,
      },
      latest: allNews.slice(0, 10),
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

import { getBloombergNews } from "./bloomberg";
import { getKumparanNews } from "./kumparan";
import { getEmitenNews } from "./emitennews";
import { getKatadataNews } from "./katadata";
import { NewsItem } from "./types";

export async function getAllNews(): Promise<NewsItem[]> {
  const [bloombergNews, kumparanNews, emitenNews, katadataNews] =
    await Promise.all([
      getBloombergNews(),
      getKumparanNews(),
      getEmitenNews(),
      getKatadataNews(),
    ]);

  return [
    ...bloombergNews,
    ...kumparanNews,
    ...emitenNews,
    ...katadataNews,
  ].sort(
    (a, b) =>
      new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
  );
}

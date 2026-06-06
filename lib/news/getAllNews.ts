import { getBloombergNews } from "./bloomberg";
import { getKumparanNews } from "./kumparan";
import { getEmitenNews } from "./emitennews";
import { NewsItem } from "./types";

export async function getAllNews(): Promise<NewsItem[]> {
  const [bloombergNews, kumparanNews, emitenNews] = await Promise.all([
    getBloombergNews(),
    getKumparanNews(),
    getEmitenNews(),
  ]);

  return [...bloombergNews, ...kumparanNews, ...emitenNews];
}

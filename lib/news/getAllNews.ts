import { getBloombergNews } from "./bloomberg";
import { getKumparanNews } from "./kumparan";
import { NewsItem } from "./types";

export async function getAllNews(): Promise<NewsItem[]> {
  const [bloombergNews, kumparanNews] = await Promise.all([
    getBloombergNews(),
    getKumparanNews(),
  ]);

  return [...bloombergNews, ...kumparanNews];
}

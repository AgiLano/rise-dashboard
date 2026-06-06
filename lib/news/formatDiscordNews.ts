import { NewsItem } from "./types";

export function formatDiscordNews(news: NewsItem) {
  return `
📰 BERITA BARU

${news.title}

🌐 Sumber: ${news.source}

🔗 Baca:
${news.link}

━━━━━━━━━━━━━━
`;
}

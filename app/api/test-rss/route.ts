import Parser from "rss-parser";
import { sendDiscordMessage } from "@/lib/discord";

export async function GET() {
  try {
    const parser = new Parser();

    const feed = await parser.parseURL("https://www.bloombergtechnoz.com/rss");

    const latestNews = feed.items[0];

    const message = `
📰 BERITA BARU

${latestNews.title}

🌐 Sumber: Bloomberg Technoz

🔗 Baca:
${latestNews.link}

━━━━━━━━━━━━━━
`;

    await sendDiscordMessage(message);

    return Response.json({
      success: true,
      title: latestNews.title,
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

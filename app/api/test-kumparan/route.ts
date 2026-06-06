import Parser from "rss-parser";

export async function GET() {
  try {
    const parser = new Parser();

    const feed = await parser.parseURL("https://lapi.kumparan.com/v2.0/rss/");

    return Response.json({
      title: feed.title,
      total: feed.items.length,
      items: feed.items.slice(0, 5).map((item) => ({
        title: item.title,
        link: item.link,
      })),
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

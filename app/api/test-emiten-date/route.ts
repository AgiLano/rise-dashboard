import * as cheerio from "cheerio";

export async function GET() {
  const response = await fetch(
    "https://www.emitennews.com/news/scg-buang-1285-miliar-saham-tpia-siapa-yang-tampung",
    {
      cache: "no-store",
    },
  );

  const html = await response.text();

  const $ = cheerio.load(html);

  const publishedAt = $(".time-posted").first().text().trim();

  return Response.json({
    publishedAt,
  });
}

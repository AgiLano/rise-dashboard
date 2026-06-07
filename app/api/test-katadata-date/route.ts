import * as cheerio from "cheerio";

export async function GET() {
  const response = await fetch(
    "https://katadata.co.id/berita/industri/6a24b6f62953b/menko-ahy-rusia-berpeluang-kembangkan-kereta-api-sumatra-kalimantan-sulawesi",
    {
      cache: "no-store",
    },
  );

  const html = await response.text();

  const $ = cheerio.load(html);

  const rawDate = $(".detail-date").first().text().trim();

  return Response.json({
    rawDate,
  });
}

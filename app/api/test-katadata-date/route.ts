import * as cheerio from "cheerio";

export async function GET() {
  const response = await fetch(
    "https://katadata.co.id/finansial/bursa/6843e11f76cae/investor-asing-tinggalkan-pasar-saham-ri-rp-61-triliun-ytd-apa-yang-terjadi",
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

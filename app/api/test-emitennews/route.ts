export async function GET() {
  const response = await fetch(
    "https://www.emitennews.com/news/scg-buang-1285-miliar-saham-tpia-siapa-yang-tampung",
    {
      cache: "no-store",
    },
  );

  const html = await response.text();

  return new Response(html, {
    headers: {
      "Content-Type": "text/html",
    },
  });
}

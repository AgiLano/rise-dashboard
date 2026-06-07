export async function GET() {
  const response = await fetch("https://katadata.co.id/finansial/bursa", {
    cache: "no-store",
  });

  const html = await response.text();

  return new Response(html, {
    headers: {
      "Content-Type": "text/html",
    },
  });
}

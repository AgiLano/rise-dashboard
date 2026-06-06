import { redis } from "@/lib/redis";

export async function GET() {
  try {
    const newsLink = "https://contoh-berita.com/berita-1";

    const alreadySent = await redis.get(newsLink);

    if (alreadySent) {
      return Response.json({
        success: true,
        status: "SUDAH_TERKIRIM",
      });
    }

    await redis.set(newsLink, "sent");

    return Response.json({
      success: true,
      status: "BARU_DIKIRIM",
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

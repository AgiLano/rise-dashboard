import { isRelevantNews } from "@/lib/news/isRelevantNews";

export async function GET() {
  const tests = [
    "IHSG Menguat 2% Hari Ini",
    "Bank Indonesia Pertahankan Suku Bunga",
    "Tips Parenting Anak Saat Masuk Sekolah",
    "Emiten Batu Bara Catat Laba Besar",
  ];

  return Response.json({
    results: tests.map((title) => ({
      title,
      relevant: isRelevantNews(title),
    })),
  });
}

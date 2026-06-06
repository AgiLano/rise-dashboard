import { sendDiscordMessage } from "@/lib/discord";

export async function GET() {
  try {
    await sendDiscordMessage("🚀 Test News Bot RISE berhasil terhubung!");

    return Response.json({
      success: true,
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

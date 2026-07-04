import { NextResponse } from "next/server";
import { sendBotLog } from "@/lib/discord";

export async function GET() {
  try {
    await sendBotLog(`🤖 TEST LOG

Bot Log berhasil terhubung.

🕒 ${new Date().toLocaleString("id-ID")}`);

    return NextResponse.json({
      success: true,
    });
  } catch (err) {
    return NextResponse.json(
      {
        success: false,
        error: String(err),
      },
      {
        status: 500,
      },
    );
  }
}

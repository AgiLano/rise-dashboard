import { NextRequest, NextResponse } from "next/server";
import { sendDirectMessage } from "@/lib/discord";

export async function POST(req: NextRequest) {
  try {
    const { discordUserId, nama, memberType, endDate } = await req.json();

    const message = `✅ Membership Berhasil Diperpanjang!

Halo ${nama} 👋

Membership ${memberType} kamu telah berhasil diperpanjang.

━━━━━━━━━━━━━━━━━━

📅 Berlaku Sampai

${endDate}

━━━━━━━━━━━━━━━━━━

Terima kasih telah memperpanjang membership RISE Ritel Society.

Jika mengalami kendala silakan hubungi Admin.

👤 Discord:
@agxx.partwo

Semoga selalu profit! 📈🚀`;

    await sendDirectMessage(discordUserId, message);

    return NextResponse.json({
      success: true,
    });
  } catch (err) {
    console.error(err);

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

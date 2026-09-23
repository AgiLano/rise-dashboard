import { NextRequest, NextResponse } from "next/server";
import { sendDirectMessage } from "@/lib/discord";

export async function POST(req: NextRequest) {
  try {
    const { discordUserId, nama, memberType, endDate, months, days } =
      await req.json();

    let extensionText = "";

    if (days) {
      extensionText = `+${days} Hari`;
    } else if (months) {
      extensionText = `+${months} Bulan`;
    } else {
      extensionText = "Perpanjangan Membership";
    }

    const message = days
      ? `🎁 Bonus Membership RISE!

Halo ${nama} 👋

Kamu mendapatkan bonus perpanjangan membership dari RISE Ritel Society.

━━━━━━━━━━━━━━━━━━

📦 Bonus Perpanjangan

+${days} Hari

📅 Berlaku Sampai

${endDate}

💰 Biaya

GRATIS

━━━━━━━━━━━━━━━━━━

Terima kasih telah menjadi bagian dari RISE Ritel Society.

Jika mengalami kendala silakan hubungi Admin.

👤 Discord:
@agxx.partwo

Semoga selalu profit! 📈🚀`
      : `✅ Membership Berhasil Diperpanjang!

Halo ${nama} 👋

Membership ${memberType} kamu telah berhasil diperpanjang.

━━━━━━━━━━━━━━━━━━

📦 Perpanjangan

${extensionText}

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

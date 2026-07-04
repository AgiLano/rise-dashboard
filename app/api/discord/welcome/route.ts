import { NextRequest, NextResponse } from "next/server";
import { sendDirectMessage } from "@/lib/discord";

export async function POST(req: NextRequest) {
  try {
    const { discordUserId, nama, username, password, memberType, endDate } =
      await req.json();

    const message = `🎉 Selamat Datang di RISE Ritel Society!

Halo ${nama} 👋

Membership ${memberType} kamu telah berhasil diaktifkan.

━━━━━━━━━━━━━━━━━━

👤 Username
${username}

🔑 Password
${password}

📅 Berlaku Sampai
${endDate}

━━━━━━━━━━━━━━━━━━

🌐 Dashboard
https://ritelsociety-dashboard.vercel.app

Silakan login menggunakan akun di atas.

Jika mengalami kendala, silakan hubungi Admin:
👤 Discord : @agxx.partwo

Terima kasih telah bergabung di RISE Ritel Society.

Semoga selalu profit! 📈🚀`;

    try {
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

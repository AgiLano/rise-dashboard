import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const { nama, discordId, daysLeft, endDate } = body;

    const origin = new URL(req.url).origin;

    await fetch(`${origin}/api/discord`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        channel: "ARAHAN",

        embed: {
          title: "⏰ MEMBER HAMPIR EXPIRED",

          color: 0xf59e0b,

          fields: [
            {
              name: "👤 Member",
              value: nama,
              inline: true,
            },
            {
              name: "🆔 Discord",
              value: discordId,
              inline: true,
            },
            {
              name: "⌛ Sisa",
              value: `${daysLeft} Hari`,
              inline: true,
            },
            {
              name: "📅 Berakhir",
              value: endDate,
              inline: true,
            },
          ],
        },
      }),
    });

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
      },
      {
        status: 500,
      },
    );
  }
}

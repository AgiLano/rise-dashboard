import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { discordId, memberType } = await req.json();

    const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN!;
    const GUILD_ID = process.env.DISCORD_GUILD_ID!;

    const ROLE_ID =
      memberType === "VVIP"
        ? process.env.DISCORD_ROLE_VVIP!
        : process.env.DISCORD_ROLE_VIP!;

    const response = await fetch(
      `https://discord.com/api/v10/guilds/${GUILD_ID}/members/${discordId}/roles/${ROLE_ID}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bot ${BOT_TOKEN}`,
        },
      },
    );

    if (!response.ok) {
      return NextResponse.json({
        success: false,
        error: await response.text(),
      });
    }

    return NextResponse.json({
      success: true,
      message: "Role berhasil dihapus.",
    });
  } catch (err) {
    return NextResponse.json({
      success: false,
      error: String(err),
    });
  }
}

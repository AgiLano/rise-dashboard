import { NextRequest, NextResponse } from "next/server";
import { sendBotLog } from "@/lib/discord";

export async function POST(req: NextRequest) {
  try {
    const { message } = await req.json();

    await sendBotLog(message);

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

import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    let webhook = process.env.DISCORD_WEBHOOK_REKOM;

    if (body.channel === "ARAHAN") {
      webhook = process.env.DISCORD_WEBHOOK_ARAHAN;
    }

    if (body.channel === "DONE") {
      webhook = process.env.DISCORD_WEBHOOK_DONE;
    }

    if (body.channel === "PANTAU") {
      webhook = process.env.DISCORD_WEBHOOK_PANTAU;
    }

    if (body.channel === "HAKA") {
      webhook = process.env.DISCORD_WEBHOOK_HAKA;
    }

    if (body.channel === "SNIPER") {
      webhook = process.env.DISCORD_WEBHOOK_SNIPER;
    }

    if (body.channel === "BSJP") {
      webhook = process.env.DISCORD_WEBHOOK_BSJP;
    }

    if (body.channel === "SWING") {
      webhook = process.env.DISCORD_WEBHOOK_SWING;
    }

    if (body.channel === "MEMBER_REMINDER") {
      webhook = process.env.DISCORD_WEBHOOK_MEMBER_REMINDER;
    }

    if (!webhook) {
      return NextResponse.json(
        {
          success: false,
          error: "Webhook URL missing",
        },
        {
          status: 500,
        },
      );
    }

    let payload: any;

    if (body.embed) {
      payload = {
        embeds: [
          {
            title: body.embed.title,
            description: body.embed.description,
            fields: body.embed.fields || [],
            color: body.embed.color || 0xfcd34d,
            footer: {
              text:
                body.embed.footer ||
                "RITEL SOCIETY • Premium Trading Community",
            },
            timestamp: body.embed.timestamp || new Date().toISOString(),
          },
        ],
      };
    } else {
      payload = {
        content: body.message,
      };
    }

    const response = await fetch(webhook, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const result = await response.text();

    console.log("DISCORD STATUS:", response.status);
    console.log("DISCORD RESPONSE:", result);

    return NextResponse.json({
      success: response.ok,
      status: response.status,
      discord: result,
      payload,
    });
  } catch (error) {
    console.error("DISCORD ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error: String(error),
      },
      {
        status: 500,
      },
    );
  }
}

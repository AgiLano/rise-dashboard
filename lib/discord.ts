export async function sendDiscordMessage(message: string) {
  const webhook = process.env.DISCORD_NEWS_WEBHOOK;

  if (!webhook) {
    throw new Error("Discord webhook tidak ditemukan");
  }

  await fetch(webhook, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      content: message,
    }),
  });
}

export async function createDMChannel(discordUserId: string) {
  const response = await fetch(
    "https://discord.com/api/v10/users/@me/channels",
    {
      method: "POST",
      headers: {
        Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        recipient_id: discordUserId,
      }),
    },
  );

  if (!response.ok) {
    throw new Error(await response.text());
  }

  return await response.json();
}

export async function sendDirectMessage(
  discordUserId: string,
  message: string,
) {
  const channel = await createDMChannel(discordUserId);

  const response = await fetch(
    `https://discord.com/api/v10/channels/${channel.id}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        content: message,
      }),
    },
  );

  if (!response.ok) {
    throw new Error(await response.text());
  }

  return await response.json();
}

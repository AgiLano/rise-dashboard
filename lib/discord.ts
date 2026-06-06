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

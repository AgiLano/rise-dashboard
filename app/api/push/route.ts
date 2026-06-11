import { NextResponse } from "next/server";
import webpush from "web-push";
import { createClient } from "@supabase/supabase-js";

webpush.setVapidDetails(
  "mailto:admin@rise.com",
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!,
);

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function POST(req: Request) {
  console.log("PUSH API HIT");

  const { title, body, signalId } = await req.json();

  const { data: subscriptions } = await supabase
    .from("push_subscriptions")
    .select("*");

  for (const sub of subscriptions || []) {
    try {
      console.log("Sending push to:", sub.endpoint);
      await webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh,
            auth: sub.auth,
          },
        },
        JSON.stringify({
          title,
          body,
          signalId,
        }),
      );
    } catch (error) {
      console.error("PUSH ERROR:", error);
    }
  }

  return NextResponse.json({
    success: true,
  });
}

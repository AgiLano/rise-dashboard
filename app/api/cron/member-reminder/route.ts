import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { sendDirectMessage, sendBotLog } from "@/lib/discord";

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");

  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json(
      {
        success: false,
        error: "Unauthorized",
      },
      {
        status: 401,
      },
    );
  }

  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { data: members, error } = await supabaseAdmin
      .from("members")
      .select("*")
      .eq("is_active", true);

    if (error) {
      throw error;
    }

    let checked = 0;
    let sent = 0;
    let failed = 0;

    for (const member of members ?? []) {
      const endDate = new Date(member.end_date);
      endDate.setHours(0, 0, 0, 0);

      const diffDays = Math.ceil(
        (endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
      );

      checked++;

      try {
        let shouldSend = false;

        if (diffDays === 7 && !member.reminder_7_sent) {
          shouldSend = true;
        }

        if (diffDays === 3 && !member.reminder_3_sent) {
          shouldSend = true;
        }

        if (diffDays === 1 && !member.reminder_1_sent) {
          shouldSend = true;
        }

        if (!shouldSend) {
          continue;
        }

        const message = `📢 Halo ${member.nama}!

Membership ${member.member_type} kamu akan berakhir dalam ${diffDays} hari.

📅 Berakhir:
${member.end_date}

Silakan lakukan perpanjangan sebelum masa aktif habis agar akses Dashboard RISE, Signal, dan seluruh channel VIP tetap aktif.

Terima kasih telah menjadi bagian dari RISE Ritel Society 🚀`;

        if (!member.discord_user_id) {
          failed++;
          continue;
        }

        await sendDirectMessage(member.discord_user_id, message);

        await sendBotLog(`⏰ REMINDER MEMBERSHIP

━━━━━━━━━━━━━━━━━━

👤 Member
${member.nama}

📦 Membership
${member.member_type}

📅 Berakhir
${member.end_date}

⏳ Sisa Hari
${diffDays} Hari

📩 Reminder berhasil dikirim melalui DM.

🕒 ${new Date().toLocaleString("id-ID")}
`);

        const updateData: any = {
          last_reminder_at: new Date().toISOString(),
        };

        if (diffDays === 7) updateData.reminder_7_sent = true;
        if (diffDays === 3) updateData.reminder_3_sent = true;
        if (diffDays === 1) updateData.reminder_1_sent = true;

        const { error: updateError } = await supabaseAdmin
          .from("members")
          .update(updateData)
          .eq("id", member.id);

        if (updateError) {
          console.error(updateError);
        }

        sent++;
      } catch (err) {
        console.error(err);

        try {
          await sendBotLog(`❌ REMINDER GAGAL

━━━━━━━━━━━━━━━━━━

👤 Member
${member.nama}

📦 Membership
${member.member_type}

📅 Berakhir
${member.end_date}

⚠️ Gagal mengirim Reminder DM.

Error:
${String(err)}

🕒 ${new Date().toLocaleString("id-ID")}
`);
        } catch {}

        failed++;
      }
    }

    return NextResponse.json({
      success: true,
      checked,
      sent,
      failed,
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

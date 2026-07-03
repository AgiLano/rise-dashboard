import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET() {
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

    let totalExpired = 0;

    for (const member of members ?? []) {
      const endDate = new Date(member.end_date);
      endDate.setHours(0, 0, 0, 0);

      if (endDate < today) {
        totalExpired++;

        // Nonaktifkan member
        await supabaseAdmin
          .from("members")
          .update({
            is_active: false,
          })
          .eq("id", member.id);

        // Cabut Role Discord
        try {
          await fetch(
            `${process.env.NEXT_PUBLIC_SITE_URL}/api/discord/remove-role`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                discordId: member.discord_user_id ?? member.discord_id,
                memberType: member.member_type,
              }),
            },
          );
        } catch (err) {
          console.error("Remove Role Error:", err);
        }
      }
    }

    return NextResponse.json({
      success: true,
      expired: totalExpired,
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

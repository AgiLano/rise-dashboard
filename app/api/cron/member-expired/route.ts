import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

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

    let totalExpired = 0;

    const baseUrl = new URL(req.url).origin;

    for (const member of members ?? []) {
      const endDate = new Date(member.end_date);
      endDate.setHours(0, 0, 0, 0);

      if (endDate < today) {
        totalExpired++;

        // Nonaktifkan member
        const { error: updateError } = await supabaseAdmin
          .from("members")
          .update({
            is_active: false,
          })
          .eq("id", member.id);

        if (updateError) {
          console.error(updateError);
          continue;
        }

        // Cabut Role Discord
        try {
          const removeRoleResponse = await fetch(
            `${baseUrl}/api/discord/remove-role`,
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

          if (!removeRoleResponse.ok) {
            console.error(
              "Remove role gagal:",
              await removeRoleResponse.text(),
            );
          }
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

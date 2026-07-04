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

    const reminderList = [];

    for (const member of members ?? []) {
      const endDate = new Date(member.end_date);
      endDate.setHours(0, 0, 0, 0);

      const diffDays = Math.ceil(
        (endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
      );

      reminderList.push({
        nama: member.nama,
        discord: member.discord_username,
        sisa_hari: diffDays,
        end_date: member.end_date,
      });
    }

    return NextResponse.json({
      success: true,
      total: members?.length ?? 0,
      data: reminderList,
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

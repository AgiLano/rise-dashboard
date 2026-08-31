"use client";

import { useEffect } from "react";
import { supabase } from "@/lib/supabase";

export default function MembershipReminder() {
  useEffect(() => {
    async function checkMembershipReminder() {
      const memberData = localStorage.getItem("rise_member");

      if (!memberData) return;

      try {
        const member = JSON.parse(memberData);

        if (!member.id || !member.end_date) return;

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const endDate = new Date(member.end_date);
        endDate.setHours(0, 0, 0, 0);

        const difference = Math.ceil(
          (endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
        );

        let reminder = null;

        if (difference === 7) {
          reminder = {
            title: "⚠️ Membership Akan Berakhir",
            message: `Membership ${member.paket} Anda akan berakhir dalam 7 hari. Hubungi Admin RISE untuk informasi perpanjangan.`,
            reminderKey: `membership-${member.id}-${member.end_date}-7`,
          };
        } else if (difference === 3) {
          reminder = {
            title: "🟠 Membership Segera Berakhir",
            message: `Membership ${member.paket} Anda tinggal 3 hari lagi. Segera hubungi Admin RISE untuk perpanjangan.`,
            reminderKey: `membership-${member.id}-${member.end_date}-3`,
          };
        } else if (difference === 1) {
          reminder = {
            title: "🚨 Membership Berakhir Besok",
            message: `Membership ${member.paket} Anda akan berakhir besok. Hubungi Admin RISE untuk memperpanjang membership.`,
            reminderKey: `membership-${member.id}-${member.end_date}-1`,
          };
        } else if (difference <= 0) {
          reminder = {
            title: "🔴 Membership Telah Berakhir",
            message: `Membership ${member.paket} Anda telah berakhir. Hubungi Admin RISE untuk informasi perpanjangan.`,
            reminderKey: `membership-${member.id}-${member.end_date}-expired`,
          };
        }

        if (!reminder) return;

        const { error } = await supabase.from("notifications").upsert(
          {
            title: reminder.title,
            message: reminder.message,
            type: "membership",
            is_read: false,
            member_id: member.id,
            reminder_key: reminder.reminderKey,
          },
          {
            onConflict: "reminder_key",
            ignoreDuplicates: true,
          },
        );

        if (error) {
          console.error("Gagal membuat reminder membership:", error);
        }
      } catch (error) {
        console.error("Gagal memproses membership reminder:", error);
      }
    }

    checkMembershipReminder();
  }, []);

  return null;
}

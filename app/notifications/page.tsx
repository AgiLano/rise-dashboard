"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([]);

  async function getNotifications() {
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .order("created_at", {
        ascending: false,
      });

    if (error) {
      console.error(error);
      return;
    }

    setNotifications(data || []);

    await supabase
      .from("notifications")
      .update({
        is_read: true,
      })
      .eq("is_read", false);

    await supabase
      .from("notifications")
      .update({
        is_read: true,
      })
      .eq("is_read", false);

    window.dispatchEvent(new CustomEvent("notifications-read"));
  }

  useEffect(() => {
    getNotifications();

    const channel = supabase
      .channel("notifications-realtime")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
        },
        (payload) => {
          setNotifications((prev) => [payload.new, ...prev]);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <main className="min-h-screen bg-gradient-to-b from-black via-zinc-950 to-black text-white p-4 md:p-10">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5 mb-10">
        <div>
          <h1 className="text-4xl md:text-6xl font-black tracking-tight text-amber-300 leading-none">
            NOTIFICATIONS
          </h1>

          <p className="text-zinc-500 mt-3 text-sm md:text-base">
            Realtime Notification Center RISE
          </p>
        </div>

        <Link
          href="/"
          className="
          bg-zinc-900
          hover:bg-zinc-800
          border
          border-white/5
          px-5
          py-3
          rounded-2xl
          font-bold
          transition-all
        "
        >
          ← Dashboard
        </Link>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-zinc-900 border border-white/5 rounded-3xl p-6">
          <p className="text-zinc-500 text-sm">Total Notifications</p>

          <h2 className="text-4xl font-black text-amber-300 mt-2">
            {notifications.length}
          </h2>
        </div>

        <div className="bg-zinc-900 border border-white/5 rounded-3xl p-6">
          <p className="text-zinc-500 text-sm">Realtime Status</p>

          <h2 className="text-emerald-400 font-black text-2xl mt-2">
            ● ACTIVE
          </h2>
        </div>

        <div className="bg-zinc-900 border border-white/5 rounded-3xl p-6">
          <p className="text-zinc-500 text-sm">Latest Update</p>

          <h2 className="text-white font-bold mt-2">
            {notifications[0]
              ? new Date(notifications[0].created_at).toLocaleString("id-ID")
              : "-"}
          </h2>
        </div>
      </div>

      {/* LIST */}
      {notifications.length === 0 ? (
        <div className="bg-zinc-900 border border-white/5 rounded-3xl p-10 text-center">
          <div className="text-6xl mb-4">🔔</div>

          <h2 className="text-2xl font-black text-zinc-300">
            Belum Ada Notifikasi
          </h2>

          <p className="text-zinc-500 mt-3">
            Notifikasi baru akan muncul di sini secara realtime.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {notifications.map((notif) => (
            <div
              key={notif.id}
              className="
              bg-gradient-to-b
              from-zinc-900
              to-black
              border
              border-white/5
              rounded-3xl
              p-6
              hover:border-amber-300/20
              transition-all
            "
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-black text-amber-300">
                    {notif.title}
                  </h2>

                  <p className="text-zinc-300 mt-3 leading-relaxed">
                    {notif.message}
                  </p>
                </div>

                <div className="text-3xl">🔔</div>
              </div>

              <div className="mt-5 pt-4 border-t border-white/5">
                <p className="text-zinc-500 text-sm">
                  {new Date(notif.created_at).toLocaleString("id-ID")}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}

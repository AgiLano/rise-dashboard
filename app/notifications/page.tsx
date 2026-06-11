"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    async function getNotifications() {
      const { data } = await supabase
        .from("notifications")
        .select("*")
        .order("created_at", {
          ascending: false,
        });

      setNotifications(data || []);
    }

    getNotifications();
  }, []);

  return (
    <div className="min-h-screen bg-black text-white p-10">
      <h1 className="text-4xl font-black text-amber-300">Notifications</h1>

      <p className="text-zinc-400 mt-3 mb-8">Notification Center RISE</p>

      <div className="space-y-4">
        {notifications.map((notif) => (
          <div
            key={notif.id}
            className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5"
          >
            <h2 className="font-bold text-amber-300">{notif.title}</h2>

            <p className="text-zinc-300 mt-2">{notif.message}</p>

            <p className="text-zinc-500 text-sm mt-3">
              {new Date(notif.created_at).toLocaleString("id-ID")}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

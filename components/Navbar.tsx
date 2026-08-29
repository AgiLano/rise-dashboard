"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();

  const [isAdmin, setIsAdmin] = useState(false);
  const [isMember, setIsMember] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);

  useEffect(() => {
    const handleNotificationsRead = () => {
      setNotificationCount(0);
    };

    window.addEventListener("notifications-read", handleNotificationsRead);
    async function loadUser() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      setIsAdmin(!!session);

      const member = localStorage.getItem("rise_member");

      setIsMember(!!member);
    }

    loadUser();

    async function loadNotifications() {
      const { count } = await supabase
        .from("notifications")
        .select("*", {
          count: "exact",
          head: true,
        })
        .eq("is_read", false);
      setNotificationCount(count || 0);
    }

    loadNotifications();

    const channel = supabase
      .channel("navbar-notifications")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
        },
        async () => {
          console.log("Realtime event received");
          const { count } = await supabase
            .from("notifications")
            .select("*", {
              count: "exact",
              head: true,
            })
            .eq("is_read", false);

          setNotificationCount(count || 0);
        },
      )
      .subscribe();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAdmin(!!session);
    });

    return () => {
      subscription.unsubscribe();

      supabase.removeChannel(channel);

      window.removeEventListener("notifications-read", handleNotificationsRead);
    };
  }, []);

  async function handleLogout() {
    try {
      if (isAdmin) {
        await supabase.auth.signOut();

        router.push("/login");
        router.refresh();

        return;
      }

      if (isMember) {
        localStorage.removeItem("rise_member");

        router.push("/login");
        router.refresh();

        return;
      }
    } catch (error) {
      console.error(error);
    }
  }

  return (
    <div className="w-full border-b border-zinc-800 bg-black sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-3 py-3 md:px-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          {/* LOGO */}
          <div className="flex items-center gap-3 shrink-0">
            <img
              src="/logo-navbar.png"
              alt="RISE"
              className="w-11 h-11 md:w-14 md:h-14 rounded-full border-2 border-yellow-400 shadow-lg shadow-yellow-400/20 object-contain bg-black p-1"
            />

            <div>
              <h1 className="text-lg md:text-2xl font-black text-yellow-400 tracking-wide">
                RISE
              </h1>

              <p className="text-[11px] md:text-xs text-zinc-500">
                Ritel Society
              </p>
            </div>
          </div>

          {/* MENU */}
          <div className="flex w-full flex-wrap items-center gap-2 md:w-auto md:flex-nowrap">
            <Link
              href="/"
              className={`px-3 py-2 text-xs md:px-5 md:text-base rounded-xl font-bold transition-all whitespace-nowrap ${
                pathname === "/"
                  ? "bg-yellow-400 text-black"
                  : "bg-zinc-900 text-white hover:bg-zinc-800"
              }`}
            >
              Dashboard
            </Link>

            {isAdmin && (
              <Link
                href="/admin"
                className={`px-3 py-2 text-xs md:px-5 md:text-base rounded-xl font-bold transition-all whitespace-nowrap ${
                  pathname === "/admin"
                    ? "bg-yellow-400 text-black"
                    : "bg-zinc-900 text-white hover:bg-zinc-800"
                }`}
              >
                Admin Panel
              </Link>
            )}

            <Link
              href="/history"
              className={`px-3 py-2 text-xs md:px-5 md:text-base rounded-xl font-bold transition-all whitespace-nowrap ${
                pathname === "/history"
                  ? "bg-yellow-400 text-black"
                  : "bg-zinc-900 text-white hover:bg-zinc-800"
              }`}
            >
              History Recap
            </Link>

            <Link
              href="/notifications"
              className={`relative px-3 py-2 text-xs md:px-5 md:text-base rounded-xl font-bold transition-all whitespace-nowrap ${
                pathname === "/notifications"
                  ? "bg-yellow-400 text-black"
                  : "bg-zinc-900 text-white hover:bg-zinc-800"
              }`}
            >
              🔔 Notifications
              {notificationCount > 0 && (
                <span
                  className="
                  absolute
                  -top-2
                  -right-2
                  min-w-[20px]
                  h-[20px]
                  px-1
                  rounded-full
                  bg-red-500
                  text-white
                  text-[10px]
                  font-black
                  flex
                  items-center
                  justify-center
                  shadow-lg
                "
                >
                  {notificationCount}
                </span>
              )}
            </Link>

            {(isAdmin || isMember) && (
              <button
                onClick={handleLogout}
                className="
                px-3
                py-2
                text-xs
                md:px-5
                md:text-base
                rounded-xl
                font-bold
                bg-red-900/40
                border
                border-red-500/30
                text-red-300
                hover:bg-red-900/60
                transition-all
                whitespace-nowrap
              "
              >
                Logout
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

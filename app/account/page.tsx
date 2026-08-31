"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

type Member = {
  id: number;
  nama: string;
  discord_username?: string;
  discord_user_id?: string;
  paket?: string;
  member_type?: string;
  end_date?: string;
};

export default function AccountPage() {
  const router = useRouter();

  const [member, setMember] = useState<Member | null>(null);
  const [daysLeft, setDaysLeft] = useState(0);

  useEffect(() => {
    const savedMember = localStorage.getItem("rise_member");

    if (!savedMember) {
      router.push("/login");
      return;
    }

    try {
      const parsedMember = JSON.parse(savedMember);

      setMember(parsedMember);

      if (parsedMember.end_date) {
        const today = new Date();
        const endDate = new Date(parsedMember.end_date);

        today.setHours(0, 0, 0, 0);
        endDate.setHours(0, 0, 0, 0);

        const difference = endDate.getTime() - today.getTime();

        const days = Math.ceil(difference / (1000 * 60 * 60 * 24));

        setDaysLeft(days);
      }
    } catch (error) {
      console.error("Gagal membaca data member:", error);
      router.push("/login");
    }
  }, [router]);

  if (!member) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center">
        Loading...
      </main>
    );
  }

  const isExpired = daysLeft <= 0;

  const membershipStatus = isExpired
    ? "EXPIRED"
    : daysLeft <= 3
      ? "HAMPIR BERAKHIR"
      : daysLeft <= 7
        ? "AKAN BERAKHIR"
        : "ACTIVE";

  const statusColor = isExpired
    ? "text-red-400 bg-red-500/10 border-red-500/30"
    : daysLeft <= 3
      ? "text-orange-400 bg-orange-500/10 border-orange-500/30"
      : daysLeft <= 7
        ? "text-yellow-400 bg-yellow-500/10 border-yellow-500/30"
        : "text-emerald-400 bg-emerald-500/10 border-emerald-500/30";

  const formattedEndDate = member.end_date
    ? new Date(member.end_date).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "-";

  return (
    <main className="min-h-screen bg-black text-white px-4 py-6 sm:px-6 md:px-8 md:py-10">
      <div className="max-w-4xl mx-auto w-full">
        {/* HEADER */}
        <div className="flex items-start justify-between gap-4 mb-6 md:mb-8">
          <div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-yellow-400 tracking-wide">
              MY ACCOUNT
            </h1>

            <p className="text-zinc-500 mt-2">
              Informasi akun dan membership RISE
            </p>
          </div>

          <button
            onClick={() => router.push("/")}
            className="
    group
    shrink-0
    w-12
    h-12
    flex
    items-center
    justify-center
    rounded-2xl
    bg-zinc-900
    border
    border-zinc-800
    text-zinc-400
    hover:text-yellow-400
    hover:border-yellow-400/40
    hover:bg-yellow-400/5
    transition-all
    duration-300
    hover:scale-105
    active:scale-95
    shadow-lg
  "
            title="Kembali ke Dashboard"
          >
            <ArrowLeft
              size={21}
              strokeWidth={2.5}
              className="
      transition-transform
      duration-300
      group-hover:-translate-x-1
    "
            />
          </button>
        </div>

        {/* PROFILE */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 md:p-6 mb-6">
          <p className="text-sm text-zinc-500 mb-2">MEMBER</p>

          <h2 className="text-2xl md:text-3xl font-black">{member.nama}</h2>

          <p className="text-zinc-400 mt-2">
            Discord: {member.discord_username || "-"}
          </p>
        </div>

        {/* MEMBERSHIP CARD */}
        <div className="relative overflow-hidden rounded-2xl md:rounded-3xl border border-yellow-400/20 bg-gradient-to-br from-zinc-900 via-zinc-900 to-yellow-400/5 p-5 sm:p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
            <div>
              <p className="text-sm font-bold text-zinc-500 tracking-widest">
                💎 MEMBERSHIP
              </p>

              <h2 className="text-3xl md:text-4xl font-black text-yellow-400 mt-3">
                {member.paket || "MEMBERSHIP"}
              </h2>

              <div
                className={`inline-flex mt-4 px-4 py-2 rounded-full border text-sm font-black ${statusColor}`}
              >
                ● {membershipStatus}
              </div>
            </div>

            <div className="md:text-right">
              <p className="text-sm text-zinc-500">SISA MASA AKTIF</p>

              <p
                className={`text-4xl sm:text-5xl md:text-6xl font-black mt-2 ${
                  isExpired
                    ? "text-red-400"
                    : daysLeft <= 7
                      ? "text-yellow-400"
                      : "text-emerald-400"
                }`}
              >
                {isExpired ? 0 : daysLeft}
              </p>

              <p className="text-sm text-zinc-500 mt-1">HARI</p>
            </div>
          </div>

          <div className="border-t border-zinc-800 mt-8 pt-6">
            <p className="text-sm text-zinc-500">BERAKHIR PADA</p>

            <p className="text-xl font-bold mt-2">{formattedEndDate}</p>
          </div>
        </div>

        {/* REMINDER */}
        {daysLeft <= 7 && (
          <div
            className={`mt-6 rounded-2xl border p-5 ${
              isExpired
                ? "bg-red-500/10 border-red-500/30"
                : "bg-yellow-500/10 border-yellow-500/30"
            }`}
          >
            <p className="font-bold">
              {isExpired
                ? "🔴 Membership Anda telah berakhir."
                : `⚠️ Membership Anda akan berakhir dalam ${daysLeft} hari.`}
            </p>

            <p className="w-full mt-6 bg-indigo-600 hover:bg-indigo-500 active:scale-[0.98] transition-all py-4 px-4 rounded-xl md:rounded-2xl font-black text-sm sm:text-base md:text-lg flex items-center justify-center text-center">
              Hubungi Admin RISE untuk informasi perpanjangan membership.
            </p>
          </div>
        )}

        {/* CONTACT ADMIN */}
        <a
          href="https://discord.com/users/579321767814758401"
          target="_blank"
          rel="noopener noreferrer"
          className="w-full mt-6 bg-indigo-600 hover:bg-indigo-500 transition-all py-4 rounded-2xl font-black text-lg flex items-center justify-center"
        >
          💬 HUBUNGI ADMIN RISE
        </a>
      </div>
    </main>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function MemberLoginPage() {
  const router = useRouter();

  const [discordId, setDiscordId] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    try {
      setLoading(true);

      const { data: member, error } = await supabase
        .from("members")
        .select("*")
        .eq("discord_id", discordId)
        .single();

      if (error || !member) {
        alert("Member tidak ditemukan");
        return;
      }

      if (member.password !== password) {
        alert("Password salah");
        return;
      }

      if (member.status !== "ACTIVE") {
        alert("Membership tidak aktif");
        return;
      }

      localStorage.setItem(
        "rise_member",
        JSON.stringify({
          id: member.id,
          nama: member.nama,
          discord_id: member.discord_id,
          paket: member.paket,
          end_date: member.end_date,
        }),
      );

      router.push("/member");
    } catch (err) {
      console.error(err);

      alert("Terjadi kesalahan saat login");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-black flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl p-8">
        <h1 className="text-4xl font-bold text-emerald-400 mb-2">
          MEMBER LOGIN
        </h1>

        <p className="text-zinc-400 mb-8">Login menggunakan Discord ID</p>

        <div className="space-y-4">
          <input
            type="text"
            placeholder="Discord ID"
            value={discordId}
            onChange={(e) => setDiscordId(e.target.value)}
            className="w-full bg-black border border-zinc-700 rounded-2xl px-5 py-4 text-white"
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-black border border-zinc-700 rounded-2xl px-5 py-4 text-white"
          />

          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full bg-emerald-500 hover:bg-emerald-400 transition-all text-black font-bold py-4 rounded-2xl disabled:opacity-50"
          >
            {loading ? "LOADING..." : "LOGIN MEMBER"}
          </button>
        </div>
      </div>
    </main>
  );
}

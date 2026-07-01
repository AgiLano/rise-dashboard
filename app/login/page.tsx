"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();

    try {
      setLoading(true);

      // =========================
      // COBA LOGIN ADMIN DULU
      // =========================

      await supabase.auth.signOut();

      const { error: adminError } = await supabase.auth.signInWithPassword({
        email: username,
        password,
      });

      if (!adminError) {
        router.push("/");
        router.refresh();
        return;
      }

      // =========================
      // COBA LOGIN MEMBER
      // =========================

      const { data: member, error: memberError } = await supabase
        .from("members")
        .select("*")
        .eq("discord_id", username)
        .single();

      if (memberError || !member) {
        alert("Username / Password salah");
        return;
      }

      if (member.password !== password) {
        alert("Username / Password salah");
        return;
      }

      if (!member.is_active) {
        alert("Membership telah dinonaktifkan oleh Admin.");
        return;
      }

      const today = new Date();

      const expiredDate = new Date(member.end_date);

      if (expiredDate < today) {
        alert("Membership Anda telah berakhir.");
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

      router.push("/");
      router.refresh();
    } catch (err) {
      console.error(err);

      alert("Terjadi kesalahan saat login");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-black flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl p-8 shadow-2xl">
        <div className="flex flex-col items-center mb-8">
          <img
            src="/logo-navbar.png"
            alt="RISE"
            className="w-24 h-24 rounded-full border-2 border-yellow-400 p-2 bg-black"
          />

          <h1 className="text-4xl font-black text-yellow-400 mt-5">RISE</h1>

          <p className="text-zinc-400 mt-2 text-center">
            Masuk ke Dashboard Ritel Society
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <input
            type="text"
            placeholder="Username / Discord ID"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full bg-black border border-zinc-700 rounded-2xl px-5 py-4 text-white outline-none focus:border-yellow-400 transition-all"
            required
          />

          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-black border border-zinc-700 rounded-2xl px-5 py-4 pr-14 text-white outline-none focus:border-yellow-400 transition-all"
              required
            />

            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
            >
              {showPassword ? <EyeOff size={22} /> : <Eye size={22} />}
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-yellow-400 hover:bg-yellow-300 transition-all text-black font-bold py-4 rounded-2xl disabled:opacity-50"
          >
            {loading ? "LOADING..." : "AKSES DASHBOARD"}
          </button>
        </form>
      </div>
    </main>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { supabase } from "../lib/supabase";

import { toast } from "sonner";

import Navbar from "@/components/Navbar";

import TradingChart from "@/components/charts/TradingChart";

import TradingViewWidget from "@/components/TradingViewWidget";

import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  PieChart,
  Pie,
  Cell,
  Legend,
  Label,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

export default function Home() {
  const router = useRouter();

  const [signals, setSignals] = useState<any[]>([]);

  const [checkingAuth, setCheckingAuth] = useState(true);

  const [search, setSearch] = useState("");

  const [statusFilter, setStatusFilter] = useState("ALL");

  const [typeFilter, setTypeFilter] = useState("ALL");

  const [avgAwal, setAvgAwal] = useState("");
  const [lotAwal, setLotAwal] = useState("");

  const [avgDown, setAvgDown] = useState("");
  const [lotTambahan, setLotTambahan] = useState("");

  const [hasilAvg, setHasilAvg] = useState(0);
  const [totalLot, setTotalLot] = useState(0);
  const [totalModal, setTotalModal] = useState(0);

  // =========================
  // COLLAPSIBLE
  // =========================

  const [openSections, setOpenSections] = useState({
    haka: true,
    bsjp: true,
    sniperan: true,
    swing: true,
  });
  function toggleSection(section: keyof typeof openSections) {
    setOpenSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  }

  function hitungAvgDown() {
    const harga1 = Number(avgAwal);
    const lot1 = Number(lotAwal);

    const harga2 = Number(avgDown);
    const lot2 = Number(lotTambahan);

    if (!harga1 || !lot1 || !harga2 || !lot2) {
      return;
    }

    const totalLembar1 = lot1 * 100;
    const totalLembar2 = lot2 * 100;

    const feeBuy = 0.0015;

    const modal1 = harga1 * totalLembar1 * (1 + feeBuy);

    const modal2 = harga2 * totalLembar2 * (1 + feeBuy);

    const totalModalSemua = modal1 + modal2;

    const totalLotSemua = lot1 + lot2;

    const totalLembarSemua = totalLotSemua * 100;

    const avgBaru = totalModalSemua / totalLembarSemua;

    setHasilAvg(Number(avgBaru.toFixed(2)));
    setTotalLot(totalLotSemua);
    setTotalModal(totalModalSemua);
  }

  // =========================
  // FETCH SIGNALS
  // =========================

  async function getSignals() {
    const { data } = await supabase
      .from("signals")
      .select("*")
      .order("tanggal_signal", {
        ascending: false,
      });

    setSignals(data || []);
  }

  // =========================
  // REALTIME
  // =========================

  useEffect(() => {
    async function checkAccess() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const member = localStorage.getItem("rise_member");

      console.log("SESSION =", session);
      console.log("MEMBER =", member);

      if (!session && !member) {
        router.push("/login");
        return;
      }

      setCheckingAuth(false);
    }

    checkAccess();
  }, [router]);

  useEffect(() => {
    getSignals();

    const channel = supabase
      .channel("signals-channel")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "signals",
        },
        (payload: any) => {
          // NOTIFICATION INSERT
          if (payload.eventType === "INSERT") {
            toast.success("📈 SIGNAL BARU", {
              description: `${payload.new.emiten} masuk ${payload.new.trading_type}`,
            });
          }

          // NOTIFICATION UPDATE
          if (payload.eventType === "UPDATE") {
            toast.info("📝 SIGNAL DIPERBARUI", {
              description: `${payload.new.emiten} berhasil diperbarui`,
            });
          }

          // NOTIFICATION DELETE
          if (payload.eventType === "DELETE") {
            toast.error("📈 SIGNAL DIHAPUS", {
              description: `${payload.old.emiten} telah dihapus`,
            });
          }

          getSignals();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // =========================
  // FILTER
  // =========================

  const filteredSignals = signals.filter((signal) => {
    const cocokSearch = signal.emiten
      ?.toLowerCase()
      .includes(search.toLowerCase());

    const cocokStatus =
      statusFilter === "ALL" ? true : signal.status === statusFilter;
    const cocokType =
      typeFilter === "ALL" ? true : signal.trading_type === typeFilter;
    return cocokSearch && cocokStatus && cocokType;
  });

  // =========================
  // CATEGORY
  // =========================

  const hakaSignals = filteredSignals.filter(
    (s) => s.trading_type === "HAKA PREOPEN",
  );

  const bsjpSignals = filteredSignals.filter((s) => s.trading_type === "BSJP");

  const sniperanSignals = filteredSignals.filter(
    (s) => s.trading_type === "SNIPERAN",
  );

  const swingSignals = filteredSignals.filter(
    (s) => s.trading_type === "SWING",
  );

  // =========================
  // STATS
  // =========================

  const totalSignals = filteredSignals.length;

  const totalRunning = filteredSignals.filter(
    (s) => s.status === "RUNNING",
  ).length;

  const totalDone = filteredSignals.filter((s) => s.status === "DONE").length;

  const winrate =
    totalSignals > 0 ? ((totalDone / totalSignals) * 100).toFixed(1) : "0";

  const avgProfit =
    filteredSignals.length > 0
      ? (
          filteredSignals.reduce(
            (acc, curr) => acc + Number(curr.profit_percentage || 0),
            0,
          ) / filteredSignals.length
        ).toFixed(2)
      : "0";

  const typeStats = ["BSJP", "HAKA PREOPEN", "SNIPERAN", "SWING"].map(
    (type) => {
      const signalsByType = signals.filter((s) => s.trading_type === type);

      const doneByType = signalsByType.filter(
        (s) => s.status === "DONE",
      ).length;

      const winrate =
        signalsByType.length > 0
          ? ((doneByType / signalsByType.length) * 100).toFixed(1)
          : "0";

      return {
        type,
        total: signalsByType.length,
        winrate,
      };
    },
  );
  // =========================
  // CHART DATA
  // =========================

  const chartData = filteredSignals
    .filter((s) => s.profit_percentage !== null)
    .map((signal) => ({
      name: signal.emiten,
      profit: Number(signal.profit_percentage || 0),
    }))
    .reverse();

  const tradingChartData = filteredSignals
    .filter((s) => s.profit_percentage !== null && s.done_date)
    .sort(
      (a, b) =>
        new Date(a.done_date).getTime() - new Date(b.done_date).getTime(),
    )
    .map((signal, index) => ({
      time: new Date(new Date(signal.done_date).getTime() + index * 1000)
        .toISOString()
        .split("T")[0],

      value: Number(signal.profit_percentage || 0),
    }));

  const pieData = [
    {
      name: "DONE",
      value: totalDone,
    },
    {
      name: "RUNNING",
      value: totalRunning,
    },
  ];

  const COLORS = ["#34d399", "#fb7185"];

  const monthlyData = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "Mei",
    "Jun",
    "Jul",
    "Agu",
    "Sep",
    "Okt",
    "Nov",
    "Des",
  ].map((month, index) => {
    const monthlySignals = signals.filter((signal) => {
      if (!signal.done_date) return false;

      const signalMonth = new Date(signal.done_date).getMonth();

      return signalMonth === index;
    });

    const totalProfit = monthlySignals.reduce(
      (acc, curr) => acc + Number(curr.profit_percentage || 0),
      0,
    );

    return {
      month,
      profit: Number(totalProfit.toFixed(2)),
    };
  });

  const bestEmitens = Object.values(
    signals.reduce((acc: any, signal) => {
      const emiten = signal.emiten || "UNKNOWN";

      if (!acc[emiten]) {
        acc[emiten] = {
          emiten,
          totalProfit: 0,
        };
      }

      acc[emiten].totalProfit += Number(signal.profit_percentage || 0);

      return acc;
    }, {}),
  )
    .sort((a: any, b: any) => b.totalProfit - a.totalProfit)
    .slice(0, 3);

  // =========================
  // FORMAT DATE
  // =========================

  function formatDate(date: string) {
    if (!date) return "-";

    return new Date(date).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }

  // =========================
  // RENDER SIGNALS
  // =========================

  function renderSignals(data: any[]) {
    if (data.length === 0) {
      return <div className="text-zinc-500">Tidak ada signal</div>;
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-5">
        {data.map((signal) => (
          <div
            key={signal.id}
            className="bg-gradient-to-b from-zinc-900 to-black border border-white/5 rounded-3xl p-5 hover:border-white/10 hover:shadow-[0_0_30px_rgba(252,211,77,0.08)] hover:-translate-y-1 transition-all duration-300"
          >
            {/* HEADER */}
            <div className="flex justify-between items-start mb-5">
              <div>
                <h2 className="text-4xl md:text-5xl font-black tracking-tight text-amber-300 drop-shadow-[0_0_6px_rgba(252,211,77,0.04)]">
                  {signal.emiten}
                </h2>

                <p className="text-zinc-400 mt-2 text-sm md:text-base">
                  {signal.trading_type}
                </p>
              </div>

              <span
                className={`px-4 py-2 rounded-full font-bold text-xs md:text-sm border ${
                  signal.status === "DONE"
                    ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/10 shadow-[0_0_15px_rgba(16,185,129,0.08)]"
                    : "bg-rose-500/10 text-rose-300 border-rose-500/10 shadow-[0_0_15px_rgba(244,63,94,0.08)]"
                }`}
              >
                {signal.status}
              </span>
            </div>

            {/* DATA */}
            <div className="space-y-3 text-sm md:text-base">
              <div className="flex items-center justify-between gap-3">
                <p className="text-zinc-400">
                  Entry 1:{" "}
                  <span className="font-black text-zinc-100">
                    {signal.entry_1 || "-"}
                  </span>
                </p>

                <p className="text-xs text-zinc-500 whitespace-nowrap">
                  {formatDate(signal.entry_1_date)}
                </p>
              </div>

              <div className="flex items-center justify-between gap-3">
                <p className="text-zinc-400">
                  Entry 2:{" "}
                  <span className="font-black text-zinc-100">
                    {signal.entry_2 || "-"}
                  </span>
                </p>

                <p className="text-xs text-zinc-500 whitespace-nowrap">
                  {signal.entry_2 ? formatDate(signal.entry_2_date) : "-"}
                </p>
              </div>
              <div className="flex items-center justify-between gap-3">
                <p className="text-zinc-400">
                  Entry 3:{" "}
                  <span className="font-black text-zinc-100">
                    {signal.entry_3 || "-"}
                  </span>
                </p>

                <p className="text-xs text-zinc-500 whitespace-nowrap">
                  {signal.entry_3 ? formatDate(signal.entry_3_date) : "-"}
                </p>
              </div>

              <p className="text-zinc-400">
                AVG:{" "}
                <span className="font-black text-zinc-100">
                  {signal.avg || "-"}
                </span>
              </p>

              <>
                <p className="text-zinc-400">
                  TP1:{" "}
                  <span className="font-black text-zinc-100">
                    {signal.tp_1 || "-"}
                  </span>
                </p>

                <p className="text-zinc-400">
                  TP2:{" "}
                  <span className="font-black text-zinc-100">
                    {signal.tp_2 || "-"}
                  </span>
                </p>

                <p className="text-zinc-400">
                  TP3:{" "}
                  <span className="font-black text-zinc-100">
                    {signal.tp_3 || "-"}
                  </span>
                </p>
              </>

              <p className="text-zinc-400">
                High Price:{" "}
                <span className="font-black text-zinc-100">
                  {signal.high_price || "-"}
                </span>
              </p>

              <p className="text-zinc-400">
                Profit:{" "}
                <span
                  className={`font-black tracking-tight ${
                    Number(signal.profit_percentage || 0) < 0
                      ? "text-rose-400"
                      : Number(signal.profit_percentage || 0) > 0
                        ? "text-emerald-400"
                        : "text-zinc-100"
                  }`}
                >
                  {signal.profit_percentage || 0}%
                </span>
              </p>
            </div>
            {/* DATE */}
            <div className="pt-4 border-t border-white/5 mt-5">
              <p className="text-zinc-400 text-sm">
                Signal Date: {formatDate(signal.tanggal_signal)}
              </p>

              <p className="text-zinc-400 text-sm mt-1">
                Done Date:{" "}
                {signal.status === "DONE" ? formatDate(signal.done_date) : "-"}
              </p>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // =========================
  // SECTION COMPONENT
  // =========================

  function renderSection(
    title: string,
    keyName: keyof typeof openSections,
    data: any[],
  ) {
    return (
      <section className="mb-10">
        <button
          onClick={() => toggleSection(keyName)}
          className="w-full flex items-center justify-between bg-gradient-to-b from-zinc-900 to-black border border-white/5 rounded-3xl p-5 shadow-[0_0_30px_rgba(0,0,0,0.25)] mb-5 hover:border-white/10 hover:shadow-[0_0_25px_rgba(252,211,77,0.05)] transition-all duration-300"
        >
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-zinc-100 text-left tracking-tight">
              {title}
            </h2>

            <p className="text-zinc-400 mt-1 text-left text-sm md:text-base">
              {data.length} Signals
            </p>
          </div>

          <span className="text-xl md:text-2xl font-semibold text-zinc-400">
            {openSections[keyName] ? "−" : "+"}
          </span>
        </button>

        {openSections[keyName] && renderSignals(data)}
      </section>
    );
  }
  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-white">
        Loading...
      </div>
    );
  }

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-gradient-to-b from-black via-zinc-950 to-black text-white pt-6 md:pt-10 p-4 md:p-10">
        {/* HEADER */}
        <div className="mb-5">
          <h1 className="text-3xl md:text-5xl font-black leading-none text-amber-300 drop-shadow-[0_0_6px_rgba(252,211,77,0.04)]">
            RISE
            <br />
            Dashboard
          </h1>

          <p className="text-zinc-400 mt-3 text-sm md:text-base">
            Realtime Trading Community Dashboard
          </p>
        </div>

        {/* SEARCH + FILTER */}
        <div className="flex flex-col md:flex-row gap-6 mb-10">
          {/* SEARCH */}
          <input
            type="text"
            placeholder="Search Emiten..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-gradient-to-b from-zinc-900 to-black border border-white/5 rounded-2xl px-4 py-3 w-full md:w-96 text-sm md:text-base focus:outline-none focus:border-amber-300/30 focus:shadow-[0_0_20px_rgba(252,211,77,0.08)] transition-all"
          />

          {/* FILTER */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-gradient-to-b from-zinc-900 to-black border border-white/5 rounded-2xl px-4 py-3 w-full md:w-64 text-sm md:text-base focus:outline-none focus:border-amber-300/30 transition-all"
          >
            <option value="ALL" className="bg-black text-white">
              ALL STATUS
            </option>

            <option value="RUNNING" className="bg-black text-white">
              RUNNING
            </option>

            <option value="DONE" className="bg-black text-white">
              DONE
            </option>
          </select>
          {/* TYPE FILTER */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-gradient-to-b from-zinc-900 to-black border border-white/5 rounded-2xl px-4 py-3 w-full md:w-64 text-sm md:text-base focus:outline-none focus:border-amber-300/30 transition-all"
          >
            <option value="ALL" className="bg-black text-white">
              ALL TYPE
            </option>

            <option value="BSJP" className="bg-black text-white">
              BSJP
            </option>

            <option value="HAKA PREOPEN" className="bg-black text-white">
              HAKA PREOPEN
            </option>

            <option value="SNIPERAN" className="bg-black text-white">
              SNIPERAN
            </option>

            <option value="SWING" className="bg-black text-white">
              SWING
            </option>
          </select>
        </div>

        {/* IHSG LIVE CHART */}
        <div className="mb-12">
          <div className="bg-gradient-to-b from-zinc-900 to-black border border-white/5 rounded-3xl p-5 md:p-8 shadow-[0_0_40px_rgba(0,0,0,0.25)]">
            <div className="mb-6">
              <h2 className="text-xl md:text-2xl font-black tracking-tight text-amber-300 drop-shadow-[0_0_6px_rgba(252,211,77,0.04)]">
                IHSG Live Market
              </h2>

              <p className="text-zinc-400 mt-2">Realtime IDX Composite Chart</p>
            </div>

            <TradingViewWidget />
          </div>
        </div>

        {/* STATS */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-6 mb-12">
          <div className="bg-gradient-to-b from-zinc-900 to-black rounded-3xl p-4 md:p-5 border border-white/5 shadow-[0_0_30px_rgba(0,0,0,0.25)]">
            <p className="text-zinc-500 text-xs md:text-sm uppercase tracking-wide">
              Total Signals
            </p>

            <h2 className="text-xl md:text-2xl font-black tracking-tight text-amber-300 drop-shadow-[0_0_6px_rgba(252,211,77,0.04)] mt-3">
              {totalSignals}
            </h2>
          </div>

          <div className="bg-gradient-to-b from-zinc-900 to-black rounded-3xl p-4 md:p-5 border border-white/5 shadow-[0_0_30px_rgba(0,0,0,0.25)]">
            <p className="text-zinc-500 text-xs md:text-sm uppercase tracking-wide">
              Running
            </p>

            <h2 className="text-xl md:text-2xl font-black tracking-tight text-rose-400 mt-3">
              {totalRunning}
            </h2>
          </div>

          <div className="bg-gradient-to-b from-zinc-900 to-black rounded-3xl p-4 md:p-5 border border-white/5 shadow-[0_0_30px_rgba(0,0,0,0.25)]">
            <p className="text-zinc-500 text-xs md:text-sm uppercase tracking-wide">
              Done
            </p>

            <h2 className="text-xl md:text-2xl font-black tracking-tight text-emerald-400 mt-3">
              {totalDone}
            </h2>
          </div>

          <div className="bg-gradient-to-b from-zinc-900 to-black rounded-3xl p-4 md:p-5 border border-white/5 shadow-[0_0_30px_rgba(0,0,0,0.25)]">
            <p className="text-zinc-500 text-xs md:text-sm uppercase tracking-wide">
              Winrate
            </p>

            <h2 className="text-xl md:text-2xl font-black tracking-tight text-blue-400 mt-3">
              {winrate}%
            </h2>
          </div>

          <div className="bg-gradient-to-b from-zinc-900 to-black rounded-3xl p-4 md:p-5 border border-white/5 shadow-[0_0_30px_rgba(0,0,0,0.25)]">
            <p className="text-zinc-500 text-xs md:text-sm uppercase tracking-wide">
              Avg Profit
            </p>

            <h2 className="text-xl md:text-2xl font-black tracking-tight text-purple-400 mt-3">
              {avgProfit}%
            </h2>
          </div>
        </div>

        {/* WINRATE PER TYPE */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          {typeStats.map((item) => (
            <div
              key={item.type}
              className="bg-gradient-to-b from-zinc-900 to-black border border-white/5 rounded-3xl p-5 shadow-[0_0_30px_rgba(0,0,0,0.25)] hover:border-white/10 hover:-translate-y-1 transition-all duration-300"
            >
              <p className="text-zinc-400 text-sm">{item.type}</p>

              <h2 className="text-4xl font-black tracking-tight text-amber-300 drop-shadow-[0_0_6px_rgba(252,211,77,0.04)] mt-3">
                {item.winrate}%
              </h2>

              <p className="text-zinc-500 text-sm mt-2">{item.total} Signals</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start mb-12 min-w-0">
          {/* SIGNAL STATUS PIE CHART */}
          <div className="bg-gradient-to-b from-zinc-900 to-black border border-white/5 rounded-3xl p-5 md:p-8 shadow-[0_0_40px_rgba(0,0,0,0.25)]">
            <div className="mb-6">
              <h2 className="text-xl md:text-2xl font-black tracking-tight text-amber-300 drop-shadow-[0_0_6px_rgba(252,211,77,0.04)]">
                Signal Status
              </h2>

              <p className="text-zinc-400 mt-2">Running vs Done Analytics</p>
            </div>

            <div className="w-full min-w-0" style={{ height: 320 }}>
              <ResponsiveContainer width="100%" height={320}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={95}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {pieData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <text
                    x="50%"
                    y="48%"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="fill-white"
                  >
                    <tspan
                      x="50%"
                      dy="-0.2em"
                      className="text-4xl font-black fill-amber-300"
                    >
                      {totalSignals}
                    </tspan>

                    <tspan x="50%" dy="1.8em" className="text-sm fill-zinc-400">
                      Total Signal
                    </tspan>
                  </text>

                  <Tooltip
                    contentStyle={{
                      background: "#09090b",
                      border: "1px solid rgba(255,255,255,0.08)",
                      borderRadius: "16px",
                      color: "#fff",
                    }}
                  />

                  <Legend
                    iconType="circle"
                    wrapperStyle={{
                      color: "#fff",
                      paddingTop: "20px",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* PROFIT CHART */}
          <div className="bg-gradient-to-br from-zinc-900 via-black to-zinc-950 border-white/5 rounded-3xl p-5 md:p-8 shadow-[0_0_60px_rgba(0,0,0,0.35)]">
            <div className="mb-6">
              <h2 className="text-xl md:text-2xl font-black tracking-tight text-amber-300 drop-shadow-[0_0_10px_rgba(252,211,77,0.08)]">
                Profit Performance
              </h2>

              <p className="text-zinc-400 mt-2">Market trend overview</p>
            </div>

            <div className="w-full h-[300px] min-w-0 overflow-hidden">
              <TradingChart data={tradingChartData} />
            </div>
          </div>
        </div>

        {/* MONTHLY PERFORMANCE */}
        <div className="bg-gradient-to-b from-zinc-900 to-black border border-white/5 rounded-3xl p-5 md:p-8 shadow-[0_0_40px_rgba(0,0,0,0.25)]">
          <div className="mb-6">
            <h2 className="text-xl md:text-2xl font-black tracking-tight text-amber-300 drop-shadow-[0_0_6px_rgba(252,211,77,0.04)]">
              Monthly Performance
            </h2>

            <p className="text-zinc-400 mt-2">Monthly profit analytics</p>
          </div>

          <div className="w-full min-w-0" style={{ height: 260 }}>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={monthlyData}>
                <CartesianGrid
                  strokeDasharray="1 10"
                  stroke="rgba(255,255,255,0.03)"
                  vertical={false}
                />

                <XAxis dataKey="month" stroke="#a1a1aa" />

                <YAxis stroke="#a1a1aa" />

                <Tooltip
                  cursor={{
                    stroke: "#2dd4bf",
                    strokeWidth: 1,
                    strokeDasharray: "5 5",
                  }}
                  contentStyle={{
                    background: "rgba(9,9,11,0.95)",
                    border: "1px solid rgba(45,212,191,0.15)",
                    borderRadius: "20px",
                    color: "#fff",
                    backdropFilter: "blur(10px)",
                    boxShadow: "0 0 12px rgba(45,212,191,0.05)",
                  }}
                />

                <Line
                  type="monotone"
                  dataKey="profit"
                  stroke="#2dd4bf"
                  strokeWidth={2.5}
                  dot={{
                    r: 5,
                    fill: "#2dd4bf",
                    strokeWidth: 0,
                  }}
                  activeDot={{
                    r: 7,
                    fill: "#2dd4bf",
                    stroke: "#fff",
                    strokeWidth: 2,
                  }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* TOP EMITEN */}
        <div className="bg-gradient-to-b from-zinc-900 to-black border border-white/5 rounded-3xl p-5 md:p-8 shadow-[0_0_40px_rgba(0,0,0,0.25)]">
          <div className="mb-6">
            <h2 className="text-xl md:text-2xl font-black tracking-tight text-amber-300 drop-shadow-[0_0_6px_rgba(252,211,77,0.04)]">
              Top Profit Emiten
            </h2>

            <p className="text-zinc-400 mt-2">Best performing stocks</p>
          </div>

          <div className="space-y-3">
            {bestEmitens.map((item: any, index) => (
              <div
                key={item.emiten}
                className="flex items-center justify-between bg-gradient-to-b from-zinc-900 to-black border border-white/5 rounded-2xl p-4 hover:border-white/10 hover:shadow-[0_0_25px_rgba(252,211,77,0.06)] transition-all"
              >
                <div className="flex items-center gap-6">
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-amber-300 text-black font-black flex items-center justify-center text-lg md:text-xl shadow-[0_0_20px_rgba(252,211,77,0.15)]">
                    {index + 1}
                  </div>

                  <div>
                    <h3 className="text-xl md:text-2xl font-black tracking-tight text-zinc-100">
                      {item.emiten}
                    </h3>

                    <p className="text-zinc-500 text-xs md:text-sm uppercase tracking-wide">
                      Top Performing Signal
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <h2 className="text-xl md:text-2xl font-black tracking-tight text-emerald-400">
                    +{item.totalProfit.toFixed(2)}%
                  </h2>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* AVG DOWN CALCULATOR */}
        <section className="mt-8 md:mt-12 mb-10">
          <div className="bg-gradient-to-b from-zinc-900 to-black border border-white/5 rounded-3xl p-4 md:p-6 max-w-5xl mx-auto shadow-[0_0_40px_rgba(0,0,0,0.25)]">
            <div className="mb-6">
              <h2 className="text-xl md:text-2xl font-black text-amber-300 drop-shadow-[0_0_6px_rgba(252,211,77,0.04)]">
                AVG DOWN
              </h2>

              <p className="text-zinc-400 mt-2">
                Kalkulator average down saham
              </p>
            </div>

            {/* INPUT */}
            <div className="grid grid-cols-2 gap-2 md:gap-6 mb-4">
              <input
                type="number"
                placeholder="Avg Awal"
                value={avgAwal}
                onChange={(e) => setAvgAwal(e.target.value)}
                className="bg-gradient-to-b from-black via-zinc-950 to-black border border-white/5 rounded-xl px-3 py-2 text-xs md:text-sm focus:outline-none focus:border-amber-300/30 focus:shadow-[0_0_20px_rgba(252,211,77,0.08)] transition-all"
              />

              <input
                type="number"
                placeholder="Lot Awal"
                value={lotAwal}
                onChange={(e) => setLotAwal(e.target.value)}
                className="bg-gradient-to-b from-black via-zinc-950 to-black border border-white/5 rounded-xl px-3 py-2 text-xs md:text-sm focus:outline-none focus:border-amber-300/30 focus:shadow-[0_0_20px_rgba(252,211,77,0.08)] transition-all"
              />

              <input
                type="number"
                placeholder="Harga Avg Down"
                value={avgDown}
                onChange={(e) => setAvgDown(e.target.value)}
                className="bg-gradient-to-b from-black via-zinc-950 to-black border border-white/5 rounded-xl px-3 py-2 text-xs md:text-sm focus:outline-none focus:border-amber-300/30 focus:shadow-[0_0_20px_rgba(252,211,77,0.08)] transition-all"
              />

              <input
                type="number"
                placeholder="Lot Tambahan"
                value={lotTambahan}
                onChange={(e) => setLotTambahan(e.target.value)}
                className="bg-gradient-to-b from-black via-zinc-950 to-black border border-white/5 rounded-xl px-3 py-2 text-xs md:text-sm focus:outline-none focus:border-amber-300/30 focus:shadow-[0_0_20px_rgba(252,211,77,0.08)] transition-all"
              />
            </div>

            {/* BUTTON */}
            <button
              onClick={hitungAvgDown}
              className="w-full bg-amber-300 hover:bg-amber-200 text-black font-bold rounded-xl py-2.5 text-sm transition-all duration-300 hover:shadow-[0_0_25px_rgba(252,211,77,0.15)] mb-4"
            >
              HITUNG AVG
            </button>

            {/* RESULT */}
            <div className="bg-gradient-to-b from-black via-zinc-950 to-black border border-white/5 rounded-2xl p-4 shadow-[0_0_25px_rgba(0,0,0,0.25)]">
              <p className="text-zinc-400 text-sm">AVG BARU</p>

              <h2 className="text-xl md:text-2xl font-black text-amber-300 drop-shadow-[0_0_6px_rgba(252,211,77,0.04)] mt-1">
                {hasilAvg || 0}
              </h2>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-4">
                <div>
                  <p className="text-zinc-500 text-sm">Total Lot</p>

                  <h3 className="text-lg md:text-2xl font-black tracking-tight">
                    {totalLot}
                  </h3>
                </div>

                <div>
                  <p className="text-zinc-500 text-sm">Total Modal</p>

                  <h3 className="text-lg md:text-2xl font-black tracking-tight text-emerald-400">
                    Rp {totalModal.toLocaleString("id-ID")}
                  </h3>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTIONS */}
        {renderSection("HAKA PREOPEN", "haka", hakaSignals)}

        {renderSection("BSJP", "bsjp", bsjpSignals)}

        {renderSection("SNIPERAN", "sniperan", sniperanSignals)}

        {renderSection("SWING", "swing", swingSignals)}
      </main>
    </>
  );
}

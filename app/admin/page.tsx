"use client";

import Navbar from "@/components/Navbar";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";
import toast from "react-hot-toast";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import MiniTradingView from "@/components/MiniTradingView";

export default function AdminPage() {
  const router = useRouter();

  // =========================
  // AUTH
  // =========================

  const [checkingAuth, setCheckingAuth] = useState(true);

  // =========================
  // SIGNAL STATE
  // =========================

  const [signals, setSignals] = useState<any[]>([]);

  const [selectedSignal, setSelectedSignal] = useState<any>(null);

  const [signalHistory, setSignalHistory] = useState<any[]>([]);

  const [search, setSearch] = useState("");

  const [statusFilter, setStatusFilter] = useState("ALL");

  const [typeFilter, setTypeFilter] = useState("ALL");
  // =========================
  // FORM STATE
  // =========================

  const [emiten, setEmiten] = useState("");
  const [currentMarket, setCurrentMarket] = useState({
    price: "LIVE",
    change: "+0.00%",
    open: "-",
    high: "-",
    low: "-",
    volume: "-",
  });

  const [tradingType, setTradingType] = useState("");

  const [entry1, setEntry1] = useState("");

  const [signalDate, setSignalDate] = useState<Date | null>(new Date());

  const [entry1Date, setEntry1Date] = useState<Date | null>(new Date());

  const [entry2, setEntry2] = useState("");

  const [entry2Date, setEntry2Date] = useState<Date | null>(new Date());

  const [entry3, setEntry3] = useState("");

  const [entry3Date, setEntry3Date] = useState<Date | null>(new Date());

  const [doneDate, setDoneDate] = useState<Date | null>(new Date());

  const [avg, setAvg] = useState("");

  const [tp1, setTp1] = useState("");

  const [tp2, setTp2] = useState("");

  const [tp3, setTp3] = useState("");

  const [status, setStatus] = useState("RUNNING");

  const [highPrice, setHighPrice] = useState("");

  const [profitPercentage, setProfitPercentage] = useState("");

  const [loading, setLoading] = useState(false);

  const [sendDiscord, setSendDiscord] = useState(true);

  const [mode, setMode] = useState<"SIGNAL" | "WATCHLIST">("SIGNAL");

  const [watchlistTitle, setWatchlistTitle] = useState("");

  const [watchlistStocks, setWatchlistStocks] = useState("");

  const [watchlistNotes, setWatchlistNotes] = useState("");

  const [editingId, setEditingId] = useState<number | null>(null);

  const currentTime = new Date().toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const currentDate = new Date().toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  useEffect(() => {
    const fetchMarket = async () => {
      try {
        const marketSymbol = !emiten ? "^JKSE" : emiten;

        const res = await fetch(`/api/market?symbol=${marketSymbol}`);
        const data = await res.json();

        setCurrentMarket({
          price: data.price?.toString() || "-",
          change:
            data.change !== undefined ? `${data.change.toFixed(2)}%` : "0.00%",
          open: data.open?.toString() || "-",
          high: data.high?.toString() || "-",
          low: data.low?.toString() || "-",
          volume: data.volume?.toLocaleString() || "-",
        });
      } catch (error) {
        console.log(error);
      }
    };

    fetchMarket();
  }, [emiten]);
  // =========================
  // AUTH CHECK
  // =========================

  useEffect(() => {
    async function checkUser() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.push("/login");
        return;
      }

      setCheckingAuth(false);
    }

    checkUser();
  }, [router]);

  // =========================
  // GET SIGNALS
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
  async function loadSignalHistory(signalId: number) {
    const { data, error } = await supabase
      .from("signals_updates")
      .select("*")
      .eq("signal_id", signalId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error(error);
      return;
    }

    console.log("HISTORY =", data);

    setSignalHistory(data || []);
  }

  // =========================
  // REALTIME
  // =========================

  useEffect(() => {
    getSignals();

    const channel = supabase
      .channel("admin-signals")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "signals",
        },
        () => {
          getSignals();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // =========================
  // HELPER
  // =========================

  function getTick(price: number) {
    if (price >= 50 && price < 200) return 1;

    if (price >= 200 && price < 500) return 2;

    if (price >= 500 && price < 2000) return 5;

    if (price >= 2000 && price < 5000) return 10;

    return 25;
  }

  function roundToTick(price: number) {
    const tick = getTick(price);

    return Math.ceil(price / tick) * tick;
  }

  // =========================
  // AUTO AVG
  // =========================

  useEffect(() => {
    const numbers = [
      Number(entry1 || 0),
      Number(entry2 || 0),
      Number(entry3 || 0),
    ].filter((n) => n > 0);

    if (numbers.length > 0) {
      const total = numbers.reduce((a, b) => a + b, 0);

      const average = total / numbers.length;

      setAvg(Number(average.toFixed(2)).toString());
    } else {
      setAvg("");
    }
  }, [entry1, entry2, entry3]);

  // =========================
  // AUTO TP1 (3%)
  // =========================

  useEffect(() => {
    if (!avg) {
      setTp1("");
      return;
    }

    const avgPrice = Number(avg);

    const target3Percent = avgPrice * 1.03;

    const finalTp1 = roundToTick(target3Percent);

    // console.log("AVG =", avg);
    // console.log("3% =", target3Percent);
    // console.log("FINAL TP =", finalTp1);

    setTp1(finalTp1.toString());
  }, [avg]);

  // =========================
  // AUTO PROFIT
  // =========================

  useEffect(() => {
    if (!avg || !highPrice) {
      setProfitPercentage("");
      return;
    }

    const result = ((Number(highPrice) - Number(avg)) / Number(avg)) * 100;

    setProfitPercentage(Number(result.toFixed(2)).toString());
  }, [avg, highPrice]);

  // =========================
  // SAVE SIGNAL
  // =========================

  function formatLocalDate(date: Date | null) {
    if (!date) return null;

    const year = date.getFullYear();

    const month = String(date.getMonth() + 1).padStart(2, "0");

    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  }

  async function saveSignal() {
    if (!emiten || !tradingType) {
      toast.error("Lengkapi data terlebih dahulu!");
      return;
    }
    if (status === "DONE" && !highPrice) {
      toast.error("High Price wajib diisi untuk status DONE!");
      return;
    }
    setLoading(true);

    let oldSignal: any = null;
    let updateEvent = "";
    let oldTp1 = null;
    let oldAvg = null;
    const payload = {
      tanggal_signal: formatLocalDate(signalDate),
      emiten: emiten.toUpperCase(),

      trading_type: tradingType,
      entry_1: entry1 ? Number(entry1) : null,
      entry_1_date: formatLocalDate(entry1Date),

      entry_2: entry2 ? Number(entry2) : null,
      entry_2_date: formatLocalDate(entry2Date),

      entry_3: entry3 ? Number(entry3) : null,
      entry_3_date: formatLocalDate(entry3Date),

      avg: Number(avg),

      tp: null,

      tp_1: tp1 ? Number(tp1) : null,

      tp_2: tp2 ? Number(tp2) : null,

      tp_3: tp3 ? Number(tp3) : null,

      status,

      done_date: status === "DONE" ? formatLocalDate(doneDate) : null,

      high_price: Number(highPrice),

      profit_percentage: Number(profitPercentage),
    };

    let error = null;

    // =========================
    // UPDATE
    // =========================

    if (editingId) {
      const { data: existingSignal } = await supabase
        .from("signals")
        .select("*")
        .eq("id", editingId)
        .single();

      oldSignal = existingSignal;
      oldTp1 = oldSignal?.tp_1 || null;
      oldAvg = oldSignal?.avg || null;
      updateEvent = "";

      if (oldSignal?.status !== "DONE" && payload.status === "DONE") {
        updateEvent = "TARGET_ACHIEVED";
      } else if (!oldSignal?.entry_3 && payload.entry_3) {
        updateEvent = "ENTRY_3_ADDED";
      } else if (!oldSignal?.entry_2 && payload.entry_2) {
        updateEvent = "ENTRY_2_ADDED";
      } else if (
        oldSignal?.tp_1 &&
        payload.tp_1 &&
        oldSignal.tp_1 !== payload.tp_1
      ) {
        updateEvent = "TP_REVISED";
      }

      const response = await supabase
        .from("signals")
        .update(payload)
        .eq("id", editingId);

      console.log("EDITING ID =", editingId);
      console.log("SIGNAL DATE =", signalDate);
      console.log("PAYLOAD =", payload);
      console.log("ERROR =", response.error);

      if (updateEvent) {
        let historyOldValue = "";
        let historyNewValue = "";
        if (updateEvent === "ENTRY_2_ADDED") {
          historyOldValue = `AVG ${oldAvg}`;
          historyNewValue = `AVG ${avg}`;
        }

        if (updateEvent === "ENTRY_3_ADDED") {
          historyOldValue = `AVG ${oldAvg}`;
          historyNewValue = `AVG ${avg}`;
        }

        if (updateEvent === "TP_REVISED") {
          historyOldValue = `TP1 ${oldTp1}`;
          historyNewValue = `TP1 ${tp1}`;
        }

        if (updateEvent === "TARGET_ACHIEVED") {
          historyOldValue = "RUNNING";
          historyNewValue = `DONE (${profitPercentage || 0}%)`;
        }
        let historyDate = formatLocalDate(signalDate);

        if (updateEvent === "ENTRY_2_ADDED") {
          historyDate = formatLocalDate(entry2Date);
        }

        if (updateEvent === "ENTRY_3_ADDED") {
          historyDate = formatLocalDate(entry3Date);
        }

        if (updateEvent === "TARGET_ACHIEVED") {
          historyDate = formatLocalDate(doneDate);
        }

        await supabase.from("signals_updates").insert([
          {
            signal_id: editingId,
            emiten: emiten,
            event_type: updateEvent,
            old_value: historyOldValue,
            new_value: historyNewValue,
            event_date: historyDate,
          },
        ]);
      }

      error = response.error;
    }

    // =========================
    // INSERT
    // =========================
    else {
      const response = await supabase
        .from("signals")
        .insert([
          {
            ...payload,
          },
        ])
        .select()
        .single();

      error = response.error;

      if (response.data) {
        await supabase.from("signals_updates").insert([
          {
            signal_id: response.data.id,
            emiten: emiten,
            event_type: "SIGNAL_CREATED",
            old_value: "-",
            new_value: `AVG ${avg}`,
            event_date: formatLocalDate(signalDate),
          },
        ]);
      }
    }

    setLoading(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success(
      editingId ? "Signal berhasil diupdate!" : "Signal berhasil disimpan!",
    );

    let discordTitle = "🚀 SIGNAL BARU RISE";

    let discordColor = 0xeab308;

    if (!editingId) {
      switch (tradingType) {
        case "HAKA PREOPEN":
          discordTitle = "🔥 HAKA PREOPEN";
          discordColor = 0xf97316;
          break;

        case "BSJP":
          discordTitle = "🎯 BSJP";
          discordColor = 0x22c55e;
          break;

        case "SNIPERAN":
          discordTitle = "⚡ SNIPERAN";
          discordColor = 0xef4444;
          break;

        case "SWING":
          discordTitle = "📈 SWING TRADE";
          discordColor = 0x3b82f6;
          break;
      }
    }

    let discordChannel = "ARAHAN";

    if (status === "DONE") {
      discordChannel = "DONE";
    }

    if (!editingId) {
      switch (tradingType) {
        case "HAKA PREOPEN":
          discordChannel = "HAKA";
          break;

        case "SNIPERAN":
          discordChannel = "SNIPER";
          break;

        case "BSJP":
          discordChannel = "BSJP";
          break;

        case "SWING":
          discordChannel = "SWING";
          break;
      }
    }

    const isDoneDiscord = status === "DONE";

    const doneFields = [
      {
        name: "📈 Emiten",
        value: emiten,
        inline: true,
      },
      {
        name: "📊 Strategy",
        value: tradingType,
        inline: true,
      },
      {
        name: "📌 AVG",
        value: avg || "-",
        inline: true,
      },
      {
        name: "🚀 Profit",
        value: `${profitPercentage || 0}%`,
        inline: true,
      },
      {
        name: "🎯 Highest Price",
        value: highPrice || "-",
        inline: true,
      },
      {
        name: "📅 Signal Date",
        value: formatLocalDate(signalDate) || "-",
        inline: true,
      },
      {
        name: "✅ Done Date",
        value: formatLocalDate(doneDate) || "-",
        inline: true,
      },
    ];

    const entry2Fields = [
      {
        name: "📈 Emiten",
        value: emiten,
        inline: true,
      },
      {
        name: "📊 Strategy",
        value: tradingType,
        inline: true,
      },
      {
        name: "💰 Entry 2 Baru",
        value: entry2 || "-",
        inline: true,
      },
      {
        name: "📌 AVG",
        value: `${oldAvg || "-"} ➜ ${avg || "-"}`,
        inline: true,
      },
      {
        name: "🎯 TP Saat Ini",
        value: tp1 || "-",
        inline: true,
      },
    ];

    const entry3Fields = [
      {
        name: "📈 Emiten",
        value: emiten,
        inline: true,
      },
      {
        name: "📊 Strategy",
        value: tradingType,
        inline: true,
      },
      {
        name: "💰 Entry 3 Baru",
        value: entry3 || "-",
        inline: true,
      },
      {
        name: "📌 AVG",
        value: `${oldAvg || "-"} ➜ ${avg || "-"}`,
        inline: true,
      },
      {
        name: "🎯 TP Saat Ini",
        value: tp1 || "-",
        inline: true,
      },
    ];

    const tpRevisedFields = [
      {
        name: "📈 Emiten",
        value: emiten,
        inline: true,
      },
      {
        name: "📊 Strategy",
        value: tradingType,
        inline: true,
      },
      {
        name: "🎯 TP Lama",
        value: oldTp1?.toString() || "-",
        inline: true,
      },
      {
        name: "🎯 TP Baru",
        value: tp1 || "-",
        inline: true,
      },
    ];

    if (sendDiscord) {
      await fetch("/api/discord", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          channel: discordChannel,

          embed: {
            title: isDoneDiscord
              ? "🎯 TARGET ACHIEVED"
              : editingId && updateEvent === "ENTRY_2_ADDED"
                ? "➕ ENTRY 2 DITAMBAHKAN"
                : editingId && updateEvent === "ENTRY_3_ADDED"
                  ? "➕ ENTRY 3 DITAMBAHKAN"
                  : editingId && updateEvent === "TP_REVISED"
                    ? "🎯 TARGET DIREVISI"
                    : editingId
                      ? "📌 UPDATE TRADE"
                      : discordTitle,

            color: editingId ? 0xf59e0b : discordColor,

            fields: isDoneDiscord
              ? doneFields
              : updateEvent === "ENTRY_2_ADDED"
                ? entry2Fields
                : updateEvent === "ENTRY_3_ADDED"
                  ? entry3Fields
                  : updateEvent === "TP_REVISED"
                    ? tpRevisedFields
                    : [
                        {
                          name: "📈 Emiten",
                          value: emiten,
                          inline: true,
                        },
                        {
                          name: "📊 Strategy",
                          value: tradingType,
                          inline: true,
                        },
                        {
                          name: "📍 Status",
                          value: status,
                          inline: true,
                        },
                        {
                          name: "💰 Entry Area",
                          value: `➊ Entry 1 : ${entry1 || "-"}
📅 ${formatLocalDate(entry1Date) || "-"}

➋ Entry 2 : ${entry2 || "-"}
📅 ${formatLocalDate(entry2Date) || "-"}

➌ Entry 3 : ${entry3 || "-"}
📅 ${formatLocalDate(entry3Date) || "-"}`,
                          inline: false,
                        },
                        {
                          name: "📌 AVG",
                          value: avg || "-",
                          inline: true,
                        },

                        {
                          name: "🎯 Target",
                          value: `${tp1 || "-"} | ${tp2 || "-"} | ${tp3 || "-"}`,
                          inline: true,
                        },
                        ...(updateEvent === "TP_REVISED"
                          ? [
                              {
                                name: "🎯 Revisi Target",
                                value: `${oldTp1} ➜ ${tp1}`,
                                inline: false,
                              },
                            ]
                          : []),
                        {
                          name: editingId
                            ? "📅 Update Date"
                            : "📅 Tanggal Signal",
                          value: editingId
                            ? currentDate
                            : formatLocalDate(signalDate) || "-",
                          inline: true,
                        },

                        {
                          name: editingId ? "🕒 Update Time" : "🕒 Waktu",
                          value: `${currentTime} WIB`,
                          inline: true,
                        },
                      ],
          },
        }),
      });
    }
    setEditingId(null);

    setEmiten("");
    setTradingType("");

    setEntry1("");
    setEntry2("");
    setEntry3("");

    setAvg("");

    setTp1("");
    setTp2("");
    setTp3("");

    setStatus("RUNNING");

    setHighPrice("");

    setProfitPercentage("");
  }

  async function sendWatchlist() {
    if (!watchlistTitle || !watchlistStocks) {
      alert("Lengkapi watchlist terlebih dahulu!");
      return;
    }

    const stocks = watchlistStocks
      .split("\n")
      .filter(Boolean)
      .map((stock) => `• ${stock}`)
      .join("\n");

    const response = await fetch("/api/discord", {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        channel: "PANTAU",

        embed: {
          title: `👀 ${watchlistTitle}`,

          color: 0x06b6d4,

          description: `
📌 WATCHLIST

${stocks}

📝 Catatan

${watchlistNotes || "-"}

🔥 RITEL SOCIETY
`,
        },
      }),
    });

    const result = await response.json();

    if (result.success) {
      alert("Watchlist berhasil dikirim!");

      setWatchlistTitle("");
      setWatchlistStocks("");
      setWatchlistNotes("");
    } else {
      alert("Gagal mengirim watchlist!");
    }
  }

  // =========================
  // DELETE SIGNAL
  // =========================

  async function deleteSignal(id: number) {
    const confirmDelete = confirm("Yakin ingin menghapus signal ini?");

    if (!confirmDelete) return;

    await supabase.from("signals_updates").delete().eq("signal_id", id);

    const { error } = await supabase.from("signals").delete().eq("id", id);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("Signal berhasil dihapus!");
  }

  // =========================
  // FORMAT DATE
  // =========================

  // =========================
  // FILTERED SIGNALS
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

  function formatDate(date: string) {
    if (!date) return "-";

    return new Date(date).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  // =========================
  // LOADING
  // =========================

  if (checkingAuth) {
    return (
      <main className="min-h-screen bg-black flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <img
            src="/logo-navbar.png"
            alt="Loading"
            className="w-20 h-20 rounded-full border-2 border-amber-300 animate-pulse"
          />

          <h1 className="text-amber-300 text-xl md:text-2xl font-black tracking-tight">
            Checking Admin Access...
          </h1>
        </div>
      </main>
    );
  }

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-gradient-to-b from-black via-zinc-950 to-black text-white p-4 md:p-10">
        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5 mb-10">
          <div>
            <h1 className="text-4xl md:text-6xl font-black tracking-tight text-amber-300 leading-none drop-shadow-[0_0_25px_rgba(252,211,77,0.15)]">
              ADMIN PANEL
            </h1>

            <p className="text-zinc-500 mt-3 text-sm md:text-base">
              Kelola signal trading RISE
            </p>
          </div>

          <div className="flex gap-4">
            <button
              onClick={async () => {
                await supabase.auth.signOut();

                router.push("/login");
              }}
              className="w-full md:w-auto bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-300 transition-all duration-200 px-5 py-3 rounded-2xl font-bold text-sm md:text-base"
            >
              LOGOUT
            </button>
          </div>
        </div>

        <div className="flex gap-3 mb-6">
          <button
            onClick={() => setMode("SIGNAL")}
            className={`px-6 py-3 rounded-2xl font-bold transition-all ${
              mode === "SIGNAL"
                ? "bg-amber-300 text-black"
                : "bg-zinc-900 text-zinc-400 border border-white/5"
            }`}
          >
            📈 SIGNAL
          </button>

          <button
            onClick={() => setMode("WATCHLIST")}
            className={`px-6 py-3 rounded-2xl font-bold transition-all ${
              mode === "WATCHLIST"
                ? "bg-cyan-400 text-black"
                : "bg-zinc-900 text-zinc-400 border border-white/5"
            }`}
          >
            👀 WATCHLIST
          </button>
        </div>

        {/* FORM */}
        {mode === "SIGNAL" && (
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
            <div className="w-full xl:col-span-8 bg-gradient-to-b from-zinc-900 to-black border border-white/5 rounded-3xl p-4 md:p-8 shadow-[0_0_60px_rgba(0,0,0,0.35)] space-y-4 md:space-y-5">
              {/* EMITEN */}
              <input
                type="text"
                placeholder="Masukkan kode emiten..."
                value={emiten}
                onChange={(e) => setEmiten(e.target.value.toUpperCase())}
                className="w-full bg-gradient-to-b from-black to-zinc-950 border border-white/5 rounded-2xl p-4 outline-none text-zinc-100 focus:border-amber-300/30 focus:shadow-[0_0_20px_rgba(252,211,77,0.08)] uppercase tracking-widest font-bold transition-all"
              />

              {/* TRADING TYPE */}
              <select
                value={tradingType}
                onChange={(e) => setTradingType(e.target.value)}
                className="appearance-none w-full bg-gradient-to-b from-black to-zinc-950 border border-white/5 rounded-2xl p-4 outline-none text-zinc-100 focus:border-amber-300/30 focus:shadow-[0_0_20px_rgba(252,211,77,0.08)] transition-all"
              >
                <option value="" className="bg-black text-white">
                  Pilih Trading Type
                </option>

                <option value="HAKA PREOPEN" className="bg-black text-white">
                  HAKA PREOPEN
                </option>

                <option value="BSJP" className="bg-black text-white">
                  BSJP
                </option>

                <option value="SNIPERAN" className="bg-black text-white">
                  SNIPERAN
                </option>

                <option value="SWING" className="bg-black text-white">
                  SWING
                </option>
              </select>

              {/* SIGNAL DATE */}
              <div className="mb-4">
                <p className="text-zinc-400 mb-2">Signal Date</p>

                <DatePicker
                  selected={signalDate}
                  onChange={(date: Date | null) => setSignalDate(date)}
                  dateFormat="EEEE, d MMMM yyyy"
                  className="w-full bg-gradient-to-b from-black to-zinc-950 border border-white/5 rounded-2xl p-4 outline-none text-zinc-100 focus:border-amber-300/30 focus:shadow-[0_0_20px_rgba(252,211,77,0.08)] transition-all"
                  placeholderText="Pilih tanggal signal"
                />
              </div>

              {/* ENTRY 1 */}
              <div className="grid md:grid-cols-2 gap-4">
                <input
                  type="number"
                  placeholder="Entry 1"
                  value={entry1}
                  onChange={(e) => setEntry1(e.target.value)}
                  className="w-full bg-gradient-to-b from-black to-zinc-950 border border-white/5 rounded-2xl p-4 outline-none text-zinc-100 focus:border-amber-300/30 focus:shadow-[0_0_20px_rgba(252,211,77,0.08)] transition-all"
                />

                <DatePicker
                  selected={entry1Date}
                  onChange={(date: Date | null) => setEntry1Date(date)}
                  dateFormat="EEEE, d MMMM yyyy"
                  className="w-full bg-gradient-to-b from-black to-zinc-950 border border-white/5 rounded-2xl p-4 outline-none text-zinc-100 focus:border-amber-300/30 focus:shadow-[0_0_20px_rgba(252,211,77,0.08)] transition-all"
                  placeholderText="Pilih tanggal"
                />
              </div>

              {/* ENTRY 2 */}
              <div className="grid md:grid-cols-2 gap-4">
                <input
                  type="number"
                  placeholder="Entry 2"
                  value={entry2}
                  onChange={(e) => setEntry2(e.target.value)}
                  className="w-full bg-gradient-to-b from-black to-zinc-950 border border-white/5 rounded-2xl p-4 outline-none text-zinc-100 focus:border-amber-300/30 focus:shadow-[0_0_20px_rgba(252,211,77,0.08)] transition-all"
                />

                <DatePicker
                  selected={entry2Date}
                  onChange={(date: Date | null) => setEntry2Date(date)}
                  dateFormat="EEEE, d MMMM yyyy"
                  className="w-full bg-gradient-to-b from-black to-zinc-950 border border-white/5 rounded-2xl p-4 outline-none text-zinc-100 focus:border-amber-300/30 focus:shadow-[0_0_20px_rgba(252,211,77,0.08)] transition-all"
                  placeholderText="Pilih tanggal"
                />
              </div>

              {/* ENTRY 3 */}
              <div className="grid md:grid-cols-2 gap-4">
                <input
                  type="number"
                  placeholder="Entry 3"
                  value={entry3}
                  onChange={(e) => setEntry3(e.target.value)}
                  className="w-full bg-gradient-to-b from-black to-zinc-950 border border-white/5 rounded-2xl p-4 outline-none text-zinc-100 focus:border-amber-300/30 focus:shadow-[0_0_20px_rgba(252,211,77,0.08)] transition-all"
                />

                <DatePicker
                  selected={entry3Date}
                  onChange={(date: Date | null) => setEntry3Date(date)}
                  dateFormat="EEEE, d MMMM yyyy"
                  className="w-full bg-gradient-to-b from-black to-zinc-950 border border-white/5 rounded-2xl p-4 outline-none text-zinc-100 focus:border-amber-300/30 focus:shadow-[0_0_20px_rgba(252,211,77,0.08)] transition-all"
                  placeholderText="Pilih tanggal"
                />
              </div>

              {/* AVG */}
              <div>
                <label className="block text-zinc-400 mb-2 font-semibold">
                  AVG (AUTO)
                </label>

                <div className="w-full bg-amber-300/10 border border-amber-300/20 text-amber-200 rounded-2xl p-4 font-black tracking-tight text-xl">
                  {avg || "0"}
                </div>
              </div>

              {/* TP */}
              <div className="grid md:grid-cols-3 gap-4">
                <input
                  type="number"
                  placeholder="TP 1"
                  value={tp1}
                  onChange={(e) => setTp1(e.target.value)}
                  className="w-full bg-gradient-to-b from-black to-zinc-950 border border-white/5 rounded-2xl p-4"
                />

                <input
                  type="number"
                  placeholder="TP 2"
                  value={tp2}
                  onChange={(e) => setTp2(e.target.value)}
                  className="w-full bg-gradient-to-b from-black to-zinc-950 border border-white/5 rounded-2xl p-4"
                />

                <input
                  type="number"
                  placeholder="TP 3"
                  value={tp3}
                  onChange={(e) => setTp3(e.target.value)}
                  className="w-full bg-gradient-to-b from-black to-zinc-950 border border-white/5 rounded-2xl p-4"
                />
              </div>

              {/* STATUS */}
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="appearance-none w-full bg-gradient-to-b from-black to-zinc-950 border border-white/5 rounded-2xl p-4 outline-none text-zinc-100 focus:border-amber-300/30 focus:shadow-[0_0_20px_rgba(252,211,77,0.08)] transition-all"
              >
                <option value="RUNNING" className="bg-black text-white">
                  RUNNING
                </option>

                <option value="DONE" className="bg-black text-white">
                  DONE
                </option>
              </select>

              <div className="flex items-center gap-3 mt-2">
                <input
                  type="checkbox"
                  checked={sendDiscord}
                  onChange={(e) => setSendDiscord(e.target.checked)}
                  className="w-5 h-5"
                />

                <label className="text-zinc-300 font-medium">
                  Kirim ke Discord
                </label>
              </div>

              {status === "DONE" && (
                <DatePicker
                  selected={doneDate}
                  onChange={(date: Date | null) => setDoneDate(date)}
                  dateFormat="EEEE, d MMMM yyyy"
                  className="w-full bg-gradient-to-b from-black to-zinc-950 border border-white/5 rounded-2xl p-4 outline-none text-zinc-100 focus:border-amber-300/30 focus:shadow-[0_0_20px_rgba(252,211,77,0.08)] transition-all"
                  placeholderText="Pilih tanggal DONE"
                />
              )}

              {/* HIGH PRICE */}
              <input
                type="number"
                placeholder="High Price"
                value={highPrice}
                onChange={(e) => setHighPrice(e.target.value)}
                className="w-full bg-gradient-to-b from-black to-zinc-950 border border-white/5 rounded-2xl p-4 outline-none text-zinc-100 focus:border-amber-300/30 focus:shadow-[0_0_20px_rgba(252,211,77,0.08)] transition-all"
              />

              {/* PROFIT */}
              <div>
                <label className="block text-zinc-400 mb-2 font-semibold">
                  PROFIT PERCENTAGE (AUTO)
                </label>

                <div
                  className={`w-full rounded-2xl p-4 font-bold text-xl border ${
                    Number(profitPercentage) >= 0
                      ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                      : "bg-rose-500/10 border-rose-500/20 text-rose-400"
                  }`}
                >
                  {profitPercentage || "0"}%
                </div>
              </div>
            </div>
            <div className="sticky top-28 self-start xl:col-span-4 bg-gradient-to-b from-zinc-900 to-black border border-white/5 rounded-3xl p-6 shadow-[0_0_60px_rgba(0,0,0,0.35)]">
              <h2 className="text-xl md:text-2xl font-black text-amber-300 mb-6 tracking-tight">
                MARKET INFO
              </h2>

              {currentMarket ? (
                <div className="space-y-5">
                  <div className="flex items-center justify-between bg-white/[0.03] border border-white/5 rounded-2xl p-4">
                    <div>
                      <p className="text-zinc-500 text-xs">SYMBOL</p>

                      <h3 className="text-white font-bold mt-1">
                        {emiten ? `IDX:${emiten}` : "INDEX:JKSE"}
                      </h3>
                    </div>

                    <div className="text-right">
                      <p className="text-zinc-500 text-xs tracking-widest">
                        CONNECTION STATUS
                      </p>
                      <h3
                        className={`font-bold mt-1 ${
                          emiten ? "text-emerald-400" : "text-zinc-500"
                        }`}
                      >
                        {emiten ? "● MARKET ACTIVE" : "Waiting Symbol..."}
                      </h3>
                    </div>
                  </div>
                  <div>
                    <p className="text-zinc-400 text-sm font-semibold tracking-wide">
                      LIVE MARKET PRICE
                    </p>
                    <p className="text-zinc-600 text-xs mt-1">
                      Last update {currentTime} WIB
                    </p>

                    <div className="flex items-center gap-3 mt-2 animate-pulse">
                      <h1
                        className={`text-4xl md:text-5xl font-black tracking-tight ${
                          currentMarket.change.includes("-")
                            ? "text-rose-400"
                            : "text-white"
                        }`}
                      >
                        {currentMarket.price}
                      </h1>

                      <span
                        className={`font-bold text-lg ${
                          currentMarket.change.includes("-")
                            ? "text-rose-400"
                            : "text-emerald-400"
                        }`}
                      >
                        {currentMarket.change}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white/[0.03] backdrop-blur-xl rounded-2xl p-4 border border-white/5">
                      <p className="text-zinc-500 text-sm">OPEN</p>

                      <h3 className="text-white text-xl font-bold mt-1">
                        {currentMarket.open}
                      </h3>
                    </div>

                    <div className="bg-white/[0.03] backdrop-blur-xl rounded-2xl p-4 border border-white/5">
                      <p className="text-zinc-500 text-sm">HIGH</p>

                      <h3 className="text-emerald-400 text-xl font-bold mt-1">
                        {currentMarket.high}
                      </h3>
                    </div>

                    <div className="bg-white/[0.03] backdrop-blur-xl rounded-2xl p-4 border border-white/5">
                      <p className="text-zinc-500 text-sm">LOW</p>

                      <h3 className="text-rose-400 text-xl font-bold mt-1">
                        {currentMarket.low}
                      </h3>
                    </div>

                    <div className="bg-white/[0.03] backdrop-blur-xl rounded-2xl p-4 border border-white/5">
                      <p className="text-zinc-500 text-sm">VOL</p>

                      <h3 className="text-cyan-400 text-xl font-bold mt-1">
                        {currentMarket.volume}
                      </h3>
                    </div>
                  </div>
                  <div className="pt-2">
                    <MiniTradingView
                      symbol={emiten ? `IDX:${emiten}` : "INDEX:JKSE"}
                    />
                  </div>
                </div>
              ) : (
                <div className="text-zinc-500">Ketik kode emiten...</div>
              )}
            </div>
          </div>
        )}
        {mode === "WATCHLIST" && (
          <div className="bg-gradient-to-b from-zinc-900 to-black border border-white/5 rounded-3xl p-8">
            <h2 className="text-3xl font-black text-cyan-400 mb-6">
              WATCHLIST
            </h2>

            <input
              type="text"
              placeholder="Judul Watchlist..."
              value={watchlistTitle}
              onChange={(e) => setWatchlistTitle(e.target.value)}
              className="w-full bg-black border border-white/5 rounded-2xl p-4 mb-4"
            />

            <textarea
              placeholder="Daftar emiten..."
              value={watchlistStocks}
              onChange={(e) => setWatchlistStocks(e.target.value)}
              rows={8}
              className="w-full bg-black border border-white/5 rounded-2xl p-4 mb-4"
            />

            <textarea
              placeholder="Catatan..."
              value={watchlistNotes}
              onChange={(e) => setWatchlistNotes(e.target.value)}
              rows={4}
              className="w-full bg-black border border-white/5 rounded-2xl p-4"
            />
          </div>
        )}

        {/* BUTTON */}
        <div className="mt-8 mb-10 flex flex-col md:flex-row gap-4 max-w-4xl">
          {editingId && (
            <button
              onClick={() => {
                setEditingId(null);

                setEmiten("");
                setTradingType("");

                setEntry1("");
                setEntry2("");
                setEntry3("");

                setAvg("");

                setTp1("");
                setTp2("");
                setTp3("");

                setStatus("RUNNING");

                setHighPrice("");

                setProfitPercentage("");
              }}
              className="
w-full md:w-40
bg-zinc-800
hover:bg-zinc-700
border
border-white/5
transition-all
duration-200
text-white
font-bold
py-4
rounded-2xl
text-lg
"
            >
              CANCEL
            </button>
          )}

          <button
            onClick={mode === "WATCHLIST" ? sendWatchlist : saveSignal}
            className="
w-full
bg-amber-300
hover:bg-amber-200
transition-all
duration-200
hover:shadow-[0_0_30px_rgba(252,211,77,0.15)]
text-black
font-black
py-4
rounded-2xl
text-lg
shadow-lg
shadow-amber-300/10
"
          >
            {loading
              ? "MENYIMPAN..."
              : mode === "WATCHLIST"
                ? "🚀 KIRIM WATCHLIST"
                : editingId
                  ? "UPDATE SIGNAL"
                  : "SIMPAN SIGNAL"}
          </button>
        </div>
        {/* FILTER */}
        <div className="grid md:grid-cols-3 gap-4 mb-6">
          <input
            type="text"
            placeholder="Search Emiten..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-gradient-to-b from-black to-zinc-950 border border-white/5 rounded-2xl px-5 py-4 outline-none text-zinc-100 focus:border-amber-300/30 focus:shadow-[0_0_20px_rgba(252,211,77,0.08)] transition-all"
          />

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="appearance-none w-full bg-gradient-to-b from-black to-zinc-950 border border-white/5 rounded-2xl px-5 py-4 outline-none text-zinc-100 focus:border-amber-300/30 focus:shadow-[0_0_20px_rgba(252,211,77,0.08)] transition-all"
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

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="appearance-none w-full bg-gradient-to-b from-black to-zinc-950 border border-white/5 rounded-2xl px-5 py-4 outline-none text-zinc-100 focus:border-amber-300/30 focus:shadow-[0_0_20px_rgba(252,211,77,0.08)] transition-all"
          >
            <option value="ALL" className="bg-black text-white">
              ALL TYPE
            </option>

            <option value="HAKA PREOPEN" className="bg-black text-white">
              HAKA PREOPEN
            </option>

            <option value="BSJP" className="bg-black text-white">
              BSJP
            </option>

            <option value="SNIPERAN" className="bg-black text-white">
              SNIPERAN
            </option>

            <option value="SWING" className="bg-black text-white">
              SWING
            </option>
          </select>
        </div>

        {/* SIGNAL TABLE */}
        <div className="bg-gradient-to-b from-zinc-900 to-black border border-white/5 rounded-3xl overflow-hidden shadow-[0_0_60px_rgba(0,0,0,0.35)]">
          <div className="p-6 border-b border-white/5">
            <h2 className="text-3xl font-black tracking-tight text-amber-300">
              SIGNAL TERBARU
            </h2>
          </div>
          {/* MOBILE SIGNAL CARDS */}
          <div className="md:hidden space-y-3">
            {filteredSignals.map((signal) => (
              <div
                key={signal.id}
                className="bg-gradient-to-b from-zinc-900 to-black border border-white/5 rounded-3xl p-4 shadow-[0_0_30px_rgba(0,0,0,0.2)]"
              >
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-xl md:text-2xl font-black text-amber-300">
                    {signal.emiten}
                  </h2>

                  <span
                    className={`font-bold ${
                      signal.status === "DONE"
                        ? "text-emerald-400"
                        : "text-rose-400"
                    }`}
                  >
                    {signal.status}
                  </span>
                </div>

                <div className="space-y-2 text-sm">
                  <p>
                    <span className="text-zinc-500">Date:</span>{" "}
                    {formatDate(signal.tanggal_signal)}
                  </p>

                  <p>
                    <span className="text-zinc-500">Type:</span>{" "}
                    {signal.trading_type}
                  </p>

                  <p>
                    <span className="text-zinc-500">AVG:</span> {signal.avg}
                  </p>

                  <p className="text-emerald-400 font-bold">
                    PROFIT {signal.profit_percentage}%
                  </p>
                </div>

                <div className="flex gap-3 mt-5">
                  <button
                    onClick={() => {
                      setEditingId(signal.id);

                      setEmiten(signal.emiten || "");

                      setTradingType(signal.trading_type || "");

                      setSignalDate(
                        signal.tanggal_signal
                          ? new Date(signal.tanggal_signal + "t00:00:00")
                          : null,
                      );

                      setEntry1(signal.entry_1?.toString() || "");

                      setEntry2(signal.entry_2?.toString() || "");

                      setEntry3(signal.entry_3?.toString() || "");

                      setEntry1Date(
                        signal.entry_1_date
                          ? new Date(signal.entry_1_date)
                          : null,
                      );

                      setEntry2Date(
                        signal.entry_2_date
                          ? new Date(signal.entry_2_date)
                          : null,
                      );

                      setEntry3Date(
                        signal.entry_3_date
                          ? new Date(signal.entry_3_date)
                          : null,
                      );

                      setDoneDate(
                        signal.done_date ? new Date(signal.done_date) : null,
                      );

                      setAvg(signal.avg?.toString() || "");

                      setTp1(signal.tp_1?.toString() || "");

                      setTp2(signal.tp_2?.toString() || "");

                      setTp3(signal.tp_3?.toString() || "");

                      setStatus(signal.status || "RUNNING");

                      setHighPrice(signal.high_price?.toString() || "");

                      setProfitPercentage(
                        signal.profit_percentage?.toString() || "",
                      );

                      window.scrollTo({
                        top: 0,
                        behavior: "smooth",
                      });
                    }}
                    className="
flex-1
bg-amber-300/10
hover:bg-amber-300/20
border
border-amber-300/20
text-amber-200
transition-all
duration-200
py-3
rounded-2xl
font-bold
"
                  >
                    Edit
                  </button>

                  <button
                    onClick={() => deleteSignal(signal.id)}
                    className="flex-1 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-300 transition-all duration-200 py-3 rounded-2xl font-bold"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead className="bg-gradient-to-r from-zinc-900 to-black border-b border-white/5">
                <tr>
                  <th className="p-4 text-left text-zinc-400 font-semibold tracking-wide">
                    Date
                  </th>

                  <th className="p-4 text-left text-zinc-400 font-semibold tracking-wide">
                    Emiten
                  </th>

                  <th className="p-4 text-left text-zinc-400 font-semibold tracking-wide">
                    Type
                  </th>

                  <th className="p-4 text-left text-zinc-400 font-semibold tracking-wide">
                    AVG
                  </th>

                  <th className="p-4 text-left text-zinc-400 font-semibold tracking-wide">
                    Profit
                  </th>

                  <th className="p-4 text-left text-zinc-400 font-semibold tracking-wide">
                    Status
                  </th>

                  <th className="p-4 text-left text-zinc-400 font-semibold tracking-wide">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredSignals.map((signal) => (
                  <tr
                    key={signal.id}
                    className="border-t border-white/5 hover:bg-white/[0.02] transition-all duration-200"
                  >
                    <td className="p-4">{formatDate(signal.tanggal_signal)}</td>

                    <td className="p-4 font-bold text-amber-300">
                      {signal.emiten}
                    </td>

                    <td className="p-4">{signal.trading_type}</td>

                    <td className="p-4">{signal.avg}</td>

                    <td className="p-4 text-emerald-400 font-bold">
                      {signal.profit_percentage}%
                    </td>

                    <td className="p-4">
                      <span
                        className={
                          signal.status === "DONE"
                            ? "text-emerald-400 font-bold"
                            : "text-rose-400 font-bold"
                        }
                      >
                        {signal.status}
                      </span>
                    </td>

                    <td className="p-4">
                      <div className="flex gap-3">
                        <button
                          onClick={async () => {
                            setSelectedSignal(signal);

                            await loadSignalHistory(signal.id);
                          }}
                          className="
bg-cyan-500/10
hover:bg-cyan-500/20
border
border-cyan-500/20
text-cyan-300
transition-all
duration-200
px-4
py-2
rounded-xl
font-bold
"
                        >
                          Journey
                        </button>
                        <button
                          onClick={() => {
                            setEditingId(signal.id);

                            setEmiten(signal.emiten || "");

                            setTradingType(signal.trading_type || "");

                            setSignalDate(
                              signal.tanggal_signal
                                ? new Date(signal.tanggal_signal + "t00:00:00")
                                : null,
                            );

                            setEntry1(signal.entry_1?.toString() || "");

                            setEntry2(signal.entry_2?.toString() || "");

                            setEntry3(signal.entry_3?.toString() || "");

                            setEntry1Date(
                              signal.entry_1_date
                                ? new Date(signal.entry_1_date)
                                : null,
                            );

                            setEntry2Date(
                              signal.entry_2_date
                                ? new Date(signal.entry_2_date)
                                : null,
                            );

                            setEntry3Date(
                              signal.entry_3_date
                                ? new Date(signal.entry_3_date)
                                : null,
                            );

                            setDoneDate(
                              signal.done_date
                                ? new Date(signal.done_date)
                                : null,
                            );

                            setAvg(signal.avg?.toString() || "");

                            setTp1(signal.tp_1?.toString() || "");

                            setTp2(signal.tp_2?.toString() || "");

                            setTp3(signal.tp_3?.toString() || "");

                            setStatus(signal.status || "RUNNING");

                            setHighPrice(signal.high_price?.toString() || "");

                            setProfitPercentage(
                              signal.profit_percentage?.toString() || "",
                            );

                            window.scrollTo({
                              top: 0,
                              behavior: "smooth",
                            });
                          }}
                          className="
bg-amber-300/10
hover:bg-amber-300/20
border
border-amber-300/20
text-amber-200
transition-all
duration-200
px-4
py-2
rounded-xl
font-bold
"
                        >
                          Edit
                        </button>

                        <button
                          onClick={() => deleteSignal(signal.id)}
                          className="bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-300 transition-all duration-200 px-4 py-2 rounded-xl font-bold"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        {selectedSignal && (
          <div
            className="
    fixed
    inset-0
    bg-black/80
    backdrop-blur-sm
    z-50
    flex
    items-center
    justify-center
    p-4
  "
          >
            <div
              className="
    bg-zinc-900
    border border-cyan-500/20
    rounded-3xl
    w-full
    max-w-3xl
    max-h-[85vh]
    overflow-y-auto
    p-8
    shadow-2xl
  "
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-black text-cyan-300">
                  TRADE JOURNEY - {selectedSignal.emiten}
                </h2>

                <button
                  onClick={() => {
                    setSelectedSignal(null);
                    setSignalHistory([]);
                  }}
                  className="px-4 py-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 font-bold"
                >
                  Tutup
                </button>
              </div>

              <div className="space-y-4">
                {signalHistory.map((item) => (
                  <div
                    key={item.id}
                    className="border-l-4 border-cyan-400 pl-4 py-2"
                  >
                    <p className="text-zinc-500 text-sm">
                      {item.event_type === "SIGNAL_CREATED"
                        ? formatDate(selectedSignal.entry_1_date)
                        : item.event_type === "ENTRY_2_ADDED"
                          ? formatDate(selectedSignal.entry_2_date)
                          : item.event_type === "ENTRY_3_ADDED"
                            ? formatDate(selectedSignal.entry_3_date)
                            : item.event_type === "TARGET_ACHIEVED"
                              ? formatDate(selectedSignal.done_date)
                              : formatDate(item.event_date || item.created_at)}
                    </p>

                    <h3 className="font-bold text-white">
                      {item.event_type === "SIGNAL_CREATED"
                        ? "ENTRY 1"
                        : item.event_type === "ENTRY_2_ADDED"
                          ? "➕ Entry 2 Ditambahkan"
                          : item.event_type === "ENTRY_3_ADDED"
                            ? "➕ Entry 3 Ditambahkan"
                            : item.event_type === "TP_REVISED"
                              ? "🎯 Target Direvisi"
                              : item.event_type === "TARGET_ACHIEVED"
                                ? "✅ Target Achieved"
                                : item.event_type}
                    </h3>

                    <p className="text-zinc-300">
                      {item.event_type === "SIGNAL_CREATED"
                        ? item.new_value
                        : `${item.old_value} ➜ ${item.new_value}`}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </>
  );
}

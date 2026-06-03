"use client";

import Navbar from "@/components/Navbar";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { toPng } from "html-to-image";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
export default function HistoryPage() {
  const [signals, setSignals] = useState<any[]>([]);

  const [journeyData, setJourneyData] = useState<any[]>([]);

  const [search, setSearch] = useState("");

  const [statusFilter, setStatusFilter] = useState("ALL");

  const [typeFilter, setTypeFilter] = useState("ALL");

  const [dateFilter, setDateFilter] = useState("ALL");

  const [specificDateFilter, setSpecificDateFilter] = useState<Date | null>(
    null,
  );

  // =========================
  // FETCH
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

  async function getJourney() {
    const { data, error } = await supabase
      .from("signals_updates")
      .select("*")
      .order("created_at", { ascending: true });

    if (error) {
      console.error(error);
      return;
    }

    setJourneyData(data || []);
  }

  // =========================
  // REALTIME
  // =========================

  useEffect(() => {
    getSignals();
    getJourney();

    const channel = supabase
      .channel("history-signals")
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
  // FILTER
  // =========================

  const now = new Date();

  const filteredSignals = signals.filter((signal) => {
    const cocokSearch = signal.emiten
      ?.toLowerCase()
      .includes(search.toLowerCase());

    const cocokStatus =
      statusFilter === "ALL" ? true : signal.status === statusFilter;

    const cocokType =
      typeFilter === "ALL" ? true : signal.trading_type === typeFilter;

    let cocokDate = true;

    const signalDate = signal.tanggal_signal
      ? new Date(signal.tanggal_signal)
      : null;
    if (signalDate) {
      if (dateFilter === "TODAY") {
        cocokDate =
          signalDate.getDate() === now.getDate() &&
          signalDate.getMonth() === now.getMonth() &&
          signalDate.getFullYear() === now.getFullYear();
      }

      if (dateFilter === "WEEK") {
        const diff =
          (now.getTime() - signalDate.getTime()) / (1000 * 60 * 60 * 24);

        cocokDate = diff <= 7;
      }

      if (dateFilter === "MONTH") {
        cocokDate =
          signalDate.getMonth() === now.getMonth() &&
          signalDate.getFullYear() === now.getFullYear();
      }
    }

    let cocokSpecificDate = true;

    if (specificDateFilter && signalDate) {
      cocokSpecificDate =
        signalDate.toDateString() === specificDateFilter.toDateString();
    }

    return (
      cocokSearch && cocokStatus && cocokType && cocokDate && cocokSpecificDate
    );
  });

  // =========================
  // STATS
  // =========================

  const totalSignals = filteredSignals.length;

  const totalDone = filteredSignals.filter(
    (s) => s.status?.toUpperCase() === "DONE",
  ).length;

  const totalRunning = filteredSignals.filter(
    (s) => s.status?.toUpperCase() === "RUNNING",
  ).length;

  const avgProfit =
    totalSignals > 0
      ? (
          filteredSignals.reduce(
            (acc, curr) => acc + Number(curr.profit_percentage || 0),
            0,
          ) / totalSignals
        ).toFixed(2)
      : "0";

  const winrate =
    totalSignals > 0 ? ((totalDone / totalSignals) * 100).toFixed(1) : "0";

  // =========================
  // FORMAT DATE
  // =========================

  function formatDate(date: string) {
    if (!date) return "-";

    const parsedDate = new Date(date);

    if (isNaN(parsedDate.getTime())) {
      return "-";
    }

    return parsedDate.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }

  function getSignalJourney(signalId: number) {
    return journeyData.filter((item) => item.signal_id === signalId);
  }

  // =========================
  // EXPORT PDF
  // =========================

  function exportPDF() {
    const doc = new jsPDF();

    doc.setFillColor(0, 0, 0);

    doc.rect(
      0,
      0,
      doc.internal.pageSize.getWidth(),
      doc.internal.pageSize.getHeight(),
      "F",
    );

    const logo = new Image();

    logo.src = "/logo-rise-transparent.png";

    doc.addImage(logo, "PNG", 14, 6, 18, 18);

    doc.setTextColor(255, 215, 0);

    doc.setFontSize(26);

    doc.text("RISE HISTORY RECAP", 38, 18);

    doc.setTextColor(220, 220, 220);

    doc.setFontSize(12);

    doc.text(`Total Signals : ${totalSignals}`, 14, 35);

    doc.text(`Done : ${totalDone}`, 14, 43);

    doc.text(`Running : ${totalRunning}`, 14, 51);

    doc.text(`Avg Profit : ${avgProfit}%`, 14, 59);

    doc.text(`Winrate : ${winrate}%`, 14, 67);

    autoTable(doc, {
      willDrawPage: (data) => {
        try {
          doc.addImage(logo, "PNG", 78, 120, 35, 35);
        } catch (e) {}

        if (data.pageNumber > 1) {
          doc.setFillColor(0, 0, 0);

          doc.rect(
            0,
            0,
            doc.internal.pageSize.getWidth(),
            doc.internal.pageSize.getHeight(),
            "F",
          );

          doc.addImage(logo, "PNG", 14, 5, 12, 12);

          doc.setTextColor(255, 215, 0);

          doc.setFontSize(16);

          doc.text("RISE HISTORY RECAP", 30, 13);
        }
      },
      startY: 75,
      margin: {
        top: 25,
      },

      head: [
        [
          "Date",
          "Emiten",
          "Type",
          "AVG",
          "Timeline",
          "TP1/TP2/TP3",
          "Profit",
          "Status",
        ],
      ],

      body: filteredSignals.map((signal) => [
        formatDate(signal.tanggal_signal),
        signal.emiten,
        signal.trading_type,
        signal.avg || "-",
        [
          signal.entry_1
            ? `E1 ${signal.entry_1} (${formatDate(signal.entry_1_date)})`
            : null,

          signal.entry_2 && Number(signal.entry_2) > 0
            ? `E2 ${signal.entry_2} (${formatDate(signal.entry_2_date)})`
            : null,

          signal.entry_3 && Number(signal.entry_3) > 0
            ? `E3 ${signal.entry_3} (${formatDate(signal.entry_3_date)})`
            : null,

          signal.done_date ? `DONE (${formatDate(signal.done_date)})` : null,
        ]
          .filter(Boolean)
          .join("\n"),
        `${signal.tp_1 || "-"} | ${signal.tp_2 || "-"} | ${signal.tp_3 || "-"}`,
        `${signal.profit_percentage || 0}%`,
        signal.status,
      ]),

      styles: {
        fillColor: [15, 15, 15],
        textColor: [255, 255, 255],
      },

      headStyles: {
        fillColor: [255, 215, 0],
        textColor: [0, 0, 0],
      },

      alternateRowStyles: {
        fillColor: [25, 25, 25],
      },
    });

    const pageCount = doc.getNumberOfPages();

    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);

      doc.setTextColor(120, 120, 120);

      doc.setFontSize(9);

      doc.text("RITEL SOCIETY • Premium Trading Community", 14, 290);

      doc.text(`Page ${i} of ${pageCount}`, 180, 290);
    }

    doc.save("rise-history.pdf");
  }

  // =========================
  // DOWNLOAD IMAGE
  // =========================

  async function downloadImage() {
    const element = document.getElementById("history-share");

    if (!element) return;

    const originalClass = element.className;

    try {
      element.classList.remove("hidden");
      element.style.display = "block";

      const dataUrl = await toPng(element, {
        cacheBust: true,
        backgroundColor: "#000000",
        pixelRatio: 3,

        canvasWidth: element.scrollWidth,
        canvasHeight: element.scrollHeight,
      });

      const link = document.createElement("a");

      link.download = "rise-history.png";
      link.href = dataUrl;

      link.click();
    } catch (error) {
      console.error("Download image error:", error);
    } finally {
      element.className = originalClass;
      element.style.display = "";
    }
  }

  return (
    <>
      <Navbar />

      <div className="min-h-screen bg-black text-white p-4 md:p-10">
        <div className="max-w-7xl mx-auto">
          {/* HEADER */}
          <div className="mb-10">
            <h1 className="text-4xl md:text-6xl font-black tracking-tight text-amber-300 leading-none">
              HISTORY RECAP
            </h1>

            <p className="text-zinc-400 mt-3 text-lg">
              Rekapan seluruh history signal
            </p>
          </div>

          {/* BUTTON */}
          <div className="flex flex-wrap gap-4 mb-8">
            <button
              onClick={exportPDF}
              className="
bg-amber-300
hover:bg-amber-200
transition-all
duration-200

text-black
font-black
px-6
py-3
rounded-2xl
shadow-lg
shadow-amber-300/10
"
            >
              Export PDF
            </button>

            <button
              onClick={downloadImage}
              className="
bg-zinc-800
hover:bg-zinc-700
border
border-zinc-800
transition-all
duration-200
text-white
font-black
px-6
py-3
rounded-2xl
"
            >
              Download Image
            </button>
          </div>

          {/* DATE FILTER */}
          <div className="flex flex-wrap gap-3 mb-8">
            {["ALL", "TODAY", "WEEK", "MONTH"].map((item) => (
              <button
                key={item}
                onClick={() => setDateFilter(item)}
                className={`px-5 py-3 rounded-2xl font-bold transition-all duration-200 ${
                  dateFilter === item
                    ? "bg-amber-300 text-black shadow-lg shadow-amber-300/10"
                    : "bg-zinc-900 border border-zinc-800 text-white hover:bg-zinc-900/80"
                }`}
              >
                {item}
              </button>
            ))}
          </div>

          {/* FILTER PREMIUM */}

          <div className="space-y-5 mb-10">
            {/* SEARCH */}
            <input
              type="text"
              placeholder="Search Emiten..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="
      w-full
      bg-gradient-to-b
      from-zinc-950
      to-black
      border
      border-zinc-800
      rounded-3xl
      px-6
      py-5
      outline-none
      text-zinc-100
      focus:border-amber-300
      transition-all
      text-lg
    "
            />

            {/* MAIN FILTER */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="
        appearance-none
        bg-zinc-950
        border
        border-zinc-800
        rounded-2xl
        px-5
        py-4
        text-white
        outline-none
        focus:border-amber-300
      "
              >
                <option value="ALL">ALL STATUS</option>
                <option value="RUNNING">RUNNING</option>
                <option value="DONE">DONE</option>
              </select>

              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="
        appearance-none
        bg-zinc-950
        border
        border-zinc-800
        rounded-2xl
        px-5
        py-4
        text-white
        outline-none
        focus:border-amber-300
      "
              >
                <option value="ALL">ALL TYPE</option>
                <option value="HAKA PREOPEN">HAKA PREOPEN</option>
                <option value="BSJP">BSJP</option>
                <option value="SNIPERAN">SNIPERAN</option>
                <option value="SWING">SWING</option>
              </select>
            </div>

            {/* PREMIUM DATE FILTER */}
            <div className="pt-2">
              <p className="text-zinc-500 text-sm mb-3 uppercase tracking-[0.2em]">
                Filter Date
              </p>

              <DatePicker
                selected={specificDateFilter}
                onChange={(date: Date | null) => setSpecificDateFilter(date)}
                dateFormat="dd MMMM yyyy"
                placeholderText="Select Date"
                calendarClassName="premium-calendar"
                className="
    bg-zinc-950
    border
    border-zinc-800
    rounded-2xl
    px-5
    py-4
    text-white
    outline-none
    focus:border-amber-300
    w-full
    md:w-[320px]
  "
              />
            </div>
          </div>
          {/* STATS */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-5 mb-10">
            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 ">
              <p className="text-zinc-400">Total Signals</p>

              <h2 className="text-4xl font-black tracking-tight text-amber-300 mt-3">
                {totalSignals}
              </h2>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 ">
              <p className="text-zinc-400">Running</p>

              <h2 className="text-4xl font-black tracking-tight text-rose-400 mt-3">
                {totalRunning}
              </h2>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 ">
              <p className="text-zinc-400">Done</p>

              <h2 className="text-4xl font-black tracking-tight text-emerald-400 mt-3">
                {totalDone}
              </h2>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 ">
              <p className="text-zinc-400">Avg Profit</p>

              <h2 className="text-4xl font-black tracking-tight text-amber-200 mt-3">
                {avgProfit}%
              </h2>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 ">
              <p className="text-zinc-400">Winrate</p>

              <h2 className="text-4xl font-black tracking-tight text-emerald-300 mt-3">
                {winrate}%
              </h2>
            </div>
          </div>

          <div
            id="history-image"
            className="hidden md:block bg-black p-8 rounded-3xl overflow-visible"
          >
            {/* TABLE */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden">
              <table className="w-full min-w-[1100px]">
                <thead className="bg-gradient-to-r from-zinc-900 to-black border-b border-zinc-800">
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
                      Timeline
                    </th>

                    <th className="p-4 text-left text-zinc-400 font-semibold tracking-wide">
                      TP1 / TP2 / TP3
                    </th>

                    <th className="p-4 text-left text-zinc-400 font-semibold tracking-wide">
                      Profit
                    </th>

                    <th className="p-4 text-left text-zinc-400 font-semibold tracking-wide">
                      Status
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredSignals.map((signal) => {
                    const journey = getSignalJourney(signal.id);

                    return (
                      <tr
                        key={signal.id}
                        className="border-t border-zinc-800 hover:bg-zinc-800/40 transition-all duration-200"
                      >
                        <td className="px-4 py-5">
                          {formatDate(signal.tanggal_signal)}
                        </td>

                        <td className="p-4 font-black tracking-tight text-amber-300">
                          {signal.emiten}
                        </td>

                        <td className="px-4 py-5">{signal.trading_type}</td>

                        <td className="px-4 py-5">{signal.avg || "-"}</td>

                        <td className="px-4 py-5">
                          <div className="space-y-2 text-sm">
                            {journey.map((item) => (
                              <div
                                key={item.id}
                                className="bg-zinc-800 rounded-xl p-2.5"
                              >
                                <p
                                  className={
                                    item.event_type === "SIGNAL_CREATED"
                                      ? "text-amber-300 font-bold"
                                      : item.event_type === "ENTRY_2_ADDED"
                                        ? "text-emerald-400 font-bold"
                                        : item.event_type === "ENTRY_3_ADDED"
                                          ? "text-rose-400 font-bold"
                                          : item.event_type ===
                                              "TARGET_ACHIEVED"
                                            ? "text-emerald-300 font-bold"
                                            : "text-sky-400 font-bold"
                                  }
                                >
                                  {item.event_type === "SIGNAL_CREATED"
                                    ? "ENTRY 1"
                                    : item.event_type === "ENTRY_2_ADDED"
                                      ? "ENTRY 2"
                                      : item.event_type === "ENTRY_3_ADDED"
                                        ? "ENTRY 3"
                                        : item.event_type === "TP_REVISED"
                                          ? "TP REVISI"
                                          : item.event_type ===
                                              "TARGET_ACHIEVED"
                                            ? "DONE"
                                            : item.event_type}
                                </p>

                                <p className="text-white">{item.new_value}</p>

                                <p className="text-zinc-500 text-xs">
                                  {formatDate(item.created_at)}
                                </p>
                              </div>
                            ))}
                          </div>
                        </td>

                        <td className="px-4 py-5">
                          {signal.tp_1 || "-"} | {signal.tp_2 || "-"} |{" "}
                          {signal.tp_3 || "-"}
                        </td>

                        <td className="p-4 text-emerald-400 font-bold">
                          {signal.profit_percentage || 0}%
                        </td>

                        <td className="px-4 py-5">
                          <span
                            className={
                              signal.status?.toUpperCase() === "DONE"
                                ? "text-emerald-400 font-bold"
                                : "text-rose-400 font-bold"
                            }
                          >
                            {signal.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div
            id="history-share"
            className="hidden bg-black text-white p-8 w-[1200px] relative overflow-hidden"
          >
            <img
              src="/logo-rise-transparent.png"
              alt="RISE"
              className="
    absolute
    top-1/2
    left-1/2
    -translate-x-1/2
    -translate-y-1/2
    w-[950px]
    opacity-[0.08]
    pointer-events-none
  "
            />
            <div className="max-w-4xl mx-auto">
              <div className="flex items-center gap-5 mb-8">
                <img
                  src="/logo-rise-transparent.png"
                  alt="RISE"
                  className="w-20 h-20 object-contain"
                />

                <div>
                  <h1 className="text-5xl font-black text-amber-300">
                    RISE HISTORY RECAP
                  </h1>

                  <p className="text-zinc-500 text-lg">
                    Ritel Society Premium Trading Community
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-3 mb-6">
                <div className="bg-zinc-900 border border-zinc-800 px-4 py-2 rounded-xl">
                  <span className="text-zinc-500 text-sm">STATUS</span>
                  <p className="font-bold">{statusFilter}</p>
                </div>

                <div className="bg-zinc-900 border border-zinc-800 px-4 py-2 rounded-xl">
                  <span className="text-zinc-500 text-sm">TYPE</span>
                  <p className="font-bold">{typeFilter}</p>
                </div>

                <div className="bg-zinc-900 border border-zinc-800 px-4 py-2 rounded-xl">
                  <span className="text-zinc-500 text-sm">DATE</span>
                  <p className="font-bold">{dateFilter}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-zinc-900 p-4 rounded-2xl">
                  <p>Total Signal</p>
                  <h2 className="text-3xl font-black">{totalSignals}</h2>
                </div>

                <div className="bg-zinc-900 p-4 rounded-2xl">
                  <p>Done</p>
                  <h2 className="text-3xl font-black text-emerald-400">
                    {totalDone}
                  </h2>
                </div>

                <div className="bg-zinc-900 p-4 rounded-2xl">
                  <p>Running</p>
                  <h2 className="text-3xl font-black text-rose-400">
                    {totalRunning}
                  </h2>
                </div>

                <div className="bg-zinc-900 p-4 rounded-2xl">
                  <p>Winrate</p>
                  <h2 className="text-3xl font-black text-amber-300">
                    {winrate}%
                  </h2>
                </div>
                <div className="bg-zinc-900 p-4 rounded-2xl">
                  <p>Avg Profit</p>
                  <h2 className="text-3xl font-black text-emerald-300">
                    {avgProfit}%
                  </h2>
                </div>
              </div>

              <div className="space-y-3">
                {filteredSignals.map((signal) => (
                  <div
                    key={signal.id}
                    className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4"
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="text-2xl font-black text-amber-300">
                          {signal.emiten}
                        </h3>

                        <p className="text-zinc-400">{signal.trading_type}</p>
                      </div>

                      <div className="text-right">
                        <p
                          className={
                            signal.status === "DONE"
                              ? "text-emerald-400 font-bold"
                              : "text-rose-400 font-bold"
                          }
                        >
                          {signal.status}
                        </p>

                        <p className="text-xl font-black">
                          {signal.profit_percentage || 0}%
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-10 pt-6 border-t border-zinc-800 text-center">
                <p className="text-zinc-500 text-sm">
                  Generated by RISE Dashboard
                </p>

                <p className="text-amber-300 font-bold mt-2">
                  RITEL SOCIETY • Premium Trading Community
                </p>
              </div>
            </div>
          </div>

          {/* MOBILE CARD */}
          <div className="block md:hidden space-y-3">
            {filteredSignals.map((signal) => (
              <div
                key={signal.id}
                className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 "
              >
                {/* TOP */}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-2xl md:text-3xl font-black tracking-tight text-amber-300">
                      {signal.emiten}
                    </h2>

                    <p className="text-zinc-400 text-sm mt-1">
                      {signal.trading_type}
                    </p>
                  </div>
                  <span
                    className={`px-4 py-2 rounded-2xl text-sm font-black border ${
                      signal.status?.toUpperCase() === "DONE"
                        ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                        : "bg-rose-500/10 border-rose-500/30 text-rose-400"
                    }`}
                  >
                    {signal.status}
                  </span>
                </div>

                {/* DATE */}
                <div className="mb-4">
                  <p className="text-zinc-500 text-sm">Tanggal</p>

                  <p className="font-semibold">
                    {formatDate(signal.tanggal_signal)}
                  </p>
                </div>

                {/* ENTRY */}
                <div className="space-y-4 mb-5">
                  {Number(signal.entry_1) > 0 && (
                    <div className="bg-zinc-800 rounded-xl p-2.5">
                      <p className="text-amber-300 font-bold text-sm">
                        ENTRY 1
                      </p>

                      <p className="text-xl font-bold">{signal.entry_1}</p>

                      <p className="text-zinc-500 text-xs mt-1">
                        {signal.entry_1_date
                          ? formatDate(signal.entry_1_date)
                          : "-"}
                      </p>
                    </div>
                  )}

                  {Number(signal.entry_2) > 0 && (
                    <div className="bg-zinc-800 rounded-xl p-2.5">
                      <p className="text-emerald-300 font-bold text-sm">
                        ENTRY 2
                      </p>

                      <p className="text-xl font-bold">{signal.entry_2}</p>

                      <p className="text-zinc-500 text-xs mt-1">
                        {signal.entry_2_date
                          ? formatDate(signal.entry_2_date)
                          : "-"}
                      </p>
                    </div>
                  )}

                  {Number(signal.entry_3) > 0 && (
                    <div className="bg-zinc-800 rounded-xl p-2.5">
                      <p className="text-rose-300 font-bold text-sm">ENTRY 3</p>

                      <p className="text-xl font-bold">{signal.entry_3}</p>

                      <p className="text-zinc-500 text-xs mt-1">
                        {signal.entry_3_date
                          ? formatDate(signal.entry_3_date)
                          : "-"}
                      </p>
                    </div>
                  )}

                  {/* DONE */}
                  {signal.done_date && (
                    <div className="bg-zinc-800 border border-zinc-700 rounded-xl p-2.5">
                      <p className="text-emerald-400 font-bold text-sm">DONE</p>

                      <p className="text-zinc-500 text-xs mt-1">
                        {signal.done_date ? formatDate(signal.done_date) : "-"}
                      </p>
                    </div>
                  )}
                </div>

                {/* BOTTOM */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-zinc-800 rounded-xl p-2.5">
                    <p className="text-zinc-500 text-xs">AVG</p>

                    <p className="font-bold text-lg">{signal.avg || "-"}</p>
                  </div>

                  <div className="bg-zinc-800 rounded-xl p-2.5">
                    <p className="text-zinc-500 text-xs">TP</p>

                    <p className="font-bold text-lg">
                      {signal.tp_1 || "-"} | {signal.tp_2 || "-"} |{" "}
                      {signal.tp_3 || "-"}
                    </p>
                  </div>

                  <div className="bg-zinc-800 rounded-xl p-2.5">
                    <p className="text-zinc-500 text-xs">PROFIT</p>

                    <p className="font-bold text-lg text-emerald-400">
                      {signal.profit_percentage || 0}%
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

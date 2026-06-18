type FinanceRowProps = {
  title: string;
  percent: number;
  amount: number;
  color: string;
};

export default function FinanceRow({
  title,
  percent,
  amount,
  color,
}: FinanceRowProps) {
  return (
    <div className="bg-zinc-900 border border-white/10 rounded-2xl p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-4 h-4 rounded-full ${color}`} />

          <div>
            <h3 className="text-white font-bold text-lg">{title}</h3>

            <p className="text-zinc-400 text-sm">
              {percent}% dari total pemasukan
            </p>
          </div>
        </div>

        <h2 className="text-2xl font-black text-emerald-400">
          {new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            maximumFractionDigits: 0,
          }).format(amount)}
        </h2>
      </div>
    </div>
  );
}

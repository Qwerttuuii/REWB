import CountUp from "react-countup";

interface KPICardProps {
  title: string;
  value: number;
  prefix?: string;
  suffix?: string;
  icon: React.ReactNode;
  color: string;
}

export default function KPICard({
  title,
  value,
  prefix,
  suffix,
  icon,
  color,
}: KPICardProps) {
  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 hover:shadow-lg transition">
      <div className="flex justify-between items-start">

        <div>

          <p className="text-gray-500 text-sm uppercase tracking-wide">
            {title}
          </p>

          <h2 className="text-4xl font-bold mt-3">

            {prefix}

            <CountUp
              end={value}
              duration={1.4}
              separator=","
            />

            {suffix}

          </h2>

        </div>

        <div
          className={`w-14 h-14 rounded-2xl flex items-center justify-center ${color}`}
        >
          {icon}
        </div>

      </div>
    </div>
  );
}
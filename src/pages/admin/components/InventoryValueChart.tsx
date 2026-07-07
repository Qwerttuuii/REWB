import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  Tooltip,
} from "recharts";

const data = [
  { month: "Jan", value: 1200000 },
  { month: "Feb", value: 1500000 },
  { month: "Mar", value: 1750000 },
  { month: "Apr", value: 2300000 },
  { month: "May", value: 2700000 },
  { month: "Jun", value: 3100000 },
];

export default function InventoryValueChart() {
  return (
    <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">

      <h2 className="text-xl font-semibold mb-6">
        Inventory Value Trend
      </h2>

      <div className="h-72">

        <ResponsiveContainer width="100%" height="100%">

          <AreaChart data={data}>

            <XAxis dataKey="month" />

            <Tooltip />

            <Area
              dataKey="value"
              stroke="#059669"
              fill="#A7F3D0"
            />

          </AreaChart>

        </ResponsiveContainer>

      </div>

    </div>
  );
}
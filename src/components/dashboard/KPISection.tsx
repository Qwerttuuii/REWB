import { Package, Warehouse, AlertTriangle, Nfc, PackageX } from "lucide-react";

interface Props {
  totalItems: number;
  inventoryValue: number;
  lowStock: number;
  outOfStock: number;
  warehouses: number;
}

export default function KPISection({
  totalItems,
  inventoryValue,
  lowStock,
  outOfStock,
  warehouses,
}: Props) {
  const cards = [
    {
      title: "TOTAL SKUs",
      value: totalItems,
      icon: Package,
      iconBg: "bg-emerald-100",
      iconColor: "text-emerald-600",
    },
    {
      title: "INVENTORY VALUE",
      value: `₦${inventoryValue.toLocaleString()}`,
      icon: Nfc,
      iconBg: "bg-emerald-100",
      iconColor: "text-emerald-600",
    },
    {
      title: "LOW STOCK",
      value: lowStock,
      icon: AlertTriangle,
      iconBg: lowStock > 0 ? "bg-amber-100" : "bg-emerald-100",
      iconColor: lowStock > 0 ? "text-amber-600" : "text-emerald-600",
    },
    {
      title: "OUT OF STOCK",
      value: outOfStock,
      icon: PackageX,
      iconBg: outOfStock > 0 ? "bg-red-100" : "bg-emerald-100",
      iconColor: outOfStock > 0 ? "text-red-600" : "text-emerald-600",
    },
    {
      title: "ACTIVE SITES",
      value: warehouses,
      icon: Warehouse,
      iconBg: "bg-emerald-100",
      iconColor: "text-emerald-600",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4 lg:gap-6 mb-10">
      {cards.map((card) => (
        <div
          key={card.title}
          className="bg-white rounded-3xl p-5 sm:p-7 border border-gray-100 shadow-sm"
        >
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-500 uppercase tracking-wide">
                {card.title}
              </p>
              <h2 className="text-3xl sm:text-4xl font-bold mt-5 break-words">
                {card.value}
              </h2>
            </div>
            <div className={`w-14 h-14 rounded-2xl ${card.iconBg} flex items-center justify-center`}>
              <card.icon className={card.iconColor} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

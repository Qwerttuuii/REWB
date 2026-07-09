import { FileText } from "lucide-react";

interface DashboardHeaderProps {
  onExportReport: () => void;
}

export default function DashboardHeader({ onExportReport }: DashboardHeaderProps) {
  return (
    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 lg:mb-10 gap-4">
      <div>
        <h1 className="text-3xl sm:text-4xl font-bold text-slate-900">
          Operations Dashboard
        </h1>
        <p className="text-slate-500 mt-2 text-base sm:text-lg">
          System-wide view across all NNPC warehouses, depots and rigs
        </p>
      </div>
      <button
        onClick={onExportReport}
        className="w-full sm:w-auto flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-6 py-3 rounded-2xl transition"
      >
        <FileText size={18} />
        View Reports
      </button>
    </div>
  );
}
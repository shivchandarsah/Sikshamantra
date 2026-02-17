import { RefreshCw } from "lucide-react";

export default function RefreshButton({ onClick, loading = false, className = "" }) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className={`flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      title="Refresh data"
    >
      <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
      <span className="hidden sm:inline">Refresh</span>
    </button>
  );
}

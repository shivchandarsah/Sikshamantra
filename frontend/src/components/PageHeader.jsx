import { ArrowLeft, RotateCw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function PageHeader({ 
  title, 
  subtitle, 
  onRefresh, 
  loading = false,
  showBack = true,
  backPath = null,
  children 
}) {
  const navigate = useNavigate();

  const handleBack = () => {
    if (backPath) {
      navigate(backPath);
    } else {
      navigate(-1);
    }
  };

  return (
    <div className="flex items-start justify-between mb-6">
      <div className="flex items-start gap-4">
        {showBack && (
          <Button
            variant="outline"
            size="icon"
            onClick={handleBack}
            className="mt-1 hover:bg-gray-100"
            title="Go back"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
        )}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
          {subtitle && <p className="text-gray-600 mt-1">{subtitle}</p>}
        </div>
      </div>
      
      <div className="flex items-center gap-3">
        {onRefresh && (
          <Button
            variant="outline"
            size="icon"
            onClick={onRefresh}
            disabled={loading}
            className="hover:bg-gray-100"
            title="Refresh"
          >
            <RotateCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        )}
        {children}
      </div>
    </div>
  );
}

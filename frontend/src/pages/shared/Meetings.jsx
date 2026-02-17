import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import SavedMeetings from "@/components/SavedMeetings";

export default function MeetingsPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header with back arrow */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center justify-center w-10 h-10 rounded-full bg-white border border-gray-200 hover:bg-gray-50 transition-colors shadow-sm"
            title="Go back"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Video Meetings</h1>
            <p className="text-gray-600">Manage and join your scheduled meetings</p>
          </div>
        </div>

        {/* Saved Meetings Component */}
        <SavedMeetings />
      </div>
    </div>
  );
}
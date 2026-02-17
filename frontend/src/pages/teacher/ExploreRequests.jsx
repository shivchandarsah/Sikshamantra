import React, { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import useMyContext from "@/hooks/useMyContext";

// RequestCard component
function RequestCard({ request }) {
  const navigate = useNavigate();
  return (
    <div
      className="relative bg-white border border-neutral-100 rounded-xl shadow-sm p-5 flex flex-col gap-2 hover:shadow-md cursor-pointer transition-shadow group"
      onClick={() => navigate(`/request-details/${request._id}`)}
    >
      <div className="flex items-center justify-between mb-1">
        <span className="font-semibold text-neutral-800  truncate max-w-[70%]">
          {request.topic}
        </span>
        <span
          className={`px-2 py-0.5 rounded-full font-semibold text-xs ${
            request.status === "open"
              ? "bg-green-50 text-green-600"
              : request.status === "closed"
              ? "bg-neutral-200 text-neutral-500"
              : "bg-green-500 text-white"
          }`}
        >
          {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
        </span>
      </div>
      <div className="text-neutral-500  mb-1 truncate">
        {request.description}
      </div>
      <div className="flex flex-wrap gap-3  text-neutral-400 mb-2">
        <span>
          Fee:{" "}
          <span className="text-green-600 font-semibold">
            ₹{request.budget}
          </span>
        </span>
        <span>
          Preferred: {new Date(request.appointmentTime).toLocaleString()}
        </span>
      </div>
    </div>
  );
}

export default function ExploreRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const { postDb } = useMyContext();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchRequests = async () => {
      setLoading(true);
      try {
        const allPosts = await postDb.fetchPostsForTeacher();
        if (allPosts) {
          setRequests(allPosts);
        } else {
          toast.error("Failed to fetch requests.");
        }
      } catch (error) {
        toast.error("Error fetching requests.");
      } finally {
        setLoading(false);
      }
    };
    fetchRequests();
  }, []);

  return (
    <div className="w-full">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center justify-center w-10 h-10 rounded-full bg-white border border-gray-200 hover:bg-gray-50 transition-colors shadow-sm"
            title="Go back"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-neutral-800 mb-1 tracking-tight">
              Recent Requested Topics
            </h1>
            <p className="text-neutral-500 text-base md:text-lg">
              Browse the latest learning requests from students and offer your
              guidance on topics that match your expertise. Help learners grow by
              responding with personalized support or resources.
            </p>
          </div>
        </div>
      </div>
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-600"></div>
        </div>
      ) : requests.length === 0 ? (
        <div className="text-neutral-400 text-center py-16">
          No requests found.{" "}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {requests.slice(0, 6).map((req) => (
            <RequestCard key={req._id} request={req} />
          ))}
        </div>
      )}
    </div>
  );
}

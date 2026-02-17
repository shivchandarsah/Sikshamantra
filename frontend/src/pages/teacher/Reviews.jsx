import { useState } from "react";
import { Star, TrendingUp, Award, Users, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import ReviewsList from "@/components/ReviewsList";
import useMyContext from "@/hooks/useMyContext";

export default function TeacherReviews() {
  const { user } = useMyContext();
  const [statistics, setStatistics] = useState(null);

  // Callback to receive statistics from ReviewsList
  const handleStatisticsUpdate = (stats) => {
    setStatistics(stats);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 rounded-2xl shadow-2xl p-8 text-white relative overflow-hidden">
          {/* Decorative circles */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-32 translate-x-32"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full translate-y-24 -translate-x-24"></div>
          
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-start gap-4">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => window.history.back()}
                  className="mt-1 hover:bg-white/20 text-white"
                  title="Go back"
                >
                  <ArrowLeft className="w-4 h-4" />
                </Button>
                <div>
                  <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
                    <Star className="w-10 h-10 fill-yellow-300 text-yellow-300" />
                    My Reviews
                  </h1>
                  <p className="text-green-100 text-lg">
                    See what students are saying about your teaching
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
              <div className="bg-white/15 backdrop-blur-md rounded-xl p-5 border border-white/30 hover:bg-white/20 transition-all duration-300 shadow-lg">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-white/25 rounded-xl shadow-md">
                    <TrendingUp className="w-7 h-7" />
                  </div>
                  <div>
                    <p className="text-green-100 text-sm font-medium">Average Rating</p>
                    <p className="text-3xl font-bold">
                      {statistics?.averageRating ? statistics.averageRating.toFixed(1) : "0.0"}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white/15 backdrop-blur-md rounded-xl p-5 border border-white/30 hover:bg-white/20 transition-all duration-300 shadow-lg">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-white/25 rounded-xl shadow-md">
                    <Users className="w-7 h-7" />
                  </div>
                  <div>
                    <p className="text-green-100 text-sm font-medium">Total Reviews</p>
                    <p className="text-3xl font-bold">{statistics?.totalReviews || 0}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white/15 backdrop-blur-md rounded-xl p-5 border border-white/30 hover:bg-white/20 transition-all duration-300 shadow-lg">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-white/25 rounded-xl shadow-md">
                    <Award className="w-7 h-7" />
                  </div>
                  <div>
                    <p className="text-green-100 text-sm font-medium">Rating Status</p>
                    <p className="text-2xl font-bold">
                      {statistics?.averageRating >= 4.5 ? "Excellent" :
                       statistics?.averageRating >= 4.0 ? "Very Good" :
                       statistics?.averageRating >= 3.5 ? "Good" :
                       statistics?.averageRating >= 3.0 ? "Average" : "New"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Reviews List */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <ReviewsList 
            userId={user?._id} 
            userRole="teacher"
            onStatisticsUpdate={handleStatisticsUpdate}
          />
        </div>
      </div>
    </div>
  );
}

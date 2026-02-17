import { useEffect, useState } from "react";
import { 
  BarChart3, 
  TrendingUp, 
  Calendar,
  Users,
  FileText,
  Handshake,
  Video,
  MessageSquare
} from "lucide-react";
import useAdmin from "@/utils/services/adminService";
import { toast } from "sonner";

const MetricCard = ({ title, value, icon: Icon, color, change }) => (
  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-600">{title}</p>
        <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
        {change !== undefined && (
          <div className="flex items-center gap-1 mt-2">
            <TrendingUp className={`w-4 h-4 ${change >= 0 ? 'text-green-500' : 'text-red-500'}`} />
            <span className={`text-sm ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {change >= 0 ? '+' : ''}{change}
            </span>
          </div>
        )}
      </div>
      <div className={`p-3 rounded-full ${color}`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
    </div>
  </div>
);

const ChartCard = ({ title, data, type }) => {
  const maxValue = Math.max(...data.map(item => item.count));
  
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      <div className="space-y-3">
        {data.length > 0 ? (
          data.map((item, index) => (
            <div key={index} className="flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1">
                <span className="text-sm text-gray-600 w-20">
                  {new Date(item._id).toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric' 
                  })}
                </span>
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${maxValue > 0 ? (item.count / maxValue) * 100 : 0}%` }}
                  ></div>
                </div>
              </div>
              <span className="text-sm font-medium text-gray-900 ml-3">
                {item.count}
              </span>
            </div>
          ))
        ) : (
          <p className="text-gray-500 text-center py-4">No data available</p>
        )}
      </div>
    </div>
  );
};

export default function AdminAnalytics() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("7d");

  const adminService = useAdmin();

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const data = await adminService.getSystemAnalytics(period);
      setAnalytics(data);
    } catch (error) {
      toast.error("Failed to load analytics data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [period]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Failed to load analytics data</p>
      </div>
    );
  }

  const totalUsers = analytics.data.userRegistrations.reduce((sum, item) => sum + item.count, 0);
  const totalPosts = analytics.data.postCreations.reduce((sum, item) => sum + item.count, 0);
  const totalOffers = analytics.data.offerCreations.reduce((sum, item) => sum + item.count, 0);
  const totalMeetings = analytics.data.meetingCreations.reduce((sum, item) => sum + item.count, 0);
  const totalMessages = analytics.data.chatMessages.reduce((sum, item) => sum + item.count, 0);

  const periodLabels = {
    "24h": "Last 24 Hours",
    "7d": "Last 7 Days", 
    "30d": "Last 30 Days",
    "90d": "Last 90 Days"
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">System Analytics</h1>
          <p className="text-gray-600 mt-1">Monitor platform activity and trends</p>
        </div>
        <div className="flex items-center gap-4">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
          </select>
        </div>
      </div>

      {/* Period Summary */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-blue-600" />
          <h2 className="text-lg font-semibold text-blue-900">
            {periodLabels[period]} Summary
          </h2>
        </div>
        <p className="text-blue-700 mt-1">
          From {new Date(analytics.startDate).toLocaleDateString()} to {new Date(analytics.endDate).toLocaleDateString()}
        </p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <MetricCard
          title="New Users"
          value={totalUsers}
          icon={Users}
          color="bg-blue-500"
        />
        <MetricCard
          title="New Posts"
          value={totalPosts}
          icon={FileText}
          color="bg-green-500"
        />
        <MetricCard
          title="New Offers"
          value={totalOffers}
          icon={Handshake}
          color="bg-orange-500"
        />
        <MetricCard
          title="New Meetings"
          value={totalMeetings}
          icon={Video}
          color="bg-purple-500"
        />
        <MetricCard
          title="Chat Messages"
          value={totalMessages}
          icon={MessageSquare}
          color="bg-teal-500"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard
          title="User Registrations"
          data={analytics.data.userRegistrations}
          type="users"
        />
        <ChartCard
          title="Post Creations"
          data={analytics.data.postCreations}
          type="posts"
        />
        <ChartCard
          title="Offer Creations"
          data={analytics.data.offerCreations}
          type="offers"
        />
        <ChartCard
          title="Meeting Creations"
          data={analytics.data.meetingCreations}
          type="meetings"
        />
      </div>

      {/* Chat Activity */}
      <div className="grid grid-cols-1 gap-6">
        <ChartCard
          title="Chat Messages Activity"
          data={analytics.data.chatMessages}
          type="messages"
        />
      </div>

      {/* Activity Summary */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Activity Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{totalUsers}</div>
            <div className="text-sm text-gray-600">Total New Users</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{totalPosts}</div>
            <div className="text-sm text-gray-600">Total New Posts</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">{totalOffers}</div>
            <div className="text-sm text-gray-600">Total New Offers</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{totalMeetings}</div>
            <div className="text-sm text-gray-600">Total New Meetings</div>
          </div>
        </div>
      </div>
    </div>
  );
}
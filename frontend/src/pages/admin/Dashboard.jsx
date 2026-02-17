import { useEffect, useState } from "react";
import { 
  Users, 
  FileText, 
  Handshake, 
  Video, 
  MessageSquare, 
  Bell,
  TrendingUp,
  Calendar,
  Activity,
  RefreshCw
} from "lucide-react";
import useAdmin from "@/utils/services/adminService";
import { toast } from "sonner";
import PageHeader from "@/components/PageHeader";

const StatCard = ({ title, value, icon: Icon, color, trend }) => (
  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-600">{title}</p>
        <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
        {trend && (
          <div className="flex items-center gap-1 mt-2">
            <TrendingUp className="w-4 h-4 text-green-500" />
            <span className="text-sm text-green-600">+{trend}% this week</span>
          </div>
        )}
      </div>
      <div className={`p-3 rounded-full ${color}`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
    </div>
  </div>
);

const RecentActivityCard = ({ title, items, type }) => (
  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
    <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
    <div className="space-y-3">
      {items.length > 0 ? (
        items.map((item, index) => (
          <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
            <div className="flex-1">
              {type === "users" && (
                <>
                  <p className="font-medium text-gray-900">{item.fullName}</p>
                  <p className="text-sm text-gray-500">{item.email}</p>
                  <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                    item.role === 'admin' ? 'bg-red-100 text-red-800' :
                    item.role === 'teacher' ? 'bg-blue-100 text-blue-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {item.role}
                  </span>
                </>
              )}
              {type === "posts" && (
                <>
                  <p className="font-medium text-gray-900">{item.topic}</p>
                  <p className="text-sm text-gray-500">by {item.studentDetail?.fullName}</p>
                </>
              )}
              {type === "offers" && (
                <>
                  <p className="font-medium text-gray-900">
                    {item.offeredBy?.fullName} → {item.offeredTo?.fullName}
                  </p>
                  <p className="text-sm text-gray-500">₹{item.proposed_price}</p>
                </>
              )}
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500">
                {new Date(item.createdAt).toLocaleDateString()}
              </p>
              {item.status && (
                <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                  item.status === 'Accepted' ? 'bg-green-100 text-green-800' :
                  item.status === 'Rejected' ? 'bg-red-100 text-red-800' :
                  item.status === 'open' ? 'bg-blue-100 text-blue-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {item.status}
                </span>
              )}
            </div>
          </div>
        ))
      ) : (
        <p className="text-gray-500 text-center py-4">No recent activity</p>
      )}
    </div>
  </div>
);

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const adminService = useAdmin();

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const data = await adminService.getDashboardStats();
      setStats(data);
    } catch (error) {
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Failed to load dashboard data</p>
      </div>
    );
  }

  const statCards = [
    {
      title: "Total Users",
      value: stats.overview.totalUsers,
      icon: Users,
      color: "bg-blue-500",
      trend: Math.round((stats.activity.newUsersThisWeek / stats.overview.totalUsers) * 100)
    },
    {
      title: "Students",
      value: stats.overview.totalStudents,
      icon: Users,
      color: "bg-green-500"
    },
    {
      title: "Teachers",
      value: stats.overview.totalTeachers,
      icon: Users,
      color: "bg-purple-500"
    },
    {
      title: "Admins",
      value: stats.overview.totalAdmins,
      icon: Users,
      color: "bg-red-500"
    },
    {
      title: "Total Posts",
      value: stats.overview.totalPosts,
      icon: FileText,
      color: "bg-indigo-500",
      trend: Math.round((stats.activity.postsThisWeek / stats.overview.totalPosts) * 100)
    },
    {
      title: "Total Offers",
      value: stats.overview.totalOffers,
      icon: Handshake,
      color: "bg-orange-500",
      trend: Math.round((stats.activity.offersThisWeek / stats.overview.totalOffers) * 100)
    },
    {
      title: "Meetings",
      value: stats.overview.totalMeetings,
      icon: Video,
      color: "bg-pink-500"
    },
    {
      title: "Messages",
      value: stats.overview.totalChats,
      icon: MessageSquare,
      color: "bg-teal-500"
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Admin Dashboard"
        subtitle="Welcome to Siksha Mantra administration panel"
        onRefresh={fetchDashboardData}
        loading={loading}
        showBack={false}
      >
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Activity className="w-4 h-4" />
          <span>Last updated: {new Date().toLocaleTimeString()}</span>
        </div>
      </PageHeader>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, index) => (
          <StatCard key={index} {...card} />
        ))}
      </div>

      {/* Activity Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Weekly Activity</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">New Users</span>
              <span className="font-semibold text-blue-600">{stats.activity.newUsersThisWeek}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">New Posts</span>
              <span className="font-semibold text-green-600">{stats.activity.postsThisWeek}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">New Offers</span>
              <span className="font-semibold text-orange-600">{stats.activity.offersThisWeek}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Activity</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">New Users</span>
              <span className="font-semibold text-blue-600">{stats.activity.newUsersThisMonth}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">New Posts</span>
              <span className="font-semibold text-green-600">{stats.activity.postsThisMonth}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">New Offers</span>
              <span className="font-semibold text-orange-600">{stats.activity.offersThisMonth}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <RecentActivityCard 
          title="Recent Users" 
          items={stats.recent.users} 
          type="users"
        />
        <RecentActivityCard 
          title="Recent Posts" 
          items={stats.recent.posts} 
          type="posts"
        />
        <RecentActivityCard 
          title="Recent Offers" 
          items={stats.recent.offers} 
          type="offers"
        />
      </div>
    </div>
  );
}
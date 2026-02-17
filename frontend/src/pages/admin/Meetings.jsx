import { useEffect, useState } from "react";
import { 
  Video, 
  Search, 
  Calendar,
  User,
  Clock,
  Users,
  Eye,
  Play,
  Square
} from "lucide-react";
import useAdmin from "@/utils/services/adminService";
import { toast } from "sonner";

const StatusBadge = ({ status }) => {
  const colors = {
    scheduled: "bg-blue-100 text-blue-800",
    ongoing: "bg-green-100 text-green-800",
    completed: "bg-gray-100 text-gray-800",
    cancelled: "bg-red-100 text-red-800"
  };
  
  return (
    <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${colors[status] || colors.scheduled}`}>
      {status || 'scheduled'}
    </span>
  );
};

export default function AdminMeetings() {
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({});
  const [filters, setFilters] = useState({
    page: 1,
    limit: 20,
    status: "all",
    sortBy: "createdAt",
    sortOrder: "desc"
  });

  const adminService = useAdmin();

  const fetchMeetings = async () => {
    try {
      setLoading(true);
      const data = await adminService.getAllMeetings(filters);
      setMeetings(data.meetings);
      setPagination(data.pagination);
    } catch (error) {
      toast.error("Failed to fetch meetings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMeetings();
  }, [filters]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: key !== 'page' ? 1 : value
    }));
  };

  const formatDuration = (startTime, endTime) => {
    if (!startTime || !endTime) return 'N/A';
    const duration = new Date(endTime) - new Date(startTime);
    const minutes = Math.floor(duration / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    
    if (hours > 0) {
      return `${hours}h ${remainingMinutes}m`;
    }
    return `${remainingMinutes}m`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Meetings Management</h1>
          <p className="text-gray-600 mt-1">Monitor all video meetings and sessions</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Video className="w-4 h-4" />
          <span>Total: {pagination.totalMeetings || 0}</span>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex flex-wrap gap-4">
          <select
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="scheduled">Scheduled</option>
            <option value="ongoing">Ongoing</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>

          <select
            value={filters.sortBy}
            onChange={(e) => handleFilterChange('sortBy', e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="createdAt">Created Date</option>
            <option value="scheduledTime">Scheduled Time</option>
            <option value="status">Status</option>
          </select>

          <select
            value={filters.sortOrder}
            onChange={(e) => handleFilterChange('sortOrder', e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="desc">Newest First</option>
            <option value="asc">Oldest First</option>
          </select>
        </div>
      </div>

      {/* Meetings Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : meetings.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Meeting Details
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Host
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Participants
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Schedule
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Duration
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {meetings.map((meeting) => (
                    <tr key={meeting._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-medium text-gray-900">
                            {meeting.subject || 'Untitled Meeting'}
                          </div>
                          <div className="text-sm text-gray-500">
                            ID: {meeting.meetingId}
                          </div>
                          {meeting.description && (
                            <div className="text-xs text-gray-400 mt-1 max-w-xs truncate">
                              {meeting.description}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <User className="w-4 h-4 text-gray-400 mr-2" />
                          <div>
                            <div className="font-medium text-gray-900">
                              {meeting.createdBy?.fullName || 'Unknown'}
                            </div>
                            <div className="text-sm text-gray-500">
                              {meeting.createdBy?.email}
                            </div>
                            <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                              meeting.createdBy?.role === 'teacher' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                            }`}>
                              {meeting.createdBy?.role}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <Users className="w-4 h-4 text-gray-400 mr-2" />
                          <span className="font-medium text-gray-900">
                            {meeting.participants?.length || 0}
                          </span>
                        </div>
                        {meeting.participants?.slice(0, 2).map((participant, index) => (
                          <div key={index} className="text-xs text-gray-500">
                            {participant.fullName}
                          </div>
                        ))}
                        {meeting.participants?.length > 2 && (
                          <div className="text-xs text-gray-400">
                            +{meeting.participants.length - 2} more
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center text-sm text-gray-500">
                          <Calendar className="w-4 h-4 mr-1" />
                          <div>
                            {meeting.scheduledTime ? (
                              <>
                                <div>{new Date(meeting.scheduledTime).toLocaleDateString()}</div>
                                <div className="text-xs">
                                  {new Date(meeting.scheduledTime).toLocaleTimeString()}
                                </div>
                              </>
                            ) : (
                              <div>Instant Meeting</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center text-sm text-gray-500">
                          <Clock className="w-4 h-4 mr-1" />
                          {formatDuration(meeting.startedAt, meeting.completedAt)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={meeting.status} />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            className="p-1 text-blue-600 hover:text-blue-800 transition-colors"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {meeting.status === 'ongoing' && (
                            <button
                              className="p-1 text-red-600 hover:text-red-800 transition-colors"
                              title="End Meeting"
                            >
                              <Square className="w-4 h-4" />
                            </button>
                          )}
                          {meeting.status === 'scheduled' && (
                            <button
                              className="p-1 text-green-600 hover:text-green-800 transition-colors"
                              title="Start Meeting"
                            >
                              <Play className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
                <div className="text-sm text-gray-500">
                  Showing {((pagination.currentPage - 1) * filters.limit) + 1} to{' '}
                  {Math.min(pagination.currentPage * filters.limit, pagination.totalMeetings)} of{' '}
                  {pagination.totalMeetings} meetings
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleFilterChange('page', pagination.currentPage - 1)}
                    disabled={!pagination.hasPrevPage}
                    className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <span className="px-3 py-1 text-sm bg-blue-600 text-white rounded">
                    {pagination.currentPage}
                  </span>
                  <button
                    onClick={() => handleFilterChange('page', pagination.currentPage + 1)}
                    disabled={!pagination.hasNextPage}
                    className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12">
            <Video className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No meetings found</p>
          </div>
        )}
      </div>
    </div>
  );
}
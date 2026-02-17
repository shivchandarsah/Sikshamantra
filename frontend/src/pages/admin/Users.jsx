import { useEffect, useState } from "react";
import { 
  Users, 
  Search, 
  Filter, 
  MoreVertical, 
  Edit, 
  Trash2, 
  Shield, 
  ShieldCheck,
  UserCheck,
  UserX,
  ChevronLeft,
  ChevronRight,
  RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ProfileAvatar from "@/components/ProfileAvatar";
import useAdmin from "@/utils/services/adminService";
import { toast } from "sonner";

const RoleChangeModal = ({ isOpen, onClose, user, onConfirm }) => {
  const [selectedRole, setSelectedRole] = useState(user?.role || "");

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (selectedRole && selectedRole !== user.role) {
      onConfirm(user._id, selectedRole);
    }
    onClose();
  };

  const roleOptions = [
    { value: "student", label: "Student", icon: Users, color: "text-green-600 bg-green-50" },
    { value: "teacher", label: "Teacher", icon: Users, color: "text-blue-600 bg-blue-50" },
    { value: "admin", label: "Admin", icon: ShieldCheck, color: "text-red-600 bg-red-50" }
  ];

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md transform transition-all">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Shield className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-gray-900">Change User Role</h3>
            <p className="text-sm text-gray-500">Update permissions for this user</p>
          </div>
        </div>

        {/* User Info */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-3">
            <ProfileAvatar user={user} size="md" />
            <div>
              <p className="font-medium text-gray-900">{user?.fullName}</p>
              <p className="text-sm text-gray-500">{user?.email}</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Role Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Select New Role
            </label>
            <div className="space-y-2">
              {roleOptions.map((option) => {
                const Icon = option.icon;
                return (
                  <label
                    key={option.value}
                    className={`flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      selectedRole === option.value
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300 bg-white"
                    }`}
                  >
                    <input
                      type="radio"
                      name="role"
                      value={option.value}
                      checked={selectedRole === option.value}
                      onChange={(e) => setSelectedRole(e.target.value)}
                      className="w-4 h-4 text-blue-600"
                    />
                    <div className={`p-2 rounded-lg ${option.color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{option.label}</p>
                      <p className="text-xs text-gray-500">
                        {option.value === "admin" && "Full system access"}
                        {option.value === "teacher" && "Can create offers and teach"}
                        {option.value === "student" && "Can create requests and learn"}
                      </p>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button 
              type="submit" 
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
              disabled={selectedRole === user?.role}
            >
              <Shield className="w-4 h-4 mr-2" />
              Change Role
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose} 
              className="flex-1 border-gray-300 hover:bg-gray-50"
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

const DeleteConfirmModal = ({ isOpen, onClose, user, onConfirm }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md transform transition-all">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-red-100 rounded-lg">
            <Trash2 className="w-6 h-6 text-red-600" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-gray-900">Permanently Delete User</h3>
            <p className="text-sm text-red-600 font-medium">This action cannot be undone!</p>
          </div>
        </div>

        {/* User Info */}
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-3">
            <ProfileAvatar user={user} size="md" />
            <div>
              <p className="font-medium text-gray-900">{user?.fullName}</p>
              <p className="text-sm text-gray-600">{user?.email}</p>
              <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium mt-1 ${
                user?.role === "admin" ? "bg-red-100 text-red-800" :
                user?.role === "teacher" ? "bg-blue-100 text-blue-800" :
                "bg-green-100 text-green-800"
              }`}>
                {user?.role}
              </span>
            </div>
          </div>
        </div>

        {/* Warning */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-yellow-800">
            <strong>⚠️ Permanent Deletion:</strong> This will permanently delete the user and ALL their related data including:
          </p>
          <ul className="text-sm text-yellow-800 mt-2 ml-4 list-disc">
            <li>User account and profile</li>
            <li>All posts and requests</li>
            <li>All offers (sent and received)</li>
            <li>All meetings and appointments</li>
            <li>All chat messages</li>
            <li>All notifications</li>
          </ul>
          <p className="text-sm text-red-600 font-semibold mt-2">
            This action cannot be undone!
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button 
            onClick={() => {
              onConfirm(user._id);
              onClose();
            }}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Permanently Delete
          </Button>
          <Button 
            variant="outline" 
            onClick={onClose} 
            className="flex-1 border-gray-300 hover:bg-gray-50"
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
};

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({});
  const [filters, setFilters] = useState({
    page: 1,
    limit: 20,
    role: "all",
    search: "",
    sortBy: "createdAt",
    sortOrder: "desc"
  });
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  const adminService = useAdmin();

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await adminService.getAllUsers(filters);
      setUsers(data.users);
      setPagination(data.pagination);
    } catch (error) {
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [filters]);

  const handleSearch = (e) => {
    setFilters(prev => ({ ...prev, search: e.target.value, page: 1 }));
  };

  const handleRoleFilter = (role) => {
    setFilters(prev => ({ ...prev, role, page: 1 }));
  };

  const handleSort = (sortBy) => {
    setFilters(prev => ({
      ...prev,
      sortBy,
      sortOrder: prev.sortBy === sortBy && prev.sortOrder === "desc" ? "asc" : "desc",
      page: 1
    }));
  };

  const handlePageChange = (newPage) => {
    setFilters(prev => ({ ...prev, page: newPage }));
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      await adminService.changeUserRole(userId, newRole);
      toast.success("User role changed successfully");
      fetchUsers();
    } catch (error) {
      toast.error("Failed to change user role");
    }
  };

  const handleToggleStatus = async (userId) => {
    try {
      await adminService.toggleUserStatus(userId);
      toast.success("User status updated successfully");
      fetchUsers();
    } catch (error) {
      toast.error("Failed to update user status");
    }
  };

  const handleDeleteUser = async (userId) => {
    try {
      await adminService.deleteUser(userId);
      toast.success("User deleted successfully");
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete user");
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case "admin": return "bg-red-100 text-red-800";
      case "teacher": return "bg-blue-100 text-blue-800";
      case "student": return "bg-green-100 text-green-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case "admin": return ShieldCheck;
      case "teacher": return Users;
      case "student": return Users;
      default: return Users;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600 mt-1">Manage all users in the system</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Users className="w-4 h-4" />
          <span>Total: {pagination.totalUsers || 0} users</span>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search users by name or email..."
                value={filters.search}
                onChange={handleSearch}
                className="pl-10"
              />
            </div>
          </div>

          {/* Role Filter */}
          <div className="flex gap-2">
            {["all", "student", "teacher", "admin"].map((role) => (
              <Button
                key={role}
                variant={filters.role === role ? "default" : "outline"}
                size="sm"
                onClick={() => handleRoleFilter(role)}
                className="capitalize"
              >
                {role === "all" ? "All Roles" : role}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort("role")}
                >
                  Role
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort("createdAt")}
                >
                  Joined
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
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  </td>
                </tr>
              ) : users.length > 0 ? (
                users.map((user) => {
                  const RoleIcon = getRoleIcon(user.role);
                  return (
                    <tr key={user._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <ProfileAvatar user={user} size="sm" />
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {user.fullName}
                            </div>
                            <div className="text-sm text-gray-500">
                              {user.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
                          <RoleIcon className="w-3 h-3" />
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                          user.isEmailVerified 
                            ? "bg-green-100 text-green-800" 
                            : "bg-red-100 text-red-800"
                        }`}>
                          {user.isEmailVerified ? (
                            <>
                              <UserCheck className="w-3 h-3" />
                              Active
                            </>
                          ) : (
                            <>
                              <UserX className="w-3 h-3" />
                              Disabled
                            </>
                          )}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedUser(user);
                              setShowRoleModal(true);
                            }}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleToggleStatus(user._id)}
                          >
                            {user.isEmailVerified ? (
                              <UserX className="w-4 h-4" />
                            ) : (
                              <UserCheck className="w-4 h-4" />
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedUser(user);
                              setShowDeleteModal(true);
                            }}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                    No users found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="bg-gray-50 px-6 py-3 flex items-center justify-between border-t border-gray-200">
            <div className="text-sm text-gray-700">
              Showing {((pagination.currentPage - 1) * filters.limit) + 1} to{" "}
              {Math.min(pagination.currentPage * filters.limit, pagination.totalUsers)} of{" "}
              {pagination.totalUsers} results
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handlePageChange(pagination.currentPage - 1)}
                disabled={!pagination.hasPrevPage}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-sm text-gray-700">
                Page {pagination.currentPage} of {pagination.totalPages}
              </span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handlePageChange(pagination.currentPage + 1)}
                disabled={!pagination.hasNextPage}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Role Change Modal */}
      <RoleChangeModal
        isOpen={showRoleModal}
        onClose={() => setShowRoleModal(false)}
        user={selectedUser}
        onConfirm={handleRoleChange}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        user={selectedUser}
        onConfirm={handleDeleteUser}
      />
    </div>
  );
}
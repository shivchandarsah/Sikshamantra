import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import useMyContext from "@/hooks/useMyContext";
import axiosInstance from "@/helper/axios";
import { toast } from "sonner";
import { Star, Calendar, Users, Award, User, Phone, Mail, ArrowLeft, Hash, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import ProfileAvatar from "@/components/ProfileAvatar.jsx";

export default function StudentProfileView() {
  const { studentId } = useParams();
  const navigate = useNavigate();
  const { user, userLoaded, initialized } = useMyContext();
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStudentProfile = async () => {
      if (!user || !userLoaded || !initialized) {
        return;
      }

      if (!studentId) {
        toast.error("Invalid student ID");
        navigate(-1);
        return;
      }

      try {
        // Fetch student profile data
        const response = await axiosInstance.get(`/users/profile/student/${studentId}`);
        setProfileData(response.data.data);
      } catch (error) {
        if (error.response?.status === 404) {
          toast.error("Student profile not found");
          navigate(-1);
        } else {
          toast.error("Failed to load student profile");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchStudentProfile();
  }, [studentId, user, userLoaded, initialized, navigate]);

  // Loading state
  if (loading || !userLoaded || !initialized) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-neutral-500">Loading student profile...</p>
        </div>
      </div>
    );
  }

  // No data state
  if (!profileData) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Student profile not available</p>
        <Button onClick={() => navigate(-1)} className="mt-4">
          Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 space-y-6">
        {/* Profile Header */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate(-1)}
                className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-100 border border-gray-200 hover:bg-gray-200 transition-colors shadow-sm"
                title="Go back"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div className="h-20 w-20 bg-blue-100 rounded-full flex items-center justify-center relative">
                {profileData.user.profilePicture ? (
                  <img 
                    src={profileData.user.profilePicture} 
                    alt="Profile" 
                    className="h-20 w-20 rounded-full object-cover"
                  />
                ) : (
                  <User className="h-10 w-10 text-blue-600" />
                )}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">
                  {profileData.user.fullName}
                </h1>
                <p className="text-gray-600">{profileData.user.email}</p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {profileData.user.age && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                      <Hash className="h-3 w-3" />
                      {profileData.user.age} years
                    </span>
                  )}
                  {profileData.user.phoneNumber && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                      <Phone className="h-3 w-3" />
                      {profileData.user.phoneNumber}
                    </span>
                  )}
                  {profileData.user.qualification && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-sm">
                      <GraduationCap className="h-3 w-3" />
                      {profileData.user.qualification}
                    </span>
                  )}
                  {profileData.user.currentCenter && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-800 rounded-full text-sm">
                      <User className="h-3 w-3" />
                      {profileData.user.currentCenter}
                    </span>
                  )}
                </div>
                <span className="inline-block mt-2 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                  Student
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Contact Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-gray-500" />
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="font-medium">{profileData.user.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Phone className="h-5 w-5 text-gray-500" />
              <div>
                <p className="text-sm text-gray-500">Phone</p>
                <p className="font-medium">{profileData.user.phoneNumber || 'Not provided'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Total Requests</p>
                <p className="text-3xl font-bold text-gray-800 mt-2">
                  {profileData.stats?.totalRequests || 0}
                </p>
              </div>
              <Users className="h-10 w-10 text-blue-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Active Requests</p>
                <p className="text-3xl font-bold text-gray-800 mt-2">
                  {profileData.stats?.activeRequests || 0}
                </p>
              </div>
              <Calendar className="h-10 w-10 text-green-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Completed Sessions</p>
                <p className="text-3xl font-bold text-gray-800 mt-2">
                  {profileData.stats?.completedSessions || 0}
                </p>
              </div>
              <Award className="h-10 w-10 text-purple-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Average Rating</p>
                <div className="flex items-center gap-2 mt-2">
                  <p className="text-3xl font-bold text-gray-800">
                    {profileData.stats?.averageRating || 'N/A'}
                  </p>
                  <Star className="h-6 w-6 text-yellow-500 fill-yellow-500" />
                </div>
              </div>
              <Star className="h-10 w-10 text-yellow-600" />
            </div>
          </div>
        </div>

        {/* Recent Requests */}
        {profileData.recentRequests && profileData.recentRequests.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Recent Requests</h2>
            <div className="space-y-3">
              {profileData.recentRequests.slice(0, 5).map((request) => (
                <div
                  key={request._id}
                  className="border rounded-lg p-4 hover:bg-gray-50"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold text-gray-800">
                        {request.topic}
                      </p>
                      <p className="text-gray-600 text-sm mt-1">
                        {request.description}
                      </p>
                      <p className="text-green-600 text-sm mt-1">
                        Budget: ₹{request.budget}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        request.status === 'open' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {request.status}
                      </span>
                      <p className="text-gray-500 text-xs mt-1">
                        {new Date(request.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
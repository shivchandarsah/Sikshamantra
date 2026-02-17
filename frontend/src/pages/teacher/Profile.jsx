import { useEffect, useState } from "react";
import useMyContext from "@/hooks/useMyContext";
import axiosInstance from "@/helper/axios";
import { toast } from "sonner";
import { Star, Calendar, Users, Award, User, Edit, Save, X, Phone, Mail, ArrowLeft, Upload, Hash, GraduationCap, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import ProfileAvatar from "@/components/ProfileAvatar.jsx";
import { useNavigate } from "react-router-dom";

export default function TeacherProfile() {
  const { user, userLoaded, initialized, auth } = useMyContext();
  const navigate = useNavigate();
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  
  // Students data
  const [students, setStudents] = useState([]);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user || !userLoaded || !initialized || user.role !== 'teacher') {
        return;
      }

      try {
        const [profileRes, studentsRes] = await Promise.allSettled([
          axiosInstance.get("/users/profile/teacher"),
          axiosInstance.get("/offers/fetchOffers")
        ]);

        if (profileRes.status === 'fulfilled') {
          setProfileData(profileRes.value.data.data);
          setEditForm(profileRes.value.data.data.user);
        }

        if (studentsRes.status === 'fulfilled') {
          const acceptedOffers = studentsRes.value.data.data.filter(offer => offer.status === 'Accepted');
          
          // Remove duplicate students (same student can have multiple accepted offers)
          const uniqueStudents = new Map();
          acceptedOffers.forEach(offer => {
            const studentId = offer.offeredTo._id;
            if (!uniqueStudents.has(studentId)) {
              uniqueStudents.set(studentId, {
                ...offer.offeredTo,
                post: offer.post, // Keep the first post for display
                totalOffers: 1
              });
            } else {
              // Increment offer count for this student
              const existing = uniqueStudents.get(studentId);
              existing.totalOffers += 1;
            }
          });
          
          setStudents(Array.from(uniqueStudents.values()));
        }
      } catch (error) {
        toast.error("Failed to load profile data");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user, userLoaded, initialized]);

  // Edit profile functions
  const handleEdit = () => {
    setEditing(true);
  };

  const handleSave = async () => {
    try {
      const response = await axiosInstance.put("/users/profile", editForm);
      setProfileData(prev => ({ ...prev, user: response.data.data }));
      setEditing(false);
      toast.success("Profile updated successfully");
      
      if (auth.refreshUser) {
        await auth.refreshUser();
      }
    } catch (error) {
      toast.error("Failed to update profile");
    }
  };

  const handleCancel = () => {
    setEditForm(profileData.user);
    setEditing(false);
  };

  // Navigate to student profile
  const handleViewStudentProfile = (studentId) => {
    navigate(`/student-profile/${studentId}`);
  };

  // Loading states
  if (loading || !userLoaded || !initialized) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-neutral-500">Loading profile...</p>
        </div>
      </div>
    );
  }

  // Access control
  if (user?.role !== 'teacher') {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-neutral-500 mb-4">Access denied. This page is for teachers only.</p>
        </div>
      </div>
    );
  }

  // No data state
  if (!profileData) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No profile data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
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
            <div className="h-20 w-20 bg-green-100 rounded-full flex items-center justify-center relative">
              {editing ? (
                <div className="relative">
                  {editForm.profilePicture ? (
                    <img 
                      src={editForm.profilePicture} 
                      alt="Profile" 
                      className="h-20 w-20 rounded-full object-cover"
                    />
                  ) : (
                    <User className="h-10 w-10 text-green-600" />
                  )}
                  <label 
                    className="absolute -bottom-1 -right-1 bg-green-600 text-white rounded-full p-1 hover:bg-green-700 cursor-pointer"
                    htmlFor="teacher-profile-picture-upload"
                  >
                    <Upload className="h-3 w-3" />
                  </label>
                  <input
                    id="teacher-profile-picture-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (!file) return;

                      // Validate file
                      if (file.size > 5 * 1024 * 1024) {
                        toast.error("Image size must be less than 5MB");
                        return;
                      }
                      
                      if (!file.type.startsWith('image/')) {
                        toast.error("Please select a valid image file");
                        return;
                      }
                      
                      // Read and convert to base64
                      const reader = new FileReader();
                      reader.onload = (e) => {
                        setEditForm(prev => ({ ...prev, profilePicture: e.target.result }));
                      };
                      reader.onerror = () => {
                        toast.error("Failed to read image file");
                      };
                      reader.readAsDataURL(file);
                    }}
                  />
                </div>
              ) : (
                profileData.user.profilePicture ? (
                  <img 
                    src={profileData.user.profilePicture} 
                    alt="Profile" 
                    className="h-20 w-20 rounded-full object-cover"
                  />
                ) : (
                  <User className="h-10 w-10 text-green-600" />
                )
              )}
            </div>
            <div>
              {editing ? (
                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="Full Name"
                    value={editForm.fullName || ''}
                    onChange={(e) => setEditForm(prev => ({ ...prev, fullName: e.target.value }))}
                    className="text-2xl font-bold text-gray-800 border-b border-gray-300 focus:border-green-500 outline-none bg-transparent w-full"
                  />
                  <input
                    type="email"
                    placeholder="Email"
                    value={editForm.email || ''}
                    onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                    className="text-gray-600 border-b border-gray-300 focus:border-green-500 outline-none bg-transparent w-full"
                    disabled
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="number"
                      placeholder="Age"
                      value={editForm.age || ''}
                      onChange={(e) => setEditForm(prev => ({ ...prev, age: e.target.value }))}
                      className="text-gray-600 border-b border-gray-300 focus:border-green-500 outline-none bg-transparent"
                      min="1"
                      max="120"
                    />
                    <input
                      type="tel"
                      placeholder="Phone Number"
                      value={editForm.phoneNumber || ''}
                      onChange={(e) => setEditForm(prev => ({ ...prev, phoneNumber: e.target.value }))}
                      className="text-gray-600 border-b border-gray-300 focus:border-green-500 outline-none bg-transparent"
                    />
                  </div>
                  <input
                    type="text"
                    placeholder="Current Institution"
                    value={editForm.currentCenter || ''}
                    onChange={(e) => setEditForm(prev => ({ ...prev, currentCenter: e.target.value }))}
                    className="text-gray-600 border-b border-gray-300 focus:border-green-500 outline-none bg-transparent w-full"
                  />
                  <input
                    type="text"
                    placeholder="Qualification/Degree"
                    value={editForm.qualification || ''}
                    onChange={(e) => setEditForm(prev => ({ ...prev, qualification: e.target.value }))}
                    className="text-gray-600 border-b border-gray-300 focus:border-green-500 outline-none bg-transparent w-full"
                  />
                </div>
              ) : (
                <>
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
                </>
              )}
              <span className="inline-block mt-2 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                Teacher
              </span>
            </div>
          </div>
          
          <div className="flex gap-2">
            {editing ? (
              <>
                <Button onClick={handleSave} className="bg-green-600 hover:bg-green-700">
                  <Save className="h-4 w-4 mr-2" />
                  Save
                </Button>
                <Button onClick={handleCancel} variant="outline">
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
              </>
            ) : (
              <Button onClick={handleEdit} variant="outline">
                <Edit className="h-4 w-4 mr-2" />
                Edit Profile
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Contact Information */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-800">Contact Information</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

      {/* Students Section */}
      {students.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Users className="h-5 w-5" />
            My Students
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {students.map((student) => (
              <div 
                key={student._id} 
                className="border rounded-lg p-4 hover:bg-gray-50 transition-colors cursor-pointer hover:shadow-md"
                onClick={() => handleViewStudentProfile(student._id)}
              >
                <div className="flex items-center gap-3 mb-3">
                  <ProfileAvatar 
                    user={student} 
                    size="md"
                  />
                  <div className="flex-1">
                    <p className="font-semibold text-gray-800">{student.fullName}</p>
                    <p className="text-sm text-gray-500">{student.email}</p>
                    {student.post && (
                      <p className="text-xs text-green-600 font-medium">
                        Request: {student.post.topic}
                        {student.totalOffers > 1 && (
                          <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                            +{student.totalOffers - 1} more
                          </span>
                        )}
                      </p>
                    )}
                  </div>
                </div>
                <div className="text-center">
                  <span className="text-sm text-blue-600 hover:text-blue-800 font-medium">
                    View Profile →
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Total Reviews</p>
              <p className="text-3xl font-bold text-gray-800 mt-2">
                {profileData.stats.totalReviews}
              </p>
            </div>
            <MessageCircle className="h-10 w-10 text-blue-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Average Rating</p>
              <div className="flex items-center gap-2 mt-2">
                <p className="text-3xl font-bold text-gray-800">
                  {profileData.stats.averageRating}
                </p>
                <Star className="h-6 w-6 text-yellow-500 fill-yellow-500" />
              </div>
            </div>
            <Star className="h-10 w-10 text-yellow-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Classes Taken</p>
              <p className="text-3xl font-bold text-gray-800 mt-2">
                {profileData.stats.classesTaken}
              </p>
            </div>
            <Calendar className="h-10 w-10 text-green-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Accepted Offers</p>
              <p className="text-3xl font-bold text-gray-800 mt-2">
                {profileData.stats.acceptedOffers}
              </p>
            </div>
            <Award className="h-10 w-10 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Total Offers</p>
              <p className="text-2xl font-bold text-gray-800 mt-2">
                {profileData.stats.totalOffers}
              </p>
            </div>
            <Users className="h-8 w-8 text-indigo-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Pending Offers</p>
              <p className="text-2xl font-bold text-gray-800 mt-2">
                {profileData.stats.pendingOffers}
              </p>
            </div>
            <Award className="h-8 w-8 text-orange-600" />
          </div>
        </div>
      </div>

      {/* Reviews Section */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Reviews</h2>
        {profileData.reviews.length > 0 ? (
          <div className="space-y-4">
            {profileData.reviews.map((review) => (
              <div
                key={review._id}
                className="border-l-4 border-yellow-500 pl-4 py-3 hover:bg-gray-50 rounded"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-5 w-5 ${
                            i < review.rating
                              ? "text-yellow-500 fill-yellow-500"
                              : "text-gray-300"
                          }`}
                        />
                      ))}
                      <span className="text-gray-600 text-sm ml-2">
                        ({review.rating}/5)
                      </span>
                    </div>
                    {review.comment && (
                      <p className="text-gray-700 mb-2">{review.comment}</p>
                    )}
                    {review.student && (
                      <p className="text-gray-600 text-sm">
                        By: {review.student.fullName}
                      </p>
                    )}
                  </div>
                  <span className="text-gray-500 text-xs">
                    {new Date(review.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No reviews yet</p>
        )}
      </div>

      {/* Appointments Section */}
      {profileData.appointments.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            Recent Classes
          </h2>
          <div className="space-y-3">
            {profileData.appointments.slice(0, 5).map((appointment) => (
              <div
                key={appointment._id}
                className="border rounded-lg p-4 hover:bg-gray-50"
              >
                <div className="flex justify-between items-start">
                  <div>
                    {appointment.student && (
                      <p className="font-semibold text-gray-800">
                        Student: {appointment.student.fullName}
                      </p>
                    )}
                    {appointment.course && (
                      <p className="text-gray-600 text-sm mt-1">
                        Course: {appointment.course.topic}
                      </p>
                    )}
                  </div>
                  {appointment.scheduleTime && (
                    <div className="text-right">
                      <p className="text-gray-600 text-sm">
                        {new Date(appointment.scheduleTime).toLocaleDateString()}
                      </p>
                      <p className="text-gray-500 text-xs">
                        {new Date(appointment.scheduleTime).toLocaleTimeString()}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}


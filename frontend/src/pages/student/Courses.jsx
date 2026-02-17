import { useState, useEffect } from "react";
import { BookOpen, Download, Search, Filter, X, TrendingUp, Award, ArrowLeft, RotateCw, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import useCourse from "@/utils/services/courseService";
import PaymentButton from "@/components/PaymentButton";
import paymentService from "@/utils/services/paymentService";
import { toast } from "sonner";

export default function StudentCourses() {
  const [courses, setCourses] = useState([]);
  const [filteredCourses, setFilteredCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [paidCourses, setPaidCourses] = useState(new Set());
  const [filters, setFilters] = useState({
    subject: "",
    grade: "",
    tag: "",
  });
  const [showFilters, setShowFilters] = useState(false);

  const courseService = useCourse();

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const data = await courseService.getAllCourses();
      setCourses(data.courses || []);
      setFilteredCourses(data.courses || []);
      
      // Fetch payment history to check which courses are paid
      try {
        const paymentHistory = await paymentService.getPaymentHistory({ purpose: 'course', status: 'success' });
        const paidCourseIds = new Set(
          paymentHistory.payments
            .filter(p => p.purposeId)
            .map(p => typeof p.purposeId === 'object' ? p.purposeId._id : p.purposeId)
        );
        setPaidCourses(paidCourseIds);
      } catch (error) {
        console.error('Failed to fetch payment history:', error);
      }
    } catch (error) {
      toast.error("Failed to load courses");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  useEffect(() => {
    let filtered = courses;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (course) =>
          course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          course.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          course.subject.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Subject filter
    if (filters.subject) {
      filtered = filtered.filter((course) =>
        course.subject.toLowerCase().includes(filters.subject.toLowerCase())
      );
    }

    // Grade filter
    if (filters.grade) {
      filtered = filtered.filter((course) =>
        course.grade.toLowerCase().includes(filters.grade.toLowerCase())
      );
    }

    // Tag filter
    if (filters.tag) {
      filtered = filtered.filter((course) =>
        course.tags?.some((tag) =>
          tag.toLowerCase().includes(filters.tag.toLowerCase())
        )
      );
    }

    setFilteredCourses(filtered);
  }, [searchTerm, filters, courses]);

  const handleDownload = async (courseId, fileName) => {
    try {
      toast.loading("Downloading course...");
      const data = await courseService.downloadCourse(courseId);
      
      // Create download link
      const link = document.createElement("a");
      link.href = data.fileUrl;
      link.download = data.fileName || fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.dismiss();
      toast.success("Course downloaded successfully!");
      fetchCourses(); // Refresh to update download count
    } catch (error) {
      toast.dismiss();
      if (error.response?.status === 403) {
        toast.error("Payment required. Please purchase this course first.");
      } else {
        toast.error("Failed to download course");
      }
    }
  };

  const handlePaymentSuccess = (courseId) => {
    toast.success("Payment successful! You can now download the course.");
    setPaidCourses(prev => new Set([...prev, courseId]));
    fetchCourses();
  };

  const isPaid = (courseId) => {
    return paidCourses.has(courseId);
  };

  const clearFilters = () => {
    setFilters({ subject: "", grade: "", tag: "" });
    setSearchTerm("");
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + " KB";
    return (bytes / (1024 * 1024)).toFixed(2) + " MB";
  };

  const getUniqueValues = (key) => {
    const values = courses.map((course) => course[key]).filter(Boolean);
    return [...new Set(values)];
  };

  const getAllTags = () => {
    const tags = courses.flatMap((course) => course.tags || []);
    return [...new Set(tags)];
  };

  return (
    <div className="space-y-6">
      {/* Header with Gradient */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl shadow-lg p-6 text-white">
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
              <h1 className="text-3xl font-bold">Browse Courses</h1>
              <p className="text-blue-100 mt-1">
                Explore and download course materials from expert teachers
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={fetchCourses}
            disabled={loading}
            className="hover:bg-white/20 text-white"
            title="Refresh"
          >
            <RotateCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <p className="text-blue-100 text-sm">Available Courses</p>
                <p className="text-2xl font-bold">{courses.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <p className="text-blue-100 text-sm">Most Popular</p>
                <p className="text-xl font-bold truncate">
                  {courses.length > 0 
                    ? courses.reduce((max, course) => course.downloads > max.downloads ? course : max, courses[0])?.subject || "N/A"
                    : "N/A"}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <p className="text-blue-100 text-sm">Subjects</p>
                <p className="text-2xl font-bold">{getUniqueValues("subject").length}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex gap-4 items-center">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search courses by title, description, or subject..."
              className="pl-10 h-12 text-base"
            />
          </div>
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 h-12 ${showFilters ? 'bg-blue-50 border-blue-300' : ''}`}
          >
            <Filter className="w-4 h-4" />
            Filters
          </Button>
          {(searchTerm || filters.subject || filters.grade || filters.tag) && (
            <Button
              variant="outline"
              onClick={clearFilters}
              className="flex items-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 h-12"
            >
              <X className="w-4 h-4" />
              Clear
            </Button>
          )}
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="mt-6 pt-6 border-t border-gray-200 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Subject
              </label>
              <select
                value={filters.subject}
                onChange={(e) =>
                  setFilters({ ...filters, subject: e.target.value })
                }
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              >
                <option value="">All Subjects</option>
                {getUniqueValues("subject").map((subject) => (
                  <option key={subject} value={subject}>
                    {subject}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Grade
              </label>
              <select
                value={filters.grade}
                onChange={(e) =>
                  setFilters({ ...filters, grade: e.target.value })
                }
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              >
                <option value="">All Grades</option>
                {getUniqueValues("grade").map((grade) => (
                  <option key={grade} value={grade}>
                    Grade {grade}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Tag
              </label>
              <select
                value={filters.tag}
                onChange={(e) => setFilters({ ...filters, tag: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              >
                <option value="">All Tags</option>
                {getAllTags().map((tag) => (
                  <option key={tag} value={tag}>
                    {tag}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-gray-600">
          Showing <span className="text-blue-600 font-bold">{filteredCourses.length}</span> of <span className="font-bold">{courses.length}</span> courses
        </p>
        {(searchTerm || filters.subject || filters.grade || filters.tag) && (
          <span className="text-sm text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
            Filters active
          </span>
        )}
      </div>

      {/* Courses Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-500">Loading courses...</p>
            </div>
          </div>
        ) : filteredCourses.length > 0 ? (
          filteredCourses.map((course) => (
            <div
              key={course._id}
              className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-xl transition-all duration-300 group"
            >
              {/* Card Header with Gradient */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 border-b border-gray-100">
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 bg-white rounded-xl shadow-sm group-hover:shadow-md transition-shadow">
                    <BookOpen className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="flex items-center gap-1 bg-white px-3 py-1 rounded-full shadow-sm">
                    <Download className="w-3 h-3 text-blue-600" />
                    <span className="text-sm font-bold text-blue-600">{course.downloads}</span>
                  </div>
                </div>
                <h3 className="font-bold text-lg text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
                  {course.title}
                </h3>
              </div>

              {/* Card Body */}
              <div className="p-6">
                <p className="text-sm text-gray-600 mb-4 line-clamp-3 leading-relaxed">
                  {course.description}
                </p>

                <div className="space-y-3 mb-4">
                  <div className="flex items-center justify-between text-sm bg-gray-50 rounded-lg p-3">
                    <span className="text-gray-500 font-medium">Teacher</span>
                    <span className="font-semibold text-gray-900">
                      {course.uploadedBy?.fullName || "Unknown"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm bg-gray-50 rounded-lg p-3">
                    <span className="text-gray-500 font-medium">Subject</span>
                    <span className="font-semibold text-blue-600">
                      {course.subject}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="text-sm bg-gray-50 rounded-lg p-3">
                      <span className="text-gray-500 block mb-1">Grade</span>
                      <span className="font-semibold text-gray-900">{course.grade}</span>
                    </div>
                    <div className="text-sm bg-gray-50 rounded-lg p-3">
                      <span className="text-gray-500 block mb-1">Size</span>
                      <span className="font-semibold text-gray-900">
                        {formatFileSize(course.fileSize)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-3 border border-blue-100">
                    <span className="text-blue-700 font-medium">Price</span>
                    <span className="font-bold text-blue-600 text-lg">
                      {course.price > 0 ? `NPR ${course.price}` : "Free"}
                    </span>
                  </div>
                </div>

                {course.tags && course.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {course.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Payment/Download Button */}
                {course.price > 0 && !isPaid(course._id) ? (
                  <PaymentButton
                    amount={course.price}
                    purpose="course"
                    purposeId={course._id}
                    metadata={{
                      courseTitle: course.title,
                      teacherId: course.uploadedBy?._id
                    }}
                    buttonText={`Buy for NPR ${course.price}`}
                    className="w-full"
                    onSuccess={() => handlePaymentSuccess(course._id)}
                  />
                ) : (
                  <Button
                    onClick={() => handleDownload(course._id, course.fileName)}
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md hover:shadow-lg transition-all"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    {course.price > 0 && isPaid(course._id) ? "Download (Purchased)" : "Download Course"}
                  </Button>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full text-center py-16 bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="max-w-md mx-auto">
              <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                <BookOpen className="w-10 h-10 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {searchTerm || filters.subject || filters.grade || filters.tag
                  ? "No courses found"
                  : "No courses available yet"}
              </h3>
              <p className="text-gray-500 mb-6">
                {searchTerm || filters.subject || filters.grade || filters.tag
                  ? "Try adjusting your filters or search terms"
                  : "Check back later for new course materials"}
              </p>
              {(searchTerm || filters.subject || filters.grade || filters.tag) && (
                <Button
                  onClick={clearFilters}
                  variant="outline"
                  className="border-blue-300 text-blue-600 hover:bg-blue-50"
                >
                  <X className="w-4 h-4 mr-2" />
                  Clear Filters
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

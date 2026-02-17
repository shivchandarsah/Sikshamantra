import { useState, useEffect } from "react";
import { Upload, BookOpen, Trash2, Download, Plus, X, Grid3x3, List, TrendingUp, FileText, ArrowLeft, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import useCourse from "@/utils/services/courseService";
import { toast } from "sonner";

export default function TeacherCourses() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [viewMode, setViewMode] = useState("grid"); // grid or list
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    subject: "",
    grade: "",
    tags: "",
    price: "0",
  });
  const [selectedFile, setSelectedFile] = useState(null);

  const courseService = useCourse();

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const data = await courseService.getTeacherCourses();
      setCourses(data.courses || []);
    } catch (error) {
      toast.error("Failed to load courses");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error("File size must be less than 10MB");
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    
    if (!selectedFile) {
      toast.error("Please select a file");
      return;
    }

    setUploading(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64File = reader.result;
        
        const courseData = {
          ...formData,
          price: parseFloat(formData.price) || 0,
          fileUrl: base64File,
          fileName: selectedFile.name,
          fileSize: selectedFile.size,
          fileType: selectedFile.type,
          tags: formData.tags.split(",").map(tag => tag.trim()).filter(tag => tag),
        };

        await courseService.uploadCourse(courseData);
        toast.success("Course uploaded successfully!");
        setShowUploadModal(false);
        setFormData({ title: "", description: "", subject: "", grade: "", tags: "", price: "0" });
        setSelectedFile(null);
        fetchCourses();
      };
      reader.readAsDataURL(selectedFile);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to upload course");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (courseId) => {
    if (window.confirm("Are you sure you want to delete this course?")) {
      try {
        await courseService.deleteCourse(courseId);
        toast.success("Course deleted successfully");
        fetchCourses();
      } catch (error) {
        toast.error("Failed to delete course");
      }
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + " KB";
    return (bytes / (1024 * 1024)).toFixed(2) + " MB";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
      <div className="space-y-6 p-6">
      {/* Header with Stats */}
      <div className="bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 rounded-2xl shadow-2xl p-8 text-white relative overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-32 translate-x-32"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full translate-y-24 -translate-x-24"></div>
        
        <div className="relative z-10">
        <div className="flex items-center justify-between mb-6">
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
              <h1 className="text-4xl font-bold mb-2">My Courses</h1>
              <p className="text-green-100 text-lg">Upload and manage your course materials</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
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
            <Button
              onClick={() => setShowUploadModal(true)}
              className="bg-white text-green-600 hover:bg-green-50 shadow-lg hover:shadow-xl transition-all"
            >
              <Plus className="w-4 h-4 mr-2" />
              Upload Course
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white/15 backdrop-blur-md rounded-xl p-5 border border-white/30 hover:bg-white/20 transition-all duration-300 shadow-lg">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/25 rounded-xl shadow-md">
                <BookOpen className="w-7 h-7" />
              </div>
              <div>
                <p className="text-green-100 text-sm font-medium">Total Courses</p>
                <p className="text-3xl font-bold">{courses.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white/15 backdrop-blur-md rounded-xl p-5 border border-white/30 hover:bg-white/20 transition-all duration-300 shadow-lg">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/25 rounded-xl shadow-md">
                <TrendingUp className="w-7 h-7" />
              </div>
              <div>
                <p className="text-green-100 text-sm font-medium">Total Downloads</p>
                <p className="text-3xl font-bold">
                  {courses.reduce((sum, course) => sum + course.downloads, 0)}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white/15 backdrop-blur-md rounded-xl p-5 border border-white/30 hover:bg-white/20 transition-all duration-300 shadow-lg">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/25 rounded-xl shadow-md">
                <FileText className="w-7 h-7" />
              </div>
              <div>
                <p className="text-green-100 text-sm font-medium">Avg Downloads</p>
                <p className="text-3xl font-bold">
                  {courses.length > 0 
                    ? Math.round(courses.reduce((sum, course) => sum + course.downloads, 0) / courses.length)
                    : 0}
                </p>
              </div>
            </div>
          </div>
        </div>
        </div>
      </div>

      {/* View Toggle */}
      <div className="flex items-center justify-between bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <p className="text-gray-700 font-medium">
          {courses.length} {courses.length === 1 ? 'course' : 'courses'} available
        </p>
        <div className="flex gap-2 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setViewMode("grid")}
            className={`p-2 rounded-lg transition-all ${
              viewMode === "grid"
                ? "bg-green-600 text-white shadow-md"
                : "text-gray-600 hover:bg-white"
            }`}
          >
            <Grid3x3 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`p-2 rounded-lg transition-all ${
              viewMode === "list"
                ? "bg-green-600 text-white shadow-md"
                : "text-gray-600 hover:bg-white"
            }`}
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Courses Grid/List */}
      <div className={viewMode === "grid" 
        ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" 
        : "space-y-4"
      }>
        {loading ? (
          <div className="col-span-full flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
              <p className="text-gray-500">Loading courses...</p>
            </div>
          </div>
        ) : courses.length > 0 ? (
          courses.map((course) => (
            viewMode === "grid" ? (
              <div key={course._id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300 group">
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 border-b border-gray-100">
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-3 bg-white rounded-xl shadow-sm group-hover:shadow-md transition-shadow">
                      <BookOpen className="w-6 h-6 text-green-600" />
                    </div>
                    <button
                      onClick={() => handleDelete(course._id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <h3 className="font-bold text-lg text-gray-900 mb-2 line-clamp-2 group-hover:text-green-600 transition-colors">
                    {course.title}
                  </h3>
                </div>

                <div className="p-6">
                  <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                    {course.description}
                  </p>

                  <div className="space-y-3 mb-4">
                    <div className="flex items-center justify-between text-sm bg-gray-50 rounded-lg p-2">
                      <span className="text-gray-500 flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        Subject
                      </span>
                      <span className="font-semibold text-gray-900">{course.subject}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm bg-gray-50 rounded-lg p-2">
                      <span className="text-gray-500">Grade</span>
                      <span className="font-semibold text-gray-900">{course.grade}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm bg-gray-50 rounded-lg p-2">
                      <span className="text-gray-500">Price</span>
                      <span className="font-semibold text-green-600">
                        {course.price > 0 ? `NPR ${course.price}` : "Free"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm bg-gray-50 rounded-lg p-2">
                      <span className="text-gray-500">Size</span>
                      <span className="font-semibold text-gray-900">{formatFileSize(course.fileSize)}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm bg-green-50 rounded-lg p-2">
                      <span className="text-green-700 flex items-center gap-2">
                        <Download className="w-4 h-4" />
                        Downloads
                      </span>
                      <span className="font-bold text-green-600">{course.downloads}</span>
                    </div>
                  </div>

                  {course.tags && course.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {course.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div key={course._id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start gap-6">
                  <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl">
                    <BookOpen className="w-8 h-8 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-bold text-xl text-gray-900 mb-2">
                          {course.title}
                        </h3>
                        <p className="text-sm text-gray-600 mb-3">
                          {course.description}
                        </p>
                      </div>
                      <button
                        onClick={() => handleDelete(course._id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-4 mb-3">
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-gray-500">Subject:</span>
                        <span className="font-semibold text-gray-900 bg-gray-100 px-3 py-1 rounded-full">{course.subject}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-gray-500">Grade:</span>
                        <span className="font-semibold text-gray-900 bg-gray-100 px-3 py-1 rounded-full">{course.grade}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-gray-500">Size:</span>
                        <span className="font-semibold text-gray-900 bg-gray-100 px-3 py-1 rounded-full">{formatFileSize(course.fileSize)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Download className="w-4 h-4 text-green-600" />
                        <span className="font-bold text-green-600">{course.downloads} downloads</span>
                      </div>
                    </div>

                    {course.tags && course.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {course.tags.map((tag, index) => (
                          <span
                            key={index}
                            className="px-3 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          ))
        ) : (
          <div className="col-span-full text-center py-16 bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="max-w-md mx-auto">
              <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                <BookOpen className="w-10 h-10 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No courses yet</h3>
              <p className="text-gray-500 mb-6">Start sharing your knowledge by uploading your first course</p>
              <Button
                onClick={() => setShowUploadModal(true)}
                className="bg-green-600 hover:bg-green-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Upload Your First Course
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-gradient-to-br from-green-900/40 via-emerald-900/40 to-teal-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-green-100">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-green-100 to-emerald-100 rounded-xl">
                  <Upload className="w-6 h-6 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">Upload Course</h2>
              </div>
              <button
                onClick={() => setShowUploadModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleUpload} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Course Title *
                </label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Introduction to Algebra"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description *
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe what students will learn..."
                  rows={4}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Subject *
                  </label>
                  <Input
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    placeholder="e.g., Mathematics"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Grade *
                  </label>
                  <Input
                    value={formData.grade}
                    onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                    placeholder="e.g., 10"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Price (NPR) *
                  </label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder="0 for free"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">Set to 0 for free courses</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tags (comma separated)
                  </label>
                  <Input
                    value={formData.tags}
                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                    placeholder="e.g., algebra, equations"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Course File * (Max 10MB)
                </label>
                <input
                  type="file"
                  onChange={handleFileChange}
                  accept=".pdf,.doc,.docx,.ppt,.pptx,.txt"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required
                />
                {selectedFile && (
                  <p className="text-sm text-gray-600 mt-2">
                    Selected: {selectedFile.name} ({formatFileSize(selectedFile.size)})
                  </p>
                )}
              </div>

              <div className="flex gap-3 pt-6 border-t border-gray-200">
                <Button
                  type="submit"
                  disabled={uploading}
                  className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transition-all"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  {uploading ? "Uploading..." : "Upload Course"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowUploadModal(false)}
                  className="flex-1 border-gray-300 hover:bg-gray-50"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}

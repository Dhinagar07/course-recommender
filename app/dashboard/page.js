"use client";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import Link from "next/link";

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (status === "authenticated" && session?.user?.id) {
      fetchEnrolledCourses();
    }
  }, [status, session]);

  const fetchEnrolledCourses = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/courses/enrolled");
      const data = await response.json();
      console.log(data);
      if (!response.ok)
        throw new Error(data.error || "Failed to fetch enrolled courses");
      setEnrolledCourses(data.courses || []);
    } catch (err) {
      console.error("Error fetching enrolled courses:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 py-20 text-center">
          <div className="inline-block w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-6 py-12 space-y-10">
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-10 border border-gray-100 text-center sm:text-left">
          <h2 className="text-3xl font-extrabold text-gray-800 mb-3">
            Welcome,{" "}
            <span className="text-blue-600">
              {session?.user?.name || "Learner"}
            </span>
            !
          </h2>
          <p className="text-gray-600 text-lg">
            You’re logged in as{" "}
            <span className="font-medium text-gray-900">
              {session?.user?.email}
            </span>
          </p>
        </div>

        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-10 border border-gray-100">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
            <h3 className="text-2xl font-bold text-gray-800">
              📚 My Enrolled Courses
            </h3>
            <Link
              href="/"
              className="px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 shadow-sm transition-all"
            >
              Browse More Courses
            </Link>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="mt-4 text-gray-600 text-lg">
                Loading your courses...
              </p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-600 font-medium text-lg">Error: {error}</p>
              <button
                onClick={fetchEnrolledCourses}
                className="mt-4 px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all"
              >
                Try Again
              </button>
            </div>
          ) : enrolledCourses.length === 0 ? (
            <div className="text-center py-16">
              <svg
                className="mx-auto h-14 w-14 text-gray-400 mb-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                />
              </svg>
              <h3 className="text-xl font-semibold text-gray-800">
                No Enrollments Yet
              </h3>
              <p className="mt-2 text-gray-500">
                Start your learning journey by exploring available courses!
              </p>
              <Link
                href="/"
                className="mt-6 inline-block px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-sm transition-all"
              >
                Explore Courses
              </Link>
            </div>
          ) : (
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {enrolledCourses.map((course) => (
                <div
                  key={course.id}
                  className="group bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden"
                >
                  <div className="p-6 flex flex-col h-full">
                    <h4 className="text-xl font-bold text-gray-800 mb-2 group-hover:text-blue-600 transition-colors">
                      {course.title}
                    </h4>
                    {course.headline && (
                      <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                        {course.headline}
                      </p>
                    )}

                    <div className="flex-1 space-y-1 text-sm text-gray-600">
                      {course.instructor_name && (
                        <p>
                          <span className="font-semibold text-gray-700">
                            Instructor:
                          </span>{" "}
                          {course.instructor_name}
                        </p>
                      )}

                      {course.avg_rating && (
                        <p>
                          <span className="font-semibold text-gray-700">
                            Rating:
                          </span>{" "}
                          <span className="text-yellow-500">★</span>{" "}
                          {course.avg_rating}{" "}
                          {course.num_reviews && (
                            <span className="text-gray-500 text-xs">
                              ({course.num_reviews} reviews)
                            </span>
                          )}
                        </p>
                      )}

                      {course.num_subscribers && (
                        <p>
                          <span className="font-semibold text-gray-700">
                            Students:
                          </span>{" "}
                          {course.num_subscribers.toLocaleString()}
                        </p>
                      )}

                      {course.num_lectures && (
                        <p>
                          <span className="font-semibold text-gray-700">
                            Lectures:
                          </span>{" "}
                          {course.num_lectures}
                        </p>
                      )}

                      {course.content_length_min && (
                        <p>
                          <span className="font-semibold text-gray-700">
                            Duration:
                          </span>{" "}
                          {Math.floor(course.content_length_min / 60)}h{" "}
                          {course.content_length_min % 60}m
                        </p>
                      )}

                      <div className="flex justify-between items-center pt-3 border-t mt-3">
                        <span
                          className={`font-semibold ${
                            course.is_paid ? "text-green-600" : "text-blue-600"
                          }`}
                        >
                          {course.is_paid ? `$${course.price}` : "Free"}
                        </span>
                        {course.language && (
                          <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                            {course.language}
                          </span>
                        )}
                      </div>

                      {(course.category || course.subcategory) && (
                        <p className="text-xs text-gray-400 pt-2">
                          {course.category}
                          {course.subcategory && ` › ${course.subcategory}`}
                        </p>
                      )}

                      <p className="text-xs text-gray-400 pt-2 border-t mt-3">
                        Enrolled on{" "}
                        {new Date(course.subscribed_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

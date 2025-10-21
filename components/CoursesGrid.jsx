"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Star,
  Users,
  CheckCircle,
  PlayCircle,
  GraduationCap,
  Info,
  UserPlus,
  X,
  Award,
  Play,
} from "lucide-react";

export default function CoursesGrid({ courses, loading }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [enrollStates, setEnrollStates] = useState({});
  const [selectedCourse, setSelectedCourse] = useState(null);

  useEffect(() => {
    if (!courses?.length) return;
    const states = {};
    courses.forEach((course) => {
      const keys = [
        "is_enrolled",
        "enrolled",
        "user_enrolled",
        "isEnrolled",
        "userIsEnrolled",
        "subscribed",
        "subscribed_by_user",
        "is_user_subscribed",
        "user_subscribed",
      ];
      const isEnrolled = keys.some((k) => !!course?.[k]);
      states[course.id] = { enrolling: false, isEnrolled, error: "" };
    });
    setEnrollStates(states);
  }, [courses]);

  const handleEnroll = async (courseId) => {
    const state = enrollStates[courseId];
    if (!state || state.enrolling || state.isEnrolled) return;
    if (status === "loading") return;
    if (!session) {
      router.push("/login");
      return;
    }

    setEnrollStates((prev) => ({
      ...prev,
      [courseId]: { ...prev[courseId], enrolling: true, error: "" },
    }));

    try {
      const response = await fetch("/api/user/courses/enroll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId }),
      });

      const data = await response.json().catch(() => ({}));

      if (response.ok || data?.enrolled) {
        setEnrollStates((prev) => ({
          ...prev,
          [courseId]: { ...prev[courseId], enrolling: false, isEnrolled: true },
        }));
        router.refresh();
      } else {
        setEnrollStates((prev) => ({
          ...prev,
          [courseId]: {
            ...prev[courseId],
            enrolling: false,
            error: data?.message || "Failed to enroll.",
          },
        }));
      }
    } catch (err) {
      setEnrollStates((prev) => ({
        ...prev,
        [courseId]: {
          ...prev[courseId],
          enrolling: false,
          error: err.message || "Network error",
        },
      }));
    }
  };

  const truncate = (str, maxLen) =>
    str?.length > maxLen ? str.substring(0, maxLen) + "..." : str;

  if (loading)
    return (
      <div className="text-center py-20">
        <div className="inline-block w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-gray-600">Loading courses...</p>
      </div>
    );

  if (!courses?.length)
    return (
      <div className="text-center py-16 bg-white rounded-lg shadow">
        <p className="text-gray-600 text-lg">
          No courses found. Try adjusting filters.
        </p>
      </div>
    );

  return (
    <>
      <div className="p-6 md:p-10">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-10">
          {courses.map((course) => {
            const state = enrollStates[course.id] || {};
            const rating = course?.avg_rating ?? "N/A";
            const subscribers = Number(course?.num_subscribers ?? 0);

            return (
              <div
                key={course.id}
                className="relative bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-transform duration-300 hover:-translate-y-1 border border-gray-100 p-6 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-md">
                      <GraduationCap className="w-7 h-7 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-xl text-gray-900 mb-1 leading-snug">
                        {truncate(course?.title, 60)}
                      </h3>
                      {course?.category && (
                        <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">
                          {course.category}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4 text-sm text-gray-700">
                      <span className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />{" "}
                        {rating}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="w-4 h-4 text-gray-500" />{" "}
                        {subscribers.toLocaleString()}
                      </span>
                    </div>
                    <span className="text-lg font-bold text-green-600">
                      {course?.is_paid
                        ? `$${Number(course?.price ?? 0).toFixed(2)}`
                        : "Free"}
                    </span>
                  </div>
                </div>

                <div className="flex justify-end items-center gap-3 mt-6">
                  <button
                    onClick={() => setSelectedCourse(course)}
                    className="p-3 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700"
                    title="View Details"
                  >
                    <Info className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleEnroll(course.id)}
                    disabled={state.isEnrolled || state.enrolling}
                    className={`p-3 rounded-full text-white shadow-md transition
                      ${
                        state.isEnrolled
                          ? "bg-green-600 hover:bg-green-700"
                          : state.enrolling
                          ? "bg-gray-400 cursor-wait"
                          : "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                      }`}
                    title={state.isEnrolled ? "Enrolled" : "Enroll"}
                  >
                    {state.enrolling ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : state.isEnrolled ? (
                      <CheckCircle className="w-5 h-5" />
                    ) : (
                      <UserPlus className="w-5 h-5" />
                    )}
                  </button>
                </div>

                {state.error && (
                  <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded mt-3 p-2 text-center">
                    {state.error}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {selectedCourse && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-white rounded-2xl max-w-3xl w-full overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white flex justify-between items-start">
              <div className="flex items-start gap-4 flex-1">
                <div className="w-16 h-16 rounded-xl bg-white/20 flex items-center justify-center">
                  <PlayCircle className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold mb-2">
                    {selectedCourse.title}
                  </h2>
                  {selectedCourse.instructor_name && (
                    <p className="text-blue-100">
                      by {selectedCourse.instructor_name}
                    </p>
                  )}
                </div>
              </div>
              <button
                onClick={() => setSelectedCourse(null)}
                className="p-2 hover:bg-white/20 rounded-lg"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-8 space-y-6">
              {selectedCourse.headline && (
                <p className="text-gray-700 text-lg leading-relaxed">
                  {selectedCourse.headline}
                </p>
              )}

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-blue-600" />
                  <span className="font-semibold text-gray-900">
                    {selectedCourse.category}
                  </span>
                </div>
                <div className="text-2xl font-bold text-green-600">
                  {selectedCourse?.is_paid
                    ? `$${Number(selectedCourse?.price ?? 0).toFixed(2)}`
                    : "Free"}
                </div>
              </div>

              {selectedCourse.course_url && (
                <a
                  href={selectedCourse.course_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-base font-semibold bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700 transition shadow-lg"
                >
                  <Play className="w-5 h-5" />
                  View Course
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

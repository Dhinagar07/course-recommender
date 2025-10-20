'use client';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
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
  Play
} from 'lucide-react';

export default function CoursesGrid({ courses, loading }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [enrollStates, setEnrollStates] = useState({});
  const [selectedCourse, setSelectedCourse] = useState(null);

  useEffect(() => {
    if (!courses?.length) return;
    const initialStates = {};
    courses.forEach(course => {
      const keys = [
        'is_enrolled', 'enrolled', 'user_enrolled', 'isEnrolled',
        'userIsEnrolled', 'subscribed', 'subscribed_by_user',
        'is_user_subscribed', 'user_subscribed',
      ];
      const isEnrolled = keys.some(k => !!course?.[k]);
      initialStates[course.id] = { enrolling: false, isEnrolled, error: '' };
    });
    setEnrollStates(initialStates);
  }, [courses]);

  const handleEnroll = async (courseId) => {
    const state = enrollStates[courseId];
    if (!state || state.enrolling || state.isEnrolled) return;
    if (status === 'loading') return;
    if (!session) {
      router.push('/login');
      return;
    }

    setEnrollStates(prev => ({
      ...prev,
      [courseId]: { ...prev[courseId], enrolling: true, error: '' },
    }));

    try {
      const response = await fetch('/api/user/courses/enroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId }),
      });

      const data = await response.json().catch(() => ({}));

      if (response.ok || data?.enrolled) {
        setEnrollStates(prev => ({
          ...prev,
          [courseId]: { ...prev[courseId], enrolling: false, isEnrolled: true, error: '' },
        }));
        router.refresh();
      } else {
        setEnrollStates(prev => ({
          ...prev,
          [courseId]: { ...prev[courseId], enrolling: false, error: data?.message || 'Failed to enroll.' },
        }));
      }
    } catch (err) {
      setEnrollStates(prev => ({
        ...prev,
        [courseId]: { ...prev[courseId], enrolling: false, error: err.message || 'Network error' },
      }));
    }
  };

  const truncate = (str, maxLen) => {
    if (!str) return '';
    return str.length > maxLen ? str.substring(0, maxLen) + '...' : str;
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-gray-600">Loading courses...</p>
      </div>
    );
  }

  if (!courses?.length) {
    return (
      <div className="text-center py-12 bg-white rounded-lg">
        <p className="text-gray-600 text-lg">No courses found. Adjust your filters.</p>
      </div>
    );
  }

  return (
    <>
      <div className="p-6 md:p-8 m-8">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
          {courses.map(course => {
            const state = enrollStates[course.id] || { enrolling: false, isEnrolled: false, error: '' };
            const avgRating = course?.avg_rating ?? null;
            const ratingDisplay = avgRating !== null && avgRating !== undefined ? Number(avgRating).toFixed(1) : 'N/A';
            const subscribers = Number(course?.num_subscribers ?? 0);

            return (
              <div
                key={course.id}
                className="relative bg-blue-100 rounded-xl shadow-md  overflow-hidden hover:shadow-lg transition-all duration-300"
              >
                {/* Increased padding and spacing */}
                <div className="p-20 space-y-16">
                  
                  {/* Icon + Title */}
                  <div className="flex items-center gap-6 mt-4">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-md">
                      <GraduationCap className="w-7 h-7 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-lg text-gray-900 line-clamp-2 leading-tight mb-1">
                        {truncate(course?.title, 55)}
                      </h3>
                      {course?.category && (
                        <span className="inline-block px-2 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded">
                          {course.category}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Rating + Price + Buttons */}
                  <div className="flex items-center justify-between mt-4 m-4">
                    <div className="flex items-center gap-3 text-sm text-gray-700">
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                        <span className="font-semibold">{ratingDisplay}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4 text-gray-600" />
                        <span>{subscribers.toLocaleString()}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-lg font-bold text-green-600">
                        {course?.is_paid ? `$${Number(course?.price ?? 0).toFixed(2)}` : 'Free'}
                      </span>

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
                          ${state.isEnrolled
                            ? 'bg-green-600 hover:bg-green-700'
                            : state.enrolling
                            ? 'bg-gray-400 cursor-wait'
                            : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700'}`}
                        title={state.isEnrolled ? 'Enrolled' : 'Enroll'}
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
                  </div>

                  {state.error && (
                    <div className="p-2 bg-red-50 border border-red-200 rounded text-center">
                      <p className="text-red-700 text-xs">{state.error}</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal */}
      {selectedCourse && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white flex justify-between items-start">
              <div className="flex items-start gap-4 flex-1">
                <div className="w-16 h-16 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                  <PlayCircle className="w-8 h-8 text-white" />
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold mb-2">{selectedCourse.title}</h2>
                  {selectedCourse.instructor_name && (
                    <p className="text-blue-100">by {selectedCourse.instructor_name}</p>
                  )}
                </div>
              </div>
              <button onClick={() => setSelectedCourse(null)} className="p-2 hover:bg-white/20 rounded-lg transition ml-4">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {selectedCourse.headline && (
                <p className="text-gray-700 text-lg leading-relaxed">{selectedCourse.headline}</p>
              )}

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                {selectedCourse.category && (
                  <div className="flex items-center gap-2">
                    <Award className="w-5 h-5 text-blue-600" />
                    <span className="font-semibold text-gray-900">{selectedCourse.category}</span>
                  </div>
                )}
                <div className="text-2xl font-bold text-green-600">
                  {selectedCourse?.is_paid ? `$${Number(selectedCourse?.price ?? 0).toFixed(2)}` : 'Free'}
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

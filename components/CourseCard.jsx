'use client';
import { Star, Users, Clock, BookOpen, User, CheckCircle } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function CourseCard({ course }) {
  const { data: session, status } = useSession(); // status: 'loading' | 'unauthenticated' | 'authenticated'
  const router = useRouter();

  const [enrolling, setEnrolling] = useState(false);
  const [enrollmentError, setEnrollmentError] = useState('');
  const [isEnrolled, setIsEnrolled] = useState(false);

  // Initialize enrollment state from course props (supports several possible keys)
  useEffect(() => {
    const keys = [
      'is_enrolled',
      'enrolled',
      'user_enrolled',
      'isEnrolled',
      'userIsEnrolled',
      'subscribed',
      'subscribed_by_user',
      'is_user_subscribed',
      'user_subscribed',
    ];
    const initial = keys.some((k) => !!course?.[k]);
    setIsEnrolled(Boolean(initial));
  }, [course]);

  const handleEnroll = async () => {
    console.log('Enroll reached');
    // Prevent double requests or working when already enrolled
    if (enrolling || isEnrolled) return;

    // If session is still loading, do nothing (avoid accidental redirect)
    if (status === 'loading') return;

    // If not logged in, redirect to login
    if (!session) {
      router.push('/login');
      return;
    }

    setEnrolling(true);
    setEnrollmentError('');

    try {
      // Use AbortController in case you want to cancel later (optional)
      const controller = new AbortController();
      const response = await fetch('/api/user/courses/enroll', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ courseId: course.id }),
        signal: controller.signal,
      });

      // Read content-type then parse safely
      const contentType = response.headers.get('content-type') || '';
      let data = {};
      if (contentType.includes('application/json')) {
        try {
          data = await response.json();
        } catch (err) {
          data = {};
        }
      } else {
        // fallback: read text
        const text = await response.text().catch(() => '');
        data = text ? { message: text } : {};
      }

      if (response.ok) {
        // Success path
        setIsEnrolled(true);
        setEnrollmentError('');
        // keep refresh to reload server-side/revalidated data
        try {
          router.refresh();
        } catch (err) {
          // ignore refresh errors (client may not support it)
        }
      } else {
        // Non-2xx
        if (data?.enrolled) {
          // backend reports already enrolled
          setIsEnrolled(true);
          setEnrollmentError('');
        } else {
          const serverMessage =
            data?.error || data?.message || 'Failed to enroll in course.';
          setEnrollmentError(String(serverMessage));
          console.error('Enrollment failed:', response.status, serverMessage);
        }
      }
    } catch (error) {
      // network or abort
      console.error('Error enrolling in course:', error);
      setEnrollmentError(error?.message ? String(error.message) : 'Network error. Please try again.');
    } finally {
      setEnrolling(false);
    }
  };

  // small safe conversions
  const avgRating = course?.avg_rating ?? null;
  const ratingDisplay = avgRating !== null && avgRating !== undefined ? Number(avgRating).toFixed(1) : 'N/A';
  const subscribers = Number(course?.num_subscribers ?? 0);
  const lectures = Number(course?.num_lectures ?? 0);
  const minutes = Number(course?.content_length_min ?? 0);
  const hours = Math.floor(minutes / 60);
  const minsRemaining = minutes % 60;

  return (
    <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-lg border border-white/20 overflow-hidden hover:shadow-xl hover:scale-105 transition-all duration-300">
      <div className="p-6">
        {/* Course Title */}
        <h3 className="font-bold text-xl text-gray-900 mb-3 line-clamp-2 leading-tight">
          {course?.title}
        </h3>

        {/* Course Headline */}
        {course?.headline && (
          <p className="text-gray-600 text-sm mb-4 line-clamp-2 leading-relaxed">
            {course.headline}
          </p>
        )}

        {/* Stats Row */}
        <div className="flex items-center gap-4 mb-4 text-sm text-gray-700">
          {/* Rating */}
          <div className="flex items-center gap-1 bg-yellow-50 rounded-lg px-3 py-1">
            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
            <span className="font-semibold">{ratingDisplay}</span>
          </div>

          {/* Students */}
          <div className="flex items-center gap-1 bg-blue-50 rounded-lg px-3 py-1">
            <Users className="w-4 h-4 text-blue-600" />
            <span className="font-semibold">{subscribers.toLocaleString()}</span>
          </div>

          {/* Lectures */}
          <div className="flex items-center gap-1 bg-green-50 rounded-lg px-3 py-1">
            <BookOpen className="w-4 h-4 text-green-600" />
            <span className="font-semibold">{lectures}</span>
          </div>
        </div>

        {/* Duration */}
        {minutes > 0 && (
          <div className="flex items-center gap-2 text-sm text-gray-700 mb-4 bg-purple-50 rounded-lg px-3 py-1 w-fit">
            <Clock className="w-4 h-4 text-purple-600" />
            <span className="font-semibold">{hours}h {minsRemaining}m</span>
          </div>
        )}

        {/* Category and Price */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex gap-2">
            {course?.category && (
              <span className="px-3 py-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-xs font-semibold rounded-lg shadow">
                {course.category}
              </span>
            )}
          </div>

          <div className="text-lg font-bold bg-gradient-to-r from-green-500 to-green-600 text-transparent bg-clip-text">
            {course?.is_paid ? `$${Number(course?.price ?? 0).toFixed(2)}` : 'Free'}
          </div>
        </div>

        {/* Instructor */}
        {course?.instructor_name && (
          <p className="text-sm text-gray-600 mb-4">
            By <span className="text-blue-600 font-semibold">{course.instructor_name}</span>
          </p>
        )}

        {/* Enrollment Error */}
        {enrollmentError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg" role="alert" aria-live="polite">
            <p className="text-red-700 text-sm text-center">{enrollmentError}</p>
          </div>
        )}

        {/* Enroll Button */}
        {/* <button
          onClick={handleEnroll}
          disabled={enrolling || isEnrolled || status === 'loading'}
          aria-disabled={enrolling || isEnrolled || status === 'loading'}
          className={`flex items-center justify-center gap-2 w-full px-4 py-3 rounded-xl text-sm font-semibold shadow hover:shadow-md transition-all duration-200 group
            ${isEnrolled ? 'bg-green-600 text-white cursor-default opacity-90' : enrolling ? 'bg-gray-400 text-white cursor-not-allowed opacity-80' : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700'}
          `}
        > */}
          {enrolling ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" aria-hidden />
              Enrolling...
            </>
          ) : isEnrolled ? (
            <>
              <CheckCircle className="w-4 h-4" />
              Enrolled
            </>
          ) : (
            <>
              <User className="w-4 h-4 group-hover:scale-110 transition-transform" />
              {session ? 'Enroll Now' : 'Login to Enroll'}
            </>
          )}
        </button>
      </div>
    </div>
  );
}

'use client';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import Link from 'next/link';

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.id) {
      fetchEnrolledCourses();
    }
  }, [status, session]);

  const fetchEnrolledCourses = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/courses/enrolled');
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch enrolled courses');
      }
      
      setEnrolledCourses(data.courses || []);
    } catch (err) {
      console.error('Error fetching enrolled courses:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 py-12 text-center">
          <div className="inline-block w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="bg-white rounded-lg shadow-md p-8 mb-8">
          <h2 className="text-3xl font-bold mb-4">Welcome, {session?.user?.name || 'User'}!</h2>
          <p className="text-gray-600 mb-4">
            You're logged in as: <span className="font-medium">{session?.user?.email}</span>
          </p>
        </div>

        {/* Enrolled Courses Section */}
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-2xl font-bold">My Enrolled Courses</h3>
            <Link 
              href="/courses"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Browse Courses
            </Link>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="mt-4 text-gray-600">Loading your courses...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-red-600">Error: {error}</p>
              <button 
                onClick={fetchEnrolledCourses}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Try Again
              </button>
            </div>
          ) : enrolledCourses.length === 0 ? (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              <h3 className="mt-4 text-lg font-medium text-gray-900">No courses yet</h3>
              <p className="mt-2 text-gray-500">Start learning by enrolling in a course!</p>
              <Link 
                href="/courses"
                className="mt-6 inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                Explore Courses
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {enrolledCourses.map((course) => (
                <div key={course.id} className="border rounded-lg overflow-hidden hover:shadow-lg transition bg-white">
                  <div className="p-6">
                    <h4 className="text-xl font-bold mb-3">{course.title}</h4>
                    
                    {course.headline && (
                      <p className="text-gray-700 mb-3 text-sm">{course.headline}</p>
                    )}
                    
                    <div className="space-y-2 text-sm text-gray-600 mb-4">
                      {course.instructor_name && (
                        <p className="flex items-center">
                          <span className="font-semibold mr-2">Instructor:</span>
                          {course.instructor_name}
                        </p>
                      )}
                      
                      <div className="flex items-center justify-between">
                        {course.avg_rating && (
                          <p className="flex items-center">
                            <span className="font-semibold mr-2">Rating:</span>
                            <span className="text-yellow-500">★</span> {course.avg_rating}
                            {course.num_reviews && (
                              <span className="ml-1">({course.num_reviews} reviews)</span>
                            )}
                          </p>
                        )}
                      </div>
                      
                      {course.num_subscribers && (
                        <p>
                          <span className="font-semibold">Students:</span> {course.num_subscribers.toLocaleString()}
                        </p>
                      )}
                      
                      {course.num_lectures && (
                        <p>
                          <span className="font-semibold">Lectures:</span> {course.num_lectures}
                        </p>
                      )}
                      
                      {course.content_length_min && (
                        <p>
                          <span className="font-semibold">Duration:</span> {Math.floor(course.content_length_min / 60)}h {course.content_length_min % 60}m
                        </p>
                      )}
                      
                      <div className="flex items-center justify-between pt-2">
                        {course.is_paid ? (
                          <span className="font-semibold text-green-600">
                            ${course.price}
                          </span>
                        ) : (
                          <span className="font-semibold text-blue-600">Free</span>
                        )}
                        
                        {course.language && (
                          <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                            {course.language}
                          </span>
                        )}
                      </div>
                      
                      {(course.category || course.subcategory) && (
                        <p className="text-xs text-gray-500 pt-2">
                          {course.category}{course.subcategory && ` > ${course.subcategory}`}
                        </p>
                      )}
                      
                      <p className="text-xs text-gray-400 pt-2 border-t">
                        Enrolled: {new Date(course.subscribed_at).toLocaleDateString()}
                      </p>
                    </div>
{/*                     
                    {course.course_url && (
                      <a 
                        href={course.course_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block w-full text-center px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition"
                      >
                        View on Udemy
                      </a>
                    )} */}
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
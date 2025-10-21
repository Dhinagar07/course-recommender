// app/api/courses/enrolled/route.js
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { user_courses, courses } from '@/lib/schema';
import { eq, inArray } from 'drizzle-orm';
import { auth } from '@/lib/auth';

export async function GET() {
  try {
    const session = await auth();
    
    console.log('Session in enrolled API:', session);
    console.log('User ID:', session?.user?.id);
    
    if (!session?.user?.id) {
      return NextResponse.json({ 
        error: 'Unauthorized - Please log in',
        courses: []
      }, { status: 401 });
    }

    // Convert ID to string to match schema
    const userId = String(session.user.id);
    console.log('Querying enrolled courses for user:', userId);

    // Step 1: Get all course IDs for this user
    const enrolledRecords = await db
      .select({
        course_id: user_courses.course_id,
        subscribed_at: user_courses.subscribed_at,
      })
      .from(user_courses)
      .where(eq(user_courses.user_id, userId));

    console.log('Found enrollments:', enrolledRecords.length);

    if (enrolledRecords.length === 0) {
      return NextResponse.json({ 
        success: true,
        courses: []
      });
    }

    // Step 2: Get course IDs
    const courseIds = enrolledRecords.map(record => record.course_id);
    
    // Step 3: Fetch course details
    const courseDetails = await db
      .select()
      .from(courses)
      .where(inArray(courses.id, courseIds));

    // Step 4: Combine enrollment date with course details
    const enrolledCourses = courseDetails.map(course => {
      const enrollment = enrolledRecords.find(r => r.course_id === course.id);
      return {
        ...course,
        subscribed_at: enrollment?.subscribed_at
      };
    });

    console.log('Returning courses:', enrolledCourses.length);

    return NextResponse.json({ 
      success: true,
      courses: enrolledCourses 
    });

  } catch (error) {
    console.error('Error fetching enrolled courses:', error);
    console.error('Error stack:', error.stack);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message,
      courses: []
    }, { status: 500 });
  }
}
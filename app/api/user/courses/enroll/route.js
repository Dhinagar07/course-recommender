import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { user_courses } from '@/lib/schema';
import { eq, and } from 'drizzle-orm';
import { auth } from '@/lib/auth'; // Import from your lib/auth.js

export async function POST(request) {
  try {
    // Use the auth function from your lib/auth.js
    const session = await auth();
    
    console.log('Session in enroll API:', session); // Debug log
    
    if (!session?.user?.id) {
      return NextResponse.json({ 
        error: 'Unauthorized - Please log in again',
        session: session // Include session for debugging
      }, { status: 401 });
    }

    const { courseId } = await request.json();

    if (!courseId) {
      return NextResponse.json({ error: 'Course ID is required' }, { status: 400 });
    }

    console.log('Enrolling user:', session.user.id, 'in course:', courseId);

    // Check if user is already enrolled
    const existingEnrollment = await db
      .select()
      .from(user_courses)
      .where(
        and(
          eq(user_courses.user_id, session.user.id),
          eq(user_courses.course_id, courseId)
        )
      )
      .limit(1);

    if (existingEnrollment.length > 0) {
      return NextResponse.json({ 
        error: 'Already enrolled in this course',
        enrolled: true 
      }, { status: 400 });
    }

    // Enroll user in course
    await db.insert(user_courses).values({
      user_id: session.user.id,
      course_id: courseId,
      subscribed_at: new Date(),
    });

    console.log('Successfully enrolled user:', session.user.id, 'in course:', courseId);

    return NextResponse.json({ 
      success: true,
      message: 'Successfully enrolled in course'
    });

  } catch (error) {
    console.error('Enrollment error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message 
    }, { status: 500 });
  }
}
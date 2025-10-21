// app/api/courses/recommendations/cb/route.js
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { courses, user_courses } from '@/lib/schema';
import { eq, inArray, notInArray } from 'drizzle-orm';
import { auth } from '@/lib/auth';

/**
 * Content-Based Recommendation System
 * Uses enrolled courses + PKL file for similarity-based recommendations
 */
export async function POST(request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({
        error: 'Unauthorized - Please log in',
        courses: []
      }, { status: 401 });
    }

    const userId = String(session.user.id);
    console.log('Getting CB recommendations for user:', userId);

    // Step 1: Get user's enrolled course IDs
    const enrolledRecords = await db
      .select({
        course_id: user_courses.course_id,
      })
      .from(user_courses)
      .where(eq(user_courses.user_id, userId));

    const enrolledCourseIds = enrolledRecords.map(r => r.course_id);

    console.log('User enrolled in courses:', enrolledCourseIds);

    if (enrolledCourseIds.length === 0) {
      try {
          // Fetch random courses using PostgreSQL RANDOM()
          const randomCourses = await db
            .select()
            .from(courses)
            .orderBy(sql`RANDOM()`)
            .limit(30);
      
          console.log('Fetched random courses:', randomCourses.length);
      
          return NextResponse.json({
            success: true,
            courses: randomCourses,
            type: 'random'
          });
        } catch (error) {
          console.error('Error fetching random courses:', error);
          return NextResponse.json({
            error: 'Failed to fetch random courses',
            details: error.message,
            courses: []
          }, { status: 500 });
        }
    }

    // Step 2: Get recommended course IDs from PKL model
    const recommendedCourseIds = await getRecommendationsFromPKL(enrolledCourseIds);

    console.log('PKL recommended course IDs:', recommendedCourseIds);

    if (recommendedCourseIds.length === 0) {
      return NextResponse.json({
        success: true,
        courses: [],
        message: 'No recommendations found',
        type: 'content-based'
      });
    }

    // Step 3: Filter out already enrolled courses
    const filteredCourseIds = recommendedCourseIds.filter(
      id => !enrolledCourseIds.includes(id)
    );

    console.log('Filtered course IDs (excluding enrolled):', filteredCourseIds);

    if (filteredCourseIds.length === 0) {
      return NextResponse.json({
        success: true,
        courses: [],
        message: 'You are already enrolled in all recommended courses!',
        type: 'content-based'
      });
    }

    // Step 4: Fetch full course details from database
    const recommendedCourses = await db
      .select()
      .from(courses)
      .where(inArray(courses.id, filteredCourseIds));

    console.log('Returning CB recommendations:', recommendedCourses.length);

    return NextResponse.json({
      success: true,
      courses: recommendedCourses,
      type: 'content-based',
      enrolledCount: enrolledCourseIds.length,
      recommendedCount: recommendedCourses.length
    });

  } catch (error) {
    console.error('Error in CB recommendations:', error);
    return NextResponse.json({
      error: 'Failed to get CB recommendations',
      details: error.message,
      courses: []
    }, { status: 500 });
  }
}

/**
 * PLACEHOLDER: Load PKL model and get recommendations
 * 
 * TODO: Replace this with actual PKL file integration
 * 
 * Options for integration:
 * 1. Python microservice (Flask/FastAPI) that loads the PKL
 * 2. Use child_process to call Python script
 * 3. Convert model to JavaScript (if possible)
 * 
 * Expected input: Array of enrolled course IDs
 * Expected output: Array of recommended course IDs
 */
async function getRecommendationsFromPKL(enrolledCourseIds) {
  // PLACEHOLDER IMPLEMENTATION
  // This simulates what the PKL file would return
  
  console.log('PLACEHOLDER: Getting recommendations from PKL for:', enrolledCourseIds);
  
  // TODO: Replace with actual PKL integration
  // Example approaches:
  
  // Option 1: Call Python microservice
  // const response = await fetch('http://localhost:5000/recommend', {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify({ course_ids: enrolledCourseIds })
  // });
  // const data = await response.json();
  // return data.recommended_course_ids;
  
  // Option 2: Execute Python script
  // const { spawn } = require('child_process');
  // const python = spawn('python', ['scripts/recommend.py', JSON.stringify(enrolledCourseIds)]);
  // return new Promise((resolve) => {
  //   python.stdout.on('data', (data) => {
  //     resolve(JSON.parse(data.toString()));
  //   });
  // });
  
  // For now, return empty array (will show "no recommendations" message)
  return [];
  
  // OR: For testing, you can return some dummy course IDs:
  // return ['4576420', '4667750', '5017460']; // Replace with actual IDs from your DB
}
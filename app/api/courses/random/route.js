// app/api/courses/random/route.js
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { courses } from '@/lib/schema';
import { sql } from 'drizzle-orm';

export async function GET() {
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
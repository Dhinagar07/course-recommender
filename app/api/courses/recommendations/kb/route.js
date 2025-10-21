// app/api/courses/recommendations/kb/route.js
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { courses } from '@/lib/schema';
import { and, eq, gte, lte, or, like, sql } from 'drizzle-orm';

/**
 * Enhanced Knowledge-Based Recommendation System
 * With constraint relaxation logic from Colab notebook
 */

// Handle GET requests (for testing)
export async function GET() {
  return NextResponse.json({
    message: 'KB Recommendations API - Use POST with filters',
    status: 'active'
  });
}

// Relaxation strategies for different constraints
const RELAXATION_STRATEGIES = {
  minRating: { type: 'decrement', value: 0.5, maxAttempts: 3 },
  maxPrice: { type: 'increment', value: 100, maxAttempts: 5 },
  minDuration: { type: 'decrement', value: 10, maxAttempts: 3 },
  language: { type: 'remove', maxAttempts: 1 },
  category: { type: 'remove', maxAttempts: 1 },
  subcategory: { type: 'remove', maxAttempts: 1 },
  isPaid: { type: 'remove', maxAttempts: 1 }
};

// Apply constraints to query builder
function applyConstraints(query, constraints) {
  let conditions = [];

  if (constraints.category) {
    conditions.push(eq(courses.category, constraints.category));
  }

  if (constraints.subcategory) {
    conditions.push(eq(courses.subcategory, constraints.subcategory));
  }

  if (constraints.topic) {
    conditions.push(like(courses.topic, `%${constraints.topic}%`));
  }

  if (constraints.language) {
    conditions.push(eq(courses.language, constraints.language));
  }

  if (constraints.isPaid !== undefined && constraints.isPaid !== null) {
    const isPaidBool = constraints.isPaid === 'true' || constraints.isPaid === true;
    conditions.push(eq(courses.is_paid, isPaidBool));
  }

  if (constraints.minRating) {
    conditions.push(gte(courses.avg_rating, parseFloat(constraints.minRating)));
  }

  if (constraints.maxPrice !== undefined && constraints.maxPrice !== null) {
    conditions.push(lte(courses.price, parseFloat(constraints.maxPrice)));
  }

  if (constraints.minDuration) {
    conditions.push(gte(courses.content_length_min, parseInt(constraints.minDuration)));
  }

  if (constraints.maxDuration) {
    conditions.push(lte(courses.content_length_min, parseInt(constraints.maxDuration)));
  }

  if (conditions.length > 0) {
    return query.where(and(...conditions));
  }

  return query;
}

// Calculate weighted score for courses
function calculateKbScore(courses) {
  if (courses.length === 0) return courses;

  const maxSubscribers = Math.max(...courses.map(c => c.num_subscribers || 0));
  const maxReviews = Math.max(...courses.map(c => c.num_reviews || 0));
  const maxLectures = Math.max(...courses.map(c => c.num_lectures || 0));

  return courses.map(course => {
    let score = 0;

    // Rating weight (40%)
    if (course.avg_rating) {
      score += (parseFloat(course.avg_rating) / 5) * 40;
    }

    // Popularity weight (30%) - based on subscribers
    if (course.num_subscribers && maxSubscribers > 0) {
      score += (course.num_subscribers / maxSubscribers) * 30;
    }

    // Reviews weight (20%)
    if (course.num_reviews && maxReviews > 0) {
      score += (course.num_reviews / maxReviews) * 20;
    }

    // Content length weight (10%) - prefer courses with more content
    if (course.num_lectures && maxLectures > 0) {
      score += (course.num_lectures / maxLectures) * 10;
    }

    return {
      ...course,
      kb_score: Math.round(score * 100) / 100
    };
  });
}

// Relax constraints step by step (QuickXplain style)
function relaxConstraints(constraints, relaxationStep = 0) {
  const relaxed = { ...constraints };
  const explanation = [];
  
  // Define relaxation order
  const relaxationOrder = [
    'minRating', 'maxPrice', 'minDuration', 'subcategory', 'category', 'language', 'isPaid'
  ];

  // Apply relaxation based on step
  for (let i = 0; i <= relaxationStep && i < relaxationOrder.length; i++) {
    const constraint = relaxationOrder[i];
    const strategy = RELAXATION_STRATEGIES[constraint];
    
    if (!strategy || relaxed[constraint] === undefined) continue;

    switch (strategy.type) {
      case 'decrement':
        if (relaxed[constraint] > 0) {
          const oldVal = relaxed[constraint];
          relaxed[constraint] = Math.max(0, oldVal - strategy.value);
          explanation.push(`Relaxed ${constraint}: ${oldVal} → ${relaxed[constraint]}`);
        }
        break;
      
      case 'increment':
        const oldVal = relaxed[constraint];
        relaxed[constraint] = oldVal + strategy.value;
        explanation.push(`Relaxed ${constraint}: ${oldVal} → ${relaxed[constraint]}`);
        break;
      
      case 'remove':
        explanation.push(`Removed ${constraint} filter`);
        relaxed[constraint] = undefined;
        break;
    }
  }

  return { relaxed, explanation };
}

// Find minimal conflicting constraints
async function findConflicts(db, originalConstraints) {
  const conflicts = [];
  
  // Test each constraint individually
  for (const [key, value] of Object.entries(originalConstraints)) {
    if (value === undefined || value === null) continue;
    
    const testConstraints = { [key]: value };
    const query = applyConstraints(db.select().from(courses), testConstraints);
    const results = await query;
    
    if (results.length === 0) {
      conflicts.push(key);
    }
  }
  
  return conflicts;
}

export async function POST(request) {
  try {
    const filters = await request.json();
    
    const {
      category,
      subcategory,
      topic,
      language,
      level,
      isPaid,
      minRating = 0,
      maxPrice = 1000,
      minDuration = 0,
      maxDuration,
    } = filters;

    console.log('KB Filters received:', filters);

    let currentConstraints = {
      category,
      subcategory,
      topic,
      language,
      isPaid: isPaid !== '' ? isPaid : undefined,
      minRating: minRating ? parseFloat(minRating) : undefined,
      maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
      minDuration: minDuration ? parseInt(minDuration) : undefined,
      maxDuration: maxDuration ? parseInt(maxDuration) : undefined
    };

    let results = [];
    let relaxationHistory = [];
    let finalConstraints = { ...currentConstraints };

    // Try original constraints first
    let query = applyConstraints(db.select().from(courses), currentConstraints);
    results = await query;

    console.log('Initial results:', results.length);

    // If no results, apply relaxation
    if (results.length === 0) {
      relaxationHistory.push('No courses found with original constraints. Applying relaxation...');
      
      // Find conflicting constraints
      const conflicts = await findConflicts(db, currentConstraints);
      if (conflicts.length > 0) {
        relaxationHistory.push(`Conflicting constraints: ${conflicts.join(', ')}`);
      }

      // Try relaxation steps
      for (let step = 0; step < 3; step++) {
        const { relaxed, explanation } = relaxConstraints(currentConstraints, step);
        finalConstraints = relaxed;
        
        relaxationHistory.push(...explanation);
        
        query = applyConstraints(db.select().from(courses), relaxed);
        results = await query;
        
        console.log(`Relaxation step ${step + 1}: ${results.length} results`);
        
        if (results.length > 0) {
          relaxationHistory.push(`Found ${results.length} courses after relaxation`);
          break;
        }
        
        if (step === 2 && results.length === 0) {
          // Final fallback - most popular courses
          relaxationHistory.push('No matches found → showing most popular courses');
          results = await db.select()
            .from(courses)
            .orderBy(sql`${courses.num_subscribers} desc`)
            .limit(50);
        }
      }
    } else {
      relaxationHistory.push('Found courses matching all original constraints');
    }

    // Apply weighted scoring
    const scoredCourses = calculateKbScore(results);
    
    // Sort by score descending, then by subscribers
    scoredCourses.sort((a, b) => {
      if (b.kb_score !== a.kb_score) {
        return b.kb_score - a.kb_score;
      }
      return b.num_subscribers - a.num_subscribers;
    });

    // Return top 30 courses
    const topCourses = scoredCourses.slice(0, 30);

    console.log('Final results:', topCourses.length);
    console.log('Relaxation history:', relaxationHistory);

    return NextResponse.json({
      success: true,
      courses: topCourses,
      type: 'knowledge-based',
      filtersApplied: filters,
      relaxation: {
        wasRelaxed: relaxationHistory.length > 1,
        steps: relaxationHistory,
        finalConstraints
      },
      metadata: {
        totalFound: results.length,
        topCoursesReturned: topCourses.length,
        scoreRange: topCourses.length > 0 ? {
          min: Math.min(...topCourses.map(c => c.kb_score)),
          max: Math.max(...topCourses.map(c => c.kb_score)),
          avg: topCourses.reduce((sum, c) => sum + c.kb_score, 0) / topCourses.length
        } : null
      }
    });

  } catch (error) {
    console.error('Error in KB recommendations:', error);
    return NextResponse.json({
      error: 'Failed to get KB recommendations',
      details: error.message,
      courses: []
    }, { status: 500 });
  }
}
'use client';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Navbar from '@/components/Navbar';
import Filters from '@/components/Filters';
import CoursesGrid from '@/components/CoursesGrid';

export default function HomePage() {
  const { data: session, status } = useSession();
  const [courses, setCourses] = useState([]); // all courses fetched
  const [filteredCourses, setFilteredCourses] = useState([]); // KB-filtered
  const [loading, setLoading] = useState(true);
  const [relaxationHistory, setRelaxationHistory] = useState([]);

  const fetchCourses = async () => {
    setLoading(true);
    try {
      let data;
      if (session?.user?.id) {
        // Logged-in user → fetch from recommendation server
        const res = await fetch(`http://127.0.0.1:5000/recommend?user_id=${session.user.id}&k=100`);
        data = await res.json();
        data.courses=data.recommendations || [];
        console.log('Fetched recommended courses:', data);
        if (!Array.isArray(data.courses)) data.courses = [];
      } else {
        // Not logged in → fetch random courses
        const res = await fetch('/api/courses/random');
        const randomData = await res.json();
        data = randomData.success ? randomData : { courses: [] };
      }

      setCourses(data.courses);
      setFilteredCourses(data.courses); // default
    } catch (err) {
      console.error('Error fetching courses:', err);
      setCourses([]);
      setFilteredCourses([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
    console.log('Session data:', session);
  }, [session]); // re-fetch if session changes

  // FRONTEND KB FILTERING WITH RELAXATION (same as before)
  const applyKbFilters = (filters) => {
    const RELAXATION_ORDER = [
      'minRating', 'maxPrice', 'minDuration', 'subcategory', 'category', 'language', 'isPaid'
    ];

    const RELAXATION_STRATEGIES = {
      minRating: { type: 'decrement', value: 0.5 },
      maxPrice: { type: 'increment', value: 100 },
      minDuration: { type: 'decrement', value: 10 },
      subcategory: { type: 'remove' },
      category: { type: 'remove' },
      language: { type: 'remove' },
      isPaid: { type: 'remove' }
    };

    let currentConstraints = {
      minRating: filters.minRating ? parseFloat(filters.minRating) : 0,
      maxPrice: filters.maxPrice ? parseFloat(filters.maxPrice) : Infinity,
      minDuration: filters.minDuration ? parseInt(filters.minDuration) : 0,
      maxDuration: filters.maxDuration ? parseInt(filters.maxDuration) : Infinity,
      category: filters.category || null,
      subcategory: filters.subcategory || null,
      language: filters.language || null,
      isPaid: filters.isPaid !== '' ? (filters.isPaid === 'true' || filters.isPaid === true) : null,
      topic: filters.topic || null
    };

    let filtered = [];
    const history = [];

    const filterCourses = (constraints) => {
      return courses.filter(course => {
        if (constraints.category && course.category !== constraints.category) return false;
        if (constraints.subcategory && course.subcategory !== constraints.subcategory) return false;
        if (constraints.language && course.language !== constraints.language) return false;
        if (constraints.isPaid !== null && course.is_paid !== constraints.isPaid) return false;
        if (constraints.minRating && (course.avg_rating || 0) < constraints.minRating) return false;
        if (constraints.maxPrice && (course.price || 0) > constraints.maxPrice) return false;
        if (constraints.minDuration && (course.content_length_min || 0) < constraints.minDuration) return false;
        if (constraints.maxDuration && (course.content_length_min || 0) > constraints.maxDuration) return false;
        if (constraints.topic && !(course.topic || '').toLowerCase().includes(constraints.topic.toLowerCase())) return false;
        return true;
      });
    };

    for (let step = 0; step <= RELAXATION_ORDER.length; step++) {
      filtered = filterCourses(currentConstraints);
      if (filtered.length > 0) break;

      if (step === RELAXATION_ORDER.length) break;

      const key = RELAXATION_ORDER[step];
      const strategy = RELAXATION_STRATEGIES[key];
      if (!strategy) continue;

      switch (strategy.type) {
        case 'decrement':
          if (currentConstraints[key] > 0) {
            const oldVal = currentConstraints[key];
            currentConstraints[key] = Math.max(0, oldVal - strategy.value);
            history.push(`Relaxed ${key}: ${oldVal} → ${currentConstraints[key]}`);
          }
          break;
        case 'increment':
          const oldValInc = currentConstraints[key];
          currentConstraints[key] = oldValInc + strategy.value;
          history.push(`Relaxed ${key}: ${oldValInc} → ${currentConstraints[key]}`);
          break;
        case 'remove':
          if (currentConstraints[key] !== null) {
            history.push(`Removed ${key} filter`);
            currentConstraints[key] = null;
          }
          break;
      }
    }

    // Sort by weighted KB score
    const maxSubscribers = Math.max(...filtered.map(c => c.num_subscribers || 0)) || 1;
    const maxReviews = Math.max(...filtered.map(c => c.num_reviews || 0)) || 1;
    const maxLectures = Math.max(...filtered.map(c => c.num_lectures || 0)) || 1;

    filtered = filtered.map(course => {
      let score = 0;
      if (course.avg_rating) score += (course.avg_rating / 5) * 40;
      if (course.num_subscribers) score += (course.num_subscribers / maxSubscribers) * 30;
      if (course.num_reviews) score += (course.num_reviews / maxReviews) * 20;
      if (course.num_lectures) score += (course.num_lectures / maxLectures) * 10;
      return { ...course, kb_score: Math.round(score * 100) / 100 };
    });

    filtered.sort((a, b) => b.kb_score - a.kb_score || (b.num_subscribers - a.num_subscribers));

    setRelaxationHistory(history);
    setFilteredCourses(filtered.slice(0, 30));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto ml-16 mr-16 p-8">
        <Filters onFilter={applyKbFilters} />
        {relaxationHistory.length > 0 && (
          <div className="mb-4 text-sm text-gray-500">
            <p>Relaxation steps applied:</p>
            <ul className="list-disc pl-5">
              {relaxationHistory.map((step, i) => <li key={i}>{step}</li>)}
            </ul>
          </div>
        )}
        <CoursesGrid courses={filteredCourses} loading={loading} />
      </div>
    </div>
  );
}

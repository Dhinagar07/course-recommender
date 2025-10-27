"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Navbar from "@/components/Navbar";
import Filters from "@/components/Filters";
import CoursesGrid from "@/components/CoursesGrid";

export default function HomePage() {
  const { data: session, status } = useSession();
  const [courses, setCourses] = useState([]);
  const [filteredCourses, setFilteredCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [relaxationHistory, setRelaxationHistory] = useState([]);
  const [searchTopic, setSearchTopic] = useState("");

  // --- Fetch Courses or Recommendations ---
  const fetchCourses = async (topic = null) => {
    setLoading(true);
    try {
      let data;

      if (topic && topic.trim() !== "") {
        // 🔍 Use /search endpoint when user searches
        const url = `http://127.0.0.1:5000/search?term=${encodeURIComponent(
          topic
        )}&k=50`;
        console.log("Searching courses for topic:", topic);
        const res = await fetch(url);
        data = await res.json();
        data.courses = data.results || [];
        if (!Array.isArray(data.courses)) data.courses = [];
      } else if (session?.user?.id) {
        // 👤 Personalized recommendations
        let url = `http://127.0.0.1:5000/recommend?user_id=${session.user.id}&k=100`;
        const res = await fetch(url);
        data = await res.json();
        data.courses = data.recommendations || [];
        if (!Array.isArray(data.courses)) data.courses = [];
      } else {
        // 🧩 Not logged in → fallback random
        console.log("not logged in or not available");
        const res = await fetch("/api/courses/random");
        const randomData = await res.json();
        data = randomData.success ? randomData : { courses: [] };
      }

      setCourses(data.courses);
      setFilteredCourses(data.courses);
    } catch (err) {
      console.error("Error fetching courses:", err);
      setCourses([]);
      setFilteredCourses([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status === "authenticated" && courses.length === 0) {
      fetchCourses();
    }
  }, [status]);

  // const applyKbFilters = (filters) => {
  //   const RELAXATION_ORDER = [
  //     "minRating",
  //     "maxPrice",
  //     "minDuration",
  //     "subcategory",
  //     "category",
  //     "language",
  //     "isPaid",
  //   ];

  //   const RELAXATION_STRATEGIES = {
  //     minRating: { type: "decrement", value: 0.5 },
  //     maxPrice: { type: "increment", value: 100 },
  //     minDuration: { type: "decrement", value: 10 },
  //     subcategory: { type: "remove" },
  //     category: { type: "remove" },
  //     language: { type: "remove" },
  //     isPaid: { type: "remove" },
  //   };

  //   const safeParse = (val, fallback) =>
  //     val !== undefined && val !== null && val !== "" && !isNaN(parseFloat(val))
  //       ? parseFloat(val)
  //       : fallback;

  //   let currentConstraints = {
  //     minRating: safeParse(filters.minRating, 0),
  //     maxPrice: safeParse(filters.maxPrice, Infinity),
  //     minDuration: safeParse(filters.minDuration, 0),
  //     maxDuration: safeParse(filters.maxDuration, Infinity),
  //     category: filters.category || null,
  //     subcategory: filters.subcategory || null,
  //     language: filters.language || null,
  //     isPaid:
  //       filters.isPaid !== ""
  //         ? filters.isPaid === "true" || filters.isPaid === true
  //         : null,
  //     topic: filters.topic || null,
  //   };

  //   let filtered = [];
  //   const history = [];

  //   const filterCourses = (constraints) => {
  //     return courses.filter((course) => {
  //       if (constraints.category && course.category !== constraints.category)
  //         return false;
  //       if (
  //         constraints.subcategory &&
  //         course.subcategory !== constraints.subcategory
  //       )
  //         return false;
  //       if (constraints.language && course.language !== constraints.language)
  //         return false;
  //       if (
  //         constraints.isPaid !== null &&
  //         course.is_paid !== constraints.isPaid
  //       )
  //         return false;
  //       if (
  //         constraints.minRating &&
  //         (course.avg_rating || 0) < constraints.minRating
  //       )
  //         return false;
  //       if (constraints.maxPrice && (course.price || 0) > constraints.maxPrice)
  //         return false;
  //       if (
  //         constraints.minDuration &&
  //         (course.content_length_min || 0) < constraints.minDuration
  //       )
  //         return false;
  //       if (
  //         constraints.maxDuration &&
  //         (course.content_length_min || 0) > constraints.maxDuration
  //       )
  //         return false;
  //       if (
  //         constraints.topic &&
  //         !(course.title || "")
  //           .toLowerCase()
  //           .includes(constraints.topic.toLowerCase())
  //       )
  //         return false;
  //       return true;
  //     });
  //   };

  //   for (let step = 0; step <= RELAXATION_ORDER.length; step++) {
  //     filtered = filterCourses(currentConstraints);
  //     if (filtered.length > 0) break;

  //     if (step === RELAXATION_ORDER.length) break;

  //     const key = RELAXATION_ORDER[step];
  //     const strategy = RELAXATION_STRATEGIES[key];
  //     if (!strategy) continue;

  //     switch (strategy.type) {
  //       case "decrement":
  //         if (currentConstraints[key] > 0) {
  //           const oldVal = currentConstraints[key];
  //           currentConstraints[key] = Math.max(0, oldVal - strategy.value);
  //           history.push(
  //             `Relaxed ${key}: ${oldVal} → ${currentConstraints[key]}`
  //           );
  //         }
  //         break;
  //       case "increment":
  //         const oldValInc = currentConstraints[key];
  //         currentConstraints[key] = oldValInc + strategy.value;
  //         history.push(
  //           `Relaxed ${key}: ${oldValInc} → ${currentConstraints[key]}`
  //         );
  //         break;
  //       case "remove":
  //         if (currentConstraints[key] !== null) {
  //           history.push(`Removed ${key} filter`);
  //           currentConstraints[key] = null;
  //         }
  //         break;
  //     }
  //   }

  //   const safeMax = (arr, key) => {
  //     const vals = arr.map((c) => c[key] || 0);
  //     return vals.length ? Math.max(...vals) || 1 : 1;
  //   };

  //   const maxSubscribers = safeMax(filtered, "num_subscribers");
  //   const maxReviews = safeMax(filtered, "num_reviews");
  //   const maxLectures = safeMax(filtered, "num_lectures");

  //   filtered = filtered.map((course) => {
  //     let score = 0;
  //     if (course.avg_rating) score += (course.avg_rating / 5) * 40;
  //     if (course.num_subscribers)
  //       score += (course.num_subscribers / maxSubscribers) * 30;
  //     if (course.num_reviews) score += (course.num_reviews / maxReviews) * 20;
  //     if (course.num_lectures)
  //       score += (course.num_lectures / maxLectures) * 10;
  //     return { ...course, kb_score: Math.round(score * 100) / 100 };
  //   });

  //   filtered.sort(
  //     (a, b) => b.kb_score - a.kb_score || b.num_subscribers - a.num_subscribers
  //   );

  //   if (filtered.length === 0) {
  //     history.push("No courses found even after relaxing filters.");
  //   }

  //   setRelaxationHistory(history);
  //   setFilteredCourses(filtered.slice(0, 30));
  // };
  const applyKbFilters = (filters) => {
    const RELAXATION_ORDER = [
      "minRating",
      "maxPrice",
      "minDuration",
      "subcategory",
      "category",
      "language",
      "isPaid",
    ];

    const RELAXATION_STRATEGIES = {
      minRating: { type: "decrement", value: 0.5 },
      maxPrice: { type: "increment", value: 100 },
      minDuration: { type: "decrement", value: 10 },
      subcategory: { type: "remove" },
      category: { type: "remove" },
      language: { type: "remove" },
      isPaid: { type: "remove" },
    };

    const safeParse = (val, fallback) =>
      val !== undefined && val !== null && val !== "" && !isNaN(parseFloat(val))
        ? parseFloat(val)
        : fallback;

    let currentConstraints = {
      minRating: safeParse(filters.minRating, 0),
      maxPrice: safeParse(filters.maxPrice, Infinity),
      minDuration: safeParse(filters.minDuration, 0),
      maxDuration: safeParse(filters.maxDuration, Infinity),
      category: filters.category || null,
      subcategory: filters.subcategory || null,
      language: filters.language || null,
      isPaid:
        filters.isPaid !== ""
          ? filters.isPaid === "true" || filters.isPaid === true
          : null,
      topic: filters.topic || null,
    };

    let filtered = [];
    const history = [];

    const filterCourses = (constraints) => {
      return courses.filter((course) => {
        if (constraints.category && course.category !== constraints.category)
          return false;
        if (
          constraints.subcategory &&
          course.subcategory !== constraints.subcategory
        )
          return false;
        if (constraints.language && course.language !== constraints.language)
          return false;
        if (
          constraints.isPaid !== null &&
          course.is_paid !== constraints.isPaid
        )
          return false;
        if (
          constraints.minRating &&
          (course.avg_rating || 0) < constraints.minRating
        )
          return false;
        if (constraints.maxPrice && (course.price || 0) > constraints.maxPrice)
          return false;
        if (
          constraints.minDuration &&
          (course.content_length_min || 0) < constraints.minDuration
        )
          return false;
        if (
          constraints.maxDuration &&
          (course.content_length_min || 0) > constraints.maxDuration
        )
          return false;
        if (
          constraints.topic &&
          !(course.title || "")
            .toLowerCase()
            .includes(constraints.topic.toLowerCase())
        )
          return false;
        return true;
      });
    };

    const isConsistent = (subset) => {
      const partialConstraints = Object.fromEntries(subset);
      return (
        filterCourses({ ...currentConstraints, ...partialConstraints }).length >
        0
      );
    };

    const quickXplain = (constraints) => {
      if (isConsistent(constraints)) return [];
      if (constraints.length <= 1) return constraints;
      const mid = Math.floor(constraints.length / 2);
      const left = constraints.slice(0, mid);
      const right = constraints.slice(mid);
      const leftConflict = quickXplain(left, (c) =>
        isConsistent([...c, ...right])
      );
      const rightConflict = quickXplain(right, (c) =>
        isConsistent([...left, ...c])
      );
      return [...leftConflict, ...rightConflict];
    };

    filtered = filterCourses(currentConstraints);

    if (filtered.length === 0) {
      const constraintEntries = Object.entries(currentConstraints).filter(
        ([k, v]) => v !== null && v !== undefined
      );
      const conflicting = quickXplain(constraintEntries);

      if (conflicting.length > 0) {
        for (const [key] of conflicting) {
          const strategy = RELAXATION_STRATEGIES[key];
          if (!strategy) continue;
          switch (strategy.type) {
            case "decrement":
              if (currentConstraints[key] > 0) {
                const oldVal = currentConstraints[key];
                currentConstraints[key] = Math.max(0, oldVal - strategy.value);
                history.push(
                  `QuickXplain relaxed ${key}: ${oldVal} → ${currentConstraints[key]}`
                );
              }
              break;
            case "increment":
              const oldValInc = currentConstraints[key];
              if (isFinite(oldValInc)) {
                currentConstraints[key] = oldValInc + strategy.value;
                history.push(
                  `Relaxed ${key}: ${oldValInc} → ${currentConstraints[key]}`
                );
              } else {
                history.push(`Skipped relaxing ${key} (already unconstrained)`);
              }
              break;

            case "remove":
              if (currentConstraints[key] !== null) {
                history.push(`QuickXplain removed ${key}`);
                currentConstraints[key] = null;
              }
              break;
          }
        }
      }

      for (let step = 0; step <= RELAXATION_ORDER.length; step++) {
        filtered = filterCourses(currentConstraints);
        if (filtered.length > 0) break;
        if (step === RELAXATION_ORDER.length) break;
        const key = RELAXATION_ORDER[step];
        const strategy = RELAXATION_STRATEGIES[key];
        if (!strategy) continue;
        switch (strategy.type) {
          case "decrement":
            if (currentConstraints[key] > 0) {
              const oldVal = currentConstraints[key];
              currentConstraints[key] = Math.max(0, oldVal - strategy.value);
              history.push(
                `Relaxed ${key}: ${oldVal} → ${currentConstraints[key]}`
              );
            }
            break;
          case "increment":
            const oldValInc = currentConstraints[key];
            currentConstraints[key] = oldValInc + strategy.value;
            history.push(
              `Relaxed ${key}: ${oldValInc} → ${currentConstraints[key]}`
            );
            break;
          case "remove":
            if (currentConstraints[key] !== null) {
              history.push(`Removed ${key} filter`);
              currentConstraints[key] = null;
            }
            break;
        }
      }
    }

    const safeMax = (arr, key) => {
      const vals = arr.map((c) => c[key] || 0);
      return vals.length ? Math.max(...vals) || 1 : 1;
    };

    const maxSubscribers = safeMax(filtered, "num_subscribers");
    const maxReviews = safeMax(filtered, "num_reviews");
    const maxLectures = safeMax(filtered, "num_lectures");

    filtered = filtered.map((course) => {
      let score = 0;
      if (course.avg_rating) score += (course.avg_rating / 5) * 40;
      if (course.num_subscribers)
        score += (course.num_subscribers / maxSubscribers) * 30;
      if (course.num_reviews) score += (course.num_reviews / maxReviews) * 20;
      if (course.num_lectures)
        score += (course.num_lectures / maxLectures) * 10;
      return { ...course, kb_score: Math.round(score * 100) / 100 };
    });

    filtered.sort(
      (a, b) => b.kb_score - a.kb_score || b.num_subscribers - a.num_subscribers
    );

    if (filtered.length === 0) {
      history.push("No courses found even after relaxing filters.");
    }

    setRelaxationHistory(history);
    setFilteredCourses(filtered.slice(0, 30));
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchTopic.trim()) return;
    await fetchCourses(searchTopic);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto ml-16 mr-16 p-8">
        <form onSubmit={handleSearch} className="mb-4 flex">
          <input
            type="text"
            placeholder="Search by topic..."
            value={searchTopic}
            onChange={(e) => setSearchTopic(e.target.value)}
            className="flex-grow border border-gray-300 rounded-l px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <button
            type="submit"
            className="bg-blue-500 text-white px-4 py-2 rounded-r hover:bg-blue-600"
          >
            Search
          </button>
        </form>

        <Filters onFilter={applyKbFilters} />

        {relaxationHistory.length > 0 && (
          <div className="mb-4 text-sm text-gray-500">
            <p>Relaxation steps applied:</p>
            <ul className="list-disc pl-5">
              {relaxationHistory.map((step, i) => (
                <li key={i}>{step}</li>
              ))}
            </ul>
          </div>
        )}

        <CoursesGrid courses={filteredCourses} loading={loading} />
      </div>
    </div>
  );
}

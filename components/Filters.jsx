"use client";
import { useState } from "react";

const categories = [
  "Lifestyle", "Business", "Design", "Health & Fitness", "Finance & Accounting",
  "Development", "Marketing", "Teaching & Academics", "IT & Software",
  "Office Productivity", "Music", "Personal Development", "Photography & Video"
];

const languages = [
  "English", "Spanish", "Turkish", "Simplified Chinese", "Arabic", "Portuguese",
  "Italian", "Serbian", "Afrikaans", "French", "Slovak", "Japanese", "Hebrew",
  "Traditional Chinese", "Estonian", "German", "Russian", "Finnish", "Dutch",
  "Hungarian", "Swedish", "Norwegian", "Thai", "Bulgarian", "Polish", "Urdu",
  "Croatian", "Marathi", "Danish", "Greek", "Hindi", "Indonesian", "Azeri",
  "Vietnamese", "Bengali", "Persian", "Malay", "Korean", "Filipino", "Romanian",
  "Catalan", "Czech", "Albanian", "Telugu", "Latvian", "Ukrainian", "Tamil",
  "Somali", "Burmese", "Kazakh", "Tatar", "Kurdish", "Aymara", "Malayalam",
  "Uzbek", "Georgian", "Lithuanian", "Gujarati", "Pashto", "Haitian", "Nepali",
  "Armenian", "Punjabi", "Swahili", "Mongolian", "Slovenian", "Zulu", "Kannada",
  "Guaraní", "Quechua", "Macedonian", "Khmer", "Frisian", "Welsh", "Irish",
  "Basque", "Xhosa", "Tajik", "Faroese"
];

export default function Filters({ onFilter }) {
  const [filters, setFilters] = useState({
    category: "",
    subcategory: "",
    topic: "",
    language: "",
    level: "",
    isPaid: "",
    minRating: "",
    maxPrice: "",
  });

  const handleChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const applyFilters = () => onFilter(filters);
  const clearFilters = () => {
    const cleared = {
      category: "",
      subcategory: "",
      topic: "",
      language: "",
      level: "",
      isPaid: "",
      minRating: "",
      maxPrice: "",
    };
    setFilters(cleared);
    onFilter(cleared);
  };

  return (
    <div className="bg-white/90 backdrop-blur-sm border border-gray-100 shadow-md rounded-2xl p-8 mb-10">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center sm:text-left">
        🎯 Find Your Perfect Course
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <select
          value={filters.category}
          onChange={(e) => handleChange("category", e.target.value)}
          className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
        >
          <option value="">All Categories</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>

        <input
          type="text"
          placeholder="Subcategory"
          value={filters.subcategory}
          onChange={(e) => handleChange("subcategory", e.target.value)}
          className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
        />

        {/* <input
          type="text"
          placeholder="Topic"
          value={filters.topic}
          onChange={(e) => handleChange("topic", e.target.value)}
          className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
        /> */}

        <select
          value={filters.language}
          onChange={(e) => handleChange("language", e.target.value)}
          className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
        >
          <option value="">All Languages</option>
          {languages.map((lang) => (
            <option key={lang} value={lang}>{lang}</option>
          ))}
        </select>

        <select
          value={filters.level}
          onChange={(e) => handleChange("level", e.target.value)}
          className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
        >
          <option value="">All Levels</option>
          <option value="Beginner">Beginner</option>
          <option value="Intermediate">Intermediate</option>
          <option value="Advanced">Advanced</option>
        </select>

        <select
          value={filters.isPaid}
          onChange={(e) => handleChange("isPaid", e.target.value)}
          className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
        >
          <option value="">All Types</option>
          <option value="true">Paid</option>
          <option value="false">Free</option>
        </select>

        <input
          type="number"
          placeholder="Min Rating (0 - 5)"
          step="0.1"
          min="0"
          max="5"
          value={filters.minRating}
          onChange={(e) => handleChange("minRating", e.target.value)}
          className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
        />

        <input
          type="number"
          placeholder="Max Price (0 - 999.99)"
          min="0"
          max="999.99"
          step="0.01"
          value={filters.maxPrice}
          onChange={(e) => handleChange("maxPrice", e.target.value)}
          className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
        />
      </div>

      <div className="flex flex-wrap justify-center sm:justify-start gap-4 mt-8">
        <button
          onClick={applyFilters}
          className="px-8 py-2.5 bg-blue-600 text-white font-semibold rounded-lg shadow-sm hover:bg-blue-700 hover:shadow-md transition"
        >
          Apply Filters
        </button>
        <button
          onClick={clearFilters}
          className="px-8 py-2.5 bg-gray-200 text-gray-800 font-medium rounded-lg hover:bg-gray-300 transition"
        >
          Clear
        </button>
      </div>
    </div>
  );
}

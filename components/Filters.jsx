'use client';
import { useState } from 'react';

export default function Filters({ onFilter }) {
  const [filters, setFilters] = useState({
    category: '',
    subcategory: '',
    topic: '',
    language: '',
    level: '',
    isPaid: '',
    minRating: '',
    maxPrice: '',
  });

  const handleChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const applyFilters = () => onFilter(filters);
  const clearFilters = () => {
    const cleared = {
      category: '',
      subcategory: '',
      topic: '',
      language: '',
      level: '',
      isPaid: '',
      minRating: '',
      maxPrice: '',
    };
    setFilters(cleared);
    onFilter(cleared);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-8">
      <h2 className="text-xl font-semibold mb-4">Find Your Perfect Course</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <input
          type="text"
          placeholder="Category"
          value={filters.category}
          onChange={e => handleChange('category', e.target.value)}
          className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
        />
        <input
          type="text"
          placeholder="Subcategory"
          value={filters.subcategory}
          onChange={e => handleChange('subcategory', e.target.value)}
          className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
        />
        <input
          type="text"
          placeholder="Topic"
          value={filters.topic}
          onChange={e => handleChange('topic', e.target.value)}
          className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
        />
        <input
          type="text"
          placeholder="Language"
          value={filters.language}
          onChange={e => handleChange('language', e.target.value)}
          className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
        />
        <select
          value={filters.level}
          onChange={e => handleChange('level', e.target.value)}
          className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Levels</option>
          <option value="Beginner">Beginner</option>
          <option value="Intermediate">Intermediate</option>
          <option value="Advanced">Advanced</option>
        </select>
        <select
          value={filters.isPaid}
          onChange={e => handleChange('isPaid', e.target.value)}
          className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Types</option>
          <option value="true">Paid</option>
          <option value="false">Free</option>
        </select>
        <input
          type="number"
          placeholder="Min Rating"
          step="0.5"
          min="0"
          max="5"
          value={filters.minRating}
          onChange={e => handleChange('minRating', e.target.value)}
          className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
        />
        <input
          type="number"
          placeholder="Max Price"
          value={filters.maxPrice}
          onChange={e => handleChange('maxPrice', e.target.value)}
          className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="flex gap-3 mt-6">
        <button
          onClick={applyFilters}
          className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Apply
        </button>
        <button
          onClick={clearFilters}
          className="px-6 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
        >
          Clear
        </button>
      </div>
    </div>
  );
}

'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { BookOpen } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Registration failed');
        setLoading(false);
        return;
      }

      router.push('/login?registered=true');
    } catch (error) {
      setError('An error occurred');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-500 via-teal-600 to-blue-500 flex items-center justify-center p-8">
      <div className="bg-white/10 backdrop-blur-lg border border-white/20 p-12 rounded-3xl shadow-2xl w-full max-w-md">
        {/* Logo Section */}
        <div className="flex items-center justify-center mb-16">
          <BookOpen className="w-20 h-20 text-white" />
        </div>
        
        {/* Header Section */}
        <div className="mb-12 text-center">
          <h2 className="text-4xl font-bold mb-6 text-white">Create Account</h2>
          <p className="text-white/80 text-lg">Join CourseHub today</p>
        </div>
        
        {/* Error Message */}
        {error && (
          <div className="bg-red-500/20 border border-red-400 text-white px-6 py-4 rounded-xl mb-10 backdrop-blur-sm text-center">
            {error}
          </div>
        )}

        {/* Form Section */}
        <form onSubmit={handleSubmit} className="space-y-10">
          {/* Name Field */}
          <div className="space-y-6">
            <label className="block text-lg font-medium text-white text-center">Full Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full bg-white/10 border border-white/20 rounded-xl px-6 py-5 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/30 text-white placeholder-white/60 backdrop-blur-sm text-lg"
              placeholder="John Doe"
              required
            />
          </div>

          {/* Email Field */}
          <div className="space-y-6">
            <label className="block text-lg font-medium text-white text-center">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full bg-white/10 border border-white/20 rounded-xl px-6 py-5 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/30 text-white placeholder-white/60 backdrop-blur-sm text-lg"
              placeholder="your@email.com"
              required
            />
          </div>

          {/* Password Field */}
          <div className="space-y-6">
            <label className="block text-lg font-medium text-white text-center">Password</label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full bg-white/10 border border-white/20 rounded-xl px-6 py-5 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/30 text-white placeholder-white/60 backdrop-blur-sm text-lg"
              placeholder="••••••••"
              required
            />
          </div>

          {/* Confirm Password Field */}
          <div className="space-y-6">
            <label className="block text-lg font-medium text-white text-center">Confirm Password</label>
            <input
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              className="w-full bg-white/10 border border-white/20 rounded-xl px-6 py-5 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/30 text-white placeholder-white/60 backdrop-blur-sm text-lg"
              placeholder="••••••••"
              required
            />
          </div>

          {/* Register Button */}
          <div className="pt-8">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-white text-teal-600 py-6 rounded-xl hover:bg-gray-100 disabled:bg-gray-400 font-semibold text-xl transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </div>
        </form>

        {/* Footer Links */}
        <div className="mt-16 text-center space-y-8">
          <p className="text-lg text-white/80">
            Already have an account?{' '}
            <Link href="/login" className="text-white hover:text-gray-200 font-semibold transition-colors underline">
              Login here
            </Link>
          </p>
          
          <p>
            <Link href="/" className="text-lg text-white/70 hover:text-white transition-colors">
              ← Back to Home
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
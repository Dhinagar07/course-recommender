'use client';
import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { BookOpen } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await signIn('credentials', {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError('Invalid email or password');
      setLoading(false);
    } else {
      router.push('/dashboard');
      router.refresh();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-cyan-500 flex items-center justify-center p-8">
      <div className="bg-white/10 backdrop-blur-lg border border-white/20 p-12 rounded-3xl shadow-2xl w-full max-w-md">
        {/* Logo Section */}
        <div className="flex items-center justify-center mb-12">
          <BookOpen className="w-20 h-20 text-white" />
        </div>
        
        {/* Header Section */}
        <div className="mb-10 text-center">
          <h2 className="text-4xl font-bold mb-4 text-white">Welcome Back</h2>
          <p className="text-white/80 text-lg">Login to CourseHub</p>
        </div>
        
        {/* Error Message */}
        {error && (
          <div className="bg-red-500/20 border border-red-400 text-white px-6 py-4 rounded-xl mb-8 backdrop-blur-sm text-center">
            {error}
          </div>
        )}

        {/* Form Section */}
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Email Field */}
          <div className="space-y-2">
            <label className="block text-lg font-medium text-white text-center">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-white/10 border border-white/20 rounded-xl px-6 py-4 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/30 text-white placeholder-white/60 backdrop-blur-sm text-lg"
              placeholder="your@email.com"
              required
            />
          </div>

          {/* Password Field */}
          <div className="space-y-2">
            <label className="block text-lg font-medium text-white text-center">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-white/10 border border-white/20 rounded-xl px-6 py-4 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/30 text-white placeholder-white/60 backdrop-blur-sm text-lg"
              placeholder="••••••••"
              required
            />
          </div>

          {/* Login Button */}
          <div className="pt-6">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-white text-blue-600 py-5 rounded-xl hover:bg-gray-100 disabled:bg-gray-400 font-semibold text-xl transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </div>
        </form>

        {/* Footer Links */}
        <div className="mt-12 text-center space-y-6">
          <p className="text-lg text-white/80">
            Don't have an account?{' '}
            <Link href="/register" className="text-white hover:text-gray-200 font-semibold transition-colors underline">
              Register here
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

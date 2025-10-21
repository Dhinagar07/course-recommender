// lib/auth.js - For server components
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function auth() {
  return await getServerSession(authOptions);
} 
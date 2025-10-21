import { Inter } from 'next/font/google';
import './global.css';
import Providers from './providers';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'CourseHub - Discover Your Next Course',
  description: 'Find and subscribe to courses tailored to your interests',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
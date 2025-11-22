import UnsplashTest from '@/components/UnsplashTest';

/**
 * Test page to verify Unsplash image configuration
 * Visit /test-unsplash to check if images load correctly
 */
export default function TestUnsplashPage() {
  return <UnsplashTest />;
}

export const metadata = {
  title: 'Unsplash Configuration Test - UpCoach',
  description: 'Testing page to verify Unsplash images work with Next.js configuration',
  robots: {
    index: false,
    follow: false,
  },
};
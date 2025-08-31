import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

export default async function DashboardPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect('/');
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Welcome to Your Dashboard</h1>
        <p className="text-gray-600">
          This is a protected page. Only authenticated users can see this content.
        </p>
        <div className="mt-8 p-6 bg-white rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">User ID</h2>
          <p className="text-gray-700 font-mono">{userId}</p>
        </div>
      </div>
    </div>
  );
}

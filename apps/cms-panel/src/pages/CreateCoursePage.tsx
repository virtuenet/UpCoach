import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function CreateCoursePage() {
  const navigate = useNavigate();

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <button
          onClick={() => navigate('/courses')}
          className="flex items-center text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Courses
        </button>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-xl font-semibold text-gray-900 mb-4">Create New Course</h1>
        <p className="text-gray-500">Course builder functionality coming soon...</p>
      </div>
    </div>
  );
}

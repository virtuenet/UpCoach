import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Save, Plus, Trash2, GripVertical, BookOpen, Clock, Award } from 'lucide-react';
import { apiClient } from '../api/client';
import toast from 'react-hot-toast';

interface Lesson {
  id: string;
  title: string;
  description: string;
  duration: number;
  type: 'video' | 'text' | 'quiz' | 'assignment';
  order: number;
}

interface CourseFormData {
  title: string;
  description: string;
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  duration: number;
  objectives: string[];
  lessons: Lesson[];
  status: 'draft' | 'published';
}

const CATEGORIES = [
  'Personal Development',
  'Leadership',
  'Communication',
  'Productivity',
  'Health & Wellness',
  'Career Growth',
  'Relationships',
  'Financial Planning',
];

export default function CreateCoursePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState<CourseFormData>({
    title: '',
    description: '',
    category: '',
    difficulty: 'beginner',
    duration: 60,
    objectives: [''],
    lessons: [],
    status: 'draft',
  });

  const [newLesson, setNewLesson] = useState<Partial<Lesson>>({
    title: '',
    description: '',
    duration: 15,
    type: 'video',
  });

  const createCourseMutation = useMutation({
    mutationFn: async (data: CourseFormData) => {
      const response = await apiClient.post('/cms/courses', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      toast.success('Course created successfully!');
      navigate('/courses');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create course');
    },
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'duration' ? parseInt(value) || 0 : value,
    }));
  };

  const handleObjectiveChange = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      objectives: prev.objectives.map((obj, i) => (i === index ? value : obj)),
    }));
  };

  const addObjective = () => {
    setFormData(prev => ({
      ...prev,
      objectives: [...prev.objectives, ''],
    }));
  };

  const removeObjective = (index: number) => {
    setFormData(prev => ({
      ...prev,
      objectives: prev.objectives.filter((_, i) => i !== index),
    }));
  };

  const addLesson = () => {
    if (!newLesson.title) {
      toast.error('Please enter a lesson title');
      return;
    }

    const lesson: Lesson = {
      id: `lesson-${Date.now()}`,
      title: newLesson.title || '',
      description: newLesson.description || '',
      duration: newLesson.duration || 15,
      type: newLesson.type || 'video',
      order: formData.lessons.length + 1,
    };

    setFormData(prev => ({
      ...prev,
      lessons: [...prev.lessons, lesson],
    }));

    setNewLesson({
      title: '',
      description: '',
      duration: 15,
      type: 'video',
    });
  };

  const removeLesson = (id: string) => {
    setFormData(prev => ({
      ...prev,
      lessons: prev.lessons
        .filter(lesson => lesson.id !== id)
        .map((lesson, index) => ({ ...lesson, order: index + 1 })),
    }));
  };

  const handleSubmit = (e: React.FormEvent, publish: boolean = false) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      toast.error('Please enter a course title');
      return;
    }

    if (!formData.category) {
      toast.error('Please select a category');
      return;
    }

    const filteredObjectives = formData.objectives.filter(obj => obj.trim());

    createCourseMutation.mutate({
      ...formData,
      objectives: filteredObjectives,
      status: publish ? 'published' : 'draft',
    });
  };

  const getTotalDuration = () => {
    return formData.lessons.reduce((sum, lesson) => sum + lesson.duration, 0);
  };

  const getLessonTypeIcon = (type: Lesson['type']) => {
    switch (type) {
      case 'video':
        return '🎬';
      case 'text':
        return '📄';
      case 'quiz':
        return '❓';
      case 'assignment':
        return '📝';
      default:
        return '📚';
    }
  };

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

      <form onSubmit={e => handleSubmit(e, false)}>
        {/* Basic Information */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Course Information</h2>

          <div className="space-y-4">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                Course Title *
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-secondary-500 focus:border-secondary-500"
                placeholder="Enter course title"
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-secondary-500 focus:border-secondary-500"
                placeholder="Describe what students will learn"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                  Category *
                </label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-secondary-500 focus:border-secondary-500"
                >
                  <option value="">Select a category</option>
                  {CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="difficulty" className="block text-sm font-medium text-gray-700 mb-1">
                  Difficulty Level
                </label>
                <select
                  id="difficulty"
                  name="difficulty"
                  value={formData.difficulty}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-secondary-500 focus:border-secondary-500"
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Learning Objectives */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Learning Objectives</h2>
              <p className="text-sm text-gray-500">What will students achieve after completing this course?</p>
            </div>
            <button
              type="button"
              onClick={addObjective}
              className="flex items-center gap-1 text-secondary-600 hover:text-secondary-700"
            >
              <Plus className="h-4 w-4" />
              Add Objective
            </button>
          </div>

          <div className="space-y-3">
            {formData.objectives.map((objective, index) => (
              <div key={index} className="flex items-center gap-2">
                <Award className="h-4 w-4 text-gray-400 flex-shrink-0" />
                <input
                  type="text"
                  value={objective}
                  onChange={e => handleObjectiveChange(index, e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-secondary-500 focus:border-secondary-500"
                  placeholder={`Objective ${index + 1}`}
                />
                {formData.objectives.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeObjective(index)}
                    className="text-red-500 hover:text-red-700"
                    title="Remove objective"
                    aria-label="Remove objective"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Lessons */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Course Lessons</h2>
              <p className="text-sm text-gray-500">
                {formData.lessons.length} lessons - {getTotalDuration()} minutes total
              </p>
            </div>
          </div>

          {/* Existing Lessons */}
          {formData.lessons.length > 0 && (
            <div className="space-y-2 mb-4">
              {formData.lessons.map(lesson => (
                <div
                  key={lesson.id}
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg group"
                >
                  <GripVertical className="h-4 w-4 text-gray-400 cursor-move" />
                  <span className="text-xl">{getLessonTypeIcon(lesson.type)}</span>
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{lesson.title}</div>
                    <div className="text-sm text-gray-500">
                      {lesson.type.charAt(0).toUpperCase() + lesson.type.slice(1)} - {lesson.duration} min
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeLesson(lesson.id)}
                    className="text-red-500 hover:text-red-700 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Remove lesson"
                    aria-label="Remove lesson"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Add New Lesson */}
          <div className="border border-dashed border-gray-300 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Add New Lesson</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
              <input
                type="text"
                value={newLesson.title}
                onChange={e => setNewLesson(prev => ({ ...prev, title: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-secondary-500 focus:border-secondary-500"
                placeholder="Lesson title"
              />
              <div className="flex gap-2">
                <select
                  value={newLesson.type}
                  onChange={e => setNewLesson(prev => ({ ...prev, type: e.target.value as Lesson['type'] }))}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-secondary-500 focus:border-secondary-500"
                  title="Lesson type"
                  aria-label="Lesson type"
                >
                  <option value="video">Video</option>
                  <option value="text">Text</option>
                  <option value="quiz">Quiz</option>
                  <option value="assignment">Assignment</option>
                </select>
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4 text-gray-400" />
                  <input
                    type="number"
                    value={newLesson.duration}
                    onChange={e => setNewLesson(prev => ({ ...prev, duration: parseInt(e.target.value) || 0 }))}
                    className="w-16 px-2 py-2 border border-gray-300 rounded-lg focus:ring-secondary-500 focus:border-secondary-500"
                    min="1"
                    title="Duration in minutes"
                    aria-label="Duration in minutes"
                  />
                  <span className="text-sm text-gray-500">min</span>
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={addLesson}
              className="flex items-center gap-1 text-secondary-600 hover:text-secondary-700"
            >
              <Plus className="h-4 w-4" />
              Add Lesson
            </button>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <BookOpen className="h-4 w-4" />
            <span>{formData.lessons.length} lessons</span>
            <span className="mx-2">-</span>
            <Clock className="h-4 w-4" />
            <span>{getTotalDuration()} min total</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate('/courses')}
              className="px-4 py-2 text-gray-700 hover:text-gray-900"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createCourseMutation.isPending}
              className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              Save Draft
            </button>
            <button
              type="button"
              onClick={e => handleSubmit(e, true)}
              disabled={createCourseMutation.isPending}
              className="flex items-center gap-2 px-4 py-2 bg-secondary-600 text-white rounded-lg hover:bg-secondary-700 disabled:opacity-50"
            >
              Publish Course
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

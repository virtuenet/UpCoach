import React from 'react';
import { 
  FileText, 
  Eye, 
  TrendingUp, 
  Clock,
  CheckCircle,
  Archive,
  PenTool,
  Calendar
} from 'lucide-react';

interface StatCard {
  title: string;
  value: string | number;
  change: number;
  icon: React.ReactNode;
  color: string;
}

const ContentStats: React.FC = () => {
  const stats: StatCard[] = [
    {
      title: 'Total Content',
      value: '248',
      change: 12.5,
      icon: <FileText className="w-6 h-6" />,
      color: 'bg-blue-500'
    },
    {
      title: 'Published',
      value: '186',
      change: 8.3,
      icon: <CheckCircle className="w-6 h-6" />,
      color: 'bg-green-500'
    },
    {
      title: 'Draft',
      value: '42',
      change: -5.2,
      icon: <PenTool className="w-6 h-6" />,
      color: 'bg-yellow-500'
    },
    {
      title: 'Scheduled',
      value: '12',
      change: 25.0,
      icon: <Calendar className="w-6 h-6" />,
      color: 'bg-purple-500'
    },
    {
      title: 'Total Views',
      value: '45.2K',
      change: 18.7,
      icon: <Eye className="w-6 h-6" />,
      color: 'bg-indigo-500'
    },
    {
      title: 'Avg. Read Time',
      value: '4.8 min',
      change: 2.1,
      icon: <Clock className="w-6 h-6" />,
      color: 'bg-pink-500'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      {stats.map((stat, index) => (
        <div key={index} className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <div className={`${stat.color} text-white p-3 rounded-lg`}>
              {stat.icon}
            </div>
            <div className={`flex items-center gap-1 text-sm ${
              stat.change > 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              <TrendingUp className={`w-4 h-4 ${stat.change < 0 ? 'rotate-180' : ''}`} />
              {Math.abs(stat.change)}%
            </div>
          </div>
          <h3 className="text-gray-600 text-sm font-medium">{stat.title}</h3>
          <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
        </div>
      ))}
    </div>
  );
};

export default ContentStats;
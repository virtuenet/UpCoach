import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { 
  Home, 
  FileText, 
  BarChart3, 
  Settings, 
  Menu, 
  X, 
  LogOut,
  Users,
  Image,
  BookOpen
} from 'lucide-react'
import { useAuthStore } from '../stores/authStore'

interface SidebarLinkProps {
  to: string
  icon: React.ComponentType<any>
  children: React.ReactNode
  isActive?: boolean
}

const SidebarLink = ({ to, icon: Icon, children, isActive }: SidebarLinkProps) => (
  <Link
    to={to}
    className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors ${
      isActive
        ? 'bg-secondary-100 text-secondary-900'
        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
    }`}
  >
    <Icon
      className={`mr-3 flex-shrink-0 h-5 w-5 transition-colors ${
        isActive ? 'text-secondary-500' : 'text-gray-400 group-hover:text-gray-500'
      }`}
    />
    {children}
  </Link>
)

export default function Layout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()
  const { user, logout } = useAuthStore()

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'Content', href: '/content', icon: FileText },
    { name: 'Courses', href: '/courses', icon: BookOpen },
    { name: 'Media Library', href: '/media', icon: Image },
    { name: 'Analytics', href: '/analytics', icon: BarChart3 },
    { name: 'Settings', href: '/settings', icon: Settings },
  ]

  const handleLogout = () => {
    logout()
  }

  return (
    <div className="h-screen flex overflow-hidden bg-gray-100">
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 flex z-40 md:hidden ${sidebarOpen ? '' : 'hidden'}`}>
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
        <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white">
          <div className="absolute top-0 right-0 -mr-12 pt-2">
            <button
              className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-6 w-6 text-white" />
            </button>
          </div>
          <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
            <div className="flex-shrink-0 flex items-center px-4">
              <div className="flex items-center">
                <div className="h-8 w-8 bg-secondary-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">UC</span>
                </div>
                <span className="ml-2 text-lg font-semibold text-gray-900">UpCoach CMS</span>
              </div>
            </div>
            <nav className="mt-5 px-2 space-y-1">
              {navigation.map((item) => (
                <SidebarLink
                  key={item.name}
                  to={item.href}
                  icon={item.icon}
                  isActive={location.pathname === item.href || 
                           (item.href === '/dashboard' && location.pathname === '/')}
                >
                  {item.name}
                </SidebarLink>
              ))}
            </nav>
          </div>
          <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 bg-gray-300 rounded-full flex items-center justify-center">
                  <Users className="h-4 w-4 text-gray-600" />
                </div>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-700">{user?.name || 'User'}</p>
                <button
                  onClick={handleLogout}
                  className="text-xs text-gray-500 hover:text-gray-700 flex items-center"
                >
                  <LogOut className="h-3 w-3 mr-1" />
                  Sign out
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden md:flex md:flex-shrink-0">
        <div className="flex flex-col w-64">
          <div className="flex flex-col h-0 flex-1 border-r border-gray-200 bg-white">
            <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
              <div className="flex items-center flex-shrink-0 px-4">
                <div className="flex items-center">
                  <div className="h-8 w-8 bg-secondary-600 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-sm">UC</span>
                  </div>
                  <span className="ml-2 text-lg font-semibold text-gray-900">UpCoach CMS</span>
                </div>
              </div>
              <nav className="mt-5 flex-1 px-2 space-y-1">
                {navigation.map((item) => (
                  <SidebarLink
                    key={item.name}
                    to={item.href}
                    icon={item.icon}
                    isActive={location.pathname === item.href || 
                             (item.href === '/dashboard' && location.pathname === '/')}
                  >
                    {item.name}
                  </SidebarLink>
                ))}
              </nav>
            </div>
            <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
              <div className="flex items-center w-full">
                <div className="flex-shrink-0">
                  <div className="h-8 w-8 bg-gray-300 rounded-full flex items-center justify-center">
                    <Users className="h-4 w-4 text-gray-600" />
                  </div>
                </div>
                <div className="ml-3 flex-1">
                  <p className="text-sm font-medium text-gray-700">{user?.name || 'User'}</p>
                  <button
                    onClick={handleLogout}
                    className="text-xs text-gray-500 hover:text-gray-700 flex items-center"
                  >
                    <LogOut className="h-3 w-3 mr-1" />
                    Sign out
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-col w-0 flex-1 overflow-hidden">
        <div className="md:hidden pl-1 pt-1 sm:pl-3 sm:pt-3">
          <button
            className="ml-1 flex items-center justify-center h-12 w-12 rounded-md focus:outline-none focus:ring-2 focus:ring-inset focus:ring-secondary-500"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-6 w-6 text-gray-600" />
          </button>
        </div>
        <main className="flex-1 relative z-0 overflow-y-auto focus:outline-none">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
} 
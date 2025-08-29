import {
  LayoutDashboard,
  Users,
  MessageSquare,
  Target,
  CheckSquare,
  Heart,
  Settings,
  LogOut,
  DollarSign,
  TrendingUp,
  FileText,
  Calculator,
  Brain,
  Gift,
} from "lucide-react";
// import { SkipLink } from "../../shared/components/ui/SkipNavigation"; // Component not found

export default function Layout() {
  const navigate = useNavigate();
  const logout = useAuthStore((state) => state.logout);
  const user = useAuthStore((state) => state.user);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Users", href: "/users", icon: Users },
    { name: "CMS", href: "/cms", icon: FileText },
    { name: "Goals", href: "/goals", icon: Target },
    { name: "Tasks", href: "/tasks", icon: CheckSquare },
    { name: "Mood", href: "/moods", icon: Heart },
    { name: "Chat", href: "/chat", icon: MessageSquare },
    { name: "AI Analytics", href: "/ai-analytics", icon: Brain },
  ];

  const financialNav = [
    { name: "Financial Dashboard", href: "/financial", icon: DollarSign },
    { name: "Cost Tracking", href: "/financial/costs", icon: Calculator },
    {
      name: "Subscriptions",
      href: "/financial/subscriptions",
      icon: TrendingUp,
    },
    { name: "Reports", href: "/financial/reports", icon: FileText },
    { name: "Referrals", href: "/referrals", icon: Gift },
  ];

  const secondaryNav = [
    { name: "Settings", href: "/settings", icon: Settings },
  ];

  return (
    <>
      <SkipLink href="#main-content">Skip to main content</SkipLink>
      <SkipLink href="#navigation">Skip to navigation</SkipLink>
      <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 w-64 bg-white border-r border-gray-200 shadow-sm">
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="px-6 py-5 border-b border-gray-200 bg-white">
            <h2 className="text-2xl font-bold text-black">UpCoach Admin</h2>
          </div>

          {/* Navigation */}
          <nav id="navigation" className="flex-1 px-3 py-4 space-y-1 overflow-y-auto bg-white">
            {navigation.map((item) => (
              <NavLink
                key={item.name}
                to={item.href}
                className={({ isActive }) =>
                  `flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 relative ${
                    isActive
                      ? "bg-gray-100 text-black"
                      : "text-black hover:bg-gray-50 hover:text-black"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-600 rounded-r" />
                    )}
                    <item.icon
                      className={`w-5 h-5 mr-3 ${isActive ? "text-blue-600" : "text-gray-600"}`}
                    />
                    <span className={isActive ? "font-semibold" : ""}>
                      {item.name}
                    </span>
                  </>
                )}
              </NavLink>
            ))}

            {/* Financial Section */}
            <div className="pt-6 pb-2">
              <p className="px-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Financial
              </p>
            </div>
            {financialNav.map((item) => (
              <NavLink
                key={item.name}
                to={item.href}
                className={({ isActive }) =>
                  `flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 relative ${
                    isActive
                      ? "bg-gray-100 text-black"
                      : "text-black hover:bg-gray-50 hover:text-black"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-600 rounded-r" />
                    )}
                    <item.icon
                      className={`w-5 h-5 mr-3 ${isActive ? "text-blue-600" : "text-gray-600"}`}
                    />
                    <span className={isActive ? "font-semibold" : ""}>
                      {item.name}
                    </span>
                  </>
                )}
              </NavLink>
            ))}

            {/* Settings Section */}
            <div className="pt-6 pb-2">
              <p className="px-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                System
              </p>
            </div>
            {secondaryNav.map((item) => (
              <NavLink
                key={item.name}
                to={item.href}
                className={({ isActive }) =>
                  `flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 relative ${
                    isActive
                      ? "bg-gray-100 text-black"
                      : "text-black hover:bg-gray-50 hover:text-black"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-600 rounded-r" />
                    )}
                    <item.icon
                      className={`w-5 h-5 mr-3 ${isActive ? "text-blue-600" : "text-gray-600"}`}
                    />
                    <span className={isActive ? "font-semibold" : ""}>
                      {item.name}
                    </span>
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          {/* User section */}
          <div className="px-3 py-4 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center px-3 py-2">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-semibold text-sm">
                    {user?.fullName?.charAt(0).toUpperCase() || "A"}
                  </span>
                </div>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-black">
                  {user?.fullName || "Admin User"}
                </p>
                <p className="text-xs text-gray-600">
                  {user?.email || "admin@upcoach.app"}
                </p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center w-full px-3 py-2 mt-2 text-sm font-medium text-black rounded-lg hover:bg-gray-100 transition-colors duration-200"
            >
              <LogOut className="w-5 h-5 mr-3 text-gray-600" />
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Top bar */}
      <div className="fixed top-0 left-64 right-0 h-16 bg-white border-b border-gray-200 shadow-sm z-10">
        <div className="flex items-center justify-between h-full px-8">
          <div className="flex items-center flex-1">
            <div className="relative w-96">
              <input
                type="text"
                placeholder="Search..."
                className="w-full pl-10 pr-4 py-2 text-sm text-black bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <svg
                className="absolute top-1/2 transform -translate-y-1/2 left-3 w-5 h-5 text-gray-400 pointer-events-none"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <button className="p-2 text-gray-600 hover:text-black transition-colors">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                />
              </svg>
            </button>

            <div className="flex items-center space-x-3">
              <div className="text-right">
                <p className="text-sm font-medium text-black">
                  {user?.fullName || "John Doe"}
                </p>
                <p className="text-xs text-gray-600">{user?.role || "Admin"}</p>
              </div>
              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white font-semibold text-sm">
                  {user?.fullName?.charAt(0).toUpperCase() || "J"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="ml-64 pt-16">
        <main id="main-content" className="p-8" tabIndex={-1}>
          <Outlet />
        </main>
      </div>
    </div>
    </>
  );
}

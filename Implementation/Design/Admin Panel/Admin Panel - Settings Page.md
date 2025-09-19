<html><head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <script src="https://cdn.tailwindcss.com"></script>
    <script> window.FontAwesomeConfig = { autoReplaceSvg: 'nest'};</script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/js/all.min.js" crossorigin="anonymous" referrerpolicy="no-referrer"></script>
    
    <style>::-webkit-scrollbar { display: none;}</style>
    <script>tailwind.config = {
  "theme": {
    "extend": {
      "colors": {
        "primary": "#4A90E2",
        "secondary": "#7ED321",
        "danger": "#FF4C4C",
        "gray": {
          "50": "#F9FAFB",
          "100": "#F3F4F6",
          "200": "#E5E7EB",
          "300": "#D1D5DB",
          "400": "#9CA3AF",
          "500": "#6B7280",
          "600": "#4B5563",
          "700": "#374151",
          "800": "#1F2937",
          "900": "#111827"
        }
      },
      "fontFamily": {
        "sans": [
          "Inter",
          "sans-serif"
        ]
      }
    }
  }
};</script>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin=""><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@100;200;300;500;600;700;800;900&amp;display=swap"><style>
      body {
        font-family: 'Inter', sans-serif !important;
      }
      
      /* Preserve Font Awesome icons */
      .fa, .fas, .far, .fal, .fab {
        font-family: "Font Awesome 6 Free", "Font Awesome 6 Brands" !important;
      }
    </style><style>
  .highlighted-section {
    outline: 2px solid #3F20FB;
    background-color: rgba(63, 32, 251, 0.1);
  }

  .edit-button {
    position: absolute;
    z-index: 1000;
  }

  ::-webkit-scrollbar {
    display: none;
  }

  html, body {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
  </style></head>
<body class="bg-gray-50 font-sans">
    <div class="flex h-full">
        <!-- Sidebar -->
        <div id="sidebar" class="w-64 bg-white border-r border-gray-200 fixed h-full">
            <div class="p-4 flex items-center space-x-2 border-b border-gray-200">
                <div class="bg-primary rounded-md p-1.5 text-white">
                    <i class="fa-solid fa-graduation-cap"></i>
                </div>
                <span class="font-semibold text-gray-800 text-lg">UpCoach</span>
            </div>
            <div class="overflow-y-auto h-[calc(100vh-64px)]">
                <div class="px-4 py-6">
                    <div class="mb-2 px-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Main
                    </div>
                    <div class="space-y-1">
                        <span class="flex items-center px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-md cursor-pointer">
                            <i class="fa-solid fa-chart-line w-5 h-5 mr-2"></i>
                            <span>Dashboard</span>
                        </span>
                        <span class="flex items-center px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-md cursor-pointer">
                            <i class="fa-solid fa-users w-5 h-5 mr-2"></i>
                            <span>Users</span>
                        </span>
                        <span class="flex items-center px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-md cursor-pointer">
                            <i class="fa-solid fa-brain w-5 h-5 mr-2"></i>
                            <span>Coaching Plans</span>
                        </span>
                        <span class="flex items-center px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-md cursor-pointer">
                            <i class="fa-solid fa-flag w-5 h-5 mr-2"></i>
                            <span>Flags</span>
                            <span class="ml-auto bg-danger text-white text-xs px-1.5 py-0.5 rounded-full">4</span>
                        </span>
                    </div>
                </div>
                
                <div class="px-4 py-6 border-t border-gray-200">
                    <div class="mb-2 px-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Admin
                    </div>
                    <div class="space-y-1">
                        <span class="flex items-center px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-md cursor-pointer">
                            <i class="fa-solid fa-user-shield w-5 h-5 mr-2"></i>
                            <span>Roles</span>
                        </span>
                        <span class="flex items-center px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-md cursor-pointer">
                            <i class="fa-solid fa-chart-pie w-5 h-5 mr-2"></i>
                            <span>Analytics</span>
                        </span>
                        <span class="flex items-center px-3 py-2 text-sm font-medium text-primary bg-blue-50 rounded-md cursor-pointer">
                            <i class="fa-solid fa-gear w-5 h-5 mr-2"></i>
                            <span>Settings</span>
                        </span>
                    </div>
                </div>
            </div>
        </div>

        <!-- Main content -->
        <div class="ml-64 flex-1">
            <!-- Header -->
            <header id="header" class="bg-white border-b border-gray-200 py-4 px-6 flex items-center justify-between">
                <div>
                    <h1 class="text-2xl font-semibold text-gray-800">Settings</h1>
                    <p class="text-sm text-gray-500">Security &amp; compliance configuration</p>
                </div>
                <div class="flex items-center space-x-4">
                    <div class="relative">
                        <button class="flex items-center px-4 py-2 border border-gray-300 rounded-md bg-white text-gray-700 hover:bg-gray-50 text-sm">
                            <i class="fa-solid fa-download mr-2"></i>
                            <span>Export Settings</span>
                        </button>
                    </div>
                    <div class="relative">
                        <button class="flex items-center text-gray-600">
                            <i class="fa-regular fa-bell text-xl"></i>
                            <span class="absolute -top-1 -right-1 bg-danger text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">3</span>
                        </button>
                    </div>
                    <div class="h-8 w-px bg-gray-200"></div>
                    <div class="flex items-center">
                        <img src="https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-3.jpg" alt="Admin user" class="h-8 w-8 rounded-full mr-2">
                        <div>
                            <p class="text-sm font-medium text-gray-700">Alex Morgan</p>
                            <p class="text-xs text-gray-500">CoachOps Admin</p>
                        </div>
                    </div>
                </div>
            </header>

            <!-- Settings content -->
            <main id="settings-content" class="p-6">
                <!-- Settings navigation -->
                <div id="settings-navigation" class="mb-6 border-b border-gray-200">
                    <div class="flex space-x-6">
                        <button class="px-4 py-2 text-primary border-b-2 border-primary font-medium">Security &amp; Compliance</button>
                        <button class="px-4 py-2 text-gray-500 hover:text-gray-700">General</button>
                        <button class="px-4 py-2 text-gray-500 hover:text-gray-700">Notifications</button>
                        <button class="px-4 py-2 text-gray-500 hover:text-gray-700">Integrations</button>
                        <button class="px-4 py-2 text-gray-500 hover:text-gray-700">Billing</button>
                    </div>
                </div>

                <!-- GDPR Tools Section -->
                <div id="gdpr-tools" class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                    <div class="flex items-center justify-between mb-4">
                        <div>
                            <h2 class="text-xl font-semibold text-gray-800">GDPR Tools</h2>
                            <p class="text-sm text-gray-500 mt-1">Manage user data export and deletion requests</p>
                        </div>
                        <span class="px-3 py-1 bg-blue-100 text-primary text-sm rounded-full">GDPR Compliant</span>
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div class="border border-gray-200 rounded-lg p-5">
                            <div class="flex items-start mb-4">
                                <div class="bg-primary bg-opacity-10 p-2 rounded-md mr-3">
                                    <i class="fa-solid fa-file-export text-primary"></i>
                                </div>
                                <div>
                                    <h3 class="font-medium text-gray-800">Export User Data</h3>
                                    <p class="text-sm text-gray-500 mt-1">Generate a complete export of user data in compliance with GDPR Article 20</p>
                                </div>
                            </div>
                            <div class="mb-4">
                                <label class="block text-sm font-medium text-gray-700 mb-1">User Email</label>
                                <input type="email" placeholder="user@example.com" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent">
                            </div>
                            <div class="flex items-center justify-between">
                                <div class="flex items-center">
                                    <input type="checkbox" id="include-analytics" class="rounded border-gray-300 text-primary focus:ring-primary">
                                    <label for="include-analytics" class="ml-2 text-sm text-gray-600">Include analytics data</label>
                                </div>
                                <button class="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 text-sm font-medium">Export Data</button>
                            </div>
                        </div>

                        <div class="border border-gray-200 rounded-lg p-5">
                            <div class="flex items-start mb-4">
                                <div class="bg-danger bg-opacity-10 p-2 rounded-md mr-3">
                                    <i class="fa-solid fa-trash-alt text-danger"></i>
                                </div>
                                <div>
                                    <h3 class="font-medium text-gray-800">Delete User Data</h3>
                                    <p class="text-sm text-gray-500 mt-1">Permanently remove user data in compliance with GDPR Article 17</p>
                                </div>
                            </div>
                            <div class="mb-4">
                                <label class="block text-sm font-medium text-gray-700 mb-1">User Email</label>
                                <input type="email" placeholder="user@example.com" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-danger focus:border-transparent">
                            </div>
                            <div class="flex items-center justify-between">
                                <div class="flex items-center">
                                    <input type="checkbox" id="confirm-deletion" class="rounded border-gray-300 text-danger focus:ring-danger">
                                    <label for="confirm-deletion" class="ml-2 text-sm text-gray-600">I confirm this is irreversible</label>
                                </div>
                                <button class="px-4 py-2 bg-danger text-white rounded-md hover:bg-danger/90 text-sm font-medium">Delete Data</button>
                            </div>
                        </div>
                    </div>

                    <div id="recent-gdpr-requests" class="border-t border-gray-200 pt-5">
                        <h3 class="font-medium text-gray-800 mb-3">Recent GDPR Requests</h3>
                        <div class="overflow-x-auto">
                            <table class="min-w-full divide-y divide-gray-200">
                                <thead>
                                    <tr>
                                        <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Request ID</th>
                                        <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                                        <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                                        <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                        <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                        <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody class="bg-white divide-y divide-gray-200">
                                    <tr>
                                        <td class="px-3 py-2 whitespace-nowrap text-sm text-gray-900">#GD-2023-0042</td>
                                        <td class="px-3 py-2 whitespace-nowrap text-sm text-gray-900">sarah.johnson@example.com</td>
                                        <td class="px-3 py-2 whitespace-nowrap text-sm text-gray-900">Export</td>
                                        <td class="px-3 py-2 whitespace-nowrap">
                                            <span class="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">Completed</span>
                                        </td>
                                        <td class="px-3 py-2 whitespace-nowrap text-sm text-gray-900">2023-06-15</td>
                                        <td class="px-3 py-2 whitespace-nowrap text-sm">
                                            <button class="text-primary hover:text-primary-dark">View Details</button>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td class="px-3 py-2 whitespace-nowrap text-sm text-gray-900">#GD-2023-0041</td>
                                        <td class="px-3 py-2 whitespace-nowrap text-sm text-gray-900">james.smith@example.com</td>
                                        <td class="px-3 py-2 whitespace-nowrap text-sm text-gray-900">Delete</td>
                                        <td class="px-3 py-2 whitespace-nowrap">
                                            <span class="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">Processing</span>
                                        </td>
                                        <td class="px-3 py-2 whitespace-nowrap text-sm text-gray-900">2023-06-14</td>
                                        <td class="px-3 py-2 whitespace-nowrap text-sm">
                                            <button class="text-primary hover:text-primary-dark">View Details</button>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <!-- Token Management Section -->
                <div id="token-management" class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                    <h2 class="text-xl font-semibold text-gray-800 mb-4">Token Management</h2>
                    <p class="text-sm text-gray-500 mb-6">Configure authentication token policies and session management</p>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div>
                            <h3 class="font-medium text-gray-800 mb-3">Token Expiry Settings</h3>
                            <div class="space-y-4">
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-1">Access Token Lifetime</label>
                                    <div class="flex items-center">
                                        <input type="number" value="60" class="w-20 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent">
                                        <span class="ml-2 text-sm text-gray-600">minutes</span>
                                    </div>
                                    <p class="text-xs text-gray-500 mt-1">Default: 60 minutes</p>
                                </div>
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-1">Refresh Token Lifetime</label>
                                    <div class="flex items-center">
                                        <input type="number" value="14" class="w-20 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent">
                                        <span class="ml-2 text-sm text-gray-600">days</span>
                                    </div>
                                    <p class="text-xs text-gray-500 mt-1">Default: 14 days</p>
                                </div>
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-1">Inactivity Timeout</label>
                                    <div class="flex items-center">
                                        <input type="number" value="30" class="w-20 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent">
                                        <span class="ml-2 text-sm text-gray-600">minutes</span>
                                    </div>
                                    <p class="text-xs text-gray-500 mt-1">Auto-logout after inactivity</p>
                                </div>
                            </div>
                        </div>

                        <div>
                            <h3 class="font-medium text-gray-800 mb-3">Session Security</h3>
                            <div class="space-y-4">
                                <div class="flex items-center justify-between">
                                    <div>
                                        <p class="text-sm font-medium text-gray-700">Enforce Single Session</p>
                                        <p class="text-xs text-gray-500">Logout from other devices on new login</p>
                                    </div>
                                    <label class="relative inline-flex items-center cursor-pointer">
                                        <input type="checkbox" class="sr-only peer" checked="">
                                        <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/25 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                                    </label>
                                </div>
                                <div class="flex items-center justify-between">
                                    <div>
                                        <p class="text-sm font-medium text-gray-700">Require Re-authentication</p>
                                        <p class="text-xs text-gray-500">For sensitive operations</p>
                                    </div>
                                    <label class="relative inline-flex items-center cursor-pointer">
                                        <input type="checkbox" class="sr-only peer" checked="">
                                        <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/25 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                                    </label>
                                </div>
                                <div class="flex items-center justify-between">
                                    <div>
                                        <p class="text-sm font-medium text-gray-700">Remember Me Functionality</p>
                                        <p class="text-xs text-gray-500">Allow extended sessions</p>
                                    </div>
                                    <label class="relative inline-flex items-center cursor-pointer">
                                        <input type="checkbox" class="sr-only peer">
                                        <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/25 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                                    </label>
                                </div>
                            </div>
                            <button class="mt-4 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 text-sm font-medium">Save Changes</button>
                        </div>
                    </div>

                    <div id="logout-management" class="border-t border-gray-200 pt-5">
                        <h3 class="font-medium text-gray-800 mb-3">Forced Logout Management</h3>
                        <p class="text-sm text-gray-500 mb-4">Force logout for specific users or all users</p>
                        <div class="flex space-x-4">
                            <button class="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 text-sm font-medium flex items-center">
                                <i class="fa-solid fa-user-slash mr-2"></i>
                                <span>Logout Specific User</span>
                            </button>
                            <button class="px-4 py-2 border border-danger text-danger rounded-md hover:bg-danger/5 text-sm font-medium flex items-center">
                                <i class="fa-solid fa-users-slash mr-2"></i>
                                <span>Logout All Users</span>
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Login History Section -->
                <div id="login-history" class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                    <div class="flex items-center justify-between mb-4">
                        <div>
                            <h2 class="text-xl font-semibold text-gray-800">Login History &amp; Active Sessions</h2>
                            <p class="text-sm text-gray-500 mt-1">Monitor login activity and manage active user sessions</p>
                        </div>
                        <div>
                            <button class="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 text-sm font-medium flex items-center">
                                <i class="fa-solid fa-filter mr-2"></i>
                                <span>Filter</span>
                            </button>
                        </div>
                    </div>

                    <div class="mb-6">
                        <h3 class="font-medium text-gray-800 mb-3">Active Sessions (24)</h3>
                        <div class="overflow-x-auto">
                            <table class="min-w-full divide-y divide-gray-200">
                                <thead>
                                    <tr>
                                        <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                                        <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">IP Address</th>
                                        <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Device / Browser</th>
                                        <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                                        <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Login Time</th>
                                        <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody class="bg-white divide-y divide-gray-200">
                                    <tr>
                                        <td class="px-3 py-2 whitespace-nowrap">
                                            <div class="flex items-center">
                                                <img src="https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-2.jpg" alt="User" class="h-6 w-6 rounded-full mr-2">
                                                <span class="text-sm text-gray-900">john.doe@example.com</span>
                                            </div>
                                        </td>
                                        <td class="px-3 py-2 whitespace-nowrap text-sm text-gray-900">192.168.1.45</td>
                                        <td class="px-3 py-2 whitespace-nowrap text-sm text-gray-900">Chrome / macOS</td>
                                        <td class="px-3 py-2 whitespace-nowrap text-sm text-gray-900">San Francisco, US</td>
                                        <td class="px-3 py-2 whitespace-nowrap text-sm text-gray-900">Today, 10:24 AM</td>
                                        <td class="px-3 py-2 whitespace-nowrap text-sm">
                                            <button class="text-danger hover:text-danger-dark">Terminate</button>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td class="px-3 py-2 whitespace-nowrap">
                                            <div class="flex items-center">
                                                <img src="https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-5.jpg" alt="User" class="h-6 w-6 rounded-full mr-2">
                                                <span class="text-sm text-gray-900">emma.wilson@example.com</span>
                                            </div>
                                        </td>
                                        <td class="px-3 py-2 whitespace-nowrap text-sm text-gray-900">172.16.254.1</td>
                                        <td class="px-3 py-2 whitespace-nowrap text-sm text-gray-900">Safari / iOS</td>
                                        <td class="px-3 py-2 whitespace-nowrap text-sm text-gray-900">London, UK</td>
                                        <td class="px-3 py-2 whitespace-nowrap text-sm text-gray-900">Today, 09:15 AM</td>
                                        <td class="px-3 py-2 whitespace-nowrap text-sm">
                                            <button class="text-danger hover:text-danger-dark">Terminate</button>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td class="px-3 py-2 whitespace-nowrap">
                                            <div class="flex items-center">
                                                <img src="https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-3.jpg" alt="User" class="h-6 w-6 rounded-full mr-2">
                                                <span class="text-sm text-gray-900">alex.morgan@example.com</span>
                                                <span class="ml-2 px-2 py-0.5 text-xs bg-primary bg-opacity-10 text-primary rounded-full">You</span>
                                            </div>
                                        </td>
                                        <td class="px-3 py-2 whitespace-nowrap text-sm text-gray-900">10.0.0.1</td>
                                        <td class="px-3 py-2 whitespace-nowrap text-sm text-gray-900">Firefox / Windows</td>
                                        <td class="px-3 py-2 whitespace-nowrap text-sm text-gray-900">New York, US</td>
                                        <td class="px-3 py-2 whitespace-nowrap text-sm text-gray-900">Today, 08:42 AM</td>
                                        <td class="px-3 py-2 whitespace-nowrap text-sm">
                                            <span class="text-gray-400">Current</span>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                        <div class="mt-3 flex justify-end">
                            <button class="text-primary hover:text-primary-dark text-sm font-medium">View All Sessions</button>
                        </div>
                    </div>

                    <div id="recent-login-activity">
                        <h3 class="font-medium text-gray-800 mb-3">Recent Login Activity</h3>
                        <div class="overflow-x-auto">
                            <table class="min-w-full divide-y divide-gray-200">
                                <thead>
                                    <tr>
                                        <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                                        <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">IP Address</th>
                                        <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Device / Browser</th>
                                        <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                                        <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                        <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                                    </tr>
                                </thead>
                                <tbody class="bg-white divide-y divide-gray-200">
                                    <tr>
                                        <td class="px-3 py-2 whitespace-nowrap">
                                            <div class="flex items-center">
                                                <img src="https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-3.jpg" alt="User" class="h-6 w-6 rounded-full mr-2">
                                                <span class="text-sm text-gray-900">alex.morgan@example.com</span>
                                            </div>
                                        </td>
                                        <td class="px-3 py-2 whitespace-nowrap text-sm text-gray-900">10.0.0.1</td>
                                        <td class="px-3 py-2 whitespace-nowrap text-sm text-gray-900">Firefox / Windows</td>
                                        <td class="px-3 py-2 whitespace-nowrap text-sm text-gray-900">New York, US</td>
                                        <td class="px-3 py-2 whitespace-nowrap">
                                            <span class="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">Success</span>
                                        </td>
                                        <td class="px-3 py-2 whitespace-nowrap text-sm text-gray-900">Today, 08:42 AM</td>
                                    </tr>
                                    <tr>
                                        <td class="px-3 py-2 whitespace-nowrap">
                                            <div class="flex items-center">
                                                <img src="https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-6.jpg" alt="User" class="h-6 w-6 rounded-full mr-2">
                                                <span class="text-sm text-gray-900">michael.brown@example.com</span>
                                            </div>
                                        </td>
                                        <td class="px-3 py-2 whitespace-nowrap text-sm text-gray-900">192.168.2.1</td>
                                        <td class="px-3 py-2 whitespace-nowrap text-sm text-gray-900">Chrome / Android</td>
                                        <td class="px-3 py-2 whitespace-nowrap text-sm text-gray-900">Sydney, AU</td>
                                        <td class="px-3 py-2 whitespace-nowrap">
                                            <span class="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">Failed</span>
                                        </td>
                                        <td class="px-3 py-2 whitespace-nowrap text-sm text-gray-900">Today, 07:30 AM</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                        <div class="mt-3 flex justify-end">
                            <button class="text-primary hover:text-primary-dark text-sm font-medium">View Full History</button>
                        </div>
                    </div>
                </div>

                <!-- Audit Logging Section -->
                <div id="audit-logging" class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div class="flex items-center mb-4">
                        <div class="mr-3">
                            <div class="bg-gray-100 p-2 rounded-md">
                                <i class="fa-solid fa-shield-alt text-gray-500"></i>
                            </div>
                        </div>
                        <div>
                            <h2 class="text-xl font-semibold text-gray-800">Audit Logging System</h2>
                            <p class="text-sm text-gray-500 mt-1">Configure system-wide audit logging for sensitive actions</p>
                        </div>
                        <span class="ml-auto px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full">Coming Soon</span>
                    </div>

                    <div class="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
                        <div class="flex items-center">
                            <div class="mr-3">
                                <i class="fa-solid fa-info-circle text-primary"></i>
                            </div>
                            <p class="text-sm text-gray-700">Audit logging will be available in the next platform update. This feature will provide comprehensive logging of all security-relevant events.</p>
                        </div>
                    </div>

                    <div class="opacity-60 pointer-events-none">
                        <div class="space-y-4 mb-6">
                            <div class="flex items-center justify-between">
                                <div>
                                    <p class="text-sm font-medium text-gray-700">Enable Audit Logging</p>
                                    <p class="text-xs text-gray-500">Record all security-relevant events</p>
                                </div>
                                <label class="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" class="sr-only peer">
                                    <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/25 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                                </label>
                            </div>
                            <div class="flex items-center justify-between">
                                <div>
                                    <p class="text-sm font-medium text-gray-700">Log User Authentication</p>
                                    <p class="text-xs text-gray-500">Login attempts, successes, failures</p>
                                </div>
                                <label class="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" class="sr-only peer" checked="">
                                    <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/25 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                                </label>
                            </div>
                            <div class="flex items-center justify-between">
                                <div>
                                    <p class="text-sm font-medium text-gray-700">Log Data Access</p>
                                    <p class="text-xs text-gray-500">User data exports and deletions</p>
                                </div>
                                <label class="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" class="sr-only peer" checked="">
                                    <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/25 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                                </label>
                            </div>
                            <div class="flex items-center justify-between">
                                <div>
                                    <p class="text-sm font-medium text-gray-700">Log Admin Actions</p>
                                    <p class="text-xs text-gray-500">Configuration changes, role assignments</p>
                                </div>
                                <label class="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" class="sr-only peer" checked="">
                                    <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/25 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                                </label>
                            </div>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Log Retention Period</label>
                            <select class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent">
                                <option>30 days</option>
                                <option>90 days</option>
                                <option>180 days</option>
                                <option>1 year</option>
                                <option>Custom...</option>
                            </select>
                        </div>
                        <button class="mt-4 px-4 py-2 bg-gray-300 text-gray-600 rounded-md text-sm font-medium">Save Settings</button>
                    </div>

                    <div class="mt-6 text-center">
                        <button class="px-4 py-2 border border-primary text-primary rounded-md hover:bg-primary/5 text-sm font-medium">
                            Join Beta Program
                        </button>
                    </div>
                </div>
            </main>
        </div>
    </div>

</body></html>
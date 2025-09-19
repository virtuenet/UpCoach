<html><head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <script src="https://cdn.tailwindcss.com"></script>
    <script> window.FontAwesomeConfig = { autoReplaceSvg: 'nest'};</script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/js/all.min.js" crossorigin="anonymous" referrerpolicy="no-referrer"></script>
    <script src="https://code.highcharts.com/highcharts.js"></script>
    <script src="https://code.highcharts.com/modules/heatmap.js"></script>
    
    <style>::-webkit-scrollbar { display: none;}</style>
    <script>tailwind.config = {
  "theme": {
    "extend": {
      "colors": {
        "primary": "#4A90E2",
        "secondary": "#7ED321",
        "danger": "#FF4C4C",
        "warning": "#F5A623",
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
                        <span class="flex items-center px-3 py-2 text-sm font-medium text-primary bg-blue-50 rounded-md cursor-pointer">
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
                        <span class="flex items-center px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-md cursor-pointer">
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
                    <h1 class="text-2xl font-semibold text-gray-800">Escalation Flags</h1>
                    <p class="text-sm text-gray-500">Monitor and resolve user flags requiring attention</p>
                </div>
                <div class="flex items-center space-x-4">
                    <div class="relative">
                        <button class="flex items-center px-4 py-2 border border-gray-300 rounded-md bg-white text-gray-700 hover:bg-gray-50 text-sm">
                            <i class="fa-solid fa-filter mr-2"></i>
                            <span>All Flag Types</span>
                            <i class="fa-solid fa-chevron-down ml-2"></i>
                        </button>
                    </div>
                    <button class="flex items-center px-4 py-2 border border-gray-300 rounded-md bg-white text-gray-700 hover:bg-gray-50 text-sm">
                        <i class="fa-solid fa-file-csv mr-2"></i>
                        <span>Export CSV</span>
                    </button>
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

            <!-- Flags content -->
            <main id="flags-content" class="p-6">
                <!-- Quick stats -->
                <div id="flag-stats" class="grid grid-cols-4 gap-6 mb-6">
                    <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
                        <div class="flex items-center justify-between mb-2">
                            <h3 class="text-gray-500 text-sm font-medium">Total Flags</h3>
                            <span class="text-danger bg-red-50 p-1.5 rounded-md">
                                <i class="fa-solid fa-flag"></i>
                            </span>
                        </div>
                        <p class="text-3xl font-semibold text-gray-800">24</p>
                        <div class="flex items-center mt-2 text-sm">
                            <span class="text-danger flex items-center">
                                <i class="fa-solid fa-arrow-up mr-1"></i> 8.5%
                            </span>
                            <span class="text-gray-500 ml-2">from last week</span>
                        </div>
                    </div>
                    
                    <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
                        <div class="flex items-center justify-between mb-2">
                            <h3 class="text-gray-500 text-sm font-medium">Open Flags</h3>
                            <span class="text-warning bg-yellow-50 p-1.5 rounded-md">
                                <i class="fa-solid fa-exclamation-circle"></i>
                            </span>
                        </div>
                        <p class="text-3xl font-semibold text-gray-800">4</p>
                        <div class="flex items-center mt-2 text-sm">
                            <span class="text-danger flex items-center">
                                <i class="fa-solid fa-arrow-up mr-1"></i> 2
                            </span>
                            <span class="text-gray-500 ml-2">from yesterday</span>
                        </div>
                    </div>
                    
                    <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
                        <div class="flex items-center justify-between mb-2">
                            <h3 class="text-gray-500 text-sm font-medium">Resolved Today</h3>
                            <span class="text-secondary bg-green-50 p-1.5 rounded-md">
                                <i class="fa-solid fa-check-circle"></i>
                            </span>
                        </div>
                        <p class="text-3xl font-semibold text-gray-800">3</p>
                        <div class="flex items-center mt-2 text-sm">
                            <span class="text-secondary flex items-center">
                                <i class="fa-solid fa-arrow-up mr-1"></i> 2
                            </span>
                            <span class="text-gray-500 ml-2">from yesterday</span>
                        </div>
                    </div>
                    
                    <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
                        <div class="flex items-center justify-between mb-2">
                            <h3 class="text-gray-500 text-sm font-medium">Avg. Resolution Time</h3>
                            <span class="text-primary bg-blue-50 p-1.5 rounded-md">
                                <i class="fa-solid fa-clock"></i>
                            </span>
                        </div>
                        <p class="text-3xl font-semibold text-gray-800">2.4h</p>
                        <div class="flex items-center mt-2 text-sm">
                            <span class="text-secondary flex items-center">
                                <i class="fa-solid fa-arrow-down mr-1"></i> 15%
                            </span>
                            <span class="text-gray-500 ml-2">from last week</span>
                        </div>
                    </div>
                </div>
                
                <!-- Main content grid -->
                <div class="grid grid-cols-3 gap-6">
                    <!-- Flagged Users Table -->
                    <div id="flagged-users-table" class="col-span-2 bg-white rounded-lg shadow-sm border border-gray-200">
                        <div class="px-6 py-4 border-b border-gray-200">
                            <div class="flex items-center justify-between">
                                <h3 class="font-semibold text-gray-800">Flagged Users</h3>
                                <div class="flex space-x-2">
                                    <div class="relative">
                                        <input type="text" placeholder="Search users..." class="pl-8 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                                        <i class="fa-solid fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                                    </div>
                                    <button class="p-2 border border-gray-300 rounded-md bg-white text-gray-500 hover:bg-gray-50">
                                        <i class="fa-solid fa-filter"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div class="overflow-x-auto">
                            <table class="min-w-full divide-y divide-gray-200">
                                <thead class="bg-gray-50">
                                    <tr>
                                        <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                                        <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Flag Type</th>
                                        <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                                        <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                        <th scope="col" class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody class="bg-white divide-y divide-gray-200">
                                    <tr class="bg-red-50">
                                        <td class="px-6 py-4 whitespace-nowrap">
                                            <div class="flex items-center">
                                                <img class="h-10 w-10 rounded-full" src="https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-1.jpg" alt="User">
                                                <div class="ml-4">
                                                    <div class="text-sm font-medium text-gray-900">Sarah Johnson</div>
                                                    <div class="text-sm text-gray-500">sarah.j@example.com</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td class="px-6 py-4 whitespace-nowrap">
                                            <span class="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                                                Billing Issue
                                            </span>
                                        </td>
                                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            <div class="flex items-center">
                                                <i class="fa-regular fa-clock mr-1.5"></i>
                                                <span>35 minutes ago</span>
                                            </div>
                                        </td>
                                        <td class="px-6 py-4 whitespace-nowrap">
                                            <span class="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                                                <i class="fa-solid fa-circle text-xs mr-1"></i> Urgent
                                            </span>
                                        </td>
                                        <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div class="flex items-center justify-end space-x-2">
                                                <button class="p-1 rounded-md hover:bg-gray-100 text-gray-600">
                                                    <i class="fa-solid fa-eye"></i>
                                                </button>
                                                <button class="p-1 rounded-md hover:bg-gray-100 text-gray-600">
                                                    <i class="fa-solid fa-user-plus"></i>
                                                </button>
                                                <button class="p-1 rounded-md hover:bg-gray-100 text-gray-600">
                                                    <i class="fa-solid fa-ellipsis-vertical"></i>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td class="px-6 py-4 whitespace-nowrap">
                                            <div class="flex items-center">
                                                <img class="h-10 w-10 rounded-full" src="https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-2.jpg" alt="User">
                                                <div class="ml-4">
                                                    <div class="text-sm font-medium text-gray-900">Michael Chen</div>
                                                    <div class="text-sm text-gray-500">michael.c@example.com</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td class="px-6 py-4 whitespace-nowrap">
                                            <span class="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                                                Content Issue
                                            </span>
                                        </td>
                                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            <div class="flex items-center">
                                                <i class="fa-regular fa-clock mr-1.5"></i>
                                                <span>2 hours ago</span>
                                            </div>
                                        </td>
                                        <td class="px-6 py-4 whitespace-nowrap">
                                            <span class="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                                                <i class="fa-solid fa-circle text-xs mr-1"></i> Medium
                                            </span>
                                        </td>
                                        <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div class="flex items-center justify-end space-x-2">
                                                <button class="p-1 rounded-md hover:bg-gray-100 text-gray-600">
                                                    <i class="fa-solid fa-eye"></i>
                                                </button>
                                                <button class="p-1 rounded-md hover:bg-gray-100 text-gray-600">
                                                    <i class="fa-solid fa-user-plus"></i>
                                                </button>
                                                <button class="p-1 rounded-md hover:bg-gray-100 text-gray-600">
                                                    <i class="fa-solid fa-ellipsis-vertical"></i>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td class="px-6 py-4 whitespace-nowrap">
                                            <div class="flex items-center">
                                                <img class="h-10 w-10 rounded-full" src="https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-6.jpg" alt="User">
                                                <div class="ml-4">
                                                    <div class="text-sm font-medium text-gray-900">Emily Rodriguez</div>
                                                    <div class="text-sm text-gray-500">emily.r@example.com</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td class="px-6 py-4 whitespace-nowrap">
                                            <span class="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 text-purple-800">
                                                Technical Error
                                            </span>
                                        </td>
                                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            <div class="flex items-center">
                                                <i class="fa-regular fa-clock mr-1.5"></i>
                                                <span>4 hours ago</span>
                                            </div>
                                        </td>
                                        <td class="px-6 py-4 whitespace-nowrap">
                                            <span class="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                                                <i class="fa-solid fa-circle text-xs mr-1"></i> Medium
                                            </span>
                                        </td>
                                        <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div class="flex items-center justify-end space-x-2">
                                                <button class="p-1 rounded-md hover:bg-gray-100 text-gray-600">
                                                    <i class="fa-solid fa-eye"></i>
                                                </button>
                                                <button class="p-1 rounded-md hover:bg-gray-100 text-gray-600">
                                                    <i class="fa-solid fa-user-plus"></i>
                                                </button>
                                                <button class="p-1 rounded-md hover:bg-gray-100 text-gray-600">
                                                    <i class="fa-solid fa-ellipsis-vertical"></i>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td class="px-6 py-4 whitespace-nowrap">
                                            <div class="flex items-center">
                                                <img class="h-10 w-10 rounded-full" src="https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-4.jpg" alt="User">
                                                <div class="ml-4">
                                                    <div class="text-sm font-medium text-gray-900">James Wilson</div>
                                                    <div class="text-sm text-gray-500">james.w@example.com</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td class="px-6 py-4 whitespace-nowrap">
                                            <span class="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                                                Inactivity
                                            </span>
                                        </td>
                                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            <div class="flex items-center">
                                                <i class="fa-regular fa-clock mr-1.5"></i>
                                                <span>Yesterday</span>
                                            </div>
                                        </td>
                                        <td class="px-6 py-4 whitespace-nowrap">
                                            <span class="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                                                <i class="fa-solid fa-circle text-xs mr-1"></i> Low
                                            </span>
                                        </td>
                                        <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div class="flex items-center justify-end space-x-2">
                                                <button class="p-1 rounded-md hover:bg-gray-100 text-gray-600">
                                                    <i class="fa-solid fa-eye"></i>
                                                </button>
                                                <button class="p-1 rounded-md hover:bg-gray-100 text-gray-600">
                                                    <i class="fa-solid fa-user-plus"></i>
                                                </button>
                                                <button class="p-1 rounded-md hover:bg-gray-100 text-gray-600">
                                                    <i class="fa-solid fa-ellipsis-vertical"></i>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                        <div class="px-6 py-3 flex items-center justify-between border-t border-gray-200">
                            <div class="text-sm text-gray-500">
                                Showing 4 of 24 flags
                            </div>
                            <div class="flex space-x-2">
                                <button class="px-3 py-1 border border-gray-300 rounded-md bg-white text-gray-500 hover:bg-gray-50 text-sm">
                                    Previous
                                </button>
                                <button class="px-3 py-1 border border-primary rounded-md bg-primary text-white text-sm">
                                    1
                                </button>
                                <button class="px-3 py-1 border border-gray-300 rounded-md bg-white text-gray-500 hover:bg-gray-50 text-sm">
                                    2
                                </button>
                                <button class="px-3 py-1 border border-gray-300 rounded-md bg-white text-gray-500 hover:bg-gray-50 text-sm">
                                    3
                                </button>
                                <button class="px-3 py-1 border border-gray-300 rounded-md bg-white text-gray-500 hover:bg-gray-50 text-sm">
                                    Next
                                </button>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Right sidebar with Recent Activity -->
                    <div id="recent-activity" class="col-span-1">
                        <div class="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
                            <div class="px-6 py-4 border-b border-gray-200">
                                <h3 class="font-semibold text-gray-800">Recent Activity</h3>
                            </div>
                            <div class="p-4">
                                <div class="space-y-4">
                                    <div class="flex items-start">
                                        <div class="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center text-primary">
                                            <i class="fa-solid fa-check"></i>
                                        </div>
                                        <div class="ml-3">
                                            <p class="text-sm text-gray-800">
                                                <span class="font-medium">Support request</span> flag resolved by <span class="font-medium">Alex Morgan</span>
                                            </p>
                                            <p class="text-xs text-gray-500 mt-1">15 minutes ago</p>
                                        </div>
                                    </div>
                                    <div class="flex items-start">
                                        <div class="h-8 w-8 bg-red-100 rounded-full flex items-center justify-center text-danger">
                                            <i class="fa-solid fa-flag"></i>
                                        </div>
                                        <div class="ml-3">
                                            <p class="text-sm text-gray-800">
                                                <span class="font-medium">Billing issue</span> flag created for <span class="font-medium">Sarah Johnson</span>
                                            </p>
                                            <p class="text-xs text-gray-500 mt-1">35 minutes ago</p>
                                        </div>
                                    </div>
                                    <div class="flex items-start">
                                        <div class="h-8 w-8 bg-yellow-100 rounded-full flex items-center justify-center text-yellow-700">
                                            <i class="fa-solid fa-pencil"></i>
                                        </div>
                                        <div class="ml-3">
                                            <p class="text-sm text-gray-800">
                                                <span class="font-medium">Note added</span> to <span class="font-medium">Michael Chen</span>'s content issue flag
                                            </p>
                                            <p class="text-xs text-gray-500 mt-1">2 hours ago</p>
                                        </div>
                                    </div>
                                    <div class="flex items-start">
                                        <div class="h-8 w-8 bg-purple-100 rounded-full flex items-center justify-center text-purple-700">
                                            <i class="fa-solid fa-arrow-up-right-from-square"></i>
                                        </div>
                                        <div class="ml-3">
                                            <p class="text-sm text-gray-800">
                                                <span class="font-medium">Technical error</span> flag escalated for <span class="font-medium">Emily Rodriguez</span>
                                            </p>
                                            <p class="text-xs text-gray-500 mt-1">4 hours ago</p>
                                        </div>
                                    </div>
                                    <div class="flex items-start">
                                        <div class="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center text-green-700">
                                            <i class="fa-solid fa-check-double"></i>
                                        </div>
                                        <div class="ml-3">
                                            <p class="text-sm text-gray-800">
                                                <span class="font-medium">2 flags resolved</span> by <span class="font-medium">Lisa Taylor</span>
                                            </p>
                                            <p class="text-xs text-gray-500 mt-1">Yesterday</p>
                                        </div>
                                    </div>
                                </div>
                                <div class="mt-4 text-center">
                                    <button class="text-primary text-sm font-medium hover:underline">
                                        View all activity
                                    </button>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Action Buttons -->
                        <div id="action-buttons" class="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
                            <div class="px-6 py-4 border-b border-gray-200">
                                <h3 class="font-semibold text-gray-800">Actions</h3>
                            </div>
                            <div class="p-4">
                                <div class="space-y-3">
                                    <button class="w-full flex items-center justify-center px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90">
                                        <i class="fa-solid fa-arrow-up-right-from-square mr-2"></i>
                                        <span>Escalate Selected</span>
                                    </button>
                                    <button class="w-full flex items-center justify-center px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50">
                                        <i class="fa-solid fa-pencil mr-2"></i>
                                        <span>Add Note</span>
                                    </button>
                                    <button class="w-full flex items-center justify-center px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50">
                                        <i class="fa-solid fa-user-plus mr-2"></i>
                                        <span>Assign to Team Member</span>
                                    </button>
                                    <button class="w-full flex items-center justify-center px-4 py-2 bg-white border border-danger text-danger rounded-md hover:bg-red-50">
                                        <i class="fa-solid fa-times mr-2"></i>
                                        <span>Dismiss Selected</span>
                                    </button>
                                </div>
                                <div class="mt-4">
                                    <label class="flex items-center text-sm text-gray-700">
                                        <input type="checkbox" class="rounded border-gray-300 text-primary focus:ring-primary mr-2">
                                        <span>Enable real-time alerts</span>
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Flag Trends Heatmap -->
                <div id="flag-trends-heatmap" class="bg-white rounded-lg shadow-sm border border-gray-200 mt-6">
                    <div class="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                        <div>
                            <h3 class="font-semibold text-gray-800">Flag Trends Heatmap</h3>
                            <p class="text-sm text-gray-500">Distribution of flags by time and category</p>
                        </div>
                        <div class="flex space-x-2">
                            <button class="flex items-center px-3 py-1.5 border border-gray-300 rounded-md bg-white text-gray-700 hover:bg-gray-50 text-sm">
                                <span>This Week</span>
                                <i class="fa-solid fa-chevron-down ml-2"></i>
                            </button>
                            <button class="p-1.5 rounded-md hover:bg-gray-100 text-gray-600">
                                <i class="fa-solid fa-download"></i>
                            </button>
                        </div>
                    </div>
                    <div class="p-4">
                        <div id="flag-heatmap-chart" class="h-[300px]"></div>
                    </div>
                </div>
            </main>
        </div>
    </div>

    <script>
        // Flag Heatmap Chart
        Highcharts.chart('flag-heatmap-chart', {
            chart: {
                type: 'heatmap',
                style: {
                    fontFamily: 'Inter, sans-serif'
                }
            },
            title: {
                text: null
            },
            xAxis: {
                categories: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
                labels: {
                    style: {
                        color: '#6B7280'
                    }
                }
            },
            yAxis: {
                categories: ['Inactivity', 'Content Issue', 'Support Request', 'Technical Error', 'Billing Issue'],
                title: null,
                labels: {
                    style: {
                        color: '#6B7280'
                    }
                }
            },
            colorAxis: {
                min: 0,
                max: 10,
                stops: [
                    [0, '#FFFFFF'],
                    [0.1, '#FFEBE6'],
                    [0.5, '#FF9B82'],
                    [1, '#FF4C4C']
                ]
            },
            legend: {
                align: 'right',
                layout: 'vertical',
                verticalAlign: 'top',
                y: 25,
                symbolHeight: 280
            },
            tooltip: {
                formatter: function() {
                    return '<b>' + this.series.yAxis.categories[this.point.y] + '</b> on <b>' + 
                           this.series.xAxis.categories[this.point.x] + '</b>: <br>' +
                           this.point.value + ' flags';
                }
            },
            credits: {
                enabled: false
            },
            series: [{
                name: 'Flags',
                borderWidth: 1,
                data: [
                    [0, 0, 1], [0, 1, 2], [0, 2, 1], [0, 3, 3], [0, 4, 2],
                    [1, 0, 2], [1, 1, 3], [1, 2, 2], [1, 3, 1], [1, 4, 3],
                    [2, 0, 0], [2, 1, 1], [2, 2, 3], [2, 3, 4], [2, 4, 5],
                    [3, 0, 1], [3, 1, 2], [3, 2, 4], [3, 3, 3], [3, 4, 2],
                    [4, 0, 2], [4, 1, 1], [4, 2, 2], [4, 3, 3], [4, 4, 10],
                    [5, 0, 0], [5, 1, 0], [5, 2, 1], [5, 3, 0], [5, 4, 1],
                    [6, 0, 0], [6, 1, 0], [6, 2, 1], [6, 3, 0], [6, 4, 0]
                ],
                dataLabels: {
                    enabled: true,
                    color: '#000000'
                }
            }]
        });
    </script>

</body></html>
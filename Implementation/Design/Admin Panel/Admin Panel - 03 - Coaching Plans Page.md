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
                        <span class="flex items-center px-3 py-2 text-sm font-medium text-primary bg-blue-50 rounded-md cursor-pointer">
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
                    <h1 class="text-2xl font-semibold text-gray-800">Coaching Plans</h1>
                    <p class="text-sm text-gray-500">Manage and monitor all coaching plans</p>
                </div>
                <div class="flex items-center space-x-4">
                    <div class="relative">
                        <button class="flex items-center px-4 py-2 border border-gray-300 rounded-md bg-white text-gray-700 hover:bg-gray-50 text-sm">
                            <i class="fa-solid fa-filter mr-2"></i>
                            <span>All Plans</span>
                            <i class="fa-solid fa-chevron-down ml-2"></i>
                        </button>
                    </div>
                    <button class="flex items-center px-4 py-2 border border-gray-300 rounded-md bg-white text-gray-700 hover:bg-gray-50 text-sm">
                        <i class="fa-solid fa-file-export mr-2"></i>
                        <span>Export</span>
                    </button>
                    <button class="flex items-center px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 text-sm">
                        <i class="fa-solid fa-plus mr-2"></i>
                        <span>New Plan</span>
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

            <!-- Coaching Plans content -->
            <main id="coaching-plans-content" class="p-6">
                <!-- Filters -->
                <div id="coaching-plans-filters" class="bg-white rounded-lg shadow-sm border border-gray-200 p-5 mb-6">
                    <div class="flex flex-wrap items-center gap-4">
                        <div class="w-64">
                            <label class="block text-sm font-medium text-gray-700 mb-1">Cohort</label>
                            <select class="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary">
                                <option>All Cohorts</option>
                                <option>Q1 2023</option>
                                <option>Q2 2023</option>
                                <option>Q3 2023</option>
                                <option>Q4 2023</option>
                            </select>
                        </div>
                        <div class="w-64">
                            <label class="block text-sm font-medium text-gray-700 mb-1">Mood Trend</label>
                            <select class="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary">
                                <option>All Trends</option>
                                <option>Positive</option>
                                <option>Neutral</option>
                                <option>Negative</option>
                                <option>Fluctuating</option>
                            </select>
                        </div>
                        <div class="w-64">
                            <label class="block text-sm font-medium text-gray-700 mb-1">Goal Type</label>
                            <select class="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary">
                                <option>All Goals</option>
                                <option>Career Growth</option>
                                <option>Leadership</option>
                                <option>Technical Skills</option>
                                <option>Work-Life Balance</option>
                            </select>
                        </div>
                        <div class="w-64">
                            <label class="block text-sm font-medium text-gray-700 mb-1">Status</label>
                            <select class="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary">
                                <option>All Statuses</option>
                                <option>Active</option>
                                <option>Completed</option>
                                <option>On Hold</option>
                                <option>Cancelled</option>
                            </select>
                        </div>
                        <div class="ml-auto flex items-end gap-2">
                            <button class="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 text-sm">
                                Reset
                            </button>
                            <button class="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 text-sm">
                                Apply Filters
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Plans Table -->
                <div id="coaching-plans-table" class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                    <div class="flex items-center justify-between p-5 border-b border-gray-200">
                        <h2 class="font-semibold text-gray-800">Coaching Plans</h2>
                        <div class="flex items-center">
                            <div class="relative mr-4">
                                <input type="text" placeholder="Search plans..." class="w-64 border border-gray-300 rounded-md pl-9 pr-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary">
                                <i class="fa-solid fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                            </div>
                            <select class="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary">
                                <option>10 per page</option>
                                <option>25 per page</option>
                                <option>50 per page</option>
                                <option>100 per page</option>
                            </select>
                        </div>
                    </div>

                    <div class="overflow-x-auto">
                        <table class="w-full">
                            <thead>
                                <tr class="bg-gray-50 text-left">
                                    <th class="px-5 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">Plan Name</th>
                                    <th class="px-5 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                                    <th class="px-5 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">Avatar</th>
                                    <th class="px-5 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">Progress</th>
                                    <th class="px-5 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">Start Date</th>
                                    <th class="px-5 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">Assigned User</th>
                                    <th class="px-5 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-gray-200">
                                <tr class="hover:bg-gray-50">
                                    <td class="px-5 py-4">
                                        <div class="flex items-center">
                                            <div class="bg-primary/10 text-primary p-2 rounded-md mr-3">
                                                <i class="fa-solid fa-brain"></i>
                                            </div>
                                            <div>
                                                <div class="font-medium text-gray-800">Leadership Acceleration</div>
                                                <div class="text-xs text-gray-500">Executive Cohort</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td class="px-5 py-4">
                                        <span class="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">Active</span>
                                    </td>
                                    <td class="px-5 py-4">
                                        <img src="https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-1.jpg" alt="Coach Avatar" class="h-10 w-10 rounded-full">
                                    </td>
                                    <td class="px-5 py-4">
                                        <div class="flex items-center">
                                            <div class="w-full bg-gray-200 rounded-full h-2.5 mr-2">
                                                <div class="bg-secondary h-2.5 rounded-full" style="width: 78%"></div>
                                            </div>
                                            <span class="text-sm font-medium">78%</span>
                                        </div>
                                    </td>
                                    <td class="px-5 py-4 text-sm text-gray-700">Jan 15, 2023</td>
                                    <td class="px-5 py-4">
                                        <div class="flex items-center">
                                            <img src="https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-2.jpg" alt="User" class="h-6 w-6 rounded-full mr-2">
                                            <span class="text-sm text-gray-700">Michael Johnson</span>
                                        </div>
                                    </td>
                                    <td class="px-5 py-4">
                                        <div class="flex space-x-2">
                                            <button class="p-1.5 text-primary hover:bg-primary/10 rounded" title="View Plan">
                                                <i class="fa-solid fa-eye"></i>
                                            </button>
                                            <button class="p-1.5 text-gray-600 hover:bg-gray-100 rounded" title="Export Summary">
                                                <i class="fa-solid fa-file-export"></i>
                                            </button>
                                            <button class="p-1.5 text-gray-600 hover:bg-gray-100 rounded" title="Flag for Escalation">
                                                <i class="fa-solid fa-flag"></i>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                                <tr class="hover:bg-gray-50">
                                    <td class="px-5 py-4">
                                        <div class="flex items-center">
                                            <div class="bg-purple-100 text-purple-700 p-2 rounded-md mr-3">
                                                <i class="fa-solid fa-brain"></i>
                                            </div>
                                            <div>
                                                <div class="font-medium text-gray-800">Design Leadership</div>
                                                <div class="text-xs text-gray-500">Creative Directors</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td class="px-5 py-4">
                                        <span class="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">Active</span>
                                    </td>
                                    <td class="px-5 py-4">
                                        <img src="https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-5.jpg" alt="Coach Avatar" class="h-10 w-10 rounded-full">
                                    </td>
                                    <td class="px-5 py-4">
                                        <div class="flex items-center">
                                            <div class="w-full bg-gray-200 rounded-full h-2.5 mr-2">
                                                <div class="bg-secondary h-2.5 rounded-full" style="width: 65%"></div>
                                            </div>
                                            <span class="text-sm font-medium">65%</span>
                                        </div>
                                    </td>
                                    <td class="px-5 py-4 text-sm text-gray-700">Feb 02, 2023</td>
                                    <td class="px-5 py-4">
                                        <div class="flex items-center">
                                            <img src="https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-7.jpg" alt="User" class="h-6 w-6 rounded-full mr-2">
                                            <span class="text-sm text-gray-700">Sarah Williams</span>
                                        </div>
                                    </td>
                                    <td class="px-5 py-4">
                                        <div class="flex space-x-2">
                                            <button class="p-1.5 text-primary hover:bg-primary/10 rounded" title="View Plan">
                                                <i class="fa-solid fa-eye"></i>
                                            </button>
                                            <button class="p-1.5 text-gray-600 hover:bg-gray-100 rounded" title="Export Summary">
                                                <i class="fa-solid fa-file-export"></i>
                                            </button>
                                            <button class="p-1.5 text-gray-600 hover:bg-gray-100 rounded" title="Flag for Escalation">
                                                <i class="fa-solid fa-flag"></i>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                                <tr class="hover:bg-gray-50">
                                    <td class="px-5 py-4">
                                        <div class="flex items-center">
                                            <div class="bg-blue-100 text-blue-700 p-2 rounded-md mr-3">
                                                <i class="fa-solid fa-brain"></i>
                                            </div>
                                            <div>
                                                <div class="font-medium text-gray-800">Technical Mentorship</div>
                                                <div class="text-xs text-gray-500">Engineering</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td class="px-5 py-4">
                                        <span class="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">Active</span>
                                    </td>
                                    <td class="px-5 py-4">
                                        <img src="https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-3.jpg" alt="Coach Avatar" class="h-10 w-10 rounded-full">
                                    </td>
                                    <td class="px-5 py-4">
                                        <div class="flex items-center">
                                            <div class="w-full bg-gray-200 rounded-full h-2.5 mr-2">
                                                <div class="bg-secondary h-2.5 rounded-full" style="width: 92%"></div>
                                            </div>
                                            <span class="text-sm font-medium">92%</span>
                                        </div>
                                    </td>
                                    <td class="px-5 py-4 text-sm text-gray-700">Jan 10, 2023</td>
                                    <td class="px-5 py-4">
                                        <div class="flex items-center">
                                            <img src="https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-9.jpg" alt="User" class="h-6 w-6 rounded-full mr-2">
                                            <span class="text-sm text-gray-700">David Chen</span>
                                        </div>
                                    </td>
                                    <td class="px-5 py-4">
                                        <div class="flex space-x-2">
                                            <button class="p-1.5 text-primary hover:bg-primary/10 rounded" title="View Plan">
                                                <i class="fa-solid fa-eye"></i>
                                            </button>
                                            <button class="p-1.5 text-gray-600 hover:bg-gray-100 rounded" title="Export Summary">
                                                <i class="fa-solid fa-file-export"></i>
                                            </button>
                                            <button class="p-1.5 text-gray-600 hover:bg-gray-100 rounded" title="Flag for Escalation">
                                                <i class="fa-solid fa-flag"></i>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                                <tr class="hover:bg-gray-50">
                                    <td class="px-5 py-4">
                                        <div class="flex items-center">
                                            <div class="bg-orange-100 text-orange-700 p-2 rounded-md mr-3">
                                                <i class="fa-solid fa-brain"></i>
                                            </div>
                                            <div>
                                                <div class="font-medium text-gray-800">Product Management</div>
                                                <div class="text-xs text-gray-500">PM Cohort</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td class="px-5 py-4">
                                        <span class="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">Completed</span>
                                    </td>
                                    <td class="px-5 py-4">
                                        <img src="https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-8.jpg" alt="Coach Avatar" class="h-10 w-10 rounded-full">
                                    </td>
                                    <td class="px-5 py-4">
                                        <div class="flex items-center">
                                            <div class="w-full bg-gray-200 rounded-full h-2.5 mr-2">
                                                <div class="bg-primary h-2.5 rounded-full" style="width: 100%"></div>
                                            </div>
                                            <span class="text-sm font-medium">100%</span>
                                        </div>
                                    </td>
                                    <td class="px-5 py-4 text-sm text-gray-700">Nov 05, 2022</td>
                                    <td class="px-5 py-4">
                                        <div class="flex items-center">
                                            <img src="https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-4.jpg" alt="User" class="h-6 w-6 rounded-full mr-2">
                                            <span class="text-sm text-gray-700">Robert Taylor</span>
                                        </div>
                                    </td>
                                    <td class="px-5 py-4">
                                        <div class="flex space-x-2">
                                            <button class="p-1.5 text-primary hover:bg-primary/10 rounded" title="View Plan">
                                                <i class="fa-solid fa-eye"></i>
                                            </button>
                                            <button class="p-1.5 text-gray-600 hover:bg-gray-100 rounded" title="Export Summary">
                                                <i class="fa-solid fa-file-export"></i>
                                            </button>
                                            <button class="p-1.5 text-gray-600 hover:bg-gray-100 rounded" title="Flag for Escalation">
                                                <i class="fa-solid fa-flag"></i>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                                <tr class="hover:bg-gray-50">
                                    <td class="px-5 py-4">
                                        <div class="flex items-center">
                                            <div class="bg-pink-100 text-pink-700 p-2 rounded-md mr-3">
                                                <i class="fa-solid fa-brain"></i>
                                            </div>
                                            <div>
                                                <div class="font-medium text-gray-800">Work-Life Balance</div>
                                                <div class="text-xs text-gray-500">Wellness Program</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td class="px-5 py-4">
                                        <span class="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">Active</span>
                                    </td>
                                    <td class="px-5 py-4">
                                        <img src="https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-6.jpg" alt="Coach Avatar" class="h-10 w-10 rounded-full">
                                    </td>
                                    <td class="px-5 py-4">
                                        <div class="flex items-center">
                                            <div class="w-full bg-gray-200 rounded-full h-2.5 mr-2">
                                                <div class="bg-secondary h-2.5 rounded-full" style="width: 45%"></div>
                                            </div>
                                            <span class="text-sm font-medium">45%</span>
                                        </div>
                                    </td>
                                    <td class="px-5 py-4 text-sm text-gray-700">Mar 22, 2023</td>
                                    <td class="px-5 py-4">
                                        <div class="flex items-center">
                                            <img src="https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-1.jpg" alt="User" class="h-6 w-6 rounded-full mr-2">
                                            <span class="text-sm text-gray-700">Emma Wilson</span>
                                        </div>
                                    </td>
                                    <td class="px-5 py-4">
                                        <div class="flex space-x-2">
                                            <button class="p-1.5 text-primary hover:bg-primary/10 rounded" title="View Plan">
                                                <i class="fa-solid fa-eye"></i>
                                            </button>
                                            <button class="p-1.5 text-gray-600 hover:bg-gray-100 rounded" title="Export Summary">
                                                <i class="fa-solid fa-file-export"></i>
                                            </button>
                                            <button class="p-1.5 text-gray-600 hover:bg-gray-100 rounded" title="Flag for Escalation">
                                                <i class="fa-solid fa-flag"></i>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                                <tr class="hover:bg-gray-50">
                                    <td class="px-5 py-4">
                                        <div class="flex items-center">
                                            <div class="bg-green-100 text-green-700 p-2 rounded-md mr-3">
                                                <i class="fa-solid fa-brain"></i>
                                            </div>
                                            <div>
                                                <div class="font-medium text-gray-800">Sales Excellence</div>
                                                <div class="text-xs text-gray-500">Sales Team</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td class="px-5 py-4">
                                        <span class="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">Completed</span>
                                    </td>
                                    <td class="px-5 py-4">
                                        <img src="https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-4.jpg" alt="Coach Avatar" class="h-10 w-10 rounded-full">
                                    </td>
                                    <td class="px-5 py-4">
                                        <div class="flex items-center">
                                            <div class="w-full bg-gray-200 rounded-full h-2.5 mr-2">
                                                <div class="bg-primary h-2.5 rounded-full" style="width: 100%"></div>
                                            </div>
                                            <span class="text-sm font-medium">100%</span>
                                        </div>
                                    </td>
                                    <td class="px-5 py-4 text-sm text-gray-700">Dec 10, 2022</td>
                                    <td class="px-5 py-4">
                                        <div class="flex items-center">
                                            <img src="https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-8.jpg" alt="User" class="h-6 w-6 rounded-full mr-2">
                                            <span class="text-sm text-gray-700">James Peterson</span>
                                        </div>
                                    </td>
                                    <td class="px-5 py-4">
                                        <div class="flex space-x-2">
                                            <button class="p-1.5 text-primary hover:bg-primary/10 rounded" title="View Plan">
                                                <i class="fa-solid fa-eye"></i>
                                            </button>
                                            <button class="p-1.5 text-gray-600 hover:bg-gray-100 rounded" title="Export Summary">
                                                <i class="fa-solid fa-file-export"></i>
                                            </button>
                                            <button class="p-1.5 text-gray-600 hover:bg-gray-100 rounded" title="Flag for Escalation">
                                                <i class="fa-solid fa-flag"></i>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <div class="px-5 py-4 border-t border-gray-200 flex items-center justify-between">
                        <div class="text-sm text-gray-600">
                            Showing <span class="font-medium">1</span> to <span class="font-medium">6</span> of <span class="font-medium">42</span> plans
                        </div>
                        <div class="flex space-x-2">
                            <button class="px-3 py-1 border border-gray-300 rounded-md text-gray-500 bg-white hover:bg-gray-50 disabled:opacity-50" disabled="">
                                <i class="fa-solid fa-chevron-left"></i>
                            </button>
                            <button class="px-3 py-1 border border-gray-300 rounded-md text-white bg-primary hover:bg-primary/90">1</button>
                            <button class="px-3 py-1 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50">2</button>
                            <button class="px-3 py-1 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50">3</button>
                            <button class="px-3 py-1 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50">4</button>
                            <button class="px-3 py-1 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50">5</button>
                            <button class="px-3 py-1 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50">
                                <i class="fa-solid fa-chevron-right"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    </div>

</body></html>
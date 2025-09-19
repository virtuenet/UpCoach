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
                        <span class="flex items-center px-3 py-2 text-sm font-medium text-primary bg-blue-50 rounded-md cursor-pointer">
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
                    <h1 class="text-2xl font-semibold text-gray-800">Users</h1>
                    <p class="text-sm text-gray-500">Manage user accounts and permissions</p>
                </div>
                <div class="flex items-center space-x-4">
                    <button class="flex items-center px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 text-sm">
                        <i class="fa-solid fa-plus mr-2"></i>
                        <span>Add New User</span>
                    </button>
                    <button class="flex items-center px-4 py-2 border border-gray-300 rounded-md bg-white text-gray-700 hover:bg-gray-50 text-sm">
                        <i class="fa-solid fa-file-export mr-2"></i>
                        <span>Export Users</span>
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

            <!-- Users content -->
            <main id="users-content" class="p-6">
                <!-- Filters and search -->
                <div id="users-filters" class="bg-white rounded-lg shadow-sm border border-gray-200 p-5 mb-6">
                    <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div class="flex items-center space-x-4">
                            <div class="relative">
                                <input type="text" placeholder="Search users..." class="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-primary w-64">
                                <i class="fa-solid fa-search absolute left-3 top-2.5 text-gray-400"></i>
                            </div>
                            <div class="flex items-center space-x-2">
                                <button class="flex items-center px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-700 hover:bg-gray-50 text-sm">
                                    <span>All Users</span>
                                    <i class="fa-solid fa-chevron-down ml-2"></i>
                                </button>
                            </div>
                        </div>
                        
                        <div class="flex flex-wrap items-center gap-3">
                            <span class="text-sm text-gray-500">Filter by:</span>
                            
                            <div class="relative">
                                <select class="appearance-none bg-white border border-gray-300 rounded-md px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                                    <option>Plan Type</option>
                                    <option>Free</option>
                                    <option>Pro</option>
                                    <option>Team</option>
                                </select>
                                <i class="fa-solid fa-chevron-down absolute right-3 top-2.5 text-gray-400 pointer-events-none"></i>
                            </div>
                            
                            <div class="relative">
                                <select class="appearance-none bg-white border border-gray-300 rounded-md px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                                    <option>Flag Status</option>
                                    <option>Flagged</option>
                                    <option>Not Flagged</option>
                                </select>
                                <i class="fa-solid fa-chevron-down absolute right-3 top-2.5 text-gray-400 pointer-events-none"></i>
                            </div>
                            
                            <div class="relative">
                                <select class="appearance-none bg-white border border-gray-300 rounded-md px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                                    <option>Last Active</option>
                                    <option>Today</option>
                                    <option>This Week</option>
                                    <option>This Month</option>
                                    <option>Inactive</option>
                                </select>
                                <i class="fa-solid fa-chevron-down absolute right-3 top-2.5 text-gray-400 pointer-events-none"></i>
                            </div>
                            
                            <button class="bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-md px-3 py-2 text-sm">
                                <i class="fa-solid fa-rotate-left mr-1"></i> Reset
                            </button>
                        </div>
                    </div>
                </div>
                
                <!-- Users table -->
                <div id="users-table" class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                    <div class="overflow-x-auto">
                        <table class="min-w-full divide-y divide-gray-200">
                            <thead class="bg-gray-50">
                                <tr>
                                    <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        <div class="flex items-center">
                                            Name
                                            <i class="fa-solid fa-sort ml-1"></i>
                                        </div>
                                    </th>
                                    <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        <div class="flex items-center">
                                            Email
                                            <i class="fa-solid fa-sort ml-1"></i>
                                        </div>
                                    </th>
                                    <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        <div class="flex items-center">
                                            Role
                                            <i class="fa-solid fa-sort ml-1"></i>
                                        </div>
                                    </th>
                                    <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        <div class="flex items-center">
                                            Subscription Plan
                                            <i class="fa-solid fa-sort ml-1"></i>
                                        </div>
                                    </th>
                                    <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        <div class="flex items-center">
                                            Last Login
                                            <i class="fa-solid fa-sort ml-1"></i>
                                        </div>
                                    </th>
                                    <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        <div class="flex items-center">
                                            Flag Status
                                            <i class="fa-solid fa-sort ml-1"></i>
                                        </div>
                                    </th>
                                    <th scope="col" class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody class="bg-white divide-y divide-gray-200">
                                <!-- User Row 1 -->
                                <tr id="user-row-1">
                                    <td class="px-6 py-4 whitespace-nowrap">
                                        <div class="flex items-center">
                                            <img class="h-10 w-10 rounded-full" src="https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-1.jpg" alt="User">
                                            <div class="ml-4">
                                                <div class="text-sm font-medium text-gray-900">Emma Johnson</div>
                                                <div class="text-sm text-gray-500">ID: 1001</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td class="px-6 py-4 whitespace-nowrap">
                                        <div class="text-sm text-gray-900">emma@example.com</div>
                                    </td>
                                    <td class="px-6 py-4 whitespace-nowrap">
                                        <div class="relative inline-block text-left">
                                            <button class="bg-blue-50 text-primary rounded-full px-3 py-1 text-xs font-medium flex items-center">
                                                Admin
                                                <i class="fa-solid fa-chevron-down ml-1 text-xs"></i>
                                            </button>
                                        </div>
                                    </td>
                                    <td class="px-6 py-4 whitespace-nowrap">
                                        <span class="px-3 py-1 inline-flex text-xs leading-5 font-medium rounded-full bg-purple-100 text-purple-800">
                                            Team
                                        </span>
                                    </td>
                                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        <div class="flex items-center">
                                            <i class="fa-regular fa-clock mr-1.5 text-gray-400"></i>
                                            2 hours ago
                                        </div>
                                    </td>
                                    <td class="px-6 py-4 whitespace-nowrap">
                                        <span class="px-3 py-1 inline-flex text-xs leading-5 font-medium rounded-full bg-green-100 text-green-800">
                                            <i class="fa-solid fa-check mr-1"></i>
                                            Clear
                                        </span>
                                    </td>
                                    <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <div class="flex justify-end items-center space-x-2">
                                            <button class="text-primary hover:text-primary/80">
                                                <i class="fa-solid fa-eye"></i>
                                            </button>
                                            <button class="text-gray-600 hover:text-gray-900">
                                                <i class="fa-solid fa-key"></i>
                                            </button>
                                            <button class="text-gray-600 hover:text-gray-900">
                                                <i class="fa-solid fa-ellipsis-vertical"></i>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                                
                                <!-- User Row 2 -->
                                <tr id="user-row-2">
                                    <td class="px-6 py-4 whitespace-nowrap">
                                        <div class="flex items-center">
                                            <img class="h-10 w-10 rounded-full" src="https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-2.jpg" alt="User">
                                            <div class="ml-4">
                                                <div class="text-sm font-medium text-gray-900">Michael Smith</div>
                                                <div class="text-sm text-gray-500">ID: 1002</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td class="px-6 py-4 whitespace-nowrap">
                                        <div class="text-sm text-gray-900">michael@example.com</div>
                                    </td>
                                    <td class="px-6 py-4 whitespace-nowrap">
                                        <div class="relative inline-block text-left">
                                            <button class="bg-gray-100 text-gray-700 rounded-full px-3 py-1 text-xs font-medium flex items-center">
                                                User
                                                <i class="fa-solid fa-chevron-down ml-1 text-xs"></i>
                                            </button>
                                        </div>
                                    </td>
                                    <td class="px-6 py-4 whitespace-nowrap">
                                        <span class="px-3 py-1 inline-flex text-xs leading-5 font-medium rounded-full bg-blue-100 text-blue-800">
                                            Pro
                                        </span>
                                    </td>
                                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        <div class="flex items-center">
                                            <i class="fa-regular fa-clock mr-1.5 text-gray-400"></i>
                                            Yesterday
                                        </div>
                                    </td>
                                    <td class="px-6 py-4 whitespace-nowrap">
                                        <span class="px-3 py-1 inline-flex text-xs leading-5 font-medium rounded-full bg-green-100 text-green-800">
                                            <i class="fa-solid fa-check mr-1"></i>
                                            Clear
                                        </span>
                                    </td>
                                    <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <div class="flex justify-end items-center space-x-2">
                                            <button class="text-primary hover:text-primary/80">
                                                <i class="fa-solid fa-eye"></i>
                                            </button>
                                            <button class="text-gray-600 hover:text-gray-900">
                                                <i class="fa-solid fa-key"></i>
                                            </button>
                                            <button class="text-gray-600 hover:text-gray-900">
                                                <i class="fa-solid fa-ellipsis-vertical"></i>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                                
                                <!-- User Row 3 -->
                                <tr id="user-row-3">
                                    <td class="px-6 py-4 whitespace-nowrap">
                                        <div class="flex items-center">
                                            <img class="h-10 w-10 rounded-full" src="https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-5.jpg" alt="User">
                                            <div class="ml-4">
                                                <div class="text-sm font-medium text-gray-900">Sophia Chen</div>
                                                <div class="text-sm text-gray-500">ID: 1003</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td class="px-6 py-4 whitespace-nowrap">
                                        <div class="text-sm text-gray-900">sophia@example.com</div>
                                    </td>
                                    <td class="px-6 py-4 whitespace-nowrap">
                                        <div class="relative inline-block text-left">
                                            <button class="bg-gray-100 text-gray-700 rounded-full px-3 py-1 text-xs font-medium flex items-center">
                                                User
                                                <i class="fa-solid fa-chevron-down ml-1 text-xs"></i>
                                            </button>
                                        </div>
                                    </td>
                                    <td class="px-6 py-4 whitespace-nowrap">
                                        <span class="px-3 py-1 inline-flex text-xs leading-5 font-medium rounded-full bg-purple-100 text-purple-800">
                                            Team
                                        </span>
                                    </td>
                                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        <div class="flex items-center">
                                            <i class="fa-regular fa-clock mr-1.5 text-gray-400"></i>
                                            3 days ago
                                        </div>
                                    </td>
                                    <td class="px-6 py-4 whitespace-nowrap">
                                        <span class="px-3 py-1 inline-flex text-xs leading-5 font-medium rounded-full bg-danger text-white">
                                            <i class="fa-solid fa-flag mr-1"></i>
                                            Flagged
                                        </span>
                                    </td>
                                    <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <div class="flex justify-end items-center space-x-2">
                                            <button class="text-primary hover:text-primary/80">
                                                <i class="fa-solid fa-eye"></i>
                                            </button>
                                            <button class="text-gray-600 hover:text-gray-900">
                                                <i class="fa-solid fa-key"></i>
                                            </button>
                                            <button class="text-gray-600 hover:text-gray-900">
                                                <i class="fa-solid fa-ellipsis-vertical"></i>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                                
                                <!-- User Row 4 -->
                                <tr id="user-row-4">
                                    <td class="px-6 py-4 whitespace-nowrap">
                                        <div class="flex items-center">
                                            <img class="h-10 w-10 rounded-full" src="https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-4.jpg" alt="User">
                                            <div class="ml-4">
                                                <div class="text-sm font-medium text-gray-900">James Wilson</div>
                                                <div class="text-sm text-gray-500">ID: 1004</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td class="px-6 py-4 whitespace-nowrap">
                                        <div class="text-sm text-gray-900">james@example.com</div>
                                    </td>
                                    <td class="px-6 py-4 whitespace-nowrap">
                                        <div class="relative inline-block text-left">
                                            <button class="bg-yellow-50 text-yellow-700 rounded-full px-3 py-1 text-xs font-medium flex items-center">
                                                Moderator
                                                <i class="fa-solid fa-chevron-down ml-1 text-xs"></i>
                                            </button>
                                        </div>
                                    </td>
                                    <td class="px-6 py-4 whitespace-nowrap">
                                        <span class="px-3 py-1 inline-flex text-xs leading-5 font-medium rounded-full bg-gray-100 text-gray-800">
                                            Free
                                        </span>
                                    </td>
                                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        <div class="flex items-center">
                                            <i class="fa-regular fa-clock mr-1.5 text-gray-400"></i>
                                            1 week ago
                                        </div>
                                    </td>
                                    <td class="px-6 py-4 whitespace-nowrap">
                                        <span class="px-3 py-1 inline-flex text-xs leading-5 font-medium rounded-full bg-yellow-100 text-yellow-800">
                                            <i class="fa-solid fa-clock mr-1"></i>
                                            Inactive
                                        </span>
                                    </td>
                                    <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <div class="flex justify-end items-center space-x-2">
                                            <button class="text-primary hover:text-primary/80">
                                                <i class="fa-solid fa-eye"></i>
                                            </button>
                                            <button class="text-gray-600 hover:text-gray-900">
                                                <i class="fa-solid fa-key"></i>
                                            </button>
                                            <button class="text-gray-600 hover:text-gray-900">
                                                <i class="fa-solid fa-ellipsis-vertical"></i>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                                
                                <!-- User Row 5 -->
                                <tr id="user-row-5">
                                    <td class="px-6 py-4 whitespace-nowrap">
                                        <div class="flex items-center">
                                            <img class="h-10 w-10 rounded-full" src="https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-6.jpg" alt="User">
                                            <div class="ml-4">
                                                <div class="text-sm font-medium text-gray-900">Olivia Garcia</div>
                                                <div class="text-sm text-gray-500">ID: 1005</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td class="px-6 py-4 whitespace-nowrap">
                                        <div class="text-sm text-gray-900">olivia@example.com</div>
                                    </td>
                                    <td class="px-6 py-4 whitespace-nowrap">
                                        <div class="relative inline-block text-left">
                                            <button class="bg-gray-100 text-gray-700 rounded-full px-3 py-1 text-xs font-medium flex items-center">
                                                User
                                                <i class="fa-solid fa-chevron-down ml-1 text-xs"></i>
                                            </button>
                                        </div>
                                    </td>
                                    <td class="px-6 py-4 whitespace-nowrap">
                                        <span class="px-3 py-1 inline-flex text-xs leading-5 font-medium rounded-full bg-blue-100 text-blue-800">
                                            Pro
                                        </span>
                                    </td>
                                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        <div class="flex items-center">
                                            <i class="fa-regular fa-clock mr-1.5 text-gray-400"></i>
                                            5 hours ago
                                        </div>
                                    </td>
                                    <td class="px-6 py-4 whitespace-nowrap">
                                        <span class="px-3 py-1 inline-flex text-xs leading-5 font-medium rounded-full bg-green-100 text-green-800">
                                            <i class="fa-solid fa-check mr-1"></i>
                                            Clear
                                        </span>
                                    </td>
                                    <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <div class="flex justify-end items-center space-x-2">
                                            <button class="text-primary hover:text-primary/80">
                                                <i class="fa-solid fa-eye"></i>
                                            </button>
                                            <button class="text-gray-600 hover:text-gray-900">
                                                <i class="fa-solid fa-key"></i>
                                            </button>
                                            <button class="text-gray-600 hover:text-gray-900">
                                                <i class="fa-solid fa-ellipsis-vertical"></i>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    
                    <!-- Pagination -->
                    <div id="users-pagination" class="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                        <div class="text-sm text-gray-500">
                            Showing <span class="font-medium">1</span> to <span class="font-medium">5</span> of <span class="font-medium">42</span> results
                        </div>
                        <div class="flex space-x-2">
                            <button class="px-3 py-1 border border-gray-300 rounded-md text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed" disabled="">
                                <i class="fa-solid fa-chevron-left"></i>
                            </button>
                            <button class="px-3 py-1 border border-gray-300 bg-primary text-white rounded-md">1</button>
                            <button class="px-3 py-1 border border-gray-300 rounded-md text-gray-500 hover:bg-gray-50">2</button>
                            <button class="px-3 py-1 border border-gray-300 rounded-md text-gray-500 hover:bg-gray-50">3</button>
                            <button class="px-3 py-1 border border-gray-300 rounded-md text-gray-500 hover:bg-gray-50">4</button>
                            <button class="px-3 py-1 border border-gray-300 rounded-md text-gray-500 hover:bg-gray-50">5</button>
                            <button class="px-3 py-1 border border-gray-300 rounded-md text-gray-500 hover:bg-gray-50">
                                <i class="fa-solid fa-chevron-right"></i>
                            </button>
                        </div>
                    </div>
                </div>
                
                <!-- Bulk Actions -->
                <div id="bulk-actions" class="mt-6 bg-white rounded-lg shadow-sm border border-gray-200 p-5">
                    <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div>
                            <h3 class="text-lg font-medium text-gray-800">Bulk Actions</h3>
                            <p class="text-sm text-gray-500">Perform actions on multiple users at once</p>
                        </div>
                        <div class="flex flex-wrap gap-3">
                            <button class="flex items-center px-4 py-2 border border-gray-300 rounded-md bg-white text-gray-700 hover:bg-gray-50 text-sm">
                                <i class="fa-solid fa-envelope mr-2"></i>
                                <span>Email Selected</span>
                            </button>
                            <button class="flex items-center px-4 py-2 border border-gray-300 rounded-md bg-white text-gray-700 hover:bg-gray-50 text-sm">
                                <i class="fa-solid fa-user-tag mr-2"></i>
                                <span>Change Role</span>
                            </button>
                            <button class="flex items-center px-4 py-2 border border-gray-300 rounded-md bg-white text-gray-700 hover:bg-gray-50 text-sm">
                                <i class="fa-solid fa-file-export mr-2"></i>
                                <span>Export Selected</span>
                            </button>
                            <button class="flex items-center px-4 py-2 bg-danger text-white rounded-md hover:bg-danger/90 text-sm">
                                <i class="fa-solid fa-trash mr-2"></i>
                                <span>Delete Selected</span>
                            </button>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    </div>

</body></html>
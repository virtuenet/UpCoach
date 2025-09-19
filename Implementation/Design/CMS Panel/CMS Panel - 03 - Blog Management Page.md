<html><head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <script src="https://cdn.tailwindcss.com"></script>
    <script> window.FontAwesomeConfig = { autoReplaceSvg: 'nest'};</script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/js/all.min.js" crossorigin="anonymous" referrerpolicy="no-referrer"></script>
    <style>::-webkit-scrollbar { display: none;}</style>
    
    <link href="https://cdn.jsdelivr.net/npm/easymde/dist/easymde.min.css" rel="stylesheet">
    <script src="https://cdn.jsdelivr.net/npm/easymde/dist/easymde.min.js"></script>
    <script>tailwind.config = {
  "theme": {
    "extend": {
      "colors": {
        "primary": "#4A90E2",
        "accent": "#7ED321",
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
    <div class="flex h-[100vh]">
        <!-- Sidebar -->
        <div id="sidebar" class="w-64 bg-white border-r border-gray-200 flex flex-col">
            <div class="p-4 border-b border-gray-200">
                <div class="flex items-center">
                    <div class="w-8 h-8 rounded-md bg-primary flex items-center justify-center text-white font-bold">
                        UC
                    </div>
                    <h1 class="ml-2 text-lg font-bold text-gray-800">UpCoach CMS</h1>
                </div>
            </div>
            
            <nav class="flex-1 p-4">
                <div class="mb-4">
                    <p class="text-xs uppercase text-gray-500 font-medium mb-2">Main</p>
                    <span class="flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md mb-1 cursor-pointer">
                        <i class="fa-solid fa-gauge-high w-5 mr-2"></i>
                        Dashboard
                    </span>
                    <span class="flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md mb-1 cursor-pointer">
                        <i class="fa-solid fa-house w-5 mr-2"></i>
                        Homepage
                    </span>
                    <span class="flex items-center px-3 py-2 text-sm text-primary bg-blue-50 rounded-md mb-1 font-medium cursor-pointer">
                        <i class="fa-solid fa-newspaper w-5 mr-2"></i>
                        Blog
                    </span>
                    <span class="flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md mb-1 cursor-pointer">
                        <i class="fa-solid fa-book w-5 mr-2"></i>
                        Library
                    </span>
                </div>
                
                <div class="mb-4">
                    <p class="text-xs uppercase text-gray-500 font-medium mb-2">Settings</p>
                    <span class="flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md mb-1 cursor-pointer">
                        <i class="fa-solid fa-search w-5 mr-2"></i>
                        SEO
                    </span>
                    <span class="flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md mb-1 cursor-pointer">
                        <i class="fa-solid fa-user-circle w-5 mr-2"></i>
                        Avatars
                    </span>
                    <span class="flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md mb-1 cursor-pointer">
                        <i class="fa-solid fa-users w-5 mr-2"></i>
                        Users
                    </span>
                </div>
            </nav>
            
            <div class="p-4 border-t border-gray-200">
                <div class="flex items-center">
                    <img src="https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-3.jpg" alt="User" class="w-8 h-8 rounded-full">
                    <div class="ml-2">
                        <p class="text-sm font-medium text-gray-800">Alex Morgan</p>
                        <p class="text-xs text-gray-500">Admin</p>
                    </div>
                    <button class="ml-auto text-gray-500">
                        <i class="fa-solid fa-ellipsis-vertical"></i>
                    </button>
                </div>
            </div>
        </div>
        
        <!-- Main Content -->
        <div id="main-content" class="flex-1 overflow-auto">
            <!-- Header -->
            <header id="header" class="bg-white border-b border-gray-200 p-4 flex items-center justify-between">
                <div>
                    <h1 class="text-xl font-bold text-gray-800">Blog Management</h1>
                    <p class="text-sm text-gray-500">Manage your blog content</p>
                </div>
                
                <div class="flex items-center space-x-4">
                    <button id="blog-list-view-btn" class="flex items-center text-sm font-medium text-primary bg-blue-50 px-3 py-1.5 rounded-md">
                        <i class="fa-solid fa-list mr-2"></i>
                        List View
                    </button>
                    <button id="blog-editor-view-btn" class="flex items-center text-sm font-medium text-gray-600 hover:bg-gray-100 px-3 py-1.5 rounded-md">
                        <i class="fa-solid fa-pen-to-square mr-2"></i>
                        Editor
                    </button>
                    <button class="flex items-center text-sm font-medium text-white bg-primary px-4 py-1.5 rounded-md">
                        <i class="fa-solid fa-plus mr-2"></i>
                        New Post
                    </button>
                </div>
            </header>
            
            <!-- Blog List View -->
            <div id="blog-list-view" class="p-6">
                <!-- Filter and Search -->
                <div id="blog-filters" class="mb-6 flex justify-between items-center">
                    <div class="flex space-x-2">
                        <button class="px-3 py-1.5 text-sm font-medium bg-primary text-white rounded-md">
                            All Posts (24)
                        </button>
                        <button class="px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-md">
                            Published (18)
                        </button>
                        <button class="px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-md">
                            Draft (4)
                        </button>
                        <button class="px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-md">
                            Scheduled (2)
                        </button>
                    </div>
                    <div class="relative w-64">
                        <i class="fa-solid fa-search absolute left-3 top-2.5 text-gray-400"></i>
                        <input type="text" placeholder="Search posts..." class="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent">
                    </div>
                </div>
                
                <!-- Blog Posts Table -->
                <div id="blog-posts-table" class="bg-white border border-gray-200 rounded-lg overflow-hidden">
                    <table class="w-full">
                        <thead>
                            <tr class="bg-gray-50 text-left">
                                <th class="px-6 py-3 text-xs font-medium text-gray-500 uppercase">Title</th>
                                <th class="px-6 py-3 text-xs font-medium text-gray-500 uppercase">Author</th>
                                <th class="px-6 py-3 text-xs font-medium text-gray-500 uppercase">Date</th>
                                <th class="px-6 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                                <th class="px-6 py-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-gray-200">
                            <tr class="hover:bg-gray-50">
                                <td class="px-6 py-4">
                                    <div class="flex items-center">
                                        <div class="w-10 h-10 rounded bg-blue-100 flex items-center justify-center text-primary mr-3">
                                            <i class="fa-solid fa-newspaper"></i>
                                        </div>
                                        <div>
                                            <p class="font-medium text-gray-800">AI Coach Benefits: How Virtual Mentoring Transforms Teams</p>
                                            <p class="text-xs text-gray-500">/blog/ai-coach-benefits</p>
                                        </div>
                                    </div>
                                </td>
                                <td class="px-6 py-4">
                                    <div class="flex items-center">
                                        <img src="https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-3.jpg" alt="Author" class="w-6 h-6 rounded-full mr-2">
                                        <span class="text-gray-600">Alex Morgan</span>
                                    </div>
                                </td>
                                <td class="px-6 py-4 text-gray-600">July 15, 2023</td>
                                <td class="px-6 py-4">
                                    <span class="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">Draft</span>
                                </td>
                                <td class="px-6 py-4">
                                    <div class="flex space-x-3">
                                        <button class="text-primary hover:text-primary-dark">
                                            <i class="fa-solid fa-pen-to-square"></i>
                                        </button>
                                        <button class="text-gray-500 hover:text-gray-700">
                                            <i class="fa-solid fa-eye"></i>
                                        </button>
                                        <button class="text-gray-500 hover:text-gray-700">
                                            <i class="fa-solid fa-copy"></i>
                                        </button>
                                        <button class="text-red-500 hover:text-red-700">
                                            <i class="fa-solid fa-trash"></i>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                            
                            <tr class="hover:bg-gray-50">
                                <td class="px-6 py-4">
                                    <div class="flex items-center">
                                        <div class="w-10 h-10 rounded bg-blue-100 flex items-center justify-center text-primary mr-3">
                                            <i class="fa-solid fa-newspaper"></i>
                                        </div>
                                        <div>
                                            <p class="font-medium text-gray-800">5 Ways to Improve Team Productivity with Coaching</p>
                                            <p class="text-xs text-gray-500">/blog/improve-team-productivity</p>
                                        </div>
                                    </div>
                                </td>
                                <td class="px-6 py-4">
                                    <div class="flex items-center">
                                        <img src="https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-5.jpg" alt="Author" class="w-6 h-6 rounded-full mr-2">
                                        <span class="text-gray-600">Sarah Johnson</span>
                                    </div>
                                </td>
                                <td class="px-6 py-4 text-gray-600">July 12, 2023</td>
                                <td class="px-6 py-4">
                                    <span class="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">Published</span>
                                </td>
                                <td class="px-6 py-4">
                                    <div class="flex space-x-3">
                                        <button class="text-primary hover:text-primary-dark">
                                            <i class="fa-solid fa-pen-to-square"></i>
                                        </button>
                                        <button class="text-gray-500 hover:text-gray-700">
                                            <i class="fa-solid fa-eye"></i>
                                        </button>
                                        <button class="text-gray-500 hover:text-gray-700">
                                            <i class="fa-solid fa-copy"></i>
                                        </button>
                                        <button class="text-red-500 hover:text-red-700">
                                            <i class="fa-solid fa-trash"></i>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                            
                            <tr class="hover:bg-gray-50">
                                <td class="px-6 py-4">
                                    <div class="flex items-center">
                                        <div class="w-10 h-10 rounded bg-blue-100 flex items-center justify-center text-primary mr-3">
                                            <i class="fa-solid fa-newspaper"></i>
                                        </div>
                                        <div>
                                            <p class="font-medium text-gray-800">The Future of Workplace Learning: AI and Human Collaboration</p>
                                            <p class="text-xs text-gray-500">/blog/future-workplace-learning</p>
                                        </div>
                                    </div>
                                </td>
                                <td class="px-6 py-4">
                                    <div class="flex items-center">
                                        <img src="https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-3.jpg" alt="Author" class="w-6 h-6 rounded-full mr-2">
                                        <span class="text-gray-600">Alex Morgan</span>
                                    </div>
                                </td>
                                <td class="px-6 py-4 text-gray-600">July 20, 2023</td>
                                <td class="px-6 py-4">
                                    <span class="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">Scheduled</span>
                                </td>
                                <td class="px-6 py-4">
                                    <div class="flex space-x-3">
                                        <button class="text-primary hover:text-primary-dark">
                                            <i class="fa-solid fa-pen-to-square"></i>
                                        </button>
                                        <button class="text-gray-500 hover:text-gray-700">
                                            <i class="fa-solid fa-eye"></i>
                                        </button>
                                        <button class="text-gray-500 hover:text-gray-700">
                                            <i class="fa-solid fa-copy"></i>
                                        </button>
                                        <button class="text-red-500 hover:text-red-700">
                                            <i class="fa-solid fa-trash"></i>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                            
                            <tr class="hover:bg-gray-50">
                                <td class="px-6 py-4">
                                    <div class="flex items-center">
                                        <div class="w-10 h-10 rounded bg-blue-100 flex items-center justify-center text-primary mr-3">
                                            <i class="fa-solid fa-newspaper"></i>
                                        </div>
                                        <div>
                                            <p class="font-medium text-gray-800">How to Measure the ROI of Your Coaching Program</p>
                                            <p class="text-xs text-gray-500">/blog/measure-coaching-roi</p>
                                        </div>
                                    </div>
                                </td>
                                <td class="px-6 py-4">
                                    <div class="flex items-center">
                                        <img src="https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-2.jpg" alt="Author" class="w-6 h-6 rounded-full mr-2">
                                        <span class="text-gray-600">Michael Chen</span>
                                    </div>
                                </td>
                                <td class="px-6 py-4 text-gray-600">July 8, 2023</td>
                                <td class="px-6 py-4">
                                    <span class="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">Published</span>
                                </td>
                                <td class="px-6 py-4">
                                    <div class="flex space-x-3">
                                        <button class="text-primary hover:text-primary-dark">
                                            <i class="fa-solid fa-pen-to-square"></i>
                                        </button>
                                        <button class="text-gray-500 hover:text-gray-700">
                                            <i class="fa-solid fa-eye"></i>
                                        </button>
                                        <button class="text-gray-500 hover:text-gray-700">
                                            <i class="fa-solid fa-copy"></i>
                                        </button>
                                        <button class="text-red-500 hover:text-red-700">
                                            <i class="fa-solid fa-trash"></i>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                            
                            <tr class="hover:bg-gray-50">
                                <td class="px-6 py-4">
                                    <div class="flex items-center">
                                        <div class="w-10 h-10 rounded bg-blue-100 flex items-center justify-center text-primary mr-3">
                                            <i class="fa-solid fa-newspaper"></i>
                                        </div>
                                        <div>
                                            <p class="font-medium text-gray-800">Building Resilient Teams Through Coaching</p>
                                            <p class="text-xs text-gray-500">/blog/resilient-teams-coaching</p>
                                        </div>
                                    </div>
                                </td>
                                <td class="px-6 py-4">
                                    <div class="flex items-center">
                                        <img src="https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-5.jpg" alt="Author" class="w-6 h-6 rounded-full mr-2">
                                        <span class="text-gray-600">Sarah Johnson</span>
                                    </div>
                                </td>
                                <td class="px-6 py-4 text-gray-600">July 3, 2023</td>
                                <td class="px-6 py-4">
                                    <span class="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">Published</span>
                                </td>
                                <td class="px-6 py-4">
                                    <div class="flex space-x-3">
                                        <button class="text-primary hover:text-primary-dark">
                                            <i class="fa-solid fa-pen-to-square"></i>
                                        </button>
                                        <button class="text-gray-500 hover:text-gray-700">
                                            <i class="fa-solid fa-eye"></i>
                                        </button>
                                        <button class="text-gray-500 hover:text-gray-700">
                                            <i class="fa-solid fa-copy"></i>
                                        </button>
                                        <button class="text-red-500 hover:text-red-700">
                                            <i class="fa-solid fa-trash"></i>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                            
                            <tr class="hover:bg-gray-50">
                                <td class="px-6 py-4">
                                    <div class="flex items-center">
                                        <div class="w-10 h-10 rounded bg-blue-100 flex items-center justify-center text-primary mr-3">
                                            <i class="fa-solid fa-newspaper"></i>
                                        </div>
                                        <div>
                                            <p class="font-medium text-gray-800">From Manager to Coach: Transforming Leadership Styles</p>
                                            <p class="text-xs text-gray-500">/blog/manager-to-coach</p>
                                        </div>
                                    </div>
                                </td>
                                <td class="px-6 py-4">
                                    <div class="flex items-center">
                                        <img src="https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-3.jpg" alt="Author" class="w-6 h-6 rounded-full mr-2">
                                        <span class="text-gray-600">Alex Morgan</span>
                                    </div>
                                </td>
                                <td class="px-6 py-4 text-gray-600">June 28, 2023</td>
                                <td class="px-6 py-4">
                                    <span class="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">Draft</span>
                                </td>
                                <td class="px-6 py-4">
                                    <div class="flex space-x-3">
                                        <button class="text-primary hover:text-primary-dark">
                                            <i class="fa-solid fa-pen-to-square"></i>
                                        </button>
                                        <button class="text-gray-500 hover:text-gray-700">
                                            <i class="fa-solid fa-eye"></i>
                                        </button>
                                        <button class="text-gray-500 hover:text-gray-700">
                                            <i class="fa-solid fa-copy"></i>
                                        </button>
                                        <button class="text-red-500 hover:text-red-700">
                                            <i class="fa-solid fa-trash"></i>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                    
                    <!-- Pagination -->
                    <div class="px-6 py-3 flex items-center justify-between border-t border-gray-200">
                        <div class="text-sm text-gray-500">
                            Showing <span class="font-medium">1</span> to <span class="font-medium">6</span> of <span class="font-medium">24</span> results
                        </div>
                        <div class="flex space-x-1">
                            <button class="px-3 py-1 text-sm border border-gray-200 rounded-md text-gray-500 hover:bg-gray-50 disabled:opacity-50" disabled="">
                                Previous
                            </button>
                            <button class="px-3 py-1 text-sm bg-primary text-white rounded-md">
                                1
                            </button>
                            <button class="px-3 py-1 text-sm border border-gray-200 rounded-md text-gray-700 hover:bg-gray-50">
                                2
                            </button>
                            <button class="px-3 py-1 text-sm border border-gray-200 rounded-md text-gray-700 hover:bg-gray-50">
                                3
                            </button>
                            <button class="px-3 py-1 text-sm border border-gray-200 rounded-md text-gray-700 hover:bg-gray-50">
                                4
                            </button>
                            <button class="px-3 py-1 text-sm border border-gray-200 rounded-md text-gray-700 hover:bg-gray-50">
                                Next
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Blog Editor View (Hidden by default) -->
            <div id="blog-editor-view" class="p-6 hidden">
                <div class="bg-white border border-gray-200 rounded-lg overflow-hidden">
                    <!-- Editor Toolbar -->
                    <div class="border-b border-gray-200 p-4 flex justify-between items-center">
                        <div class="flex items-center space-x-4">
                            <button class="flex items-center text-gray-600 hover:text-primary">
                                <i class="fa-solid fa-arrow-left mr-2"></i>
                                Back to list
                            </button>
                            <div class="h-5 border-l border-gray-300"></div>
                            <div class="flex items-center">
                                <span class="text-sm text-gray-500 mr-2">Status:</span>
                                <select class="text-sm border border-gray-200 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent">
                                    <option>Draft</option>
                                    <option>Published</option>
                                    <option>Scheduled</option>
                                </select>
                            </div>
                        </div>
                        <div class="flex items-center space-x-3">
                            <button class="px-3 py-1.5 text-sm font-medium text-gray-600 border border-gray-200 rounded-md hover:bg-gray-50">
                                <i class="fa-solid fa-eye mr-2"></i>
                                Preview
                            </button>
                            <button class="px-3 py-1.5 text-sm font-medium text-gray-600 border border-gray-200 rounded-md hover:bg-gray-50">
                                <i class="fa-solid fa-clock-rotate-left mr-2"></i>
                                Revisions
                            </button>
                            <button class="px-3 py-1.5 text-sm font-medium text-white bg-primary rounded-md">
                                <i class="fa-solid fa-save mr-2"></i>
                                Save
                            </button>
                            <button class="px-3 py-1.5 text-sm font-medium text-white bg-green-600 rounded-md">
                                <i class="fa-solid fa-paper-plane mr-2"></i>
                                Publish
                            </button>
                        </div>
                    </div>
                    
                    <!-- Editor Content -->
                    <div class="p-6">
                        <div class="grid grid-cols-3 gap-6">
                            <!-- Main Editor Column -->
                            <div class="col-span-2">
                                <!-- Title Input -->
                                <div class="mb-6">
                                    <input type="text" placeholder="Post title" value="AI Coach Benefits: How Virtual Mentoring Transforms Teams" class="w-full px-4 py-3 text-xl font-bold border-0 border-b border-gray-200 focus:outline-none focus:border-primary">
                                </div>
                                
                                <!-- Markdown Editor -->
                                <div class="mb-6">
                                    <textarea id="markdown-editor" class="w-full h-[400px]"># AI Coach Benefits: How Virtual Mentoring Transforms Teams

Explore how AI coaching can provide 24/7 support and personalized guidance for your team members.

## Introduction

In today's fast-paced business environment, traditional coaching methods often fall short of meeting the continuous development needs of modern teams. AI coaching platforms like UpCoach are changing this paradigm by offering on-demand, personalized guidance that scales across organizations of all sizes.

## Key Benefits

### 1. 24/7 Availability

Unlike human coaches who have limited availability, AI coaches can provide support at any time, allowing team members to seek guidance when they need it most.

### 2. Personalized Learning Paths

AI coaching systems analyze individual strengths, weaknesses, and learning styles to create customized development plans that evolve as the user progresses.

### 3. Consistent Feedback

AI coaches provide objective, data-driven feedback without the inconsistencies or biases that may affect human coaching relationships.

## Real-World Applications

Many forward-thinking organizations have already integrated AI coaching into their development programs with impressive results...
                                    </textarea>
                                </div>
                            </div>
                            
                            <!-- Sidebar Settings Column -->
                            <div class="col-span-1">
                                <!-- Publish Settings -->
                                <div class="bg-gray-50 rounded-lg p-4 mb-6">
                                    <h3 class="font-medium text-gray-800 mb-3">Publish Settings</h3>
                                    
                                    <div class="mb-4">
                                        <label class="block text-sm text-gray-600 mb-1">Author</label>
                                        <select class="w-full text-sm border border-gray-200 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent">
                                            <option>Alex Morgan</option>
                                            <option>Sarah Johnson</option>
                                            <option>Michael Chen</option>
                                        </select>
                                    </div>
                                    
                                    <div class="mb-4">
                                        <label class="block text-sm text-gray-600 mb-1">Publish Date</label>
                                        <input type="date" class="w-full text-sm border border-gray-200 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent">
                                    </div>
                                    
                                    <div class="mb-4">
                                        <label class="block text-sm text-gray-600 mb-1">URL Slug</label>
                                        <input type="text" value="ai-coach-benefits" class="w-full text-sm border border-gray-200 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent">
                                    </div>
                                    
                                    <div>
                                        <label class="block text-sm text-gray-600 mb-1">Categories</label>
                                        <div class="flex flex-wrap gap-2">
                                            <span class="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full flex items-center">
                                                AI Coaching
                                                <button class="ml-1 text-blue-800 hover:text-blue-900">
                                                    <i class="fa-solid fa-times"></i>
                                                </button>
                                            </span>
                                            <span class="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full flex items-center">
                                                Leadership
                                                <button class="ml-1 text-blue-800 hover:text-blue-900">
                                                    <i class="fa-solid fa-times"></i>
                                                </button>
                                            </span>
                                            <button class="px-2 py-1 text-xs border border-gray-200 text-gray-600 rounded-full hover:bg-gray-100">
                                                + Add
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                
                                <!-- SEO Settings -->
                                <div class="bg-gray-50 rounded-lg p-4 mb-6">
                                    <h3 class="font-medium text-gray-800 mb-3">SEO Settings</h3>
                                    
                                    <div class="mb-4">
                                        <label class="block text-sm text-gray-600 mb-1">Meta Title</label>
                                        <input type="text" value="AI Coach Benefits | UpCoach Blog" class="w-full text-sm border border-gray-200 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent">
                                        <div class="text-xs text-gray-500 mt-1">60 characters (70 recommended)</div>
                                    </div>
                                    
                                    <div class="mb-4">
                                        <label class="block text-sm text-gray-600 mb-1">Meta Description</label>
                                        <textarea class="w-full text-sm border border-gray-200 rounded-md px-3 py-2 h-20 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent">Discover how AI coaching platforms provide 24/7 personalized guidance and transform team performance. Learn about the benefits of virtual mentoring.</textarea>
                                        <div class="text-xs text-gray-500 mt-1">120 characters (150-160 recommended)</div>
                                    </div>
                                    
                                    <div>
                                        <label class="block text-sm text-gray-600 mb-1">Featured Image / OG Image</label>
                                        <div class="border border-dashed border-gray-300 rounded-md p-4 text-center">
                                            <div class="w-full h-32 bg-gray-200 rounded mb-2 flex items-center justify-center text-gray-400">
                                                <i class="fa-solid fa-image text-3xl"></i>
                                            </div>
                                            <button class="text-sm text-primary font-medium">Upload Image</button>
                                        </div>
                                    </div>
                                </div>
                                
                                <!-- Additional Options -->
                                <div class="bg-gray-50 rounded-lg p-4">
                                    <h3 class="font-medium text-gray-800 mb-3">Options</h3>
                                    
                                    <div class="space-y-3">
                                        <label class="flex items-center">
                                            <input type="checkbox" class="rounded text-primary focus:ring-primary">
                                            <span class="ml-2 text-sm text-gray-700">Allow comments</span>
                                        </label>
                                        
                                        <label class="flex items-center">
                                            <input type="checkbox" checked="" class="rounded text-primary focus:ring-primary">
                                            <span class="ml-2 text-sm text-gray-700">Show in featured posts</span>
                                        </label>
                                        
                                        <label class="flex items-center">
                                            <input type="checkbox" class="rounded text-primary focus:ring-primary">
                                            <span class="ml-2 text-sm text-gray-700">Add to newsletter</span>
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    
    <script>
        // Initialize Markdown Editor
        const easyMDE = new EasyMDE({
            element: document.getElementById('markdown-editor'),
            spellChecker: false,
            autofocus: true,
            toolbar: [
                'bold', 'italic', 'heading', '|',
                'quote', 'unordered-list', 'ordered-list', '|',
                'link', 'image', '|',
                'preview', 'side-by-side', 'fullscreen', '|',
                'guide'
            ]
        });
        
        // Toggle between list and editor views
        document.getElementById('blog-list-view-btn').addEventListener('click', function() {
            document.getElementById('blog-list-view').classList.remove('hidden');
            document.getElementById('blog-editor-view').classList.add('hidden');
            this.classList.add('bg-blue-50', 'text-primary');
            this.classList.remove('text-gray-600', 'hover:bg-gray-100');
            document.getElementById('blog-editor-view-btn').classList.remove('bg-blue-50', 'text-primary');
            document.getElementById('blog-editor-view-btn').classList.add('text-gray-600', 'hover:bg-gray-100');
        });
        
        document.getElementById('blog-editor-view-btn').addEventListener('click', function() {
            document.getElementById('blog-editor-view').classList.remove('hidden');
            document.getElementById('blog-list-view').classList.add('hidden');
            this.classList.add('bg-blue-50', 'text-primary');
            this.classList.remove('text-gray-600', 'hover:bg-gray-100');
            document.getElementById('blog-list-view-btn').classList.remove('bg-blue-50', 'text-primary');
            document.getElementById('blog-list-view-btn').classList.add('text-gray-600', 'hover:bg-gray-100');
        });
    </script>

</body></html>

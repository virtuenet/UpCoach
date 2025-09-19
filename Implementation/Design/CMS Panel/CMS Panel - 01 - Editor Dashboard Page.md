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
                    <span class="flex items-center px-3 py-2 text-sm text-primary bg-blue-50 rounded-md mb-1 font-medium cursor-pointer">
                        <i class="fa-solid fa-gauge-high w-5 mr-2"></i>
                        Dashboard
                    </span>
                    <span class="flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md mb-1 cursor-pointer">
                        <i class="fa-solid fa-house w-5 mr-2"></i>
                        Homepage
                    </span>
                    <span class="flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md mb-1 cursor-pointer">
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
                    <h1 class="text-xl font-bold text-gray-800">Dashboard</h1>
                    <p class="text-sm text-gray-500">Welcome back, Alex</p>
                </div>
                
                <div class="flex items-center space-x-4">
                    <div class="flex items-center space-x-2 text-sm">
                        <span class="flex items-center text-green-600">
                            <i class="fa-solid fa-circle text-xs mr-1"></i>
                            System Online
                        </span>
                        <span class="text-gray-400">|</span>
                        <span class="text-gray-600">Last published: Today, 10:23 AM</span>
                    </div>
                    
                    <div class="flex items-center space-x-2">
                        <button class="p-2 text-gray-500 hover:bg-gray-100 rounded-full">
                            <i class="fa-solid fa-bell"></i>
                        </button>
                        <button class="p-2 text-gray-500 hover:bg-gray-100 rounded-full">
                            <i class="fa-solid fa-question-circle"></i>
                        </button>
                    </div>
                </div>
            </header>
            
            <!-- Dashboard Content -->
            <div class="p-6">
                <!-- Quick Actions -->
                <div id="quick-actions" class="mb-8">
                    <h2 class="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h2>
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <button class="flex items-center p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                            <div class="w-10 h-10 rounded-md bg-blue-100 flex items-center justify-center text-primary">
                                <i class="fa-solid fa-plus"></i>
                            </div>
                            <div class="ml-3 text-left">
                                <h3 class="font-medium">New Blog Post</h3>
                                <p class="text-sm text-gray-500">Create a new article</p>
                            </div>
                        </button>
                        
                        <button class="flex items-center p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                            <div class="w-10 h-10 rounded-md bg-green-100 flex items-center justify-center text-accent">
                                <i class="fa-solid fa-upload"></i>
                            </div>
                            <div class="ml-3 text-left">
                                <h3 class="font-medium">Upload Microlearning</h3>
                                <p class="text-sm text-gray-500">Add to library</p>
                            </div>
                        </button>
                        
                        <button class="flex items-center p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                            <div class="w-10 h-10 rounded-md bg-purple-100 flex items-center justify-center text-purple-500">
                                <i class="fa-solid fa-edit"></i>
                            </div>
                            <div class="ml-3 text-left">
                                <h3 class="font-medium">Edit Hero Block</h3>
                                <p class="text-sm text-gray-500">Update homepage</p>
                            </div>
                        </button>
                    </div>
                </div>
                
                <!-- System Status -->
                <div id="system-status" class="mb-8">
                    <h2 class="text-lg font-semibold text-gray-800 mb-4">System Status</h2>
                    <div class="bg-white border border-gray-200 rounded-lg p-4">
                        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div class="flex items-center">
                                <div class="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                                    <i class="fa-solid fa-sync-alt"></i>
                                </div>
                                <div class="ml-4">
                                    <h3 class="text-sm text-gray-500">Content Sync</h3>
                                    <p class="font-medium">Synced (2 min ago)</p>
                                </div>
                            </div>
                            
                            <div class="flex items-center">
                                <div class="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-primary">
                                    <i class="fa-solid fa-globe"></i>
                                </div>
                                <div class="ml-4">
                                    <h3 class="text-sm text-gray-500">Last Published</h3>
                                    <p class="font-medium">Today, 10:23 AM</p>
                                </div>
                            </div>
                            
                            <div class="flex items-center">
                                <div class="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-600">
                                    <i class="fa-solid fa-file-alt"></i>
                                </div>
                                <div class="ml-4">
                                    <h3 class="text-sm text-gray-500">Pending Drafts</h3>
                                    <p class="font-medium">3 drafts</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Recently Edited -->
                <div id="recently-edited" class="mb-8">
                    <div class="flex items-center justify-between mb-4">
                        <h2 class="text-lg font-semibold text-gray-800">Recently Edited</h2>
                        <button class="text-sm text-primary font-medium">View All</button>
                    </div>
                    
                    <div class="bg-white border border-gray-200 rounded-lg overflow-hidden">
                        <table class="w-full">
                            <thead>
                                <tr class="bg-gray-50 text-left">
                                    <th class="px-6 py-3 text-xs font-medium text-gray-500 uppercase">Block Name</th>
                                    <th class="px-6 py-3 text-xs font-medium text-gray-500 uppercase">Section</th>
                                    <th class="px-6 py-3 text-xs font-medium text-gray-500 uppercase">Last Modified</th>
                                    <th class="px-6 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                                    <th class="px-6 py-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-gray-200">
                                <tr>
                                    <td class="px-6 py-4">
                                        <div class="flex items-center">
                                            <i class="fa-solid fa-paragraph text-gray-400 mr-3"></i>
                                            <span class="font-medium text-gray-800">Hero Headline</span>
                                        </div>
                                    </td>
                                    <td class="px-6 py-4 text-gray-600">Homepage</td>
                                    <td class="px-6 py-4 text-gray-600">Today, 9:41 AM</td>
                                    <td class="px-6 py-4">
                                        <span class="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">Published</span>
                                    </td>
                                    <td class="px-6 py-4">
                                        <button class="text-primary hover:text-primary-dark">Edit</button>
                                    </td>
                                </tr>
                                <tr>
                                    <td class="px-6 py-4">
                                        <div class="flex items-center">
                                            <i class="fa-solid fa-newspaper text-gray-400 mr-3"></i>
                                            <span class="font-medium text-gray-800">AI Coach Benefits</span>
                                        </div>
                                    </td>
                                    <td class="px-6 py-4 text-gray-600">Blog</td>
                                    <td class="px-6 py-4 text-gray-600">Yesterday, 3:22 PM</td>
                                    <td class="px-6 py-4">
                                        <span class="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">Draft</span>
                                    </td>
                                    <td class="px-6 py-4">
                                        <button class="text-primary hover:text-primary-dark">Edit</button>
                                    </td>
                                </tr>
                                <tr>
                                    <td class="px-6 py-4">
                                        <div class="flex items-center">
                                            <i class="fa-solid fa-video text-gray-400 mr-3"></i>
                                            <span class="font-medium text-gray-800">Leadership Basics</span>
                                        </div>
                                    </td>
                                    <td class="px-6 py-4 text-gray-600">Library</td>
                                    <td class="px-6 py-4 text-gray-600">July 15, 2023</td>
                                    <td class="px-6 py-4">
                                        <span class="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">Published</span>
                                    </td>
                                    <td class="px-6 py-4">
                                        <button class="text-primary hover:text-primary-dark">Edit</button>
                                    </td>
                                </tr>
                                <tr>
                                    <td class="px-6 py-4">
                                        <div class="flex items-center">
                                            <i class="fa-solid fa-star text-gray-400 mr-3"></i>
                                            <span class="font-medium text-gray-800">Testimonial - Sarah J.</span>
                                        </div>
                                    </td>
                                    <td class="px-6 py-4 text-gray-600">Homepage</td>
                                    <td class="px-6 py-4 text-gray-600">July 14, 2023</td>
                                    <td class="px-6 py-4">
                                        <span class="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">Published</span>
                                    </td>
                                    <td class="px-6 py-4">
                                        <button class="text-primary hover:text-primary-dark">Edit</button>
                                    </td>
                                </tr>
                                <tr>
                                    <td class="px-6 py-4">
                                        <div class="flex items-center">
                                            <i class="fa-solid fa-user-circle text-gray-400 mr-3"></i>
                                            <span class="font-medium text-gray-800">Emma Coach Avatar</span>
                                        </div>
                                    </td>
                                    <td class="px-6 py-4 text-gray-600">Avatars</td>
                                    <td class="px-6 py-4 text-gray-600">July 12, 2023</td>
                                    <td class="px-6 py-4">
                                        <span class="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">Updated</span>
                                    </td>
                                    <td class="px-6 py-4">
                                        <button class="text-primary hover:text-primary-dark">Edit</button>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
                
                <!-- Pending Drafts -->
                <div id="pending-drafts">
                    <div class="flex items-center justify-between mb-4">
                        <h2 class="text-lg font-semibold text-gray-800">Pending Drafts</h2>
                        <button class="text-sm text-primary font-medium">View All</button>
                    </div>
                    
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div class="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                            <div class="flex justify-between items-start mb-3">
                                <div class="flex items-center">
                                    <i class="fa-solid fa-newspaper text-gray-400 mr-2"></i>
                                    <span class="text-sm text-gray-500">Blog</span>
                                </div>
                                <span class="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">Draft</span>
                            </div>
                            <h3 class="font-medium mb-2">AI Coach Benefits: How Virtual Mentoring Transforms Teams</h3>
                            <p class="text-sm text-gray-500 mb-4 line-clamp-2">Explore how AI coaching can provide 24/7 support and personalized guidance for your team members...</p>
                            <div class="flex justify-between items-center">
                                <span class="text-xs text-gray-500">Last edited: Yesterday</span>
                                <button class="text-sm text-primary font-medium">Continue Editing</button>
                            </div>
                        </div>
                        
                        <div class="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                            <div class="flex justify-between items-start mb-3">
                                <div class="flex items-center">
                                    <i class="fa-solid fa-home text-gray-400 mr-2"></i>
                                    <span class="text-sm text-gray-500">Homepage</span>
                                </div>
                                <span class="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">Draft</span>
                            </div>
                            <h3 class="font-medium mb-2">Feature Section: AI-Powered Insights</h3>
                            <p class="text-sm text-gray-500 mb-4 line-clamp-2">Get real-time analytics and actionable insights based on team performance and engagement metrics...</p>
                            <div class="flex justify-between items-center">
                                <span class="text-xs text-gray-500">Last edited: 2 days ago</span>
                                <button class="text-sm text-primary font-medium">Continue Editing</button>
                            </div>
                        </div>
                        
                        <div class="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                            <div class="flex justify-between items-start mb-3">
                                <div class="flex items-center">
                                    <i class="fa-solid fa-book text-gray-400 mr-2"></i>
                                    <span class="text-sm text-gray-500">Library</span>
                                </div>
                                <span class="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">Draft</span>
                            </div>
                            <h3 class="font-medium mb-2">Effective Communication Techniques</h3>
                            <p class="text-sm text-gray-500 mb-4 line-clamp-2">Learn the fundamentals of clear communication in professional environments with practical examples...</p>
                            <div class="flex justify-between items-center">
                                <span class="text-xs text-gray-500">Last edited: 3 days ago</span>
                                <button class="text-sm text-primary font-medium">Continue Editing</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

</body></html>

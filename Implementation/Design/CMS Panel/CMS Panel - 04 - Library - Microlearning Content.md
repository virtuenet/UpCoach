<html><head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <script src="https://cdn.tailwindcss.com"></script>
    <script> window.FontAwesomeConfig = { autoReplaceSvg: 'nest'};</script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/js/all.min.js" crossorigin="anonymous" referrerpolicy="no-referrer"></script>
    <style>::-webkit-scrollbar { display: none;}</style>
    
    <script src="https://cdn.jsdelivr.net/npm/highcharts@10.3.3/highcharts.js"></script>
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
                    <span class="flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md mb-1 cursor-pointer">
                        <i class="fa-solid fa-newspaper w-5 mr-2"></i>
                        Blog
                    </span>
                    <span class="flex items-center px-3 py-2 text-sm text-primary bg-blue-50 rounded-md mb-1 font-medium cursor-pointer">
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
                    <h1 class="text-xl font-bold text-gray-800">Microlearning Content Library</h1>
                    <p class="text-sm text-gray-500">Manage your learning resources</p>
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
            
            <!-- Library Content -->
            <div class="p-6">
                <!-- Upload Section -->
                <div id="upload-section" class="mb-8">
                    <div class="bg-white border border-gray-200 rounded-lg p-6">
                        <h2 class="text-lg font-semibold text-gray-800 mb-4">Upload New Content</h2>
                        
                        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <!-- Left Column - Upload -->
                            <div id="upload-area">
                                <div class="border-2 border-dashed border-gray-300 rounded-lg p-8 flex flex-col items-center justify-center mb-4">
                                    <i class="fa-solid fa-cloud-upload-alt text-4xl text-gray-400 mb-4"></i>
                                    <p class="text-gray-600 mb-2 text-center">Drag and drop your file here, or</p>
                                    <button class="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90">Browse Files</button>
                                    <p class="text-xs text-gray-500 mt-4 text-center">Supports MP4, MP3, Markdown, HTML (max 100MB)</p>
                                </div>
                                
                                <div id="upload-progress" class="hidden">
                                    <div class="flex items-center justify-between mb-2">
                                        <span class="text-sm font-medium">leadership_basics.mp4</span>
                                        <span class="text-xs text-gray-500">75% (45MB / 60MB)</span>
                                    </div>
                                    <div class="w-full bg-gray-200 rounded-full h-2">
                                        <div class="bg-primary h-2 rounded-full" style="width: 75%"></div>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Right Column - Content Details -->
                            <div id="content-details">
                                <div class="space-y-4">
                                    <div>
                                        <label class="block text-sm font-medium text-gray-700 mb-1">Content Title</label>
                                        <input type="text" placeholder="Enter a descriptive title" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary">
                                    </div>
                                    
                                    <div class="grid grid-cols-2 gap-4">
                                        <div>
                                            <label class="block text-sm font-medium text-gray-700 mb-1">Content Type</label>
                                            <select class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary">
                                                <option value="" disabled="" selected="">Select type</option>
                                                <option value="video">Video (MP4)</option>
                                                <option value="audio">Audio (MP3)</option>
                                                <option value="article">Article (Markdown)</option>
                                                <option value="html">Article (HTML)</option>
                                            </select>
                                        </div>
                                        
                                        <div>
                                            <label class="block text-sm font-medium text-gray-700 mb-1">Category</label>
                                            <select class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary">
                                                <option value="" disabled="" selected="">Select category</option>
                                                <option value="leadership">Leadership</option>
                                                <option value="communication">Communication</option>
                                                <option value="productivity">Productivity</option>
                                                <option value="wellbeing">Wellbeing</option>
                                                <option value="career">Career Development</option>
                                            </select>
                                        </div>
                                    </div>
                                    
                                    <div class="grid grid-cols-2 gap-4">
                                        <div>
                                            <label class="block text-sm font-medium text-gray-700 mb-1">Access Level</label>
                                            <select class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary">
                                                <option value="free">Free</option>
                                                <option value="basic">Basic Plan</option>
                                                <option value="premium">Premium Plan</option>
                                                <option value="enterprise">Enterprise Only</option>
                                            </select>
                                        </div>
                                        
                                        <div>
                                            <label class="block text-sm font-medium text-gray-700 mb-1">Avatar Narrator (Optional)</label>
                                            <select class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary">
                                                <option value="" selected="">None</option>
                                                <option value="emma">Emma (Empathetic)</option>
                                                <option value="alex">Alex (Energetic)</option>
                                                <option value="marcus">Marcus (Motivational)</option>
                                                <option value="sarah">Sarah (Strategic)</option>
                                            </select>
                                        </div>
                                    </div>
                                    
                                    <div>
                                        <label class="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                        <textarea rows="3" placeholder="Brief description of this content" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"></textarea>
                                    </div>
                                    
                                    <div>
                                        <label class="block text-sm font-medium text-gray-700 mb-2">Tags</label>
                                        <div class="flex flex-wrap items-center gap-2 mb-2">
                                            <span class="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm flex items-center">
                                                Leadership
                                                <button class="ml-1 text-blue-800 hover:text-blue-900">
                                                    <i class="fa-solid fa-times"></i>
                                                </button>
                                            </span>
                                            <span class="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm flex items-center">
                                                Communication
                                                <button class="ml-1 text-blue-800 hover:text-blue-900">
                                                    <i class="fa-solid fa-times"></i>
                                                </button>
                                            </span>
                                            <input type="text" placeholder="Add tag..." class="border-none focus:ring-0 text-sm p-1 flex-grow min-w-[120px]">
                                        </div>
                                        <div class="text-xs text-gray-500">Popular: Burnout, Teamwork, Remote Work, Motivation</div>
                                    </div>
                                    
                                    <div class="flex justify-end space-x-3 pt-2">
                                        <button class="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50">Cancel</button>
                                        <button class="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90">Upload Content</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Content Library -->
                <div id="content-library">
                    <div class="flex flex-wrap items-center justify-between mb-4">
                        <h2 class="text-lg font-semibold text-gray-800">Content Library</h2>
                        
                        <div class="flex items-center space-x-4 mt-2 sm:mt-0">
                            <div class="relative">
                                <input type="text" placeholder="Search content..." class="pl-9 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary">
                                <i class="fa-solid fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                            </div>
                            
                            <div class="flex items-center space-x-2">
                                <select class="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-sm">
                                    <option value="all">All Types</option>
                                    <option value="video">Video</option>
                                    <option value="audio">Audio</option>
                                    <option value="article">Article</option>
                                </select>
                                
                                <select class="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-sm">
                                    <option value="all">All Categories</option>
                                    <option value="leadership">Leadership</option>
                                    <option value="communication">Communication</option>
                                    <option value="productivity">Productivity</option>
                                    <option value="wellbeing">Wellbeing</option>
                                </select>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Tags Filter -->
                    <div id="tags-filter" class="bg-white border border-gray-200 rounded-lg p-3 mb-4">
                        <div class="flex flex-wrap items-center gap-2">
                            <span class="text-sm font-medium text-gray-700 mr-2">Filter by tags:</span>
                            <button class="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm hover:bg-primary/20">Leadership</button>
                            <button class="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm hover:bg-gray-200">Communication</button>
                            <button class="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm hover:bg-gray-200">Burnout</button>
                            <button class="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm hover:bg-gray-200">Productivity</button>
                            <button class="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm hover:bg-gray-200">Teamwork</button>
                            <button class="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm hover:bg-gray-200">Remote Work</button>
                            <button class="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm hover:bg-gray-200">Motivation</button>
                            <button class="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm hover:bg-gray-200">Career Growth</button>
                            <button class="px-3 py-1 text-primary text-sm">+ More</button>
                        </div>
                    </div>
                    
                    <!-- Content Table -->
                    <div id="content-table" class="bg-white border border-gray-200 rounded-lg overflow-hidden">
                        <table class="w-full">
                            <thead>
                                <tr class="bg-gray-50 text-left">
                                    <th class="px-6 py-3 text-xs font-medium text-gray-500 uppercase">Content Title</th>
                                    <th class="px-6 py-3 text-xs font-medium text-gray-500 uppercase">Type</th>
                                    <th class="px-6 py-3 text-xs font-medium text-gray-500 uppercase">Category</th>
                                    <th class="px-6 py-3 text-xs font-medium text-gray-500 uppercase">Access</th>
                                    <th class="px-6 py-3 text-xs font-medium text-gray-500 uppercase">Usage Count</th>
                                    <th class="px-6 py-3 text-xs font-medium text-gray-500 uppercase">Last Modified</th>
                                    <th class="px-6 py-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-gray-200">
                                <tr>
                                    <td class="px-6 py-4">
                                        <div class="flex items-center">
                                            <i class="fa-solid fa-video text-primary mr-3"></i>
                                            <span class="font-medium text-gray-800">Leadership Fundamentals</span>
                                        </div>
                                    </td>
                                    <td class="px-6 py-4 text-gray-600">Video</td>
                                    <td class="px-6 py-4 text-gray-600">Leadership</td>
                                    <td class="px-6 py-4">
                                        <span class="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">Free</span>
                                    </td>
                                    <td class="px-6 py-4 text-gray-600">1,245</td>
                                    <td class="px-6 py-4 text-gray-600">Today, 9:41 AM</td>
                                    <td class="px-6 py-4">
                                        <div class="flex space-x-2">
                                            <button class="text-gray-500 hover:text-gray-700">
                                                <i class="fa-solid fa-edit"></i>
                                            </button>
                                            <button class="text-gray-500 hover:text-gray-700">
                                                <i class="fa-solid fa-eye"></i>
                                            </button>
                                            <button class="text-gray-500 hover:text-red-600">
                                                <i class="fa-solid fa-trash"></i>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                                <tr>
                                    <td class="px-6 py-4">
                                        <div class="flex items-center">
                                            <i class="fa-solid fa-headphones text-purple-500 mr-3"></i>
                                            <span class="font-medium text-gray-800">Effective Communication Techniques</span>
                                        </div>
                                    </td>
                                    <td class="px-6 py-4 text-gray-600">Audio</td>
                                    <td class="px-6 py-4 text-gray-600">Communication</td>
                                    <td class="px-6 py-4">
                                        <span class="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">Basic</span>
                                    </td>
                                    <td class="px-6 py-4 text-gray-600">876</td>
                                    <td class="px-6 py-4 text-gray-600">Yesterday, 3:22 PM</td>
                                    <td class="px-6 py-4">
                                        <div class="flex space-x-2">
                                            <button class="text-gray-500 hover:text-gray-700">
                                                <i class="fa-solid fa-edit"></i>
                                            </button>
                                            <button class="text-gray-500 hover:text-gray-700">
                                                <i class="fa-solid fa-eye"></i>
                                            </button>
                                            <button class="text-gray-500 hover:text-red-600">
                                                <i class="fa-solid fa-trash"></i>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                                <tr>
                                    <td class="px-6 py-4">
                                        <div class="flex items-center">
                                            <i class="fa-solid fa-file-alt text-gray-500 mr-3"></i>
                                            <span class="font-medium text-gray-800">Managing Burnout: A Guide</span>
                                        </div>
                                    </td>
                                    <td class="px-6 py-4 text-gray-600">Article</td>
                                    <td class="px-6 py-4 text-gray-600">Wellbeing</td>
                                    <td class="px-6 py-4">
                                        <span class="px-2 py-1 text-xs font-medium bg-purple-100 text-purple-800 rounded-full">Premium</span>
                                    </td>
                                    <td class="px-6 py-4 text-gray-600">532</td>
                                    <td class="px-6 py-4 text-gray-600">July 15, 2023</td>
                                    <td class="px-6 py-4">
                                        <div class="flex space-x-2">
                                            <button class="text-gray-500 hover:text-gray-700">
                                                <i class="fa-solid fa-edit"></i>
                                            </button>
                                            <button class="text-gray-500 hover:text-gray-700">
                                                <i class="fa-solid fa-eye"></i>
                                            </button>
                                            <button class="text-gray-500 hover:text-red-600">
                                                <i class="fa-solid fa-trash"></i>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                                <tr>
                                    <td class="px-6 py-4">
                                        <div class="flex items-center">
                                            <i class="fa-solid fa-video text-primary mr-3"></i>
                                            <span class="font-medium text-gray-800">Productivity Hacks for Remote Teams</span>
                                        </div>
                                    </td>
                                    <td class="px-6 py-4 text-gray-600">Video</td>
                                    <td class="px-6 py-4 text-gray-600">Productivity</td>
                                    <td class="px-6 py-4">
                                        <span class="px-2 py-1 text-xs font-medium bg-orange-100 text-orange-800 rounded-full">Enterprise</span>
                                    </td>
                                    <td class="px-6 py-4 text-gray-600">1,032</td>
                                    <td class="px-6 py-4 text-gray-600">July 12, 2023</td>
                                    <td class="px-6 py-4">
                                        <div class="flex space-x-2">
                                            <button class="text-gray-500 hover:text-gray-700">
                                                <i class="fa-solid fa-edit"></i>
                                            </button>
                                            <button class="text-gray-500 hover:text-gray-700">
                                                <i class="fa-solid fa-eye"></i>
                                            </button>
                                            <button class="text-gray-500 hover:text-red-600">
                                                <i class="fa-solid fa-trash"></i>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                                <tr>
                                    <td class="px-6 py-4">
                                        <div class="flex items-center">
                                            <i class="fa-solid fa-headphones text-purple-500 mr-3"></i>
                                            <span class="font-medium text-gray-800">Conflict Resolution Strategies</span>
                                        </div>
                                    </td>
                                    <td class="px-6 py-4 text-gray-600">Audio</td>
                                    <td class="px-6 py-4 text-gray-600">Communication</td>
                                    <td class="px-6 py-4">
                                        <span class="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">Basic</span>
                                    </td>
                                    <td class="px-6 py-4 text-gray-600">789</td>
                                    <td class="px-6 py-4 text-gray-600">July 10, 2023</td>
                                    <td class="px-6 py-4">
                                        <div class="flex space-x-2">
                                            <button class="text-gray-500 hover:text-gray-700">
                                                <i class="fa-solid fa-edit"></i>
                                            </button>
                                            <button class="text-gray-500 hover:text-gray-700">
                                                <i class="fa-solid fa-eye"></i>
                                            </button>
                                            <button class="text-gray-500 hover:text-red-600">
                                                <i class="fa-solid fa-trash"></i>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                                <tr>
                                    <td class="px-6 py-4">
                                        <div class="flex items-center">
                                            <i class="fa-solid fa-file-alt text-gray-500 mr-3"></i>
                                            <span class="font-medium text-gray-800">Career Development Planning</span>
                                        </div>
                                    </td>
                                    <td class="px-6 py-4 text-gray-600">Article</td>
                                    <td class="px-6 py-4 text-gray-600">Career</td>
                                    <td class="px-6 py-4">
                                        <span class="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">Free</span>
                                    </td>
                                    <td class="px-6 py-4 text-gray-600">421</td>
                                    <td class="px-6 py-4 text-gray-600">July 5, 2023</td>
                                    <td class="px-6 py-4">
                                        <div class="flex space-x-2">
                                            <button class="text-gray-500 hover:text-gray-700">
                                                <i class="fa-solid fa-edit"></i>
                                            </button>
                                            <button class="text-gray-500 hover:text-gray-700">
                                                <i class="fa-solid fa-eye"></i>
                                            </button>
                                            <button class="text-gray-500 hover:text-red-600">
                                                <i class="fa-solid fa-trash"></i>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    
                    <!-- Pagination -->
                    <div class="flex items-center justify-between mt-4">
                        <div class="text-sm text-gray-600">
                            Showing 1-6 of 24 items
                        </div>
                        <div class="flex items-center space-x-2">
                            <button class="px-3 py-1 border border-gray-300 rounded-md text-gray-600 hover:bg-gray-50 disabled:opacity-50" disabled="">
                                <i class="fa-solid fa-chevron-left"></i>
                            </button>
                            <button class="px-3 py-1 bg-primary text-white rounded-md">1</button>
                            <button class="px-3 py-1 border border-gray-300 rounded-md text-gray-600 hover:bg-gray-50">2</button>
                            <button class="px-3 py-1 border border-gray-300 rounded-md text-gray-600 hover:bg-gray-50">3</button>
                            <button class="px-3 py-1 border border-gray-300 rounded-md text-gray-600 hover:bg-gray-50">4</button>
                            <button class="px-3 py-1 border border-gray-300 rounded-md text-gray-600 hover:bg-gray-50">
                                <i class="fa-solid fa-chevron-right"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

</body></html>

<html><head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <script src="https://cdn.tailwindcss.com"></script>
    <script> window.FontAwesomeConfig = { autoReplaceSvg: 'nest'};</script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/js/all.min.js" crossorigin="anonymous" referrerpolicy="no-referrer"></script>
    <style>::-webkit-scrollbar { display: none;}</style>
    
    <script src="https://cdn.jsdelivr.net/npm/@tiptap/core@2.0.0-beta.209/dist/tiptap-core.umd.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/@tiptap/starter-kit@2.0.0-beta.209/dist/tiptap-starter-kit.umd.min.js"></script>
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
                    <span class="flex items-center px-3 py-2 text-sm text-primary bg-blue-50 rounded-md mb-1 font-medium cursor-pointer">
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
                    <h1 class="text-xl font-bold text-gray-800">Homepage Content Editor</h1>
                    <p class="text-sm text-gray-500">Edit landing page content blocks</p>
                </div>
                
                <div class="flex items-center space-x-4">
                    <div class="flex items-center space-x-2 text-sm">
                        <span class="text-gray-600">Last saved: 2 minutes ago</span>
                        <span class="flex items-center text-green-600">
                            <i class="fa-solid fa-circle text-xs mr-1"></i>
                            Autosaving
                        </span>
                    </div>
                    
                    <div class="flex items-center space-x-2">
                        <button class="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-md flex items-center">
                            <i class="fa-solid fa-eye mr-2"></i>
                            Preview
                        </button>
                        <button class="px-3 py-1.5 text-sm bg-primary hover:bg-primary/90 text-white rounded-md flex items-center">
                            <i class="fa-solid fa-globe mr-2"></i>
                            Publish
                        </button>
                    </div>
                </div>
            </header>
            
            <!-- Content Editor -->
            <div id="content-editor" class="p-6">
                <!-- Section Navigation -->
                <div id="section-navigation" class="flex items-center space-x-2 mb-6 overflow-x-auto pb-2">
                    <button class="px-4 py-2 bg-primary text-white rounded-md text-sm font-medium flex items-center">
                        <i class="fa-solid fa-heading mr-2"></i>
                        Hero Section
                    </button>
                    <button class="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md text-sm font-medium flex items-center">
                        <i class="fa-solid fa-list-ul mr-2"></i>
                        Features
                    </button>
                    <button class="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md text-sm font-medium flex items-center">
                        <i class="fa-solid fa-play-circle mr-2"></i>
                        Demo Media
                    </button>
                    <button class="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md text-sm font-medium flex items-center">
                        <i class="fa-solid fa-quote-right mr-2"></i>
                        Testimonials
                    </button>
                    <button class="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md text-sm font-medium flex items-center">
                        <i class="fa-solid fa-tag mr-2"></i>
                        Pricing
                    </button>
                    <button class="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md text-sm font-medium flex items-center">
                        <i class="fa-solid fa-question-circle mr-2"></i>
                        FAQ
                    </button>
                </div>
                
                <!-- Hero Section Editor -->
                <div id="hero-section-editor" class="bg-white border border-gray-200 rounded-lg mb-6">
                    <div class="border-b border-gray-200 px-6 py-4 flex justify-between items-center">
                        <h2 class="font-medium text-gray-800">Hero Section</h2>
                        <div class="flex items-center space-x-2">
                            <button class="p-1.5 text-gray-500 hover:bg-gray-100 rounded">
                                <i class="fa-solid fa-copy"></i>
                            </button>
                            <button class="p-1.5 text-gray-500 hover:bg-gray-100 rounded">
                                <i class="fa-solid fa-trash-alt"></i>
                            </button>
                            <button class="p-1.5 text-gray-500 hover:bg-gray-100 rounded">
                                <i class="fa-solid fa-chevron-up"></i>
                            </button>
                        </div>
                    </div>
                    
                    <div class="p-6 space-y-6">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Headline</label>
                            <input type="text" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary" value="AI Coaching That Transforms Your Team">
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Subheadline</label>
                            <textarea class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary" rows="2">Personalized coaching at scale. UpCoach helps your team develop leadership skills, manage stress, and improve performance with AI-powered insights.</textarea>
                        </div>
                        
                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">Primary Button Text</label>
                                <input type="text" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary" value="Start Free Trial">
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">Primary Button URL</label>
                                <input type="text" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary" value="/signup">
                            </div>
                        </div>
                        
                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">Secondary Button Text</label>
                                <input type="text" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary" value="Watch Demo">
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">Secondary Button URL</label>
                                <input type="text" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary" value="#demo-section">
                            </div>
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Hero Image</label>
                            <div class="border border-dashed border-gray-300 rounded-md p-4 flex flex-col items-center justify-center">
                                <img src="https://storage.googleapis.com/uxpilot-auth.appspot.com/default-placeholder.png" alt="Hero Image" class="w-64 h-40 object-cover mb-3 rounded">
                                <div class="flex items-center space-x-2">
                                    <button class="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded text-sm">Replace Image</button>
                                    <button class="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded text-sm">Remove</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Features Section Editor -->
                <div id="features-section-editor" class="bg-white border border-gray-200 rounded-lg mb-6">
                    <div class="border-b border-gray-200 px-6 py-4 flex justify-between items-center">
                        <h2 class="font-medium text-gray-800">Features Section</h2>
                        <div class="flex items-center space-x-2">
                            <button class="p-1.5 text-gray-500 hover:bg-gray-100 rounded">
                                <i class="fa-solid fa-copy"></i>
                            </button>
                            <button class="p-1.5 text-gray-500 hover:bg-gray-100 rounded">
                                <i class="fa-solid fa-trash-alt"></i>
                            </button>
                            <button class="p-1.5 text-gray-500 hover:bg-gray-100 rounded">
                                <i class="fa-solid fa-chevron-down"></i>
                            </button>
                        </div>
                    </div>
                    
                    <div class="p-6 space-y-6">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Section Title</label>
                            <input type="text" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary" value="Key Features">
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Section Description</label>
                            <textarea class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary" rows="2">Discover how UpCoach can transform your team with AI-powered coaching that's available 24/7.</textarea>
                        </div>
                        
                        <div class="space-y-4">
                            <div class="flex justify-between items-center">
                                <h3 class="text-sm font-medium text-gray-700">Feature Cards</h3>
                                <button class="px-3 py-1.5 bg-primary hover:bg-primary/90 text-white rounded-md text-sm flex items-center">
                                    <i class="fa-solid fa-plus mr-2"></i>
                                    Add Feature
                                </button>
                            </div>
                            
                            <!-- Feature Card 1 -->
                            <div class="border border-gray-200 rounded-md p-4 space-y-4">
                                <div class="flex justify-between items-center">
                                    <h4 class="font-medium">Feature 1</h4>
                                    <div class="flex items-center space-x-2">
                                        <button class="p-1 text-gray-500 hover:bg-gray-100 rounded">
                                            <i class="fa-solid fa-arrow-up"></i>
                                        </button>
                                        <button class="p-1 text-gray-500 hover:bg-gray-100 rounded">
                                            <i class="fa-solid fa-arrow-down"></i>
                                        </button>
                                        <button class="p-1 text-gray-500 hover:bg-gray-100 rounded">
                                            <i class="fa-solid fa-trash-alt"></i>
                                        </button>
                                    </div>
                                </div>
                                
                                <div class="grid grid-cols-12 gap-4">
                                    <div class="col-span-1">
                                        <label class="block text-xs font-medium text-gray-700 mb-1">Icon</label>
                                        <button class="w-full aspect-square flex items-center justify-center border border-gray-300 rounded-md bg-gray-50">
                                            <i class="fa-solid fa-brain text-primary text-xl"></i>
                                        </button>
                                    </div>
                                    <div class="col-span-11 space-y-3">
                                        <div>
                                            <label class="block text-xs font-medium text-gray-700 mb-1">Title</label>
                                            <input type="text" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary" value="AI-Powered Insights">
                                        </div>
                                        <div>
                                            <label class="block text-xs font-medium text-gray-700 mb-1">Description</label>
                                            <textarea class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary" rows="2">Get personalized coaching recommendations based on real-time data and behavior patterns.</textarea>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Feature Card 2 -->
                            <div class="border border-gray-200 rounded-md p-4 space-y-4">
                                <div class="flex justify-between items-center">
                                    <h4 class="font-medium">Feature 2</h4>
                                    <div class="flex items-center space-x-2">
                                        <button class="p-1 text-gray-500 hover:bg-gray-100 rounded">
                                            <i class="fa-solid fa-arrow-up"></i>
                                        </button>
                                        <button class="p-1 text-gray-500 hover:bg-gray-100 rounded">
                                            <i class="fa-solid fa-arrow-down"></i>
                                        </button>
                                        <button class="p-1 text-gray-500 hover:bg-gray-100 rounded">
                                            <i class="fa-solid fa-trash-alt"></i>
                                        </button>
                                    </div>
                                </div>
                                
                                <div class="grid grid-cols-12 gap-4">
                                    <div class="col-span-1">
                                        <label class="block text-xs font-medium text-gray-700 mb-1">Icon</label>
                                        <button class="w-full aspect-square flex items-center justify-center border border-gray-300 rounded-md bg-gray-50">
                                            <i class="fa-solid fa-clock text-primary text-xl"></i>
                                        </button>
                                    </div>
                                    <div class="col-span-11 space-y-3">
                                        <div>
                                            <label class="block text-xs font-medium text-gray-700 mb-1">Title</label>
                                            <input type="text" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary" value="24/7 Availability">
                                        </div>
                                        <div>
                                            <label class="block text-xs font-medium text-gray-700 mb-1">Description</label>
                                            <textarea class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary" rows="2">Access coaching anytime, anywhere. UpCoach is always ready to help your team develop new skills.</textarea>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Feature Card 3 -->
                            <div class="border border-gray-200 rounded-md p-4 space-y-4">
                                <div class="flex justify-between items-center">
                                    <h4 class="font-medium">Feature 3</h4>
                                    <div class="flex items-center space-x-2">
                                        <button class="p-1 text-gray-500 hover:bg-gray-100 rounded">
                                            <i class="fa-solid fa-arrow-up"></i>
                                        </button>
                                        <button class="p-1 text-gray-500 hover:bg-gray-100 rounded">
                                            <i class="fa-solid fa-arrow-down"></i>
                                        </button>
                                        <button class="p-1 text-gray-500 hover:bg-gray-100 rounded">
                                            <i class="fa-solid fa-trash-alt"></i>
                                        </button>
                                    </div>
                                </div>
                                
                                <div class="grid grid-cols-12 gap-4">
                                    <div class="col-span-1">
                                        <label class="block text-xs font-medium text-gray-700 mb-1">Icon</label>
                                        <button class="w-full aspect-square flex items-center justify-center border border-gray-300 rounded-md bg-gray-50">
                                            <i class="fa-solid fa-chart-line text-primary text-xl"></i>
                                        </button>
                                    </div>
                                    <div class="col-span-11 space-y-3">
                                        <div>
                                            <label class="block text-xs font-medium text-gray-700 mb-1">Title</label>
                                            <input type="text" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary" value="Progress Tracking">
                                        </div>
                                        <div>
                                            <label class="block text-xs font-medium text-gray-700 mb-1">Description</label>
                                            <textarea class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary" rows="2">Monitor individual and team growth with detailed analytics and performance metrics.</textarea>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Demo Media Section Editor -->
                <div id="demo-media-section-editor" class="bg-white border border-gray-200 rounded-lg mb-6">
                    <div class="border-b border-gray-200 px-6 py-4 flex justify-between items-center">
                        <h2 class="font-medium text-gray-800">Demo Media Section</h2>
                        <div class="flex items-center space-x-2">
                            <button class="p-1.5 text-gray-500 hover:bg-gray-100 rounded">
                                <i class="fa-solid fa-copy"></i>
                            </button>
                            <button class="p-1.5 text-gray-500 hover:bg-gray-100 rounded">
                                <i class="fa-solid fa-trash-alt"></i>
                            </button>
                            <button class="p-1.5 text-gray-500 hover:bg-gray-100 rounded">
                                <i class="fa-solid fa-chevron-down"></i>
                            </button>
                        </div>
                    </div>
                    
                    <div class="p-6 space-y-6">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Section Title</label>
                            <input type="text" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary" value="See UpCoach in Action">
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Section Description</label>
                            <textarea class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary" rows="2">Watch how UpCoach helps teams develop leadership skills and improve performance with AI coaching.</textarea>
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Media Type</label>
                            <div class="flex space-x-4">
                                <label class="flex items-center">
                                    <input type="radio" name="mediaType" class="mr-2" checked="">
                                    <span>YouTube</span>
                                </label>
                                <label class="flex items-center">
                                    <input type="radio" name="mediaType" class="mr-2">
                                    <span>MP4 Video</span>
                                </label>
                                <label class="flex items-center">
                                    <input type="radio" name="mediaType" class="mr-2">
                                    <span>Image</span>
                                </label>
                            </div>
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">YouTube Video ID</label>
                            <input type="text" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary" value="dQw4w9WgXcQ">
                            <p class="mt-1 text-xs text-gray-500">Enter only the video ID (e.g., dQw4w9WgXcQ from https://www.youtube.com/watch?v=dQw4w9WgXcQ)</p>
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Preview</label>
                            <div class="border border-gray-200 rounded-md p-4 bg-gray-50">
                                <div class="aspect-video bg-black rounded-md flex items-center justify-center text-white">
                                    <i class="fa-brands fa-youtube text-6xl"></i>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Testimonials Section Editor -->
                <div id="testimonials-section-editor" class="bg-white border border-gray-200 rounded-lg mb-6">
                    <div class="border-b border-gray-200 px-6 py-4 flex justify-between items-center">
                        <h2 class="font-medium text-gray-800">Testimonials Section</h2>
                        <div class="flex items-center space-x-2">
                            <button class="p-1.5 text-gray-500 hover:bg-gray-100 rounded">
                                <i class="fa-solid fa-copy"></i>
                            </button>
                            <button class="p-1.5 text-gray-500 hover:bg-gray-100 rounded">
                                <i class="fa-solid fa-trash-alt"></i>
                            </button>
                            <button class="p-1.5 text-gray-500 hover:bg-gray-100 rounded">
                                <i class="fa-solid fa-chevron-down"></i>
                            </button>
                        </div>
                    </div>
                    
                    <div class="p-6 space-y-6">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Section Title</label>
                            <input type="text" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary" value="What Our Customers Say">
                        </div>
                        
                        <div class="space-y-4">
                            <div class="flex justify-between items-center">
                                <h3 class="text-sm font-medium text-gray-700">Testimonial Cards</h3>
                                <button class="px-3 py-1.5 bg-primary hover:bg-primary/90 text-white rounded-md text-sm flex items-center">
                                    <i class="fa-solid fa-plus mr-2"></i>
                                    Add Testimonial
                                </button>
                            </div>
                            
                            <!-- Testimonial 1 -->
                            <div class="border border-gray-200 rounded-md p-4 space-y-4">
                                <div class="flex justify-between items-center">
                                    <h4 class="font-medium">Testimonial 1</h4>
                                    <div class="flex items-center space-x-2">
                                        <button class="p-1 text-gray-500 hover:bg-gray-100 rounded">
                                            <i class="fa-solid fa-arrow-up"></i>
                                        </button>
                                        <button class="p-1 text-gray-500 hover:bg-gray-100 rounded">
                                            <i class="fa-solid fa-arrow-down"></i>
                                        </button>
                                        <button class="p-1 text-gray-500 hover:bg-gray-100 rounded">
                                            <i class="fa-solid fa-trash-alt"></i>
                                        </button>
                                    </div>
                                </div>
                                
                                <div class="grid grid-cols-12 gap-4">
                                    <div class="col-span-2">
                                        <label class="block text-xs font-medium text-gray-700 mb-1">Avatar</label>
                                        <div class="border border-dashed border-gray-300 rounded-md p-2 flex flex-col items-center">
                                            <img src="https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-1.jpg" alt="Avatar" class="w-16 h-16 object-cover rounded-full mb-2">
                                            <button class="text-xs text-primary">Change</button>
                                        </div>
                                    </div>
                                    <div class="col-span-10 space-y-3">
                                        <div>
                                            <label class="block text-xs font-medium text-gray-700 mb-1">Name</label>
                                            <input type="text" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary" value="Sarah Johnson">
                                        </div>
                                        <div>
                                            <label class="block text-xs font-medium text-gray-700 mb-1">Role &amp; Company</label>
                                            <input type="text" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary" value="HR Director, TechCorp">
                                        </div>
                                        <div>
                                            <label class="block text-xs font-medium text-gray-700 mb-1">Quote</label>
                                            <textarea class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary" rows="3">UpCoach has transformed how we develop talent at TechCorp. Our team members love having 24/7 access to personalized coaching, and we've seen measurable improvements in leadership skills across the organization.</textarea>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Testimonial 2 -->
                            <div class="border border-gray-200 rounded-md p-4 space-y-4">
                                <div class="flex justify-between items-center">
                                    <h4 class="font-medium">Testimonial 2</h4>
                                    <div class="flex items-center space-x-2">
                                        <button class="p-1 text-gray-500 hover:bg-gray-100 rounded">
                                            <i class="fa-solid fa-arrow-up"></i>
                                        </button>
                                        <button class="p-1 text-gray-500 hover:bg-gray-100 rounded">
                                            <i class="fa-solid fa-arrow-down"></i>
                                        </button>
                                        <button class="p-1 text-gray-500 hover:bg-gray-100 rounded">
                                            <i class="fa-solid fa-trash-alt"></i>
                                        </button>
                                    </div>
                                </div>
                                
                                <div class="grid grid-cols-12 gap-4">
                                    <div class="col-span-2">
                                        <label class="block text-xs font-medium text-gray-700 mb-1">Avatar</label>
                                        <div class="border border-dashed border-gray-300 rounded-md p-2 flex flex-col items-center">
                                            <img src="https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-2.jpg" alt="Avatar" class="w-16 h-16 object-cover rounded-full mb-2">
                                            <button class="text-xs text-primary">Change</button>
                                        </div>
                                    </div>
                                    <div class="col-span-10 space-y-3">
                                        <div>
                                            <label class="block text-xs font-medium text-gray-700 mb-1">Name</label>
                                            <input type="text" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary" value="Michael Chen">
                                        </div>
                                        <div>
                                            <label class="block text-xs font-medium text-gray-700 mb-1">Role &amp; Company</label>
                                            <input type="text" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary" value="Team Lead, InnovateCo">
                                        </div>
                                        <div>
                                            <label class="block text-xs font-medium text-gray-700 mb-1">Quote</label>
                                            <textarea class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary" rows="3">As a team lead, I needed a solution that could help my team members grow without taking up all my time. UpCoach has been that solution. The AI coaching provides personalized guidance, and the analytics help me understand where to focus my efforts.</textarea>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Add Section Button -->
                <div class="flex justify-center mb-6">
                    <button class="px-4 py-2 border border-dashed border-gray-300 rounded-md text-gray-500 hover:text-primary hover:border-primary flex items-center">
                        <i class="fa-solid fa-plus mr-2"></i>
                        Add New Section
                    </button>
                </div>
            </div>
        </div>
    </div>
    
    <script>
        // Simulated autosave functionality
        const inputs = document.querySelectorAll('input, textarea');
        inputs.forEach(input => {
            input.addEventListener('change', () => {
                // In a real implementation, this would send data to the server
                console.log('Content changed, autosaving...');
                
                // Update the last saved text
                const lastSavedSpan = document.querySelector('#header .text-gray-600');
                lastSavedSpan.textContent = 'Last saved: just now';
                
                // After a delay, update to "2 minutes ago"
                setTimeout(() => {
                    lastSavedSpan.textContent = 'Last saved: 2 minutes ago';
                }, 2000);
            });
        });
    </script>

</body></html>

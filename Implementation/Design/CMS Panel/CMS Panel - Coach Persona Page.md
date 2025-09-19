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
                    <span class="flex items-center px-3 py-2 text-sm text-primary bg-blue-50 rounded-md mb-1 font-medium cursor-pointer">
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
                    <h1 class="text-xl font-bold text-gray-800">Coach Persona Management</h1>
                    <p class="text-sm text-gray-500">Configure AI coach avatars and personalities</p>
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
            
            <!-- Avatar Management Content -->
            <div class="p-6">
                <div id="avatar-management-header" class="flex justify-between items-center mb-6">
                    <div>
                        <h2 class="text-lg font-semibold text-gray-800">AI Coach Personas</h2>
                        <p class="text-sm text-gray-500">Configure the personalities and appearances of AI coaches</p>
                    </div>
                    <button class="flex items-center px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90">
                        <i class="fa-solid fa-plus mr-2"></i>
                        Add New Coach
                    </button>
                </div>
                
                <!-- Avatar List -->
                <div id="avatar-list" class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <!-- Coach Card 1 -->
                    <div id="coach-card-1" class="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                        <div class="p-4 border-b border-gray-200 flex justify-between items-center">
                            <h3 class="font-medium">Emma</h3>
                            <div class="flex space-x-2">
                                <button class="text-gray-500 hover:text-primary">
                                    <i class="fa-solid fa-edit"></i>
                                </button>
                                <button class="text-gray-500 hover:text-red-500">
                                    <i class="fa-solid fa-trash-alt"></i>
                                </button>
                            </div>
                        </div>
                        <div class="p-4">
                            <div class="flex mb-4">
                                <div class="w-20 h-20 rounded-full bg-gray-200 overflow-hidden">
                                    <img src="https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-5.jpg" alt="Emma" class="w-full h-full object-cover">
                                </div>
                                <div class="ml-4 flex-1">
                                    <div class="mb-2">
                                        <span class="text-xs text-gray-500">Personality</span>
                                        <p class="text-sm font-medium">Empathetic</p>
                                    </div>
                                    <div>
                                        <span class="text-xs text-gray-500">Voice Type</span>
                                        <p class="text-sm font-medium">Warm Female</p>
                                    </div>
                                </div>
                            </div>
                            <div class="border-t border-gray-200 pt-3">
                                <span class="text-xs text-gray-500">Last Updated</span>
                                <p class="text-sm">July 12, 2023</p>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Coach Card 2 -->
                    <div id="coach-card-2" class="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                        <div class="p-4 border-b border-gray-200 flex justify-between items-center">
                            <h3 class="font-medium">Michael</h3>
                            <div class="flex space-x-2">
                                <button class="text-gray-500 hover:text-primary">
                                    <i class="fa-solid fa-edit"></i>
                                </button>
                                <button class="text-gray-500 hover:text-red-500">
                                    <i class="fa-solid fa-trash-alt"></i>
                                </button>
                            </div>
                        </div>
                        <div class="p-4">
                            <div class="flex mb-4">
                                <div class="w-20 h-20 rounded-full bg-gray-200 overflow-hidden">
                                    <img src="https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-2.jpg" alt="Michael" class="w-full h-full object-cover">
                                </div>
                                <div class="ml-4 flex-1">
                                    <div class="mb-2">
                                        <span class="text-xs text-gray-500">Personality</span>
                                        <p class="text-sm font-medium">Tough Love</p>
                                    </div>
                                    <div>
                                        <span class="text-xs text-gray-500">Voice Type</span>
                                        <p class="text-sm font-medium">Authoritative Male</p>
                                    </div>
                                </div>
                            </div>
                            <div class="border-t border-gray-200 pt-3">
                                <span class="text-xs text-gray-500">Last Updated</span>
                                <p class="text-sm">June 28, 2023</p>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Coach Card 3 -->
                    <div id="coach-card-3" class="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                        <div class="p-4 border-b border-gray-200 flex justify-between items-center">
                            <h3 class="font-medium">Sarah</h3>
                            <div class="flex space-x-2">
                                <button class="text-gray-500 hover:text-primary">
                                    <i class="fa-solid fa-edit"></i>
                                </button>
                                <button class="text-gray-500 hover:text-red-500">
                                    <i class="fa-solid fa-trash-alt"></i>
                                </button>
                            </div>
                        </div>
                        <div class="p-4">
                            <div class="flex mb-4">
                                <div class="w-20 h-20 rounded-full bg-gray-200 overflow-hidden">
                                    <img src="https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-1.jpg" alt="Sarah" class="w-full h-full object-cover">
                                </div>
                                <div class="ml-4 flex-1">
                                    <div class="mb-2">
                                        <span class="text-xs text-gray-500">Personality</span>
                                        <p class="text-sm font-medium">Energetic</p>
                                    </div>
                                    <div>
                                        <span class="text-xs text-gray-500">Voice Type</span>
                                        <p class="text-sm font-medium">Upbeat Female</p>
                                    </div>
                                </div>
                            </div>
                            <div class="border-t border-gray-200 pt-3">
                                <span class="text-xs text-gray-500">Last Updated</span>
                                <p class="text-sm">July 5, 2023</p>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Coach Editor Form -->
                <div id="coach-editor" class="bg-white border border-gray-200 rounded-lg p-6 mb-8">
                    <div class="flex justify-between items-center mb-6">
                        <h3 class="text-lg font-semibold">Edit Coach: Emma</h3>
                        <button class="text-gray-500">
                            <i class="fa-solid fa-times"></i>
                        </button>
                    </div>
                    
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <!-- Left Column - Thumbnail Upload -->
                        <div id="thumbnail-upload" class="flex flex-col items-center">
                            <div class="w-40 h-40 rounded-full bg-gray-200 overflow-hidden mb-4">
                                <img src="https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-5.jpg" alt="Emma" class="w-full h-full object-cover">
                            </div>
                            <button class="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 mb-2">
                                <i class="fa-solid fa-upload mr-2"></i>
                                Change Photo
                            </button>
                            <p class="text-xs text-gray-500 text-center">
                                Recommended: Square image, at least 512x512px
                            </p>
                        </div>
                        
                        <!-- Middle Column - Coach Details -->
                        <div id="coach-details" class="space-y-4">
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">Coach Name</label>
                                <input type="text" value="Emma" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent">
                            </div>
                            
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">Coaching Tone/Personality</label>
                                <select class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent">
                                    <option value="empathetic">Empathetic</option>
                                    <option value="tough-love">Tough Love</option>
                                    <option value="energetic">Energetic</option>
                                    <option value="analytical">Analytical</option>
                                    <option value="supportive">Supportive</option>
                                    <option value="challenging">Challenging</option>
                                </select>
                            </div>
                            
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">Voice Type</label>
                                <select class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent">
                                    <option value="warm-female">Warm Female</option>
                                    <option value="authoritative-male">Authoritative Male</option>
                                    <option value="upbeat-female">Upbeat Female</option>
                                    <option value="calm-male">Calm Male</option>
                                    <option value="professional-female">Professional Female</option>
                                    <option value="friendly-male">Friendly Male</option>
                                </select>
                            </div>
                        </div>
                        
                        <!-- Right Column - Additional Settings -->
                        <div id="additional-settings" class="space-y-4">
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">Coaching Specialties</label>
                                <div class="flex flex-wrap gap-2 mb-2">
                                    <span class="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs flex items-center">
                                        Leadership
                                        <button class="ml-1 text-blue-800">
                                            <i class="fa-solid fa-times"></i>
                                        </button>
                                    </span>
                                    <span class="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs flex items-center">
                                        Communication
                                        <button class="ml-1 text-blue-800">
                                            <i class="fa-solid fa-times"></i>
                                        </button>
                                    </span>
                                    <span class="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs flex items-center">
                                        Emotional Intelligence
                                        <button class="ml-1 text-blue-800">
                                            <i class="fa-solid fa-times"></i>
                                        </button>
                                    </span>
                                </div>
                                <div class="flex">
                                    <input type="text" placeholder="Add specialty..." class="flex-1 px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent">
                                    <button class="px-3 py-2 bg-primary text-white rounded-r-md">
                                        <i class="fa-solid fa-plus"></i>
                                    </button>
                                </div>
                            </div>
                            
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">Active Status</label>
                                <div class="flex items-center">
                                    <label class="inline-flex items-center cursor-pointer">
                                        <input type="checkbox" class="sr-only peer" checked="">
                                        <div class="relative w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                                        <span class="ml-3 text-sm font-medium text-gray-700">Available in mobile app</span>
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="border-t border-gray-200 mt-8 pt-6 flex justify-between">
                        <div>
                            <button class="px-4 py-2 border border-red-300 text-red-600 rounded-md hover:bg-red-50">
                                <i class="fa-solid fa-trash-alt mr-2"></i>
                                Delete Coach
                            </button>
                        </div>
                        <div class="flex space-x-3">
                            <button class="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50">
                                Cancel
                            </button>
                            <button class="px-6 py-2 bg-primary text-white rounded-md hover:bg-primary/90">
                                Save Changes
                            </button>
                        </div>
                    </div>
                </div>
                
                <!-- Version History -->
                <div id="version-history" class="bg-white border border-gray-200 rounded-lg overflow-hidden">
                    <div class="p-4 border-b border-gray-200">
                        <h3 class="font-medium">Version History</h3>
                    </div>
                    <div class="p-4">
                        <table class="w-full">
                            <thead>
                                <tr class="text-left text-xs text-gray-500 uppercase">
                                    <th class="pb-3 pl-2">Date</th>
                                    <th class="pb-3">Coach</th>
                                    <th class="pb-3">Changes</th>
                                    <th class="pb-3">Editor</th>
                                    <th class="pb-3 text-right pr-2">Actions</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-gray-200">
                                <tr class="hover:bg-gray-50">
                                    <td class="py-3 pl-2 text-sm">July 12, 2023</td>
                                    <td class="py-3 text-sm font-medium">Emma</td>
                                    <td class="py-3 text-sm">Voice type updated</td>
                                    <td class="py-3 text-sm">Alex Morgan</td>
                                    <td class="py-3 text-sm text-right pr-2">
                                        <button class="text-primary hover:text-primary/80">Restore</button>
                                    </td>
                                </tr>
                                <tr class="hover:bg-gray-50">
                                    <td class="py-3 pl-2 text-sm">July 5, 2023</td>
                                    <td class="py-3 text-sm font-medium">Sarah</td>
                                    <td class="py-3 text-sm">New coach created</td>
                                    <td class="py-3 text-sm">Alex Morgan</td>
                                    <td class="py-3 text-sm text-right pr-2">
                                        <button class="text-primary hover:text-primary/80">Restore</button>
                                    </td>
                                </tr>
                                <tr class="hover:bg-gray-50">
                                    <td class="py-3 pl-2 text-sm">June 28, 2023</td>
                                    <td class="py-3 text-sm font-medium">Michael</td>
                                    <td class="py-3 text-sm">Personality updated</td>
                                    <td class="py-3 text-sm">Jamie Lewis</td>
                                    <td class="py-3 text-sm text-right pr-2">
                                        <button class="text-primary hover:text-primary/80">Restore</button>
                                    </td>
                                </tr>
                                <tr class="hover:bg-gray-50">
                                    <td class="py-3 pl-2 text-sm">June 15, 2023</td>
                                    <td class="py-3 text-sm font-medium">Emma</td>
                                    <td class="py-3 text-sm">Thumbnail updated</td>
                                    <td class="py-3 text-sm">Alex Morgan</td>
                                    <td class="py-3 text-sm text-right pr-2">
                                        <button class="text-primary hover:text-primary/80">Restore</button>
                                    </td>
                                </tr>
                                <tr class="hover:bg-gray-50">
                                    <td class="py-3 pl-2 text-sm">June 10, 2023</td>
                                    <td class="py-3 text-sm font-medium">Michael</td>
                                    <td class="py-3 text-sm">New coach created</td>
                                    <td class="py-3 text-sm">Jamie Lewis</td>
                                    <td class="py-3 text-sm text-right pr-2">
                                        <button class="text-primary hover:text-primary/80">Restore</button>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    </div>

</body></html>

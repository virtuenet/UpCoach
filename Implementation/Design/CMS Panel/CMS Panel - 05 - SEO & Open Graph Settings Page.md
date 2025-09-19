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
                    <span class="flex items-center px-3 py-2 text-sm text-primary bg-blue-50 rounded-md mb-1 font-medium cursor-pointer">
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
                    <h1 class="text-xl font-bold text-gray-800">SEO Settings</h1>
                    <p class="text-sm text-gray-500">Manage your site's metadata and open graph settings</p>
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
            
            <!-- SEO Content -->
            <div id="seo-content" class="p-6 max-w-5xl mx-auto">
                <!-- Route Selector -->
                <div id="route-selector" class="mb-8">
                    <label for="route" class="block text-sm font-medium text-gray-700 mb-2">Select Route</label>
                    <div class="relative">
                        <select id="route" class="w-full p-3 pr-10 bg-white border border-gray-300 rounded-lg appearance-none focus:outline-none focus:ring-2 focus:ring-primary">
                            <option value="/">Homepage (/)</option>
                            <option value="/blog">Blog (/blog)</option>
                            <option value="/blog/[slug]">Blog Post (/blog/[slug])</option>
                            <option value="/library">Library (/library)</option>
                            <option value="/pricing">Pricing (/pricing)</option>
                            <option value="/about">About (/about)</option>
                            <option value="/contact">Contact (/contact)</option>
                        </select>
                        <div class="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                            <i class="fa-solid fa-chevron-down text-gray-500"></i>
                        </div>
                    </div>
                    <p class="mt-2 text-sm text-gray-500">Select a route to edit its SEO settings. Changes will be reflected immediately.</p>
                </div>

                <div id="seo-form" class="bg-white rounded-lg border border-gray-200 overflow-hidden">
                    <div class="border-b border-gray-200 p-4 bg-gray-50">
                        <div class="flex items-center">
                            <i class="fa-solid fa-globe text-primary mr-2"></i>
                            <h2 class="text-lg font-semibold">SEO &amp; Open Graph Settings for: Homepage (/)</h2>
                        </div>
                    </div>
                    
                    <div class="p-6">
                        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <!-- Left Column - Meta Settings -->
                            <div class="lg:col-span-2 space-y-6">
                                <div id="meta-section">
                                    <h3 class="text-md font-medium text-gray-800 mb-4">Meta Settings</h3>
                                    
                                    <div class="mb-5">
                                        <label for="meta-title" class="block text-sm font-medium text-gray-700 mb-1">Meta Title</label>
                                        <input id="meta-title" type="text" class="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary" value="UpCoach | AI-Powered Coaching Platform for Teams">
                                        <div class="flex justify-between mt-1">
                                            <p class="text-xs text-gray-500">Recommended length: 50-60 characters</p>
                                            <p class="text-xs text-gray-500">59 characters</p>
                                        </div>
                                    </div>
                                    
                                    <div class="mb-5">
                                        <label for="meta-description" class="block text-sm font-medium text-gray-700 mb-1">Meta Description</label>
                                        <textarea id="meta-description" rows="3" class="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary">UpCoach provides AI-powered coaching solutions for teams of all sizes. Improve performance, reduce burnout, and develop leadership skills with personalized coaching.</textarea>
                                        <div class="flex justify-between mt-1">
                                            <p class="text-xs text-gray-500">Recommended length: 150-160 characters</p>
                                            <p class="text-xs text-gray-500">153 characters</p>
                                        </div>
                                    </div>
                                    
                                    <div class="mb-5">
                                        <label for="meta-keywords" class="block text-sm font-medium text-gray-700 mb-1">Meta Keywords</label>
                                        <input id="meta-keywords" type="text" class="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary" value="AI coaching, team development, leadership coaching, burnout prevention, workplace wellness">
                                        <p class="text-xs text-gray-500 mt-1">Separate keywords with commas</p>
                                    </div>
                                </div>
                                
                                <div id="open-graph-section">
                                    <h3 class="text-md font-medium text-gray-800 mb-4">Open Graph Settings</h3>
                                    
                                    <div class="mb-5">
                                        <label for="og-title" class="block text-sm font-medium text-gray-700 mb-1">OG Title</label>
                                        <input id="og-title" type="text" class="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary" value="Transform Your Team with UpCoach AI Coaching">
                                        <div class="flex justify-between mt-1">
                                            <p class="text-xs text-gray-500">Can differ from meta title for social sharing</p>
                                            <p class="text-xs text-gray-500">45 characters</p>
                                        </div>
                                    </div>
                                    
                                    <div class="mb-5">
                                        <label for="og-description" class="block text-sm font-medium text-gray-700 mb-1">OG Description</label>
                                        <textarea id="og-description" rows="3" class="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary">Discover how UpCoach's AI-powered coaching platform can help your team achieve peak performance while preventing burnout. Try it free for 14 days!</textarea>
                                        <p class="text-xs text-gray-500 mt-1">This description appears when sharing on social media</p>
                                    </div>
                                </div>
                                
                                <div id="canonical-section">
                                    <h3 class="text-md font-medium text-gray-800 mb-4">Canonical URL</h3>
                                    
                                    <div class="mb-5">
                                        <label for="canonical-url" class="block text-sm font-medium text-gray-700 mb-1">Canonical URL</label>
                                        <input id="canonical-url" type="text" class="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary" value="https://upcoach.ai/">
                                        <p class="text-xs text-gray-500 mt-1">Set the canonical URL to prevent duplicate content issues</p>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Right Column - Preview & Image -->
                            <div class="lg:col-span-1">
                                <div id="og-image-section" class="mb-6">
                                    <h3 class="text-md font-medium text-gray-800 mb-4">OG Image</h3>
                                    
                                    <div class="border border-gray-200 rounded-lg p-4 bg-gray-50">
                                        <div class="mb-4 aspect-[1200/630] bg-gray-200 rounded-md overflow-hidden">
                                            <img src="https://storage.googleapis.com/uxpilot-auth.appspot.com/default-placeholder.png" alt="OG Image Preview" class="w-full h-full object-cover">
                                        </div>
                                        
                                        <div class="flex justify-between items-center">
                                            <p class="text-xs text-gray-500">Recommended size: 1200 × 630 pixels</p>
                                            <button class="text-primary text-sm font-medium">Replace Image</button>
                                        </div>
                                    </div>
                                </div>
                                
                                <div id="preview-section">
                                    <h3 class="text-md font-medium text-gray-800 mb-4">Preview</h3>
                                    
                                    <div class="border border-gray-200 rounded-lg p-4 bg-gray-50">
                                        <div class="mb-2">
                                            <div class="flex items-center mb-1">
                                                <p class="text-xs text-gray-500 mr-1">Google Search Result</p>
                                                <i class="fa-solid fa-search text-gray-400 text-xs"></i>
                                            </div>
                                            <div class="border border-gray-200 rounded-md p-3 bg-white">
                                                <p class="text-blue-600 text-sm font-medium mb-1 truncate">UpCoach | AI-Powered Coaching Platform for Teams</p>
                                                <p class="text-green-700 text-xs mb-1">https://upcoach.ai/</p>
                                                <p class="text-gray-600 text-xs line-clamp-2">UpCoach provides AI-powered coaching solutions for teams of all sizes. Improve performance, reduce burnout, and develop leadership skills with personalized coaching.</p>
                                            </div>
                                        </div>
                                        
                                        <div>
                                            <div class="flex items-center mb-1">
                                                <p class="text-xs text-gray-500 mr-1">Social Media Share</p>
                                                <i class="fa-brands fa-facebook text-gray-400 text-xs mr-1"></i>
                                                <i class="fa-brands fa-twitter text-gray-400 text-xs mr-1"></i>
                                                <i class="fa-brands fa-linkedin text-gray-400 text-xs"></i>
                                            </div>
                                            <div class="border border-gray-200 rounded-md overflow-hidden bg-white">
                                                <div class="h-32 bg-gray-200">
                                                    <img src="https://storage.googleapis.com/uxpilot-auth.appspot.com/default-placeholder.png" alt="OG Image Preview" class="w-full h-full object-cover">
                                                </div>
                                                <div class="p-3">
                                                    <p class="text-gray-500 text-xs">upcoach.ai</p>
                                                    <p class="text-gray-800 text-sm font-medium mb-1">Transform Your Team with UpCoach AI Coaching</p>
                                                    <p class="text-gray-600 text-xs line-clamp-2">Discover how UpCoach's AI-powered coaching platform can help your team achieve peak performance while preventing burnout. Try it free for 14 days!</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="border-t border-gray-200 p-4 bg-gray-50 flex justify-between items-center">
                        <div class="flex items-center text-sm text-gray-600">
                            <i class="fa-solid fa-clock mr-2"></i>
                            <span>Last updated: Today, 10:23 AM</span>
                        </div>
                        <div class="flex space-x-3">
                            <button class="px-4 py-2 border border-gray-300 bg-white text-gray-700 rounded-md hover:bg-gray-50">
                                Reset
                            </button>
                            <button class="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90">
                                Save Changes
                            </button>
                        </div>
                    </div>
                </div>
                
                <!-- Additional Routes -->
                <div id="additional-routes" class="mt-8">
                    <h3 class="text-lg font-medium text-gray-800 mb-4">All Routes</h3>
                    
                    <div class="bg-white rounded-lg border border-gray-200 overflow-hidden">
                        <table class="w-full">
                            <thead>
                                <tr class="bg-gray-50 text-left">
                                    <th class="px-6 py-3 text-xs font-medium text-gray-500 uppercase">Route</th>
                                    <th class="px-6 py-3 text-xs font-medium text-gray-500 uppercase">Meta Title</th>
                                    <th class="px-6 py-3 text-xs font-medium text-gray-500 uppercase">Last Updated</th>
                                    <th class="px-6 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                                    <th class="px-6 py-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-gray-200">
                                <tr class="bg-blue-50">
                                    <td class="px-6 py-4">
                                        <div class="flex items-center">
                                            <i class="fa-solid fa-home text-gray-400 mr-2"></i>
                                            <span class="font-medium text-gray-800">/</span>
                                        </div>
                                    </td>
                                    <td class="px-6 py-4 text-gray-600 truncate max-w-xs">UpCoach | AI-Powered Coaching Platform for Teams</td>
                                    <td class="px-6 py-4 text-gray-600">Today, 10:23 AM</td>
                                    <td class="px-6 py-4">
                                        <span class="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">Active</span>
                                    </td>
                                    <td class="px-6 py-4">
                                        <span class="text-primary font-medium">Currently Editing</span>
                                    </td>
                                </tr>
                                <tr>
                                    <td class="px-6 py-4">
                                        <div class="flex items-center">
                                            <i class="fa-solid fa-newspaper text-gray-400 mr-2"></i>
                                            <span class="font-medium text-gray-800">/blog</span>
                                        </div>
                                    </td>
                                    <td class="px-6 py-4 text-gray-600 truncate max-w-xs">UpCoach Blog | Coaching Tips &amp; Leadership Resources</td>
                                    <td class="px-6 py-4 text-gray-600">Yesterday, 2:15 PM</td>
                                    <td class="px-6 py-4">
                                        <span class="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">Active</span>
                                    </td>
                                    <td class="px-6 py-4">
                                        <button class="text-primary hover:text-primary-dark">Edit</button>
                                    </td>
                                </tr>
                                <tr>
                                    <td class="px-6 py-4">
                                        <div class="flex items-center">
                                            <i class="fa-solid fa-file-alt text-gray-400 mr-2"></i>
                                            <span class="font-medium text-gray-800">/blog/[slug]</span>
                                        </div>
                                    </td>
                                    <td class="px-6 py-4 text-gray-600 truncate max-w-xs">{title} | UpCoach Blog</td>
                                    <td class="px-6 py-4 text-gray-600">July 14, 2023</td>
                                    <td class="px-6 py-4">
                                        <span class="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">Active</span>
                                    </td>
                                    <td class="px-6 py-4">
                                        <button class="text-primary hover:text-primary-dark">Edit</button>
                                    </td>
                                </tr>
                                <tr>
                                    <td class="px-6 py-4">
                                        <div class="flex items-center">
                                            <i class="fa-solid fa-book text-gray-400 mr-2"></i>
                                            <span class="font-medium text-gray-800">/library</span>
                                        </div>
                                    </td>
                                    <td class="px-6 py-4 text-gray-600 truncate max-w-xs">UpCoach Learning Library | Microlearning Resources</td>
                                    <td class="px-6 py-4 text-gray-600">July 10, 2023</td>
                                    <td class="px-6 py-4">
                                        <span class="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">Active</span>
                                    </td>
                                    <td class="px-6 py-4">
                                        <button class="text-primary hover:text-primary-dark">Edit</button>
                                    </td>
                                </tr>
                                <tr>
                                    <td class="px-6 py-4">
                                        <div class="flex items-center">
                                            <i class="fa-solid fa-tag text-gray-400 mr-2"></i>
                                            <span class="font-medium text-gray-800">/pricing</span>
                                        </div>
                                    </td>
                                    <td class="px-6 py-4 text-gray-600 truncate max-w-xs">UpCoach Pricing | Plans &amp; Packages for Teams</td>
                                    <td class="px-6 py-4 text-gray-600">July 5, 2023</td>
                                    <td class="px-6 py-4">
                                        <span class="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">Active</span>
                                    </td>
                                    <td class="px-6 py-4">
                                        <button class="text-primary hover:text-primary-dark">Edit</button>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    </div>
    
    <script>
        // Route selector functionality
        document.getElementById('route').addEventListener('change', function() {
            // This would typically fetch the SEO data for the selected route
            // For demo purposes, we're just showing the current UI
            const routeValue = this.value;
            document.querySelector('#seo-form h2').innerText = `SEO & Open Graph Settings for: ${this.options[this.selectedIndex].text} (${routeValue})`;
        });
    </script>

</body></html>

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
        "primary": {
          "50": "#f0f9ff",
          "100": "#e0f2fe",
          "200": "#bae6fd",
          "300": "#7dd3fc",
          "400": "#38bdf8",
          "500": "#0ea5e9",
          "600": "#0284c7",
          "700": "#0369a1",
          "800": "#075985",
          "900": "#0c4a6e"
        },
        "secondary": {
          "50": "#fdf2f8",
          "100": "#fce7f3",
          "200": "#fbcfe8",
          "300": "#f9a8d4",
          "400": "#f472b6",
          "500": "#ec4899",
          "600": "#db2777",
          "700": "#be185d",
          "800": "#9d174d",
          "900": "#831843"
        },
        "neutral": {
          "50": "#f8fafc",
          "100": "#f1f5f9",
          "200": "#e2e8f0",
          "300": "#cbd5e1",
          "400": "#94a3b8",
          "500": "#64748b",
          "600": "#475569",
          "700": "#334155",
          "800": "#1e293b",
          "900": "#0f172a"
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
<body class="font-sans bg-gray-50 text-neutral-800">
    <!-- Header -->
    <header id="header" class="fixed top-0 left-0 right-0 bg-white shadow-sm z-20 px-4 py-3">
        <div class="flex items-center justify-between">
            <button class="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100">
                <i class="fa-solid fa-arrow-left text-neutral-700"></i>
            </button>
            <h1 class="text-lg font-semibold">Learning Library</h1>
            <button class="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100">
                <i class="fa-solid fa-ellipsis-vertical text-neutral-700"></i>
            </button>
        </div>
    </header>

    <!-- Main Content -->
    <main id="microlearning-library" class="pt-16 pb-20">
        <!-- Search Bar -->
        <div id="search-section" class="px-4 mb-5">
            <div class="relative">
                <input type="text" placeholder="Search for topics, skills, or keywords" class="w-full bg-white border border-gray-200 rounded-full py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
                <div class="absolute left-3 top-1/2 transform -translate-y-1/2">
                    <i class="fa-solid fa-magnifying-glass text-neutral-400"></i>
                </div>
            </div>
        </div>

        <!-- Filters -->
        <div id="filters-section" class="px-4 mb-5">
            <div class="flex space-x-2 overflow-x-auto pb-2">
                <button class="flex-shrink-0 bg-primary-600 text-white rounded-full px-4 py-1.5 text-sm font-medium">
                    All
                </button>
                <button class="flex-shrink-0 bg-white border border-gray-200 text-neutral-700 rounded-full px-4 py-1.5 text-sm">
                    Recommended
                </button>
                <button class="flex-shrink-0 bg-white border border-gray-200 text-neutral-700 rounded-full px-4 py-1.5 text-sm">
                    Articles
                </button>
                <button class="flex-shrink-0 bg-white border border-gray-200 text-neutral-700 rounded-full px-4 py-1.5 text-sm">
                    Videos
                </button>
                <button class="flex-shrink-0 bg-white border border-gray-200 text-neutral-700 rounded-full px-4 py-1.5 text-sm">
                    Quick Tips
                </button>
            </div>
        </div>

        <!-- Featured Content -->
        <div id="featured-section" class="px-4 mb-6">
            <h2 class="text-lg font-semibold mb-3">Featured For You</h2>
            <div class="relative rounded-xl overflow-hidden h-[180px] shadow-sm">
                <div class="absolute inset-0 bg-gradient-to-b from-transparent to-black opacity-70"></div>
                <img class="absolute inset-0 w-full h-full object-cover" src="https://storage.googleapis.com/uxpilot-auth.appspot.com/748e05a8e6-96c6953efde6ab32a02a.png" alt="professional woman giving presentation in modern office with confidence, corporate training concept">
                <div class="absolute bottom-0 left-0 right-0 p-4 text-white">
                    <div class="flex items-center mb-2">
                        <span class="bg-primary-500 text-xs px-2 py-0.5 rounded-full mr-2">10 min</span>
                        <span class="bg-white/20 text-xs px-2 py-0.5 rounded-full">Article</span>
                    </div>
                    <h3 class="font-semibold mb-1">Mastering Confidence in High-Stakes Meetings</h3>
                    <p class="text-xs text-white/80">Learn practical techniques to boost your presence and influence</p>
                </div>
                <button class="absolute top-3 right-3 bg-white/20 backdrop-blur-sm rounded-full w-8 h-8 flex items-center justify-center">
                    <i class="fa-regular fa-bookmark text-white"></i>
                </button>
            </div>
        </div>

        <!-- Recommended Content -->
        <div id="recommended-section" class="px-4 mb-6">
            <div class="flex justify-between items-center mb-3">
                <h2 class="text-lg font-semibold">Recommended By Coach</h2>
                <button class="text-primary-600 text-sm font-medium">See All</button>
            </div>
            
            <div class="space-y-4">
                <div id="content-card-1" class="bg-white rounded-xl shadow-sm overflow-hidden flex">
                    <div class="w-24 h-24 flex-shrink-0 bg-neutral-100">
                        <img class="w-full h-full object-cover" src="https://storage.googleapis.com/uxpilot-auth.appspot.com/e24b20a6b1-33fea27b2c488284559c.png" alt="person meditating at desk in office, mindfulness at work concept">
                    </div>
                    <div class="p-3 flex-1">
                        <div class="flex justify-between items-start">
                            <div class="flex items-center">
                                <span class="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full mr-2">5 min</span>
                                <span class="bg-neutral-100 text-neutral-700 text-xs px-2 py-0.5 rounded-full">Audio</span>
                            </div>
                            <button class="text-neutral-400">
                                <i class="fa-regular fa-bookmark"></i>
                            </button>
                        </div>
                        <h3 class="font-medium text-sm mt-1.5">Quick Desk Meditation for Focus</h3>
                        <p class="text-xs text-neutral-500 mt-1">Reset your mind with this guided practice</p>
                    </div>
                </div>
                
                <div id="content-card-2" class="bg-white rounded-xl shadow-sm overflow-hidden flex">
                    <div class="w-24 h-24 flex-shrink-0 bg-neutral-100">
                        <img class="w-full h-full object-cover" src="https://storage.googleapis.com/uxpilot-auth.appspot.com/42e47af59a-c14cac545940dae95639.png" alt="digital task management board with organized tasks and post-its">
                    </div>
                    <div class="p-3 flex-1">
                        <div class="flex justify-between items-start">
                            <div class="flex items-center">
                                <span class="bg-primary-100 text-primary-700 text-xs px-2 py-0.5 rounded-full mr-2">7 min</span>
                                <span class="bg-neutral-100 text-neutral-700 text-xs px-2 py-0.5 rounded-full">Article</span>
                            </div>
                            <button class="text-neutral-400">
                                <i class="fa-regular fa-bookmark"></i>
                            </button>
                        </div>
                        <h3 class="font-medium text-sm mt-1.5">The 2-Minute Task Prioritization Method</h3>
                        <p class="text-xs text-neutral-500 mt-1">Organize your day efficiently with this technique</p>
                    </div>
                </div>
                
                <div id="content-card-3" class="bg-white rounded-xl shadow-sm overflow-hidden flex">
                    <div class="w-24 h-24 flex-shrink-0 bg-neutral-100">
                        <img class="w-full h-full object-cover" src="https://storage.googleapis.com/uxpilot-auth.appspot.com/748e05a8e6-c8fff44e01ab9a7b753b.png" alt="professional woman giving presentation to colleagues in modern conference room">
                    </div>
                    <div class="p-3 flex-1">
                        <div class="flex justify-between items-start">
                            <div class="flex items-center">
                                <span class="bg-secondary-100 text-secondary-700 text-xs px-2 py-0.5 rounded-full mr-2">12 min</span>
                                <span class="bg-neutral-100 text-neutral-700 text-xs px-2 py-0.5 rounded-full">Video</span>
                            </div>
                            <button class="text-neutral-400">
                                <i class="fa-regular fa-bookmark"></i>
                            </button>
                        </div>
                        <h3 class="font-medium text-sm mt-1.5">Effective Presentation Openers</h3>
                        <p class="text-xs text-neutral-500 mt-1">Hook your audience in the first 30 seconds</p>
                    </div>
                </div>
            </div>
        </div>

        <!-- Topics Section -->
        <div id="topics-section" class="px-4 mb-6">
            <h2 class="text-lg font-semibold mb-3">Browse By Topic</h2>
            <div class="grid grid-cols-2 gap-3">
                <div id="topic-card-1" class="bg-white rounded-xl shadow-sm p-4 border-l-4 border-primary-500">
                    <div class="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center mb-3">
                        <i class="fa-solid fa-brain text-primary-600"></i>
                    </div>
                    <h3 class="font-medium">Focus &amp; Productivity</h3>
                    <p class="text-xs text-neutral-500 mt-1">24 resources</p>
                </div>
                
                <div id="topic-card-2" class="bg-white rounded-xl shadow-sm p-4 border-l-4 border-secondary-500">
                    <div class="w-10 h-10 rounded-full bg-secondary-100 flex items-center justify-center mb-3">
                        <i class="fa-solid fa-comment-dots text-secondary-600"></i>
                    </div>
                    <h3 class="font-medium">Communication</h3>
                    <p class="text-xs text-neutral-500 mt-1">31 resources</p>
                </div>
                
                <div id="topic-card-3" class="bg-white rounded-xl shadow-sm p-4 border-l-4 border-green-500">
                    <div class="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center mb-3">
                        <i class="fa-solid fa-users text-green-600"></i>
                    </div>
                    <h3 class="font-medium">Leadership</h3>
                    <p class="text-xs text-neutral-500 mt-1">18 resources</p>
                </div>
                
                <div id="topic-card-4" class="bg-white rounded-xl shadow-sm p-4 border-l-4 border-purple-500">
                    <div class="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center mb-3">
                        <i class="fa-solid fa-balance-scale text-purple-600"></i>
                    </div>
                    <h3 class="font-medium">Work-Life Balance</h3>
                    <p class="text-xs text-neutral-500 mt-1">15 resources</p>
                </div>
            </div>
        </div>

        <!-- New Content -->
        <div id="new-content-section" class="px-4 mb-6">
            <div class="flex justify-between items-center mb-3">
                <h2 class="text-lg font-semibold">Recently Added</h2>
                <button class="text-primary-600 text-sm font-medium">See All</button>
            </div>
            
            <div class="space-y-4">
                <div id="new-content-1" class="bg-white rounded-xl shadow-sm overflow-hidden">
                    <div class="h-32 bg-neutral-100">
                        <img class="w-full h-full object-cover" src="https://storage.googleapis.com/uxpilot-auth.appspot.com/6faa6a4e9c-a0c2cec4136ac3e6181f.png" alt="team of diverse professionals collaborating in modern office space">
                    </div>
                    <div class="p-3">
                        <div class="flex justify-between items-start mb-2">
                            <div class="flex items-center">
                                <span class="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full mr-2">15 min</span>
                                <span class="bg-neutral-100 text-neutral-700 text-xs px-2 py-0.5 rounded-full">Article</span>
                            </div>
                            <button class="text-neutral-400">
                                <i class="fa-regular fa-bookmark"></i>
                            </button>
                        </div>
                        <h3 class="font-medium">Building Psychological Safety in Teams</h3>
                        <p class="text-xs text-neutral-500 mt-1">Create an environment where team members feel comfortable taking risks</p>
                        <div class="flex items-center mt-3">
                            <button class="flex items-center text-xs text-primary-600 mr-4">
                                <i class="fa-solid fa-play mr-1"></i> Listen
                            </button>
                            <button class="flex items-center text-xs text-primary-600">
                                <i class="fa-solid fa-share-nodes mr-1"></i> Share
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Coach Narrated Content -->
        <div id="narrated-section" class="px-4 mb-8">
            <h2 class="text-lg font-semibold mb-3">Coach Narrated</h2>
            <div class="flex space-x-3 overflow-x-auto pb-2">
                <div id="narrated-card-1" class="flex-shrink-0 w-36 bg-white rounded-xl shadow-sm overflow-hidden">
                    <div class="h-36 bg-neutral-100">
                        <img class="w-full h-full object-cover" src="https://storage.googleapis.com/uxpilot-auth.appspot.com/dc680cea81-c916293cd671c8c3c620.png" alt="person listening to audio content with headphones in office">
                    </div>
                    <div class="p-3">
                        <div class="flex items-center mb-1.5">
                            <span class="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full">8 min</span>
                        </div>
                        <h3 class="text-sm font-medium">Active Listening Guide</h3>
                        <div class="flex items-center mt-2">
                            <i class="fa-solid fa-play text-xs text-primary-600 mr-1.5"></i>
                            <span class="text-xs text-neutral-500">Listen now</span>
                        </div>
                    </div>
                </div>
                
                <div id="narrated-card-2" class="flex-shrink-0 w-36 bg-white rounded-xl shadow-sm overflow-hidden">
                    <div class="h-36 bg-neutral-100">
                        <img class="w-full h-full object-cover" src="https://storage.googleapis.com/uxpilot-auth.appspot.com/3317b65a0c-7e85f968f7badd23dbb5.png" alt="person writing in journal with coffee at desk">
                    </div>
                    <div class="p-3">
                        <div class="flex items-center mb-1.5">
                            <span class="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full">6 min</span>
                        </div>
                        <h3 class="text-sm font-medium">Reflection Journaling</h3>
                        <div class="flex items-center mt-2">
                            <i class="fa-solid fa-play text-xs text-primary-600 mr-1.5"></i>
                            <span class="text-xs text-neutral-500">Listen now</span>
                        </div>
                    </div>
                </div>
                
                <div id="narrated-card-3" class="flex-shrink-0 w-36 bg-white rounded-xl shadow-sm overflow-hidden">
                    <div class="h-36 bg-neutral-100">
                        <img class="w-full h-full object-cover" src="https://storage.googleapis.com/uxpilot-auth.appspot.com/5b4edb59b8-d77a3101af1812f8c582.png" alt="person doing breathing exercise at desk">
                    </div>
                    <div class="p-3">
                        <div class="flex items-center mb-1.5">
                            <span class="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full">4 min</span>
                        </div>
                        <h3 class="text-sm font-medium">Stress Relief Breathing</h3>
                        <div class="flex items-center mt-2">
                            <i class="fa-solid fa-play text-xs text-primary-600 mr-1.5"></i>
                            <span class="text-xs text-neutral-500">Listen now</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </main>

    <!-- Bottom Navigation -->
    <nav id="footer" class="fixed bottom-0 left-0 right-0 bg-white shadow-lg z-20">
        <div class="flex justify-around py-2">
            <span class="flex flex-col items-center py-1 px-3 text-neutral-400 cursor-pointer">
                <i class="fa-solid fa-house text-xl"></i>
                <span class="text-xs mt-1">Home</span>
            </span>
            
            <span class="flex flex-col items-center py-1 px-3 text-neutral-400 cursor-pointer">
                <i class="fa-solid fa-list-check text-xl"></i>
                <span class="text-xs mt-1">Tasks</span>
            </span>
            
            <div class="relative -mt-6">
                <button id="talk-to-coach-button" class="w-14 h-14 rounded-full bg-gradient-to-r from-primary-500 to-secondary-500 flex items-center justify-center shadow-lg">
                    <i class="fa-solid fa-comment-dots text-white text-xl"></i>
                </button>
                <span class="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-xs font-medium text-neutral-600">Coach</span>
            </div>
            
            <span class="flex flex-col items-center py-1 px-3 text-primary-600 cursor-pointer">
                <i class="fa-solid fa-book-open text-xl"></i>
                <span class="text-xs mt-1">Learn</span>
            </span>
            
            <span class="flex flex-col items-center py-1 px-3 text-neutral-400 cursor-pointer">
                <i class="fa-solid fa-chart-line text-xl"></i>
                <span class="text-xs mt-1">Progress</span>
            </span>
        </div>
    </nav>

    <!-- Floating Action Buttons -->
    <div id="action-buttons" class="fixed right-4 bottom-20 flex flex-col items-end space-y-3 z-10">
        <button class="w-10 h-10 rounded-full bg-white shadow-md flex items-center justify-center border border-gray-200">
            <i class="fa-solid fa-upload text-neutral-600"></i>
        </button>
        
        <button class="w-10 h-10 rounded-full bg-white shadow-md flex items-center justify-center border border-gray-200">
            <i class="fa-solid fa-pen-to-square text-neutral-600"></i>
        </button>
    </div>

    <script>
        document.addEventListener('DOMContentLoaded', function() {
            // Initialize the library
            console.log('Library loaded');
            
            // Talk to coach button animation
            const coachButton = document.getElementById('talk-to-coach-button');
            coachButton.addEventListener('click', function() {
                this.classList.add('scale-95');
                setTimeout(() => {
                    this.classList.remove('scale-95');
                }, 100);
                // Here you would navigate to the coach chat interface
            });
        });
    </script>

</body></html>
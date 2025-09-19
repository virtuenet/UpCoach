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
    <!-- Task Dashboard Screen -->
    <div id="task-dashboard" class="h-[100vh] overflow-hidden flex flex-col">
        <!-- Header -->
        <header id="header" class="px-4 py-3 bg-white shadow-sm flex items-center justify-between">
            <div class="flex items-center">
                <div class="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center mr-3">
                    <i class="fa-solid fa-brain text-primary-600 text-lg"></i>
                </div>
                <div>
                    <h1 class="font-bold text-lg">My Tasks</h1>
                    <p class="text-xs text-neutral-500">Linked to your goals</p>
                </div>
            </div>
            <div class="flex items-center space-x-3">
                <button class="w-9 h-9 rounded-full bg-neutral-100 flex items-center justify-center">
                    <i class="fa-solid fa-bell text-neutral-600"></i>
                </button>
                <div class="w-9 h-9 rounded-full overflow-hidden">
                    <img src="https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-1.jpg" alt="User avatar" class="w-full h-full object-cover">
                </div>
            </div>
        </header>

        <!-- Filters Section -->
        <div id="filters-section" class="px-4 py-3 bg-white border-b border-gray-200">
            <div class="flex items-center justify-between mb-3">
                <h2 class="font-medium text-sm">Filter Tasks</h2>
                <button class="text-xs text-primary-600 font-medium">Reset</button>
            </div>
            <div class="flex space-x-2 overflow-x-auto py-1">
                <button class="px-3 py-1.5 bg-primary-600 text-white text-xs rounded-full whitespace-nowrap">
                    All Tasks
                </button>
                <button class="px-3 py-1.5 bg-white border border-gray-300 text-neutral-700 text-xs rounded-full whitespace-nowrap">
                    Due Today
                </button>
                <button class="px-3 py-1.5 bg-white border border-gray-300 text-neutral-700 text-xs rounded-full whitespace-nowrap">
                    Overdue
                </button>
                <button class="px-3 py-1.5 bg-white border border-gray-300 text-neutral-700 text-xs rounded-full whitespace-nowrap">
                    By Priority
                </button>
                <button class="px-3 py-1.5 bg-white border border-gray-300 text-neutral-700 text-xs rounded-full whitespace-nowrap">
                    By Goal
                </button>
            </div>
        </div>

        <!-- Task List -->
        <div id="task-list" class="flex-1 overflow-y-auto px-4 py-3">
            <!-- Task Progress -->
            <div id="task-progress" class="mb-5">
                <div class="flex justify-between items-center mb-2">
                    <h3 class="text-sm font-medium">Weekly Progress</h3>
                    <span class="text-xs text-neutral-500">5/8 Tasks</span>
                </div>
                <div class="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div class="h-full bg-primary-500 rounded-full" style="width: 62.5%"></div>
                </div>
            </div>

            <!-- Task Group: Leadership Goal -->
            <div id="task-group-leadership" class="mb-6">
                <div class="flex items-center mb-3">
                    <div class="w-8 h-8 rounded-full bg-secondary-100 flex items-center justify-center mr-2">
                        <i class="fa-solid fa-users text-secondary-600 text-sm"></i>
                    </div>
                    <h3 class="font-medium">Leadership Goal</h3>
                </div>

                <!-- Task Card -->
                <div id="task-card-1" class="bg-white rounded-xl p-4 shadow-sm mb-3">
                    <div class="flex justify-between items-start mb-2">
                        <h4 class="font-medium">Team Feedback Session</h4>
                        <span class="bg-yellow-100 text-yellow-700 text-xs py-0.5 px-2 rounded-full">High Priority</span>
                    </div>
                    
                    <p class="text-sm text-neutral-600 mb-3">Prepare structured feedback for each team member based on Q2 performance.</p>
                    
                    <div class="flex items-center text-xs text-neutral-500 mb-3">
                        <i class="fa-regular fa-clock mr-1"></i>
                        <span>Due in 2 days</span>
                    </div>
                    
                    <div class="border-t border-gray-100 pt-3">
                        <div class="flex items-start">
                            <div class="w-8 h-8 rounded-full overflow-hidden mr-2 flex-shrink-0">
                                <img src="https://storage.googleapis.com/uxpilot-auth.appspot.com/4850872147-c5a84d13c99997fcc053.png" alt="AI Coach" class="w-full h-full object-cover">
                            </div>
                            <div class="bg-neutral-50 rounded-lg p-2 text-xs text-neutral-700">
                                <p>This task helps build your leadership confidence by practicing structured feedback delivery. Consider using the STAR method.</p>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Task Card -->
                <div id="task-card-2" class="bg-white rounded-xl p-4 shadow-sm">
                    <div class="flex justify-between items-start mb-2">
                        <h4 class="font-medium">Delegation Exercise</h4>
                        <span class="bg-green-100 text-green-700 text-xs py-0.5 px-2 rounded-full">Medium Priority</span>
                    </div>
                    
                    <p class="text-sm text-neutral-600 mb-3">Identify 3 tasks you can delegate this week and document the process.</p>
                    
                    <div class="flex items-center text-xs text-neutral-500 mb-3">
                        <i class="fa-regular fa-clock mr-1"></i>
                        <span>Due in 5 days</span>
                    </div>
                    
                    <div class="flex items-center text-xs">
                        <span class="bg-primary-100 text-primary-700 py-0.5 px-2 rounded-full mr-2">KPI: Team Efficiency</span>
                        <span class="bg-purple-100 text-purple-700 py-0.5 px-2 rounded-full">Skill: Delegation</span>
                    </div>
                </div>
            </div>

            <!-- Task Group: Productivity Goal -->
            <div id="task-group-productivity" class="mb-6">
                <div class="flex items-center mb-3">
                    <div class="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center mr-2">
                        <i class="fa-solid fa-chart-line text-green-600 text-sm"></i>
                    </div>
                    <h3 class="font-medium">Productivity Goal</h3>
                </div>

                <!-- Task Card -->
                <div id="task-card-3" class="bg-white rounded-xl p-4 shadow-sm mb-3">
                    <div class="flex justify-between items-start mb-2">
                        <h4 class="font-medium">Deep Work Session</h4>
                        <span class="bg-red-100 text-red-700 text-xs py-0.5 px-2 rounded-full">Overdue</span>
                    </div>
                    
                    <p class="text-sm text-neutral-600 mb-3">Schedule and complete a 90-minute focused work session with no distractions.</p>
                    
                    <div class="flex items-center text-xs text-neutral-500 mb-3">
                        <i class="fa-regular fa-clock mr-1"></i>
                        <span>Due yesterday</span>
                    </div>
                    
                    <div class="border-t border-gray-100 pt-3">
                        <div class="flex items-start">
                            <div class="w-8 h-8 rounded-full overflow-hidden mr-2 flex-shrink-0">
                                <img src="https://storage.googleapis.com/uxpilot-auth.appspot.com/4850872147-c5a84d13c99997fcc053.png" alt="AI Coach" class="w-full h-full object-cover">
                            </div>
                            <div class="bg-neutral-50 rounded-lg p-2 text-xs text-neutral-700">
                                <p>This task directly impacts your focus KPI. Your productivity data shows you're most focused between 9-11am.</p>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Task Card -->
                <div id="task-card-4" class="bg-white rounded-xl p-4 shadow-sm">
                    <div class="flex justify-between items-start mb-2">
                        <h4 class="font-medium">Email Management</h4>
                        <span class="bg-green-100 text-green-700 text-xs py-0.5 px-2 rounded-full">Medium Priority</span>
                    </div>
                    
                    <p class="text-sm text-neutral-600 mb-3">Set up email batching system with 3 daily check-in times.</p>
                    
                    <div class="flex items-center text-xs text-neutral-500 mb-3">
                        <i class="fa-regular fa-clock mr-1"></i>
                        <span>Due tomorrow</span>
                    </div>
                    
                    <div class="flex items-center text-xs">
                        <span class="bg-primary-100 text-primary-700 py-0.5 px-2 rounded-full mr-2">KPI: Time Management</span>
                        <span class="bg-blue-100 text-blue-700 py-0.5 px-2 rounded-full">Skill: Focus</span>
                    </div>
                </div>
            </div>
        </div>

        <!-- Task Detail Modal -->
        <div id="task-detail-modal" class="fixed inset-0 bg-black bg-opacity-50 flex items-end z-50">
            <div class="bg-white rounded-t-2xl w-full max-h-[80vh] overflow-y-auto">
                <div class="sticky top-0 bg-white px-4 py-3 border-b border-gray-200 flex justify-between items-center">
                    <h2 class="font-semibold">Task Details</h2>
                    <button id="close-modal" class="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center">
                        <i class="fa-solid fa-xmark text-neutral-600"></i>
                    </button>
                </div>
                
                <div class="p-4">
                    <div class="mb-4">
                        <span class="bg-yellow-100 text-yellow-700 text-xs py-0.5 px-2 rounded-full mb-2 inline-block">High Priority</span>
                        <h3 class="text-xl font-semibold mb-2">Team Feedback Session</h3>
                        <p class="text-neutral-600">Prepare structured feedback for each team member based on Q2 performance. Focus on specific examples and actionable improvement areas.</p>
                    </div>
                    
                    <div class="grid grid-cols-2 gap-3 mb-4">
                        <div class="bg-neutral-50 rounded-lg p-3">
                            <span class="text-xs text-neutral-500 block mb-1">Due Date</span>
                            <div class="flex items-center">
                                <i class="fa-regular fa-calendar text-primary-600 mr-2"></i>
                                <span class="font-medium">July 10, 2023</span>
                            </div>
                        </div>
                        
                        <div class="bg-neutral-50 rounded-lg p-3">
                            <span class="text-xs text-neutral-500 block mb-1">Estimated Time</span>
                            <div class="flex items-center">
                                <i class="fa-regular fa-clock text-primary-600 mr-2"></i>
                                <span class="font-medium">90 minutes</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="mb-4">
                        <h4 class="font-medium mb-2">Linked to Goals &amp; KPIs</h4>
                        <div class="flex flex-wrap gap-2">
                            <span class="bg-secondary-100 text-secondary-700 py-1 px-3 rounded-full text-sm">Leadership Development</span>
                            <span class="bg-primary-100 text-primary-700 py-1 px-3 rounded-full text-sm">Team Performance KPI</span>
                            <span class="bg-purple-100 text-purple-700 py-1 px-3 rounded-full text-sm">Communication Skills</span>
                        </div>
                    </div>
                    
                    <div class="mb-4">
                        <h4 class="font-medium mb-2">AI Coach Rationale</h4>
                        <div class="bg-primary-50 rounded-lg p-4">
                            <div class="flex items-start">
                                <div class="w-10 h-10 rounded-full overflow-hidden mr-3 flex-shrink-0">
                                    <img src="https://storage.googleapis.com/uxpilot-auth.appspot.com/4850872147-c5a84d13c99997fcc053.png" alt="AI Coach" class="w-full h-full object-cover">
                                </div>
                                <div>
                                    <h5 class="font-medium mb-1">Why this matters</h5>
                                    <p class="text-sm text-neutral-700 mb-3">Based on your leadership goal and recent mood tracking, this task will help you build confidence in giving constructive feedback. Your last journal entry mentioned feeling uncertain about team dynamics.</p>
                                    
                                    <h5 class="font-medium mb-1">Tips for success</h5>
                                    <ul class="text-sm text-neutral-700 space-y-2">
                                        <li class="flex items-start">
                                            <i class="fa-solid fa-check text-green-500 mt-1 mr-2"></i>
                                            <span>Use the STAR method (Situation, Task, Action, Result)</span>
                                        </li>
                                        <li class="flex items-start">
                                            <i class="fa-solid fa-check text-green-500 mt-1 mr-2"></i>
                                            <span>Balance positive feedback with growth areas</span>
                                        </li>
                                        <li class="flex items-start">
                                            <i class="fa-solid fa-check text-green-500 mt-1 mr-2"></i>
                                            <span>Schedule individual follow-ups within a week</span>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="grid grid-cols-2 gap-3">
                        <button class="py-3 bg-white border border-primary-600 text-primary-600 rounded-lg font-medium">
                            Reschedule
                        </button>
                        <button class="py-3 bg-primary-600 text-white rounded-lg font-medium">
                            Mark Complete
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Bottom Navigation -->
        <nav id="bottom-nav" class="fixed bottom-0 left-0 right-0 bg-white shadow-lg z-20">
            <div class="flex justify-around py-2">
                <span class="flex flex-col items-center py-1 px-3 text-neutral-400 cursor-pointer">
                    <i class="fa-solid fa-house text-xl"></i>
                    <span class="text-xs mt-1">Home</span>
                </span>
                
                <span class="flex flex-col items-center py-1 px-3 text-primary-600 cursor-pointer">
                    <i class="fa-solid fa-list-check text-xl"></i>
                    <span class="text-xs mt-1">Tasks</span>
                </span>
                
                <div class="relative -mt-6">
                    <button id="talk-to-coach-button" class="w-14 h-14 rounded-full bg-gradient-to-r from-primary-500 to-secondary-500 flex items-center justify-center shadow-lg">
                        <i class="fa-solid fa-comment-dots text-white text-xl"></i>
                    </button>
                    <span class="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-xs font-medium text-neutral-600">Coach</span>
                </div>
                
                <span class="flex flex-col items-center py-1 px-3 text-neutral-400 cursor-pointer">
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
    </div>

    <script>
        document.addEventListener('DOMContentLoaded', function() {
            // Handle modal close
            document.getElementById('close-modal').addEventListener('click', function() {
                document.getElementById('task-detail-modal').style.display = 'none';
            });
            
            // Show task detail when clicking on a task card
            document.querySelectorAll('#task-card-1, #task-card-2, #task-card-3, #task-card-4').forEach(card => {
                card.addEventListener('click', function() {
                    document.getElementById('task-detail-modal').style.display = 'flex';
                });
            });

            // Talk to coach button animation
            const coachButton = document.getElementById('talk-to-coach-button');
            coachButton.addEventListener('click', function() {
                this.classList.add('scale-95');
                setTimeout(() => {
                    this.classList.remove('scale-95');
                }, 100);
            });
        });
    </script>

</body></html>
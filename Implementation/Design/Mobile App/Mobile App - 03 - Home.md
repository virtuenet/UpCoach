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
    <!-- Dashboard Main Screen -->
    <div id="dashboard-container" class="h-[100vh] pb-16 overflow-auto">
        <!-- Header -->
        <header id="header" class="sticky top-0 bg-white shadow-sm z-10">
            <div class="flex justify-between items-center px-4 py-3">
                <div class="flex items-center">
                    <div class="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center mr-3">
                        <i class="fa-solid fa-brain text-primary-600 text-lg"></i>
                    </div>
                    <h1 class="text-xl font-bold">UpCoach</h1>
                </div>
                <div class="flex items-center">
                    <button class="p-2 text-neutral-600">
                        <i class="fa-solid fa-bell text-lg"></i>
                    </button>
                    <button class="ml-2 w-8 h-8 rounded-full overflow-hidden">
                        <img src="https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-1.jpg" alt="User avatar" class="w-full h-full object-cover">
                    </button>
                </div>
            </div>
        </header>

        <!-- Welcome Section -->
        <section id="welcome-section" class="px-4 pt-5 pb-3">
            <div class="flex items-start">
                <div class="flex-1">
                    <h2 class="text-xl font-semibold">Good morning, Sarah!</h2>
                    <p class="text-neutral-500 text-sm">It's a great day to make progress</p>
                </div>
                <div class="w-16 h-16 rounded-full overflow-hidden">
                    <img src="https://storage.googleapis.com/uxpilot-auth.appspot.com/4850872147-c5a84d13c99997fcc053.png" alt="AI Coach" class="w-full h-full object-cover">
                </div>
            </div>
        </section>

	<!-- Live Coaching Now Button under Welcome Section -->
	<section id="live-coaching-now" class="px-4 mb-5">
  		<button class="w-full py-3 rounded-xl bg-gradient-to-r from-primary-500 to-secondary-500 text-white font-semibold text-center text-lg shadow-lg">
    		Live Coaching Now
  		</button>
	</section>

        <!-- Coach Message -->
        <section id="coach-message" class="px-4 mb-5">
            <div class="bg-white rounded-xl p-4 shadow-sm border-l-4 border-primary-500">
                <div class="flex items-start">
                    <div class="flex-1">
                        <h3 class="font-medium mb-1">Alex says:</h3>
                        <p class="text-sm text-neutral-600">You've got 2 priority tasks today. Focus on preparing for your presentation first, then review the quarterly report. You can do this!</p>
                    </div>
                    <button class="ml-2 text-neutral-400 hover:text-neutral-600">
                        <i class="fa-solid fa-play-circle text-2xl"></i>
                    </button>
                </div>
            </div>
        </section>

        <!-- Mood Tracker -->
        <section id="mood-tracker" class="px-4 mb-5">
            <div class="flex justify-between items-center mb-3">
                <h2 class="font-semibold">Today's Mood</h2>
                <button class="text-xs text-primary-600 font-medium">Update</button>
            </div>
            
            <div class="bg-white rounded-xl p-4 shadow-sm">
                <div class="flex items-center justify-between mb-2">
                    <div class="flex items-center">
                        <div class="w-12 h-12 rounded-full bg-secondary-100 flex items-center justify-center mr-3">
                            <span class="text-2xl">😊</span>
                        </div>
                        <div>
                            <h3 class="font-medium">Happy</h3>
                            <p class="text-xs text-neutral-500">High energy</p>
                        </div>
                    </div>
                    <div>
                        <span class="text-xs text-neutral-500">10:30 AM</span>
                    </div>
                </div>
                
                <div class="bg-neutral-50 rounded-lg p-3 text-sm text-neutral-600">
                    <p>"Feeling confident about today's tasks and looking forward to the team meeting."</p>
                </div>
                
                <div class="mt-3">
                    <div class="flex justify-between items-center mb-1">
                        <span class="text-xs text-neutral-500">Weekly Trend</span>
                    </div>
                    <div class="flex h-8 items-end space-x-1">
                        <div class="w-1/7 h-4 bg-yellow-300 rounded-t"></div>
                        <div class="w-1/7 h-6 bg-green-300 rounded-t"></div>
                        <div class="w-1/7 h-5 bg-blue-300 rounded-t"></div>
                        <div class="w-1/7 h-3 bg-red-300 rounded-t"></div>
                        <div class="w-1/7 h-7 bg-green-300 rounded-t"></div>
                        <div class="w-1/7 h-6 bg-green-300 rounded-t"></div>
                        <div class="w-1/7 h-8 bg-green-300 rounded-t"></div>
                    </div>
                    <div class="flex justify-between text-xs text-neutral-400 mt-1">
                        <span>M</span>
                        <span>T</span>
                        <span>W</span>
                        <span>T</span>
                        <span>F</span>
                        <span>S</span>
                        <span>S</span>
                    </div>
                </div>
            </div>
        </section>

        <!-- Tasks Section -->
        <section id="tasks-section" class="px-4 mb-5">
            <div class="flex justify-between items-center mb-3">
                <h2 class="font-semibold">Today's Tasks</h2>
                <button class="text-xs text-primary-600 font-medium">View All</button>
            </div>
            
            <div class="space-y-3">
                <div id="task-1" class="bg-white rounded-xl p-4 shadow-sm border-l-4 border-red-500">
                    <div class="flex justify-between items-start mb-2">
                        <h3 class="font-medium">Prepare presentation slides</h3>
                        <span class="bg-red-100 text-red-700 text-xs py-1 px-2 rounded-full">Priority</span>
                    </div>
                    <p class="text-sm text-neutral-500 mb-3">For tomorrow's client meeting</p>
                    <div class="flex justify-between items-center">
                        <div class="flex items-center">
                            <i class="fa-regular fa-clock text-neutral-400 mr-1"></i>
                            <span class="text-xs text-neutral-500">Due 5:00 PM</span>
                        </div>
                        <div class="flex items-center">
                            <span class="text-xs text-primary-600 mr-3">In Progress</span>
                            <div class="w-5 h-5 rounded-full bg-primary-100 flex items-center justify-center">
                                <i class="fa-solid fa-chevron-right text-xs text-primary-600"></i>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div id="task-2" class="bg-white rounded-xl p-4 shadow-sm border-l-4 border-orange-500">
                    <div class="flex justify-between items-start mb-2">
                        <h3 class="font-medium">Review quarterly report</h3>
                        <span class="bg-orange-100 text-orange-700 text-xs py-1 px-2 rounded-full">Important</span>
                    </div>
                    <p class="text-sm text-neutral-500 mb-3">Provide feedback to the team</p>
                    <div class="flex justify-between items-center">
                        <div class="flex items-center">
                            <i class="fa-regular fa-clock text-neutral-400 mr-1"></i>
                            <span class="text-xs text-neutral-500">Due 3:00 PM</span>
                        </div>
                        <div class="flex items-center">
                            <span class="text-xs text-neutral-500 mr-3">Not Started</span>
                            <div class="w-5 h-5 rounded-full bg-neutral-100 flex items-center justify-center">
                                <i class="fa-solid fa-chevron-right text-xs text-neutral-500"></i>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <!-- Weekly Plan -->
        <section id="weekly-plan" class="px-4 mb-5">
            <div class="flex justify-between items-center mb-3">
                <h2 class="font-semibold">Weekly Plan</h2>
                <button class="text-xs text-primary-600 font-medium">Full Plan</button>
            </div>
            
            <div class="bg-white rounded-xl p-4 shadow-sm">
                <div class="flex justify-between items-center mb-4">
                    <h3 class="font-medium">This Week's Focus</h3>
                    <div class="bg-green-100 text-green-700 text-xs py-1 px-2 rounded-full">On Track</div>
                </div>
                
                <div class="mb-4">
                    <p class="text-sm text-neutral-600 mb-2">"Improve presentation skills and team communication"</p>
                    <div class="w-full bg-gray-200 rounded-full h-2">
                        <div class="bg-primary-500 h-2 rounded-full" style="width: 65%"></div>
                    </div>
                    <div class="flex justify-between text-xs text-neutral-500 mt-1">
                        <span>65% Complete</span>
                        <span>4 of 6 tasks</span>
                    </div>
                </div>
                
                <div class="border-t border-gray-200 pt-3">
                    <h4 class="text-sm font-medium mb-2">Coach Insights:</h4>
                    <p class="text-xs text-neutral-600">You're making great progress on your communication goals. Consider practicing your presentation with a colleague before the client meeting.</p>
                </div>
            </div>
        </section>

        <!-- Learning Section -->
        <section id="learning-section" class="px-4 mb-6">
            <div class="flex justify-between items-center mb-3">
                <h2 class="font-semibold">Recommended Learning</h2>
                <button class="text-xs text-primary-600 font-medium">Library</button>
            </div>
            
            <div class="overflow-x-auto -mx-4 px-4">
                <div class="flex space-x-4 pb-2">
                    <div id="learning-card-1" class="flex-shrink-0 w-64 bg-white rounded-xl overflow-hidden shadow-sm">
                        <div class="h-24 bg-gradient-to-r from-primary-500 to-primary-700 flex items-center justify-center">
                            <i class="fa-solid fa-microphone-lines text-white text-3xl"></i>
                        </div>
                        <div class="p-3">
                            <div class="flex justify-between items-start mb-1">
                                <h3 class="font-medium text-sm">Effective Presentations</h3>
                                <span class="text-xs bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full">5 min</span>
                            </div>
                            <p class="text-xs text-neutral-500 mb-2">Key techniques for engaging your audience</p>
                            <button class="w-full py-1.5 text-xs bg-primary-50 text-primary-600 rounded-lg font-medium">
                                Start Learning
                            </button>
                        </div>
                    </div>
                    
                    <div id="learning-card-2" class="flex-shrink-0 w-64 bg-white rounded-xl overflow-hidden shadow-sm">
                        <div class="h-24 bg-gradient-to-r from-secondary-500 to-secondary-700 flex items-center justify-center">
                            <i class="fa-solid fa-users text-white text-3xl"></i>
                        </div>
                        <div class="p-3">
                            <div class="flex justify-between items-start mb-1">
                                <h3 class="font-medium text-sm">Team Communication</h3>
                                <span class="text-xs bg-secondary-100 text-secondary-700 px-2 py-0.5 rounded-full">8 min</span>
                            </div>
                            <p class="text-xs text-neutral-500 mb-2">Building rapport with different personalities</p>
                            <button class="w-full py-1.5 text-xs bg-secondary-50 text-secondary-600 rounded-lg font-medium">
                                Start Learning
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    </div>

    <!-- Bottom Navigation -->
    <nav id="bottom-nav" class="fixed bottom-0 left-0 right-0 bg-white shadow-lg z-20">
        <div class="flex justify-around py-2">
            <span class="flex flex-col items-center py-1 px-3 text-primary-600 cursor-pointer">
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

    <!-- Role-Play a Scenario FAB -->
    <div id="action-buttons" class="fixed right-4 bottom-20 flex flex-col items-end space-y-3 z-10">
        <div class="flex flex-col items-center space-y-1">
            <button id="roleplay-scenario-button" class="w-12 h-12 rounded-full bg-white border-2 border-secondary-500 text-secondary-700 flex items-center justify-center shadow-md">
                🎭
            </button>
            <span class="text-xs text-center text-secondary-600">Role-Play</span>
        </div>

        <button class="w-10 h-10 rounded-full bg-white shadow-md flex items-center justify-center border border-gray-200">
            <i class="fa-solid fa-upload text-neutral-600"></i>
        </button>
        <button class="w-10 h-10 rounded-full bg-white shadow-md flex items-center justify-center border border-gray-200">
            <i class="fa-solid fa-pen-to-square text-neutral-600"></i>
        </button>
    </div>

    <script>
        document.addEventListener('DOMContentLoaded', function() {
            // Initialize the dashboard
            console.log('Dashboard loaded');
            
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
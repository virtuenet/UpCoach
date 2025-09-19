<html><head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <script src="https://cdn.tailwindcss.com"></script>
    <script> window.FontAwesomeConfig = { autoReplaceSvg: 'nest'};</script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/js/all.min.js" crossorigin="anonymous" referrerpolicy="no-referrer"></script>
    
    <script src="https://cdn.jsdelivr.net/npm/highcharts@10.3.3/highcharts.js"></script>
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
    <div id="progress-summary" class="h-[100vh] overflow-hidden">
        <!-- Header -->
        <div id="header" class="bg-white px-4 py-3 flex items-center justify-between shadow-sm">
            <button class="w-8 h-8 flex items-center justify-center">
                <i class="fa-solid fa-arrow-left text-neutral-700"></i>
            </button>
            <h1 class="text-lg font-semibold">Weekly Progress</h1>
            <div class="w-8 h-8 flex items-center justify-center">
                <i class="fa-solid fa-ellipsis-vertical text-neutral-700"></i>
            </div>
        </div>

        <!-- Main Content -->
        <div id="main-content" class="px-4 py-5">
            <!-- Date Range Selector -->
            <div id="date-selector" class="flex items-center justify-between mb-5">
                <button class="w-8 h-8 flex items-center justify-center text-neutral-500">
                    <i class="fa-solid fa-chevron-left"></i>
                </button>
                <div class="text-center">
                    <h2 class="text-base font-medium">June 24 - June 30</h2>
                    <p class="text-xs text-neutral-500">Week 26, 2023</p>
                </div>
                <button class="w-8 h-8 flex items-center justify-center text-neutral-500">
                    <i class="fa-solid fa-chevron-right"></i>
                </button>
            </div>

            <!-- Mood vs Task Correlation Chart -->
            <div id="mood-task-correlation" class="bg-white rounded-xl p-4 shadow-sm mb-5">
                <div class="flex justify-between items-center mb-3">
                    <h3 class="font-medium">Mood vs Task Completion</h3>
                    <button class="text-xs text-primary-600 font-medium">Details</button>
                </div>
                <div id="correlation-chart" class="h-[180px]"></div>
                <div class="mt-3 flex justify-between text-xs text-neutral-500">
                    <div class="flex items-center">
                        <div class="w-3 h-3 rounded-full bg-primary-500 mr-1"></div>
                        <span>Mood</span>
                    </div>
                    <div class="flex items-center">
                        <div class="w-3 h-3 rounded-full bg-secondary-500 mr-1"></div>
                        <span>Tasks Completed</span>
                    </div>
                </div>
            </div>

            <!-- AI Insights -->
            <div id="ai-insights" class="bg-white rounded-xl p-4 shadow-sm mb-5">
                <div class="flex items-center mb-3">
                    <div class="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center mr-2">
                        <i class="fa-solid fa-lightbulb text-primary-600 text-sm"></i>
                    </div>
                    <h3 class="font-medium">AI Coach Insights</h3>
                </div>
                
                <div class="space-y-3">
                    <div id="insight-1" class="p-3 bg-neutral-50 rounded-lg border border-neutral-100">
                        <p class="text-sm">Your mood was highest on days you completed more than 3 tasks. Consider breaking larger tasks into smaller ones.</p>
                        <div class="mt-2 flex justify-end">
                            <button class="text-xs text-primary-600">Add to plan</button>
                        </div>
                    </div>
                    
                    <div id="insight-2" class="p-3 bg-neutral-50 rounded-lg border border-neutral-100">
                        <p class="text-sm">Morning tasks have a 78% higher completion rate than afternoon ones. Try scheduling important work before lunch.</p>
                        <div class="mt-2 flex justify-end">
                            <button class="text-xs text-primary-600">Add to plan</button>
                        </div>
                    </div>
                    
                    <div id="insight-3" class="p-3 bg-neutral-50 rounded-lg border border-neutral-100">
                        <p class="text-sm">You reported feeling more focused after journaling. Consider making this a daily habit.</p>
                        <div class="mt-2 flex justify-end">
                            <button class="text-xs text-primary-600">Add to plan</button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Weekly Stats -->
            <div id="weekly-stats" class="bg-white rounded-xl p-4 shadow-sm mb-5">
                <h3 class="font-medium mb-3">Weekly Summary</h3>
                
                <div class="grid grid-cols-2 gap-3">
                    <div class="bg-neutral-50 p-3 rounded-lg">
                        <div class="flex items-center mb-1">
                            <i class="fa-solid fa-check-circle text-green-500 mr-2"></i>
                            <span class="text-sm font-medium">Tasks Completed</span>
                        </div>
                        <div class="flex items-end">
                            <span class="text-2xl font-semibold">18</span>
                            <span class="text-xs text-green-600 ml-2 mb-1">+3 vs last week</span>
                        </div>
                    </div>
                    
                    <div class="bg-neutral-50 p-3 rounded-lg">
                        <div class="flex items-center mb-1">
                            <i class="fa-solid fa-face-smile text-amber-500 mr-2"></i>
                            <span class="text-sm font-medium">Avg. Mood</span>
                        </div>
                        <div class="flex items-end">
                            <span class="text-2xl font-semibold">7.2</span>
                            <span class="text-xs text-green-600 ml-2 mb-1">+0.5 vs last week</span>
                        </div>
                    </div>
                    
                    <div class="bg-neutral-50 p-3 rounded-lg">
                        <div class="flex items-center mb-1">
                            <i class="fa-solid fa-book text-purple-500 mr-2"></i>
                            <span class="text-sm font-medium">Journal Entries</span>
                        </div>
                        <div class="flex items-end">
                            <span class="text-2xl font-semibold">5</span>
                            <span class="text-xs text-amber-600 ml-2 mb-1">Same as last week</span>
                        </div>
                    </div>
                    
                    <div class="bg-neutral-50 p-3 rounded-lg">
                        <div class="flex items-center mb-1">
                            <i class="fa-solid fa-graduation-cap text-blue-500 mr-2"></i>
                            <span class="text-sm font-medium">Learning Mins</span>
                        </div>
                        <div class="flex items-end">
                            <span class="text-2xl font-semibold">45</span>
                            <span class="text-xs text-red-600 ml-2 mb-1">-15 vs last week</span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Export Options -->
            <div id="export-options" class="bg-white rounded-xl p-4 shadow-sm mb-5">
                <h3 class="font-medium mb-3">Share Your Progress</h3>
                
                <div class="space-y-2">
                    <button class="w-full py-2.5 border border-neutral-200 rounded-lg flex items-center justify-center">
                        <i class="fa-solid fa-file-pdf text-red-500 mr-2"></i>
                        <span class="text-sm">Export as PDF</span>
                    </button>
                    
                    <button class="w-full py-2.5 border border-neutral-200 rounded-lg flex items-center justify-center">
                        <i class="fa-solid fa-envelope text-blue-500 mr-2"></i>
                        <span class="text-sm">Email Summary</span>
                    </button>
                    
                    <button class="w-full py-2.5 border border-neutral-200 rounded-lg flex items-center justify-center">
                        <i class="fa-brands fa-google text-green-500 mr-2"></i>
                        <span class="text-sm">Export to Google Sheets</span>
                    </button>
                    
                    <button class="w-full py-2.5 border border-neutral-200 rounded-lg flex items-center justify-center">
                        <i class="fa-brands fa-google text-blue-600 mr-2"></i>
                        <span class="text-sm">Export to Google Docs</span>
                    </button>
                    
                    <button class="w-full py-2.5 border border-neutral-200 rounded-lg flex items-center justify-center">
                        <i class="fa-brands fa-slack text-purple-500 mr-2"></i>
                        <span class="text-sm">Share to Slack</span>
                    </button>
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
                
                <span class="flex flex-col items-center py-1 px-3 text-primary-600 cursor-pointer">
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
            // Mood vs Task Correlation Chart
            Highcharts.chart('correlation-chart', {
                chart: {
                    type: 'line',
                    height: 180,
                    style: {
                        fontFamily: 'Poppins, sans-serif'
                    }
                },
                title: {
                    text: null
                },
                xAxis: {
                    categories: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                    labels: {
                        style: {
                            fontSize: '10px'
                        }
                    }
                },
                yAxis: [{
                    title: {
                        text: null
                    },
                    min: 0,
                    max: 10,
                    gridLineColor: '#f1f5f9',
                    labels: {
                        style: {
                            fontSize: '8px'
                        }
                    }
                }, {
                    title: {
                        text: null
                    },
                    min: 0,
                    max: 5,
                    opposite: true,
                    labels: {
                        style: {
                            fontSize: '8px'
                        }
                    }
                }],
                legend: {
                    enabled: false
                },
                tooltip: {
                    shared: true
                },
                credits: {
                    enabled: false
                },
                series: [{
                    name: 'Mood',
                    data: [6.2, 7.0, 6.5, 8.1, 7.8, 8.5, 7.2],
                    color: '#0ea5e9',
                    marker: {
                        radius: 3
                    },
                    lineWidth: 2
                }, {
                    name: 'Tasks Completed',
                    data: [2, 3, 1, 4, 3, 3, 2],
                    yAxis: 1,
                    color: '#ec4899',
                    marker: {
                        radius: 3
                    },
                    lineWidth: 2
                }]
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
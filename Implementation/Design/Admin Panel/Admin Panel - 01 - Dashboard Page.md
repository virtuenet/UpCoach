<html><head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <script src="https://cdn.tailwindcss.com"></script>
    <script> window.FontAwesomeConfig = { autoReplaceSvg: 'nest'};</script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/js/all.min.js" crossorigin="anonymous" referrerpolicy="no-referrer"></script>
    <script src="https://code.highcharts.com/highcharts.js"></script>
    
    <style>::-webkit-scrollbar { display: none;}</style>
    <script>tailwind.config = {
  "theme": {
    "extend": {
      "colors": {
        "primary": "#4A90E2",
        "secondary": "#7ED321",
        "danger": "#FF4C4C",
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
    <div class="flex h-full">
        <!-- Sidebar -->
        <div id="sidebar" class="w-64 bg-white border-r border-gray-200 fixed h-full">
            <div class="p-4 flex items-center space-x-2 border-b border-gray-200">
                <div class="bg-primary rounded-md p-1.5 text-white">
                    <i class="fa-solid fa-graduation-cap"></i>
                </div>
                <span class="font-semibold text-gray-800 text-lg">UpCoach</span>
            </div>
            <div class="overflow-y-auto h-[calc(100vh-64px)]">
                <div class="px-4 py-6">
                    <div class="mb-2 px-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Main
                    </div>
                    <div class="space-y-1">
                        <span class="flex items-center px-3 py-2 text-sm font-medium text-primary bg-blue-50 rounded-md cursor-pointer">
                            <i class="fa-solid fa-chart-line w-5 h-5 mr-2"></i>
                            <span>Dashboard</span>
                        </span>
                        <span class="flex items-center px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-md cursor-pointer">
                            <i class="fa-solid fa-users w-5 h-5 mr-2"></i>
                            <span>Users</span>
                        </span>
                        <span class="flex items-center px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-md cursor-pointer">
                            <i class="fa-solid fa-brain w-5 h-5 mr-2"></i>
                            <span>Coaching Plans</span>
                        </span>
                        <span class="flex items-center px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-md cursor-pointer">
                            <i class="fa-solid fa-flag w-5 h-5 mr-2"></i>
                            <span>Flags</span>
                            <span class="ml-auto bg-danger text-white text-xs px-1.5 py-0.5 rounded-full">4</span>
                        </span>
                    </div>
                </div>
                
                <div class="px-4 py-6 border-t border-gray-200">
                    <div class="mb-2 px-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Admin
                    </div>
                    <div class="space-y-1">
                        <span class="flex items-center px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-md cursor-pointer">
                            <i class="fa-solid fa-user-shield w-5 h-5 mr-2"></i>
                            <span>Roles</span>
                        </span>
                        <span class="flex items-center px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-md cursor-pointer">
                            <i class="fa-solid fa-chart-pie w-5 h-5 mr-2"></i>
                            <span>Analytics</span>
                        </span>
                        <span class="flex items-center px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-md cursor-pointer">
                            <i class="fa-solid fa-gear w-5 h-5 mr-2"></i>
                            <span>Settings</span>
                        </span>
                    </div>
                </div>
            </div>
        </div>

        <!-- Main content -->
        <div class="ml-64 flex-1">
            <!-- Header -->
            <header id="header" class="bg-white border-b border-gray-200 py-4 px-6 flex items-center justify-between">
                <div>
                    <h1 class="text-2xl font-semibold text-gray-800">Dashboard</h1>
                    <p class="text-sm text-gray-500">Overview of platform metrics and activity</p>
                </div>
                <div class="flex items-center space-x-4">
                    <div class="relative">
                        <button class="flex items-center px-4 py-2 border border-gray-300 rounded-md bg-white text-gray-700 hover:bg-gray-50 text-sm">
                            <i class="fa-solid fa-calendar-days mr-2"></i>
                            <span>Last 30 days</span>
                            <i class="fa-solid fa-chevron-down ml-2"></i>
                        </button>
                    </div>
                    <button class="flex items-center px-4 py-2 border border-gray-300 rounded-md bg-white text-gray-700 hover:bg-gray-50 text-sm">
                        <i class="fa-solid fa-file-csv mr-2"></i>
                        <span>Export CSV</span>
                    </button>
                    <div class="relative">
                        <button class="flex items-center text-gray-600">
                            <i class="fa-regular fa-bell text-xl"></i>
                            <span class="absolute -top-1 -right-1 bg-danger text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">3</span>
                        </button>
                    </div>
                    <div class="h-8 w-px bg-gray-200"></div>
                    <div class="flex items-center">
                        <img src="https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-3.jpg" alt="Admin user" class="h-8 w-8 rounded-full mr-2">
                        <div>
                            <p class="text-sm font-medium text-gray-700">Alex Morgan</p>
                            <p class="text-xs text-gray-500">CoachOps Admin</p>
                        </div>
                    </div>
                </div>
            </header>

            <!-- Dashboard content -->
            <main id="dashboard-content" class="p-6">
                <!-- Top stats -->
                <div id="quick-stats" class="grid grid-cols-4 gap-6 mb-6">
                    <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
                        <div class="flex items-center justify-between mb-2">
                            <h3 class="text-gray-500 text-sm font-medium">Total Users</h3>
                            <span class="text-primary bg-blue-50 p-1.5 rounded-md">
                                <i class="fa-solid fa-users"></i>
                            </span>
                        </div>
                        <p class="text-3xl font-semibold text-gray-800">2,845</p>
                        <div class="flex items-center mt-2 text-sm">
                            <span class="text-secondary flex items-center">
                                <i class="fa-solid fa-arrow-up mr-1"></i> 12.5%
                            </span>
                            <span class="text-gray-500 ml-2">from last month</span>
                        </div>
                    </div>
                    
                    <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
                        <div class="flex items-center justify-between mb-2">
                            <h3 class="text-gray-500 text-sm font-medium">Active Plans</h3>
                            <span class="text-secondary bg-green-50 p-1.5 rounded-md">
                                <i class="fa-solid fa-brain"></i>
                            </span>
                        </div>
                        <p class="text-3xl font-semibold text-gray-800">1,246</p>
                        <div class="flex items-center mt-2 text-sm">
                            <span class="text-secondary flex items-center">
                                <i class="fa-solid fa-arrow-up mr-1"></i> 8.3%
                            </span>
                            <span class="text-gray-500 ml-2">from last month</span>
                        </div>
                    </div>
                    
                    <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
                        <div class="flex items-center justify-between mb-2">
                            <h3 class="text-gray-500 text-sm font-medium">Tasks Completed</h3>
                            <span class="text-blue-500 bg-blue-50 p-1.5 rounded-md">
                                <i class="fa-solid fa-check-double"></i>
                            </span>
                        </div>
                        <p class="text-3xl font-semibold text-gray-800">18,592</p>
                        <div class="flex items-center mt-2 text-sm">
                            <span class="text-secondary flex items-center">
                                <i class="fa-solid fa-arrow-up mr-1"></i> 24.8%
                            </span>
                            <span class="text-gray-500 ml-2">from last month</span>
                        </div>
                    </div>
                    
                    <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
                        <div class="flex items-center justify-between mb-2">
                            <h3 class="text-gray-500 text-sm font-medium">Open Flags</h3>
                            <span class="text-danger bg-red-50 p-1.5 rounded-md">
                                <i class="fa-solid fa-flag"></i>
                            </span>
                        </div>
                        <p class="text-3xl font-semibold text-gray-800">4</p>
                        <div class="flex items-center mt-2 text-sm">
                            <span class="text-danger flex items-center">
                                <i class="fa-solid fa-arrow-up mr-1"></i> 2
                            </span>
                            <span class="text-gray-500 ml-2">from yesterday</span>
                        </div>
                    </div>
                </div>
                
                <!-- Charts row 1 -->
                <div class="grid grid-cols-2 gap-6 mb-6">
                    <!-- Active User Growth Chart -->
                    <div id="active-users-chart" class="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
                        <div class="flex items-center justify-between mb-4">
                            <div>
                                <h3 class="font-semibold text-gray-800">📈 Active User Growth</h3>
                                <p class="text-sm text-gray-500">Daily active users over time</p>
                            </div>
                            <div class="flex space-x-2">
                                <button class="p-1.5 rounded-md hover:bg-gray-100 text-gray-500">
                                    <i class="fa-solid fa-ellipsis-vertical"></i>
                                </button>
                            </div>
                        </div>
                        <div id="user-growth-chart" class="h-72"></div>
                    </div>
                    
                    <!-- Plans Created Chart -->
                    <div id="plans-created-chart" class="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
                        <div class="flex items-center justify-between mb-4">
                            <div>
                                <h3 class="font-semibold text-gray-800">🧠 Plans Created</h3>
                                <p class="text-sm text-gray-500">Segmented by cohort</p>
                            </div>
                            <div class="flex space-x-2">
                                <button class="p-1.5 rounded-md hover:bg-gray-100 text-gray-500">
                                    <i class="fa-solid fa-ellipsis-vertical"></i>
                                </button>
                            </div>
                        </div>
                        <div id="plans-cohort-chart" class="h-72"></div>
                    </div>
                </div>
                
                <!-- Charts row 2 -->
                <div class="grid grid-cols-2 gap-6 mb-6">
                    <!-- Task Completion Chart -->
                    <div id="task-completion-chart" class="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
                        <div class="flex items-center justify-between mb-4">
                            <div>
                                <h3 class="font-semibold text-gray-800">✅ Task Completion by User Segment</h3>
                                <p class="text-sm text-gray-500">Breakdown by subscription tier</p>
                            </div>
                            <div class="flex space-x-2">
                                <button class="p-1.5 rounded-md hover:bg-gray-100 text-gray-500">
                                    <i class="fa-solid fa-ellipsis-vertical"></i>
                                </button>
                            </div>
                        </div>
                        <div id="task-segment-chart" class="h-72"></div>
                    </div>
                    
                    <!-- Flag Heatmap -->
                    <div id="flag-heatmap" class="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
                        <div class="flex items-center justify-between mb-4">
                            <div>
                                <h3 class="font-semibold text-gray-800">🚨 Flag Heatmap</h3>
                                <p class="text-sm text-gray-500">Time vs flag type distribution</p>
                            </div>
                            <div class="flex space-x-2">
                                <button class="p-1.5 rounded-md hover:bg-gray-100 text-gray-500">
                                    <i class="fa-solid fa-ellipsis-vertical"></i>
                                </button>
                            </div>
                        </div>
                        <div id="flag-heatmap-chart" class="h-72"></div>
                    </div>
                </div>
                
                <!-- Weekly Sessions -->
                <div id="weekly-sessions" class="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
                    <div class="flex items-center justify-between mb-4">
                        <div>
                            <h3 class="font-semibold text-gray-800">📅 Sessions This Week</h3>
                            <p class="text-sm text-gray-500">Summary of coaching sessions</p>
                        </div>
                        <button class="text-primary hover:text-primary-dark text-sm font-medium">View Details</button>
                    </div>
                    
                    <div class="grid grid-cols-7 gap-4">
                        <div class="bg-gray-50 rounded-lg p-4 text-center">
                            <p class="text-sm font-medium text-gray-500 mb-1">Mon</p>
                            <p class="text-2xl font-semibold text-gray-800">124</p>
                            <p class="text-xs text-secondary mt-1">+12%</p>
                        </div>
                        <div class="bg-gray-50 rounded-lg p-4 text-center">
                            <p class="text-sm font-medium text-gray-500 mb-1">Tue</p>
                            <p class="text-2xl font-semibold text-gray-800">156</p>
                            <p class="text-xs text-secondary mt-1">+8%</p>
                        </div>
                        <div class="bg-gray-50 rounded-lg p-4 text-center">
                            <p class="text-sm font-medium text-gray-500 mb-1">Wed</p>
                            <p class="text-2xl font-semibold text-gray-800">142</p>
                            <p class="text-xs text-danger mt-1">-5%</p>
                        </div>
                        <div class="bg-gray-50 rounded-lg p-4 text-center">
                            <p class="text-sm font-medium text-gray-500 mb-1">Thu</p>
                            <p class="text-2xl font-semibold text-gray-800">168</p>
                            <p class="text-xs text-secondary mt-1">+18%</p>
                        </div>
                        <div class="bg-primary bg-opacity-10 border-2 border-primary rounded-lg p-4 text-center">
                            <p class="text-sm font-medium text-primary mb-1">Today</p>
                            <p class="text-2xl font-semibold text-gray-800">132</p>
                            <p class="text-xs text-secondary mt-1">+4%</p>
                        </div>
                        <div class="bg-gray-50 rounded-lg p-4 text-center border border-dashed border-gray-300">
                            <p class="text-sm font-medium text-gray-400 mb-1">Sat</p>
                            <p class="text-2xl font-semibold text-gray-400">--</p>
                            <p class="text-xs text-gray-400 mt-1">Upcoming</p>
                        </div>
                        <div class="bg-gray-50 rounded-lg p-4 text-center border border-dashed border-gray-300">
                            <p class="text-sm font-medium text-gray-400 mb-1">Sun</p>
                            <p class="text-2xl font-semibold text-gray-400">--</p>
                            <p class="text-xs text-gray-400 mt-1">Upcoming</p>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    </div>

    <script>
        // Active User Growth Chart
        Highcharts.chart('user-growth-chart', {
            chart: {
                type: 'line',
                style: {
                    fontFamily: 'Inter, sans-serif'
                }
            },
            title: {
                text: null
            },
            xAxis: {
                categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
                labels: {
                    style: {
                        color: '#6B7280'
                    }
                }
            },
            yAxis: {
                title: {
                    text: 'Active Users',
                    style: {
                        color: '#6B7280'
                    }
                },
                gridLineColor: '#E5E7EB'
            },
            legend: {
                enabled: true
            },
            tooltip: {
                shared: true
            },
            credits: {
                enabled: false
            },
            plotOptions: {
                line: {
                    marker: {
                        symbol: 'circle'
                    }
                }
            },
            series: [{
                name: 'Daily Active',
                color: '#4A90E2',
                data: [1200, 1350, 1500, 1680, 1750, 1820, 2100, 2300, 2450, 2600, 2750, 2845]
            }, {
                name: 'Weekly Active',
                color: '#7ED321',
                data: [1800, 1950, 2100, 2250, 2400, 2550, 2700, 2850, 3000, 3150, 3300, 3450]
            }]
        });

        // Plans Created by Cohort Chart
        Highcharts.chart('plans-cohort-chart', {
            chart: {
                type: 'column',
                style: {
                    fontFamily: 'Inter, sans-serif'
                }
            },
            title: {
                text: null
            },
            xAxis: {
                categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
                labels: {
                    style: {
                        color: '#6B7280'
                    }
                }
            },
            yAxis: {
                title: {
                    text: 'Plans Created',
                    style: {
                        color: '#6B7280'
                    }
                },
                gridLineColor: '#E5E7EB'
            },
            legend: {
                enabled: true
            },
            tooltip: {
                shared: true
            },
            credits: {
                enabled: false
            },
            plotOptions: {
                column: {
                    stacking: 'normal',
                    borderRadius: 3
                }
            },
            series: [{
                name: 'Enterprise',
                color: '#4A90E2',
                data: [50, 60, 75, 85, 90, 100, 110, 120, 130, 140, 150, 160]
            }, {
                name: 'Teams',
                color: '#7ED321',
                data: [120, 130, 140, 150, 160, 170, 180, 190, 200, 210, 220, 230]
            }, {
                name: 'Pro',
                color: '#F5A623',
                data: [200, 220, 240, 260, 280, 300, 320, 340, 360, 380, 400, 420]
            }, {
                name: 'Free',
                color: '#9013FE',
                data: [300, 320, 340, 360, 380, 400, 420, 440, 460, 480, 500, 520]
            }]
        });

        // Task Completion by User Segment Chart
        Highcharts.chart('task-segment-chart', {
            chart: {
                type: 'bar',
                style: {
                    fontFamily: 'Inter, sans-serif'
                }
            },
            title: {
                text: null
            },
            xAxis: {
                categories: ['Free Tier', 'Pro Plan', 'Team Plan', 'Enterprise'],
                labels: {
                    style: {
                        color: '#6B7280'
                    }
                }
            },
            yAxis: {
                min: 0,
                max: 100,
                title: {
                    text: 'Completion Rate (%)',
                    style: {
                        color: '#6B7280'
                    }
                },
                gridLineColor: '#E5E7EB'
            },
            legend: {
                enabled: true
            },
            tooltip: {
                formatter: function() {
                    return '<b>' + this.x + '</b><br/>' +
                        this.series.name + ': ' + this.y + '%';
                }
            },
            credits: {
                enabled: false
            },
            plotOptions: {
                bar: {
                    borderRadius: 3,
                    dataLabels: {
                        enabled: true,
                        format: '{y}%'
                    }
                }
            },
            series: [{
                name: 'Daily Tasks',
                color: '#4A90E2',
                data: [45, 73, 81, 92]
            }, {
                name: 'Weekly Tasks',
                color: '#7ED321',
                data: [38, 65, 78, 88]
            }, {
                name: 'Monthly Goals',
                color: '#F5A623',
                data: [28, 58, 72, 85]
            }]
        });

        // Flag Heatmap Chart
        Highcharts.chart('flag-heatmap-chart', {
            chart: {
                type: 'heatmap',
                style: {
                    fontFamily: 'Inter, sans-serif'
                }
            },
            title: {
                text: null
            },
            xAxis: {
                categories: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                labels: {
                    style: {
                        color: '#6B7280'
                    }
                }
            },
            yAxis: {
                categories: ['Inactivity', 'Content Issue', 'Support Request', 'Technical Error', 'Billing Issue'],
                title: null,
                labels: {
                    style: {
                        color: '#6B7280'
                    }
                }
            },
            colorAxis: {
                min: 0,
                max: 10,
                stops: [
                    [0, '#FFFFFF'],
                    [0.1, '#FFEBE6'],
                    [0.5, '#FF9B82'],
                    [1, '#FF4C4C']
                ]
            },
            legend: {
                align: 'right',
                layout: 'vertical',
                verticalAlign: 'top',
                y: 25,
                symbolHeight: 280
            },
            tooltip: {
                formatter: function() {
                    return '<b>' + this.series.yAxis.categories[this.point.y] + '</b> on <b>' + 
                           this.series.xAxis.categories[this.point.x] + '</b>: <br>' +
                           this.point.value + ' flags';
                }
            },
            credits: {
                enabled: false
            },
            series: [{
                name: 'Flags',
                borderWidth: 1,
                data: [
                    [0, 0, 1], [0, 1, 2], [0, 2, 3], [0, 3, 1], [0, 4, 0],
                    [1, 0, 2], [1, 1, 3], [1, 2, 5], [1, 3, 2], [1, 4, 1],
                    [2, 0, 3], [2, 1, 4], [2, 2, 7], [2, 3, 3], [2, 4, 2],
                    [3, 0, 4], [3, 1, 5], [3, 2, 8], [3, 3, 4], [3, 4, 3],
                    [4, 0, 5], [4, 1, 6], [4, 2, 10], [4, 3, 5], [4, 4, 4],
                    [5, 0, 2], [5, 1, 3], [5, 2, 4], [5, 3, 2], [5, 4, 1],
                    [6, 0, 1], [6, 1, 2], [6, 2, 3], [6, 3, 1], [6, 4, 0]
                ],
                dataLabels: {
                    enabled: true,
                    color: '#000000'
                }
            }]
        });
    </script>

</body></html>
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
                        <span class="flex items-center px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-md cursor-pointer">
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
                        <span class="flex items-center px-3 py-2 text-sm font-medium text-primary bg-blue-50 rounded-md cursor-pointer">
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
                    <h1 class="text-2xl font-semibold text-gray-800">Analytics</h1>
                    <p class="text-sm text-gray-500">Platform usage and performance metrics</p>
                </div>
                <div class="flex items-center space-x-4">
                    <div class="relative">
                        <button class="flex items-center px-4 py-2 border border-gray-300 rounded-md bg-white text-gray-700 hover:bg-gray-50 text-sm">
                            <i class="fa-solid fa-calendar-days mr-2"></i>
                            <span>Last 30 days</span>
                            <i class="fa-solid fa-chevron-down ml-2"></i>
                        </button>
                    </div>
                    <div class="flex">
                        <button class="flex items-center px-4 py-2 border border-gray-300 rounded-l-md bg-white text-gray-700 hover:bg-gray-50 text-sm">
                            <i class="fa-solid fa-file-csv mr-2"></i>
                            <span>CSV</span>
                        </button>
                        <button class="flex items-center px-4 py-2 border border-gray-300 border-l-0 rounded-r-md bg-white text-gray-700 hover:bg-gray-50 text-sm">
                            <i class="fa-solid fa-code mr-2"></i>
                            <span>JSON</span>
                        </button>
                    </div>
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

            <!-- Analytics content -->
            <main id="analytics-content" class="p-6">
                <!-- Filters section -->
                <div id="analytics-filters" class="bg-white rounded-lg shadow-sm border border-gray-200 p-5 mb-6">
                    <div class="flex items-center justify-between mb-4">
                        <h3 class="font-semibold text-gray-800">Data Filters</h3>
                        <button class="text-primary hover:text-primary-dark text-sm font-medium">Reset All</button>
                    </div>
                    <div class="grid grid-cols-4 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
                            <select class="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary">
                                <option>Last 7 days</option>
                                <option selected="">Last 30 days</option>
                                <option>Last 90 days</option>
                                <option>Last 12 months</option>
                                <option>Custom range</option>
                            </select>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Department</label>
                            <select class="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary">
                                <option>All Departments</option>
                                <option>Marketing</option>
                                <option>Sales</option>
                                <option>Engineering</option>
                                <option>Human Resources</option>
                                <option>Customer Success</option>
                            </select>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Flag Status</label>
                            <select class="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary">
                                <option>All Users</option>
                                <option>Flagged Users</option>
                                <option>Unflagged Users</option>
                            </select>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Subscription</label>
                            <select class="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary">
                                <option>All Plans</option>
                                <option>Free</option>
                                <option>Pro</option>
                                <option>Team</option>
                                <option>Enterprise</option>
                            </select>
                        </div>
                    </div>
                </div>
                
                <!-- Line Charts Row -->
                <div class="grid grid-cols-2 gap-6 mb-6">
                    <!-- Weekly Active Users Chart -->
                    <div id="weekly-users-chart" class="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
                        <div class="flex items-center justify-between mb-4">
                            <div>
                                <h3 class="font-semibold text-gray-800">Weekly Active Users</h3>
                                <p class="text-sm text-gray-500">Unique users engaging with the platform</p>
                            </div>
                            <div class="flex space-x-2">
                                <button class="p-1.5 rounded-md hover:bg-gray-100 text-gray-500">
                                    <i class="fa-solid fa-download"></i>
                                </button>
                                <button class="p-1.5 rounded-md hover:bg-gray-100 text-gray-500">
                                    <i class="fa-solid fa-ellipsis-vertical"></i>
                                </button>
                            </div>
                        </div>
                        <div id="weekly-active-users-chart" class="h-72"></div>
                    </div>
                    
                    <!-- Plan Creation Trends Chart -->
                    <div id="plan-creation-chart" class="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
                        <div class="flex items-center justify-between mb-4">
                            <div>
                                <h3 class="font-semibold text-gray-800">Plan Creation Trends</h3>
                                <p class="text-sm text-gray-500">New coaching plans over time</p>
                            </div>
                            <div class="flex space-x-2">
                                <button class="p-1.5 rounded-md hover:bg-gray-100 text-gray-500">
                                    <i class="fa-solid fa-download"></i>
                                </button>
                                <button class="p-1.5 rounded-md hover:bg-gray-100 text-gray-500">
                                    <i class="fa-solid fa-ellipsis-vertical"></i>
                                </button>
                            </div>
                        </div>
                        <div id="plan-creation-trends-chart" class="h-72"></div>
                    </div>
                </div>
                
                <!-- Bar Charts Row -->
                <div class="grid grid-cols-2 gap-6 mb-6">
                    <!-- Task Success Rate Chart -->
                    <div id="task-success-chart" class="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
                        <div class="flex items-center justify-between mb-4">
                            <div>
                                <h3 class="font-semibold text-gray-800">Task Success Rate</h3>
                                <p class="text-sm text-gray-500">Percentage of completed tasks by plan type</p>
                            </div>
                            <div class="flex space-x-2">
                                <button class="p-1.5 rounded-md hover:bg-gray-100 text-gray-500">
                                    <i class="fa-solid fa-download"></i>
                                </button>
                                <button class="p-1.5 rounded-md hover:bg-gray-100 text-gray-500">
                                    <i class="fa-solid fa-ellipsis-vertical"></i>
                                </button>
                            </div>
                        </div>
                        <div id="task-success-rate-chart" class="h-72"></div>
                    </div>
                    
                    <!-- Coach Session Usage Chart -->
                    <div id="coach-session-chart" class="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
                        <div class="flex items-center justify-between mb-4">
                            <div>
                                <h3 class="font-semibold text-gray-800">Coach Session Usage</h3>
                                <p class="text-sm text-gray-500">Average sessions per user by subscription tier</p>
                            </div>
                            <div class="flex space-x-2">
                                <button class="p-1.5 rounded-md hover:bg-gray-100 text-gray-500">
                                    <i class="fa-solid fa-download"></i>
                                </button>
                                <button class="p-1.5 rounded-md hover:bg-gray-100 text-gray-500">
                                    <i class="fa-solid fa-ellipsis-vertical"></i>
                                </button>
                            </div>
                        </div>
                        <div id="coach-session-usage-chart" class="h-72"></div>
                    </div>
                </div>
                
                <!-- Pie Charts Row -->
                <div class="grid grid-cols-2 gap-6 mb-6">
                    <!-- Role Distribution Chart -->
                    <div id="role-distribution-chart" class="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
                        <div class="flex items-center justify-between mb-4">
                            <div>
                                <h3 class="font-semibold text-gray-800">Role Distribution</h3>
                                <p class="text-sm text-gray-500">Breakdown of user roles across the platform</p>
                            </div>
                            <div class="flex space-x-2">
                                <button class="p-1.5 rounded-md hover:bg-gray-100 text-gray-500">
                                    <i class="fa-solid fa-download"></i>
                                </button>
                                <button class="p-1.5 rounded-md hover:bg-gray-100 text-gray-500">
                                    <i class="fa-solid fa-ellipsis-vertical"></i>
                                </button>
                            </div>
                        </div>
                        <div id="role-distribution-pie-chart" class="h-72"></div>
                    </div>
                    
                    <!-- Subscription Mix Chart -->
                    <div id="subscription-mix-chart" class="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
                        <div class="flex items-center justify-between mb-4">
                            <div>
                                <h3 class="font-semibold text-gray-800">Subscription Mix</h3>
                                <p class="text-sm text-gray-500">Distribution of subscription plans</p>
                            </div>
                            <div class="flex space-x-2">
                                <button class="p-1.5 rounded-md hover:bg-gray-100 text-gray-500">
                                    <i class="fa-solid fa-download"></i>
                                </button>
                                <button class="p-1.5 rounded-md hover:bg-gray-100 text-gray-500">
                                    <i class="fa-solid fa-ellipsis-vertical"></i>
                                </button>
                            </div>
                        </div>
                        <div id="subscription-mix-pie-chart" class="h-72"></div>
                    </div>
                </div>
                
                <!-- Raw Data Export -->
                <div id="raw-data-export" class="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
                    <div class="flex items-center justify-between mb-4">
                        <div>
                            <h3 class="font-semibold text-gray-800">Raw Data Export</h3>
                            <p class="text-sm text-gray-500">Download detailed platform data for custom analysis</p>
                        </div>
                    </div>
                    
                    <div class="grid grid-cols-3 gap-4">
                        <div class="border border-gray-200 rounded-lg p-4 hover:border-primary hover:shadow-md transition-all">
                            <div class="flex items-center justify-between mb-2">
                                <h4 class="font-medium text-gray-800">User Activity Report</h4>
                                <i class="fa-solid fa-users text-primary"></i>
                            </div>
                            <p class="text-sm text-gray-500 mb-4">Detailed user login history, session duration, and feature usage.</p>
                            <div class="flex space-x-2">
                                <button class="flex items-center px-3 py-1.5 bg-primary text-white rounded-md text-sm">
                                    <i class="fa-solid fa-file-csv mr-1.5"></i>
                                    <span>CSV</span>
                                </button>
                                <button class="flex items-center px-3 py-1.5 border border-gray-300 text-gray-700 rounded-md text-sm">
                                    <i class="fa-solid fa-code mr-1.5"></i>
                                    <span>JSON</span>
                                </button>
                            </div>
                        </div>
                        
                        <div class="border border-gray-200 rounded-lg p-4 hover:border-primary hover:shadow-md transition-all">
                            <div class="flex items-center justify-between mb-2">
                                <h4 class="font-medium text-gray-800">Coaching Plans Report</h4>
                                <i class="fa-solid fa-brain text-primary"></i>
                            </div>
                            <p class="text-sm text-gray-500 mb-4">Plan creation, completion rates, and user engagement metrics.</p>
                            <div class="flex space-x-2">
                                <button class="flex items-center px-3 py-1.5 bg-primary text-white rounded-md text-sm">
                                    <i class="fa-solid fa-file-csv mr-1.5"></i>
                                    <span>CSV</span>
                                </button>
                                <button class="flex items-center px-3 py-1.5 border border-gray-300 text-gray-700 rounded-md text-sm">
                                    <i class="fa-solid fa-code mr-1.5"></i>
                                    <span>JSON</span>
                                </button>
                            </div>
                        </div>
                        
                        <div class="border border-gray-200 rounded-lg p-4 hover:border-primary hover:shadow-md transition-all">
                            <div class="flex items-center justify-between mb-2">
                                <h4 class="font-medium text-gray-800">Subscription Report</h4>
                                <i class="fa-solid fa-credit-card text-primary"></i>
                            </div>
                            <p class="text-sm text-gray-500 mb-4">Subscription status, billing cycles, and plan changes.</p>
                            <div class="flex space-x-2">
                                <button class="flex items-center px-3 py-1.5 bg-primary text-white rounded-md text-sm">
                                    <i class="fa-solid fa-file-csv mr-1.5"></i>
                                    <span>CSV</span>
                                </button>
                                <button class="flex items-center px-3 py-1.5 border border-gray-300 text-gray-700 rounded-md text-sm">
                                    <i class="fa-solid fa-code mr-1.5"></i>
                                    <span>JSON</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    </div>

    <script>
        // Weekly Active Users Chart
        Highcharts.chart('weekly-active-users-chart', {
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
                categories: ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5', 'Week 6', 'Week 7', 'Week 8'],
                labels: {
                    style: {
                        color: '#6B7280'
                    }
                }
            },
            yAxis: {
                title: {
                    text: 'Users',
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
                name: 'Active Users',
                color: '#4A90E2',
                data: [1200, 1450, 1800, 2100, 2300, 2500, 2700, 2845]
            }, {
                name: 'New Users',
                color: '#7ED321',
                data: [300, 280, 350, 320, 280, 250, 220, 180]
            }]
        });

        // Plan Creation Trends Chart
        Highcharts.chart('plan-creation-trends-chart', {
            chart: {
                type: 'areaspline',
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
                areaspline: {
                    fillOpacity: 0.2
                }
            },
            series: [{
                name: 'Personal Plans',
                color: '#4A90E2',
                data: [120, 140, 160, 190, 220, 240, 270, 300, 330, 360, 390, 420]
            }, {
                name: 'Team Plans',
                color: '#7ED321',
                data: [50, 60, 75, 85, 100, 120, 135, 150, 165, 180, 195, 210]
            }]
        });

        // Task Success Rate Chart
        Highcharts.chart('task-success-rate-chart', {
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
                categories: ['Daily Tasks', 'Weekly Tasks', 'Monthly Goals', 'Quarterly Objectives'],
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
                    text: 'Success Rate (%)',
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
                column: {
                    borderRadius: 3,
                    dataLabels: {
                        enabled: true,
                        format: '{y}%'
                    }
                }
            },
            series: [{
                name: 'Free Plan',
                color: '#4A90E2',
                data: [68, 52, 41, 30]
            }, {
                name: 'Pro Plan',
                color: '#7ED321',
                data: [82, 73, 65, 58]
            }, {
                name: 'Team Plan',
                color: '#F5A623',
                data: [91, 85, 78, 72]
            }]
        });

        // Coach Session Usage Chart
        Highcharts.chart('coach-session-usage-chart', {
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
                categories: ['Free Plan', 'Pro Plan', 'Team Plan', 'Enterprise Plan'],
                labels: {
                    style: {
                        color: '#6B7280'
                    }
                }
            },
            yAxis: {
                title: {
                    text: 'Avg. Sessions per User',
                    style: {
                        color: '#6B7280'
                    }
                },
                gridLineColor: '#E5E7EB'
            },
            legend: {
                enabled: false
            },
            credits: {
                enabled: false
            },
            plotOptions: {
                bar: {
                    borderRadius: 3,
                    dataLabels: {
                        enabled: true
                    },
                    colorByPoint: true,
                    colors: ['#4A90E2', '#7ED321', '#F5A623', '#9013FE']
                }
            },
            series: [{
                name: 'Average Sessions',
                data: [2.1, 5.4, 8.7, 12.3]
            }]
        });

        // Role Distribution Pie Chart
        Highcharts.chart('role-distribution-pie-chart', {
            chart: {
                type: 'pie',
                style: {
                    fontFamily: 'Inter, sans-serif'
                }
            },
            title: {
                text: null
            },
            tooltip: {
                pointFormat: '{series.name}: <b>{point.percentage:.1f}%</b>'
            },
            accessibility: {
                point: {
                    valueSuffix: '%'
                }
            },
            plotOptions: {
                pie: {
                    allowPointSelect: true,
                    cursor: 'pointer',
                    dataLabels: {
                        enabled: true,
                        format: '<b>{point.name}</b>: {point.percentage:.1f} %'
                    }
                }
            },
            credits: {
                enabled: false
            },
            series: [{
                name: 'Roles',
                colorByPoint: true,
                data: [{
                    name: 'Individual Users',
                    y: 61.5,
                    color: '#4A90E2'
                }, {
                    name: 'Team Managers',
                    y: 22.1,
                    color: '#7ED321'
                }, {
                    name: 'Coaches',
                    y: 10.8,
                    color: '#F5A623'
                }, {
                    name: 'Admins',
                    y: 5.6,
                    color: '#9013FE'
                }]
            }]
        });

        // Subscription Mix Pie Chart
        Highcharts.chart('subscription-mix-pie-chart', {
            chart: {
                type: 'pie',
                style: {
                    fontFamily: 'Inter, sans-serif'
                }
            },
            title: {
                text: null
            },
            tooltip: {
                pointFormat: '{series.name}: <b>{point.percentage:.1f}%</b>'
            },
            accessibility: {
                point: {
                    valueSuffix: '%'
                }
            },
            plotOptions: {
                pie: {
                    allowPointSelect: true,
                    cursor: 'pointer',
                    dataLabels: {
                        enabled: true,
                        format: '<b>{point.name}</b>: {point.percentage:.1f} %'
                    }
                }
            },
            credits: {
                enabled: false
            },
            series: [{
                name: 'Subscriptions',
                colorByPoint: true,
                data: [{
                    name: 'Free Plan',
                    y: 42.3,
                    color: '#4A90E2'
                }, {
                    name: 'Pro Plan',
                    y: 28.7,
                    color: '#7ED321'
                }, {
                    name: 'Team Plan',
                    y: 21.5,
                    color: '#F5A623'
                }, {
                    name: 'Enterprise Plan',
                    y: 7.5,
                    color: '#9013FE'
                }]
            }]
        });
    </script>

</body></html>
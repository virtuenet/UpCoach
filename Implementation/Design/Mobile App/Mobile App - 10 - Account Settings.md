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
    <div id="account-settings" class="min-h-screen pb-20">
        <!-- Header -->
        <header id="header" class="fixed top-0 left-0 right-0 bg-white shadow-sm z-20 px-4 py-3">
            <div class="flex items-center justify-between">
                <button class="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100">
                    <i class="fa-solid fa-arrow-left text-neutral-700"></i>
                </button>
                <h1 class="text-lg font-semibold">Account Settings</h1>
                <div class="w-8 h-8"></div>
            </div>
        </header>

        <!-- Main Content -->
        <div id="main-content" class="pt-16 px-4 pb-4">
            <!-- Account Profile -->
            <div id="account-profile" class="bg-white rounded-xl p-4 shadow-sm mb-4">
                <div class="flex items-center mb-4">
                    <img src="https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-1.jpg" alt="Profile" class="w-16 h-16 rounded-full mr-4">
                    <div>
                        <h3 class="font-semibold text-lg">Sarah Johnson</h3>
                        <p class="text-sm text-neutral-500">sarah.johnson@company.com</p>
                        <div class="flex items-center mt-1">
                            <i class="fa-brands fa-google text-blue-500 mr-1"></i>
                            <span class="text-xs text-neutral-400">Google Account</span>
                        </div>
                    </div>
                </div>
                
                <div id="google-account-linking" class="border-t pt-4">
                    <div class="flex items-center justify-between mb-3">
                        <div>
                            <h4 class="font-medium">Google Account Integration</h4>
                            <p class="text-xs text-neutral-500">Enable calendar sync, file uploads, and more</p>
                        </div>
                        <label class="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" class="sr-only peer" checked="">
                            <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
                        </label>
                    </div>
                    
                    <div id="google-services" class="space-y-2">
                        <div class="flex items-center justify-between py-2 px-3 bg-neutral-50 rounded-lg">
                            <div class="flex items-center">
                                <i class="fa-brands fa-google text-blue-600 mr-2"></i>
                                <span class="text-sm">Google Docs</span>
                            </div>
                            <i class="fa-solid fa-check text-green-500"></i>
                        </div>
                        
                        <div class="flex items-center justify-between py-2 px-3 bg-neutral-50 rounded-lg">
                            <div class="flex items-center">
                                <i class="fa-solid fa-calendar text-blue-500 mr-2"></i>
                                <span class="text-sm">Google Calendar</span>
                            </div>
                            <i class="fa-solid fa-check text-green-500"></i>
                        </div>
                        
                        <div class="flex items-center justify-between py-2 px-3 bg-neutral-50 rounded-lg">
                            <div class="flex items-center">
                                <i class="fa-brands fa-google-drive text-yellow-500 mr-2"></i>
                                <span class="text-sm">Google Drive</span>
                            </div>
                            <i class="fa-solid fa-check text-green-500"></i>
                        </div>
                        
                        <button id="manage-permissions" class="w-full py-2 text-xs text-primary-600 font-medium border border-primary-200 rounded-lg">
                            Manage Permissions
                        </button>
                    </div>
                </div>
            </div>

            <!-- Subscription Plan -->
           <div id="subscription-plan" class="bg-white rounded-xl p-4 shadow-sm mb-4">
    <h3 class="font-semibold mb-3">Subscription Plan</h3>

    <div class="flex space-x-2 mb-4">
        <div class="flex-1 p-3 border border-neutral-200 rounded-lg">
            <div class="text-center">
                <h4 class="font-medium text-sm">Free</h4>
                <p class="text-xs text-neutral-500">Basic features</p>
            </div>
        </div>

        <div class="flex-1 p-3 border border-neutral-200 rounded-lg">
            <div class="text-center">
                <h4 class="font-medium text-sm">Starter</h4>
                <p class="text-xs text-neutral-500">$4.99 / mo</p>
            </div>
        </div>

        <div class="flex-1 p-3 border-2 border-primary-500 bg-primary-50 rounded-lg">
            <div class="text-center">
                <h4 class="font-medium text-sm text-primary-700">Pro</h4>
                <p class="text-xs text-primary-600">Best Value</p>
            </div>
        </div>
    </div>
                
<div id="plan-features" class="space-y-2 mb-4 text-sm">
        <div class="flex items-center justify-between">
            <span>
                AI Coach (text)
                <i class="fa-solid fa-circle-info text-xs text-neutral-400 ml-1 cursor-help" title="Text-based coaching with your AI assistant."></i>
            </span>
            <span class="font-medium">✅ All Plans</span>
        </div>
        <div class="flex items-center justify-between">
            <span>
                Voice & Video Coaching
                <i class="fa-solid fa-circle-info text-xs text-neutral-400 ml-1 cursor-help" title="Live calls with your AI coach via voice or video."></i>
            </span>
            <span class="font-medium">Pro only</span>
        </div>
        <div class="flex items-center justify-between">
            <span>
                Notes & Uploads
                <i class="fa-solid fa-circle-info text-xs text-neutral-400 ml-1 cursor-help" title="Monthly uploads of voice notes, PDFs, or images."></i>
            </span>
            <span class="font-medium">3 / 20 / Unlimited</span>
        </div>
        <div class="flex items-center justify-between">
            <span>
                Progress Report Export
                <i class="fa-solid fa-circle-info text-xs text-neutral-400 ml-1 cursor-help" title="Generate coaching reports as Docs, Sheets, or PDFs."></i>
            </span>
            <span class="font-medium">❌ / Docs / PDF+Sheets</span>
        </div>
    </div>
                
    <button class="w-full py-2.5 bg-gradient-to-r from-primary-500 to-secondary-500 text-white rounded-lg font-medium transition transform hover:bg-primary-600 active:scale-95" aria-label="Manage your current subscription plan">
        Manage Plan
    </button>

    <button class="w-full mt-3 py-2.5 border border-neutral-200 text-primary-600 rounded-lg font-medium transition transform hover:bg-primary-100 active:scale-95" aria-label="Compare subscription plans">
        Compare Plans →
    </button>
</div>

            <!-- Notifications -->
            <div id="notifications" class="bg-white rounded-xl p-4 shadow-sm mb-4">
                <h3 class="font-semibold mb-3">Notifications</h3>
                
                <div class="space-y-3">
                    <div class="flex items-center justify-between">
                        <div>
                            <h4 class="font-medium text-sm">Mood check-in reminders</h4>
                            <p class="text-xs text-neutral-500">Daily at 9:00 AM</p>
                        </div>
                        <label class="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" class="sr-only peer" checked="">
                            <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
                        </label>
                    </div>
                    
                    <div class="flex items-center justify-between">
                        <div>
                            <h4 class="font-medium text-sm">Task nudges</h4>
                            <p class="text-xs text-neutral-500">Smart reminders for overdue tasks</p>
                        </div>
                        <label class="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" class="sr-only peer" checked="">
                            <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
                        </label>
                    </div>
                    
                    <div class="flex items-center justify-between">
                        <div>
                            <h4 class="font-medium text-sm">Coaching session alerts</h4>
                            <p class="text-xs text-neutral-500">15 minutes before scheduled calls</p>
                        </div>
                        <label class="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" class="sr-only peer">
                            <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
                        </label>
                    </div>
                    
                    <div class="flex items-center justify-between">
                        <div>
                            <h4 class="font-medium text-sm">Weekly report summaries</h4>
                            <p class="text-xs text-neutral-500">Sundays at 6:00 PM</p>
                        </div>
                        <label class="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" class="sr-only peer" checked="">
                            <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
                        </label>
                    </div>
                </div>
            </div>

            <!-- Coach Memory -->
            <section id="coach-memory" class="bg-white rounded-xl p-4 shadow-sm mb-4">
                <h3 class="font-semibold mb-2">Coach Memory</h3>
                <p class="text-sm text-neutral-600 mb-3">Your AI coach remembers patterns and themes from your sessions to improve guidance over time.</p>
                <ul class="space-y-2 text-sm text-primary-600">
                    <li><a href="#" class="hover:underline">View Coaching Themes</a></li>
                    <li><a href="#" class="hover:underline">Clear Specific Entries</a></li>
                    <li><a href="#" class="hover:underline">Download Coach Log</a></li>
                </ul>
            </section>

            <!-- Privacy & Data -->
            <div id="privacy-data" class="bg-white rounded-xl p-4 shadow-sm mb-4">
                <h3 class="font-semibold mb-3">Privacy &amp; Data</h3>
                
                <div class="space-y-3">
                    <div class="p-3 bg-neutral-50 rounded-lg">
                        <p class="text-sm text-neutral-600">Your data is stored securely and used to personalize your AI coaching experience. We never share personal information with third parties.</p>
                    </div>
                    
                    <button class="w-full py-2.5 border border-neutral-200 rounded-lg flex items-center justify-center">
                        <i class="fa-solid fa-download text-primary-600 mr-2"></i>
                        <span class="text-sm">Download My Data</span>
                    </button>
                    
                    <button id="delete-account" class="w-full py-2.5 border border-red-200 text-red-600 rounded-lg flex items-center justify-center">
                        <i class="fa-solid fa-trash text-red-600 mr-2"></i>
                        <span class="text-sm">Delete Account</span>
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
                    <i class="fa-solid fa-gear text-xl"></i>
                    <span class="text-xs mt-1">Settings</span>
                </span>
            </div>
        </nav>
    </div>

    <!-- Manage Permissions Modal -->
    <div id="permissions-modal" class="fixed inset-0 bg-black bg-opacity-50 z-50 hidden">
        <div class="flex items-center justify-center min-h-screen p-4">
            <div class="bg-white rounded-xl max-w-sm w-full p-6">
                <div class="flex items-center justify-between mb-4">
                    <h3 class="font-semibold">Google Permissions</h3>
                    <button id="close-modal" class="w-6 h-6 flex items-center justify-center">
                        <i class="fa-solid fa-times text-neutral-400"></i>
                    </button>
                </div>
                
                <div class="space-y-3 mb-6">
                    <div class="flex items-center justify-between">
                        <span class="text-sm">Calendar events</span>
                        <button class="text-xs text-red-600">Revoke</button>
                    </div>
                    
                    <div class="flex items-center justify-between">
                        <span class="text-sm">Drive file access</span>
                        <button class="text-xs text-red-600">Revoke</button>
                    </div>
                    
                    <div class="flex items-center justify-between">
                        <span class="text-sm">Document creation</span>
                        <button class="text-xs text-red-600">Revoke</button>
                    </div>
                </div>
                
                <button class="w-full py-2.5 bg-primary-500 text-white rounded-lg">
                    Done
                </button>
            </div>
        </div>
    </div>

    <!-- Delete Account Modal -->
    <div id="delete-modal" class="fixed inset-0 bg-black bg-opacity-50 z-50 hidden">
        <div class="flex items-center justify-center min-h-screen p-4">
            <div class="bg-white rounded-xl max-w-sm w-full p-6">
                <div class="text-center mb-4">
                    <i class="fa-solid fa-exclamation-triangle text-red-500 text-3xl mb-2"></i>
                    <h3 class="font-semibold text-lg">Delete Account</h3>
                    <p class="text-sm text-neutral-600 mt-2">This action cannot be undone. All your data will be permanently deleted.</p>
                </div>
                
                <div class="flex space-x-3">
                    <button id="cancel-delete" class="flex-1 py-2.5 border border-neutral-200 rounded-lg text-sm">
                        Cancel
                    </button>
                    <button class="flex-1 py-2.5 bg-red-500 text-white rounded-lg text-sm">
                        Delete
                    </button>
                </div>
            </div>
        </div>
    </div>

    <script>
        document.addEventListener('DOMContentLoaded', function() {
            // Modal handlers
            const managePermissionsBtn = document.getElementById('manage-permissions');
            const permissionsModal = document.getElementById('permissions-modal');
            const closeModalBtn = document.getElementById('close-modal');
            const deleteAccountBtn = document.getElementById('delete-account');
            const deleteModal = document.getElementById('delete-modal');
            const cancelDeleteBtn = document.getElementById('cancel-delete');

            managePermissionsBtn.addEventListener('click', function() {
                permissionsModal.classList.remove('hidden');
            });

            closeModalBtn.addEventListener('click', function() {
                permissionsModal.classList.add('hidden');
            });

            deleteAccountBtn.addEventListener('click', function() {
                deleteModal.classList.remove('hidden');
            });

            cancelDeleteBtn.addEventListener('click', function() {
                deleteModal.classList.add('hidden');
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
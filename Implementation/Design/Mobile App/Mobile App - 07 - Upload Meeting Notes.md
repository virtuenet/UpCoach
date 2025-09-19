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
    <div id="header" class="fixed top-0 left-0 right-0 bg-white shadow-sm z-20 px-4 py-3 flex items-center">
        <button id="back-button" class="p-2 rounded-full hover:bg-gray-100">
            <i class="fa-solid fa-arrow-left text-neutral-700"></i>
        </button>
        <h1 class="text-lg font-semibold ml-2">Upload Meeting Notes</h1>
    </div>

    <!-- Meeting Notes Upload Interface -->
    <div id="upload-meeting-notes" class="pt-16 pb-24 px-5">
        <div id="upload-methods" class="mb-6 mt-4">
            <p class="text-sm text-neutral-500 mb-4">Choose how you want to share your meeting notes</p>
            
            <div class="grid grid-cols-3 gap-3">
                <div id="voice-upload" class="upload-option bg-white rounded-xl p-4 border-2 border-transparent hover:border-primary-500 transition-all shadow-sm text-center">
                    <div class="bg-primary-100 w-12 h-12 rounded-full flex items-center justify-center mb-2 mx-auto">
                        <i class="fa-solid fa-microphone text-primary-600 text-lg"></i>
                    </div>
                    <h3 class="font-medium text-sm">Voice Memo</h3>
                </div>
                
                <div id="photo-upload" class="upload-option bg-white rounded-xl p-4 border-2 border-transparent hover:border-primary-500 transition-all shadow-sm text-center">
                    <div class="bg-secondary-100 w-12 h-12 rounded-full flex items-center justify-center mb-2 mx-auto">
                        <i class="fa-solid fa-camera text-secondary-600 text-lg"></i>
                    </div>
                    <h3 class="font-medium text-sm">Photo</h3>
                </div>
                
                <div id="document-upload" class="upload-option bg-white rounded-xl p-4 border-2 border-primary-500 transition-all shadow-sm text-center">
                    <div class="bg-green-100 w-12 h-12 rounded-full flex items-center justify-center mb-2 mx-auto">
                        <i class="fa-solid fa-file-lines text-green-600 text-lg"></i>
                    </div>
                    <h3 class="font-medium text-sm">Document</h3>
                </div>
            </div>
        </div>
        
        <div id="selected-document" class="bg-white rounded-xl p-4 shadow-sm mb-6">
            <div class="flex items-center">
                <div class="bg-blue-100 w-10 h-10 rounded-lg flex items-center justify-center mr-3">
                    <i class="fa-solid fa-file-word text-blue-600"></i>
                </div>
                <div class="flex-1">
                    <h3 class="font-medium text-sm">Q3 Planning Meeting.docx</h3>
                    <p class="text-xs text-neutral-500">2.1 MB • Just now</p>
                </div>
                <button class="text-neutral-400 hover:text-neutral-600">
                    <i class="fa-solid fa-xmark"></i>
                </button>
            </div>
            
            <div class="mt-3 flex items-center justify-between">
                <div class="h-1.5 bg-gray-200 rounded-full flex-1 mr-3">
                    <div class="h-full bg-primary-500 rounded-full" style="width: 100%"></div>
                </div>
                <span class="text-xs text-neutral-500">Uploaded</span>
            </div>
        </div>
        
        <div id="processing-status" class="bg-primary-50 border border-primary-200 rounded-xl p-4 mb-6">
            <div class="flex items-center justify-between mb-2">
                <h3 class="font-medium text-primary-800">Processing document...</h3>
                <div class="animate-spin text-primary-600">
                    <i class="fa-solid fa-circle-notch"></i>
                </div>
            </div>
            <p class="text-xs text-primary-700">Our AI is analyzing your meeting notes to extract tasks and action items</p>
        </div>
        
        <div id="ai-generated-summary" class="bg-white rounded-xl p-5 shadow-sm mb-6">
            <div class="flex items-center justify-between mb-4">
                <h3 class="font-semibold text-base">AI-Generated Task Summary</h3>
                <span class="bg-green-100 text-green-700 text-xs py-1 px-3 rounded-full flex items-center">
                    <i class="fa-solid fa-check mr-1"></i>
                    Completed
                </span>
            </div>
            
            <div class="space-y-4">
                <div id="task-1" class="task-item">
                    <div class="flex items-center mb-1">
                        <input type="checkbox" id="task-check-1" class="w-4 h-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500">
                        <label for="task-check-1" class="ml-2 font-medium">Update Q3 Marketing Plan</label>
                    </div>
                    <p class="text-xs text-neutral-600 ml-6">Revise social media strategy based on Q2 performance data. Due next Monday.</p>
                    <div class="flex items-center mt-2 ml-6">
                        <span class="bg-primary-100 text-primary-700 text-xs py-0.5 px-2 rounded-full mr-2">Marketing</span>
                        <span class="bg-yellow-100 text-yellow-700 text-xs py-0.5 px-2 rounded-full">High Priority</span>
                    </div>
                </div>
                
                <div id="task-2" class="task-item">
                    <div class="flex items-center mb-1">
                        <input type="checkbox" id="task-check-2" class="w-4 h-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500">
                        <label for="task-check-2" class="ml-2 font-medium">Schedule Team Sync</label>
                    </div>
                    <p class="text-xs text-neutral-600 ml-6">Set up weekly progress review with design and development teams. Start next week.</p>
                    <div class="flex items-center mt-2 ml-6">
                        <span class="bg-purple-100 text-purple-700 text-xs py-0.5 px-2 rounded-full mr-2">Team Management</span>
                        <span class="bg-blue-100 text-blue-700 text-xs py-0.5 px-2 rounded-full">Medium Priority</span>
                    </div>
                </div>
                
                <div id="task-3" class="task-item">
                    <div class="flex items-center mb-1">
                        <input type="checkbox" id="task-check-3" class="w-4 h-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500">
                        <label for="task-check-3" class="ml-2 font-medium">Finalize Budget Proposal</label>
                    </div>
                    <p class="text-xs text-neutral-600 ml-6">Complete Q3 budget allocation document with updated projections. Send to finance by Friday.</p>
                    <div class="flex items-center mt-2 ml-6">
                        <span class="bg-green-100 text-green-700 text-xs py-0.5 px-2 rounded-full mr-2">Finance</span>
                        <span class="bg-red-100 text-red-700 text-xs py-0.5 px-2 rounded-full">Critical</span>
                    </div>
                </div>
            </div>
            
            <button id="add-task-button" class="mt-4 w-full py-2 border border-dashed border-primary-400 text-primary-600 rounded-lg font-medium flex items-center justify-center">
                <i class="fa-solid fa-plus mr-2"></i>
                Add Task Manually
            </button>
        </div>
        
        <div id="coach-insight" class="bg-white rounded-xl p-5 shadow-sm mb-6">
            <div class="flex mb-4">
                <img src="https://storage.googleapis.com/uxpilot-auth.appspot.com/4850872147-c5a84d13c99997fcc053.png" alt="AI Coach Avatar" class="w-10 h-10 rounded-full mr-3 object-cover">
                <div class="flex-1 bg-primary-50 rounded-xl p-3">
                    <p class="text-sm text-neutral-700">I noticed these tasks align with your goal of improving team productivity. Would you like me to suggest ways to prioritize them in your weekly plan?</p>
                </div>
            </div>
            
            <div class="flex space-x-2">
                <button class="flex-1 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium">
                    Yes, please
                </button>
                <button class="flex-1 py-2 border border-neutral-300 text-neutral-700 rounded-lg text-sm">
                    Not now
                </button>
            </div>
        </div>

        <!-- Google Integration Options -->
        <div id="google-integration" class="bg-white rounded-xl p-5 shadow-sm mb-6">
            <h3 class="font-semibold text-base mb-4 flex items-center">
                <i class="fa-brands fa-google text-blue-600 mr-2"></i>
                Google Integration
            </h3>
            
            <div class="space-y-3">
                <button id="export-docs" class="w-full flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors">
                    <div class="flex items-center">
                        <div class="bg-blue-100 w-8 h-8 rounded-lg flex items-center justify-center mr-3">
                            <i class="fa-solid fa-file-export text-blue-600 text-sm"></i>
                        </div>
                        <div class="text-left">
                            <h4 class="font-medium text-sm">Export to Google Docs</h4>
                            <p class="text-xs text-neutral-600">Create a formatted document</p>
                        </div>
                    </div>
                    <i class="fa-solid fa-chevron-right text-neutral-400"></i>
                </button>
                
                <button id="save-drive" class="w-full flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors">
                    <div class="flex items-center">
                        <div class="bg-green-100 w-8 h-8 rounded-lg flex items-center justify-center mr-3">
                            <i class="fa-brands fa-google-drive text-green-600 text-sm"></i>
                        </div>
                        <div class="text-left">
                            <h4 class="font-medium text-sm">Save to Drive</h4>
                            <p class="text-xs text-neutral-600">Store in your Google Drive</p>
                        </div>
                    </div>
                    <i class="fa-solid fa-chevron-right text-neutral-400"></i>
                </button>
                
                <button id="sync-calendar" class="w-full flex items-center justify-between p-3 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 transition-colors">
                    <div class="flex items-center">
                        <div class="bg-purple-100 w-8 h-8 rounded-lg flex items-center justify-center mr-3">
                            <i class="fa-solid fa-calendar-plus text-purple-600 text-sm"></i>
                        </div>
                        <div class="text-left">
                            <h4 class="font-medium text-sm">Sync to Google Calendar</h4>
                            <p class="text-xs text-neutral-600">Add tasks as calendar events</p>
                        </div>
                    </div>
                    <i class="fa-solid fa-chevron-right text-neutral-400"></i>
                </button>
            </div>
        </div>
    </div>
    
    <!-- Bottom Action Bar -->
    <div id="bottom-action-bar" class="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 flex space-x-3 z-20">
        <button id="discard-button" class="flex-1 py-3 border border-neutral-300 text-neutral-700 rounded-lg font-medium">
            Discard
        </button>
        <button id="save-button" class="flex-1 py-3 bg-primary-600 text-white rounded-lg font-medium shadow-md">
            Save to My Tasks
        </button>
    </div>
    
    <!-- Edit Task Modal (Hidden by default) -->
    <div id="edit-task-modal" class="fixed inset-0 bg-black bg-opacity-50 flex items-end justify-center z-30 hidden">
        <div class="bg-white rounded-t-xl w-full max-h-[80vh] overflow-y-auto p-5">
            <div class="flex justify-between items-center mb-5">
                <h3 class="text-lg font-semibold">Edit Task</h3>
                <button id="close-modal" class="p-2 text-neutral-500">
                    <i class="fa-solid fa-xmark"></i>
                </button>
            </div>
            
            <div class="space-y-4">
                <div>
                    <label class="text-sm font-medium mb-1 block">Task Name</label>
                    <input type="text" class="w-full p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500" value="Update Q3 Marketing Plan">
                </div>
                
                <div>
                    <label class="text-sm font-medium mb-1 block">Description</label>
                    <textarea class="w-full p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500 h-24">Revise social media strategy based on Q2 performance data. Due next Monday.</textarea>
                </div>
                
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="text-sm font-medium mb-1 block">Category</label>
                        <select class="w-full p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white">
                            <option>Marketing</option>
                            <option>Finance</option>
                            <option>Team Management</option>
                            <option>Product</option>
                            <option>Customer Support</option>
                        </select>
                    </div>
                    
                    <div>
                        <label class="text-sm font-medium mb-1 block">Priority</label>
                        <select class="w-full p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white">
                            <option>High Priority</option>
                            <option>Medium Priority</option>
                            <option>Low Priority</option>
                            <option>Critical</option>
                        </select>
                    </div>
                </div>
                
                <div>
                    <label class="text-sm font-medium mb-1 block">Due Date</label>
                    <input type="date" class="w-full p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white">
                </div>
                
                <div>
                    <label class="text-sm font-medium mb-1 block">Link to Goal</label>
                    <select class="w-full p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white">
                        <option>Improve team productivity</option>
                        <option>Increase marketing ROI</option>
                        <option>Enhance customer satisfaction</option>
                        <option>Develop leadership skills</option>
                    </select>
                </div>
            </div>
            
            <button class="w-full py-3 bg-primary-600 text-white rounded-lg font-medium shadow-md mt-6">
                Save Changes
            </button>
        </div>
    </div>
    
    <script>
        document.addEventListener('DOMContentLoaded', function() {
            // Handle back button
            document.getElementById('back-button').addEventListener('click', function() {
                // Navigate back logic here
                console.log('Navigate back');
            });
            
            // Handle upload options
            const uploadOptions = document.querySelectorAll('.upload-option');
            uploadOptions.forEach(option => {
                option.addEventListener('click', function() {
                    // Reset all borders
                    uploadOptions.forEach(opt => {
                        opt.classList.remove('border-primary-500');
                        opt.classList.add('border-transparent');
                    });
                    
                    // Set selected border
                    this.classList.remove('border-transparent');
                    this.classList.add('border-primary-500');
                });
            });
            
            // Handle task editing
            const taskItems = document.querySelectorAll('.task-item');
            const editTaskModal = document.getElementById('edit-task-modal');
            
            taskItems.forEach(task => {
                task.addEventListener('click', function(e) {
                    // Don't open modal if checkbox was clicked
                    if (e.target.type !== 'checkbox') {
                        editTaskModal.classList.remove('hidden');
                    }
                });
            });
            
            // Close modal
            document.getElementById('close-modal').addEventListener('click', function() {
                editTaskModal.classList.add('hidden');
            });
            
            // Add task button
            document.getElementById('add-task-button').addEventListener('click', function() {
                // Clear form and open modal
                editTaskModal.classList.remove('hidden');
            });
            
            // Save button
            document.getElementById('save-button').addEventListener('click', function() {
                // Save logic here
                console.log('Tasks saved');
                
                // Show success toast or navigate
                const toast = document.createElement('div');
                toast.className = 'fixed bottom-20 left-1/2 transform -translate-x-1/2 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg z-50';
                toast.innerHTML = '<div class="flex items-center"><i class="fa-solid fa-check mr-2"></i>Tasks saved successfully</div>';
                document.body.appendChild(toast);
                
                setTimeout(() => {
                    toast.remove();
                    // Navigate to tasks page
                }, 2000);
            });
            
            // Discard button
            document.getElementById('discard-button').addEventListener('click', function() {
                // Discard logic here
                console.log('Changes discarded');
                // Navigate back
            });

            // Google Integration handlers
            document.getElementById('export-docs').addEventListener('click', function() {
                // Show loading state
                this.innerHTML = '<div class="flex items-center justify-center"><i class="fa-solid fa-spinner animate-spin mr-2"></i>Exporting to Google Docs...</div>';
                
                // Simulate export process
                setTimeout(() => {
                    const toast = document.createElement('div');
                    toast.className = 'fixed bottom-20 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg z-50';
                    toast.innerHTML = '<div class="flex items-center"><i class="fa-solid fa-check mr-2"></i>Exported to Google Docs successfully</div>';
                    document.body.appendChild(toast);
                    
                    setTimeout(() => toast.remove(), 3000);
                    
                    // Reset button
                    this.innerHTML = `<div class="flex items-center">
                        <div class="bg-blue-100 w-8 h-8 rounded-lg flex items-center justify-center mr-3">
                            <i class="fa-solid fa-file-export text-blue-600 text-sm"></i>
                        </div>
                        <div class="text-left">
                            <h4 class="font-medium text-sm">Export to Google Docs</h4>
                            <p class="text-xs text-neutral-600">Create a formatted document</p>
                        </div>
                    </div>
                    <i class="fa-solid fa-chevron-right text-neutral-400"></i>`;
                }, 2000);
            });
            
            document.getElementById('save-drive').addEventListener('click', function() {
                this.innerHTML = '<div class="flex items-center justify-center"><i class="fa-solid fa-spinner animate-spin mr-2"></i>Saving to Drive...</div>';
                
                setTimeout(() => {
                    const toast = document.createElement('div');
                    toast.className = 'fixed bottom-20 left-1/2 transform -translate-x-1/2 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg z-50';
                    toast.innerHTML = '<div class="flex items-center"><i class="fa-solid fa-check mr-2"></i>Saved to Google Drive successfully</div>';
                    document.body.appendChild(toast);
                    
                    setTimeout(() => toast.remove(), 3000);
                    
                    this.innerHTML = `<div class="flex items-center">
                        <div class="bg-green-100 w-8 h-8 rounded-lg flex items-center justify-center mr-3">
                            <i class="fa-brands fa-google-drive text-green-600 text-sm"></i>
                        </div>
                        <div class="text-left">
                            <h4 class="font-medium text-sm">Save to Drive</h4>
                            <p class="text-xs text-neutral-600">Store in your Google Drive</p>
                        </div>
                    </div>
                    <i class="fa-solid fa-chevron-right text-neutral-400"></i>`;
                }, 2000);
            });
            
            document.getElementById('sync-calendar').addEventListener('click', function() {
                this.innerHTML = '<div class="flex items-center justify-center"><i class="fa-solid fa-spinner animate-spin mr-2"></i>Syncing to Calendar...</div>';
                
                setTimeout(() => {
                    const toast = document.createElement('div');
                    toast.className = 'fixed bottom-20 left-1/2 transform -translate-x-1/2 bg-purple-600 text-white px-4 py-2 rounded-lg shadow-lg z-50';
                    toast.innerHTML = '<div class="flex items-center"><i class="fa-solid fa-check mr-2"></i>Synced to Google Calendar successfully</div>';
                    document.body.appendChild(toast);
                    
                    setTimeout(() => toast.remove(), 3000);
                    
                    this.innerHTML = `<div class="flex items-center">
                        <div class="bg-purple-100 w-8 h-8 rounded-lg flex items-center justify-center mr-3">
                            <i class="fa-solid fa-calendar-plus text-purple-600 text-sm"></i>
                        </div>
                        <div class="text-left">
                            <h4 class="font-medium text-sm">Sync to Google Calendar</h4>
                            <p class="text-xs text-neutral-600">Add tasks as calendar events</p>
                        </div>
                    </div>
                    <i class="fa-solid fa-chevron-right text-neutral-400"></i>`;
                }, 2000);
            });
        });
    </script>

</body></html>
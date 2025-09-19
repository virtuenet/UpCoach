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
    <!-- Splash Screen -->
    <div id="splash-screen" class="fixed inset-0 flex items-center justify-center bg-gradient-to-br from-primary-500 to-secondary-600 z-50">
        <div class="text-center">
            <div class="w-24 h-24 mb-4 mx-auto bg-white rounded-full flex items-center justify-center shadow-lg">
                <i class="fa-solid fa-brain text-5xl text-primary-600"></i>
            </div>
            <h1 class="text-3xl font-bold text-white">UpCoach</h1>
            <p class="text-white text-sm mt-1">AI Coach at Work</p>
        </div>
    </div>

    <!-- Onboarding Flow -->
    <div id="onboarding-container" class="h-[100vh] overflow-hidden">
        <!-- Progress Bar -->
        <div id="progress-bar" class="fixed top-0 left-0 right-0 h-1 bg-gray-200 z-10">
            <div class="h-full bg-primary-500 transition-all duration-300" style="width: 20%"></div>
        </div>

        <!-- Step 1: Role Selection -->
        <div id="role-selection" class="h-full px-6 py-10">
            <div class="mb-8 text-center">
                <h1 class="text-2xl font-bold mb-1">What's your role?</h1>
                <p class="text-neutral-500 text-sm">Help us personalize your coaching experience</p>
            </div>
            
            <div class="grid grid-cols-2 gap-4">
                <div class="role-option bg-white rounded-xl p-4 border-2 border-transparent hover:border-primary-500 transition-all shadow-sm">
                    <div class="bg-primary-100 w-12 h-12 rounded-full flex items-center justify-center mb-3">
                        <i class="fa-solid fa-user text-primary-600"></i>
                    </div>
                    <h3 class="font-medium mb-1">Individual Contributor</h3>
                    <p class="text-xs text-neutral-500">Focus on personal growth and task execution</p>
                </div>
                
                <div class="role-option bg-white rounded-xl p-4 border-2 border-transparent hover:border-primary-500 transition-all shadow-sm">
                    <div class="bg-secondary-100 w-12 h-12 rounded-full flex items-center justify-center mb-3">
                        <i class="fa-solid fa-users text-secondary-600"></i>
                    </div>
                    <h3 class="font-medium mb-1">Manager</h3>
                    <p class="text-xs text-neutral-500">Leadership and team development skills</p>
                </div>
                
                <div class="role-option bg-white rounded-xl p-4 border-2 border-transparent hover:border-primary-500 transition-all shadow-sm">
                    <div class="bg-green-100 w-12 h-12 rounded-full flex items-center justify-center mb-3">
                        <i class="fa-solid fa-graduation-cap text-green-600"></i>
                    </div>
                    <h3 class="font-medium mb-1">New Hire</h3>
                    <p class="text-xs text-neutral-500">Onboarding and integration support</p>
                </div>
                
                <div class="role-option bg-white rounded-xl p-4 border-2 border-transparent hover:border-primary-500 transition-all shadow-sm">
                    <div class="bg-purple-100 w-12 h-12 rounded-full flex items-center justify-center mb-3">
                        <i class="fa-solid fa-briefcase text-purple-600"></i>
                    </div>
                    <h3 class="font-medium mb-1">Executive</h3>
                    <p class="text-xs text-neutral-500">Strategic thinking and leadership</p>
                </div>
            </div>
            
            <div class="mt-6">
                <label class="text-sm font-medium mb-2 block">Department</label>
                <div class="relative">
                    <select class="w-full p-3 rounded-lg border border-gray-300 appearance-none focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white">
                        <option>Select your department</option>
                        <option>Engineering</option>
                        <option>Marketing</option>
                        <option>Sales</option>
                        <option>Human Resources</option>
                        <option>Product</option>
                        <option>Design</option>
                        <option>Operations</option>
                    </select>
                    <div class="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none">
                        <i class="fa-solid fa-chevron-down text-gray-400"></i>
                    </div>
                </div>
            </div>
            
            <div class="fixed bottom-6 left-6 right-6">
                <button id="next-step-1" class="w-full py-3 bg-primary-600 text-white rounded-lg font-medium shadow-md">
                    Continue
                </button>
            </div>
        </div>

        <!-- Step 2: Coaching Goals -->
        <div id="coaching-goals" class="h-full px-6 py-10 hidden">
            <div class="mb-8 text-center">
                <h1 class="text-2xl font-bold mb-1">What are your coaching goals?</h1>
                <p class="text-neutral-500 text-sm">Select all that apply to you</p>
            </div>
            
            <div class="space-y-3">
                <div class="goal-option flex items-center bg-white p-4 rounded-xl shadow-sm">
                    <input type="checkbox" id="goal1" class="w-5 h-5 text-primary-600 rounded border-gray-300 focus:ring-primary-500">
                    <label for="goal1" class="ml-3 flex-1">
                        <span class="font-medium block">Improve confidence</span>
                        <span class="text-xs text-neutral-500">Public speaking, meetings, presentations</span>
                    </label>
                </div>
                
                <div class="goal-option flex items-center bg-white p-4 rounded-xl shadow-sm">
                    <input type="checkbox" id="goal2" class="w-5 h-5 text-primary-600 rounded border-gray-300 focus:ring-primary-500">
                    <label for="goal2" class="ml-3 flex-1">
                        <span class="font-medium block">Better focus &amp; productivity</span>
                        <span class="text-xs text-neutral-500">Task management, prioritization, deep work</span>
                    </label>
                </div>
                
                <div class="goal-option flex items-center bg-white p-4 rounded-xl shadow-sm">
                    <input type="checkbox" id="goal3" class="w-5 h-5 text-primary-600 rounded border-gray-300 focus:ring-primary-500">
                    <label for="goal3" class="ml-3 flex-1">
                        <span class="font-medium block">Leadership skills</span>
                        <span class="text-xs text-neutral-500">Team management, delegation, vision</span>
                    </label>
                </div>
                
                <div class="goal-option flex items-center bg-white p-4 rounded-xl shadow-sm">
                    <input type="checkbox" id="goal4" class="w-5 h-5 text-primary-600 rounded border-gray-300 focus:ring-primary-500">
                    <label for="goal4" class="ml-3 flex-1">
                        <span class="font-medium block">Work-life balance</span>
                        <span class="text-xs text-neutral-500">Stress management, boundaries, wellness</span>
                    </label>
                </div>
                
                <div class="goal-option flex items-center bg-white p-4 rounded-xl shadow-sm">
                    <input type="checkbox" id="goal5" class="w-5 h-5 text-primary-600 rounded border-gray-300 focus:ring-primary-500">
                    <label for="goal5" class="ml-3 flex-1">
                        <span class="font-medium block">Career advancement</span>
                        <span class="text-xs text-neutral-500">Skill development, networking, visibility</span>
                    </label>
                </div>
                
                <div class="goal-option flex items-center bg-white p-4 rounded-xl shadow-sm">
                    <input type="checkbox" id="goal6" class="w-5 h-5 text-primary-600 rounded border-gray-300 focus:ring-primary-500">
                    <label for="goal6" class="ml-3 flex-1">
                        <span class="font-medium block">Communication skills</span>
                        <span class="text-xs text-neutral-500">Clarity, empathy, active listening</span>
                    </label>
                </div>
            </div>
            
            <div class="fixed bottom-6 left-6 right-6">
                <button id="next-step-2" class="w-full py-3 bg-primary-600 text-white rounded-lg font-medium shadow-md">
                    Continue
                </button>
            </div>
        </div>

        <!-- Step 3: Mood Check-in -->
        <div id="mood-checkin" class="h-full px-6 py-10 hidden">
            <div class="mb-8 text-center">
                <h1 class="text-2xl font-bold mb-1">How are you feeling today?</h1>
                <p class="text-neutral-500 text-sm">This helps us establish your baseline mood</p>
            </div>
            
            <div class="mood-slider mb-10">
                <div class="flex justify-between mb-2">
                    <span class="text-sm text-neutral-500">Low energy</span>
                    <span class="text-sm text-neutral-500">High energy</span>
                </div>
                <input type="range" min="1" max="100" value="50" class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-600">
                
                <div class="flex justify-between mt-8 text-center">
                    <div class="mood-option">
                        <div class="text-2xl mb-1">😔</div>
                        <span class="text-xs">Stressed</span>
                    </div>
                    <div class="mood-option">
                        <div class="text-2xl mb-1">😐</div>
                        <span class="text-xs">Neutral</span>
                    </div>
                    <div class="mood-option">
                        <div class="text-2xl mb-1">🙂</div>
                        <span class="text-xs">Content</span>
                    </div>
                    <div class="mood-option">
                        <div class="text-2xl mb-1">😊</div>
                        <span class="text-xs">Happy</span>
                    </div>
                    <div class="mood-option">
                        <div class="text-2xl mb-1">🤩</div>
                        <span class="text-xs">Excited</span>
                    </div>
                </div>
            </div>
            
            <div class="mb-6">
                <label class="text-sm font-medium mb-2 block">What's on your mind today? (Optional)</label>
                <textarea class="w-full p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white h-24" placeholder="Share your thoughts..."></textarea>
            </div>
            
            <div class="fixed bottom-6 left-6 right-6">
                <button id="next-step-3" class="w-full py-3 bg-primary-600 text-white rounded-lg font-medium shadow-md">
                    Continue
                </button>
            </div>
        </div>

        <!-- Step 4: Coach Compatibility Quiz -->
        <div id="compatibility-quiz" class="h-full px-6 py-10 hidden">
            <div class="mb-8 text-center">
                <h1 class="text-2xl font-bold mb-1">Coach Compatibility Quiz</h1>
                <p class="text-neutral-500 text-sm">Let's find your perfect AI coach match</p>
            </div>
            
            <div class="quiz-question mb-6">
                <h3 class="font-medium mb-3">When receiving feedback, I prefer:</h3>
                <div class="space-y-2">
                    <div class="option flex items-center bg-white p-3 rounded-lg shadow-sm">
                        <input type="radio" name="feedback" id="feedback1" class="w-4 h-4 text-primary-600 focus:ring-primary-500">
                        <label for="feedback1" class="ml-3 text-sm">Direct and straightforward</label>
                    </div>
                    <div class="option flex items-center bg-white p-3 rounded-lg shadow-sm">
                        <input type="radio" name="feedback" id="feedback2" class="w-4 h-4 text-primary-600 focus:ring-primary-500">
                        <label for="feedback2" class="ml-3 text-sm">Gentle and supportive</label>
                    </div>
                    <div class="option flex items-center bg-white p-3 rounded-lg shadow-sm">
                        <input type="radio" name="feedback" id="feedback3" class="w-4 h-4 text-primary-600 focus:ring-primary-500">
                        <label for="feedback3" class="ml-3 text-sm">A mix of both approaches</label>
                    </div>
                </div>
            </div>
            
            <div class="quiz-question mb-6">
                <h3 class="font-medium mb-3">I learn best through:</h3>
                <div class="space-y-2">
                    <div class="option flex items-center bg-white p-3 rounded-lg shadow-sm">
                        <input type="radio" name="learning" id="learning1" class="w-4 h-4 text-primary-600 focus:ring-primary-500">
                        <label for="learning1" class="ml-3 text-sm">Practical examples and stories</label>
                    </div>
                    <div class="option flex items-center bg-white p-3 rounded-lg shadow-sm">
                        <input type="radio" name="learning" id="learning2" class="w-4 h-4 text-primary-600 focus:ring-primary-500">
                        <label for="learning2" class="ml-3 text-sm">Data, facts and analysis</label>
                    </div>
                    <div class="option flex items-center bg-white p-3 rounded-lg shadow-sm">
                        <input type="radio" name="learning" id="learning3" class="w-4 h-4 text-primary-600 focus:ring-primary-500">
                        <label for="learning3" class="ml-3 text-sm">Interactive challenges and exercises</label>
                    </div>
                </div>
            </div>
            
            <div class="quiz-question mb-6">
                <h3 class="font-medium mb-3">My ideal coach would be:</h3>
                <div class="space-y-2">
                    <div class="option flex items-center bg-white p-3 rounded-lg shadow-sm">
                        <input type="radio" name="coach" id="coach1" class="w-4 h-4 text-primary-600 focus:ring-primary-500">
                        <label for="coach1" class="ml-3 text-sm">A motivational cheerleader</label>
                    </div>
                    <div class="option flex items-center bg-white p-3 rounded-lg shadow-sm">
                        <input type="radio" name="coach" id="coach2" class="w-4 h-4 text-primary-600 focus:ring-primary-500">
                        <label for="coach2" class="ml-3 text-sm">A wise, experienced mentor</label>
                    </div>
                    <div class="option flex items-center bg-white p-3 rounded-lg shadow-sm">
                        <input type="radio" name="coach" id="coach3" class="w-4 h-4 text-primary-600 focus:ring-primary-500">
                        <label for="coach3" class="ml-3 text-sm">An empathetic listener</label>
                    </div>
                </div>
            </div>
            
            <div class="fixed bottom-6 left-6 right-6">
                <button id="next-step-4" class="w-full py-3 bg-primary-600 text-white rounded-lg font-medium shadow-md">
                    Find My Coach Match
                </button>
            </div>
        </div>

        <!-- Step 5: Avatar Selection -->
        <div id="avatar-selection" class="h-full px-6 py-10 hidden">
            <div class="mb-6 text-center">
                <h1 class="text-2xl font-bold mb-1">Meet Your AI Coaches</h1>
                <p class="text-neutral-500 text-sm">Based on your profile, these coaches match your style</p>
            </div>
            
            <div class="coach-carousel h-[300px] mb-6 relative">
                <div class="absolute inset-0 flex items-center justify-center">
                    <img class="w-full h-full object-contain" src="https://storage.googleapis.com/uxpilot-auth.appspot.com/4850872147-c5a84d13c99997fcc053.png" alt="3D rendered professional female AI coach avatar with blue background, friendly smile, professional appearance">
                </div>
                
                <button class="absolute left-0 top-1/2 transform -translate-y-1/2 bg-white rounded-full w-10 h-10 flex items-center justify-center shadow-md z-10">
                    <i class="fa-solid fa-chevron-left text-neutral-600"></i>
                </button>
                
                <button class="absolute right-0 top-1/2 transform -translate-y-1/2 bg-white rounded-full w-10 h-10 flex items-center justify-center shadow-md z-10">
                    <i class="fa-solid fa-chevron-right text-neutral-600"></i>
                </button>
                
                <div class="absolute bottom-4 left-0 right-0 flex justify-center space-x-2">
                    <div class="w-2 h-2 rounded-full bg-primary-600"></div>
                    <div class="w-2 h-2 rounded-full bg-gray-300"></div>
                    <div class="w-2 h-2 rounded-full bg-gray-300"></div>
                </div>
            </div>
            
            <div class="coach-details bg-white rounded-xl p-5 shadow-sm mb-6">
                <div class="flex justify-between items-center mb-3">
                    <h2 class="text-xl font-semibold">Alex</h2>
                    <span class="bg-primary-100 text-primary-700 text-xs py-1 px-3 rounded-full">98% Match</span>
                </div>
                
                <p class="text-sm text-neutral-600 mb-4">A supportive mentor who balances empathy with practical advice. Alex excels at breaking complex problems into actionable steps.</p>
                
                <div class="grid grid-cols-2 gap-3 text-sm">
                    <div class="flex items-center">
                        <i class="fa-solid fa-comment text-primary-500 mr-2"></i>
                        <span>Direct &amp; supportive</span>
                    </div>
                    <div class="flex items-center">
                        <i class="fa-solid fa-brain text-primary-500 mr-2"></i>
                        <span>Strategic thinker</span>
                    </div>
                    <div class="flex items-center">
                        <i class="fa-solid fa-volume-high text-primary-500 mr-2"></i>
                        <span>Calm, clear voice</span>
                    </div>
                    <div class="flex items-center">
                        <i class="fa-solid fa-lightbulb text-primary-500 mr-2"></i>
                        <span>Practical examples</span>
                    </div>
                </div>
                
                <button class="mt-4 w-full py-2 border border-primary-600 text-primary-600 rounded-lg font-medium">
                    Preview Voice
                </button>
            </div>
            
            <div class="fixed bottom-6 left-6 right-6">
                <button id="next-step-5" class="w-full py-3 bg-primary-600 text-white rounded-lg font-medium shadow-md">
                    Choose This Coach
                </button>
            </div>
        </div>

        <!-- Step 6: Login Options -->
        <div id="login-options" class="h-full px-6 py-10 hidden">
            <div class="mb-8 text-center">
                <h1 class="text-2xl font-bold mb-1">Create Your Account</h1>
                <p class="text-neutral-500 text-sm">Last step to start your coaching journey</p>
            </div>
            
            <div class="space-y-4 mb-6">
                <div>
                    <label class="text-sm font-medium mb-1 block">Email</label>
                    <input type="email" class="w-full p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500" placeholder="your@email.com">
                </div>
                
                <div>
                    <label class="text-sm font-medium mb-1 block">Password</label>
                    <input type="password" class="w-full p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500" placeholder="Create a password">
                </div>
                
                <div class="flex items-center">
                    <input type="checkbox" id="terms" class="w-4 h-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500">
                    <label for="terms" class="ml-2 text-xs text-neutral-600">
                        I agree to the <span class="text-primary-600 cursor-pointer">Terms of Service</span> and <span class="text-primary-600 cursor-pointer">Privacy Policy</span>
                    </label>
                </div>
            </div>
            
            <button class="w-full py-3 bg-primary-600 text-white rounded-lg font-medium shadow-md mb-4">
                Create Account
            </button>
            
            <div class="relative flex items-center my-6">
                <div class="flex-grow border-t border-gray-300"></div>
                <span class="flex-shrink mx-4 text-neutral-500 text-sm">or continue with</span>
                <div class="flex-grow border-t border-gray-300"></div>
            </div>
            
            <div class="grid grid-cols-2 gap-4">
                <button class="py-3 bg-white border border-gray-300 rounded-lg font-medium shadow-sm flex items-center justify-center">
                    <i class="fa-brands fa-google mr-2 text-neutral-700"></i>
                    Google
                </button>
            </div>
            
            <div class="mt-6 text-center">
                <p class="text-sm text-neutral-600">
                    Already have an account? <span class="text-primary-600 font-medium cursor-pointer">Sign in</span>
                </p>
            </div>
        </div>
    </div>

    <script>
        // Simulating the onboarding flow navigation
        document.addEventListener('DOMContentLoaded', function() {
            // Hide splash screen after 2 seconds
            setTimeout(function() {
                document.getElementById('splash-screen').style.opacity = '0';
                document.getElementById('splash-screen').style.transition = 'opacity 0.5s ease';
                setTimeout(function() {
                    document.getElementById('splash-screen').style.display = 'none';
                }, 500);
            }, 2000);
            
            // Navigation between steps
            const steps = [
                'role-selection',
                'coaching-goals',
                'mood-checkin',
                'compatibility-quiz',
                'avatar-selection',
                'login-options'
            ];
            
            let currentStep = 0;
            
            function updateProgressBar() {
                const progress = ((currentStep + 1) / steps.length) * 100;
                document.querySelector('#progress-bar > div').style.width = `${progress}%`;
            }
            
            function showStep(index) {
                steps.forEach((step, i) => {
                    const el = document.getElementById(step);
                    if (i === index) {
                        el.classList.remove('hidden');
                    } else {
                        el.classList.add('hidden');
                    }
                });
                currentStep = index;
                updateProgressBar();
            }
            
            // Set up next buttons
            document.getElementById('next-step-1').addEventListener('click', () => showStep(1));
            document.getElementById('next-step-2').addEventListener('click', () => showStep(2));
            document.getElementById('next-step-3').addEventListener('click', () => showStep(3));
            document.getElementById('next-step-4').addEventListener('click', () => showStep(4));
            document.getElementById('next-step-5').addEventListener('click', () => showStep(5));
        });
    </script>

</body></html>
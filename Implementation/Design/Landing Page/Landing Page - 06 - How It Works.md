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
        "background": "#F5F5F5",
        "dark": "#333333",
        "light": "#FFFFFF"
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
<body class="font-sans bg-background text-dark">
    <!-- Header -->
    <header id="header" class="fixed top-0 left-0 right-0 bg-white z-50 shadow-sm">
        <div class="container mx-auto px-6 py-4 flex justify-between items-center">
            <div class="flex items-center">
                <div class="text-2xl font-bold text-primary">
                    <span>Up</span><span class="text-accent">Coach</span>
                </div>
            </div>
            <nav class="hidden md:flex space-x-8">
                <span class="text-dark hover:text-primary font-medium transition duration-300 cursor-pointer">Features</span>
                <span class="text-primary font-medium transition duration-300 cursor-pointer">How It Works</span>
                <span class="text-dark hover:text-primary font-medium transition duration-300 cursor-pointer">Testimonials</span>
                <span class="text-dark hover:text-primary font-medium transition duration-300 cursor-pointer">Pricing</span>
            </nav>
            <div class="hidden md:block">
                <span class="bg-primary text-white px-6 py-2 rounded-full font-medium hover:bg-opacity-90 transition duration-300 cursor-pointer">Download</span>
            </div>
            <button class="md:hidden text-dark">
                <i class="fa-solid fa-bars text-xl"></i>
            </button>
        </div>
    </header>

    <!-- How It Works Section -->
    <section id="how-it-works" class="pt-28 pb-16 md:pb-24 bg-white">
        <div class="container mx-auto px-6">
            <div class="text-center mb-16">
                <h2 class="text-3xl md:text-4xl font-bold mb-4">How UpCoach Works</h2>
                <p class="text-lg text-gray-600 max-w-2xl mx-auto">Getting started with UpCoach is simple and takes just minutes to transform your work life.</p>
            </div>
            
            <!-- Card Layout Version -->
            <div id="steps-cards" class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
                <div id="step-1" class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden transition-transform duration-300 hover:transform hover:scale-105">
                    <div class="p-6">
                        <div class="w-16 h-16 bg-primary bg-opacity-10 rounded-full flex items-center justify-center mb-6">
                            <i class="fa-solid fa-user-plus text-primary text-xl"></i>
                        </div>
                        <h3 class="text-xl font-bold mb-3">Onboard</h3>
                        <p class="text-gray-600">Download the app and create your profile with your goals and workplace preferences.</p>
                    </div>
                    <div class="bg-primary bg-opacity-5 px-6 py-4">
                        <span class="flex items-center text-primary font-medium text-sm">
                            <span>Step 1</span>
                            <i class="fa-solid fa-arrow-right ml-2"></i>
                        </span>
                    </div>
                </div>
                
                <div id="step-2" class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden transition-transform duration-300 hover:transform hover:scale-105">
                    <div class="p-6">
                        <div class="w-16 h-16 bg-primary bg-opacity-10 rounded-full flex items-center justify-center mb-6">
                            <i class="fa-solid fa-robot text-primary text-xl"></i>
                        </div>
                        <h3 class="text-xl font-bold mb-3">Meet Your Coach</h3>
                        <p class="text-gray-600">Get matched with an AI coach personalized to your career stage and development needs.</p>
                    </div>
                    <div class="bg-primary bg-opacity-5 px-6 py-4">
                        <span class="flex items-center text-primary font-medium text-sm">
                            <span>Step 2</span>
                            <i class="fa-solid fa-arrow-right ml-2"></i>
                        </span>
                    </div>
                </div>
                
                <div id="step-3" class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden transition-transform duration-300 hover:transform hover:scale-105">
                    <div class="p-6">
                        <div class="w-16 h-16 bg-primary bg-opacity-10 rounded-full flex items-center justify-center mb-6">
                            <i class="fa-solid fa-bell text-primary text-xl"></i>
                        </div>
                        <h3 class="text-xl font-bold mb-3">Receive Nudges</h3>
                        <p class="text-gray-600">Get timely check-ins and guidance when you need it most throughout your workday.</p>
                    </div>
                    <div class="bg-primary bg-opacity-5 px-6 py-4">
                        <span class="flex items-center text-primary font-medium text-sm">
                            <span>Step 3</span>
                            <i class="fa-solid fa-arrow-right ml-2"></i>
                        </span>
                    </div>
                </div>
                
                <div id="step-4" class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden transition-transform duration-300 hover:transform hover:scale-105">
                    <div class="p-6">
                        <div class="w-16 h-16 bg-primary bg-opacity-10 rounded-full flex items-center justify-center mb-6">
                            <i class="fa-solid fa-chart-line text-primary text-xl"></i>
                        </div>
                        <h3 class="text-xl font-bold mb-3">Track Growth</h3>
                        <p class="text-gray-600">Monitor your progress and see how your professional skills develop over time.</p>
                    </div>
                    <div class="bg-primary bg-opacity-5 px-6 py-4">
                        <span class="flex items-center text-primary font-medium text-sm">
                            <span>Step 4</span>
                            <i class="fa-solid fa-check ml-2"></i>
                        </span>
                    </div>
                </div>
            </div>
            
            <!-- Horizontal Scroll Version -->
            <div id="steps-horizontal" class="relative mt-16 mb-8">
                <div class="overflow-x-auto pb-8">
                    <div class="flex space-x-6 min-w-max px-4">
                        <div id="step-horizontal-1" class="w-80 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                            <div class="flex items-start mb-6">
                                <div class="w-14 h-14 bg-primary bg-opacity-10 rounded-full flex items-center justify-center flex-shrink-0">
                                    <i class="fa-solid fa-user-plus text-primary text-xl"></i>
                                </div>
                                <div class="ml-4 flex-1">
                                    <div class="flex justify-between items-center">
                                        <h3 class="text-xl font-bold">Onboard</h3>
                                        <span class="bg-primary bg-opacity-10 text-primary text-xs font-medium px-3 py-1 rounded-full">Step 1</span>
                                    </div>
                                    <p class="text-gray-600 mt-2">Download the app and create your profile with your goals and workplace preferences.</p>
                                </div>
                            </div>
                            <div class="flex justify-between items-center text-sm">
                                <span class="text-gray-500">Takes 2 minutes</span>
                                <span class="text-primary font-medium">Get Started →</span>
                            </div>
                        </div>
                        
                        <div id="step-horizontal-2" class="w-80 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                            <div class="flex items-start mb-6">
                                <div class="w-14 h-14 bg-primary bg-opacity-10 rounded-full flex items-center justify-center flex-shrink-0">
                                    <i class="fa-solid fa-robot text-primary text-xl"></i>
                                </div>
                                <div class="ml-4 flex-1">
                                    <div class="flex justify-between items-center">
                                        <h3 class="text-xl font-bold">Meet Your Coach</h3>
                                        <span class="bg-primary bg-opacity-10 text-primary text-xs font-medium px-3 py-1 rounded-full">Step 2</span>
                                    </div>
                                    <p class="text-gray-600 mt-2">Get matched with an AI coach personalized to your career stage and development needs.</p>
                                </div>
                            </div>
                            <div class="flex justify-between items-center text-sm">
                                <span class="text-gray-500">AI-powered matching</span>
                                <span class="text-primary font-medium">Learn More →</span>
                            </div>
                        </div>
                        
                        <div id="step-horizontal-3" class="w-80 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                            <div class="flex items-start mb-6">
                                <div class="w-14 h-14 bg-primary bg-opacity-10 rounded-full flex items-center justify-center flex-shrink-0">
                                    <i class="fa-solid fa-bell text-primary text-xl"></i>
                                </div>
                                <div class="ml-4 flex-1">
                                    <div class="flex justify-between items-center">
                                        <h3 class="text-xl font-bold">Receive Nudges</h3>
                                        <span class="bg-primary bg-opacity-10 text-primary text-xs font-medium px-3 py-1 rounded-full">Step 3</span>
                                    </div>
                                    <p class="text-gray-600 mt-2">Get timely check-ins and guidance when you need it most throughout your workday.</p>
                                </div>
                            </div>
                            <div class="flex justify-between items-center text-sm">
                                <span class="text-gray-500">Smart notifications</span>
                                <span class="text-primary font-medium">See Examples →</span>
                            </div>
                        </div>
                        
                        <div id="step-horizontal-4" class="w-80 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                            <div class="flex items-start mb-6">
                                <div class="w-14 h-14 bg-primary bg-opacity-10 rounded-full flex items-center justify-center flex-shrink-0">
                                    <i class="fa-solid fa-chart-line text-primary text-xl"></i>
                                </div>
                                <div class="ml-4 flex-1">
                                    <div class="flex justify-between items-center">
                                        <h3 class="text-xl font-bold">Track Growth</h3>
                                        <span class="bg-primary bg-opacity-10 text-primary text-xs font-medium px-3 py-1 rounded-full">Step 4</span>
                                    </div>
                                    <p class="text-gray-600 mt-2">Monitor your progress and see how your professional skills develop over time.</p>
                                </div>
                            </div>
                            <div class="flex justify-between items-center text-sm">
                                <span class="text-gray-500">Visual progress charts</span>
                                <span class="text-primary font-medium">View Demo →</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="absolute left-0 top-1/2 -translate-y-1/2 ml-2 md:flex hidden">
                    <button class="w-10 h-10 bg-white rounded-full shadow-md flex items-center justify-center text-primary">
                        <i class="fa-solid fa-chevron-left"></i>
                    </button>
                </div>
                <div class="absolute right-0 top-1/2 -translate-y-1/2 mr-2 md:flex hidden">
                    <button class="w-10 h-10 bg-white rounded-full shadow-md flex items-center justify-center text-primary">
                        <i class="fa-solid fa-chevron-right"></i>
                    </button>
                </div>
            </div>
            
            <!-- Visual Step Process -->
            <div id="step-process" class="mt-20">
                <div class="relative">
                    <div class="hidden md:block absolute top-24 left-0 right-0 h-1 bg-gray-200">
                        <div class="w-full h-full bg-primary" style="width: 75%"></div>
                    </div>
                    
                    <div class="grid grid-cols-1 md:grid-cols-4 gap-8 relative">
                        <div id="process-step-1" class="text-center">
                            <div class="w-16 h-16 bg-primary text-white rounded-full flex items-center justify-center mx-auto mb-6 relative z-10">
                                <i class="fa-solid fa-user-plus text-xl"></i>
                            </div>
                            <h3 class="text-xl font-bold mb-2">Onboard</h3>
                            <p class="text-gray-600">Create your profile in just a few taps</p>
                        </div>
                        
                        <div id="process-step-2" class="text-center">
                            <div class="w-16 h-16 bg-primary text-white rounded-full flex items-center justify-center mx-auto mb-6 relative z-10">
                                <i class="fa-solid fa-robot text-xl"></i>
                            </div>
                            <h3 class="text-xl font-bold mb-2">Meet Your Coach</h3>
                            <p class="text-gray-600">Your AI coach adapts to your needs</p>
                        </div>
                        
                        <div id="process-step-3" class="text-center">
                            <div class="w-16 h-16 bg-primary text-white rounded-full flex items-center justify-center mx-auto mb-6 relative z-10">
                                <i class="fa-solid fa-bell text-xl"></i>
                            </div>
                            <h3 class="text-xl font-bold mb-2">Receive Nudges</h3>
                            <p class="text-gray-600">Get timely guidance when needed</p>
                        </div>
                        
                        <div id="process-step-4" class="text-center">
                            <div class="w-16 h-16 bg-gray-300 text-white rounded-full flex items-center justify-center mx-auto mb-6 relative z-10">
                                <i class="fa-solid fa-chart-line text-xl"></i>
                            </div>
                            <h3 class="text-xl font-bold mb-2">Track Growth</h3>
                            <p class="text-gray-600">Watch your skills develop over time</p>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="text-center mt-16">
                <p class="text-lg text-gray-600 max-w-2xl mx-auto mb-8">UpCoach is designed to be simple, intuitive, and effective at helping you grow professionally.</p>
                <span class="inline-flex items-center bg-primary text-white px-8 py-3 rounded-full font-medium hover:bg-opacity-90 transition duration-300 cursor-pointer">
                    <span>Get Started Today</span>
                    <i class="fa-solid fa-arrow-right ml-2"></i>
                </span>
            </div>
        </div>
    </section>

    <!-- Footer -->
    <footer id="footer" class="bg-white py-12 border-t border-gray-200">
        <div class="container mx-auto px-6">
            <div class="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
                <div>
                    <div class="text-2xl font-bold text-primary mb-4">
                        <span>Up</span><span class="text-accent">Coach</span>
                    </div>
                    <p class="text-gray-600 mb-4">Your AI-powered workplace coach for professional growth and wellbeing.</p>
                    <div class="flex space-x-4">
                        <span class="text-gray-500 hover:text-primary cursor-pointer">
                            <i class="fa-brands fa-twitter"></i>
                        </span>
                        <span class="text-gray-500 hover:text-primary cursor-pointer">
                            <i class="fa-brands fa-linkedin"></i>
                        </span>
                        <span class="text-gray-500 hover:text-primary cursor-pointer">
                            <i class="fa-brands fa-instagram"></i>
                        </span>
                    </div>
                </div>
                
                <div>
                    <h4 class="font-bold text-lg mb-4">Product</h4>
                    <ul class="space-y-2">
                        <li><span class="text-gray-600 hover:text-primary cursor-pointer">Features</span></li>
                        <li><span class="text-gray-600 hover:text-primary cursor-pointer">Pricing</span></li>
                        <li><span class="text-gray-600 hover:text-primary cursor-pointer">Case Studies</span></li>
                        <li><span class="text-gray-600 hover:text-primary cursor-pointer">Reviews</span></li>
                    </ul>
                </div>
                
                <div>
                    <h4 class="font-bold text-lg mb-4">Resources</h4>
                    <ul class="space-y-2">
                        <li><span class="text-gray-600 hover:text-primary cursor-pointer">Blog</span></li>
                        <li><span class="text-gray-600 hover:text-primary cursor-pointer">Help Center</span></li>
                        <li><span class="text-gray-600 hover:text-primary cursor-pointer">Careers</span></li>
                        <li><span class="text-gray-600 hover:text-primary cursor-pointer">Contact Us</span></li>
                    </ul>
                </div>
                
                <div>
                    <h4 class="font-bold text-lg mb-4">Legal</h4>
                    <ul class="space-y-2">
                        <li><span class="text-gray-600 hover:text-primary cursor-pointer">Privacy Policy</span></li>
                        <li><span class="text-gray-600 hover:text-primary cursor-pointer">Terms of Service</span></li>
                        <li><span class="text-gray-600 hover:text-primary cursor-pointer">Cookie Policy</span></li>
                        <li><span class="text-gray-600 hover:text-primary cursor-pointer">GDPR Compliance</span></li>
                    </ul>
                </div>
            </div>
            
            <div class="pt-8 border-t border-gray-200 text-center text-gray-600 text-sm">
                <p>© 2023 UpCoach. All rights reserved.</p>
            </div>
        </div>
    </footer>

    <!-- Scroll to top button -->
    <button id="scroll-top" class="fixed bottom-6 right-6 bg-primary text-white p-3 rounded-full shadow-lg z-50 hover:bg-opacity-90 transition duration-300">
        <i class="fa-solid fa-arrow-up"></i>
    </button>

    <script>
        // Smooth scrolling for anchor links
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                document.querySelector(this.getAttribute('href')).scrollIntoView({
                    behavior: 'smooth'
                });
            });
        });

        // Scroll to top button
        const scrollTopButton = document.getElementById('scroll-top');
        window.addEventListener('scroll', () => {
            if (window.pageYOffset > 300) {
                scrollTopButton.classList.remove('hidden');
            } else {
                scrollTopButton.classList.add('hidden');
            }
        });

        scrollTopButton.addEventListener('click', () => {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    </script>

</body></html>
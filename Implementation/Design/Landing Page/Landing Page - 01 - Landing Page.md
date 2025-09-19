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
                <span class="text-dark hover:text-primary font-medium transition duration-300 cursor-pointer">How It Works</span>
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

    <!-- Hero Section -->
    <section id="hero" class="pt-28 pb-16 md:pb-24 bg-white h-[800px]">
        <div class="container mx-auto px-6">
            <div class="flex flex-col md:flex-row items-center">
                <div class="md:w-1/2 md:pr-12 mb-10 md:mb-0">
                    <h1 class="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6">
                        Your Personal <span class="text-primary">AI Coach</span> for Work Success
                    </h1>
                    <p class="text-lg md:text-xl text-gray-600 mb-8">
                        Get personalized coaching, reduce burnout, and develop your professional skills with UpCoach - the AI-powered workplace companion that grows with you.
                    </p>
                    <div id="download" class="flex flex-col sm:flex-row gap-4 mb-8">
                        <span class="flex items-center justify-center bg-black text-white px-6 py-3 rounded-lg hover:bg-opacity-90 transition duration-300 cursor-pointer">
                            <i class="fa-brands fa-apple text-2xl mr-3"></i>
                            <div>
                                <div class="text-xs">Download on the</div>
                                <div class="text-lg font-medium">App Store</div>
                            </div>
                        </span>
                        <span class="flex items-center justify-center bg-black text-white px-6 py-3 rounded-lg hover:bg-opacity-90 transition duration-300 cursor-pointer">
                            <i class="fa-brands fa-google-play text-2xl mr-3"></i>
                            <div>
                                <div class="text-xs">Get it on</div>
                                <div class="text-lg font-medium">Google Play</div>
                            </div>
                        </span>
                    </div>
                    <div class="flex items-center">
                        <div class="flex -space-x-2">
                            <img src="https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-1.jpg" alt="User" class="w-10 h-10 rounded-full border-2 border-white">
                            <img src="https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-2.jpg" alt="User" class="w-10 h-10 rounded-full border-2 border-white">
                            <img src="https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-3.jpg" alt="User" class="w-10 h-10 rounded-full border-2 border-white">
                            <img src="https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-4.jpg" alt="User" class="w-10 h-10 rounded-full border-2 border-white">
                        </div>
                        <div class="ml-4">
                            <div class="flex items-center mb-1">
                                <i class="fa-solid fa-star text-yellow-400"></i>
                                <i class="fa-solid fa-star text-yellow-400"></i>
                                <i class="fa-solid fa-star text-yellow-400"></i>
                                <i class="fa-solid fa-star text-yellow-400"></i>
                                <i class="fa-solid fa-star text-yellow-400"></i>
                                <span class="ml-2 font-medium">4.9/5</span>
                            </div>
                            <p class="text-sm text-gray-600">from 2,000+ reviews</p>
                        </div>
                    </div>
                </div>
                <div class="md:w-1/2">
                    <div class="relative">
                        <div class="bg-primary bg-opacity-10 rounded-3xl p-4">
                            <div class="bg-white rounded-2xl shadow-lg overflow-hidden">
                                <div class="bg-primary px-6 py-4 flex items-center">
                                    <div class="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                                        <i class="fa-solid fa-robot text-primary"></i>
                                    </div>
                                    <h3 class="ml-3 text-white font-medium">UpCoach AI Assistant</h3>
                                </div>
                                <div class="p-6">
                                    <div class="flex mb-6">
                                        <div class="w-10 h-10 bg-primary bg-opacity-20 rounded-full flex items-center justify-center flex-shrink-0">
                                            <i class="fa-solid fa-robot text-primary"></i>
                                        </div>
                                        <div class="ml-4 bg-gray-100 rounded-2xl rounded-tl-none p-4 max-w-xs">
                                            <p>Hi Sarah! I noticed you've been working late this week. How are you feeling about your workload?</p>
                                        </div>
                                    </div>
                                    <div class="flex justify-end mb-6">
                                        <div class="mr-4 bg-primary text-white rounded-2xl rounded-tr-none p-4 max-w-xs">
                                            <p>It's been pretty overwhelming, to be honest. I have a big presentation coming up.</p>
                                        </div>
                                        <div class="w-10 h-10 bg-gray-200 rounded-full overflow-hidden flex-shrink-0">
                                            <img src="https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-1.jpg" alt="User" class="w-full h-full object-cover">
                                        </div>
                                    </div>
                                    <div class="flex mb-6">
                                        <div class="w-10 h-10 bg-primary bg-opacity-20 rounded-full flex items-center justify-center flex-shrink-0">
                                            <i class="fa-solid fa-robot text-primary"></i>
                                        </div>
                                        <div class="ml-4 bg-gray-100 rounded-2xl rounded-tl-none p-4 max-w-xs">
                                            <p>I understand. Let's break down your presentation prep into manageable steps. Would you like to practice with me?</p>
                                        </div>
                                    </div>
                                    <div class="flex justify-end">
                                        <div class="mr-4 bg-primary text-white rounded-2xl rounded-tr-none p-4 max-w-xs">
                                            <p>That would be really helpful! Can we start tomorrow?</p>
                                        </div>
                                        <div class="w-10 h-10 bg-gray-200 rounded-full overflow-hidden flex-shrink-0">
                                            <img src="https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-1.jpg" alt="User" class="w-full h-full object-cover">
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="absolute -bottom-5 -right-5 bg-accent text-white rounded-full p-4 shadow-lg">
                            <i class="fa-solid fa-plus text-xl"></i>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- Features Section -->
    <section id="features" class="py-16 md:py-24 bg-background">
        <div class="container mx-auto px-6">
            <div class="text-center mb-16">
                <h2 class="text-3xl md:text-4xl font-bold mb-4">Why Choose UpCoach?</h2>
                <p class="text-lg text-gray-600 max-w-2xl mx-auto">Our AI-powered coaching platform is designed to help you thrive in your professional life.</p>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div id="feature-1" class="bg-white p-8 rounded-2xl">
                    <div class="w-14 h-14 bg-primary bg-opacity-20 rounded-full flex items-center justify-center mb-6">
                        <i class="fa-solid fa-brain text-primary text-xl"></i>
                    </div>
                    <h3 class="text-xl font-bold mb-3">Personalized Coaching</h3>
                    <p class="text-gray-600">Get advice tailored to your unique career challenges and goals from our advanced AI coach.</p>
                </div>
                
                <div id="feature-2" class="bg-white p-8 rounded-2xl">
                    <div class="w-14 h-14 bg-accent bg-opacity-20 rounded-full flex items-center justify-center mb-6">
                        <i class="fa-solid fa-fire-flame-curved text-accent text-xl"></i>
                    </div>
                    <h3 class="text-xl font-bold mb-3">Burnout Prevention</h3>
                    <p class="text-gray-600">Track your mood and workload to identify stress patterns before they lead to burnout.</p>
                </div>
                
                <div id="feature-3" class="bg-white p-8 rounded-2xl">
                    <div class="w-14 h-14 bg-primary bg-opacity-20 rounded-full flex items-center justify-center mb-6">
                        <i class="fa-solid fa-people-group text-primary text-xl"></i>
                    </div>
                    <h3 class="text-xl font-bold mb-3">Role-Play Practice</h3>
                    <p class="text-gray-600">Rehearse difficult conversations and presentations with your AI coach to build confidence.</p>
                </div>
                
                <div id="feature-4" class="bg-white p-8 rounded-2xl">
                    <div class="w-14 h-14 bg-accent bg-opacity-20 rounded-full flex items-center justify-center mb-6">
                        <i class="fa-solid fa-chart-line text-accent text-xl"></i>
                    </div>
                    <h3 class="text-xl font-bold mb-3">Progress Tracking</h3>
                    <p class="text-gray-600">Set goals and monitor your professional development with detailed analytics and insights.</p>
                </div>
                
                <div id="feature-5" class="bg-white p-8 rounded-2xl">
                    <div class="w-14 h-14 bg-primary bg-opacity-20 rounded-full flex items-center justify-center mb-6">
                        <i class="fa-solid fa-calendar-check text-primary text-xl"></i>
                    </div>
                    <h3 class="text-xl font-bold mb-3">Daily Check-ins</h3>
                    <p class="text-gray-600">Brief daily sessions help you stay focused on your goals and maintain positive habits.</p>
                </div>
                
                <div id="feature-6" class="bg-white p-8 rounded-2xl">
                    <div class="w-14 h-14 bg-accent bg-opacity-20 rounded-full flex items-center justify-center mb-6">
                        <i class="fa-solid fa-lock text-accent text-xl"></i>
                    </div>
                    <h3 class="text-xl font-bold mb-3">Private &amp; Secure</h3>
                    <p class="text-gray-600">Your conversations and data are encrypted and never shared with your employer or third parties.</p>
                </div>
            </div>
        </div>
    </section>

    <!-- How It Works Section -->
    <section id="how-it-works" class="py-16 md:py-24 bg-white">
        <div class="container mx-auto px-6">
            <div class="text-center mb-16">
                <h2 class="text-3xl md:text-4xl font-bold mb-4">How UpCoach Works</h2>
                <p class="text-lg text-gray-600 max-w-2xl mx-auto">Getting started with UpCoach is simple and takes just minutes.</p>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-3 gap-12">
                <div id="step-1" class="text-center">
                    <div class="relative mb-8 inline-block">
                        <div class="w-20 h-20 bg-primary bg-opacity-20 rounded-full flex items-center justify-center mx-auto">
                            <span class="text-primary font-bold text-3xl">1</span>
                        </div>
                        <div class="hidden md:block absolute top-10 -right-32 w-24 border-t-2 border-dashed border-gray-300"></div>
                    </div>
                    <h3 class="text-xl font-bold mb-3">Download &amp; Sign Up</h3>
                    <p class="text-gray-600">Install UpCoach from your app store and create your profile with your goals and preferences.</p>
                </div>
                
                <div id="step-2" class="text-center">
                    <div class="relative mb-8 inline-block">
                        <div class="w-20 h-20 bg-primary bg-opacity-20 rounded-full flex items-center justify-center mx-auto">
                            <span class="text-primary font-bold text-3xl">2</span>
                        </div>
                        <div class="hidden md:block absolute top-10 -right-32 w-24 border-t-2 border-dashed border-gray-300"></div>
                    </div>
                    <h3 class="text-xl font-bold mb-3">Chat With Your Coach</h3>
                    <p class="text-gray-600">Start conversations with your AI coach about your challenges, goals, or just to check in.</p>
                </div>
                
                <div id="step-3" class="text-center">
                    <div class="mb-8 inline-block">
                        <div class="w-20 h-20 bg-primary bg-opacity-20 rounded-full flex items-center justify-center mx-auto">
                            <span class="text-primary font-bold text-3xl">3</span>
                        </div>
                    </div>
                    <h3 class="text-xl font-bold mb-3">Grow &amp; Improve</h3>
                    <p class="text-gray-600">Track your progress, complete exercises, and watch as your professional skills develop over time.</p>
                </div>
            </div>
        </div>
    </section>

    <!-- Demo Section -->
    <section id="demo" class="py-16 md:py-24 bg-primary bg-opacity-5">
        <div class="container mx-auto px-6">
            <div class="flex flex-col md:flex-row items-center">
                <div class="md:w-1/2 md:pr-12 mb-10 md:mb-0">
                    <h2 class="text-3xl md:text-4xl font-bold mb-6">See UpCoach in Action</h2>
                    <p class="text-lg text-gray-600 mb-8">Watch how UpCoach can help you handle difficult workplace situations, prepare for important meetings, and manage stress effectively.</p>
                    
                    <div class="bg-white p-6 rounded-xl mb-8">
                        <div class="flex items-center mb-4">
                            <div class="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
                                <i class="fa-solid fa-quote-left text-white"></i>
                            </div>
                            <div class="ml-4">
                                <h4 class="font-bold">Presentation Anxiety</h4>
                                <p class="text-gray-600 text-sm">See how UpCoach helps with public speaking</p>
                            </div>
                        </div>
                        <p class="text-gray-700 italic">"I used to dread presentations, but after practicing with UpCoach for just two weeks, I felt so much more confident. The AI coach gave me specific techniques to manage my anxiety."</p>
                    </div>
                    
                    <span class="inline-flex items-center text-primary font-medium cursor-pointer">
                        <span>View more success stories</span>
                        <i class="fa-solid fa-arrow-right ml-2"></i>
                    </span>
                </div>
                <div class="md:w-1/2">
                    <div class="bg-white p-4 rounded-2xl shadow-lg">
                        <div class="aspect-w-16 aspect-h-9 bg-gray-200 rounded-xl overflow-hidden">
                            <img class="w-full h-full object-cover" src="https://storage.googleapis.com/uxpilot-auth.appspot.com/b14af6d245-285483b6832980592a42.png" alt="app demonstration of UpCoach AI coaching app with a professional interface showing chat between user and AI coach, minimalist UI, blue accent colors">
                        </div>
                        <div class="flex justify-center mt-4">
                            <button class="bg-primary text-white px-6 py-3 rounded-full flex items-center">
                                <i class="fa-solid fa-play mr-2"></i>
                                <span>Watch Demo</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- Testimonials Section -->
    <section id="testimonials" class="py-16 md:py-24 bg-white">
        <div class="container mx-auto px-6">
            <div class="text-center mb-16">
                <h2 class="text-3xl md:text-4xl font-bold mb-4">What Our Users Say</h2>
                <p class="text-lg text-gray-600 max-w-2xl mx-auto">UpCoach has helped thousands of professionals improve their work life.</p>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div id="testimonial-1" class="bg-background p-8 rounded-2xl">
                    <div class="flex items-center mb-6">
                        <img src="https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-2.jpg" alt="User" class="w-14 h-14 rounded-full mr-4">
                        <div>
                            <h4 class="font-bold">Michael Chen</h4>
                            <p class="text-gray-600 text-sm">Product Manager</p>
                        </div>
                    </div>
                    <div class="flex mb-4">
                        <i class="fa-solid fa-star text-yellow-400"></i>
                        <i class="fa-solid fa-star text-yellow-400"></i>
                        <i class="fa-solid fa-star text-yellow-400"></i>
                        <i class="fa-solid fa-star text-yellow-400"></i>
                        <i class="fa-solid fa-star text-yellow-400"></i>
                    </div>
                    <p class="text-gray-700">"UpCoach helped me navigate a difficult transition to a leadership role. The personalized advice and role-play scenarios were invaluable."</p>
                </div>
                
                <div id="testimonial-2" class="bg-background p-8 rounded-2xl">
                    <div class="flex items-center mb-6">
                        <img src="https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-5.jpg" alt="User" class="w-14 h-14 rounded-full mr-4">
                        <div>
                            <h4 class="font-bold">Priya Sharma</h4>
                            <p class="text-gray-600 text-sm">Marketing Director</p>
                        </div>
                    </div>
                    <div class="flex mb-4">
                        <i class="fa-solid fa-star text-yellow-400"></i>
                        <i class="fa-solid fa-star text-yellow-400"></i>
                        <i class="fa-solid fa-star text-yellow-400"></i>
                        <i class="fa-solid fa-star text-yellow-400"></i>
                        <i class="fa-solid fa-star text-yellow-400"></i>
                    </div>
                    <p class="text-gray-700">"The burnout prevention features alerted me that I was heading toward exhaustion. UpCoach helped me restructure my work habits and set boundaries."</p>
                </div>
                
                <div id="testimonial-3" class="bg-background p-8 rounded-2xl">
                    <div class="flex items-center mb-6">
                        <img src="https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-3.jpg" alt="User" class="w-14 h-14 rounded-full mr-4">
                        <div>
                            <h4 class="font-bold">David Wilson</h4>
                            <p class="text-gray-600 text-sm">Software Engineer</p>
                        </div>
                    </div>
                    <div class="flex mb-4">
                        <i class="fa-solid fa-star text-yellow-400"></i>
                        <i class="fa-solid fa-star text-yellow-400"></i>
                        <i class="fa-solid fa-star text-yellow-400"></i>
                        <i class="fa-solid fa-star text-yellow-400"></i>
                        <i class="fa-solid fa-star-half-alt text-yellow-400"></i>
                    </div>
                    <p class="text-gray-700">"As an introvert, I struggled with team communication. UpCoach gave me practical techniques to express my ideas clearly while staying true to my personality."</p>
                </div>
            </div>
        </div>
    </section>

    <!-- CTA Section -->
    <section id="cta" class="py-16 md:py-24 bg-primary">
        <div class="container mx-auto px-6 text-center">
            <h2 class="text-3xl md:text-4xl font-bold text-white mb-6">Ready to Transform Your Work Life?</h2>
            <p class="text-xl text-white opacity-90 mb-8 max-w-2xl mx-auto">Join thousands of professionals who are thriving with personalized AI coaching.</p>
            
            <div class="flex flex-col sm:flex-row justify-center gap-4 mb-8">
                <span class="flex items-center justify-center bg-white text-primary px-6 py-3 rounded-lg hover:bg-opacity-90 transition duration-300 cursor-pointer">
                    <i class="fa-brands fa-apple text-2xl mr-3"></i>
                    <div>
                        <div class="text-xs text-left">Download on the</div>
                        <div class="text-lg font-medium">App Store</div>
                    </div>
                </span>
                <span class="flex items-center justify-center bg-white text-primary px-6 py-3 rounded-lg hover:bg-opacity-90 transition duration-300 cursor-pointer">
                    <i class="fa-brands fa-google-play text-2xl mr-3"></i>
                    <div>
                        <div class="text-xs text-left">Get it on</div>
                        <div class="text-lg font-medium">Google Play</div>
                    </div>
                </span>
            </div>
            
            <p class="text-white opacity-80">Free 14-day trial • No credit card required</p>
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
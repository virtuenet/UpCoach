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
                <span class="text-primary font-medium transition duration-300 cursor-pointer">Blog</span>
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

    <!-- Blog Header -->
    <section id="blog-header" class="pt-28 pb-12 bg-white">
        <div class="container mx-auto px-6">
            <div class="flex flex-col items-center text-center">
                <h1 class="text-4xl md:text-5xl font-bold mb-4">UpCoach Blog</h1>
                <p class="text-lg text-gray-600 max-w-2xl mx-auto mb-8">
                    Insights, tips, and strategies for workplace coaching, productivity, and well-being
                </p>
                <div id="blog-categories" class="flex flex-wrap justify-center gap-3 mb-8">
                    <button class="bg-primary text-white px-4 py-2 rounded-full text-sm font-medium">All Posts</button>
                    <button class="bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-full text-sm font-medium hover:bg-gray-50">Workplace Coaching</button>
                    <button class="bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-full text-sm font-medium hover:bg-gray-50">Productivity</button>
                    <button class="bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-full text-sm font-medium hover:bg-gray-50">Burnout Prevention</button>
                    <button class="bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-full text-sm font-medium hover:bg-gray-50">AI in Coaching</button>
                </div>
                <div id="blog-search" class="w-full max-w-md relative">
                    <input type="text" placeholder="Search articles..." class="w-full px-4 py-3 rounded-full border border-gray-200 focus:outline-none focus:border-primary">
                    <button class="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                        <i class="fa-solid fa-search"></i>
                    </button>
                </div>
            </div>
        </div>
    </section>

    <!-- Featured Article -->
    <section id="featured-article" class="pb-12 bg-white">
        <div class="container mx-auto px-6">
            <div class="bg-primary bg-opacity-5 rounded-2xl overflow-hidden">
                <div class="flex flex-col md:flex-row">
                    <div class="md:w-1/2">
                        <img src="https://storage.googleapis.com/uxpilot-auth.appspot.com/b14af6d245-285483b6832980592a42.png" alt="Featured article about AI coaching" class="w-full h-full object-cover">
                    </div>
                    <div class="md:w-1/2 p-8 md:p-12 flex flex-col justify-center">
                        <div class="flex items-center mb-4">
                            <span class="bg-primary bg-opacity-20 text-primary px-3 py-1 rounded-full text-sm font-medium">AI in Coaching</span>
                            <span class="ml-3 text-gray-500 text-sm">June 12, 2023</span>
                        </div>
                        <h2 class="text-2xl md:text-3xl font-bold mb-4">How AI is Transforming Workplace Coaching in 2023</h2>
                        <p class="text-gray-600 mb-6">Discover how artificial intelligence is revolutionizing professional development and making personalized coaching accessible to everyone in the organization.</p>
                        <div class="flex items-center justify-between">
                            <div class="flex items-center">
                                <img src="https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-1.jpg" alt="Author" class="w-10 h-10 rounded-full mr-3">
                                <span class="font-medium">Sarah Johnson</span>
                            </div>
                            <button class="text-primary font-medium flex items-center">
                                Read More
                                <i class="fa-solid fa-arrow-right ml-2"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- Blog Articles Grid -->
    <section id="blog-articles" class="py-12 bg-background">
        <div class="container mx-auto px-6">
            <div class="flex justify-between items-center mb-8">
                <h2 class="text-2xl font-bold">Latest Articles</h2>
                <div class="flex items-center">
                    <span class="text-gray-600 mr-2">Sort by:</span>
                    <select class="border border-gray-200 rounded-md px-3 py-1 focus:outline-none focus:border-primary">
                        <option>Most Recent</option>
                        <option>Most Popular</option>
                        <option>Trending</option>
                    </select>
                </div>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                <!-- Article Card 1 -->
                <div id="article-1" class="bg-white rounded-xl overflow-hidden shadow-sm">
                    <div class="h-48 overflow-hidden">
                        <img src="https://storage.googleapis.com/uxpilot-auth.appspot.com/b14af6d245-285483b6832980592a42.png" alt="Article about burnout prevention" class="w-full h-full object-cover">
                    </div>
                    <div class="p-6">
                        <div class="flex items-center mb-3">
                            <span class="bg-accent bg-opacity-20 text-accent px-3 py-1 rounded-full text-xs font-medium">Burnout Prevention</span>
                            <span class="ml-3 text-gray-500 text-xs">May 28, 2023</span>
                        </div>
                        <h3 class="text-xl font-bold mb-3">5 Warning Signs of Burnout and How to Address Them</h3>
                        <p class="text-gray-600 text-sm mb-4">Learn to recognize the early indicators of burnout and discover practical strategies to restore your work-life balance before reaching a crisis point.</p>
                        <div class="flex items-center justify-between">
                            <div class="flex items-center">
                                <img src="https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-2.jpg" alt="Author" class="w-8 h-8 rounded-full mr-2">
                                <span class="text-sm font-medium">Michael Chen</span>
                            </div>
                            <span class="text-gray-500 text-sm">8 min read</span>
                        </div>
                    </div>
                </div>
                
                <!-- Article Card 2 -->
                <div id="article-2" class="bg-white rounded-xl overflow-hidden shadow-sm">
                    <div class="h-48 overflow-hidden">
                        <img src="https://storage.googleapis.com/uxpilot-auth.appspot.com/b14af6d245-285483b6832980592a42.png" alt="Article about productivity techniques" class="w-full h-full object-cover">
                    </div>
                    <div class="p-6">
                        <div class="flex items-center mb-3">
                            <span class="bg-primary bg-opacity-20 text-primary px-3 py-1 rounded-full text-xs font-medium">Productivity</span>
                            <span class="ml-3 text-gray-500 text-xs">May 15, 2023</span>
                        </div>
                        <h3 class="text-xl font-bold mb-3">The Pomodoro Technique: Mastering Time Management</h3>
                        <p class="text-gray-600 text-sm mb-4">Explore how the popular time-blocking method can transform your workday, increase focus, and help you accomplish more with less stress.</p>
                        <div class="flex items-center justify-between">
                            <div class="flex items-center">
                                <img src="https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-5.jpg" alt="Author" class="w-8 h-8 rounded-full mr-2">
                                <span class="text-sm font-medium">Priya Sharma</span>
                            </div>
                            <span class="text-gray-500 text-sm">6 min read</span>
                        </div>
                    </div>
                </div>
                
                <!-- Article Card 3 -->
                <div id="article-3" class="bg-white rounded-xl overflow-hidden shadow-sm">
                    <div class="h-48 overflow-hidden">
                        <img src="https://storage.googleapis.com/uxpilot-auth.appspot.com/b14af6d245-285483b6832980592a42.png" alt="Article about workplace coaching" class="w-full h-full object-cover">
                    </div>
                    <div class="p-6">
                        <div class="flex items-center mb-3">
                            <span class="bg-primary bg-opacity-20 text-primary px-3 py-1 rounded-full text-xs font-medium">Workplace Coaching</span>
                            <span class="ml-3 text-gray-500 text-xs">May 8, 2023</span>
                        </div>
                        <h3 class="text-xl font-bold mb-3">Effective Feedback: The Key to Team Growth</h3>
                        <p class="text-gray-600 text-sm mb-4">Learn the art of delivering constructive feedback that motivates rather than discourages, and builds stronger professional relationships.</p>
                        <div class="flex items-center justify-between">
                            <div class="flex items-center">
                                <img src="https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-3.jpg" alt="Author" class="w-8 h-8 rounded-full mr-2">
                                <span class="text-sm font-medium">David Wilson</span>
                            </div>
                            <span class="text-gray-500 text-sm">10 min read</span>
                        </div>
                    </div>
                </div>
                
                <!-- Article Card 4 -->
                <div id="article-4" class="bg-white rounded-xl overflow-hidden shadow-sm">
                    <div class="h-48 overflow-hidden">
                        <img src="https://storage.googleapis.com/uxpilot-auth.appspot.com/b14af6d245-285483b6832980592a42.png" alt="Article about AI in coaching" class="w-full h-full object-cover">
                    </div>
                    <div class="p-6">
                        <div class="flex items-center mb-3">
                            <span class="bg-accent bg-opacity-20 text-accent px-3 py-1 rounded-full text-xs font-medium">AI in Coaching</span>
                            <span class="ml-3 text-gray-500 text-xs">April 30, 2023</span>
                        </div>
                        <h3 class="text-xl font-bold mb-3">Can AI Really Understand Human Emotions?</h3>
                        <p class="text-gray-600 text-sm mb-4">Exploring the capabilities and limitations of emotional intelligence in AI coaching systems, and what it means for the future of work.</p>
                        <div class="flex items-center justify-between">
                            <div class="flex items-center">
                                <img src="https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-1.jpg" alt="Author" class="w-8 h-8 rounded-full mr-2">
                                <span class="text-sm font-medium">Sarah Johnson</span>
                            </div>
                            <span class="text-gray-500 text-sm">12 min read</span>
                        </div>
                    </div>
                </div>
                
                <!-- Article Card 5 -->
                <div id="article-5" class="bg-white rounded-xl overflow-hidden shadow-sm">
                    <div class="h-48 overflow-hidden">
                        <img src="https://storage.googleapis.com/uxpilot-auth.appspot.com/b14af6d245-285483b6832980592a42.png" alt="Article about burnout prevention" class="w-full h-full object-cover">
                    </div>
                    <div class="p-6">
                        <div class="flex items-center mb-3">
                            <span class="bg-accent bg-opacity-20 text-accent px-3 py-1 rounded-full text-xs font-medium">Burnout Prevention</span>
                            <span class="ml-3 text-gray-500 text-xs">April 22, 2023</span>
                        </div>
                        <h3 class="text-xl font-bold mb-3">Building Resilience: Mental Fitness for Professionals</h3>
                        <p class="text-gray-600 text-sm mb-4">Discover practical exercises and habits that strengthen your mental resilience and help you thrive under pressure in demanding work environments.</p>
                        <div class="flex items-center justify-between">
                            <div class="flex items-center">
                                <img src="https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-6.jpg" alt="Author" class="w-8 h-8 rounded-full mr-2">
                                <span class="text-sm font-medium">Emily Rodriguez</span>
                            </div>
                            <span class="text-gray-500 text-sm">9 min read</span>
                        </div>
                    </div>
                </div>
                
                <!-- Article Card 6 -->
                <div id="article-6" class="bg-white rounded-xl overflow-hidden shadow-sm">
                    <div class="h-48 overflow-hidden">
                        <img src="https://storage.googleapis.com/uxpilot-auth.appspot.com/b14af6d245-285483b6832980592a42.png" alt="Article about productivity" class="w-full h-full object-cover">
                    </div>
                    <div class="p-6">
                        <div class="flex items-center mb-3">
                            <span class="bg-primary bg-opacity-20 text-primary px-3 py-1 rounded-full text-xs font-medium">Productivity</span>
                            <span class="ml-3 text-gray-500 text-xs">April 15, 2023</span>
                        </div>
                        <h3 class="text-xl font-bold mb-3">Deep Work in a Distracted World</h3>
                        <p class="text-gray-600 text-sm mb-4">How to create the conditions for focused, high-value work in an environment of constant notifications, meetings, and digital distractions.</p>
                        <div class="flex items-center justify-between">
                            <div class="flex items-center">
                                <img src="https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-4.jpg" alt="Author" class="w-8 h-8 rounded-full mr-2">
                                <span class="text-sm font-medium">James Lee</span>
                            </div>
                            <span class="text-gray-500 text-sm">7 min read</span>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Pagination -->
            <div id="pagination" class="flex justify-center mt-12">
                <div class="flex items-center space-x-2">
                    <button class="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center text-gray-400">
                        <i class="fa-solid fa-chevron-left"></i>
                    </button>
                    <button class="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center">1</button>
                    <button class="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center">2</button>
                    <button class="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center">3</button>
                    <span class="px-2">...</span>
                    <button class="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center">8</button>
                    <button class="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center text-gray-600">
                        <i class="fa-solid fa-chevron-right"></i>
                    </button>
                </div>
            </div>
        </div>
    </section>

    <!-- Popular Topics -->
    <section id="popular-topics" class="py-12 bg-white">
        <div class="container mx-auto px-6">
            <h2 class="text-2xl font-bold mb-8">Popular Topics</h2>
            
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div id="topic-1" class="bg-primary bg-opacity-5 p-6 rounded-xl">
                    <div class="w-12 h-12 bg-primary bg-opacity-20 rounded-full flex items-center justify-center mb-4">
                        <i class="fa-solid fa-brain text-primary"></i>
                    </div>
                    <h3 class="text-xl font-bold mb-2">AI Coaching</h3>
                    <p class="text-gray-600 text-sm mb-4">Explore the intersection of artificial intelligence and professional development.</p>
                    <span class="text-primary font-medium text-sm flex items-center cursor-pointer">
                        12 Articles
                        <i class="fa-solid fa-arrow-right ml-2"></i>
                    </span>
                </div>
                
                <div id="topic-2" class="bg-accent bg-opacity-5 p-6 rounded-xl">
                    <div class="w-12 h-12 bg-accent bg-opacity-20 rounded-full flex items-center justify-center mb-4">
                        <i class="fa-solid fa-fire-flame-curved text-accent"></i>
                    </div>
                    <h3 class="text-xl font-bold mb-2">Burnout Prevention</h3>
                    <p class="text-gray-600 text-sm mb-4">Strategies and insights for maintaining well-being in high-pressure environments.</p>
                    <span class="text-accent font-medium text-sm flex items-center cursor-pointer">
                        18 Articles
                        <i class="fa-solid fa-arrow-right ml-2"></i>
                    </span>
                </div>
                
                <div id="topic-3" class="bg-primary bg-opacity-5 p-6 rounded-xl">
                    <div class="w-12 h-12 bg-primary bg-opacity-20 rounded-full flex items-center justify-center mb-4">
                        <i class="fa-solid fa-chart-line text-primary"></i>
                    </div>
                    <h3 class="text-xl font-bold mb-2">Productivity</h3>
                    <p class="text-gray-600 text-sm mb-4">Work smarter, not harder with proven techniques to optimize your workflow.</p>
                    <span class="text-primary font-medium text-sm flex items-center cursor-pointer">
                        24 Articles
                        <i class="fa-solid fa-arrow-right ml-2"></i>
                    </span>
                </div>
                
                <div id="topic-4" class="bg-accent bg-opacity-5 p-6 rounded-xl">
                    <div class="w-12 h-12 bg-accent bg-opacity-20 rounded-full flex items-center justify-center mb-4">
                        <i class="fa-solid fa-people-group text-accent"></i>
                    </div>
                    <h3 class="text-xl font-bold mb-2">Leadership Skills</h3>
                    <p class="text-gray-600 text-sm mb-4">Develop the mindset and capabilities to lead teams effectively in the modern workplace.</p>
                    <span class="text-accent font-medium text-sm flex items-center cursor-pointer">
                        15 Articles
                        <i class="fa-solid fa-arrow-right ml-2"></i>
                    </span>
                </div>
            </div>
        </div>
    </section>

    <!-- Newsletter -->
    <section id="newsletter" class="py-12 bg-primary bg-opacity-5">
        <div class="container mx-auto px-6">
            <div class="max-w-3xl mx-auto text-center">
                <h2 class="text-2xl md:text-3xl font-bold mb-4">Stay Updated with Coaching Insights</h2>
                <p class="text-gray-600 mb-8">Join our newsletter to receive the latest articles, tips, and resources on workplace coaching and well-being.</p>
                
                <div class="flex flex-col md:flex-row gap-4 max-w-xl mx-auto">
                    <input type="email" placeholder="Your email address" class="flex-grow px-4 py-3 rounded-full border border-gray-200 focus:outline-none focus:border-primary">
                    <button class="bg-primary text-white px-6 py-3 rounded-full font-medium hover:bg-opacity-90 transition duration-300">Subscribe</button>
                </div>
                <p class="text-gray-500 text-sm mt-4">We respect your privacy. Unsubscribe at any time.</p>
            </div>
        </div>
    </section>

    <!-- Reading Stats -->
    <section id="reading-stats" class="py-12 bg-white">
        <div class="container mx-auto px-6">
            <h2 class="text-2xl font-bold mb-8">Reading Trends</h2>
            
            <div class="bg-background p-6 rounded-xl">
                <div id="reading-chart" style="height: 300px;"></div>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                <div class="bg-background p-6 rounded-xl">
                    <h3 class="font-bold mb-2">Most Read Topics</h3>
                    <ul class="space-y-3">
                        <li class="flex justify-between items-center">
                            <span>Burnout Prevention</span>
                            <span class="text-primary font-medium">32%</span>
                        </li>
                        <li class="flex justify-between items-center">
                            <span>AI in Coaching</span>
                            <span class="text-primary font-medium">28%</span>
                        </li>
                        <li class="flex justify-between items-center">
                            <span>Productivity</span>
                            <span class="text-primary font-medium">24%</span>
                        </li>
                        <li class="flex justify-between items-center">
                            <span>Leadership</span>
                            <span class="text-primary font-medium">16%</span>
                        </li>
                    </ul>
                </div>
                
                <div class="bg-background p-6 rounded-xl">
                    <h3 class="font-bold mb-2">Average Reading Time</h3>
                    <div class="flex items-center">
                        <div class="text-3xl font-bold text-primary">7.5</div>
                        <div class="ml-2">minutes per article</div>
                    </div>
                    <div class="mt-4 text-sm text-gray-600">
                        <p>Most readers spend 5-10 minutes on articles about productivity and AI coaching.</p>
                    </div>
                </div>
                
                <div class="bg-background p-6 rounded-xl">
                    <h3 class="font-bold mb-2">Reader Engagement</h3>
                    <div class="space-y-3">
                        <div>
                            <div class="flex justify-between mb-1">
                                <span class="text-sm">Comments</span>
                                <span class="text-sm font-medium">85%</span>
                            </div>
                            <div class="w-full bg-gray-200 rounded-full h-2">
                                <div class="bg-primary h-2 rounded-full" style="width: 85%"></div>
                            </div>
                        </div>
                        <div>
                            <div class="flex justify-between mb-1">
                                <span class="text-sm">Shares</span>
                                <span class="text-sm font-medium">62%</span>
                            </div>
                            <div class="w-full bg-gray-200 rounded-full h-2">
                                <div class="bg-primary h-2 rounded-full" style="width: 62%"></div>
                            </div>
                        </div>
                        <div>
                            <div class="flex justify-between mb-1">
                                <span class="text-sm">Bookmarks</span>
                                <span class="text-sm font-medium">47%</span>
                            </div>
                            <div class="w-full bg-gray-200 rounded-full h-2">
                                <div class="bg-primary h-2 rounded-full" style="width: 47%"></div>
                            </div>
                        </div>
                    </div>
                </div>
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
                        <li><span class="text-primary font-medium cursor-pointer">Blog</span></li>
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
        // Reading trends chart
        Highcharts.chart('reading-chart', {
            chart: {
                type: 'areaspline',
                backgroundColor: 'transparent'
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
                    text: null
                },
                labels: {
                    style: {
                        color: '#6B7280'
                    }
                },
                gridLineColor: '#E5E7EB'
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
                name: 'Burnout Prevention',
                color: '#4A90E2',
                data: [12, 18, 15, 22, 28, 32, 30, 35, 33, 38, 40, 42]
            }, {
                name: 'AI in Coaching',
                color: '#7ED321',
                data: [8, 10, 14, 18, 20, 24, 28, 26, 30, 32, 34, 36]
            }, {
                name: 'Productivity',
                color: '#F5A623',
                data: [15, 14, 16, 19, 22, 24, 26, 23, 25, 28, 30, 32]
            }]
        });

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
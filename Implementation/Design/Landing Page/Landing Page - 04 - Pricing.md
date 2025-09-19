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

    <!-- Pricing Section -->
    <section id="pricing" class="pt-32 pb-20 bg-white">
        <div class="container mx-auto px-6">
            <div class="text-center mb-16">
                <h2 class="text-3xl md:text-4xl font-bold mb-4">Choose Your Plan</h2>
                <p class="text-lg text-gray-600 max-w-2xl mx-auto">Select the perfect plan for your coaching needs with flexible options for individuals and teams.</p>
            </div>
            
            <div class="flex justify-center mb-10">
                <div class="bg-background inline-flex rounded-full p-1">
                    <button id="monthly-btn" class="px-6 py-2 rounded-full bg-primary text-white font-medium">Monthly</button>
                    <button id="annual-btn" class="px-6 py-2 rounded-full text-gray-600 font-medium">Annual (Save 20%)</button>
                </div>
            </div>
            
            <div id="pricing-table" class="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                <!-- Free Plan -->
                <div id="free-plan" class="bg-white border border-gray-200 rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-lg transform hover:-translate-y-1">
                    <div class="p-8">
                        <div class="flex justify-between items-center mb-6">
                            <h3 class="text-xl font-bold">Free</h3>
                            <div class="w-12 h-12 bg-background rounded-full flex items-center justify-center">
                                <i class="fa-solid fa-seedling text-primary text-xl"></i>
                            </div>
                        </div>
                        <p class="text-gray-600 mb-6">Get started with basic coaching features</p>
                        <div class="mb-6">
                            <span class="text-4xl font-bold">$0</span>
                            <span class="text-gray-500">/month</span>
                        </div>
                        <span class="block w-full py-3 bg-background text-center text-dark font-medium rounded-lg transition duration-300 hover:bg-gray-200 cursor-pointer">
                            Start Free
                        </span>
                    </div>
                    
                    <div class="border-t border-gray-200 p-8">
                        <ul class="space-y-4">
                            <li class="flex items-start">
                                <i class="fa-solid fa-check text-accent mt-1 mr-3"></i>
                                <span class="text-gray-700">1 AI coach personality</span>
                            </li>
                            <li class="flex items-start">
                                <i class="fa-solid fa-check text-accent mt-1 mr-3"></i>
                                <span class="text-gray-700">5 coaching sessions per month</span>
                            </li>
                            <li class="flex items-start">
                                <i class="fa-solid fa-check text-accent mt-1 mr-3"></i>
                                <span class="text-gray-700">Basic mood tracking</span>
                            </li>
                            <li class="flex items-start">
                                <i class="fa-solid fa-check text-accent mt-1 mr-3"></i>
                                <span class="text-gray-700">Text-based coaching only</span>
                            </li>
                            <li class="flex items-start opacity-50">
                                <i class="fa-solid fa-xmark text-gray-400 mt-1 mr-3"></i>
                                <span class="text-gray-700">Role-play scenarios</span>
                            </li>
                            <li class="flex items-start opacity-50">
                                <i class="fa-solid fa-xmark text-gray-400 mt-1 mr-3"></i>
                                <span class="text-gray-700">Progress analytics</span>
                            </li>
                        </ul>
                    </div>
                </div>
                
                <!-- Pro Plan -->
                <div id="pro-plan" class="bg-white border-2 border-primary rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-lg transform hover:-translate-y-1 relative">
                    <div class="absolute top-0 right-0">
                        <div class="bg-accent text-white text-xs font-bold px-4 py-1 rounded-bl-lg">
                            MOST POPULAR
                        </div>
                    </div>
                    <div class="p-8">
                        <div class="flex justify-between items-center mb-6">
                            <h3 class="text-xl font-bold">Pro</h3>
                            <div class="w-12 h-12 bg-primary bg-opacity-20 rounded-full flex items-center justify-center">
                                <i class="fa-solid fa-user text-primary text-xl"></i>
                            </div>
                        </div>
                        <p class="text-gray-600 mb-6">Full access for individual professionals</p>
                        <div class="mb-6">
                            <span class="text-4xl font-bold">$9.99</span>
                            <span class="text-gray-500">/month</span>
                        </div>
                        <span class="block w-full py-3 bg-primary text-center text-white font-medium rounded-lg transition duration-300 hover:bg-primary hover:bg-opacity-90 cursor-pointer">
                            Upgrade in App
                        </span>
                    </div>
                    
                    <div class="border-t border-gray-200 p-8">
                        <ul class="space-y-4">
                            <li class="flex items-start">
                                <i class="fa-solid fa-check text-accent mt-1 mr-3"></i>
                                <span class="text-gray-700">3 AI coach personalities</span>
                            </li>
                            <li class="flex items-start">
                                <i class="fa-solid fa-check text-accent mt-1 mr-3"></i>
                                <span class="text-gray-700">Unlimited coaching sessions</span>
                            </li>
                            <li class="flex items-start">
                                <i class="fa-solid fa-check text-accent mt-1 mr-3"></i>
                                <span class="text-gray-700">Advanced mood &amp; burnout tracking</span>
                            </li>
                            <li class="flex items-start">
                                <i class="fa-solid fa-check text-accent mt-1 mr-3"></i>
                                <span class="text-gray-700">10 role-play scenarios monthly</span>
                            </li>
                            <li class="flex items-start">
                                <i class="fa-solid fa-check text-accent mt-1 mr-3"></i>
                                <span class="text-gray-700">Personal progress analytics</span>
                            </li>
                            <li class="flex items-start">
                                <i class="fa-solid fa-check text-accent mt-1 mr-3"></i>
                                <span class="text-gray-700">Voice coaching (beta)</span>
                            </li>
                        </ul>
                    </div>
                </div>
                
                <!-- Team Plan -->
                <div id="team-plan" class="bg-white border border-gray-200 rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-lg transform hover:-translate-y-1">
                    <div class="p-8">
                        <div class="flex justify-between items-center mb-6">
                            <h3 class="text-xl font-bold">Team</h3>
                            <div class="w-12 h-12 bg-accent bg-opacity-20 rounded-full flex items-center justify-center">
                                <i class="fa-solid fa-users text-accent text-xl"></i>
                            </div>
                        </div>
                        <p class="text-gray-600 mb-6">Perfect for teams and organizations</p>
                        <div class="mb-6">
                            <span class="text-4xl font-bold">$7.99</span>
                            <span class="text-gray-500">/user/month</span>
                        </div>
                        <span class="block w-full py-3 bg-dark text-center text-white font-medium rounded-lg transition duration-300 hover:bg-opacity-90 cursor-pointer">
                            Upgrade in App
                        </span>
                    </div>
                    
                    <div class="border-t border-gray-200 p-8">
                        <p class="font-medium mb-4">Everything in Pro, plus:</p>
                        <ul class="space-y-4">
                            <li class="flex items-start">
                                <i class="fa-solid fa-check text-accent mt-1 mr-3"></i>
                                <span class="text-gray-700">5+ users minimum</span>
                            </li>
                            <li class="flex items-start">
                                <i class="fa-solid fa-check text-accent mt-1 mr-3"></i>
                                <span class="text-gray-700">Team admin dashboard</span>
                            </li>
                            <li class="flex items-start">
                                <i class="fa-solid fa-check text-accent mt-1 mr-3"></i>
                                <span class="text-gray-700">Anonymous team insights</span>
                            </li>
                            <li class="flex items-start">
                                <i class="fa-solid fa-check text-accent mt-1 mr-3"></i>
                                <span class="text-gray-700">Custom coaching scenarios</span>
                            </li>
                            <li class="flex items-start">
                                <i class="fa-solid fa-check text-accent mt-1 mr-3"></i>
                                <span class="text-gray-700">Priority support</span>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
            
            <!-- Feature Comparison Table -->
            <div id="feature-comparison" class="mt-20 max-w-5xl mx-auto bg-white rounded-xl shadow-sm overflow-hidden">
                <div class="p-6 bg-background">
                    <h3 class="text-xl font-bold text-center">Feature Comparison</h3>
                </div>
                
                <div class="overflow-x-auto">
                    <table class="w-full">
                        <thead>
                            <tr class="border-b border-gray-200">
                                <th class="px-6 py-4 text-left font-medium text-gray-600">Features</th>
                                <th class="px-6 py-4 text-center font-medium text-gray-600">Free</th>
                                <th class="px-6 py-4 text-center font-medium text-primary">Pro</th>
                                <th class="px-6 py-4 text-center font-medium text-gray-600">Team</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr class="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                                <td class="px-6 py-4 text-gray-700">AI Coach Personalities</td>
                                <td class="px-6 py-4 text-center">1</td>
                                <td class="px-6 py-4 text-center font-medium">3</td>
                                <td class="px-6 py-4 text-center">5</td>
                            </tr>
                            <tr class="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                                <td class="px-6 py-4 text-gray-700">Monthly Coaching Sessions</td>
                                <td class="px-6 py-4 text-center">5</td>
                                <td class="px-6 py-4 text-center font-medium">Unlimited</td>
                                <td class="px-6 py-4 text-center">Unlimited</td>
                            </tr>
                            <tr class="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                                <td class="px-6 py-4 text-gray-700">Mood &amp; Burnout Tracking</td>
                                <td class="px-6 py-4 text-center">Basic</td>
                                <td class="px-6 py-4 text-center font-medium">Advanced</td>
                                <td class="px-6 py-4 text-center">Advanced</td>
                            </tr>
                            <tr class="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                                <td class="px-6 py-4 text-gray-700">Role-Play Scenarios</td>
                                <td class="px-6 py-4 text-center">—</td>
                                <td class="px-6 py-4 text-center font-medium">10/month</td>
                                <td class="px-6 py-4 text-center">Unlimited</td>
                            </tr>
                            <tr class="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                                <td class="px-6 py-4 text-gray-700">Analytics</td>
                                <td class="px-6 py-4 text-center">—</td>
                                <td class="px-6 py-4 text-center font-medium">Personal</td>
                                <td class="px-6 py-4 text-center">Team + Personal</td>
                            </tr>
                            <tr class="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                                <td class="px-6 py-4 text-gray-700">Voice Coaching</td>
                                <td class="px-6 py-4 text-center">—</td>
                                <td class="px-6 py-4 text-center font-medium">Beta</td>
                                <td class="px-6 py-4 text-center">Full Access</td>
                            </tr>
                            <tr class="hover:bg-gray-50 transition-colors">
                                <td class="px-6 py-4 text-gray-700">Priority Support</td>
                                <td class="px-6 py-4 text-center">—</td>
                                <td class="px-6 py-4 text-center font-medium">Email</td>
                                <td class="px-6 py-4 text-center">24/7 Chat</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </section>

    <!-- FAQ Section -->
    <section id="faq" class="py-16 bg-background">
        <div class="container mx-auto px-6">
            <h2 class="text-3xl font-bold text-center mb-12">Frequently Asked Questions</h2>
            
            <div class="max-w-3xl mx-auto space-y-6">
                <div id="faq-1" class="bg-white rounded-xl p-6 hover:shadow-md transition-shadow">
                    <div class="flex justify-between items-center cursor-pointer">
                        <h3 class="font-semibold text-lg">Can I change plans after subscribing?</h3>
                        <i class="fa-solid fa-chevron-down text-primary"></i>
                    </div>
                    <div class="mt-4">
                        <p class="text-gray-600">Yes, you can upgrade or downgrade your plan at any time through the app. Changes will take effect at the start of your next billing cycle.</p>
                    </div>
                </div>
                
                <div id="faq-2" class="bg-white rounded-xl p-6 hover:shadow-md transition-shadow">
                    <div class="flex justify-between items-center cursor-pointer">
                        <h3 class="font-semibold text-lg">Is my coaching data private?</h3>
                        <i class="fa-solid fa-chevron-down text-primary"></i>
                    </div>
                    <div class="mt-4">
                        <p class="text-gray-600">Absolutely. Your conversations and personal data are encrypted and never shared with your employer or third parties. We take privacy very seriously.</p>
                    </div>
                </div>
                
                <div id="faq-3" class="bg-white rounded-xl p-6 hover:shadow-md transition-shadow">
                    <div class="flex justify-between items-center cursor-pointer">
                        <h3 class="font-semibold text-lg">How do I cancel my subscription?</h3>
                        <i class="fa-solid fa-chevron-down text-primary"></i>
                    </div>
                    <div class="mt-4">
                        <p class="text-gray-600">You can cancel anytime through the app settings or by contacting our support team. After cancellation, you'll still have access until the end of your current billing period.</p>
                    </div>
                </div>
                
                <div id="faq-4" class="bg-white rounded-xl p-6 hover:shadow-md transition-shadow">
                    <div class="flex justify-between items-center cursor-pointer">
                        <h3 class="font-semibold text-lg">What's the difference between the AI coach personalities?</h3>
                        <i class="fa-solid fa-chevron-down text-primary"></i>
                    </div>
                    <div class="mt-4">
                        <p class="text-gray-600">Each AI coach has a different coaching style and expertise. For example, one might focus on leadership development, while another specializes in stress management or communication skills.</p>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- Download CTA -->
    <section id="download-cta" class="py-16 bg-primary">
        <div class="container mx-auto px-6 text-center">
            <h2 class="text-3xl font-bold text-white mb-6">Start Your Coaching Journey Today</h2>
            <p class="text-xl text-white opacity-90 mb-8 max-w-2xl mx-auto">Try UpCoach free for 14 days — no credit card required.</p>
            
            <div class="flex flex-col sm:flex-row justify-center gap-4 mb-8">
                <span class="group flex items-center justify-center bg-white text-primary px-6 py-3 rounded-lg transition duration-300 cursor-pointer">
                    <i class="fa-brands fa-apple text-2xl mr-3 group-hover:scale-110 transition-transform"></i>
                    <div>
                        <div class="text-xs text-left">Download on the</div>
                        <div class="text-lg font-medium">App Store</div>
                    </div>
                </span>
                <span class="group flex items-center justify-center bg-white text-primary px-6 py-3 rounded-lg transition duration-300 cursor-pointer">
                    <i class="fa-brands fa-google-play text-2xl mr-3 group-hover:scale-110 transition-transform"></i>
                    <div>
                        <div class="text-xs text-left">Get it on</div>
                        <div class="text-lg font-medium">Google Play</div>
                    </div>
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
        // Toggle between monthly and annual pricing
        const monthlyBtn = document.getElementById('monthly-btn');
        const annualBtn = document.getElementById('annual-btn');
        
        monthlyBtn.addEventListener('click', function() {
            monthlyBtn.classList.add('bg-primary', 'text-white');
            monthlyBtn.classList.remove('text-gray-600');
            annualBtn.classList.remove('bg-primary', 'text-white');
            annualBtn.classList.add('text-gray-600');
            
            // Update pricing to monthly
            document.querySelector('#free-plan .text-4xl').textContent = '$0';
            document.querySelector('#pro-plan .text-4xl').textContent = '$9.99';
            document.querySelector('#team-plan .text-4xl').textContent = '$7.99';
        });
        
        annualBtn.addEventListener('click', function() {
            annualBtn.classList.add('bg-primary', 'text-white');
            annualBtn.classList.remove('text-gray-600');
            monthlyBtn.classList.remove('bg-primary', 'text-white');
            monthlyBtn.classList.add('text-gray-600');
            
            // Update pricing to annual (20% discount)
            document.querySelector('#free-plan .text-4xl').textContent = '$0';
            document.querySelector('#pro-plan .text-4xl').textContent = '$7.99';
            document.querySelector('#team-plan .text-4xl').textContent = '$6.39';
        });
        
        // Add hover animations to pricing cards
        const pricingCards = document.querySelectorAll('#pricing-table > div');
        pricingCards.forEach(card => {
            card.addEventListener('mouseenter', function() {
                this.classList.add('shadow-lg', '-translate-y-1');
            });
            
            card.addEventListener('mouseleave', function() {
                this.classList.remove('shadow-lg', '-translate-y-1');
            });
        });
        
        // FAQ toggle functionality
        const faqItems = document.querySelectorAll('[id^="faq-"]');
        faqItems.forEach(item => {
            const header = item.querySelector('.flex');
            const icon = item.querySelector('.fa-chevron-down');
            const content = item.querySelector('.mt-4');
            
            header.addEventListener('click', function() {
                content.classList.toggle('hidden');
                icon.classList.toggle('fa-chevron-down');
                icon.classList.toggle('fa-chevron-up');
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
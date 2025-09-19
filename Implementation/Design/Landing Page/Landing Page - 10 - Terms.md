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

    <!-- Terms Hero -->
    <section id="terms-hero" class="pt-28 pb-12 bg-white">
        <div class="container mx-auto px-6">
            <div class="text-center">
                <h1 class="text-4xl md:text-5xl font-bold mb-6">Terms &amp; Conditions</h1>
                <p class="text-lg text-gray-600 max-w-2xl mx-auto mb-8">
                    Please read these terms carefully before using UpCoach. By accessing our service, you agree to be bound by these terms.
                </p>
                <div class="bg-primary bg-opacity-10 p-4 rounded-lg inline-block">
                    <p class="text-sm text-gray-700">
                        <i class="fa-solid fa-clock text-primary mr-2"></i>
                        Last updated: December 15, 2023
                    </p>
                </div>
            </div>
        </div>
    </section>

    <!-- Table of Contents -->
    <section id="terms-toc" class="py-8 bg-background">
        <div class="container mx-auto px-6">
            <div class="max-w-4xl mx-auto">
                <div class="bg-white p-6 rounded-2xl">
                    <h2 class="text-xl font-bold mb-4">Table of Contents</h2>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <span class="text-primary hover:text-dark transition duration-300 cursor-pointer">1. Acceptance of Terms</span>
                        <span class="text-primary hover:text-dark transition duration-300 cursor-pointer">2. Service Description</span>
                        <span class="text-primary hover:text-dark transition duration-300 cursor-pointer">3. User Accounts</span>
                        <span class="text-primary hover:text-dark transition duration-300 cursor-pointer">4. Acceptable Use</span>
                        <span class="text-primary hover:text-dark transition duration-300 cursor-pointer">5. Intellectual Property</span>
                        <span class="text-primary hover:text-dark transition duration-300 cursor-pointer">6. Payment Terms</span>
                        <span class="text-primary hover:text-dark transition duration-300 cursor-pointer">7. Disclaimers</span>
                        <span class="text-primary hover:text-dark transition duration-300 cursor-pointer">8. Limitation of Liability</span>
                        <span class="text-primary hover:text-dark transition duration-300 cursor-pointer">9. Termination</span>
                        <span class="text-primary hover:text-dark transition duration-300 cursor-pointer">10. Contact Information</span>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- Terms Content -->
    <section id="terms-content" class="py-12 bg-white">
        <div class="container mx-auto px-6">
            <div class="max-w-4xl mx-auto">
                
                <!-- Acceptance of Terms -->
                <div id="acceptance" class="mb-12">
                    <h2 class="text-2xl font-bold mb-6 text-primary">1. Acceptance of Terms</h2>
                    
                    <div class="bg-accent bg-opacity-10 p-6 rounded-xl mb-6">
                        <p class="text-gray-700 mb-4">By downloading, installing, or using UpCoach, you acknowledge that you have read, understood, and agree to be bound by these Terms and Conditions.</p>
                        <p class="text-gray-700">If you do not agree to these terms, please do not use our service.</p>
                    </div>

                    <div class="space-y-4">
                        <p class="text-gray-700">These terms constitute a legally binding agreement between you and UpCoach Inc. ("Company," "we," "us," or "our").</p>
                        <p class="text-gray-700">We reserve the right to modify these terms at any time. Changes will be effective immediately upon posting to our website or app.</p>
                    </div>
                </div>

                <!-- Service Description -->
                <div id="service-description" class="mb-12">
                    <h2 class="text-2xl font-bold mb-6 text-primary">2. Service Description</h2>
                    
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div class="bg-background p-6 rounded-xl">
                            <h3 class="text-lg font-semibold mb-3">
                                <i class="fa-solid fa-robot text-primary mr-2"></i>
                                AI Coaching
                            </h3>
                            <p class="text-gray-700">Personalized workplace coaching through artificial intelligence technology.</p>
                        </div>
                        
                        <div class="bg-background p-6 rounded-xl">
                            <h3 class="text-lg font-semibold mb-3">
                                <i class="fa-solid fa-chart-line text-primary mr-2"></i>
                                Progress Tracking
                            </h3>
                            <p class="text-gray-700">Tools to monitor professional development and career growth.</p>
                        </div>
                    </div>

                    <div class="border-l-4 border-primary pl-6">
                        <h4 class="font-semibold mb-2">Important Notice</h4>
                        <p class="text-gray-700">UpCoach provides general guidance and is not a substitute for professional therapy, medical advice, or legal counsel.</p>
                    </div>
                </div>

                <!-- User Accounts -->
                <div id="user-accounts" class="mb-12">
                    <h2 class="text-2xl font-bold mb-6 text-primary">3. User Accounts</h2>
                    
                    <div class="space-y-6">
                        <div>
                            <h3 class="text-xl font-semibold mb-3">Account Creation</h3>
                            <ul class="list-disc list-inside text-gray-700 space-y-2">
                                <li>You must be at least 18 years old to create an account</li>
                                <li>Provide accurate and complete information during registration</li>
                                <li>Maintain the security of your account credentials</li>
                                <li>One account per person; sharing accounts is prohibited</li>
                            </ul>
                        </div>

                        <div>
                            <h3 class="text-xl font-semibold mb-3">Account Responsibility</h3>
                            <p class="text-gray-700 mb-4">You are responsible for all activities that occur under your account. This includes:</p>
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div class="bg-background p-4 rounded-lg">
                                    <h4 class="font-semibold mb-2">Security</h4>
                                    <p class="text-gray-700 text-sm">Keep your password secure and notify us of unauthorized access</p>
                                </div>
                                <div class="bg-background p-4 rounded-lg">
                                    <h4 class="font-semibold mb-2">Content</h4>
                                    <p class="text-gray-700 text-sm">All content shared through your account</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Acceptable Use -->
                <div id="acceptable-use" class="mb-12">
                    <h2 class="text-2xl font-bold mb-6 text-primary">4. Acceptable Use</h2>
                    
                    <div class="mb-6">
                        <h3 class="text-xl font-semibold mb-3 text-accent">You May</h3>
                        <ul class="list-disc list-inside text-gray-700 space-y-2">
                            <li>Use UpCoach for legitimate professional development purposes</li>
                            <li>Share feedback to help improve our service</li>
                            <li>Access your personal data and conversation history</li>
                        </ul>
                    </div>

                    <div class="mb-6">
                        <h3 class="text-xl font-semibold mb-3 text-red-600">You May Not</h3>
                        <div class="bg-red-50 p-6 rounded-xl">
                            <ul class="list-disc list-inside text-gray-700 space-y-2">
                                <li>Use the service for illegal activities or harassment</li>
                                <li>Attempt to reverse engineer or hack our systems</li>
                                <li>Share inappropriate, offensive, or harmful content</li>
                                <li>Impersonate others or provide false information</li>
                                <li>Use automated tools to access our service</li>
                                <li>Violate intellectual property rights</li>
                            </ul>
                        </div>
                    </div>
                </div>

                <!-- Intellectual Property -->
                <div id="intellectual-property" class="mb-12">
                    <h2 class="text-2xl font-bold mb-6 text-primary">5. Intellectual Property</h2>
                    
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div class="bg-background p-6 rounded-xl">
                            <h3 class="text-lg font-semibold mb-3">Our Rights</h3>
                            <p class="text-gray-700 mb-3">UpCoach owns all rights to:</p>
                            <ul class="list-disc list-inside text-gray-700 text-sm space-y-1">
                                <li>Software and algorithms</li>
                                <li>Trademarks and branding</li>
                                <li>Content and materials</li>
                                <li>AI models and training data</li>
                            </ul>
                        </div>
                        
                        <div class="bg-background p-6 rounded-xl">
                            <h3 class="text-lg font-semibold mb-3">Your Rights</h3>
                            <p class="text-gray-700 mb-3">You retain ownership of:</p>
                            <ul class="list-disc list-inside text-gray-700 text-sm space-y-1">
                                <li>Your personal information</li>
                                <li>Conversation content you create</li>
                                <li>Feedback and suggestions</li>
                                <li>Your professional data</li>
                            </ul>
                        </div>
                    </div>
                </div>

                <!-- Payment Terms -->
                <div id="payment-terms" class="mb-12">
                    <h2 class="text-2xl font-bold mb-6 text-primary">6. Payment Terms</h2>
                    
                    <div class="space-y-6">
                        <div class="bg-background p-6 rounded-xl">
                            <h3 class="text-lg font-semibold mb-3">Subscription Plans</h3>
                            <p class="text-gray-700 mb-4">UpCoach offers various subscription tiers with different features and pricing.</p>
                            
                            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div class="text-center">
                                    <h4 class="font-semibold">Free Tier</h4>
                                    <p class="text-gray-700 text-sm">Basic coaching features</p>
                                </div>
                                <div class="text-center">
                                    <h4 class="font-semibold">Premium</h4>
                                    <p class="text-gray-700 text-sm">Advanced AI coaching</p>
                                </div>
                                <div class="text-center">
                                    <h4 class="font-semibold">Enterprise</h4>
                                    <p class="text-gray-700 text-sm">Team management tools</p>
                                </div>
                            </div>
                        </div>

                        <div>
                            <h3 class="text-xl font-semibold mb-3">Billing &amp; Refunds</h3>
                            <ul class="list-disc list-inside text-gray-700 space-y-2">
                                <li>Subscriptions auto-renew unless cancelled</li>
                                <li>Refunds available within 30 days of purchase</li>
                                <li>Price changes require 30-day advance notice</li>
                                <li>Failed payments may result in service suspension</li>
                            </ul>
                        </div>
                    </div>
                </div>

                <!-- Disclaimers -->
                <div id="disclaimers" class="mb-12">
                    <h2 class="text-2xl font-bold mb-6 text-primary">7. Disclaimers</h2>
                    
                    <div class="bg-red-50 p-6 rounded-xl mb-6">
                        <h3 class="text-lg font-semibold mb-3 text-red-600">Important Medical Disclaimer</h3>
                        <p class="text-gray-700 mb-3">UpCoach is NOT a substitute for professional medical, psychological, or psychiatric care. If you are experiencing mental health crisis or suicidal thoughts, please contact emergency services immediately.</p>
                        <p class="text-gray-700 text-sm">Emergency: 911 | Crisis Text Line: Text HOME to 741741</p>
                    </div>

                    <div class="space-y-4">
                        <div class="border-l-4 border-primary pl-4">
                            <h4 class="font-semibold mb-2">Service Availability</h4>
                            <p class="text-gray-700">We strive for 99.9% uptime but cannot guarantee uninterrupted service.</p>
                        </div>
                        
                        <div class="border-l-4 border-accent pl-4">
                            <h4 class="font-semibold mb-2">AI Limitations</h4>
                            <p class="text-gray-700">AI responses are generated based on training data and may not always be accurate or appropriate.</p>
                        </div>
                    </div>
                </div>

                <!-- Limitation of Liability -->
                <div id="liability" class="mb-12">
                    <h2 class="text-2xl font-bold mb-6 text-primary">8. Limitation of Liability</h2>
                    
                    <div class="bg-background p-6 rounded-xl">
                        <p class="text-gray-700 mb-4">TO THE MAXIMUM EXTENT PERMITTED BY LAW:</p>
                        <ul class="list-disc list-inside text-gray-700 space-y-2 mb-4">
                            <li>UpCoach's total liability is limited to the amount you paid in the last 12 months</li>
                            <li>We are not liable for indirect, incidental, or consequential damages</li>
                            <li>We disclaim all warranties except those required by law</li>
                            <li>Some jurisdictions may not allow these limitations</li>
                        </ul>
                        <p class="text-gray-700 text-sm">This limitation applies to all claims, whether based on contract, tort, or any other legal theory.</p>
                    </div>
                </div>

                <!-- Termination -->
                <div id="termination" class="mb-12">
                    <h2 class="text-2xl font-bold mb-6 text-primary">9. Termination</h2>
                    
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div class="bg-background p-6 rounded-xl">
                            <h3 class="text-lg font-semibold mb-3">By You</h3>
                            <p class="text-gray-700 mb-3">You may terminate your account at any time through:</p>
                            <ul class="list-disc list-inside text-gray-700 text-sm space-y-1">
                                <li>Account settings</li>
                                <li>Contacting support</li>
                                <li>Email request</li>
                            </ul>
                        </div>
                        
                        <div class="bg-background p-6 rounded-xl">
                            <h3 class="text-lg font-semibold mb-3">By Us</h3>
                            <p class="text-gray-700 mb-3">We may suspend or terminate accounts for:</p>
                            <ul class="list-disc list-inside text-gray-700 text-sm space-y-1">
                                <li>Terms violations</li>
                                <li>Non-payment</li>
                                <li>Illegal activities</li>
                                <li>Service discontinuation</li>
                            </ul>
                        </div>
                    </div>
                    
                    <div class="mt-6 p-4 bg-accent bg-opacity-10 rounded-lg">
                        <p class="text-gray-700 text-sm">Upon termination, your access ends immediately. Data retention follows our Privacy Policy.</p>
                    </div>
                </div>

                <!-- Contact Information -->
                <div id="terms-contact" class="mb-12">
                    <h2 class="text-2xl font-bold mb-6 text-primary">10. Contact Information</h2>
                    
                    <div class="bg-background p-6 rounded-xl">
                        <p class="text-gray-700 mb-6">For questions about these Terms &amp; Conditions, please contact us:</p>
                        
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <h4 class="font-semibold mb-3">
                                    <i class="fa-solid fa-envelope text-primary mr-2"></i>
                                    Email Support
                                </h4>
                                <p class="text-gray-700">legal@upcoach.app</p>
                                <p class="text-gray-700">support@upcoach.app</p>
                            </div>
                            
                            <div>
                                <h4 class="font-semibold mb-3">
                                    <i class="fa-solid fa-building text-primary mr-2"></i>
                                    Legal Department
                                </h4>
                                <p class="text-gray-700">UpCoach Inc.<br>123 Innovation Drive<br>San Francisco, CA 94105</p>
                            </div>
                        </div>
                        
                        <div class="mt-6 pt-4 border-t border-gray-200">
                            <p class="text-sm text-gray-600">We respond to legal inquiries within 5 business days.</p>
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
                </div></div></div></footer></body></html>
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

    <!-- FAQ Section -->
    <section id="faq" class="pt-28 pb-16 md:pb-24 bg-white">
        <div class="container mx-auto px-6">
            <div class="text-center mb-12">
                <h2 class="text-3xl md:text-4xl font-bold mb-4">Frequently Asked Questions</h2>
                <p class="text-lg text-gray-600 max-w-2xl mx-auto">Everything you need to know about UpCoach and how it can help your professional growth.</p>
            </div>
            
            <div id="faq-accordion" class="max-w-3xl mx-auto">
                <!-- FAQ Item 1 -->
                <div id="faq-item-1" class="mb-4">
                    <button id="faq-button-1" aria-expanded="false" aria-controls="faq-content-1" class="w-full flex justify-between items-center bg-background p-5 rounded-lg text-left focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-50" onclick="toggleFaq('faq-content-1', 'faq-button-1', 'faq-icon-1')">
                        <h3 class="text-lg font-semibold">How does UpCoach protect my privacy?</h3>
                        <i id="faq-icon-1" class="fa-solid fa-plus text-primary transition-transform duration-300"></i>
                    </button>
                    <div id="faq-content-1" class="hidden bg-white border border-gray-100 rounded-b-lg p-5 mt-1" aria-hidden="true">
                        <p class="text-gray-600">UpCoach takes your privacy seriously. All conversations with your AI coach are encrypted end-to-end and stored securely. Your data is never shared with your employer or any third parties without your explicit consent. You can delete your data at any time from the app settings. We comply with GDPR, CCPA, and other privacy regulations worldwide.</p>
                    </div>
                </div>
                
                <!-- FAQ Item 2 -->
                <div id="faq-item-2" class="mb-4">
                    <button id="faq-button-2" aria-expanded="false" aria-controls="faq-content-2" class="w-full flex justify-between items-center bg-background p-5 rounded-lg text-left focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-50" onclick="toggleFaq('faq-content-2', 'faq-button-2', 'faq-icon-2')">
                        <h3 class="text-lg font-semibold">What features are included in the free version?</h3>
                        <i id="faq-icon-2" class="fa-solid fa-plus text-primary transition-transform duration-300"></i>
                    </button>
                    <div id="faq-content-2" class="hidden bg-white border border-gray-100 rounded-b-lg p-5 mt-1" aria-hidden="true">
                        <p class="text-gray-600">The free version of UpCoach includes daily check-ins, basic mood tracking, and limited AI coaching conversations. Free users can access one AI coach avatar and receive weekly progress summaries. Premium features like role-play practice, advanced analytics, and unlimited coaching sessions are available with our subscription plans.</p>
                    </div>
                </div>
                
                <!-- FAQ Item 3 -->
                <div id="faq-item-3" class="mb-4">
                    <button id="faq-button-3" aria-expanded="false" aria-controls="faq-content-3" class="w-full flex justify-between items-center bg-background p-5 rounded-lg text-left focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-50" onclick="toggleFaq('faq-content-3', 'faq-button-3', 'faq-icon-3')">
                        <h3 class="text-lg font-semibold">Can I sync my data across multiple devices?</h3>
                        <i id="faq-icon-3" class="fa-solid fa-plus text-primary transition-transform duration-300"></i>
                    </button>
                    <div id="faq-content-3" class="hidden bg-white border border-gray-100 rounded-b-lg p-5 mt-1" aria-hidden="true">
                        <p class="text-gray-600">Yes, UpCoach automatically syncs your data across all your devices. Simply sign in with the same account on your phone, tablet, or web browser, and your coaching conversations, progress tracking, and settings will be available everywhere. Your data is backed up securely in the cloud, so you'll never lose your coaching history.</p>
                    </div>
                </div>
                
                <!-- FAQ Item 4 -->
                <div id="faq-item-4" class="mb-4">
                    <button id="faq-button-4" aria-expanded="false" aria-controls="faq-content-4" class="w-full flex justify-between items-center bg-background p-5 rounded-lg text-left focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-50" onclick="toggleFaq('faq-content-4', 'faq-button-4', 'faq-icon-4')">
                        <h3 class="text-lg font-semibold">How do I choose or customize my AI coach avatar?</h3>
                        <i id="faq-icon-4" class="fa-solid fa-plus text-primary transition-transform duration-300"></i>
                    </button>
                    <div id="faq-content-4" class="hidden bg-white border border-gray-100 rounded-b-lg p-5 mt-1" aria-hidden="true">
                        <p class="text-gray-600">When you first set up UpCoach, you'll be guided through a personality assessment that helps match you with the most compatible AI coach avatar. Premium users can choose from 12 different coach personalities, each with different coaching styles and expertise areas. You can change your coach avatar at any time from the Settings menu. You can also customize the coaching style to be more direct, empathetic, or analytical based on your preferences.</p>
                    </div>
                </div>
                
                <!-- FAQ Item 5 -->
                <div id="faq-item-5" class="mb-4">
                    <button id="faq-button-5" aria-expanded="false" aria-controls="faq-content-5" class="w-full flex justify-between items-center bg-background p-5 rounded-lg text-left focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-50" onclick="toggleFaq('faq-content-5', 'faq-button-5', 'faq-icon-5')">
                        <h3 class="text-lg font-semibold">Can I use UpCoach offline?</h3>
                        <i id="faq-icon-5" class="fa-solid fa-plus text-primary transition-transform duration-300"></i>
                    </button>
                    <div id="faq-content-5" class="hidden bg-white border border-gray-100 rounded-b-lg p-5 mt-1" aria-hidden="true">
                        <p class="text-gray-600">UpCoach offers limited offline functionality. You can access your previous coaching conversations, review your notes, and log your mood without an internet connection. However, new AI coaching interactions require an internet connection to process your requests through our secure servers. Any data you enter while offline will automatically sync when you reconnect to the internet.</p>
                    </div>
                </div>
                
                <!-- FAQ Item 6 -->
                <div id="faq-item-6">
                    <button id="faq-button-6" aria-expanded="false" aria-controls="faq-content-6" class="w-full flex justify-between items-center bg-background p-5 rounded-lg text-left focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-50" onclick="toggleFaq('faq-content-6', 'faq-button-6', 'faq-icon-6')">
                        <h3 class="text-lg font-semibold">Is UpCoach a replacement for human coaching?</h3>
                        <i id="faq-icon-6" class="fa-solid fa-plus text-primary transition-transform duration-300"></i>
                    </button>
                    <div id="faq-content-6" class="hidden bg-white border border-gray-100 rounded-b-lg p-5 mt-1" aria-hidden="true">
                        <p class="text-gray-600">UpCoach is designed to complement, not replace, human coaching. While our AI provides personalized guidance and support for everyday workplace challenges, some situations benefit from human expertise. Premium users can access our "Coach Connect" feature to schedule sessions with certified human coaches through the app. We recommend using UpCoach as a daily support tool and seeking human coaching for complex career transitions or specialized needs.</p>
                    </div>
                </div>
            </div>
            
            <div class="text-center mt-12">
                <p class="text-gray-600 mb-6">Still have questions? We're here to help.</p>
                <span class="inline-flex items-center bg-primary text-white px-6 py-3 rounded-lg hover:bg-opacity-90 transition duration-300 cursor-pointer">
                    <i class="fa-solid fa-message mr-2"></i>
                    <span>Contact Support</span>
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
        // Toggle FAQ items
        function toggleFaq(contentId, buttonId, iconId) {
            const content = document.getElementById(contentId);
            const button = document.getElementById(buttonId);
            const icon = document.getElementById(iconId);
            
            if (content.classList.contains('hidden')) {
                content.classList.remove('hidden');
                content.setAttribute('aria-hidden', 'false');
                button.setAttribute('aria-expanded', 'true');
                icon.classList.remove('fa-plus');
                icon.classList.add('fa-minus');
                icon.classList.add('rotate-180');
            } else {
                content.classList.add('hidden');
                content.setAttribute('aria-hidden', 'true');
                button.setAttribute('aria-expanded', 'false');
                icon.classList.remove('fa-minus');
                icon.classList.add('fa-plus');
                icon.classList.remove('rotate-180');
            }
        }

        // Enable keyboard navigation for FAQ
        document.addEventListener('DOMContentLoaded', function() {
            const faqButtons = document.querySelectorAll('[id^="faq-button-"]');
            
            faqButtons.forEach(button => {
                button.addEventListener('keydown', function(e) {
                    // Enter or Space key
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        button.click();
                    }
                });
            });
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
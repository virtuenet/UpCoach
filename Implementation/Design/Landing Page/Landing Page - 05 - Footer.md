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
    <!-- Footer -->
    <footer id="footer" class="bg-background py-16">
        <div class="container mx-auto px-6">
            <div class="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
                <div>
                    <div class="text-2xl font-bold text-primary mb-4">
                        <span>Up</span><span class="text-accent">Coach</span>
                    </div>
                    <p class="text-gray-600 mb-5">Your AI Coach at Work.</p>
                    <div class="flex space-x-5 mb-8">
                        <span class="text-gray-500 hover:text-primary transition duration-300 cursor-pointer">
                            <i class="fa-brands fa-linkedin text-xl"></i>
                        </span>
                        <span class="text-gray-500 hover:text-primary transition duration-300 cursor-pointer">
                            <i class="fa-brands fa-youtube text-xl"></i>
                        </span>
                        <span class="text-gray-500 hover:text-primary transition duration-300 cursor-pointer">
                            <i class="fa-brands fa-instagram text-xl"></i>
                        </span>
                    </div>
                    <div id="download-footer" class="flex flex-col sm:flex-row gap-3">
                        <span class="flex items-center justify-center bg-black text-white px-4 py-2 rounded-lg hover:bg-opacity-90 transition duration-300 cursor-pointer">
                            <i class="fa-brands fa-apple text-xl mr-2"></i>
                            <div>
                                <div class="text-xs">Download on the</div>
                                <div class="text-sm font-medium">App Store</div>
                            </div>
                        </span>
                        <span class="flex items-center justify-center bg-black text-white px-4 py-2 rounded-lg hover:bg-opacity-90 transition duration-300 cursor-pointer">
                            <i class="fa-brands fa-google-play text-xl mr-2"></i>
                            <div>
                                <div class="text-xs">Get it on</div>
                                <div class="text-sm font-medium">Google Play</div>
                            </div>
                        </span>
                    </div>
                </div>
                
                <div>
                    <h4 class="font-bold text-lg mb-5">Product</h4>
                    <ul class="space-y-3">
                        <li><span class="text-gray-600 hover:text-primary transition duration-300 cursor-pointer">Features</span></li>
                        <li><span class="text-gray-600 hover:text-primary transition duration-300 cursor-pointer">Pricing</span></li>
                        <li><span class="text-gray-600 hover:text-primary transition duration-300 cursor-pointer">Case Studies</span></li>
                        <li><span class="text-gray-600 hover:text-primary transition duration-300 cursor-pointer">Reviews</span></li>
                        <li><span class="text-gray-600 hover:text-primary transition duration-300 cursor-pointer">Updates</span></li>
                    </ul>
                </div>
                
                <div>
                    <h4 class="font-bold text-lg mb-5">Resources</h4>
                    <ul class="space-y-3">
                        <li><span class="text-gray-600 hover:text-primary transition duration-300 cursor-pointer">Blog</span></li>
                        <li><span class="text-gray-600 hover:text-primary transition duration-300 cursor-pointer">Help Center</span></li>
                        <li><span class="text-gray-600 hover:text-primary transition duration-300 cursor-pointer">Careers</span></li>
                        <li><span class="text-gray-600 hover:text-primary transition duration-300 cursor-pointer">Contact Us</span></li>
                        <li><span class="text-gray-600 hover:text-primary transition duration-300 cursor-pointer">Community</span></li>
                    </ul>
                </div>
                
                <div>
                    <h4 class="font-bold text-lg mb-5">Legal</h4>
                    <ul class="space-y-3">
                        <li><span class="text-gray-600 hover:text-primary transition duration-300 cursor-pointer">Privacy Policy</span></li>
                        <li><span class="text-gray-600 hover:text-primary transition duration-300 cursor-pointer">Terms of Service</span></li>
                        <li><span class="text-gray-600 hover:text-primary transition duration-300 cursor-pointer">Cookie Policy</span></li>
                        <li><span class="text-gray-600 hover:text-primary transition duration-300 cursor-pointer">GDPR Compliance</span></li>
                        <li><span class="text-gray-600 hover:text-primary transition duration-300 cursor-pointer">Security</span></li>
                    </ul>
                </div>
            </div>
            
            <div id="footer-bottom" class="pt-8 border-t border-gray-300">
                <div class="flex flex-col md:flex-row justify-between items-center">
                    <div class="mb-4 md:mb-0">
                        <p class="text-gray-600 text-sm">© 2023 UpCoach. All rights reserved.</p>
                    </div>
                    <div class="flex flex-wrap gap-x-6 gap-y-2 justify-center">
                        <span class="text-gray-600 hover:text-primary text-sm transition duration-300 cursor-pointer">Privacy Policy</span>
                        <span class="text-gray-600 hover:text-primary text-sm transition duration-300 cursor-pointer">Terms of Service</span>
                        <span class="text-gray-600 hover:text-primary text-sm transition duration-300 cursor-pointer">Cookie Settings</span>
                        <span class="text-gray-600 hover:text-primary text-sm transition duration-300 cursor-pointer">Accessibility</span>
                    </div>
                </div>
            </div>
            
            <div id="app-badges" class="mt-10 text-center">
                <div class="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6">
                    <div class="flex items-center">
                        <i class="fa-solid fa-shield-check text-accent mr-2"></i>
                        <span class="text-sm text-gray-600">Data Protection Certified</span>
                    </div>
                    <div class="flex items-center">
                        <i class="fa-solid fa-lock text-accent mr-2"></i>
                        <span class="text-sm text-gray-600">GDPR Compliant</span>
                    </div>
                    <div class="flex items-center">
                        <i class="fa-solid fa-star text-accent mr-2"></i>
                        <span class="text-sm text-gray-600">4.9 App Store Rating</span>
                    </div>
                </div>
                
                <p class="text-xs text-gray-500 max-w-xl mx-auto">
                    UpCoach uses advanced AI to provide personalized coaching while maintaining the highest standards of privacy and security. Your data is never sold or shared with third parties.
                </p>
            </div>
        </div>
    </footer>

    <script>
        // Add any footer-specific JavaScript here
        document.addEventListener('DOMContentLoaded', function() {
            // Smooth scrolling for anchor links
            document.querySelectorAll('a[href^="#"]').forEach(anchor => {
                anchor.addEventListener('click', function (e) {
                    e.preventDefault();
                    const targetElement = document.querySelector(this.getAttribute('href'));
                    if (targetElement) {
                        targetElement.scrollIntoView({
                            behavior: 'smooth'
                        });
                    }
                });
            });
        });
    </script>

</body></html>
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
    <!-- Testimonials Section -->
    <section id="testimonials" class="py-16 md:py-24 bg-white">
        <div class="container mx-auto px-6">
            <div class="text-center mb-16">
                <h2 class="text-3xl md:text-4xl font-bold mb-4">What Our Users Say</h2>
                <p class="text-lg text-gray-600 max-w-2xl mx-auto">UpCoach has helped thousands of professionals improve their work life.</p>
            </div>
            
            <div id="testimonials-grid" class="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div id="testimonial-1" class="bg-background p-8 rounded-2xl transform transition-all duration-500 hover:shadow-md" data-aos="fade-up" data-aos-delay="100">
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
                    <p class="text-gray-700">"UpCoach helped me navigate a difficult transition to a leadership role. The personalized advice and role-play scenarios were invaluable for building my confidence and communication skills."</p>
                </div>
                
                <div id="testimonial-2" class="bg-background p-8 rounded-2xl transform transition-all duration-500 hover:shadow-md" data-aos="fade-up" data-aos-delay="200">
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
                    <p class="text-gray-700">"The burnout prevention features alerted me that I was heading toward exhaustion. UpCoach helped me restructure my work habits and set boundaries. I'm now more productive and happier in my role."</p>
                </div>
                
                <div id="testimonial-3" class="bg-background p-8 rounded-2xl transform transition-all duration-500 hover:shadow-md" data-aos="fade-up" data-aos-delay="300">
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
                    <p class="text-gray-700">"As an introvert, I struggled with team communication. UpCoach gave me practical techniques to express my ideas clearly while staying true to my personality. My team relationships have improved dramatically."</p>
                </div>
            </div>
            
            <div id="testimonials-carousel" class="mt-12 relative">
                <div class="flex overflow-x-auto pb-6 snap-x snap-mandatory scrollbar-hide">
                    <div class="flex-shrink-0 w-full md:w-1/2 px-4 snap-center">
                        <div class="bg-white border border-gray-100 p-8 rounded-2xl shadow-sm">
                            <div class="flex items-center mb-6">
                                <div class="w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center text-xl font-bold">
                                    JS
                                </div>
                                <div class="ml-4">
                                    <h4 class="font-bold">Jennifer Smith</h4>
                                    <p class="text-gray-600 text-sm">HR Director</p>
                                </div>
                                <div class="ml-auto text-primary">
                                    <i class="fa-solid fa-quote-right text-3xl opacity-20"></i>
                                </div>
                            </div>
                            <p class="text-gray-700 mb-4">"UpCoach has transformed our employee development program. The personalized coaching approach has helped our team members grow in ways that traditional training couldn't achieve. We've seen improved retention and engagement metrics since implementing UpCoach."</p>
                            <div class="flex text-yellow-400">
                                <i class="fa-solid fa-star"></i>
                                <i class="fa-solid fa-star"></i>
                                <i class="fa-solid fa-star"></i>
                                <i class="fa-solid fa-star"></i>
                                <i class="fa-solid fa-star"></i>
                            </div>
                        </div>
                    </div>
                    
                    <div class="flex-shrink-0 w-full md:w-1/2 px-4 snap-center">
                        <div class="bg-white border border-gray-100 p-8 rounded-2xl shadow-sm">
                            <div class="flex items-center mb-6">
                                <div class="w-12 h-12 bg-accent text-white rounded-full flex items-center justify-center text-xl font-bold">
                                    RJ
                                </div>
                                <div class="ml-4">
                                    <h4 class="font-bold">Robert Johnson</h4>
                                    <p class="text-gray-600 text-sm">Senior Developer</p>
                                </div>
                                <div class="ml-auto text-accent">
                                    <i class="fa-solid fa-quote-right text-3xl opacity-20"></i>
                                </div>
                            </div>
                            <p class="text-gray-700 mb-4">"I was skeptical about AI coaching at first, but UpCoach has genuinely helped me overcome my imposter syndrome. The daily check-ins and personalized feedback have built my confidence and helped me contribute more effectively in meetings. My team has noticed the difference."</p>
                            <div class="flex text-yellow-400">
                                <i class="fa-solid fa-star"></i>
                                <i class="fa-solid fa-star"></i>
                                <i class="fa-solid fa-star"></i>
                                <i class="fa-solid fa-star"></i>
                                <i class="fa-solid fa-star"></i>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="flex justify-center mt-6 space-x-2">
                    <button id="prev-testimonial" class="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-primary hover:text-white transition-colors">
                        <i class="fa-solid fa-arrow-left"></i>
                    </button>
                    <button id="next-testimonial" class="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-primary hover:text-white transition-colors">
                        <i class="fa-solid fa-arrow-right"></i>
                    </button>
                </div>
            </div>
            
            <div id="user-quotes" class="mt-16">
                <h3 class="text-2xl font-bold text-center mb-8">From Our Community</h3>
                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div class="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-start">
                        <img src="https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-7.jpg" alt="User" class="w-12 h-12 rounded-full mr-4 flex-shrink-0">
                        <div>
                            <div class="flex items-center mb-2">
                                <h4 class="font-bold">Sarah Thompson</h4>
                                <div class="flex ml-3 text-yellow-400 text-sm">
                                    <i class="fa-solid fa-star"></i>
                                    <i class="fa-solid fa-star"></i>
                                    <i class="fa-solid fa-star"></i>
                                    <i class="fa-solid fa-star"></i>
                                    <i class="fa-solid fa-star"></i>
                                </div>
                            </div>
                            <p class="text-gray-600 text-sm mb-3">Project Manager • Using UpCoach for 6 months</p>
                            <p class="text-gray-700">"UpCoach has been my secret weapon for managing team conflicts. The role-play feature helped me prepare for difficult conversations with team members, and the outcome was much better than I expected. I'm now more confident in my leadership abilities."</p>
                        </div>
                    </div>
                    
                    <div class="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-start">
                        <img src="https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-4.jpg" alt="User" class="w-12 h-12 rounded-full mr-4 flex-shrink-0">
                        <div>
                            <div class="flex items-center mb-2">
                                <h4 class="font-bold">James Rodriguez</h4>
                                <div class="flex ml-3 text-yellow-400 text-sm">
                                    <i class="fa-solid fa-star"></i>
                                    <i class="fa-solid fa-star"></i>
                                    <i class="fa-solid fa-star"></i>
                                    <i class="fa-solid fa-star"></i>
                                    <i class="fa-solid fa-star"></i>
                                </div>
                            </div>
                            <p class="text-gray-600 text-sm mb-3">Sales Executive • Using UpCoach for 3 months</p>
                            <p class="text-gray-700">"The negotiation practice in UpCoach has directly improved my sales numbers. I was able to rehearse challenging client scenarios with my AI coach, get feedback on my approach, and refine my pitch. This quarter's results speak for themselves!"</p>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="mt-16 text-center">
                <span class="inline-flex items-center justify-center bg-primary text-white px-8 py-3 rounded-full hover:bg-opacity-90 transition duration-300 cursor-pointer">
                    <span>Read More Success Stories</span>
                    <i class="fa-solid fa-arrow-right ml-2"></i>
                </span>
            </div>
        </div>
    </section>

    <script>
        // Fade-in animation for testimonials
        document.addEventListener('DOMContentLoaded', function() {
            const testimonials = document.querySelectorAll('[data-aos]');
            
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('opacity-100');
                        entry.target.style.transform = 'translateY(0)';
                    }
                });
            }, { threshold: 0.1 });
            
            testimonials.forEach(testimonial => {
                testimonial.style.opacity = '0';
                testimonial.style.transform = 'translateY(20px)';
                testimonial.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
                observer.observe(testimonial);
            });
            
            // Carousel navigation
            const carousel = document.querySelector('#testimonials-carousel .flex');
            const prevBtn = document.getElementById('prev-testimonial');
            const nextBtn = document.getElementById('next-testimonial');
            
            prevBtn.addEventListener('click', () => {
                carousel.scrollBy({ left: -carousel.offsetWidth, behavior: 'smooth' });
            });
            
            nextBtn.addEventListener('click', () => {
                carousel.scrollBy({ left: carousel.offsetWidth, behavior: 'smooth' });
            });
        });
    </script>

</body></html>
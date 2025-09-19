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
<body class="font-sans bg-gradient-to-br from-primary-500 to-secondary-600 h-[100vh] flex items-center justify-center">
    <!-- Splash Screen -->
    <div id="splash-screen" class="fixed inset-0 flex items-center justify-center bg-gradient-to-br from-primary-500 to-secondary-600 z-50">
        <div class="text-center animate-pulse">
            <div class="w-32 h-32 mb-6 mx-auto bg-white rounded-full flex items-center justify-center shadow-lg">
                <i class="fa-solid fa-brain text-6xl text-primary-600"></i>
            </div>
            <h1 class="text-4xl font-bold text-white mb-2">UpCoach</h1>
            <p class="text-white text-lg">AI Coach at Work</p>
        </div>
    </div>

    <script>
        // Simple animation for the splash screen
        document.addEventListener('DOMContentLoaded', function() {
            // After 3 seconds, we'll fade out the splash screen
            setTimeout(function() {
                const splashScreen = document.getElementById('splash-screen');
                splashScreen.classList.add('transition-opacity', 'duration-1000', 'opacity-0');
                
                // After the fade out animation completes, we'd normally navigate to the next screen
                // In a real app, this would load the onboarding flow or main app
                setTimeout(function() {
                    // This would be replaced with actual navigation in a real app
                    // For demo purposes, we're just hiding the splash screen
                    splashScreen.classList.add('hidden');
                }, 1000);
            }, 3000);
        });
    </script>

</body></html>
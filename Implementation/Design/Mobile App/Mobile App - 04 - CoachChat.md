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
    <!-- Chat Interface -->
    <div id="chat-container" class="h-[100vh] flex flex-col">
        <!-- Header -->
        <div id="chat-header" class="px-4 py-3 bg-white border-b border-gray-200 flex items-center justify-between sticky top-0 z-10">
            <div class="flex items-center">
                <button id="back-button" class="mr-3">
                    <i class="fa-solid fa-arrow-left text-neutral-600 text-lg"></i>
                </button>
                <div class="flex items-center">
                    <div class="relative">
                        <div class="w-10 h-10 rounded-full overflow-hidden">
                            <img src="https://storage.googleapis.com/uxpilot-auth.appspot.com/4850872147-c5a84d13c99997fcc053.png" alt="Coach Alex" class="w-full h-full object-cover">
                        </div>
                        <div class="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                    </div>
                    <div class="ml-3">
                        <h2 class="font-medium text-neutral-800">Coach Alex</h2>
                        <p class="text-xs text-green-600">Online now</p>
                    </div>
                </div>
            </div>
            <div>
                <button id="settings-button" class="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100">
                    <i class="fa-solid fa-ellipsis-vertical text-neutral-600"></i>
                </button>
            </div>
        </div>

        <!-- Chat Messages -->
        <div id="chat-messages" class="flex-1 overflow-y-auto p-4 space-y-4">
            <!-- Welcome Message -->
            <div id="welcome-message" class="flex justify-center mb-6">
                <div class="bg-neutral-100 rounded-lg px-4 py-2 text-xs text-neutral-600 max-w-[80%] text-center">
                    Today, 9:30 AM
                </div>
            </div>

            <!-- Coach Message -->
            <div id="coach-message-1" class="flex items-end">
                <div class="w-8 h-8 rounded-full overflow-hidden mr-2 mb-1">
                    <img src="https://storage.googleapis.com/uxpilot-auth.appspot.com/4850872147-c5a84d13c99997fcc053.png" alt="Coach Alex" class="w-full h-full object-cover">
                </div>
                <div class="max-w-[75%]">
                    <div class="bg-primary-100 rounded-t-2xl rounded-br-2xl p-3 text-neutral-800">
                        <p>Good morning, Sarah! 👋 How are you feeling about today's presentation? I've reviewed your notes and have some suggestions that might help boost your confidence.</p>
                    </div>
                    <span class="text-xs text-neutral-500 ml-1 mt-1 block">9:31 AM</span>
                </div>
            </div>

            <!-- User Message -->
            <div id="user-message-1" class="flex items-end justify-end">
                <div class="max-w-[75%]">
                    <div class="bg-primary-600 rounded-t-2xl rounded-bl-2xl p-3 text-white">
                        <p>I'm feeling pretty nervous about it. There will be senior executives in the meeting and I'm worried about being too technical.</p>
                    </div>
                    <span class="text-xs text-neutral-500 mr-1 mt-1 block text-right">9:33 AM</span>
                </div>
            </div>

            <!-- Coach Voice Message -->
            <div id="coach-voice-message" class="flex items-end">
                <div class="w-8 h-8 rounded-full overflow-hidden mr-2 mb-1">
                    <img src="https://storage.googleapis.com/uxpilot-auth.appspot.com/4850872147-c5a84d13c99997fcc053.png" alt="Coach Alex" class="w-full h-full object-cover">
                </div>
                <div class="max-w-[75%]">
                    <div class="bg-primary-100 rounded-t-2xl rounded-br-2xl p-3 text-neutral-800">
                        <div class="flex items-center">
                            <div class="mr-3">
                                <button class="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center text-white">
                                    <i class="fa-solid fa-play text-xs"></i>
                                </button>
                            </div>
                            <div class="flex-1">
                                <div class="w-full h-1 bg-neutral-200 rounded-full overflow-hidden">
                                    <div class="h-full bg-primary-600 rounded-full" style="width: 0%"></div>
                                </div>
                                <div class="flex justify-between mt-1">
                                    <span class="text-xs text-neutral-500">0:00</span>
                                    <span class="text-xs text-neutral-500">1:24</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <span class="text-xs text-neutral-500 ml-1 mt-1 block">9:35 AM</span>
                </div>
            </div>

            <!-- Coach Message with Suggestion Chips -->
            <div id="coach-message-2" class="flex items-end">
                <div class="w-8 h-8 rounded-full overflow-hidden mr-2 mb-1">
                    <img src="https://storage.googleapis.com/uxpilot-auth.appspot.com/4850872147-c5a84d13c99997fcc053.png" alt="Coach Alex" class="w-full h-full object-cover">
                </div>
                <div class="max-w-[75%]">
                    <!-- Coach main response -->
<div class="bg-primary-100 rounded-t-2xl rounded-br-2xl p-3 text-neutral-800">
    <p>I understand your concerns. Let's break this down into manageable steps...</p>
</div>

<!-- AI suggestion with tooltip -->
<div class="flex justify-start mt-2">
  <div class="max-w-[75%] bg-primary-100 p-3 rounded-2xl text-sm text-neutral-800 relative">
    Here's a good sentence you can open with: “I'm excited to share the progress so far.”
    <i class="fa-solid fa-circle-info text-primary-500 text-xs absolute bottom-1 right-2 cursor-pointer" title="Based on your last coaching input and goals."></i>
  </div>
</div>
                    <span class="text-xs text-neutral-500 ml-1 mt-1 block">9:36 AM</span>
                </div>
            </div>

            <!-- Suggestion Chips -->
            <div id="suggestion-chips" class="flex flex-wrap gap-2 ml-10">
                <button class="bg-white border border-primary-300 text-primary-700 rounded-full px-3 py-1.5 text-sm shadow-sm">
                    Technical explanations
                </button>
                <button class="bg-white border border-primary-300 text-primary-700 rounded-full px-3 py-1.5 text-sm shadow-sm">
                    Q&amp;A session
                </button>
                <button class="bg-white border border-primary-300 text-primary-700 rounded-full px-3 py-1.5 text-sm shadow-sm">
                    Time management
                </button>
            </div>

            <!-- User Message -->
            <div id="user-message-2" class="flex items-end justify-end">
                <div class="max-w-[75%]">
                    <div class="bg-primary-600 rounded-t-2xl rounded-bl-2xl p-3 text-white">
                        <p>Definitely the Q&amp;A session. I'm worried I won't be able to answer their questions clearly.</p>
                    </div>
                    <span class="text-xs text-neutral-500 mr-1 mt-1 block text-right">9:38 AM</span>
                </div>
            </div>

            <!-- Coach is typing indicator -->
            <div id="coach-typing" class="flex items-end">
                <div class="w-8 h-8 rounded-full overflow-hidden mr-2 mb-1">
                    <img src="https://storage.googleapis.com/uxpilot-auth.appspot.com/4850872147-c5a84d13c99997fcc053.png" alt="Coach Alex" class="w-full h-full object-cover">
                </div>
                <div class="bg-primary-100 rounded-2xl p-3 flex space-x-1 items-center">
                    <div class="w-2 h-2 bg-primary-400 rounded-full animate-bounce" style="animation-delay: 0ms"></div>
                    <div class="w-2 h-2 bg-primary-400 rounded-full animate-bounce" style="animation-delay: 150ms"></div>
                    <div class="w-2 h-2 bg-primary-400 rounded-full animate-bounce" style="animation-delay: 300ms"></div>
                </div>
            </div>
        </div>

        <!-- Message Input -->
        <div id="message-input" class="p-3 bg-white border-t border-gray-200 sticky bottom-0 z-10">
<div class="flex items-center mb-2">
  <button id="toggle-chat-mode" class="flex-1 py-1.5 text-center text-sm font-medium border-b-2 border-primary-600 text-primary-600">
    Chat
  </button>
  <button id="toggle-voice-mode" class="flex-1 py-1.5 text-center text-sm font-medium border-b-2 border-transparent text-neutral-500">
    Voice
  </button>
  <button id="toggle-call-mode" class="flex-1 py-1.5 text-center text-sm font-medium border-b-2 border-transparent text-neutral-500">
    Schedule Call
  </button>
  <button id="toggle-roleplay-mode" class="flex-1 py-1.5 text-center text-sm font-medium border-b-2 border-transparent text-neutral-500">
    Role-Play
  </button>
</div>

            
            <div id="chat-input" class="flex items-end">
                <button id="attachment-button" class="p-2 rounded-full text-neutral-500 hover:bg-gray-100 mr-1">
                    <i class="fa-solid fa-paperclip"></i>
                </button>
                <div class="flex-1 bg-gray-100 rounded-2xl overflow-hidden flex items-end">
                    <textarea placeholder="Type a message..." class="w-full bg-transparent border-0 px-3 py-2 resize-none focus:outline-none max-h-32 text-neutral-800" rows="1"></textarea>
                </div>
                <button id="emoji-button" class="p-2 rounded-full text-neutral-500 hover:bg-gray-100 mx-1">
                    <i class="fa-regular fa-face-smile"></i>
                </button>
                <button id="send-button" class="p-2 rounded-full bg-primary-600 text-white">
                    <i class="fa-solid fa-paper-plane"></i>
                </button>
            </div>
        </div>

        <!-- Voice Message Interface (Hidden by default) -->
        <div id="voice-input" class="p-3 bg-white border-t border-gray-200 hidden">
            <div class="flex flex-col items-center">
                <div class="mb-3 text-neutral-600 text-sm">
                    <span id="recording-status">Press and hold to record</span>
                </div>
                <div class="relative mb-3">
                    <div id="voice-waveform" class="h-12 flex items-center justify-center space-x-1">
                        <div class="w-1 h-4 bg-primary-300 rounded-full"></div>
                        <div class="w-1 h-6 bg-primary-400 rounded-full"></div>
                        <div class="w-1 h-8 bg-primary-500 rounded-full"></div>
                        <div class="w-1 h-10 bg-primary-600 rounded-full"></div>
                        <div class="w-1 h-8 bg-primary-500 rounded-full"></div>
                        <div class="w-1 h-6 bg-primary-400 rounded-full"></div>
                        <div class="w-1 h-4 bg-primary-300 rounded-full"></div>
                    </div>
                    <button id="record-button" class="absolute -bottom-12 left-1/2 transform -translate-x-1/2 w-16 h-16 bg-primary-600 rounded-full flex items-center justify-center text-white shadow-lg">
                        <i class="fa-solid fa-microphone text-xl"></i>
                    </button>
                </div>
                <div class="mt-16 flex space-x-4">
                    <button id="cancel-voice" class="px-4 py-2 border border-gray-300 rounded-lg text-neutral-700">
                        Cancel
                    </button>
                    <button id="send-voice" class="px-4 py-2 bg-primary-600 rounded-lg text-white">
                        Send
                    </button>
                </div>
            </div>
        </div>

        <!-- Schedule Call Interface (Hidden by default) -->
        <div id="call-scheduler" class="p-3 bg-white border-t border-gray-200 hidden">
            <div class="flex flex-col">
                <div class="mb-3">
                    <label class="text-sm font-medium mb-1 block">Schedule a call with Coach Alex</label>
                    <input type="date" class="w-full p-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500 mb-2">
                    <select class="w-full p-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500">
                        <option>9:00 AM</option>
                        <option>10:00 AM</option>
                        <option>11:00 AM</option>
                        <option>1:00 PM</option>
                        <option>2:00 PM</option>
                        <option>3:00 PM</option>
                    </select>
                </div>
                <div class="mb-3">
                    <label class="text-sm font-medium mb-1 block">Call topic</label>
                    <input type="text" placeholder="E.g., Presentation preparation" class="w-full p-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500">
                </div>
                <div class="flex space-x-2">
                    <button id="cancel-call" class="flex-1 py-2 border border-gray-300 rounded-lg text-neutral-700">
                        Cancel
                    </button>
                    <button id="schedule-call" class="flex-1 py-2 bg-primary-600 rounded-lg text-white">
                        Schedule
                    </button>
                </div>
            </div>
        </div>
    </div>

    <!-- Bottom Navigation -->
    <div id="bottom-nav" class="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around py-2 px-1 z-20 hidden">
        <button class="flex flex-col items-center p-2 text-neutral-500">
            <i class="fa-solid fa-house text-lg"></i>
            <span class="text-xs mt-1">Home</span>
        </button>
        <button class="flex flex-col items-center p-2 text-primary-600">
            <i class="fa-solid fa-comment-dots text-lg"></i>
            <span class="text-xs mt-1">Coach</span>
        </button>
        <button class="flex flex-col items-center p-2 text-neutral-500">
            <i class="fa-solid fa-tasks text-lg"></i>
            <span class="text-xs mt-1">Tasks</span>
        </button>
        <button class="flex flex-col items-center p-2 text-neutral-500">
            <i class="fa-solid fa-face-smile text-lg"></i>
            <span class="text-xs mt-1">Mood</span>
        </button>
        <button class="flex flex-col items-center p-2 text-neutral-500">
            <i class="fa-solid fa-book text-lg"></i>
            <span class="text-xs mt-1">Learn</span>
        </button>
    </div>
<!-- 🎭 Role-Play Modal -->
<div id="roleplay-modal" class="fixed inset-0 bg-black bg-opacity-50 z-50 hidden">
  <div class="flex items-center justify-center min-h-screen px-4">
    <div class="bg-white rounded-xl w-full max-w-md p-6 shadow-xl">
      <div class="flex justify-between items-center mb-3">
        <h3 class="text-lg font-semibold">🎭 Practice a Scenario</h3>
        <button onclick="document.getElementById('roleplay-modal').classList.add('hidden')" class="text-neutral-400">
          <i class="fa-solid fa-times"></i>
        </button>
      </div>
      <p class="text-sm text-neutral-600 mb-4">Choose a situation you'd like to practice with your AI coach:</p>
      <ul class="text-sm space-y-3">
        <li><button class="w-full text-left py-2 px-3 bg-neutral-50 rounded-lg hover:bg-primary-50">🗣 Giving Feedback to a Team Member</button></li>
        <li><button class="w-full text-left py-2 px-3 bg-neutral-50 rounded-lg hover:bg-primary-50">🎙 Asking for a Raise</button></li>
        <li><button class="w-full text-left py-2 px-3 bg-neutral-50 rounded-lg hover:bg-primary-50">💬 Handling Conflict with a Peer</button></li>
      </ul>
      <div class="mt-4 flex justify-between">
  <button onclick="document.getElementById('roleplay-modal').classList.add('hidden')" class="text-sm text-primary-600">Cancel</button>
  <button id="complete-roleplay-button" class="bg-primary-600 text-white py-2 px-4 rounded-lg hover:bg-primary-700">
    Finish & Get Feedback
  </button>
</div>

    </div>
  </div>
</div>

    <script>
        document.addEventListener('DOMContentLoaded', function() {
            // Toggle between chat, voice, and call modes
            const chatInput = document.getElementById('chat-input');
            const voiceInput = document.getElementById('voice-input');
            const callScheduler = document.getElementById('call-scheduler');
            
            const toggleChatMode = document.getElementById('toggle-coach-mode');
            const toggleVoiceMode = document.getElementById('toggle-voice-mode');
            const toggleCallMode = document.getElementById('toggle-call-mode');
            
            toggleChatMode.addEventListener('click', function() {
                chatInput.classList.remove('hidden');
                voiceInput.classList.add('hidden');
                callScheduler.classList.add('hidden');
                
                toggleChatMode.classList.add('border-primary-600', 'text-primary-600');
                toggleVoiceMode.classList.remove('border-primary-600', 'text-primary-600');
                toggleCallMode.classList.remove('border-primary-600', 'text-primary-600');
                
                toggleVoiceMode.classList.add('border-transparent', 'text-neutral-500');
                toggleCallMode.classList.add('border-transparent', 'text-neutral-500');
            });
            
            toggleVoiceMode.addEventListener('click', function() {
                chatInput.classList.add('hidden');
                voiceInput.classList.remove('hidden');
                callScheduler.classList.add('hidden');
                
                toggleChatMode.classList.remove('border-primary-600', 'text-primary-600');
                toggleVoiceMode.classList.add('border-primary-600', 'text-primary-600');
                toggleCallMode.classList.remove('border-primary-600', 'text-primary-600');
                
                toggleChatMode.classList.add('border-transparent', 'text-neutral-500');
                toggleCallMode.classList.add('border-transparent', 'text-neutral-500');
            });
            
            toggleCallMode.addEventListener('click', function() {
                chatInput.classList.add('hidden');
                voiceInput.classList.add('hidden');
                callScheduler.classList.remove('hidden');
                
                toggleChatMode.classList.remove('border-primary-600', 'text-primary-600');
                toggleVoiceMode.classList.remove('border-primary-600', 'text-primary-600');
                toggleCallMode.classList.add('border-primary-600', 'text-primary-600');
                
                toggleChatMode.classList.add('border-transparent', 'text-neutral-500');
                toggleVoiceMode.classList.add('border-transparent', 'text-neutral-500');
            });
            
            // Voice recording animation simulation
            const recordButton = document.getElementById('record-button');
            const recordingStatus = document.getElementById('recording-status');
            const voiceWaveform = document.getElementById('voice-waveform');
            
            let isRecording = false;
            
            recordButton.addEventListener('mousedown', function() {
                isRecording = true;
                recordingStatus.textContent = 'Recording... 0:00';
                recordButton.classList.add('bg-red-600');
                
                // Simulate waveform animation
                Array.from(voiceWaveform.children).forEach(bar => {
                    const randomHeight = Math.floor(Math.random() * 12) + 4;
                    bar.style.height = `${randomHeight}px`;
                    bar.style.transition = 'height 0.2s ease';
                });
                
                // Continue animation
                voiceAnimationInterval = setInterval(() => {
                    Array.from(voiceWaveform.children).forEach(bar => {
                        const randomHeight = Math.floor(Math.random() * 12) + 4;
                        bar.style.height = `${randomHeight}px`;
                    });
                }, 200);
            });
            
            recordButton.addEventListener('mouseup', function() {
                if (isRecording) {
                    isRecording = false;
                    recordingStatus.textContent = 'Recording complete';
                    recordButton.classList.remove('bg-red-600');
                    clearInterval(voiceAnimationInterval);
                    
                    // Reset waveform
                    Array.from(voiceWaveform.children).forEach((bar, index) => {
                        const heights = [4, 6, 8, 10, 8, 6, 4];
                        bar.style.height = `${heights[index]}px`;
                    });
                }
            });
            
            // Auto-resize textarea
            const textarea = document.querySelector('textarea');
            textarea.addEventListener('input', function() {
                this.style.height = 'auto';
                this.style.height = (this.scrollHeight) + 'px';
                if (this.scrollHeight > 120) {
                    this.style.overflowY = 'auto';
                } else {
                    this.style.overflowY = 'hidden';
                }
            });
        });
document.getElementById('toggle-roleplay-mode').addEventListener('click', function () {
  document.getElementById('roleplay-modal').classList.remove('hidden');
});

// Trigger Voice Feedback after Role-Play ends
function showVoiceFeedback() {
  document.getElementById('voice-feedback-modal').classList.remove('hidden');
}

// Example: Tie to a 'complete roleplay' button (you can link it from inside roleplay modal)
document.getElementById('complete-roleplay-button')?.addEventListener('click', showVoiceFeedback);


    </script>
<!-- 🎙️ Voice Feedback Scoring Modal -->
<div id="voice-feedback-modal" class="fixed inset-0 z-50 bg-black bg-opacity-50 hidden">
  <div class="flex items-center justify-center min-h-screen px-4">
    <div class="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
      <div class="flex justify-between items-center mb-4">
        <h3 class="text-lg font-semibold text-neutral-800">🎙 Feedback from Coach</h3>
        <button onclick="document.getElementById('voice-feedback-modal').classList.add('hidden')" class="text-neutral-400">
          <i class="fa-solid fa-times text-lg"></i>
        </button>
      </div>
      
      <!-- Score -->
      <div class="text-center mb-4">
        <p class="text-sm text-neutral-600 mb-1">Clarity Score</p>
        <p class="text-3xl font-bold text-primary-600">8.5 / 10</p>
        <p class="text-xs text-neutral-500">Great job staying concise and confident.</p>
      </div>

      <!-- Audio Playback -->
      <div class="bg-primary-50 rounded-lg p-3 mb-4">
        <div class="flex items-center space-x-3">
          <button class="w-10 h-10 bg-primary-600 rounded-full text-white flex items-center justify-center">
            <i class="fa-solid fa-play text-sm"></i>
          </button>
          <div class="flex-1">
            <div class="w-full h-1 bg-neutral-200 rounded-full overflow-hidden mb-1">
              <div class="h-full bg-primary-500" style="width: 45%"></div>
            </div>
            <div class="text-xs text-neutral-500 flex justify-between">
              <span>0:00</span><span>0:42</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Suggestions -->
      <div class="mb-4">
        <p class="text-sm font-medium text-neutral-700 mb-2">Suggestions to Improve</p>
        <ul class="list-disc list-inside text-sm text-neutral-600 space-y-1">
          <li>Pause more between thoughts</li>
          <li>Use personal examples to boost impact</li>
          <li>Smile audibly during delivery</li>
        </ul>
      </div>

      <!-- CTA -->
      <div class="text-right">
        <button onclick="document.getElementById('voice-feedback-modal').classList.add('hidden')" class="text-sm text-primary-600 mr-4">Close</button>
        <button class="text-sm bg-primary-600 text-white py-2 px-4 rounded-lg hover:bg-primary-700">Try Again</button>
      </div>
    </div>
  </div>
</div>

</body></html>
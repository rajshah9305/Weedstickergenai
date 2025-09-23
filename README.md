**Weed Sticker Generator**

✨ Features Implemented
	•	Modern UI: Dark theme with cannabis-inspired design
	•	Real-time API: Flask backend with Gemini Imagen 4 integration
	•	Error Handling: Comprehensive error handling with retry logic
	•	API Status: Live status indicator showing connection health
	•	Responsive Design: Works on desktop and mobile devices
	•	20 Unique Prompts: Variety of creative cannabis sticker designs
	•	Loading States: Smooth loading animations and user feedback

🛠️ Technical Stack
	•	Backend: Flask with CORS support
	•	Frontend: HTML5, CSS3, JavaScript (Vanilla)
	•	API: Google Gemini Imagen 4.0 for image generation
	•	Styling: Tailwind CSS with custom animations
	•	Deployment: Production-ready with automatic scaling

🎨 How It Works
	1.	Click “Generate New Sticker” button
	2.	Random prompt is selected from 20 creative options
	3.	Backend calls Gemini Imagen 4 API
	4.	AI generates a unique cannabis sticker
	5.	Image is displayed with smooth animations

🔧 API Endpoint Details
	•	Model: `imagen-4.0-generate-001`
	•	Endpoint: `generateImages`
	•	Features: High-quality vector illustrations with sticker styling
	•	Retry Logic: 3 attempts with exponential backoff
	•	Timeout: 30 seconds per request

📱 User Experience
	•	Keyboard Shortcut: Press spacebar to generate new sticker
	•	Visual Feedback: Loading spinner with prompt display
	•	Error Recovery: “Try Again” button for failed generations
	•	Status Indicator: Real-time API connection status

The application is fully functional and ready for use once the API key is configured in the production environment!

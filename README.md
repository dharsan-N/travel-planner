# RoamAI - Intelligent AI Travel Planner MVP

RoamAI is a full-stack, responsive travel planning application. It generates personalized travel itineraries using a Python Flask backend integrated with an LLM (Grok/xAI or any OpenAI-compatible provider) and the OpenWeatherMap API. 

The frontend is built with vanilla HTML, CSS, and JS using modern glassmorphic styling, smooth micro-animations, loading statuses, and client-side PDF export.

## Features

- **Modern Travel Form**: Input destination, duration (1-30 days), budget (INR), and multi-select interests.
- **AI-Powered Itinerary Generation**: Prompt constructed dynamically and sent to Grok (or any OpenAI-compatible model) returning structured day-by-day JSON.
- **Weather Integration**: Fetches real-time temperature and weather conditions for the chosen city.
- **Client-Side PDF Export**: Instantly download the formatted itinerary to your device using `html2pdf.js`.
- **Regenerate / Modify flow**: Quick-switch inputs or regenerate itineraries seamlessly with the same settings.
- **No-Key Mock Fallback**: If API keys are missing, the backend generates realistic mock weather and detailed, interest-aligned itineraries so developers can test the application instantly.

---

## Project Structure

```
travel-planner/
├── backend/
│   ├── app.py                     # Main Flask Application
│   ├── itinerary_service.py       # LLM (Grok) Integration Service
│   ├── weather_service.py         # OpenWeatherMap Integration Service
│   ├── requirements.txt           # Python Package Dependencies
│   └── .env.example               # Config Template for API Keys
├── frontend/
│   ├── index.html                 # Main Landing Page and Results View
│   ├── style.css                  # Modern Glassmorphic Design and Print Layout
│   └── script.js                  # Form Submissions, API Requests & PDF Download
└── README.md                      # Documentation
```

---

## Setup & Running the Application

### 1. Backend Setup

You can run the application locally on Windows using PowerShell or Command Prompt.

1. **Navigate to the Backend Directory**:
   ```powershell
   cd travel-planner/backend
   ```

2. **Create a Python Virtual Environment** (Recommended):
   ```powershell
   python -m venv venv
   # Activate it:
   .\venv\Scripts\Activate.ps1
   ```

3. **Install Dependencies**:
   ```powershell
   pip install -r requirements.txt
   ```

4. **Configure API Keys**:
   - Duplicate the `.env.example` file and rename it to `.env`:
     ```powershell
     copy .env.example .env
     ```
   - Open `.env` in a text editor and fill in your keys:
     - `OPENWEATHERMAP_API_KEY`: Fetch from [OpenWeatherMap Console](https://openweathermap.org/api).
     - `GROK_API_KEY`: Fetch from [xAI Console](https://console.x.ai/).
   
   *(Note: If you leave these blank, the app will run in **mock fallback mode**, generating realistic coordinates, temperatures, and itineraries locally).*

5. **Run the Flask Server**:
   ```powershell
   python app.py
   ```
   The terminal will output that the server is running on `http://127.0.0.1:5000`.

---

### 2. Launching the Frontend

Since the Flask backend is configured to host static assets from the `frontend/` folder, you have two options to open the app:

#### Option A: Recommended (All-in-One Service)
With the Flask server running, open your browser and navigate to:
```
http://127.0.0.1:5000/
```
This serves the frontend files directly from Flask, eliminating any potential Cross-Origin Resource Sharing (CORS) complications.

#### Option B: Standalone Frontend
You can open `frontend/index.html` directly in your browser (using double-click or a VS Code Live Server extension). The frontend is built with smart cross-origin fallbacks to send POST requests back to `http://127.0.0.1:5000/generate-itinerary` automatically.

---

## Customizing the AI Service (Swapping Grok)

RoamAI uses a generic, OpenAI-compatible HTTP client wrapper. To switch from Grok (xAI) to another LLM provider (e.g. OpenAI or Anthropic/OpenRouter), edit your backend `.env` file:

- **For OpenAI GPT-4o-mini**:
  ```env
  LLM_BASE_URL=https://api.openai.com/v1
  LLM_MODEL=gpt-4o-mini
  GROK_API_KEY=your_openai_api_key_here
  ```

- **For OpenRouter**:
  ```env
  LLM_BASE_URL=https://openrouter.ai/api/v1
  LLM_MODEL=google/gemini-2.5-flash
  GROK_API_KEY=your_openrouter_api_key_here
  ```

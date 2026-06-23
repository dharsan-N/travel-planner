import os
import logging
from flask import Flask, request, jsonify
from flask_cors import CORS
from weather_service import WeatherService
from itinerary_service import ItineraryService

try:
    from dotenv import load_dotenv
    load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))
    load_dotenv()
except ImportError:
    pass

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger(__name__)

app = Flask(__name__, static_folder="../frontend", static_url_path="")
CORS(app)

weather_service = WeatherService()
itinerary_service = ItineraryService()

@app.route("/")
def serve_index():
    try:
        return app.send_static_file("index.html")
    except Exception as e:
        logger.error(f"Error serving index.html: {e}")
        return "Backend is running! Frontend index.html not found.", 404

@app.route("/generate-itinerary", methods=["POST"])
def generate_itinerary_endpoint():
    try:
        data = request.get_json() or {}
        destination = data.get("destination", "").strip()
        days = data.get("days")
        budget = data.get("budget")
        interests = data.get("interests", [])

        if not destination:
            return jsonify({"error": "Destination is required."}), 400

        try:
            days = int(days)
            if days <= 0 or days > 30:
                return jsonify({"error": "Duration must be between 1 and 30 days."}), 400
        except (TypeError, ValueError):
            return jsonify({"error": "Duration must be a valid positive number of days."}), 400

        try:
            budget = int(budget)
            if budget <= 0:
                return jsonify({"error": "Budget must be a positive number."}), 400
        except (TypeError, ValueError):
            return jsonify({"error": "Budget must be a valid positive number."}), 400

        if not isinstance(interests, list):
            return jsonify({"error": "Interests must be a list of strings."}), 400
        interests = [str(item).strip() for item in interests if item]

        logger.info(f"Generating itinerary for: {destination}")

        weather_info = weather_service.get_weather(destination)
        itinerary_info = itinerary_service.generate_itinerary(destination, days, budget, interests)

        response_payload = {
            "destination": destination,
            "weather": {
                "temperature": weather_info.get("temperature", "N/A"),
                "condition": weather_info.get("condition", "Unknown")
            },
            "realtime_data": itinerary_info.get("realtime_data", {}),
            "itinerary": itinerary_info.get("itinerary", [])
        }

        return jsonify(response_payload)

    except Exception as e:
        logger.exception("Unexpected error during itinerary generation")
        return jsonify({"error": f"An internal server error occurred: {str(e)}"}), 500

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    debug_mode = os.environ.get("FLASK_DEBUG", "True").lower() == "true"
    app.run(host="0.0.0.0", port=port, debug=debug_mode)

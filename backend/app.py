import os
import logging
# pyrefly: ignore [missing-import]
from flask import Flask, request, jsonify
from flask_cors import CORS
from openweather_service import OpenWeatherService
from grok_service import GrokService

try:
    # pyrefly: ignore [missing-import]
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

openweather_service = OpenWeatherService()
grok_service = GrokService()

@app.route("/")
def serve_index():
    try:
        return app.send_static_file("index.html")
    except Exception as e:
        logger.error(f"Error serving index.html: {e}")
        return "Backend is running! Frontend index.html not found.", 404

@app.route("/get-spotlights", methods=["POST"])
def get_spotlights_endpoint():
    try:
        data = request.get_json() or {}
        destination = data.get("destination", "").strip()
        if not destination:
            return jsonify({"error": "Destination is required."}), 400
            
        days = int(data.get("days", 5))
        budget = int(data.get("budget", 50000))
        num_people = int(data.get("num_people", 2))
        companion_type = data.get("companion_type", "Family").strip()
        
        logger.info(f"Retrieving spotlights for: {destination} (Group size: {num_people}, Budget: {budget}, Companion: {companion_type})")
        realtime_data = grok_service.geoapify_service.get_all_data(destination)
        if not realtime_data:
            return jsonify({"error": "Destination could not be geolocated or resolved."}), 404
            
        # Import helper functions
        from grok_service import sort_places_by_companion, estimate_budget_needs
        
        # Sort items dynamically by companion type in-place
        if "hotels" in realtime_data:
            realtime_data["hotels"] = sort_places_by_companion(realtime_data["hotels"], companion_type, "hotel")
        if "restaurants" in realtime_data:
            realtime_data["restaurants"] = sort_places_by_companion(realtime_data["restaurants"], companion_type, "restaurant")
        if "attractions" in realtime_data:
            realtime_data["attractions"] = sort_places_by_companion(realtime_data["attractions"], companion_type, "attraction")
            
        # Estimate budget requirements
        budget_estimates = estimate_budget_needs(
            realtime_data, days, budget, num_people, companion_type
        )
            
        return jsonify({
            "destination": destination,
            "realtime_data": realtime_data,
            "country": realtime_data.get("country", ""),
            "estimated_expenses": budget_estimates["estimated_expenses"],
            "minimum_budget_required": budget_estimates["minimum_budget_required"],
            "per_person_estimated": budget_estimates["per_person_estimated"],
            "is_budget_sufficient": budget_estimates["is_budget_sufficient"],
            "budget_suitability_note": budget_estimates["budget_suitability_note"]
        })
    except Exception as e:
        logger.exception("Error during spotlights retrieval")
        return jsonify({"error": f"An internal server error occurred: {str(e)}"}), 500

@app.route("/generate-itinerary", methods=["POST"])
def generate_itinerary_endpoint():
    try:
        data = request.get_json() or {}
        destination = data.get("destination", "").strip()
        days = data.get("days")
        budget = data.get("budget")
        interests = data.get("interests", [])
        preferences = data.get("preferences", "").strip()
        num_people = data.get("num_people", 1)
        travel_date = data.get("travel_date", "").strip()  # format "YYYY-MM" or ""
        selected_hotels = data.get("selected_hotels", [])
        selected_restaurants = data.get("selected_restaurants", [])
        selected_attractions = data.get("selected_attractions", [])
        companion_type = data.get("companion_type", "Family").strip()

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

        try:
            num_people = int(num_people)
            if num_people < 1 or num_people > 20:
                num_people = max(1, min(20, num_people))
        except (TypeError, ValueError):
            num_people = 1

        if not isinstance(interests, list):
            return jsonify({"error": "Interests must be a list of strings."}), 400
        interests = [str(item).strip() for item in interests if item]

        logger.info(
            f"Generating itinerary for: {destination} | People: {num_people} | "
            f"Budget: ₹{budget} | Date: '{travel_date}' | Companion: {companion_type} | "
            f"Selected Hotels: {len(selected_hotels)} | Selected Attractions: {len(selected_attractions)}"
        )

        weather_info = openweather_service.get_weather(destination)
        itinerary_info = grok_service.generate_itinerary(
            destination, days, budget, interests, preferences,
            num_people=num_people, travel_date=travel_date,
            selected_hotels=selected_hotels,
            selected_restaurants=selected_restaurants,
            selected_attractions=selected_attractions,
            companion_type=companion_type
        )

        response_payload = {
            "destination": destination,
            "num_people": num_people,
            "travel_date": travel_date,
            "best_time_to_visit": itinerary_info.get("best_time_to_visit", None),
            "rainy_warning": itinerary_info.get("rainy_warning", False),
            "alternate_dates": itinerary_info.get("alternate_dates", ""),
            "minimum_budget_required": itinerary_info.get("minimum_budget_required", 0),
            "budget_suitability_note": itinerary_info.get("budget_suitability_note", ""),
            "weather": {
                "temperature": weather_info.get("temperature", "N/A"),
                "condition": weather_info.get("condition", "Unknown")
            } if weather_info else None,
            "realtime_data": itinerary_info.get("realtime_data", {}),
            "safety_tips": itinerary_info.get("safety_tips", []),
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

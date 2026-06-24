import os
import json
import logging
import urllib.request
from geoapify_service import GeoapifyService

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class GrokService:
    def __init__(self):
        # Support both GROQ_API_KEY and legacy GROK_API_KEY
        self.api_key = (
            os.environ.get("GROQ_API_KEY")
            or os.environ.get("GROK_API_KEY")
            or os.environ.get("LLM_API_KEY")
        )
        
        # Auto-detect provider from key prefix
        if self.api_key and self.api_key.startswith("gsk_"):
            default_url   = "https://api.groq.com/openai/v1"
            default_model = "llama-3.3-70b-versatile"
        else:
            default_url   = "https://api.x.ai/v1"
            default_model = "grok-beta"
            
        self.base_url = os.environ.get("LLM_BASE_URL", default_url)
        self.model    = os.environ.get("LLM_MODEL",    default_model)
        self.geoapify_service = GeoapifyService()

    def generate_itinerary(
        self,
        destination: str,
        days: int,
        budget: int,
        interests: list,
        preferences: str = "",
        num_people: int = 1,
        travel_date: str = ""
    ) -> dict:
        try:
            budget = int(budget)
        except (ValueError, TypeError):
            budget = 20000

        num_people = max(1, int(num_people))
        per_person_budget = budget // num_people

        # 1. Fetch real place data from Geoapify (or OSM Nominatim fallback)
        realtime_data = self.geoapify_service.get_all_data(destination) or {
            "resolved_name": destination,
            "hotels": [],
            "restaurants": [],
            "attractions": [],
            "data_sources": ["osm"]
        }

        data_source_label = ", ".join(realtime_data.get("data_sources", ["osm"])).upper()

        # Send names, categories, and addresses without pre-computed mock ratings to the LLM
        def _place_summary(place: dict) -> str:
            parts = [place.get("name", "Unknown")]
            cat = place.get("category", "")
            if cat:
                parts.append(f"[{cat}]")
            addr = place.get("address", "")
            if addr:
                parts.append(f"@ {addr[:55]}")
            
            hours = place.get("hours", "")
            if hours and "Hours vary" not in hours:
                parts.append(f"(Hours: {hours})")
            web = place.get("website", "")
            if web:
                parts.append(f"(Website: {web})")
                
            return " ".join(parts)

        hotels_list      = realtime_data.get("hotels", [])
        restaurants_list = realtime_data.get("restaurants", [])
        attractions_list = realtime_data.get("attractions", [])

        hotels_context      = " | ".join(_place_summary(h) for h in hotels_list[:5])      or "Local hotels"
        restaurants_context = " | ".join(_place_summary(r) for r in restaurants_list[:5]) or "Local restaurants"
        attractions_context = " | ".join(_place_summary(a) for a in attractions_list[:5]) or "Local sights"

        interests_str = ", ".join(interests) if interests else "General Sightseeing"

        travel_context = f"Travel Date: {travel_date}" if travel_date else "Travel Date: Not specified."

        average_daily_group_budget = budget // days
        average_daily_per_person_budget = per_person_budget // days

        prompt = f"""You are an expert travel planner. Create a HIGHLY SPECIFIC, DETAILED travel itinerary in JSON format.

Destination: {destination}
Duration: {days} days
Group Size: {num_people} {'person' if num_people == 1 else 'people'}
Total Group Budget: ₹{budget} (approx. ₹{per_person_budget} per person)
Average Daily Group Budget limit: ₹{average_daily_group_budget} (approx. ₹{average_daily_per_person_budget} per person per day)
{travel_context}
Interests: {interests_str}
User Preferences/Custom requests: {preferences}

Real-time local data (sourced from: {data_source_label}):
- Top Hotels: {hotels_context}
- Top Restaurants: {restaurants_context}
- Top Sights: {attractions_context}

Requirements:
1. morning/afternoon/evening: Detailed daily plan mentioning at least one of the real attractions, hotels, or restaurants listed above.
2. narration: A warm, friendly, conversational voice-guided narration of the day's itinerary, written in the first-person ('We will...', 'I suggest...') as if a local tour guide is speaking directly to the traveler. Emphasize the highlight of the day, how the stops connect, and throw in a local tip. Keep it conversational, engaging, and rich (2-3 sentences).
3. accommodation: Select a real hotel from the list above (or state a suitable default) and recommend it with price ranges appropriate for the budget tier.
4. food: Suggest breakfast, lunch, and dinner, incorporating the real restaurant names from above.
5. transport: Specify the best local transport modes for the daily route and list estimated costs.
6. weather_note: Include a weather prediction/climate note appropriate for the travel month.
7. entry_fees: List expected entry fees or state 'Free entry'.
8. cost_breakdown & budgeting: The costs for each day MUST be realistic, reasonable, and proportional to the budget. For example, if the Average Daily Group Budget is ₹2000, do not allocate ₹3000 for a hotel room or ₹1500 for food. Under lower budgets, recommend hostels, homestays, public transport, or free activities and reduce the daily cost items accordingly. The total sum of the daily "estimated_cost" across all {days} days must be strictly less than or equal to the Total Group Budget of ₹{budget}.
9. rainy_warning: Determine if the destination is in its rainy/monsoon season during the travel date month (set true/false).
10. alternate_dates: If rainy_warning is true, suggest the best alternative dry months.
11. best_time_to_visit: Recommend the best travel window if no date was specified.
12. spotlights: Estimate the actual real-world user rating (float, 1.0 to 5.0) and review count (integer) for each of the Top Hotels, Top Restaurants, and Top Sights listed above based on your knowledge base. Return these in the spotlights key schema.
13. minimum_budget_required: Calculate a realistic minimum total group budget (integer, in INR) needed to travel to {destination} for {days} days with {num_people} people (covering modest accommodation, food, local travel, and basic attractions).
14. budget_suitability_note: Write a brief (1-2 sentences) note explaining if the user's budget of ₹{budget} is sufficient or tight for this trip and any cost-saving suggestions.

Return ONLY clean JSON matching this schema exactly:
{{
  "best_time_to_visit": "Month range (dry season, pleasant weather)",
  "rainy_warning": false,
  "alternate_dates": "Suggested months",
  "minimum_budget_required": 15000,
  "budget_suitability_note": "A description of the budget suitability.",
  "safety_tips": [
    "Specific local warning or scam to avoid"
  ],
  "spotlights": {{
    "hotels": [
      {{"name": "Hotel Name", "rating": 4.5, "reviews": 320}}
    ],
    "restaurants": [
      {{"name": "Restaurant Name", "rating": 4.2, "reviews": 150}}
    ],
    "attractions": [
      {{"name": "Attraction Name", "rating": 4.7, "reviews": 1200}}
    ]
  }},
  "itinerary": [
    {{
      "day": 1,
      "weather_note": "Day-specific forecast note",
      "narration": "A conversational guide narration for this day, written in a warm and friendly style",
      "morning": "Detailed morning activity with real place name",
      "afternoon": "Detailed afternoon activity with real place name",
      "evening": "Detailed evening activity",
      "accommodation": "Stay at [Hotel Name] — price range",
      "hotel_price": "Price range per night",
      "food": "Breakfast: [Place] (try dish); Lunch: [Place]; Dinner: [Place]",
      "transport": "Transport mode and cost info",
      "entry_fees": [
        {{"place": "Venue Name", "fee": "Fee details"}}
      ],
      "cost_breakdown": {{
        "accommodation": 3000,
        "food": 800,
        "activities": 500,
        "transport": 400,
        "per_person": 2350
      }},
      "estimated_cost": "₹4700"
    }}
  ]
}}"""

        if not self.api_key:
            logger.warning("GROQ_API_KEY/LLM_API_KEY not found. Using local mock generator.")
            return self._generate_mock_itinerary(destination, days, budget, interests, realtime_data, num_people, travel_date)

        try:
            headers = {
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json",
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
            }
            payload = {
                "model": self.model,
                "messages": [
                    {
                        "role": "system",
                        "content": (
                            "You are a professional travel planner. Reply strictly with a JSON object "
                            "containing 'safety_tips', 'spotlights', 'itinerary', 'rainy_warning', 'alternate_dates', "
                            "'best_time_to_visit', 'minimum_budget_required', and 'budget_suitability_note' keys. "
                            "Do not wrap code blocks in markdown fences, and do not output any text before or after the JSON."
                        )
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                "response_format": {"type": "json_object"},
                "temperature": 0.7
            }

            url = f"{self.base_url.rstrip('/')}/chat/completions"
            logger.info(f"Sending request to LLM at {url} using model {self.model}")

            req = urllib.request.Request(url, data=json.dumps(payload).encode("utf-8"), headers=headers)
            with urllib.request.urlopen(req, timeout=45) as resp:
                result_json = json.loads(resp.read().decode("utf-8"))
                content = result_json.get("choices", [{}])[0].get("message", {}).get("content", "").strip()

                if content.startswith("```"):
                    content = content.replace("```json", "").replace("```", "").strip()

                parsed_data = json.loads(content)
                
                # Merge LLM-estimated ratings/reviews back into realtime_data
                spotlights = parsed_data.get("spotlights", {})
                for cat in ["hotels", "restaurants", "attractions"]:
                    llm_items = spotlights.get(cat, [])
                    rating_lookup = {}
                    for item in llm_items:
                        name = item.get("name", "").strip().lower()
                        rating = item.get("rating")
                        reviews = item.get("reviews")
                        if name and rating is not None:
                            try:
                                rating_lookup[name] = (float(rating), int(reviews or 0))
                            except (ValueError, TypeError):
                                pass

                    if cat in realtime_data:
                        for place in realtime_data[cat]:
                            place_name = place.get("name", "").strip().lower()
                            match_found = False
                            for key in rating_lookup:
                                if key == place_name or key in place_name or place_name in key:
                                    place["rating"], place["reviews"] = rating_lookup[key]
                                    place["rating_source"] = "groq"
                                    match_found = True
                                    break
                            if not match_found:
                                # Fall back to the pre-existing hash rating source
                                place["rating_source"] = "geoapify"

                min_budget_req = parsed_data.get("minimum_budget_required", 0)
                try:
                    min_budget_req = int(min_budget_req)
                except (ValueError, TypeError):
                    min_budget_req = 0

                itinerary_list = parsed_data.get("itinerary", [])
                self._adjust_costs_to_budget(itinerary_list, budget, num_people)

                return {
                    "itinerary": itinerary_list,
                    "safety_tips": parsed_data.get("safety_tips", []),
                    "realtime_data": realtime_data,
                    "best_time_to_visit": parsed_data.get("best_time_to_visit", "October to March"),
                    "rainy_warning": parsed_data.get("rainy_warning", False),
                    "alternate_dates": parsed_data.get("alternate_dates", ""),
                    "minimum_budget_required": min_budget_req,
                    "budget_suitability_note": parsed_data.get("budget_suitability_note", "")
                }

        except Exception as e:
            logger.error(f"LLM generation failed: {e}. Falling back to mock generator.")
            return self._generate_mock_itinerary(destination, days, budget, interests, realtime_data, num_people, travel_date)

    def _generate_mock_itinerary(
        self,
        destination: str,
        days: int,
        budget: int,
        interests: list,
        realtime_data: dict,
        num_people: int = 1,
        travel_date: str = ""
    ) -> dict:
        logger.info(f"Generating simplified fallback mock itinerary for {destination}")
        
        hotels = [h["name"] for h in realtime_data.get("hotels", [])]
        restaurants = [r["name"] for r in realtime_data.get("restaurants", [])]
        attractions = [a["name"] for a in realtime_data.get("attractions", [])]

        primary_hotel = hotels[0] if hotels else f"Comfort Inn {destination}"
        r1 = restaurants[0] if len(restaurants) > 0 else "Local Diner"
        r2 = restaurants[1] if len(restaurants) > 1 else "Heritage Kitchen"
        
        a1 = attractions[0] if len(attractions) > 0 else f"{destination} Market"
        a2 = attractions[1] if len(attractions) > 1 else f"{destination} Heritage Site"

        itinerary_list = []
        daily_accommodation = int((budget * 0.45) // max(1, days))
        daily_food = int((budget * 0.25) // max(1, days))
        daily_activities = int((budget * 0.15) // max(1, days))
        daily_transport = int((budget * 0.10) // max(1, days))
        
        total_daily = daily_accommodation + daily_food + daily_activities + daily_transport
        per_person = total_daily // max(1, num_people)

        for d in range(1, days + 1):
            itinerary_list.append({
                "day": d,
                "weather_note": f"Day {d}: Mild and pleasant weather expected",
                "narration": f"Welcome to Day {d} in {destination}! We will start our morning exploring the scenic {a1}. After that, I recommend heading to {a2} for a walk. Finally, wrap up your evening with beautiful sunset views and dining at {r2}.",
                "morning": f"9:00 AM – Visit {a1} and explore the main highlights.",
                "afternoon": f"1:30 PM – Check out {a2} for a local sightseeing walk.",
                "evening": "6:00 PM – Enjoy a relaxing walk and sunset views.",
                "accommodation": f"Stay at {primary_hotel} — clean rooms and great service",
                "hotel_price": f"₹{daily_accommodation // num_people}/night per person",
                "food": f"Breakfast at hotel; Lunch at {r1} (try local thali); Dinner at {r2}",
                "transport": "Auto-rickshaw rentals and walking",
                "entry_fees": [
                    {"place": a1, "fee": "Free entry"},
                    {"place": a2, "fee": "₹50/person"}
                ],
                "cost_breakdown": {
                    "accommodation": daily_accommodation,
                    "food": daily_food,
                    "activities": daily_activities,
                    "transport": daily_transport,
                    "per_person": per_person
                },
                "estimated_cost": f"₹{total_daily}"
            })

        min_budget = days * num_people * 2000

        return {
            "itinerary": itinerary_list,
            "safety_tips": [
                f"Confirm taxi or rickshaw fares before departure in {destination}.",
                "Keep your valuables secure in busy tourist centers."
            ],
            "realtime_data": realtime_data,
            "best_time_to_visit": "October to March (pleasant winter months)",
            "rainy_warning": False,
            "alternate_dates": "",
            "minimum_budget_required": min_budget,
            "budget_suitability_note": f"Estimated minimum budget is ₹{min_budget} (assuming basic daily expenses of ₹2,000/person)."
        }

    def _adjust_costs_to_budget(self, itinerary: list, total_budget: int, num_people: int):
        import re
        day_costs = []
        total_parsed = 0
        for day in itinerary:
            cost_str = day.get("estimated_cost", "0")
            digits = re.sub(r'[^0-9]', '', cost_str)
            cost_val = int(digits) if digits else 0
            day_costs.append(cost_val)
            total_parsed += cost_val

        if total_parsed <= 0:
            return

        # If the total parsed daily costs exceeds the budget, scale down proportionally
        if total_parsed > total_budget:
            scale = total_budget / total_parsed
            new_day_costs = []
            running_sum = 0
            for i, val in enumerate(day_costs):
                if i == len(day_costs) - 1:
                    new_val = total_budget - running_sum
                else:
                    new_val = int(val * scale)
                    running_sum += new_val
                new_day_costs.append(new_val)
                
            # Update daily cost breakdown categories
            for i, day in enumerate(itinerary):
                target_day_total = new_day_costs[i]
                cb = day.get("cost_breakdown", {})
                if not cb:
                    cb = {"accommodation": 0, "food": 0, "activities": 0, "transport": 0}
                
                categories = ["accommodation", "food", "activities", "transport"]
                cb_vals = [cb.get(cat, 0) for cat in categories]
                cb_sum = sum(cb_vals)
                if cb_sum > 0:
                    cb_scale = target_day_total / cb_sum
                    new_cb_vals = []
                    cb_running = 0
                    for j, cat_val in enumerate(cb_vals):
                        if j == len(cb_vals) - 1:
                            new_cat_val = target_day_total - cb_running
                        else:
                            new_cat_val = int(cat_val * cb_scale)
                            cb_running += new_cat_val
                        new_cb_vals.append(new_cat_val)
                    
                    for j, cat in enumerate(categories):
                        cb[cat] = new_cb_vals[j]
                else:
                    # Fallback even distribution
                    part = target_day_total // 4
                    cb["accommodation"] = part
                    cb["food"] = part
                    cb["activities"] = part
                    cb["transport"] = target_day_total - 3 * part
                
                cb["per_person"] = target_day_total // max(1, num_people)
                day["cost_breakdown"] = cb
                day["estimated_cost"] = f"₹{target_day_total}"

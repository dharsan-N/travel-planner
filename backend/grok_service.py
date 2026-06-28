import os
import json
import logging
import urllib.request
from geoapify_service import GeoapifyService

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def get_currency_info(country: str) -> tuple:
    if not country:
        return '₹', 'INR'
    c = country.lower().strip()
    if 'india' in c or 'in' == c:
        return '₹', 'INR'
    if any(x in c for x in ['france', 'germany', 'italy', 'spain', 'austria', 'netherlands', 'europe', 'ireland', 'belgium', 'greece', 'portugal', 'finland', 'switzerland', 'sweden', 'norway', 'denmark']):
        if 'switzerland' in c:
            return 'CHF', 'CHF'
        if 'sweden' in c:
            return 'kr', 'SEK'
        if 'norway' in c:
            return 'kr', 'NOK'
        if 'denmark' in c:
            return 'kr', 'DKK'
        return '€', 'EUR'
    if any(x in c for x in ['united kingdom', 'uk', 'london', 'great britain', 'england', 'scotland', 'wales']):
        return '£', 'GBP'
    if 'japan' in c or 'jp' == c:
        return '¥', 'JPY'
    if any(x in c for x in ['united states', 'usa', 'us', 'america', 'canada', 'australia', 'singapore', 'new zealand', 'hong kong']):
        return '$', 'USD'
    return '₹', 'INR'

def sort_places_by_companion(places: list, companion_type: str, category: str) -> list:
    if not places:
        return []
    c_lower = companion_type.lower()
    keywords = []
    if category == "hotel":
        if c_lower == "couple":
            keywords = ["resort", "spa", "boutique", "villa", "grand", "palace", "luxury", "hotel"]
        elif c_lower == "family":
            keywords = ["resort", "suites", "inn", "cottage", "apartment", "family", "park", "hotel"]
        elif c_lower == "friends":
            keywords = ["hostel", "camp", "backpack", "budget", "inn", "guest", "lodge", "cabin"]
        elif c_lower == "solo":
            keywords = ["hostel", "capsule", "guest", "inn", "bed", "single", "hotel"]
    elif category == "restaurant":
        if c_lower == "couple":
            keywords = ["cafe", "bistro", "wine", "lounge", "fine", "dining", "rooftop", "cuisine"]
        elif c_lower == "family":
            keywords = ["family", "kitchen", "diner", "food", "court", "restaurant", "buffet", "dhaba"]
        elif c_lower == "friends":
            keywords = ["pub", "bar", "brewery", "grill", "pizza", "burger", "cafe", "lounge", "club"]
        elif c_lower == "solo":
            keywords = ["cafe", "coffee", "bakery", "street", "diner", "tea", "express", "bistro"]
    elif category == "attraction":
        if c_lower == "couple":
            keywords = ["viewpoint", "beach", "park", "garden", "lake", "sunset", "scenic", "river"]
        elif c_lower == "family":
            keywords = ["park", "museum", "zoo", "palace", "fort", "garden", "temple", "science", "aquarium"]
        elif c_lower == "friends":
            keywords = ["adventure", "trekking", "waterfall", "beach", "club", "shopping", "mall", "market", "hiking"]
        elif c_lower == "solo":
            keywords = ["museum", "temple", "art", "library", "historical", "hiking", "market", "monument"]
            
    def get_score(place):
        name = place.get("name", "").lower()
        cat = place.get("category", "").lower()
        addr = place.get("address", "").lower()
        score = 0
        for kw in keywords:
            if kw in name:
                score += 3
            if kw in cat:
                score += 2
            if kw in addr:
                score += 1
        rating = place.get("rating", 4.0)
        score += rating * 2
        return score
    return sorted(places, key=get_score, reverse=True)

def estimate_budget_needs(realtime_data: dict, days: int, budget: int, num_people: int, companion_type: str) -> dict:
    country_resolved = realtime_data.get("country", "")
    currency_symbol, currency_code = get_currency_info(country_resolved)
    
    if currency_symbol == '₹':
        base_hotel = 2000
        base_food = 600
        base_transport = 300
        base_activity = 250
    else:
        base_hotel = 120
        base_food = 50
        base_transport = 20
        base_activity = 20
        
    hotel_factor = 1.0
    food_factor = 1.0
    transport_factor = 1.0
    activity_factor = 1.0
    
    c_lower = companion_type.lower()
    if c_lower == "couple":
        hotel_factor = 1.25
        food_factor = 1.2
        transport_factor = 0.9
    elif c_lower == "family":
        hotel_factor = 1.1
        food_factor = 1.0
        transport_factor = 1.2
        activity_factor = 1.1
    elif c_lower == "friends":
        hotel_factor = 0.75
        food_factor = 0.9
        transport_factor = 0.8
        activity_factor = 1.3
    elif c_lower == "solo":
        hotel_factor = 0.85
        food_factor = 1.0
        transport_factor = 1.1
        
    if c_lower == "solo":
        rooms_needed = num_people
    else:
        rooms_needed = max(1, (num_people + 1) // 2)
        
    daily_accommodation_cost = rooms_needed * base_hotel * hotel_factor
    daily_food_cost = num_people * base_food * food_factor
    daily_transport_cost = num_people * base_transport * transport_factor
    daily_activity_cost = num_people * base_activity * activity_factor
    
    daily_total = daily_accommodation_cost + daily_food_cost + daily_transport_cost + daily_activity_cost
    total_est_expenses = int(daily_total * days)
    min_recommended = int(total_est_expenses * 0.8)
    
    is_enough = budget >= min_recommended
    per_person = int(total_est_expenses // num_people) if num_people > 0 else total_est_expenses
    
    if is_enough:
        note = f"Your budget of {currency_symbol}{budget:,} is sufficient for {num_people} {'person' if num_people == 1 else 'people'} for a {days}-day trip to {realtime_data.get('resolved_name', 'destination')}. Estimated typical expenses: {currency_symbol}{total_est_expenses:,}."
    else:
        note = f"Your budget of {currency_symbol}{budget:,} is tight. We recommend a minimum of {currency_symbol}{min_recommended:,} for {num_people} {'person' if num_people == 1 else 'people'} for {days} days."
        
    return {
        "estimated_expenses": total_est_expenses,
        "minimum_budget_required": min_recommended,
        "per_person_estimated": per_person,
        "is_budget_sufficient": is_enough,
        "budget_suitability_note": note,
        "currency_symbol": currency_symbol
    }

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
        travel_date: str = "",
        selected_hotels: list = None,
        selected_restaurants: list = None,
        selected_attractions: list = None,
        companion_type: str = "Family"
    ) -> dict:
        try:
            budget = int(budget)
        except (ValueError, TypeError):
            budget = 20000

        num_people = max(1, int(num_people))
        per_person_budget = budget // num_people

        selected_hotels = selected_hotels or []
        selected_restaurants = selected_restaurants or []
        selected_attractions = selected_attractions or []

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

        def _get_selected_and_supplemented(all_items: list, selected_names: list, target_count: int) -> list:
            selected_names_norm = {str(name).strip().lower() for name in selected_names if name}
            
            selected_items = []
            for item in all_items:
                item_name = item.get("name", "").strip().lower()
                if item_name in selected_names_norm:
                    selected_items.append(item)
            
            supplemented = list(selected_items)
            seen_names = {item.get("name", "").strip().lower() for item in supplemented}
            for item in all_items:
                if len(supplemented) >= target_count:
                    break
                item_name = item.get("name", "").strip().lower()
                if item_name not in seen_names:
                    supplemented.append(item)
                    seen_names.add(item_name)
                    
            return supplemented

        hotels_list_full      = realtime_data.get("hotels", [])
        restaurants_list_full = realtime_data.get("restaurants", [])
        attractions_list_full = realtime_data.get("attractions", [])

        # Sort based on companion type to prioritize matching spots
        hotels_list_full = sort_places_by_companion(hotels_list_full, companion_type, "hotel")
        restaurants_list_full = sort_places_by_companion(restaurants_list_full, companion_type, "restaurant")
        attractions_list_full = sort_places_by_companion(attractions_list_full, companion_type, "attraction")

        hotels_list      = _get_selected_and_supplemented(hotels_list_full, selected_hotels, 5)
        restaurants_list = _get_selected_and_supplemented(restaurants_list_full, selected_restaurants, 5)
        attractions_list = _get_selected_and_supplemented(attractions_list_full, selected_attractions, 8)

        # Update in-place so return payload matches supplemented selection lists
        realtime_data["hotels"] = hotels_list
        realtime_data["restaurants"] = restaurants_list
        realtime_data["attractions"] = attractions_list

        hotels_context      = " | ".join(_place_summary(h) for h in hotels_list[:5])      or "Local hotels"
        restaurants_context = " | ".join(_place_summary(r) for r in restaurants_list[:5]) or "Local restaurants"
        attractions_context = " | ".join(_place_summary(a) for a in attractions_list[:8]) or "Local sights"

        interests_str = ", ".join(interests) if interests else "General Sightseeing"

        travel_context = f"Travel Date: {travel_date}" if travel_date else "Travel Date: Not specified."

        country_resolved = realtime_data.get("country", "")
        currency_symbol, currency_code = get_currency_info(country_resolved)

        average_daily_group_budget = budget // days
        average_daily_per_person_budget = per_person_budget // days

        prompt = f"""You are an expert travel planner. Create a HIGHLY SPECIFIC, DETAILED travel itinerary in JSON format.

Destination: {destination}
Duration: {days} days
Group Size: {num_people} {'person' if num_people == 1 else 'people'}
Travel Group Companion Type: {companion_type}
Total Group Budget: {currency_symbol}{budget} (approx. {currency_symbol}{per_person_budget} per person)
Average Daily Group Budget limit: {currency_symbol}{average_daily_group_budget} (approx. {currency_symbol}{average_daily_per_person_budget} per person per day)
{travel_context}
Interests: {interests_str}
User Preferences/Custom requests: {preferences}

Real-time local data (sourced from: {data_source_label}):
- Top Hotels: {hotels_context}
- Top Restaurants: {restaurants_context}
- Top Sights: {attractions_context}

Requirements:
1. morning/afternoon/evening: Detailed daily plan mentioning at least one of the real attractions, hotels, or restaurants listed above.
2. narration: A warm, friendly, highly descriptive and conversational voice-guided narration of the day's itinerary, written in the first-person ('We will...', 'I suggest...') as if a local tour guide is speaking directly to the traveler. 
   You MUST adapt the tone strictly to the Travel Group Companion Type ({companion_type}):
   - If Family: Warm, child-friendly, safe, structured, and family-oriented.
   - If Couple: Romantic, cozy, relaxing, and memorable, emphasizing scenic views and intimate dining.
   - If Friends: High energy, fun-filled, adventure-focused, highlighting group activities, social hubs, and optional nightlife.
   - If Solo: Self-reflective, flexible, adventurous, highlighting local tips and solo safety.
   Write at least 4-6 detailed sentences with vivid narration of how the day unfolds, the specific vibe of each place, and transitions between stops.
3. accommodation: Select a real hotel from the list above (or state a suitable default) and recommend it with price ranges appropriate for the budget tier.
4. food: Suggest breakfast, lunch, and dinner, incorporating the real restaurant names from above.
5. transport: Specify the best local transport modes for the daily route and list estimated costs.
6. entry_fees: List expected entry fees or state 'Free entry'.
7. cost_breakdown & budgeting: For each day, derive costs from the ACTUAL AVERAGE PRICES of the specific hotels, restaurants, and attractions you have chosen. For example, if you recommend 'Hotel Meridien Paris', look up its real average nightly rate (~{currency_symbol}200-400) and use that in the accommodation cost, not a made-up figure. Similarly use realistic average meal prices for the named restaurants and typical entry fees for the named sights. These figures MUST reflect real-world pricing knowledge. The total sum of daily "estimated_cost" across all {days} days must be ≤ the Total Group Budget of {currency_symbol}{budget}. If needed, swap to cheaper alternatives that fit the budget.
8. rainy_warning: Determine if the destination is in its rainy/monsoon season during the travel date month (set true/false).
9. alternate_dates: If rainy_warning is true, suggest the best alternative dry months.
10. best_time_to_visit: Recommend the best travel window if no date was specified.
11. spotlights: Estimate the actual real-world user rating (float, 1.0 to 5.0) and review count (integer) for each of the Top Hotels, Top Restaurants, and Top Sights listed above based on your knowledge base. Return these in the spotlights key schema.
12. minimum_budget_required: Based on the AVERAGE REAL PRICES of the specific curated places you have selected (hotel nightly rate × {days} nights + realistic meal costs + transport + entry fees for {num_people} people), calculate the realistic minimum total group budget (integer, in {currency_code}) required. This should reflect actual marketplace prices, not a generic formula.
13. budget_suitability_note: Explicitly state whether the user's budget of {currency_symbol}{budget} is SUFFICIENT or INSUFFICIENT to visit the curated places you have selected at their real average prices. If insufficient, state the recommended budget clearly (e.g. 'Your budget of {currency_symbol}{budget} is too low for these specific places. A recommended minimum is {currency_symbol}X for {days} days for {num_people} people.'). If sufficient, confirm it and mention any cost-saving tips.

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
      "estimated_cost": "{currency_symbol}4700",
      "place_price_notes": "Hotel X avg {currency_symbol}1500/night; Restaurant Y avg {currency_symbol}300/meal; Attraction Z entry {currency_symbol}100"
    }}
  ]
}}"""

        if not self.api_key:
            logger.warning("GROQ_API_KEY/LLM_API_KEY not found. Using local mock generator.")
            return self._generate_mock_itinerary(destination, days, budget, interests, realtime_data, num_people, travel_date, companion_type)

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

                # Safeguard: cap/adjust minimum budget dynamically to prevent false warnings for tight but viable low-budget trips
                economical_min = days * num_people * 500
                if budget >= economical_min and min_budget_req > budget:
                    min_budget_req = economical_min

                itinerary_list = parsed_data.get("itinerary", [])
                self._adjust_costs_to_budget(itinerary_list, budget, num_people, currency_symbol)

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
            return self._generate_mock_itinerary(destination, days, budget, interests, realtime_data, num_people, travel_date, companion_type)

    def _generate_mock_itinerary(
        self,
        destination: str,
        days: int,
        budget: int,
        interests: list,
        realtime_data: dict,
        num_people: int = 1,
        travel_date: str = "",
        companion_type: str = "Family"
    ) -> dict:
        logger.info(f"Generating simplified fallback mock itinerary for {destination} with type {companion_type}")
        
        country_resolved = realtime_data.get("country", "")
        currency_symbol, currency_code = get_currency_info(country_resolved)

        hotels = [h["name"] for h in realtime_data.get("hotels", [])]
        restaurants = [r["name"] for r in realtime_data.get("restaurants", [])]
        attractions = [a["name"] for a in realtime_data.get("attractions", [])]

        primary_hotel = hotels[0] if hotels else f"Comfort Inn {destination}"
        r1 = restaurants[0] if len(restaurants) > 0 else "Local Diner"
        r2 = restaurants[1] if len(restaurants) > 1 else "Heritage Kitchen"
        
        a1 = attractions[0] if len(attractions) > 0 else f"{destination} Market"
        a2 = attractions[1] if len(attractions) > 1 else f"{destination} Heritage Site"

        itinerary_list = []
        average_daily_budget = budget // max(1, days)
        
        # Adjust percentages based on companion type
        c_lower = companion_type.lower()
        if c_lower == "couple":
            p_hotel, p_food, p_activities = 0.50, 0.28, 0.12
        elif c_lower == "friends":
            p_hotel, p_food, p_activities = 0.35, 0.25, 0.25
        elif c_lower == "solo":
            p_hotel, p_food, p_activities = 0.48, 0.24, 0.16
        else: # family
            p_hotel, p_food, p_activities = 0.42, 0.26, 0.18
            
        daily_accommodation = int(average_daily_budget * p_hotel)
        daily_food = int(average_daily_budget * p_food)
        daily_activities = int(average_daily_budget * p_activities)
        daily_transport = average_daily_budget - (daily_accommodation + daily_food + daily_activities)
        
        per_person = average_daily_budget // max(1, num_people)

        for d in range(1, days + 1):
            if c_lower == "couple":
                narration = f"Welcome to Day {d} of your romantic getaway in {destination}! Wake up to a relaxed morning and head over to explore the beautiful and scenic {a1}, perfect for taking some memorable photos together. In the afternoon, take a hand-in-hand stroll through the picturesque grounds of {a2}, enjoying the quiet atmosphere. As the sun sets, look forward to an intimate, cozy dinner at {r2}, where you can savor local delicacies in a warm, romantic setting."
            elif c_lower == "family":
                narration = f"Welcome to Day {d} of your family holiday in {destination}! We start our day with an exciting, family-friendly visit to {a1}, which offers great activities and learning opportunities for all age groups. In the afternoon, we'll make our way to the safe and spacious open areas of {a2}, allowing the kids to explore while the adults relax. To wrap up the day, we'll enjoy a wholesome, comfortable dinner at {r2}, known for its welcoming family ambiance and diverse menu."
            elif c_lower == "friends":
                narration = f"Welcome to Day {d} of your epic group trip in {destination}! Gear up for a fun, energetic morning as we check out the vibrant sights of {a1}. Afterwards, we will head over to {a2} for some group photos and lighthearted exploring. When evening rolls around, the night is young—we'll head out to grab drinks and share high-energy laughs at {r2}, followed by exploring the best local nightlife and social hangouts in the area!"
            else: # solo
                narration = f"Welcome to Day {d} of your solo adventure in {destination}! Embrace the flexibility of solo travel this morning as you leisurely discover the local history at {a1} at your own pace. In the afternoon, wander through the historic corridors of {a2}, perfect for self-reflection and meeting fellow travelers. As the evening sets in, find a cozy corner at {r2} to journal, enjoy a local meal, and chat with the friendly staff about local secrets."

            itinerary_list.append({
                "day": d,
                "narration": narration,
                "morning": f"9:00 AM – Visit {a1} and explore the main highlights.",
                "afternoon": f"1:30 PM – Check out {a2} for a local sightseeing walk.",
                "evening": "6:00 PM – Enjoy a relaxing walk and sunset views.",
                "accommodation": f"Stay at {primary_hotel} — clean rooms and great service",
                "hotel_price": f"{currency_symbol}{daily_accommodation // num_people}/night per person" if num_people > 0 else f"{currency_symbol}{daily_accommodation}/night",
                "food": f"Breakfast at hotel; Lunch at {r1} (try local thali); Dinner at {r2}",
                "transport": "Auto-rickshaw rentals and walking",
                "entry_fees": [
                    {"place": a1, "fee": "Free entry"},
                    {"place": a2, "fee": f"{currency_symbol}50/person"}
                ],
                "cost_breakdown": {
                    "accommodation": daily_accommodation,
                    "food": daily_food,
                    "activities": daily_activities,
                    "transport": daily_transport,
                    "per_person": per_person
                },
                "estimated_cost": f"{currency_symbol}{average_daily_budget}"
            })

        # Calculate a realistic minimum budget using our helper
        est_needs = estimate_budget_needs(realtime_data, days, budget, num_people, companion_type)
        min_budget = est_needs["minimum_budget_required"]

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
            "budget_suitability_note": est_needs["budget_suitability_note"]
        }

    def _adjust_costs_to_budget(self, itinerary: list, total_budget: int, num_people: int, currency_symbol: str = "₹"):
        """
        Keep the LLM's own curated, place-specific cost estimates as-is.
        Only scale all days proportionally if the grand total exceeds the user's budget.
        Also ensure per_person is computed correctly in each day's cost_breakdown.
        """
        import re

        # Parse each day's estimated_cost to a number
        day_costs = []
        for day in itinerary:
            cost_str = str(day.get("estimated_cost", "0"))
            digits = re.sub(r'[^0-9]', '', cost_str)
            day_costs.append(int(digits) if digits else 0)

        total_parsed = sum(day_costs)
        if total_parsed <= 0:
            return

        # Only intervene if the LLM over-spent; keep curated values when within budget
        if total_parsed > total_budget:
            scale = total_budget / total_parsed
            running_sum = 0
            new_day_costs = []
            for i, val in enumerate(day_costs):
                if i == len(day_costs) - 1:
                    new_val = max(0, total_budget - running_sum)
                else:
                    new_val = int(val * scale)
                    running_sum += new_val
                new_day_costs.append(new_val)
        else:
            # LLM costs are within budget — keep them exactly as curated
            new_day_costs = day_costs

        # Apply (possibly scaled) costs back to each day, preserving category ratios
        for i, day in enumerate(itinerary):
            target = new_day_costs[i]
            cb = day.get("cost_breakdown") or {}

            categories = ["accommodation", "food", "activities", "transport"]
            cb_vals = [cb.get(cat, 0) for cat in categories]
            cb_sum = sum(cb_vals)

            if cb_sum > 0 and target != day_costs[i]:
                # Scale category breakdown proportionally to match scaled daily target
                cb_scale = target / cb_sum
                new_vals = []
                cb_running = 0
                for j, v in enumerate(cb_vals):
                    if j == len(cb_vals) - 1:
                        new_vals.append(max(0, target - cb_running))
                    else:
                        nv = int(v * cb_scale)
                        new_vals.append(nv)
                        cb_running += nv
                for j, cat in enumerate(categories):
                    cb[cat] = new_vals[j]
            elif cb_sum == 0:
                # No category data from LLM — derive a sensible split from the target
                cb["accommodation"] = int(target * 0.45)
                cb["food"]          = int(target * 0.25)
                cb["activities"]    = int(target * 0.15)
                cb["transport"]     = target - cb["accommodation"] - cb["food"] - cb["activities"]

            cb["per_person"] = target // max(1, num_people)
            day["cost_breakdown"] = cb
            day["estimated_cost"] = f"{currency_symbol}{target}"

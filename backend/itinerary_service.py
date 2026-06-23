import os
import json
import logging
import random
from realtime_service import RealtimeService

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class ItineraryService:
    def __init__(self):
        self.api_key = os.environ.get("GROK_API_KEY") or os.environ.get("LLM_API_KEY")
        self.base_url = os.environ.get("LLM_BASE_URL", "https://api.x.ai/v1")
        self.model = os.environ.get("LLM_MODEL", "grok-beta")
        self.realtime_service = RealtimeService()

    def generate_itinerary(self, destination: str, days: int, budget: int, interests: list) -> dict:
        try:
            budget = int(budget)
        except (ValueError, TypeError):
            budget = 20000

        realtime_data = self.realtime_service.get_realtime_data(destination)
        
        hotels_context = ", ".join([h["name"] for h in realtime_data["hotels"]]) or "Local hotels"
        restaurants_context = ", ".join([r["name"] for r in realtime_data["restaurants"]]) or "Local restaurants"
        attractions_context = ", ".join([a["name"] for a in realtime_data["attractions"]]) or "Local sights"

        interests_str = ", ".join(interests) if interests else "General Sightseeing"
        prompt = f"""You are an expert travel planner.

Create a detailed travel itinerary.

Destination: {destination}
Duration: {days} days
Budget: ₹{budget}
Interests: {interests_str}

Real-time local data:
- Recommended Hotels (Stay): {hotels_context}
- Recommended Local Restaurants: {restaurants_context}
- Recommended Attractions/Monuments: {attractions_context}

Requirements:
- Day-by-day itinerary
- Morning activities: Integrate the real attractions/monuments above where possible.
- Afternoon activities: Integrate the real attractions/monuments above where possible.
- Evening activities: Integrate the real attractions/monuments above where possible.
- Accommodation: Choose from the recommended hotels list above.
- Local foods to try: Suggest specific meals/dishes at the recommended restaurants list above.
- Estimated daily expenses
- Transportation suggestions
- Budget-friendly recommendations

Return clean structured JSON. The output MUST fit this schema:
{{
  "itinerary": [
    {{
      "day": 1,
      "morning": "Morning activities description, visiting [Real Attraction Name]",
      "afternoon": "Afternoon activities description, visiting [Real Attraction Name]",
      "evening": "Evening activities description, visiting [Real Attraction Name]",
      "accommodation": "Stay at [Real Hotel Name]",
      "food": "Lunch at [Real Restaurant Name] (try [local food]), dinner at [Another Real Restaurant Name] (try [local food])",
      "estimated_cost": "Estimated daily expense (e.g. ₹1500)"
    }}
  ]
}}"""

        if not self.api_key:
            logger.warning("GROK_API_KEY/LLM_API_KEY not found. Using local mock generator.")
            return self._generate_mock_itinerary(destination, days, budget, interests, realtime_data)

        try:
            headers = {
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json"
            }
            
            payload = {
                "model": self.model,
                "messages": [
                    {
                        "role": "system",
                        "content": "You are a professional travel planner. You must reply strictly with a JSON object containing an 'itinerary' key. Do not include any conversational filler, markdown formatting (like ```json), or explanation outside of the valid JSON structure."
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
            
            response = requests_post_with_timeout_if_needed(url, headers=headers, json_data=payload, timeout=30)
            
            if response.status_code == 200:
                result_json = response.json()
                content = result_json.get("choices", [{}])[0].get("message", {}).get("content", "").strip()
                
                if content.startswith("```"):
                    content = content.replace("```json", "").replace("```", "").strip()
                
                parsed_data = json.loads(content)
                if "itinerary" in parsed_data:
                    return {
                        "itinerary": parsed_data["itinerary"],
                        "realtime_data": realtime_data
                    }
                else:
                    itinerary_list = parsed_data if isinstance(parsed_data, list) else self._generate_mock_itinerary(destination, days, budget, interests, realtime_data).get("itinerary", [])
                    return {
                        "itinerary": itinerary_list,
                        "realtime_data": realtime_data
                    }
            else:
                logger.error(f"LLM API error ({response.status_code}): {response.text}")
                return self._generate_mock_itinerary(destination, days, budget, interests, realtime_data)

        except Exception as e:
            logger.error(f"Exception raised in itinerary generation: {e}")
            return self._generate_mock_itinerary(destination, days, budget, interests, realtime_data)

    def _generate_mock_itinerary(self, destination: str, days: int, budget: int, interests: list, realtime_data: dict) -> dict:
        logger.info(f"Generating high-quality mock travel itinerary for {destination}")
        
        activities = {
            "Adventure": {
                "morning": ["Trekking/hiking to a scenic viewpoint in {dest}", "Zip-lining or rock climbing session", "Early morning water sports or parasailing", "Kayaking through local backwaters"],
                "afternoon": ["Rafting adventure or exploring deep caves", "Off-road ATV driving experience", "Bicycle tour exploring hidden trails", "Visiting an adventure theme park"],
                "evening": ["Relaxing around a campfire with local music", "Stargazing at a high altitude clearing", "Visiting a sunset sunset viewpoint", "Unwinding at an adventure base camp"]
            },
            "Food": {
                "morning": ["Walking tour of local breakfast joints and street food stalls", "Visiting a bustling local spice plantation or fresh produce market", "Breakfast cooking class with a local chef", "Tasting traditional tea or coffee blends at a historic cafe"],
                "afternoon": ["Savoring a signature multi-course local lunch at a heritage restaurant", "Food tasting tour featuring hidden local delicacies", "Visiting a local dairy, bakery or chocolate-making workshop", "Enjoying fresh seafood lunch by the water"],
                "evening": ["Exploring a lively night food street or gourmet market", "Premium dinner featuring fusion recipes of {dest}", "Pub-hopping or checking out street-side culinary kiosks", "Sweets and dessert tasting tour around historic lanes"]
            },
            "Beaches": {
                "morning": ["Sunbathing and swimming at a pristine beach", "Early morning beach jog and shell collecting", "Scuba diving or snorkeling in shallow reefs", "Watching fishermen bring in their catch at the jetty"],
                "afternoon": ["Enjoying chilled drinks at a beachfront shack with sea breeze", "Taking a boat tour to spot dolphin sightings or nearby islands", "Beach volleyball or relaxing under a coconut palm", "Exploring coastal tide pools and rock structures"],
                "evening": ["Watching a magnificent beach sunset while sipping coconut water", "Walking along the shoreline during high tide", "Beachside seafood BBQ dinner with live acoustic music", "Attending a vibrant beach bonfire event"]
            },
            "History": {
                "morning": ["Guided historical tour of {dest}'s ancient fort or castle", "Visiting the National Museum and archaeological exhibition", "Exploring heritage monuments and century-old religious sites", "A walking tour focusing on colonial architecture"],
                "afternoon": ["Visiting a preservation site or old library with local archives", "Exploring ancient rock-cut caves or ruins", "Lunch at a converted heritage palace or historic estate", "Watching a documentary or theatrical historical play"],
                "evening": ["Spectacular sound and light show at the fort walls", "Sunset stroll around a historic square or plaza", "Shopping for local handicrafts and antique reproductions", "Fine dining at a venue showcasing classical folk arts"]
            },
            "Nature": {
                "morning": ["Bird-watching walk in a nearby national park or reserve", "Visiting a misty hill station viewpoint", "Watching the sunrise over a tranquil forest lake", "Trekking through lush green valleys and bamboo paths"],
                "afternoon": ["Exploring a scenic waterfall and dipping in natural pools", "Visiting a botanical garden or orchid sanctuary", "Picnic lunch surrounded by pine trees", "Eco-safari to spot local wildlife species"],
                "evening": ["Leisurely walk through tea/coffee estates", "Enjoying sunset at a nature photography point", "Boat ride in a quiet lake reflecting the sky", "Relaxing in natural hot water springs"]
            },
            "Nightlife": {
                "morning": ["Sleeping in after a late night, followed by brunch", "Relaxing spa day to recharge", "Strolling in quiet parks to clear the head", "Visiting an art gallery or calm bookstore"],
                "afternoon": ["Cafe hopping in the trendy hipster district", "Shopping for party outfits at modern malls", "Resting or playing indoor arcade games", "Attending a pool party or afternoon DJ lounge"],
                "evening": ["Bar crawling starting with a sunset lounge", "Experiencing a famous nightclub with live DJs", "Night shopping at a neon-lit bazaar", "Attending a live music concert or comedy club show"]
            }
        }

        default_activities = {
            "morning": ["City orientation tour and main square sightseeing", "Visiting the oldest local market", "Enjoying local specialty breakfast", "Taking photos at iconic structures"],
            "afternoon": ["Shopping for souvenirs in the main bazaar", "Visiting local art museum", "Relaxing lunch by a scenic lake", "Exploring local neighborhood lanes"],
            "evening": ["Enjoying a sunset boat cruise or walk", "Dinner at a popular rooftop restaurant", "Attending a local cultural dance program", "Walking under the city lights"]
        }

        active_interests = [i for i in interests if i in activities]
        if not active_interests:
            active_interests = ["Default"]

        itinerary_list = []
        daily_budget = int((budget * 0.85) / days) if days > 0 else 0
        
        rt_hotels = [h["name"] for h in realtime_data.get("hotels", [])]
        rt_restaurants = [r["name"] for r in realtime_data.get("restaurants", [])]
        rt_attractions = [a["name"] for a in realtime_data.get("attractions", [])]
        
        primary_hotel = rt_hotels[0] if rt_hotels else f"Grand {destination} Resort"
        
        for d in range(1, days + 1):
            interest_cat = random.choice(active_interests)
            
            if interest_cat == "Default":
                morning = random.choice(default_activities["morning"])
                afternoon = random.choice(default_activities["afternoon"])
                evening = random.choice(default_activities["evening"])
            else:
                morning = random.choice(activities[interest_cat]["morning"])
                afternoon = random.choice(activities[interest_cat]["afternoon"])
                evening = random.choice(activities[interest_cat]["evening"])
            
            if rt_attractions:
                m_attr = random.choice(rt_attractions)
                a_attr = random.choice(rt_attractions)
                e_attr = random.choice(rt_attractions)
                morning = morning.replace("{dest}", m_attr)
                afternoon = afternoon.replace("{dest}", a_attr)
                evening = evening.replace("{dest}", e_attr)
            else:
                morning = morning.replace("{dest}", destination)
                afternoon = afternoon.replace("{dest}", destination)
                evening = evening.replace("{dest}", destination)
            
            food_options = {
                "Food": ["Special local traditional thali", "Wood-fired artisanal sourdough pizzas with local toppings", "Authentic slow-cooked local curry and flatbreads", "Multi-course degustation of regional dishes"],
                "Beaches": ["Spicy grilled prawns or butter garlic crab", "Fresh coconut water and fish fry shacks", "Seafood platters and beachside mocktails", "Crispy fried squid and tropical fruit salad"],
                "Adventure": ["Hearty high-energy mountain porridge or local stews", "Quick local street rolls and fresh juice", "Nutrient-packed local grain bowl", "Grilled meats and fire-roasted vegetables"],
                "History": ["Royal traditional desserts and historic main-course recipes", "Tea-time savory snacks and heirloom sweets", "Authentic clay-pot rice dishes", "Slow-stewed lentil soups and old-style bakery breads"],
                "Nature": ["Organic farm-to-table green salad and herbal drinks", "Wild forest berry tarts and fresh local honey", "Steaming hot bowls of local noodle soup", "Fresh mountain spring herbal tea and homemade bread"],
                "Nightlife": ["Late-night gourmet burgers and craft appetizers", "Cocktail snacks, spicy wings, and finger food", "Post-club street-side kebabs or late-night dessert waffles", "Chilled craft beer pairing with loaded fries"],
                "Default": ["Signature regional curry and steamed rice", "Street food sample platter", "Traditional sweet pancake or dessert", "Locally baked pastries and coffee"]
            }
            
            food_cat = interest_cat if interest_cat in food_options else "Default"
            food_description = random.choice(food_options[food_cat])
            
            if rt_restaurants:
                r_name = random.choice(rt_restaurants)
                food = f"Dine at {r_name} and try: {food_description}"
            else:
                food = f"Dine at a popular local restaurant and try: {food_description}"

            variance = random.randint(-10, 10) / 100.0
            day_cost = round(daily_budget * (1.0 + variance))

            itinerary_list.append({
                "day": d,
                "morning": morning,
                "afternoon": afternoon,
                "evening": evening,
                "accommodation": f"Stay at {primary_hotel}",
                "food": food,
                "estimated_cost": f"₹{day_cost}"
            })

        return {
            "itinerary": itinerary_list,
            "realtime_data": realtime_data
        }

try:
    import requests
    def requests_post_with_timeout_if_needed(url, headers, json_data, timeout=30):
        return requests.post(url, headers=headers, json=json_data, timeout=timeout)
except ImportError:
    import urllib.request
    import urllib.parse
    import json
    
    class MockResponse:
        def __init__(self, data, status_code):
            self.data = data
            self.status_code = status_code
            self.text = json.dumps(data)
        def json(self):
            return self.data

    def requests_post_with_timeout_if_needed(url, headers, json_data, timeout=30):
        req = urllib.request.Request(url, data=json.dumps(json_data).encode("utf-8"))
        for k, v in headers.items():
            req.add_header(k, v)
        try:
            with urllib.request.urlopen(req, timeout=timeout) as response:
                return MockResponse(json.loads(response.read().decode()), response.status)
        except urllib.error.HTTPError as e:
            return MockResponse({"error": str(e)}, e.code)
        except Exception as e:
            raise e

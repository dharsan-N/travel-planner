"""Test Geoapify integration for the travel planner."""
# pyrefly: ignore [missing-import]
from dotenv import load_dotenv
load_dotenv(".env")

import os
from geoapify_service import GeoapifyService, GeoapifyGeocoder, GeoapifyPlacesClient

API_KEY = os.environ.get("GEOAPAFY_API_KEY", "")
print("Geoapify key set:", bool(API_KEY), "| Key:", API_KEY[:8] + "..." if API_KEY else "MISSING")

print("\n--- TEST 1: Geocoding ---")
geo = GeoapifyGeocoder(API_KEY)
lat, lon, display, country, tz = geo.geocode("Goa")
print("Result:", lat, lon)
print("Display:", display[:80])
print("Country:", country, "| Timezone:", tz)

print("\n--- TEST 2: Hotels ---")
places = GeoapifyPlacesClient(API_KEY)
hotels = places.get_hotels(lat, lon)
print("Hotels found:", len(hotels))
for h in hotels[:4]:
    print(f"  [{h['source']}] {h['name']}")
    print(f"         {h['address'][:70]}")
    if h.get("website"): print(f"         web: {h['website'][:50]}")
    if h.get("hours"):   print(f"         hrs: {h['hours'][:50]}")

print("\n--- TEST 3: Restaurants ---")
restaurants = places.get_restaurants(lat, lon)
print("Restaurants found:", len(restaurants))
for r in restaurants[:4]:
    print(f"  [{r['source']}] {r['name']} | {r['category']}")
    print(f"         {r['address'][:70]}")

print("\n--- TEST 4: Attractions ---")
attractions = places.get_attractions(lat, lon)
print("Attractions found:", len(attractions))
for a in attractions[:5]:
    print(f"  [{a['source']}] {a['name']} | {a['category']}")
    print(f"         {a['address'][:70]}")

print("\n--- TEST 5: Full RealDataService pipeline ---")
svc  = GeoapifyService()
data = svc.get_all_data("Goa")
if data:
    print("SUCCESS!")
    print("Sources:", data["data_sources"])
    print("Country:", data.get("country"), "| TZ:", data.get("timezone"))
    print("Hotels:", [h["name"] for h in data["hotels"][:3]])
    print("Restaurants:", [r["name"] for r in data["restaurants"][:3]])
    print("Attractions:", [a["name"] for a in data["attractions"][:3]])
else:
    print("FAILED — no data returned")

print("\nAll tests complete.")

import os
import json
import urllib.request
import urllib.parse
import logging

logger = logging.getLogger(__name__)

API_KEY = os.environ.get("GOOGLE_PLACES_API_KEY", "")
CACHE_FILE = os.path.join(os.path.dirname(__file__), "google_places_cache.json")

# In-memory cache loaded from file
_cache = {}

def _load_cache():
    global _cache
    if os.path.exists(CACHE_FILE):
        try:
            with open(CACHE_FILE, "r", encoding="utf-8") as f:
                _cache = json.load(f)
            logger.info(f"[GooglePlaces] Loaded {len(_cache)} entries from cache.")
        except Exception as e:
            logger.error(f"[GooglePlaces] Failed to load cache file: {e}")
            _cache = {}
    else:
        _cache = {}

def _save_cache():
    try:
        with open(CACHE_FILE, "w", encoding="utf-8") as f:
            json.dump(_cache, f, indent=2, ensure_ascii=False)
    except Exception as e:
        logger.error(f"[GooglePlaces] Failed to save cache file: {e}")

# Initial load
_load_cache()

def get_google_place_details(place_name: str, destination: str) -> dict | None:
    """
    Search for a place in the target destination via Google Places API (New).
    Returns a dict with rating, reviews, and image_url, or None if not found/failed.
    Uses a local JSON cache to minimize API usage.
    """
    if not place_name:
        return None

    query_str = f"{place_name.strip()} {destination.strip()}".lower().strip()
    
    # 1. Check in-memory cache
    if query_str in _cache:
        logger.info(f"[GooglePlaces] Cache hit for '{query_str}'")
        return _cache[query_str]

    logger.info(f"[GooglePlaces] Cache miss. Querying Places API (New) for '{query_str}'...")

    # 2. Query Google Places API (New)
    url = "https://places.googleapis.com/v1/places:searchText"
    payload = {
        "textQuery": f"{place_name} {destination}".strip()
    }
    
    try:
        req = urllib.request.Request(
            url,
            data=json.dumps(payload).encode("utf-8"),
            headers={
                "Content-Type": "application/json",
                "X-Goog-Api-Key": API_KEY,
                "X-Goog-FieldMask": "places.displayName,places.rating,places.userRatingCount,places.photos,places.name",
                "Accept": "application/json",
                "User-Agent": "RoamAITravelPlanner/3.0"
            },
            method="POST"
        )
        with urllib.request.urlopen(req, timeout=12) as resp:
            data = json.loads(resp.read().decode("utf-8"))

        places = data.get("places", [])
        if not places:
            logger.info(f"[GooglePlaces] No results found in Places API (New) for '{query_str}'")
            _cache[query_str] = None
            _save_cache()
            return None

        # Take the top match
        result = places[0]
        rating = result.get("rating")
        reviews = result.get("userRatingCount", 0)
        
        # Resolve photo
        photo_url = None
        photos = result.get("photos", [])
        if photos and len(photos) > 0:
            photo_name = photos[0].get("name") # e.g. "places/ChIJ.../photos/Aap..."
            if photo_name:
                photo_url = (
                    f"https://places.googleapis.com/v1/{photo_name}/media"
                    f"?key={API_KEY}&maxWidthPx=400"
                )

        details = {
            "rating": float(rating) if rating is not None else None,
            "reviews": int(reviews),
            "image_url": photo_url
        }

        # Cache successful lookup
        _cache[query_str] = details
        _save_cache()
        logger.info(f"[GooglePlaces] Successfully resolved and cached via Places API (New) for '{query_str}'")
        return details

    except Exception as e:
        logger.error(f"[GooglePlaces] Error resolving details for '{query_str}': {e}")
        return None

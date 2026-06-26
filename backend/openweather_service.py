import os
import logging
import requests

# Configure logger
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class OpenWeatherService:
    def __init__(self):
        # Fetch the OpenWeatherMap API key from environment variables
        self.api_key = os.environ.get("OPENWEATHERMAP_API_KEY")
        self.base_url = "https://api.openweathermap.org/data/2.5/weather"

    def get_weather(self, destination: str) -> dict:
        """
        Fetches current weather for the given destination using OpenWeatherMap API.
        If the API key is not present or an error occurs, it returns None.
        """
        if not self.api_key:
            logger.warning("OPENWEATHERMAP_API_KEY environment variable is not set. Weather widget will be hidden.")
            return None

        try:
            params = {
                "q": destination,
                "appid": self.api_key,
                "units": "metric"  # Get temperature in Celsius
            }
            logger.info(f"Fetching real-time weather from OpenWeatherMap for destination: {destination}")
            
            response = requests.get(self.base_url, params=params, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                temp = data.get("main", {}).get("temp")
                condition = data.get("weather", [{}])[0].get("main", "Clear")
                
                # Format temperature as standard string, e.g. "28°C"
                temp_str = f"{round(temp)}°C" if temp is not None else "N/A"
                
                return {
                    "temperature": temp_str,
                    "condition": condition.title()
                }
            else:
                logger.error(f"OpenWeatherMap API returned status code {response.status_code}: {response.text}.")
                return None

        except Exception as e:
            logger.error(f"Error fetching weather from OpenWeatherMap: {e}.")
            return None

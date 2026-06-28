let currentInputs = null;
let itineraryData = null;  // Keep the itinerary payload in memory
let activeCountry = '';

// TripAdvisor-like high-quality rotating travel image arrays
const HOTEL_IMGS = [
    "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=300&h=200&q=80",
    "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=300&h=200&q=80",
    "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=300&h=200&q=80",
    "https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=300&h=200&q=80",
    "https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=300&h=200&q=80"
];
const RESTAURANT_IMGS = [
    "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=300&h=200&q=80",
    "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=300&h=200&q=80",
    "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=300&h=200&q=80",
    "https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=300&h=200&q=80",
    "https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=300&h=200&q=80"
];
const ATTRACTION_IMGS = [
    "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=300&h=200&q=80",
    "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=300&h=200&q=80",
    "https://images.unsplash.com/photo-1454496522488-7a8e488e8606?auto=format&fit=crop&w=300&h=200&q=80",
    "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=300&h=200&q=80",
    "https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=300&h=200&q=80"
];

// Helper to resolve localized currency symbols
function getCurrencySymbol(country) {
    if (!country) return '₹';
    const c = country.toLowerCase().trim();
    if (c.includes('india') || c === 'in') return '₹';
    if (c.includes('france') || c.includes('germany') || c.includes('italy') || c.includes('spain') || c.includes('austria') || c.includes('netherlands') || c.includes('europe') || c.includes('ireland') || c.includes('belgium') || c.includes('greece') || c.includes('portugal') || c.includes('finland') || c.includes('switzerland') || c.includes('sweden') || c.includes('norway') || c.includes('denmark')) {
        if (c.includes('switzerland')) return 'CHF';
        if (c.includes('sweden') || c.includes('norway') || c.includes('denmark')) return 'kr';
        return '€';
    }
    if (c.includes('united kingdom') || c.includes('uk') || c.includes('london') || c.includes('great britain') || c.includes('england') || c.includes('scotland') || c.includes('wales')) return '£';
    if (c.includes('japan') || c === 'jp') return '¥';
    if (c.includes('united states') || c.includes('usa') || c === 'us' || c.includes('america') || c.includes('canada') || c.includes('australia') || c.includes('singapore') || c.includes('new zealand') || c.includes('hong kong')) return '$';
    return '₹';
}

function getCurrencyCode(country) {
    if (!country) return 'INR';
    const c = country.toLowerCase().trim();
    if (c.includes('india') || c === 'in') return 'INR';
    if (c.includes('france') || c.includes('germany') || c.includes('italy') || c.includes('spain') || c.includes('austria') || c.includes('netherlands') || c.includes('europe') || c.includes('ireland') || c.includes('belgium') || c.includes('greece') || c.includes('portugal') || c.includes('finland') || c.includes('switzerland') || c.includes('sweden') || c.includes('norway') || c.includes('denmark')) {
        if (c.includes('switzerland')) return 'CHF';
        if (c.includes('sweden')) return 'SEK';
        if (c.includes('norway')) return 'NOK';
        if (c.includes('denmark')) return 'DKK';
        return 'EUR';
    }
    if (c.includes('united kingdom') || c.includes('uk') || c.includes('london') || c.includes('great britain') || c.includes('england') || c.includes('scotland') || c.includes('wales')) return 'GBP';
    if (c.includes('japan') || c === 'jp') return 'JPY';
    if (c.includes('united states') || c.includes('usa') || c === 'us' || c.includes('america') || c.includes('canada') || c.includes('australia') || c.includes('singapore') || c.includes('new zealand') || c.includes('hong kong')) return 'USD';
    return 'INR';
}

function getCurrencyIconClass(country) {
    if (!country) return 'fa-solid fa-indian-rupee-sign';
    const c = country.toLowerCase().trim();
    if (c.includes('india') || c === 'in') return 'fa-solid fa-indian-rupee-sign';
    if (c.includes('france') || c.includes('germany') || c.includes('italy') || c.includes('spain') || c.includes('austria') || c.includes('netherlands') || c.includes('europe') || c.includes('ireland') || c.includes('belgium') || c.includes('greece') || c.includes('portugal') || c.includes('finland') || c.includes('switzerland') || c.includes('sweden') || c.includes('norway') || c.includes('denmark')) {
        if (c.includes('switzerland')) return 'fa-solid fa-money-bill-1-wave';
        if (c.includes('sweden') || c.includes('norway') || c.includes('denmark')) return 'fa-solid fa-money-bill-1-wave';
        return 'fa-solid fa-euro-sign';
    }
    if (c.includes('united kingdom') || c.includes('uk') || c.includes('london') || c.includes('great britain') || c.includes('england') || c.includes('scotland') || c.includes('wales')) return 'fa-solid fa-sterling-sign';
    if (c.includes('japan') || c === 'jp') return 'fa-solid fa-yen-sign';
    if (c.includes('united states') || c.includes('usa') || c === 'us' || c.includes('america') || c.includes('canada') || c.includes('australia') || c.includes('singapore') || c.includes('new zealand') || c.includes('hong kong')) return 'fa-solid fa-dollar-sign';
    return 'fa-solid fa-indian-rupee-sign';
}

function updateFormCurrencyLabels(country) {
    const symbol = getCurrencySymbol(country);
    const code = getCurrencyCode(country);
    const iconClass = getCurrencyIconClass(country);
    
    const codeSpan = document.getElementById('budget-currency-code');
    const iconEl = document.getElementById('budget-currency-icon');
    if (codeSpan) codeSpan.textContent = code;
    if (iconEl) iconEl.className = iconClass;
}

// ── Smart currency detection from destination text ─────────────────────────
const DESTINATION_CURRENCY_MAP = [
    // India
    { keywords: ['india','goa','mumbai','delhi','bangalore','chennai','kolkata','hyderabad','jaipur','agra','kerala','rajasthan','varanasi','mysuru','pune','ahmedabad'], country: 'India' },
    // UK
    { keywords: ['uk','united kingdom','london','england','scotland','wales','edinburgh','manchester','birmingham','liverpool'], country: 'United Kingdom' },
    // USA
    { keywords: ['usa','united states','america','new york','los angeles','chicago','miami','san francisco','las vegas','boston','seattle','washington dc'], country: 'United States' },
    // France
    { keywords: ['france','paris','nice','lyon','bordeaux','marseille'], country: 'France' },
    // Germany
    { keywords: ['germany','berlin','munich','frankfurt','hamburg','cologne'], country: 'Germany' },
    // Italy
    { keywords: ['italy','rome','milan','venice','florence','naples'], country: 'Italy' },
    // Spain
    { keywords: ['spain','madrid','barcelona','seville','granada','valencia'], country: 'Spain' },
    // Japan
    { keywords: ['japan','tokyo','kyoto','osaka','hiroshima','nara'], country: 'Japan' },
    // Australia
    { keywords: ['australia','sydney','melbourne','brisbane','perth','cairns'], country: 'Australia' },
    // Canada
    { keywords: ['canada','toronto','vancouver','montreal','calgary','ottawa'], country: 'Canada' },
    // Switzerland
    { keywords: ['switzerland','zurich','geneva','bern','lausanne'], country: 'Switzerland' },
    // Netherlands
    { keywords: ['netherlands','amsterdam','rotterdam','the hague'], country: 'Netherlands' },
    // Greece
    { keywords: ['greece','athens','santorini','mykonos','thessaloniki'], country: 'Greece' },
    // Portugal
    { keywords: ['portugal','lisbon','porto','algarve','faro'], country: 'Portugal' },
    // Norway
    { keywords: ['norway','oslo','bergen','stavanger','tromsø'], country: 'Norway' },
    // Sweden
    { keywords: ['sweden','stockholm','gothenburg','malmo'], country: 'Sweden' },
    // Denmark
    { keywords: ['denmark','copenhagen','aarhus'], country: 'Denmark' },
    // Singapore
    { keywords: ['singapore'], country: 'Singapore' },
    // New Zealand
    { keywords: ['new zealand','auckland','wellington','christchurch'], country: 'New Zealand' },
    // Hong Kong
    { keywords: ['hong kong'], country: 'Hong Kong' },
];

function detectCountryFromDestination(text) {
    const lower = text.toLowerCase();
    for (const entry of DESTINATION_CURRENCY_MAP) {
        if (entry.keywords.some(k => lower.includes(k))) {
            return entry.country;
        }
    }
    return null;
}

function showCurrencyHint(country) {
    const symbol = getCurrencySymbol(country);
    const code   = getCurrencyCode(country);
    const existing = document.getElementById('currency-hint-pill');
    if (existing) existing.remove();

    const pill = document.createElement('div');
    pill.id = 'currency-hint-pill';
    pill.className = 'currency-hint-pill';
    pill.innerHTML = `<i class="fa-solid fa-coins"></i> Detected currency: <strong>${symbol} ${code}</strong> — budget updated!`;
    const budgetGroup = document.querySelector('#budget')?.closest('.form-group');
    if (budgetGroup) {
        budgetGroup.appendChild(pill);
        setTimeout(() => pill.classList.add('visible'), 10);
        setTimeout(() => { pill.classList.remove('visible'); setTimeout(() => pill.remove(), 400); }, 4000);
    }
}

function triggerPlaneTakeoff() {
    const orbitRing = document.getElementById('orbit-ring');
    const planeDot  = document.getElementById('plane-dot');
    const planeIcon = document.getElementById('loader-plane-icon');
    if (!orbitRing || !planeDot) return;
    // Stop orbiting, freeze plane at top, then fly off
    orbitRing.style.animationPlayState = 'paused';
    if (planeIcon) planeIcon.classList.add('plane-takeoff');
}

// Flow state transitions
function showLanding() {
    document.getElementById('landing-section').classList.remove('hidden');
    document.getElementById('form-section').classList.add('hidden');
    document.getElementById('results-section').classList.add('hidden');
    document.getElementById('loader-section').classList.add('hidden');
}

function showInputForm() {
    document.getElementById('landing-section').classList.add('hidden');
    document.getElementById('form-section').classList.remove('hidden');
    document.getElementById('results-section').classList.add('hidden');
    document.getElementById('loader-section').classList.add('hidden');
    document.getElementById('form-section').scrollIntoView({ behavior: 'smooth' });
}

const getApiUrl = (endpoint = 'generate-itinerary') => {
    if (window.location.origin && window.location.origin.startsWith('http')) {
        return '/' + endpoint;
    }
    return 'http://127.0.0.1:5000/' + endpoint;
};

document.addEventListener('DOMContentLoaded', () => {
    
    const destInput = document.getElementById('destination');
    if (destInput) {
        let currencyDebounce = null;
        destInput.addEventListener('input', () => {
            activeCountry = '';
            updateFormCurrencyLabels('');
            clearTimeout(currencyDebounce);
            currencyDebounce = setTimeout(() => {
                const val = destInput.value.trim();
                if (val.length < 3) return;
                const detected = detectCountryFromDestination(val);
                if (detected) {
                    activeCountry = detected;
                    updateFormCurrencyLabels(detected);
                    showCurrencyHint(detected);
                }
            }, 500);
        });
    }

    // Restore state if returning from itinerary page
    if (localStorage.getItem('restoreState') === 'true') {
        localStorage.removeItem('restoreState');
        const savedInputs = localStorage.getItem('currentInputs');
        const savedSpotlights = localStorage.getItem('spotlightsData');
        if (savedInputs && savedSpotlights) {
            currentInputs = JSON.parse(savedInputs);
            const spotlightsData = JSON.parse(savedSpotlights);
            
            // Pre-populate form fields
            document.getElementById('destination').value = currentInputs.destination;
            document.getElementById('days').value = currentInputs.days;
            document.getElementById('budget').value = currentInputs.budget;
            document.getElementById('num_people').value = currentInputs.num_people;
            if (document.getElementById('preferences')) {
                document.getElementById('preferences').value = currentInputs.preferences;
            }
            if (document.getElementById('travel_date')) {
                document.getElementById('travel_date').value = currentInputs.travel_date;
            }
            if (document.getElementById('companion_type')) {
                document.getElementById('companion_type').value = currentInputs.companion_type || "Family";
            }
            
            // Check correct checkboxes for interests
            const interests = currentInputs.interests || [];
            document.querySelectorAll('input[name="interests"]').forEach(cb => {
                cb.checked = interests.includes(cb.value);
            });
            
            // Restore spotlights view
            renderSpotlightsOnly(spotlightsData, currentInputs.budget, currentInputs.num_people);
            document.getElementById('form-section').classList.add('hidden');
            document.getElementById('results-section').classList.remove('hidden');
            
            // Restore checked highlights
            const selHotels = currentInputs.selected_hotels || [];
            const selRest = currentInputs.selected_restaurants || [];
            const selAttr = currentInputs.selected_attractions || [];
            
            document.querySelectorAll('.spotlight-checkbox').forEach(cb => {
                const type = cb.getAttribute('data-type');
                const name = cb.getAttribute('data-name');
                if (type === 'hotel' && selHotels.includes(name)) cb.checked = true;
                else if (type === 'restaurant' && selRest.includes(name)) cb.checked = true;
                else if (type === 'attraction' && selAttr.includes(name)) cb.checked = true;
                
                // Highlight parent card
                const itemCard = cb.closest('.spotlight-item');
                if (itemCard && cb.checked) {
                    itemCard.classList.add('selected');
                }
            });

            document.getElementById('results-section').scrollIntoView({ behavior: 'smooth' });
        } else {
            showLanding();
        }
    } else {
        showLanding(); // Boot into introduction screen
    }

    // Highlight selected cards on checkbox change
    document.addEventListener('change', (e) => {
        if (e.target && e.target.classList.contains('spotlight-checkbox')) {
            const itemCard = e.target.closest('.spotlight-item');
            if (itemCard) {
                if (e.target.checked) {
                    itemCard.classList.add('selected');
                } else {
                    itemCard.classList.remove('selected');
                }
            }
        }
    });
});

// ── Form submit ──────────────────────────────────────────────────────────────
async function handleFormSubmit() {
    const destinationInput  = document.getElementById('destination');
    const daysInput         = document.getElementById('days');
    const budgetInput       = document.getElementById('budget');
    const preferencesInput  = document.getElementById('preferences');
    const numPeopleInput    = document.getElementById('num_people');
    const travelDateInput   = document.getElementById('travel_date');
    const companionTypeInput = document.getElementById('companion_type');

    const interestCheckboxes = document.querySelectorAll('input[name="interests"]:checked');
    const interests = Array.from(interestCheckboxes).map(cb => cb.value);

    const destination  = destinationInput.value.trim();
    const days         = parseInt(daysInput.value);
    const budget       = parseInt(budgetInput.value);
    const preferences  = preferencesInput ? preferencesInput.value.trim() : "";
    const num_people   = parseInt(numPeopleInput ? numPeopleInput.value : 1) || 1;
    const travel_date  = travelDateInput ? travelDateInput.value.trim() : "";
    const companion_type = companionTypeInput ? companionTypeInput.value : "Family";

    currentInputs = { 
        destination, 
        days, 
        budget, 
        interests, 
        preferences, 
        num_people, 
        travel_date,
        companion_type,
        selected_hotels: [],
        selected_restaurants: [],
        selected_attractions: []
    };
    await fetchSpotlights(currentInputs);
}

// ── Fetch Spotlights ─────────────────────────────────────────────────────────
async function fetchSpotlights(inputs) {
    const formSection    = document.getElementById('form-section');
    const loaderSection  = document.getElementById('loader-section');
    const resultsSection = document.getElementById('results-section');

    formSection.classList.add('hidden');
    resultsSection.classList.add('hidden');
    loaderSection.classList.remove('hidden');

    const loaderStatus = document.getElementById('loader-status');
    const loaderSub = document.querySelector('.loader-sub');
    if (loaderStatus) loaderStatus.textContent = "Scanning Location Spotlights...";
    if (loaderSub) loaderSub.textContent = "Retrieving local hotels, dining, and attractions...";

    try {
        const response = await fetch(getApiUrl('get-spotlights'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                destination: inputs.destination,
                days: inputs.days,
                budget: inputs.budget,
                num_people: inputs.num_people,
                companion_type: inputs.companion_type,
                interests: inputs.interests
            })
        });

        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(errData.error || `HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        localStorage.setItem('spotlightsData', JSON.stringify(data));

        // Trigger plane takeoff before revealing results
        triggerPlaneTakeoff();
        await new Promise(r => setTimeout(r, 700)); // brief wait for takeoff anim

        loaderSection.classList.add('hidden');
        renderSpotlightsOnly(data, inputs.budget, inputs.num_people);
        resultsSection.classList.remove('hidden');
        resultsSection.scrollIntoView({ behavior: 'smooth' });

    } catch (error) {
        loaderSection.classList.add('hidden');
        formSection.classList.remove('hidden');
        console.error("Spotlights Fetch Failed:", error);
        alert(`Failed to fetch local spotlights: ${error.message}. Please make sure the backend Flask server is running.`);
    }
}

// ── Fetch itinerary ──────────────────────────────────────────────────────────
async function fetchItinerary(inputs) {
    const formSection    = document.getElementById('form-section');
    const loaderSection  = document.getElementById('loader-section');
    const resultsSection = document.getElementById('results-section');

    formSection.classList.add('hidden');
    resultsSection.classList.add('hidden');
    loaderSection.classList.remove('hidden');

    const loaderStatus = document.getElementById('loader-status');
    if (loaderStatus) loaderStatus.textContent = "Consulting Travel AI...";

    const loadingMessages = [
        "Analyzing your selected highlights...",
        "Searching local culinary hotspots...",
        "Structuring day-by-day routes...",
        "Calculating group budget splits...",
        "Assembling budget-friendly options...",
        "Finalizing custom travel itinerary..."
    ];
    let msgIndex = 0;
    const loaderSub = document.querySelector('.loader-sub');
    if (loaderSub) loaderSub.textContent = loadingMessages[0];
    
    const messageInterval = setInterval(() => {
        msgIndex = (msgIndex + 1) % loadingMessages.length;
        if (loaderSub) {
            loaderSub.style.opacity = 0;
            setTimeout(() => {
                loaderSub.textContent = loadingMessages[msgIndex];
                loaderSub.style.opacity = 1;
            }, 300);
        }
    }, 2500);

    try {
        const response = await fetch(getApiUrl('generate-itinerary'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(inputs)
        });

        clearInterval(messageInterval);

        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(errData.error || `HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        localStorage.setItem('itineraryData', JSON.stringify(data));

        loaderSection.classList.add('hidden');
        window.location.href = 'itinerary.html';

    } catch (error) {
        clearInterval(messageInterval);
        loaderSection.classList.add('hidden');
        resultsSection.classList.remove('hidden');
        console.error("API Call Failed:", error);
        alert(`Failed to generate itinerary: ${error.message}. Please try again.`);
    }
}

// ── Fetch destination cover image from Wikipedia ──────────────────────────
async function fetchDestinationImage(destination) {
    const bgImageEl = document.getElementById('banner-bg-image');
    if (!bgImageEl) return;

    bgImageEl.style.backgroundImage = 'none';

    try {
        const cleanDest = destination.trim().split(',')[0];
        const url = `https://en.wikipedia.org/w/api.php?action=query&prop=pageimages&format=json&piprop=thumbnail&pithumbsize=1000&titles=${encodeURIComponent(cleanDest)}&redirects=1&origin=*`;
        
        const response = await fetch(url);
        if (!response.ok) return;

        const data = await response.json();
        const pages = data.query?.pages;
        if (!pages) return;

        const pageId = Object.keys(pages)[0];
        const source = pages[pageId]?.thumbnail?.source;

        if (source) {
            bgImageEl.style.backgroundImage = `url('${source}')`;
        }
    } catch (err) {
        console.error("Failed to fetch destination image from Wikipedia:", err);
    }
}

// ── Fetch destination gallery images from Wikipedia ───────────────────────
async function fetchDestinationGallery(destination) {
    const galleryEl = document.getElementById('destination-gallery');
    if (!galleryEl) return;
    galleryEl.innerHTML = '';
    galleryEl.classList.add('hidden');

    try {
        const cleanDest = destination.trim().split(',')[0];
        // Query Wikipedia search for related pages to get multiple pageimages
        const url = `https://en.wikipedia.org/w/api.php?action=query&prop=pageimages&format=json&piprop=thumbnail&pithumbsize=600&pilimit=4&generator=search&gsrsearch=${encodeURIComponent(cleanDest)}&gsrlimit=4&origin=*`;
        
        const response = await fetch(url);
        if (!response.ok) throw new Error("API call failed");

        const data = await response.json();
        const pages = data.query?.pages;
        if (!pages) throw new Error("No pages found");

        const imgs = [];
        for (const id in pages) {
            const src = pages[id]?.thumbnail?.source;
            if (src) imgs.push(src);
        }

        if (imgs.length >= 2) {
            galleryEl.innerHTML = imgs.slice(0, 3).map(src => `
                <img src="${src}" class="destination-gallery-img" alt="${destination}">
            `).join('');
            galleryEl.classList.remove('hidden');
        } else {
            // Fallback gallery images if wikipedia search fails
            const fallbacks = [
                "https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=600&h=400&q=80",
                "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&h=400&q=80",
                "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=600&h=400&q=80"
            ];
            galleryEl.innerHTML = fallbacks.map(src => `
                <img src="${src}" class="destination-gallery-img" alt="Travel Spot">
            `).join('');
            galleryEl.classList.remove('hidden');
        }
    } catch (err) {
        console.error("Failed to load gallery:", err);
        // Fallback gallery images if search fails completely
        const fallbacks = [
            "https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=600&h=400&q=80",
            "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&h=400&q=80",
            "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=600&h=400&q=80"
        ];
        galleryEl.innerHTML = fallbacks.map(src => `
            <img src="${src}" class="destination-gallery-img" alt="Travel Spot">
        `).join('');
        galleryEl.classList.remove('hidden');
    }
}

// ── Render results ───────────────────────────────────────────────────────────
function renderResults(data, userBudget, numPeople) {
    numPeople = numPeople || data.num_people || 1;
    
    // Store itinerary data in memory
    itineraryData = data;
    activeCountry = data.country || (data.realtime_data ? data.realtime_data.country : '');
    updateFormCurrencyLabels(activeCountry);

    document.getElementById('result-destination-title').textContent = data.destination;
    fetchDestinationImage(data.destination);

    // ── Weather ──
    const tempElement  = document.getElementById('result-temperature');
    const condElement  = document.getElementById('result-condition');
    const weatherIcon  = document.getElementById('weather-icon');
    const weatherCard  = document.getElementById('weather-card');
    
    if (weatherCard && data.weather) {
        const temp         = data.weather.temperature || "N/A";
        const condition    = data.weather.condition   || "Unknown";
        tempElement.textContent = temp;
        condElement.textContent = condition;

        const condLower = condition.toLowerCase();
        weatherIcon.className = "fa-solid";
        if      (condLower.includes("sun")   || condLower.includes("clear") || condLower.includes("hot"))    weatherIcon.classList.add("fa-sun");
        else if (condLower.includes("rain")  || condLower.includes("drizzle") || condLower.includes("shower")) weatherIcon.classList.add("fa-cloud-showers-heavy");
        else if (condLower.includes("thunder")|| condLower.includes("storm"))                                  weatherIcon.classList.add("fa-cloud-bolt");
        else if (condLower.includes("snow")  || condLower.includes("freeze"))                                  weatherIcon.classList.add("fa-snowflake");
        else if (condLower.includes("wind")  || condLower.includes("breeze"))                                  weatherIcon.classList.add("fa-wind");
        else if (condLower.includes("cloud") || condLower.includes("overcast") || condLower.includes("haze") || condLower.includes("mist") || condLower.includes("fog")) weatherIcon.classList.add("fa-cloud");
        else weatherIcon.classList.add("fa-cloud-sun");
        
        weatherCard.classList.remove('hidden');
    } else if (weatherCard) {
        weatherCard.classList.add('hidden');
    }

    // ── Budget overview ──
    const symbol = getCurrencySymbol(activeCountry);
    const locale = (symbol === '₹') ? 'en-IN' : 'en-US';

    document.getElementById('result-total-budget').textContent =
        `${symbol}${userBudget.toLocaleString(locale)}`;

    const minRecommended = data.minimum_budget_required || 0;
    const minRecEl = document.getElementById('result-min-recommended-budget');
    if (minRecEl) {
        minRecEl.textContent = minRecommended > 0 
            ? `${symbol}${minRecommended.toLocaleString(locale)}`
            : 'N/A';
    }

    let totalEst = 0;
    if (data.itinerary && Array.isArray(data.itinerary)) {
        data.itinerary.forEach(day => {
            const costVal = parseInt(String(day.estimated_cost).replace(/[^0-9]/g, ''));
            if (!isNaN(costVal)) totalEst += costVal;
        });
    }
    document.getElementById('result-estimated-budget').textContent =
        `${symbol}${totalEst.toLocaleString(locale)}`;

    const perPersonTotal = numPeople > 0 ? Math.round(totalEst / numPeople) : totalEst;
    document.getElementById('result-per-person').textContent =
        `${symbol}${perPersonTotal.toLocaleString(locale)}`;

    document.getElementById('result-travellers').innerHTML =
        `<i class="fa-solid fa-users"></i> ${numPeople}`;

    const companionTypeEl = document.getElementById('result-companion-type');
    if (companionTypeEl) {
        companionTypeEl.textContent = (currentInputs && currentInputs.companion_type) || "Family";
    }

    // Travel date badge
    const travelDateItem = document.getElementById('result-travel-date-item');
    const travelDateEl   = document.getElementById('result-travel-date');
    if (data.travel_date) {
        travelDateEl.textContent = formatMonthLabel(data.travel_date);
        travelDateItem.style.display = '';
    } else {
        travelDateItem.style.display = 'none';
    }

    // ── Best time to visit callout ──
    const bestTimeCard = document.getElementById('best-time-card');
    const bestTimeText = document.getElementById('best-time-text');
    if (data.best_time_to_visit && !data.travel_date) {
        bestTimeText.textContent = data.best_time_to_visit;
        bestTimeCard.classList.remove('hidden');
    } else {
        bestTimeCard.classList.add('hidden');
    }

    // ── Budget suitability warning banner ──
    const budgetWarningBanner = document.getElementById('budget-warning-banner');
    const budgetWarningBody   = document.getElementById('budget-banner-body');
    const budgetRecommendedVal= document.getElementById('budget-recommended-val');
    
    if (budgetWarningBanner) {
        if (minRecommended > 0 && userBudget < minRecommended) {
            if (budgetWarningBody && data.budget_suitability_note) {
                budgetWarningBody.textContent = data.budget_suitability_note;
            } else if (budgetWarningBody) {
                budgetWarningBody.textContent = `Your budget of ${symbol}${userBudget.toLocaleString(locale)} is below the recommended minimum budget of ${symbol}${minRecommended.toLocaleString(locale)} for this trip. We've designed an ultra-saver plan, but some prices may be unrealistic.`;
            }
            if (budgetRecommendedVal) {
                budgetRecommendedVal.textContent = `${symbol}${minRecommended.toLocaleString(locale)}`;
            }
            budgetWarningBanner.classList.remove('hidden');
        } else {
            budgetWarningBanner.classList.add('hidden');
        }
    }

    // ── Rainy month warning banner ──
    const rainyBanner   = document.getElementById('rainy-warning-banner');
    const rainyTitle    = document.getElementById('rainy-banner-title');
    const rainyBody     = document.getElementById('rainy-banner-body');
    const rainyAltDates = document.getElementById('rainy-alt-dates');
    if (rainyBanner) {
        if (data.rainy_warning) {
            const monthLabel = data.travel_date ? formatMonthLabel(data.travel_date) : 'your selected month';
            rainyTitle.textContent = `⚠️ Heads Up — ${data.destination} in ${monthLabel} Is Monsoon Season!`;
            rainyBody.textContent  = `${data.destination} during ${monthLabel} typically sees heavy rains, high humidity, and flooding risk. Outdoor beach/adventure activities may be severely limited. We've adapted your itinerary with indoor-friendly options, but consider rescheduling for the best experience.`;
            if (rainyAltDates && data.alternate_dates) {
                rainyAltDates.textContent = data.alternate_dates;
            }
            rainyBanner.classList.remove('hidden');
        } else {
            rainyBanner.classList.add('hidden');
        }
    }

    // ── Safety warnings ──
    const safetyCard = document.getElementById('safety-alerts-card');
    const safetyList = document.getElementById('safety-alerts-list');
    if (safetyCard && safetyList) {
        safetyList.innerHTML = "";
        const tips = data.safety_tips || [];
        if (tips.length > 0) {
            tips.forEach(tip => {
                safetyList.innerHTML += `<li><i class="fa-solid fa-triangle-exclamation"></i> <span>${tip}</span></li>`;
            });
            safetyCard.classList.remove('hidden');
        } else {
            safetyCard.classList.add('hidden');
        }
    }

    // ── Real-time Spotlights ──
    const rt               = data.realtime_data || {};

    // Update spotlights subtitle based on data source
    const subtitleEl = document.querySelector('#realtime-spotlights-card .spotlights-subtitle');
    if (subtitleEl) {
        let sourceLabel = "OpenStreetMap";
        const hasGeoapify = (rt.hotels && rt.hotels.length > 0 && rt.hotels[0].source === "geoapify") ||
                            (rt.restaurants && rt.restaurants.length > 0 && rt.restaurants[0].source === "geoapify") ||
                            (rt.attractions && rt.attractions.length > 0 && rt.attractions[0].source === "geoapify");
        if (hasGeoapify) {
            sourceLabel = "Geoapify Places API";
        }
        subtitleEl.innerHTML = `Live recommendations resolved via ${sourceLabel}`;
    }

    const hotelsList       = document.getElementById('spotlight-list-hotels');
    const restaurantsList  = document.getElementById('spotlight-list-restaurants');
    const attractionsList  = document.getElementById('spotlight-list-attractions');

    if (hotelsList && restaurantsList && attractionsList) {
        hotelsList.innerHTML      = "";
        restaurantsList.innerHTML = "";
        attractionsList.innerHTML = "";

        const renderSpotlight = (container, items, emptyIcon, emptyMsg, iconClass) => {
            if (items.length === 0) {
                container.innerHTML = `<div class="spotlight-empty-state"><i class="${iconClass}"></i><p>${emptyMsg}</p></div>`;
                return;
            }
            items.forEach((item, idx) => {
                const nameHash = Array.from(item.name).reduce((sum, char) => sum + char.charCodeAt(0), 0);
                const currency = getCurrencySymbol(activeCountry);
                const tiers = ['', `${currency}`, `${currency}${currency}`, `${currency}${currency} - ${currency}${currency}${currency}`];
                
                let priceIndicator = '';
                if (item.price_level) {
                    const pl = item.price_level.toUpperCase();
                    if (pl.includes('FREE')) {
                        priceIndicator = 'Free';
                    } else if (pl.includes('INEXPENSIVE')) {
                        priceIndicator = currency;
                    } else if (pl.includes('MODERATE')) {
                        priceIndicator = currency.repeat(2);
                    } else if (pl.includes('EXPENSIVE') && !pl.includes('VERY')) {
                        priceIndicator = currency.repeat(3);
                    } else if (pl.includes('VERY_EXPENSIVE')) {
                        priceIndicator = currency.repeat(4);
                    } else {
                        priceIndicator = tiers[1 + (nameHash % 3)];
                    }
                } else {
                    priceIndicator = tiers[1 + (nameHash % 3)];
                }

                let imageList = [];
                let typeKey = '';
                if (iconClass.includes('hotel')) {
                    imageList = HOTEL_IMGS;
                    typeKey = 'hotel';
                } else if (iconClass.includes('utensils')) {
                    imageList = RESTAURANT_IMGS;
                    typeKey = 'restaurant';
                } else {
                    imageList = ATTRACTION_IMGS;
                    typeKey = 'attraction';
                }

                const imgSrc = item.image_url || imageList[nameHash % imageList.length];
                const ratingBadge = buildRatingBadge(item.rating, item.reviews, item.rating_source);
                const imgId = `spotlight-img-${typeKey}-${idx}`;

                container.innerHTML += `
                    <div class="spotlight-item fade-in">
                        <div class="spotlight-img-col">
                            <img id="${imgId}" src="${imgSrc}" alt="${item.name}">
                        </div>
                        <div class="spotlight-details-col">
                            <div class="spotlight-title-row">
                                <h4>${item.name}</h4>
                                <span class="spotlight-price">${priceIndicator}</span>
                            </div>
                            <div class="spotlight-title-row">
                                ${ratingBadge}
                            </div>
                            <p class="spotlight-address">${item.address || ''}</p>
                            <p class="spotlight-recommendation"><i class="fa-solid fa-bell-concierge"></i> ${item.recommendation || ''}</p>
                            <a href="${item.maps_url}" target="_blank" class="spotlight-maps-link">
                                <i class="fa-solid fa-map-location-dot"></i> View on Google Maps <i class="fa-solid fa-arrow-up-right-from-square"></i>
                            </a>
                        </div>
                    </div>`;

                // Asynchronously query Wikipedia page image search for this place if Google Places photo was not provided
                if (!item.image_url) {
                    fetchPlaceImage(item.name, data.destination, imgId);
                }
            });
        };

        renderSpotlight(hotelsList,      rt.hotels      || [], "fa-solid fa-hotel",    "No real-time stay listings found nearby.",       "fa-solid fa-hotel");
        renderSpotlight(restaurantsList, rt.restaurants || [], "fa-solid fa-utensils", "No real-time restaurant listings found nearby.", "fa-solid fa-utensils");
        renderSpotlight(attractionsList, rt.attractions || [], "fa-solid fa-landmark", "No real-time attraction listings found nearby.", "fa-solid fa-landmark");
    }

    // Hide itinerary cards container initially on query submit
    document.getElementById('itinerary-trigger-wrap').classList.remove('hidden');
    document.getElementById('itinerary-section').classList.add('hidden');
}

// ── Daily Itinerary Cards Reveal (on TripAdvisor CTA click) ──────────────────
async function revealItinerary() {
    // Gather selected checkboxes from spotlights list
    const selectedHotels = [];
    const selectedRestaurants = [];
    const selectedAttractions = [];

    document.querySelectorAll('.spotlight-checkbox:checked').forEach(cb => {
        const type = cb.getAttribute('data-type');
        const name = cb.getAttribute('data-name');
        if (type === 'hotel') selectedHotels.push(name);
        else if (type === 'restaurant') selectedRestaurants.push(name);
        else if (type === 'attraction') selectedAttractions.push(name);
    });

    currentInputs.selected_hotels = selectedHotels;
    currentInputs.selected_restaurants = selectedRestaurants;
    currentInputs.selected_attractions = selectedAttractions;
    localStorage.setItem('currentInputs', JSON.stringify(currentInputs));

    await fetchItinerary(currentInputs);
}

function buildRatingBadge(rating, reviews, source) {
    return `
        <span class="spotlight-rating">
            <i class="fa-solid fa-star"></i> ${rating}
            <span class="review-count">(${reviews})</span>
        </span>`;
}

// ── Helper: format "YYYY-MM" → "December 2026" ──────────────────────────────
function formatMonthLabel(val) {
    try {
        const [y, m] = val.split('-');
        const months = ["January","February","March","April","May","June",
                        "July","August","September","October","November","December"];
        return `${months[parseInt(m, 10) - 1]} ${y}`;
    } catch {
        return val;
    }
}

// ── Controls ─────────────────────────────────────────────────────────────────
async function regenerateItinerary() {
    if (!currentInputs) return;
    await fetchItinerary(currentInputs);
}

function goBackToForm() {
    document.getElementById('results-section').classList.add('hidden');
    document.getElementById('form-section').classList.remove('hidden');
    document.getElementById('form-section').scrollIntoView({ behavior: 'smooth' });
}

function exportToPDF() {
    const element     = document.getElementById('pdf-export-area');
    const destination = document.getElementById('result-destination-title').textContent || "Travel";

    const opt = {
        margin:      [12, 12, 12, 12],
        filename:    `${destination.replace(/\s+/g, '_')}_AI_Itinerary.pdf`,
        image:       { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, logging: false, backgroundColor: '#ffffff' },
        jsPDF:       { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    document.body.classList.add('printing-pdf');
    html2pdf().set(opt).from(element).save().then(() => {
        document.body.classList.remove('printing-pdf');
    }).catch(err => {
        console.error("PDF generation failed:", err);
        alert("Failed to export PDF. Please try again.");
        document.body.classList.remove('printing-pdf');
    });
}

// switchSpotlightTab removed since layout is stacked

// ── Fetch dynamic image for individual places via Wikipedia API ───────────
async function fetchPlaceImage(placeName, destination, imgElementId) {
    try {
        // Clean name (remove extra context in parentheses if any)
        const cleanName = placeName.split('(')[0].trim();
        const searchQuery = destination ? `${cleanName} ${destination.split(',')[0].trim()}` : cleanName;
        const url = `https://en.wikipedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(searchQuery)}&gsrlimit=1&prop=pageimages&piprop=thumbnail&pithumbsize=400&format=json&origin=*`;
        
        const response = await fetch(url);
        if (!response.ok) return;

        const data = await response.json();
        const pages = data.query?.pages;
        if (!pages) return;

        const pageId = Object.keys(pages)[0];
        const page = pages[pageId];
        const source = page?.thumbnail?.source;
        const title = page?.title || "";

        if (source) {
            const cleanTitle = title.toLowerCase();
            const cleanPlace = cleanName.toLowerCase();
            
            // Relevancy check: Ensure the page title matches at least one unique keyword of the place name.
            // This prevents loading unrelated images (like Suzuki cars for "Maruthi Cottages" or generic city photos).
            const stopWords = ["hotel", "restaurant", "cafe", "resort", "cottage", "inn", "suites", "stay", "and", "the", "of", "in", "by", "with", "a", "an", "at", "to"];
            const placeKeywords = cleanPlace.split(/\s+/).filter(w => w.length > 2 && !stopWords.includes(w));
            
            let isRelevant = false;
            if (placeKeywords.length === 0) {
                isRelevant = cleanTitle.includes(cleanPlace);
            } else {
                isRelevant = placeKeywords.some(keyword => cleanTitle.includes(keyword));
            }
            
            if (isRelevant) {
                const imgEl = document.getElementById(imgElementId);
                if (imgEl) {
                    imgEl.src = source;
                }
            } else {
                console.warn(`[Wikipedia] Rejected image '${title}' for place '${placeName}' due to low keyword match relevance.`);
            }
        }
    } catch (err) {
        // Silently fail and let it keep using Unsplash fallback image
    }
}

// ── Render Spotlights Card with Checkboxes ──────────────────────────────
function renderSpotlightsOnly(data, userBudget, numPeople) {
    // Save in global/memory variables
    itineraryData = null; // No itinerary generated yet
    activeCountry = data.country || (data.realtime_data ? data.realtime_data.country : '');
    updateFormCurrencyLabels(activeCountry);

    const symbol = getCurrencySymbol(activeCountry);
    const locale = (symbol === '₹') ? 'en-IN' : 'en-US';

    document.getElementById('result-destination-title').textContent = data.destination;
    fetchDestinationImage(data.destination);

    // Initialise budget bar with user values or estimated values if available
    document.getElementById('result-total-budget').textContent = `${symbol}${userBudget.toLocaleString(locale)}`;
    
    const estExpenses = data.estimated_expenses || 0;
    const minRecommended = data.minimum_budget_required || 0;
    const perPersonEst = data.per_person_estimated || 0;
    
    document.getElementById('result-estimated-budget').textContent = estExpenses > 0 
        ? `${symbol}${estExpenses.toLocaleString(locale)}`
        : `—`;
    document.getElementById('result-per-person').textContent = perPersonEst > 0
        ? `${symbol}${perPersonEst.toLocaleString(locale)}`
        : `—`;
    document.getElementById('result-travellers').innerHTML = `<i class="fa-solid fa-users"></i> ${numPeople}`;
    
    const minRecEl = document.getElementById('result-min-recommended-budget');
    if (minRecEl) {
        minRecEl.textContent = minRecommended > 0 
            ? `${symbol}${minRecommended.toLocaleString(locale)}`
            : `—`;
    }

    const companionTypeEl = document.getElementById('result-companion-type');
    if (companionTypeEl) {
        companionTypeEl.textContent = (currentInputs && currentInputs.companion_type) || "Family";
    }

    // Display budget warning banner if budget is insufficient
    const budgetWarningBanner = document.getElementById('budget-warning-banner');
    const budgetWarningBody   = document.getElementById('budget-banner-body');
    const budgetRecommendedVal= document.getElementById('budget-recommended-val');
    const budgetBannerTitle   = document.getElementById('budget-banner-title');
    
    if (budgetWarningBanner) {
        const isBudgetInsufficient = minRecommended > 0 && userBudget < minRecommended;
        if (data.budget_suitability_note) {
            if (budgetBannerTitle) {
                budgetBannerTitle.textContent = isBudgetInsufficient
                    ? '⚠️ Budget Check — Recommended Minimum Exceeded'
                    : '✅ Budget Check — Your Budget Looks Good!';
            }
            if (budgetWarningBody) {
                budgetWarningBody.textContent = data.budget_suitability_note;
            }
            if (budgetRecommendedVal && minRecommended > 0) {
                budgetRecommendedVal.textContent = `${symbol}${minRecommended.toLocaleString(locale)}`;
            }
            budgetWarningBanner.classList.remove('hidden');
            budgetWarningBanner.classList.toggle('budget-ok', !isBudgetInsufficient);
            budgetWarningBanner.classList.toggle('budget-warn', isBudgetInsufficient);
        } else {
            budgetWarningBanner.classList.add('hidden');
        }
    }

    // Hide warnings/time/weather cards for now
    const weatherCard = document.getElementById('weather-card');
    if (weatherCard) weatherCard.classList.add('hidden');
    document.getElementById('best-time-card').classList.add('hidden');
    document.getElementById('rainy-warning-banner').classList.add('hidden');
    document.getElementById('safety-alerts-card').classList.add('hidden');

    // ── Real-time Spotlights ──
    const rt = data.realtime_data || {};

    const subtitleEl = document.querySelector('#realtime-spotlights-card .spotlights-subtitle');
    if (subtitleEl) {
        let sourceLabel = "OpenStreetMap";
        const hasGeoapify = (rt.hotels && rt.hotels.length > 0 && rt.hotels[0].source === "geoapify") ||
                            (rt.restaurants && rt.restaurants.length > 0 && rt.restaurants[0].source === "geoapify") ||
                            (rt.attractions && rt.attractions.length > 0 && rt.attractions[0].source === "geoapify");
        if (hasGeoapify) {
            sourceLabel = "Geoapify Places API";
        }
        subtitleEl.innerHTML = `Choose highlights to build your itinerary (resolved via ${sourceLabel})`;
    }

    const hotelsList       = document.getElementById('spotlight-list-hotels');
    const restaurantsList  = document.getElementById('spotlight-list-restaurants');
    const attractionsList  = document.getElementById('spotlight-list-attractions');

    if (hotelsList && restaurantsList && attractionsList) {
        hotelsList.innerHTML      = "";
        restaurantsList.innerHTML = "";
        attractionsList.innerHTML = "";

        const renderSpotlight = (container, items, emptyIcon, emptyMsg, iconClass, type) => {
            if (items.length === 0) {
                container.innerHTML = `<div class="spotlight-empty-state"><i class="${iconClass}"></i><p>${emptyMsg}</p></div>`;
                return;
            }
            items.forEach((item, idx) => {
                const nameHash = Array.from(item.name).reduce((sum, char) => sum + char.charCodeAt(0), 0);
                const currency = getCurrencySymbol(activeCountry);
                const tiers = ['', `${currency}`, `${currency}${currency}`, `${currency}${currency} - ${currency}${currency}${currency}`];
                
                let priceIndicator = '';
                if (item.price_level) {
                    const pl = item.price_level.toUpperCase();
                    if (pl.includes('FREE')) {
                        priceIndicator = 'Free';
                    } else if (pl.includes('INEXPENSIVE')) {
                        priceIndicator = currency;
                    } else if (pl.includes('MODERATE')) {
                        priceIndicator = currency.repeat(2);
                    } else if (pl.includes('EXPENSIVE') && !pl.includes('VERY')) {
                        priceIndicator = currency.repeat(3);
                    } else if (pl.includes('VERY_EXPENSIVE')) {
                        priceIndicator = currency.repeat(4);
                    } else {
                        priceIndicator = tiers[1 + (nameHash % 3)];
                    }
                } else {
                    priceIndicator = tiers[1 + (nameHash % 3)];
                }

                let imageList = [];
                let typeKey = '';
                if (iconClass.includes('hotel')) {
                    imageList = HOTEL_IMGS;
                    typeKey = 'hotel';
                } else if (iconClass.includes('utensils')) {
                    imageList = RESTAURANT_IMGS;
                    typeKey = 'restaurant';
                } else {
                    imageList = ATTRACTION_IMGS;
                    typeKey = 'attraction';
                }

                const imgSrc = item.image_url || imageList[nameHash % imageList.length];
                const ratingBadge = buildRatingBadge(item.rating, item.reviews, item.rating_source);
                const imgId = `spotlight-img-${typeKey}-${idx}`;

                // Add a checkbox wrapper to each card
                const checkboxHtml = `
                    <div class="spotlight-select-wrapper">
                        <label class="spotlight-checkbox-label">
                            <input type="checkbox" class="spotlight-checkbox" data-type="${type}" data-name="${item.name.replace(/"/g, '&quot;')}">
                            <span class="spotlight-checkbox-custom"><i class="fa-solid fa-check"></i></span>
                        </label>
                    </div>
                `;

                container.innerHTML += `
                    <div class="spotlight-item fade-in">
                        ${checkboxHtml}
                        <div class="spotlight-img-col">
                            <img id="${imgId}" src="${imgSrc}" alt="${item.name}">
                        </div>
                        <div class="spotlight-details-col">
                            <div class="spotlight-title-row">
                                <h4>${item.name}</h4>
                                <span class="spotlight-price">${priceIndicator}</span>
                            </div>
                            <div class="spotlight-title-row">
                                ${ratingBadge}
                            </div>
                            <p class="spotlight-address">${item.address || ''}</p>
                            <p class="spotlight-recommendation"><i class="fa-solid fa-bell-concierge"></i> ${item.recommendation || ''}</p>
                            <a href="${item.maps_url}" target="_blank" class="spotlight-maps-link">
                                <i class="fa-solid fa-map-location-dot"></i> View on Google Maps <i class="fa-solid fa-arrow-up-right-from-square"></i>
                            </a>
                        </div>
                    </div>`;

                if (!item.image_url) {
                    fetchPlaceImage(item.name, data.destination, imgId);
                }
            });
        };

        renderSpotlight(hotelsList,      rt.hotels      || [], "fa-solid fa-hotel",    "No real-time stay listings found nearby.",       "fa-solid fa-hotel",    "hotel");
        renderSpotlight(restaurantsList, rt.restaurants || [], "fa-solid fa-utensils", "No real-time restaurant listings found nearby.", "fa-solid fa-utensils", "restaurant");
        renderSpotlight(attractionsList, rt.attractions || [], "fa-solid fa-landmark", "No real-time attraction listings found nearby.", "fa-solid fa-landmark", "attraction");
    }

    // Show the itinerary generate trigger CTA, hide the actual itinerary
    document.getElementById('itinerary-trigger-wrap').classList.remove('hidden');
    document.getElementById('itinerary-section').classList.add('hidden');
}

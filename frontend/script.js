let currentInputs = null;
let itineraryData = null;  // Keep the itinerary payload in memory

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
    const c = country.toLowerCase();
    if (c.includes('india') || c.includes('in')) return '₹';
    if (c.includes('europe') || c.includes('france') || c.includes('germany') || c.includes('italy') || c.includes('spain') || c.includes('austria') || c.includes('netherlands')) return '€';
    if (c.includes('united kingdom') || c.includes('uk') || c.includes('london')) return '£';
    if (c.includes('japan') || c.includes('jp')) return '¥';
    if (c.includes('united states') || c.includes('us') || c.includes('america') || c.includes('canada') || c.includes('australia') || c.includes('singapore')) return '$';
    return '₹';
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

const getApiUrl = () => {
    if (window.location.origin && window.location.origin.startsWith('http')) {
        return '/generate-itinerary';
    }
    return 'http://127.0.0.1:5000/generate-itinerary';
};

// ── Live per-person budget preview ──────────────────────────────────────────
function updateBudgetPreview() {
    const budget     = parseInt(document.getElementById('budget').value)     || 0;
    const numPeople  = parseInt(document.getElementById('num_people').value) || 1;
    const perPerson  = numPeople > 0 ? Math.round(budget / numPeople) : budget;
    const previewEl  = document.getElementById('budget-preview-text');
    if (previewEl) {
        previewEl.textContent = `₹${perPerson.toLocaleString('en-IN')} per person`;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const budgetInput    = document.getElementById('budget');
    const numPeopleInput = document.getElementById('num_people');
    if (budgetInput)    budgetInput.addEventListener('input',    updateBudgetPreview);
    if (numPeopleInput) numPeopleInput.addEventListener('input', updateBudgetPreview);
    updateBudgetPreview();
    showLanding(); // Boot into introduction screen
});

// ── Form submit ──────────────────────────────────────────────────────────────
async function handleFormSubmit() {
    const destinationInput  = document.getElementById('destination');
    const daysInput         = document.getElementById('days');
    const budgetInput       = document.getElementById('budget');
    const preferencesInput  = document.getElementById('preferences');
    const numPeopleInput    = document.getElementById('num_people');
    const travelDateInput   = document.getElementById('travel_date');

    const interestCheckboxes = document.querySelectorAll('input[name="interests"]:checked');
    const interests = Array.from(interestCheckboxes).map(cb => cb.value);

    const destination  = destinationInput.value.trim();
    const days         = parseInt(daysInput.value);
    const budget       = parseInt(budgetInput.value);
    const preferences  = preferencesInput ? preferencesInput.value.trim() : "";
    const num_people   = parseInt(numPeopleInput ? numPeopleInput.value : 1) || 1;
    const travel_date  = travelDateInput ? travelDateInput.value.trim() : "";

    currentInputs = { destination, days, budget, interests, preferences, num_people, travel_date };
    await fetchItinerary(currentInputs);
}

// ── Fetch itinerary ──────────────────────────────────────────────────────────
async function fetchItinerary(inputs) {
    const formSection    = document.getElementById('form-section');
    const loaderSection  = document.getElementById('loader-section');
    const resultsSection = document.getElementById('results-section');

    formSection.classList.add('hidden');
    resultsSection.classList.add('hidden');
    loaderSection.classList.remove('hidden');

    const loadingMessages = [
        "Analyzing your interests...",
        "Scanning current weather patterns...",
        "Searching local culinary hotspots...",
        "Structuring day-by-day routes...",
        "Calculating group budget splits...",
        "Fetching live place ratings...",
        "Assembling budget-friendly options...",
        "Finalizing travel itinerary..."
    ];
    let msgIndex = 0;
    const loaderSub = document.querySelector('.loader-sub');
    const messageInterval = setInterval(() => {
        msgIndex = (msgIndex + 1) % loadingMessages.length;
        loaderSub.style.opacity = 0;
        setTimeout(() => {
            loaderSub.textContent = loadingMessages[msgIndex];
            loaderSub.style.opacity = 1;
        }, 300);
    }, 2500);

    try {
        const response = await fetch(getApiUrl(), {
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

        loaderSection.classList.add('hidden');
        renderResults(data, inputs.budget, inputs.num_people);
        resultsSection.classList.remove('hidden');
        resultsSection.scrollIntoView({ behavior: 'smooth' });

    } catch (error) {
        clearInterval(messageInterval);
        loaderSection.classList.add('hidden');
        formSection.classList.remove('hidden');
        console.error("API Call Failed:", error);
        alert(`Failed to generate itinerary: ${error.message}. Please make sure the backend Flask server is running.`);
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

    document.getElementById('result-destination-title').textContent = data.destination;
    fetchDestinationImage(data.destination);

    // ── Weather ──
    const tempElement  = document.getElementById('result-temperature');
    const condElement  = document.getElementById('result-condition');
    const weatherIcon  = document.getElementById('weather-icon');
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

    // ── Budget overview ──
    document.getElementById('result-total-budget').textContent =
        `₹${userBudget.toLocaleString('en-IN')}`;

    const minRecommended = data.minimum_budget_required || 0;
    const minRecEl = document.getElementById('result-min-recommended-budget');
    if (minRecEl) {
        minRecEl.textContent = minRecommended > 0 
            ? `₹${minRecommended.toLocaleString('en-IN')}`
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
        `₹${totalEst.toLocaleString('en-IN')}`;

    const perPersonTotal = numPeople > 0 ? Math.round(totalEst / numPeople) : totalEst;
    document.getElementById('result-per-person').textContent =
        `₹${perPersonTotal.toLocaleString('en-IN')}`;

    document.getElementById('result-travellers').innerHTML =
        `<i class="fa-solid fa-users"></i> ${numPeople}`;

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
                budgetWarningBody.textContent = `Your budget of ₹${userBudget.toLocaleString('en-IN')} is below the recommended minimum budget of ₹${minRecommended.toLocaleString('en-IN')} for this trip. We've designed an ultra-saver plan, but some prices may be unrealistic.`;
            }
            if (budgetRecommendedVal) {
                budgetRecommendedVal.textContent = `₹${minRecommended.toLocaleString('en-IN')}`;
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
                const currency = getCurrencySymbol(data.country);
                const tiers = ['', `${currency}`, `${currency}${currency}`, `${currency}${currency} - ${currency}${currency}${currency}`];
                const priceIndicator = tiers[1 + (nameHash % 3)];

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
function revealItinerary() {
    if (!itineraryData) return;

    const container = document.getElementById('itinerary-days-container');
    container.innerHTML = "";

    if (!itineraryData.itinerary || !Array.isArray(itineraryData.itinerary) || itineraryData.itinerary.length === 0) {
        container.innerHTML = `<div class="glass-card text-center"><p>No itinerary details returned. Please try again.</p></div>`;
        return;
    }

    itineraryData.itinerary.forEach(dayPlan => {
        const card = document.createElement('div');
        card.className = "day-card fade-in";

        const cb  = dayPlan.cost_breakdown || {};
        const ppCost = cb.per_person
            ? `<span class="breakdown-pill per-person-pill" title="Per Person"><i class="fa-solid fa-person"></i> ₹${cb.per_person.toLocaleString('en-IN')}/person</span>`
            : '';

        // Build entry fees HTML
        let entryFeesHtml = '';
        if (dayPlan.entry_fees && dayPlan.entry_fees.length > 0) {
            const feesItems = dayPlan.entry_fees.map(ef =>
                `<li><i class="fa-solid fa-ticket entry-fee-icon"></i><span class="entry-fee-place">${ef.place}</span><span class="entry-fee-amount">${ef.fee}</span></li>`
            ).join('');
            entryFeesHtml = `
                <div class="activity-item activity-entry-fees">
                    <div class="activity-icon-box"><i class="fa-solid fa-receipt"></i></div>
                    <div class="activity-details">
                        <span class="time-label">Entry Fees</span>
                        <ul class="entry-fees-list">${feesItems}</ul>
                    </div>
                </div>`;
        }

        // Build transport HTML
        const transportText = dayPlan.transport || 'Local transport available';

        // Build hotel price badge
        const hotelPriceBadge = dayPlan.hotel_price
            ? `<span class="hotel-price-badge"><i class="fa-solid fa-tag"></i> ${dayPlan.hotel_price}</span>`
            : '';

        // Build weather note pill
        const weatherNotePill = dayPlan.weather_note
            ? `<div class="day-weather-pill"><i class="fa-solid fa-cloud-sun-rain"></i> ${dayPlan.weather_note}</div>`
            : '';

        card.innerHTML = `
            <div class="day-card-header">
                <div class="day-header-top">
                    <div class="day-title-group">
                        <h3>Day ${dayPlan.day}</h3>
                        <span class="day-cost-badge">Est: ${dayPlan.estimated_cost || 'N/A'}</span>
                    </div>
                    ${weatherNotePill}
                </div>
                ${cb ? `
                <div class="day-cost-breakdown">
                    <span class="breakdown-pill" title="Stay"><i class="fa-solid fa-hotel"></i> ₹${(cb.accommodation||0).toLocaleString('en-IN')}</span>
                    <span class="breakdown-pill" title="Food"><i class="fa-solid fa-utensils"></i> ₹${(cb.food||0).toLocaleString('en-IN')}</span>
                    <span class="breakdown-pill" title="Activities"><i class="fa-solid fa-ticket"></i> ₹${(cb.activities||0).toLocaleString('en-IN')}</span>
                    <span class="breakdown-pill" title="Transport"><i class="fa-solid fa-taxi"></i> ₹${(cb.transport||0).toLocaleString('en-IN')}</span>
                    ${ppCost}
                </div>
                ` : ''}
            </div>
            <div class="day-activities">
                ${dayPlan.narration ? `
                <div class="day-narration-box">
                    <i class="fa-solid fa-quote-left narration-icon"></i>
                    <p class="narration-text">${dayPlan.narration}</p>
                </div>
                ` : ''}
                <div class="activity-item activity-accommodation">
                    <div class="activity-icon-box"><i class="fa-solid fa-hotel"></i></div>
                    <div class="activity-details">
                        <span class="time-label">Accommodation Stay</span>
                        <p class="desc">${dayPlan.accommodation || 'Recommended hotel'}</p>
                        ${hotelPriceBadge}
                    </div>
                </div>
                <div class="activity-item activity-morning">
                    <div class="activity-icon-box"><i class="fa-solid fa-sun"></i></div>
                    <div class="activity-details">
                        <span class="time-label">Morning</span>
                        <p class="desc">${dayPlan.morning || 'Leisure time'}</p>
                    </div>
                </div>
                <div class="activity-item activity-afternoon">
                    <div class="activity-icon-box"><i class="fa-solid fa-cloud-sun"></i></div>
                    <div class="activity-details">
                        <span class="time-label">Afternoon</span>
                        <p class="desc">${dayPlan.afternoon || 'Explore local neighborhood'}</p>
                    </div>
                </div>
                <div class="activity-item activity-evening">
                    <div class="activity-icon-box"><i class="fa-solid fa-moon"></i></div>
                    <div class="activity-details">
                        <span class="time-label">Evening</span>
                        <p class="desc">${dayPlan.evening || 'Relaxing dinner'}</p>
                    </div>
                </div>
                <div class="activity-item activity-food">
                    <div class="activity-icon-box"><i class="fa-solid fa-utensils"></i></div>
                    <div class="activity-details">
                        <span class="time-label">Food &amp; Dining</span>
                        <p class="desc">${dayPlan.food || 'Try local delicacies'}</p>
                    </div>
                </div>
                <div class="activity-item activity-transport">
                    <div class="activity-icon-box"><i class="fa-solid fa-car-side"></i></div>
                    <div class="activity-details">
                        <span class="time-label">Transport Options &amp; Costs</span>
                        <p class="desc">${transportText}</p>
                    </div>
                </div>
                ${entryFeesHtml}
            </div>
        `;
        container.appendChild(card);
    });

    document.getElementById('itinerary-trigger-wrap').classList.add('hidden');
    const itinerarySec = document.getElementById('itinerary-section');
    itinerarySec.classList.remove('hidden');
    itinerarySec.scrollIntoView({ behavior: 'smooth' });
}

function buildRatingBadge(rating, reviews, source) {
    let sourceIcon = '';
    if (source === 'google') {
        sourceIcon = `<span class="rating-source-badge google-badge" title="Rating from Google Places"><i class="fa-brands fa-google"></i></span>`;
    } else if (source === 'geoapify') {
        sourceIcon = `<span class="rating-source-badge geoapify-badge" title="Rating via Geoapify"><i class="fa-solid fa-globe"></i></span>`;
    } else if (source === 'groq' || source === 'grok') {
        sourceIcon = `<span class="rating-source-badge groq-badge" title="AI Estimated Rating via Groq"><i class="fa-solid fa-brain"></i></span>`;
    } else {
        sourceIcon = `<span class="rating-source-badge osm-badge"    title="Rating via OpenStreetMap"><i class="fa-solid fa-map"></i></span>`;
    }
    return `
        <span class="spotlight-rating">
            <i class="fa-solid fa-star"></i> ${rating}
            <span class="review-count">(${reviews})</span>
            ${sourceIcon}
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

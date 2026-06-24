let currentInputs = null;

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

// ── Render results ───────────────────────────────────────────────────────────
function renderResults(data, userBudget, numPeople) {
    numPeople = numPeople || data.num_people || 1;

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
                const ratingBadge = buildRatingBadge(item.rating, item.reviews, item.rating_source);
                container.innerHTML += `
                    <div class="spotlight-item fade-in">
                        <div class="spotlight-rank">#${idx + 1}</div>
                        <div class="spotlight-item-icon"><i class="${iconClass}"></i></div>
                        <div class="spotlight-item-details">
                            <div class="spotlight-title-row">
                                <h4>${item.name}</h4>
                                ${ratingBadge}
                            </div>
                            <p class="spotlight-address">${item.address}</p>
                            <p class="spotlight-recommendation"><i class="fa-solid fa-bell-concierge"></i> ${item.recommendation}</p>
                            <a href="${item.maps_url}" target="_blank" class="spotlight-maps-link">
                                <i class="fa-solid fa-map-location-dot"></i> View on Google Maps <i class="fa-solid fa-arrow-up-right-from-square"></i>
                            </a>
                        </div>
                    </div>`;
            });
        };

        renderSpotlight(hotelsList,      rt.hotels      || [], "fa-solid fa-hotel",    "No real-time stay listings found nearby.",       "fa-solid fa-hotel");
        renderSpotlight(restaurantsList, rt.restaurants || [], "fa-solid fa-utensils", "No real-time restaurant listings found nearby.", "fa-solid fa-utensils");
        renderSpotlight(attractionsList, rt.attractions || [], "fa-solid fa-landmark", "No real-time attraction listings found nearby.", "fa-solid fa-landmark");
    }

    // ── Daily Itinerary Cards ──
    const container = document.getElementById('itinerary-days-container');
    container.innerHTML = "";

    if (!data.itinerary || !Array.isArray(data.itinerary) || data.itinerary.length === 0) {
        container.innerHTML = `<div class="glass-card text-center"><p>No itinerary details returned. Please try again.</p></div>`;
        return;
    }

    data.itinerary.forEach(dayPlan => {
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

function switchSpotlightTab(tabName) {
    document.querySelectorAll('.spotlight-tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.spotlight-list').forEach(list => list.classList.remove('active'));

    const targetBtn  = Array.from(document.querySelectorAll('.spotlight-tab-btn'))
                            .find(btn => btn.getAttribute('onclick').includes(tabName));
    if (targetBtn) targetBtn.classList.add('active');

    const targetList = document.getElementById(`spotlight-list-${tabName}`);
    if (targetList) targetList.classList.add('active');
}

// Itinerary Results Page Logic

const getApiUrl = (endpoint = 'generate-itinerary') => {
    if (window.location.origin && window.location.origin.startsWith('http')) {
        return '/' + endpoint;
    }
    return 'http://127.0.0.1:5000/' + endpoint;
};

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

// Render itinerary results onto the DOM
function renderItineraryResults(data, userBudget, numPeople) {
    numPeople = numPeople || data.num_people || 1;
    
    const activeCountry = data.country || (data.realtime_data ? data.realtime_data.country : '');
    const symbol = getCurrencySymbol(activeCountry);
    const locale = (symbol === '₹') ? 'en-IN' : 'en-US';

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
        if      (condLower.includes("sun")   || condLower.includes("clear") || condLower.includes("hot"))    weatherIcon.className = "fa-solid fa-sun";
        else if (condLower.includes("rain")  || condLower.includes("drizzle") || condLower.includes("shower")) weatherIcon.className = "fa-solid fa-cloud-showers-heavy";
        else if (condLower.includes("thunder")|| condLower.includes("storm"))                                  weatherIcon.className = "fa-solid fa-cloud-bolt";
        else if (condLower.includes("snow")  || condLower.includes("freeze"))                                  weatherIcon.className = "fa-solid fa-snowflake";
        else if (condLower.includes("wind")  || condLower.includes("breeze"))                                  weatherIcon.className = "fa-solid fa-wind";
        else if (condLower.includes("cloud") || condLower.includes("overcast") || condLower.includes("haze") || condLower.includes("mist") || condLower.includes("fog")) weatherIcon.className = "fa-solid fa-cloud";
        else weatherIcon.className = "fa-solid fa-cloud-sun";
        
        weatherCard.classList.remove('hidden');
    } else if (weatherCard) {
        weatherCard.classList.add('hidden');
    }

    // ── Budget overview ──
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
        const inputsStr = localStorage.getItem('currentInputs');
        const inputs = inputsStr ? JSON.parse(inputsStr) : {};
        companionTypeEl.textContent = inputs.companion_type || "Family";
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

    // ── Budget suitability banner ──
    const budgetWarningBanner = document.getElementById('budget-warning-banner');
    const budgetWarningBody   = document.getElementById('budget-banner-body');
    const budgetRecommendedVal= document.getElementById('budget-recommended-val');
    const budgetBannerTitle   = document.getElementById('budget-banner-title');
    
    if (budgetWarningBanner) {
        const isBudgetInsufficient = minRecommended > 0 && userBudget < minRecommended;
        // Always show if we have a note from Grok — colour it by sufficiency
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
            budgetWarningBanner.classList.toggle('budget-ok',   !isBudgetInsufficient);
            budgetWarningBanner.classList.toggle('budget-warn',  isBudgetInsufficient);
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
            ? `<span class="breakdown-pill per-person-pill" title="Per Person"><i class="fa-solid fa-person"></i> ${symbol}${cb.per_person.toLocaleString(locale)}/person</span>`
            : '';

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

        const transportText = dayPlan.transport || 'Local transport available';
        const hotelPriceBadge = dayPlan.hotel_price
            ? `<span class="hotel-price-badge"><i class="fa-solid fa-tag"></i> ${dayPlan.hotel_price}</span>`
            : '';

        card.innerHTML = `
            <div class="day-card-header">
                <div class="day-header-top">
                    <div class="day-title-group">
                        <h3>Day ${dayPlan.day}</h3>
                        <span class="day-cost-badge">Est: ${dayPlan.estimated_cost || 'N/A'}</span>
                    </div>
                </div>
                ${cb ? `
                <div class="day-cost-breakdown">
                    <span class="breakdown-pill" title="Stay"><i class="fa-solid fa-hotel"></i> ${symbol}${(cb.accommodation||0).toLocaleString(locale)}</span>
                    <span class="breakdown-pill" title="Food"><i class="fa-solid fa-utensils"></i> ${symbol}${(cb.food||0).toLocaleString(locale)}</span>
                    <span class="breakdown-pill" title="Activities"><i class="fa-solid fa-ticket"></i> ${symbol}${(cb.activities||0).toLocaleString(locale)}</span>
                    <span class="breakdown-pill" title="Transport"><i class="fa-solid fa-taxi"></i> ${symbol}${(cb.transport||0).toLocaleString(locale)}</span>
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
                ${dayPlan.place_price_notes ? `
                <div class="activity-item activity-price-notes">
                    <div class="activity-icon-box"><i class="fa-solid fa-tags"></i></div>
                    <div class="activity-details">
                        <span class="time-label">Curated Price Estimates</span>
                        <p class="desc price-notes-text">${dayPlan.place_price_notes}</p>
                    </div>
                </div>` : ''}
            </div>
        `;
        container.appendChild(card);
    });
}

// Fetch destination cover image from Wikipedia
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



// Regenerate itinerary with saved options
async function regenerateItinerary() {
    const inputsStr = localStorage.getItem('currentInputs');
    if (!inputsStr) return;
    const inputs = JSON.parse(inputsStr);
    
    const resultsSection = document.getElementById('results-section');
    const loaderSection  = document.getElementById('loader-section');
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
        resultsSection.classList.remove('hidden');
        renderItineraryResults(data, inputs.budget, inputs.num_people);

    } catch (error) {
        clearInterval(messageInterval);
        loaderSection.classList.add('hidden');
        resultsSection.classList.remove('hidden');
        console.error("API Call Failed:", error);
        alert(`Failed to regenerate itinerary: ${error.message}. Please try again.`);
    }
}

// Redirect back to form page and flag state restoration
function goBackToForm() {
    localStorage.setItem('restoreState', 'true');
    window.location.href = 'index.html';
}

// Export Results to PDF
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

// Page Bootstrapping
document.addEventListener('DOMContentLoaded', () => {
    const itineraryDataStr = localStorage.getItem('itineraryData');
    const currentInputsStr = localStorage.getItem('currentInputs');
    
    if (!itineraryDataStr || !currentInputsStr) {
        window.location.href = 'index.html';
        return;
    }
    
    const itineraryData = JSON.parse(itineraryDataStr);
    const currentInputs = JSON.parse(currentInputsStr);
    
    renderItineraryResults(itineraryData, currentInputs.budget, currentInputs.num_people);
});

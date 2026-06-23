let currentInputs = null;

const getApiUrl = () => {
    if (window.location.origin && window.location.origin.startsWith('http')) {
        return '/generate-itinerary';
    }
    return 'http://127.0.0.1:5000/generate-itinerary';
};

async function handleFormSubmit() {
    const destinationInput = document.getElementById('destination');
    const daysInput = document.getElementById('days');
    const budgetInput = document.getElementById('budget');
    
    const interestCheckboxes = document.querySelectorAll('input[name="interests"]:checked');
    const interests = Array.from(interestCheckboxes).map(cb => cb.value);
    
    const destination = destinationInput.value.trim();
    const days = parseInt(daysInput.value);
    const budget = parseInt(budgetInput.value);

    currentInputs = { destination, days, budget, interests };
    await fetchItinerary(currentInputs);
}

async function fetchItinerary(inputs) {
    const formSection = document.getElementById('form-section');
    const loaderSection = document.getElementById('loader-section');
    const resultsSection = document.getElementById('results-section');

    formSection.classList.add('hidden');
    resultsSection.classList.add('hidden');
    loaderSection.classList.remove('hidden');

    const loadingMessages = [
        "Analyzing your interests...",
        "Scanning current weather patterns...",
        "Searching local culinary hotspots...",
        "Structuring day-by-day routes...",
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
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(inputs)
        });

        clearInterval(messageInterval);

        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(errData.error || `HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        loaderSection.classList.add('hidden');
        renderResults(data, inputs.budget);
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

function renderResults(data, userBudget) {
    document.getElementById('result-destination-title').textContent = data.destination;

    const tempElement = document.getElementById('result-temperature');
    const condElement = document.getElementById('result-condition');
    const weatherIcon = document.getElementById('weather-icon');
    
    const temp = data.weather.temperature || "N/A";
    const condition = data.weather.condition || "Unknown";
    
    tempElement.textContent = temp;
    condElement.textContent = condition;

    const condLower = condition.toLowerCase();
    weatherIcon.className = "fa-solid";
    if (condLower.includes("sun") || condLower.includes("clear") || condLower.includes("hot")) {
        weatherIcon.classList.add("fa-sun");
    } else if (condLower.includes("rain") || condLower.includes("drizzle") || condLower.includes("shower")) {
        weatherIcon.classList.add("fa-cloud-showers-heavy");
    } else if (condLower.includes("thunder") || condLower.includes("storm")) {
        weatherIcon.classList.add("fa-cloud-bolt");
    } else if (condLower.includes("snow") || condLower.includes("freeze")) {
        weatherIcon.classList.add("fa-snowflake");
    } else if (condLower.includes("wind") || condLower.includes("breeze")) {
        weatherIcon.classList.add("fa-wind");
    } else if (condLower.includes("cloud") || condLower.includes("overcast") || condLower.includes("haze") || condLower.includes("mist") || condLower.includes("fog")) {
        weatherIcon.classList.add("fa-cloud");
    } else {
        weatherIcon.classList.add("fa-cloud-sun");
    }

    document.getElementById('result-total-budget').textContent = `₹${userBudget.toLocaleString('en-IN')}`;
    
    let totalEst = 0;
    if (data.itinerary && Array.isArray(data.itinerary)) {
        data.itinerary.forEach(day => {
            const costStr = String(day.estimated_cost).replace(/[^0-9]/g, '');
            const costVal = parseInt(costStr);
            if (!isNaN(costVal)) {
                totalEst += costVal;
            }
        });
    }
    document.getElementById('result-estimated-budget').textContent = `₹${totalEst.toLocaleString('en-IN')}`;

    const rt = data.realtime_data || {};
    const hotelsList = document.getElementById('spotlight-list-hotels');
    const restaurantsList = document.getElementById('spotlight-list-restaurants');
    const attractionsList = document.getElementById('spotlight-list-attractions');
    
    if (hotelsList && restaurantsList && attractionsList) {
        hotelsList.innerHTML = "";
        restaurantsList.innerHTML = "";
        attractionsList.innerHTML = "";
        
        const hotels = rt.hotels || [];
        if (hotels.length === 0) {
            hotelsList.innerHTML = `<div class="spotlight-empty-state"><i class="fa-solid fa-hotel"></i><p>No real-time stay listings found nearby.</p></div>`;
        } else {
            hotels.forEach(h => {
                hotelsList.innerHTML += `
                    <div class="spotlight-item fade-in">
                        <div class="spotlight-item-icon"><i class="fa-solid fa-hotel"></i></div>
                        <div class="spotlight-item-details">
                            <h4>${h.name}</h4>
                            <p>${h.address}</p>
                        </div>
                    </div>
                `;
            });
        }

        const restaurants = rt.restaurants || [];
        if (restaurants.length === 0) {
            restaurantsList.innerHTML = `<div class="spotlight-empty-state"><i class="fa-solid fa-utensils"></i><p>No real-time restaurant listings found nearby.</p></div>`;
        } else {
            restaurants.forEach(r => {
                restaurantsList.innerHTML += `
                    <div class="spotlight-item fade-in">
                        <div class="spotlight-item-icon"><i class="fa-solid fa-utensils"></i></div>
                        <div class="spotlight-item-details">
                            <h4>${r.name}</h4>
                            <p>${r.address}</p>
                        </div>
                    </div>
                `;
            });
        }

        const attractions = rt.attractions || [];
        if (attractions.length === 0) {
            attractionsList.innerHTML = `<div class="spotlight-empty-state"><i class="fa-solid fa-landmark"></i><p>No real-time attraction listings found nearby.</p></div>`;
        } else {
            attractions.forEach(a => {
                attractionsList.innerHTML += `
                    <div class="spotlight-item fade-in">
                        <div class="spotlight-item-icon"><i class="fa-solid fa-landmark"></i></div>
                        <div class="spotlight-item-details">
                            <h4>${a.name}</h4>
                            <p>${a.address}</p>
                        </div>
                    </div>
                `;
            });
        }
    }

    const container = document.getElementById('itinerary-days-container');
    container.innerHTML = "";

    if (!data.itinerary || !Array.isArray(data.itinerary) || data.itinerary.length === 0) {
        container.innerHTML = `<div class="glass-card text-center"><p>No itinerary details returned. Please try again.</p></div>`;
        return;
    }

    data.itinerary.forEach(dayPlan => {
        const card = document.createElement('div');
        card.className = "day-card fade-in";
        
        card.innerHTML = `
            <div class="day-card-header">
                <h3>Day ${dayPlan.day}</h3>
                <span class="day-cost-badge">Est: ${dayPlan.estimated_cost || 'N/A'}</span>
            </div>
            <div class="day-activities">
                <div class="activity-item activity-accommodation">
                    <div class="activity-icon-box">
                        <i class="fa-solid fa-hotel"></i>
                    </div>
                    <div class="activity-details">
                        <span class="time-label">Accommodation Stay</span>
                        <p class="desc">${dayPlan.accommodation || 'Recommended hotel'}</p>
                    </div>
                </div>

                <div class="activity-item activity-morning">
                    <div class="activity-icon-box">
                        <i class="fa-solid fa-sun"></i>
                    </div>
                    <div class="activity-details">
                        <span class="time-label">Morning</span>
                        <p class="desc">${dayPlan.morning || 'Leisure time'}</p>
                    </div>
                </div>
                
                <div class="activity-item activity-afternoon">
                    <div class="activity-icon-box">
                        <i class="fa-solid fa-cloud-sun"></i>
                    </div>
                    <div class="activity-details">
                        <span class="time-label">Afternoon</span>
                        <p class="desc">${dayPlan.afternoon || 'Explore local neighborhood'}</p>
                    </div>
                </div>
                
                <div class="activity-item activity-evening">
                    <div class="activity-icon-box">
                        <i class="fa-solid fa-moon"></i>
                    </div>
                    <div class="activity-details">
                        <span class="time-label">Evening</span>
                        <p class="desc">${dayPlan.evening || 'Relaxing dinner'}</p>
                    </div>
                </div>
                
                <div class="activity-item activity-food">
                    <div class="activity-icon-box">
                        <i class="fa-solid fa-utensils"></i>
                    </div>
                    <div class="activity-details">
                        <span class="time-label">Food Highlight</span>
                        <p class="desc">${dayPlan.food || 'Try local delicacies'}</p>
                    </div>
                </div>
            </div>
        `;
        
        container.appendChild(card);
    });
}

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
    const element = document.getElementById('pdf-export-area');
    const destination = document.getElementById('result-destination-title').textContent || "Travel";
    
    const opt = {
        margin:       [12, 12, 12, 12],
        filename:     `${destination.replace(/\s+/g, '_')}_AI_Itinerary.pdf`,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { 
            scale: 2, 
            useCORS: true,
            logging: false,
            backgroundColor: '#ffffff'
        },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
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
    const buttons = document.querySelectorAll('.spotlight-tab-btn');
    buttons.forEach(btn => btn.classList.remove('active'));

    const lists = document.querySelectorAll('.spotlight-list');
    lists.forEach(list => list.classList.remove('active'));

    const targetBtn = Array.from(buttons).find(btn => btn.getAttribute('onclick').includes(tabName));
    if (targetBtn) targetBtn.classList.add('active');

    const targetList = document.getElementById(`spotlight-list-${tabName}`);
    if (targetList) targetList.classList.add('active');
}

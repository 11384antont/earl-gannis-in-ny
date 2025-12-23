const CSV_URL = 'schedule.csv';

function getTodayFormatted() {
    const today = new Date();
    // Convert to EST (UTC-5)
    const estDate = new Date(today.toLocaleString('en-US', { timeZone: 'America/New_York' }));
    const months = ['January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'];
    const day = estDate.getDate();
    const suffix = (day === 1 || day === 21 || day === 31) ? 'st' :
        (day === 2 || day === 22) ? 'nd' :
            (day === 3 || day === 23) ? 'rd' : 'th';
    return `${months[estDate.getMonth()]} ${day}${suffix}`;
}

const TODAY = getTodayFormatted();

function loadSchedule() {
    Papa.parse(CSV_URL, {
        download: true,
        header: true,
        skipEmptyLines: true,
        complete: function (results) {
            try {
                renderSchedule(results.data);
            } catch (err) {
                showError('Error rendering schedule: ' + err.message);
            }
        },
        error: function (err) {
            showError('Error loading CSV: ' + err.message);
        }
    });
}

function renderSchedule(data) {
    const container = document.getElementById('scheduleContainer');
    const loading = document.getElementById('loading');
    loading.style.display = 'none';

    // Group data by date
    const groupedByDate = {};
    data.forEach(row => {
        const date = row.date?.trim();
        if (!date) return;

        if (!groupedByDate[date]) {
            groupedByDate[date] = [];
        }
        groupedByDate[date].push(row);
    });

    // Render each date section
    Object.keys(groupedByDate).forEach(date => {
        const wrapper = document.createElement('div');
        wrapper.className = 'wrapper';

        // Date header
        const dateHeader = document.createElement('div');
        dateHeader.className = 'scheduleDate horizontal';
        dateHeader.innerHTML = `<h2>${date}</h2>`;
        if (date === TODAY) {
            dateHeader.innerHTML += '<p class="tag">Today</p>';
        }
        wrapper.appendChild(dateHeader);

        // Schedule list
        const scheduleList = document.createElement('div');
        scheduleList.className = 'scheduleList';

        groupedByDate[date].forEach(item => {
            const block = document.createElement('div');
            block.className = 'scheduleBlock bottomAlign horizontal';

            block.innerHTML = `
                        <div class="topAlign horizontal">
                            <img src="${item.icon || 'img/icon/location.svg'}" alt="" width="24" height="24">
                            <div class="info">
                                <h3>${item.location || ''}</h3>
                                <p>${item.detail || ''}</p>
                            </div>
                        </div>
                        <a href="${item.url || '#'}" target="_blank" rel="noopener noreferrer">
                            <img src="img/icon/link.svg" alt="" width="24" height="24">
                        </a>
                    `;

            scheduleList.appendChild(block);
        });

        wrapper.appendChild(scheduleList);

        // Download button (optional - you can add a download_image column to CSV if needed)
        const downloadDiv = document.createElement('div');
        downloadDiv.className = 'leftAlign';

        // Check if there's a download_image column in the CSV
        const firstItem = groupedByDate[date][0];
        if (firstItem.download_image) {
            downloadDiv.innerHTML = `
                        <a href="${firstItem.download_image}" download>
                            <div class="btn">
                                <p>DOWNLOAD</p>
                                <img src="img/icon/download.svg" alt="" width="24" height="24">
                            </div>
                        </a>
                    `;
        } else {
            // Fallback: construct path from date
            const dateFormatted = date.replace(/\s+/g, '').replace(/th|st|nd|rd/g, '');
            downloadDiv.innerHTML = `
                        <a href="img/Schedule-${dateFormatted}.png" download="Schedule-${dateFormatted}">
                            <div class="btn">
                                <p>DOWNLOAD</p>
                                <img src="img/icon/download.svg" alt="" width="24" height="24">
                            </div>
                        </a>
                    `;
        }
        wrapper.appendChild(downloadDiv);

        container.appendChild(wrapper);
    });
}

function showError(message) {
    const loading = document.getElementById('loading');
    const error = document.getElementById('error');
    loading.style.display = 'none';
    error.style.display = 'block';
    error.textContent = message;
}

// Load schedule on page load
loadSchedule();
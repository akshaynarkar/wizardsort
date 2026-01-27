// --- Navigation ---
function switchTool(toolId) {
    document.querySelectorAll('.tool-section').forEach(el => el.classList.add('hidden'));
    document.getElementById(toolId).classList.remove('hidden');
    document.querySelectorAll('.nav-links li').forEach(el => el.classList.remove('active'));
    event.target.classList.add('active');
}

// --- Fortune Manager Logic ---

let allocationChart = null;

function calculateKelly() {
    // 1. Get Inputs
    const tickers = document.getElementById('kelly-tickers').value.split(',').map(t => t.trim());
    const cash = parseFloat(document.getElementById('kelly-cash').value);
    const kellyMultiplier = parseFloat(document.querySelector('input[name="kelly"]:checked').value);

    // 2. Mock Data Calculation (Replace with API fetch in production)
    // The Kelly Formula: f* = p - (1-p)/R
    // p = Probability of Win, R = Win/Loss Ratio
    
    let results = tickers.map(ticker => {
        // Simulating backend logic for "Win Rate" and "Avg Win/Loss" based on historic dates
        const winRate = Math.random() * (0.65 - 0.45) + 0.45; // Random 45-65%
        const avgWin = Math.random() * (10 - 2) + 2; 
        const avgLoss = Math.random() * (5 - 1) + 1;
        const R = avgWin / avgLoss;

        // Raw Kelly Calculation
        let kellyPct = winRate - ((1 - winRate) / R);
        
        // Apply Constraint: If Kelly is negative, set to 0
        if (kellyPct < 0) kellyPct = 0;

        // Apply Multiplier (Full/Half/Quarter)
        let finalPct = kellyPct * kellyMultiplier;

        return {
            ticker,
            winRate: (winRate * 100).toFixed(1) + '%',
            R: R.toFixed(2),
            rawKelly: finalPct,
            displayKelly: (finalPct * 100).toFixed(2) + '%',
            cashAlloc: (cash * finalPct).toFixed(2),
            rationale: kellyPct > 0 ? "Positive Edge" : "Negative Edge (Avoid)"
        };
    });

    // Normalize allocations if sum > 100% (Safety check)
    const totalAlloc = results.reduce((sum, item) => sum + item.rawKelly, 0);
    let cashBuffer = cash;
    
    if (totalAlloc > 1) {
        results = results.map(r => {
            r.rawKelly = r.rawKelly / totalAlloc; // Scale down
            r.cashAlloc = (cash * r.rawKelly).toFixed(2);
            return r;
        });
        cashBuffer = 0;
    } else {
        cashBuffer = cash * (1 - totalAlloc);
    }

    // 3. Render Table
    const tbody = document.getElementById('kelly-table-body');
    tbody.innerHTML = '';
    
    // Add Equities
    results.forEach(r => {
        tbody.innerHTML += `
            <tr onclick="showTrend('${r.ticker}')" style="cursor:pointer">
                <td><strong>${r.ticker}</strong></td>
                <td>${r.winRate}</td>
                <td>${r.R}</td>
                <td>${r.displayKelly}</td>
                <td>$${r.cashAlloc}</td>
                <td>${r.rationale}</td>
            </tr>
        `;
    });
    
    // Add Cash Row
    tbody.innerHTML += `
        <tr style="background:#f0fff4">
            <td><strong>CASH</strong></td>
            <td>-</td>
            <td>-</td>
            <td>${((cashBuffer/cash)*100).toFixed(2)}%</td>
            <td>$${cashBuffer.toFixed(2)}</td>
            <td>Unallocated Capital</td>
        </tr>
    `;

    document.getElementById('kelly-results').classList.remove('hidden');
    renderPieChart(results, cashBuffer);
}

// --- Visualizations ---

function renderPieChart(data, cashVal) {
    const ctx = document.getElementById('allocationPie').getContext('2d');
    const labels = data.map(d => d.ticker).concat(['Cash']);
    const values = data.map(d => parseFloat(d.cashAlloc)).concat([cashVal]);
    
    if (allocationChart) allocationChart.destroy();

    allocationChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                data: values,
                backgroundColor: ['#0056b3', '#007bff', '#6610f2', '#6f42c1', '#28a745']
            }]
        },
        options: {
            onClick: (e, elements) => {
                if(elements.length > 0) {
                    const index = elements[0].index;
                    // Trigger trend view for the clicked slice (excluding cash)
                    if (index < data.length) showTrend(data[index].ticker);
                }
            }
        }
    });
}

function showTrend(ticker) {
    document.getElementById('trend-detail').classList.remove('hidden');
    document.getElementById('trend-ticker').innerText = ticker;
    
    // Mock Trend Data for visual
    const ctx = document.getElementById('trendChart').getContext('2d');
    
    // Create random walk data
    let prices = [100];
    let colors = [];
    for(let i=1; i<20; i++) {
        let change = (Math.random() - 0.45) * 5; // Slight upward bias
        prices.push(prices[i-1] + change);
        colors.push(change >= 0 ? 'green' : 'red'); // Green line for wins, Red for losses
    }

    new Chart(ctx, {
        type: 'line',
        data: {
            labels: Array.from({length: 20}, (_, i) => i + 1),
            datasets: [{
                label: 'Historical Price Action',
                data: prices,
                segment: {
                    borderColor: ctx => colors[ctx.p0DataIndex]
                },
                borderWidth: 2
            }]
        }
    });
}

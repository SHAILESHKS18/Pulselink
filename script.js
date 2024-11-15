// Function to get the local IP address of the Pi with retry logic



async function getLocalIP(retryCount = 3) {
    try {
        const response = await fetch("http://localhost:5000/get_ip");
        if (!response.ok) throw new Error("Network response was not ok");

        const data = await response.json();
        return data.ip; // Assume the Pi sends back the IP address in JSON
    } catch (error) {
        console.error("Error fetching IP address:", error);

        if (retryCount > 0) {
            console.log(`Retrying to get IP... (${3 - retryCount + 1}/3)`);
            await new Promise(resolve => setTimeout(resolve, 2000)); // 2-second delay
            return await getLocalIP(retryCount - 1); // Retry
        } else {
            console.error("Failed to get IP address after multiple attempts.");
            document.getElementById("status").innerText = "Error: Unable to retrieve IP";
            return null;
        }
    }
}

// Function to fetch ECG data using the dynamic IP with retry logic
async function fetchECGData(retryCount = 3) {
    try {
        const localIP = await getLocalIP();
        if (!localIP) throw new Error("Unable to get local IP address");

        // Fetch ECG data using the retrieved IP
        const response = await fetch(`http://${localIP}:5000/ecg_data`);
        if (!response.ok) throw new Error("Network response was not ok");

        const data = await response.json();
        document.getElementById("ecg_value").innerText = data.ecg_value;
        document.getElementById("status").innerText = data.status;

        // Update the chart with the new ECG data point
        addData(myChart, data.ecg_value);
    } catch (error) {
        console.error("Error fetching ECG data:", error);
        document.getElementById("ecg_value").innerText = "Error: ECG Value";
        document.getElementById("status").innerText = "Error: Status";

        if (retryCount > 0) {
            console.log(`Retrying to fetch ECG data... (${3 - retryCount + 1}/3)`);
            setTimeout(() => fetchECGData(retryCount - 1), 2000); // Retry after 2 seconds
        } else {
            console.error("Failed to retrieve ECG data after multiple attempts.");
        }
    }
}

// Fetch ECG data every second
setInterval(fetchECGData, 1000);

// Initialize the Chart.js line chart for the ECG data
const ctx = document.getElementById('ecgChart').getContext('2d');
const myChart = new Chart(ctx, {
    type: 'line',
    data: {
        labels: [], // Time labels
        datasets: [{
            label: 'ECG Waveform',
            data: [],
            borderColor: 'rgba(75, 192, 192, 1)',
            borderWidth: 2,
            fill: false,
        }]
    },
    options: {
        scales: {
            x: {
                type: 'linear',
                title: {
                    display: true,
                    text: 'Time (s)'
                }
            },
            y: {
                beginAtZero: true,
                title: {
                    display: true,
                    text: 'ECG Value'
                }
            }
        }
    }
});

// Function to add data to the chart
function addData(chart, value) {
    const currentTime = new Date().toLocaleTimeString(); // Current time label
    chart.data.labels.push(currentTime); // Add time label
    chart.data.datasets[0].data.push(value); // Add ECG data point

    if (chart.data.labels.length > 20) { // Limit to the latest 20 points
        chart.data.labels.shift();
        chart.data.datasets[0].data.shift();
    }
    chart.update();
}

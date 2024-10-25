document.addEventListener('DOMContentLoaded', function() {
    const ctx = document.getElementById('batteryVoltageChart').getContext('2d');
    
    // Create gradient for the chart
    const gradientFill = ctx.createLinearGradient(0, 0, 0, 400);
    gradientFill.addColorStop(0, 'rgba(255, 0, 0, 0.7)'); // Semi-transparent red
    gradientFill.addColorStop(1, 'rgba(255, 0, 0, 0.1)'); // Very light, transparent red
    

    const batteryVoltageChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Battery Voltage',
                data: [],
                borderColor: 'rgb(63, 81, 181)',
                backgroundColor: gradientFill,
                borderWidth: 3,
                pointBackgroundColor: 'rgb(255, 255, 255)',
                pointBorderColor: 'rgb(63, 81, 181)',
                pointBorderWidth: 2,
                pointRadius: 5,
                pointHoverRadius: 7,
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    grid: {
                        color: 'rgba(0, 0, 0, 0.1)',
                        borderColor: 'rgba(0, 0, 0, 0.3)',
                        tickColor: 'rgba(0, 0, 0, 0.3)'
                    },
                    ticks: {
                        font: {
                            size: 12,
                            weight: 'bold'
                        }
                    }
                },
                y: {
                    beginAtZero: true,
                    max: 30,
                    grid: {
                        color: 'rgba(0, 0, 0, 0.1)',
                        borderColor: 'rgba(0, 0, 0, 0.3)',
                        tickColor: 'rgba(0, 0, 0, 0.3)'
                    },
                    ticks: {
                        font: {
                            size: 12,
                            weight: 'bold'
                        },
                        callback: function(value) {
                            return value + 'V';
                        }
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: 'rgba(255, 255, 255, 0.8)',
                    titleColor: 'rgb(0, 0, 0)',
                    bodyColor: 'rgb(0, 0, 0)',
                    titleFont: {
                        size: 16,
                        weight: 'bold'
                    },
                    bodyFont: {
                        size: 14
                    },
                    borderColor: 'rgb(63, 81, 181)',
                    borderWidth: 1,
                    callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            if (context.parsed.y !== null) {
                                label += context.parsed.y.toFixed(2) + 'V - ' + getBatteryStatus(context.parsed.y);
                            }
                            return label;
                        }
                    }
                }
            },
            animation: {
                duration: 1000,
                easing: 'easeOutQuart'
            }
        }
    });

    function getBatteryStatus(voltage) {
        if (voltage < 20) return 'Low';
        if (voltage < 22) return 'Normal';
        if (voltage < 30) return 'Good';
        return 'High';
    }

    let driveMotorWorking = false;
    let brushMotorWorking = false;

   // ... (previous code remains the same)

   function toggleMotor(motor) {
    const motorSwitch = document.getElementById(`${motor}-motor-switch`);
    const motorStatus = motorSwitch.checked ? "on" : "off";

    const data = {
        motor: motor,
        status: motorStatus
    };

    console.log('Sending motor control data:', data);

    fetch('http://localhost:3000/motor-control', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            motor: motor,
            status: motorStatus
        }),
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            console.log(`${motor} motor status: ${motorStatus}`);
            updateMotorStatus(`${motor}-motor-status`, motorSwitch.checked);
            document.getElementById(`${motor}-motor-working`).textContent = motorSwitch.checked ? "Working" : "Not Working";
            
            // Update the corresponding motor working variable
            if (motor === 'drive') {
                driveMotorWorking = motorSwitch.checked;
            } 
            if (motor === 'brush') {
                brushMotorWorking = motorSwitch.checked;
            }
        } else {
            console.error('Failed to update motor status');
            motorSwitch.checked = !motorSwitch.checked; // Revert switch state on error
        }
    })
    .catch(error => {
        console.error('Error:', error);
        motorSwitch.checked = !motorSwitch.checked; // Revert switch state on error
    });
}

    // Add event listeners for motor switches
    document.getElementById('drive-motor-switch').addEventListener('change', () => toggleMotor('drive'));
    document.getElementById('brush-motor-switch').addEventListener('change', () => toggleMotor('brush'));

    let apiConnected = false;

    function updateApiStatus(connected) {
        apiConnected = connected;
        const statusElement = document.getElementById('api-status');
        if (connected) {
            statusElement.textContent = 'API Connected';
            statusElement.className = 'api-status connected';
        } else {
            statusElement.textContent = 'API Disconnected';
            statusElement.className = 'api-status disconnected';
        }
    }


    let previousCounts = {
        leftPressCount: 0,
        rightPressCount: 0,
        stopPressCount: 0,
        rightSensorCount: 0,
        leftSensorCount: 0,
        limitSwitchCount: 0
    };


    // Improved updateSensorData function
    function updateSensorData() {
        fetch('http://192.168.0.200/api/sensor-data')
            .then(response => response.json())
            .then(data => {


                console.log(data)

               updateCountAndColor('left-button-presses', data.leftPressCount);
                updateCountAndColor('right-button-presses', data.rightPressCount);
                updateCountAndColor('stop-button-presses', data.stopPressCount);
                updateCountAndColor('right-sensor-presses', data.rightSensorCount);
                updateCountAndColor('left-sensor-presses', data.leftSensorCount);
                updateCountAndColor('limit-sensor-presses', data.limitSwitchCount);
                // Update button counts
                document.getElementById('left-button-presses').textContent = data.leftPressCount;
                document.getElementById('right-button-presses').textContent = data.rightPressCount;
                document.getElementById('stop-button-presses').textContent = data.stopPressCount;
                document.getElementById('right-sensor-presses').textContent = data.rightSensorCount;
                document.getElementById('left-sensor-presses').textContent = data.leftSensorCount;
                document.getElementById('limit-sensor-presses').textContent = data.limitSwitchCount;

                const totalCount = data.leftPressCount + data.rightPressCount + data.stopPressCount + 
                    data.rightSensorCount + data.leftSensorCount + data.limitSwitchCount;
                const avgCount = (totalCount / 6).toFixed(2);

                document.getElementById('totalcount').textContent = totalCount;
                document.getElementById('average-count').textContent = avgCount;

                if (data.rightSensorCount !== previousCounts.rightSensorCount) {
                    blinkLED('right-led');
                    previousCounts.rightSensorCount = data.rightSensorCount;
                }
                if (data.leftSensorCount !== previousCounts.leftSensorCount) {
                    blinkLED('left-led');
                    previousCounts.leftSensorCount = data.leftSensorCount;
                }



                // Update battery voltage chart
                const time = new Date().toLocaleTimeString();
                batteryVoltageChart.data.labels.push(time);
                batteryVoltageChart.data.datasets[0].data.push(data.batteryVoltage);
                
                if (batteryVoltageChart.data.labels.length > 10) {
                    batteryVoltageChart.data.labels.shift();
                    batteryVoltageChart.data.datasets[0].data.shift();
                }
                
                batteryVoltageChart.update();

                // Update LEDs with a blinking effect
                        

                // Update API status
                updateApiStatus(true);
            })
            .catch(error => {
                console.error('Error fetching sensor data:', error);
                updateApiStatus(false);
            });
    }

    

    function updateMotorStatus(elementId, isWorking) {
        const element = document.getElementById(elementId);
        element.classList.toggle('working', isWorking);
        element.classList.toggle('not-working', !isWorking);
    }


    
    function updateCountAndColor(elementId, count) {
        const element = document.getElementById(elementId);
        element.textContent = count;
        
        const countBox = element.closest('.count-box');
        if (count === 0) {
            countBox.classList.remove('green');
            countBox.classList.add('red');
        } else {
            countBox.classList.remove('red');
            countBox.classList.add('green');
        }
    }

    function blinkLED(elementId) {
        const ledElement = document.getElementById(elementId);
        ledElement.classList.add('on');
        setTimeout(() => {
            ledElement.classList.remove('on');
        }, 1000);
    }

    // Improved form submission logic
    const submitButton = document.querySelector('.input-data input[type="button"]');
    if (submitButton) {
        submitButton.addEventListener('click', function() {

            updateSensorData();
            const name = document.querySelector('.input-data .name input').value;
            const qcNumber = document.querySelector('.input-data .cpnumber input').value;

            console.log('Name:', name);
            console.log('QC Number:', qcNumber);
            console.log('Drive Motor Working:', driveMotorWorking);
            console.log('Brush Motor Working:', brushMotorWorking);

            var currentdate = new Date();
            var datetime = currentdate.getDate() + "/" + (currentdate.getMonth() + 1) + "/" + currentdate.getFullYear() + 
                " @ " + currentdate.getHours().toString().padStart(2, '0') + ":" + 
                currentdate.getMinutes().toString().padStart(2, '0') + ":" + 
                currentdate.getSeconds().toString().padStart(2, '0');

                if (name && qcNumber) {
                    const formData = {
                        date: datetime,
                        name: name,
                        qcNumber: qcNumber,
                        driveMotorWorking: driveMotorWorking ? 'true' : 'false',
                        brushMotorWorking: brushMotorWorking ? 'true' : 'false',
                        rightButtonPresses: getStatusOrCount('right-button-presses'),
                        leftButtonPresses: getStatusOrCount('left-button-presses'),
                        stopButtonPresses: getStatusOrCount('stop-button-presses'),
                        rightSensorPresses: getStatusOrCount('right-sensor-presses'),
                        leftSensorPresses: getStatusOrCount('left-sensor-presses'),
                        limitSensorPresses: getStatusOrCount('limit-sensor-presses'),
                        totalCount: document.getElementById('totalcount').textContent,
                        averageCount: document.getElementById('average-count').textContent,
                        batteryVoltage: batteryVoltageChart.data.datasets[0].data[batteryVoltageChart.data.datasets[0].data.length - 1].toFixed(2),
                        feedback: document.getElementById('feedback').value
                    };
                
                    console.log('Form data being sent:', formData);
                    sendToSheetDB(formData);
                } else {
                    alert('Please fill name and qc number.');
                }
        });
    } else {
        console.error('Error on sending the data!!!');
    }

    function getStatusOrCount(elementId) {
        const count = parseInt(document.getElementById(elementId).textContent);
        return count > 0 ? count.toString() : 'Not Working';
    }

    function sendToSheetDB(data) {
        const url = 'https://sheetdb.io/api/v1/0a96t6zaebybu';

        fetch(url, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                data: [data]
            })
        })
        .then(response => response.json())
        .then(data => {
            console.log('Success:', data);
            alert('Data submitted successfully!');
        })
        .catch((error) => {
            console.error('Error:', error);
            alert('An error occurred while submitting the data.');
        });
    }

    // Update data every second
    setInterval(updateSensorData, 1000);

    // Initial update
    updateSensorData();
});
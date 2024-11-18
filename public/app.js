document.addEventListener('DOMContentLoaded', function() {
    // Constants
   const API_ENDPOINT = 'https://my-project-v94s.onrender.com/api/sensor-data';
   const MOTOR_CONTROL_ENDPOINT = 'https://my-project-v94s.onrender.com/motor-control';

    const SHEETDB_ENDPOINT = 'https://sheetdb.io/api/v1/0a96t6zaebybu';
    const UPDATE_INTERVAL = 1000;

    // Chart Configuration
    class ChartManager {
        constructor() {
            const ctx = document.getElementById('batteryVoltageChart').getContext('2d');
            this.setupGradient(ctx);
            this.chart = this.createChart(ctx);
        }

        setupGradient(ctx) {
            this.gradientFill = ctx.createLinearGradient(0, 0, 0, 400);
            this.gradientFill.addColorStop(0, 'rgba(255, 0, 0, 0.7)');
            this.gradientFill.addColorStop(1, 'rgba(255, 0, 0, 0.1)');
        }

        createChart(ctx) {
            return new Chart(ctx, {
                type: 'line',
                data: {
                    labels: [],
                    datasets: [{
                        label: 'Battery Voltage',
                        data: [],
                        borderColor: 'rgb(63, 81, 181)',
                        backgroundColor: this.gradientFill,
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
                                callback: value => `${value}V`
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
                                label: context => {
                                    const voltage = context.parsed.y;
                                    return `Battery Voltage: ${voltage.toFixed(2)}V - ${this.getBatteryStatus(voltage)}`;
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
        }

        getBatteryStatus(voltage) {
            if (voltage < 20) return 'Low';
            if (voltage < 22) return 'Normal';
            if (voltage < 30) return 'Good';
            return 'High';
        }

        updateChart(voltage) {
            const time = new Date().toLocaleTimeString();
            this.chart.data.labels.push(time);
            this.chart.data.datasets[0].data.push(voltage);
            
            if (this.chart.data.labels.length > 10) {
                this.chart.data.labels.shift();
                this.chart.data.datasets[0].data.shift();
            }
            
            this.chart.update();
        }
    }

    // Motor Control
    class MotorController {
        constructor() {
            this.motorStates = {
                drive: false,
                brush: false
            };
            this.setupEventListeners();
        }

        setupEventListeners() {
            document.getElementById('drive-motor-switch').addEventListener('change', 
                () => this.toggleMotor('drive'));
            document.getElementById('brush-motor-switch').addEventListener('change', 
                () => this.toggleMotor('brush'));
        }

        async toggleMotor(motor) {
            const motorSwitch = document.getElementById(`${motor}-motor-switch`);
            const motorStatus = motorSwitch.checked ? "on" : "off";

            try {
                 const response = await fetch(MOTOR_CONTROL_ENDPOINT, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ motor, status: motorStatus }),
                });

                const data = await response.json();
                if (data.success) {
                    this.updateMotorUI(motor, motorSwitch.checked);
                    this.motorStates[motor] = motorSwitch.checked;
                } else {
                    throw new Error('Failed to update motor status');
                }
            } catch (error) {
                console.error('Error:', error);
                motorSwitch.checked = !motorSwitch.checked;
            }
        }

        updateMotorUI(motor, isWorking) {
            const statusElement = document.getElementById(`${motor}-motor-status`);
            const workingElement = document.getElementById(`${motor}-motor-working`);
            
            statusElement.classList.toggle('working', isWorking);
            statusElement.classList.toggle('not-working', !isWorking);
            workingElement.textContent = isWorking ? "Working" : "Not Working";
        }

        getMotorStatus(motor) {
            return this.motorStates[motor] ? 'Working' : 'Not Working';
        }
    }

    // LED Control
    class LEDController {
        constructor() {
            this.ledStates = {
                right: false,
                left: false
            };
            this.setupEventListeners();
        }

        setupEventListeners() {
            document.querySelector('.led-right-check').addEventListener('change', 
                () => this.toggleLED('right'));
            document.querySelector('.led-left-check').addEventListener('change', 
                () => this.toggleLED('left'));
        }

        toggleLED(side) {
            const led = document.querySelector(`.led-${side}-check`);
            this.ledStates[side] = led.checked;
            
            const ledElement = document.getElementById(`${side}-led`);
            const iconElement = document.getElementById(`${side === 'right' ? 'blue' : 'green'}_led`);
            const statusElement = document.getElementById(`${side}-led-status`);
            
            const color = side === 'right' ? '#007bff' : '#28a745';
            
            if (led.checked) {
                ledElement.style.backgroundColor = color;
                iconElement.style.color = color;
                statusElement.textContent = "Working";
            } else {
                ledElement.style.backgroundColor = "#ccc";
                iconElement.style.color = "#ccc";
                statusElement.textContent = "Not Working";
            }
        }

        blinkLED(side) {
            const ledElement = document.getElementById(`${side}-led`);
            ledElement.classList.add('on');
            setTimeout(() => ledElement.classList.remove('on'), 1000);
        }

        getLEDStatus(side) {
            return this.ledStates[side] ? 'Working' : 'Not Working';
        }
    }

    // Sensor Data Manager
    class SensorDataManager {
        constructor(chartManager, ledController) {
            this.chartManager = chartManager;
            this.ledController = ledController;
            this.previousCounts = {
                leftPressCount: 0,
                rightPressCount: 0,
                stopPressCount: 0,
                rightSensorCount: 0,
                leftSensorCount: 0,
                limitSwitchCount: 0
            };
            this.apiConnected = false;
        }

        async fetchAndUpdateData() {
            try {
                const response = await fetch(API_ENDPOINT);
                const data = await response.json();
                
                this.updateCounts(data);
                this.updateTotals(data);
                this.checkSensorChanges(data);
                this.chartManager.updateChart(data.batteryVoltage);
                this.updateApiStatus(true);
            } catch (error) {
                console.error('Error fetching sensor data:', error);
                this.updateApiStatus(false);
            }
        }

        updateCounts(data) {
            const countElements = [
                'left-button-presses', 'right-button-presses', 'stop-button-presses',
                'right-sensor-presses', 'left-sensor-presses', 'limit-sensor-presses'
            ];

            countElements.forEach(elementId => {
                const count = data[this.getDataKey(elementId)];
                this.updateCountAndColor(elementId, count);
            });
        }

        getDataKey(elementId) {
            const keyMap = {
                'left-button-presses': 'leftPressCount',
                'right-button-presses': 'rightPressCount',
                'stop-button-presses': 'stopPressCount',
                'right-sensor-presses': 'rightSensorCount',
                'left-sensor-presses': 'leftSensorCount',
                'limit-sensor-presses': 'limitSwitchCount'
            };
            return keyMap[elementId];
        }

        updateCountAndColor(elementId, count) {
            const element = document.getElementById(elementId);
            element.textContent = count;
            
            const countBox = element.closest('.count-box');
            countBox.classList.toggle('red', count === 0);
            countBox.classList.toggle('green', count > 0);
        }

        updateTotals(data) {
            const totalCount = Object.values(data).reduce((sum, count) => 
                typeof count === 'number' ? sum + count : sum, 0);
            const avgCount = (totalCount / 6).toFixed(2);

            document.getElementById('totalcount').textContent = totalCount;
            document.getElementById('average-count').textContent = avgCount;
        }

        checkSensorChanges(data) {
            if (data.rightSensorCount !== this.previousCounts.rightSensorCount) {
                this.ledController.blinkLED('right');
                this.previousCounts.rightSensorCount = data.rightSensorCount;
            }
            if (data.leftSensorCount !== this.previousCounts.leftSensorCount) {
                this.ledController.blinkLED('left');
                this.previousCounts.leftSensorCount = data.leftSensorCount;
            }
        }

        updateApiStatus(connected) {
            this.apiConnected = connected;
            const statusElement = document.getElementById('api-status');
            statusElement.textContent = connected ? 'API Connected' : 'API Disconnected';
            statusElement.className = `api-status ${connected ? 'connected' : 'disconnected'}`;
        }

        getStatusOrCount(elementId) {
            const count = parseInt(document.getElementById(elementId).textContent);
            return count > 0 ? count.toString() : 'Not Working';
        }
    }

    // Form Management
   class FormManager {
    constructor(motorController, ledController, sensorDataManager, chartManager) {  // Add chartManager parameter
        this.motorController = motorController;
        this.ledController = ledController;
        this.sensorDataManager = sensorDataManager;
        this.chartManager = chartManager;  // Store chartManager reference
        this.dropdownManager = new DropdownManager();
        this.setupFormValidation();
    }

        setupFormValidation() {
            const submitButton = document.querySelector('.input-data input[type="button"]');
            submitButton.addEventListener('click', () => {
                if (this.validateForm()) {
                    this.submitForm();
                }
            });
        }

        validateForm() {
            const requiredFields = ['name', 'cpnumber', 'site'].map(field => 
                document.querySelector(`.input-data .${field} input`).value.trim());
            
            if (requiredFields.some(field => !field)) {
                alert('Please fill in all required fields (Name, CP Number, and Site Name).');
                return false;
            }

            if (!this.dropdownManager.getSelectedRemark()) {
                alert('Please select a remark from the dropdown.');
                return false;
            }

            return true;
        }

        getDateTime() {
            return new Date().toLocaleString('en-GB', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: false
            }).replace(',', ' @');
        }

        gatherFormData() {
        const formElements = {
            name: document.querySelector('.input-data .name input'),
            cpNumber: document.querySelector('.input-data .cpnumber input'),
            siteName: document.querySelector('.input-data .site input')
        };


            const batteryVoltage = this.chartManager?.chart?.data?.datasets[0]?.data?.slice(-1)[0] || 0;

        return {
            DATE: this.getDateTime(),
            NAME: formElements.name.value.trim(),
            CPNumber: formElements.cpNumber.value.trim(),
            SiteName: formElements.siteName.value.trim(),
            driveMotorWorking: this.motorController.getMotorStatus('drive'),
            brushMotorWorking: this.motorController.getMotorStatus('brush'),
            rightButtonPresses: this.sensorDataManager.getStatusOrCount('right-button-presses'),
            leftButtonPresses: this.sensorDataManager.getStatusOrCount('left-button-presses'),
            stopButtonPresses: this.sensorDataManager.getStatusOrCount('stop-button-presses'),
            RightSensorEventCount: this.sensorDataManager.getStatusOrCount('right-sensor-presses'),
            LeftSensorEventCount: this.sensorDataManager.getStatusOrCount('left-sensor-presses'),
            LimitSwitchEventCount: this.sensorDataManager.getStatusOrCount('limit-sensor-presses'),
            rightLedWorking: this.ledController.getLEDStatus('right'),
            leftLedWorking: this.ledController.getLEDStatus('left'),
            totalCount: document.getElementById('totalcount').textContent,
            averageCount: document.getElementById('average-count').textContent,
            batteryVoltage: batteryVoltage.toFixed(2),
            Remark: this.dropdownManager.getSelectedRemark()
        };
    }


        async submitForm() {
            try {
            const formData = this.gatherFormData();
            console.log('Submitting form data:', formData); // Debug log
            
            const response = await this.sendToSheetDB(formData);
            console.log('SheetDB Response:', response); // 
               if (response && response.created) { // Check for specific success indicator
                alert('Data submitted successfully!');
                this.resetForm();
            } else {
                throw new Error(`Submission failed: ${JSON.stringify(response)}`);
            }
        } catch (error) {
            console.error('Detailed submission error:', error);
            alert(`Submission failed: ${error.message}. Please check the console for details.`);
        }
    }

        async sendToSheetDB(data) {
            const response = await fetch(SHEETDB_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ data: [data] })
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
            }
            
            const responseData = await response.json();
            console.log('Response data:', responseData); // Debug log
            return responseData;
            
        } catch (error) {
            if (error.name === 'AbortError') {
                throw new Error('Request timed out after 10 seconds');
            }
            throw error; // Re-throw other errors
        }
    

        resetForm() {
            const inputs = document.querySelectorAll('.input-data input[type="text"]');
            inputs.forEach(input => input.value = '');
            this.dropdownManager.reset();
        }
    }

    // Dropdown Management
    class DropdownManager {
        constructor() {
            this.dropdownInput = document.getElementById('test');
            this.dropdownButton = document.querySelector('.dd-button');
            this.dropdownMenu = document.querySelector('.dd-menu');
            this.selectedRemark = '';
            
        if (!this.dropdownInput || !this.dropdownButton || !this.dropdownMenu) {
            console.error('Required dropdown elements not found');
            return;
        }

        this.setupEventListeners();
        
        }

        setupEventListeners() {
            document.addEventListener('click', (e) => {
                if (!e.target.closest('.dropdown')) {
                    this.closeDropdown();
                }
            });

            this.dropdownButton.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleDropdown();
            });

            this.dropdownMenu.addEventListener('click', (e) => {
                const listItem = e.target.closest('li');
                if (listItem && !listItem.classList.contains('divider')) {
                    this.handleSelection(listItem);
                }
            });
        }

        toggleDropdown() {
            this.dropdownInput.checked = !this.dropdownInput.checked;
         if (this.dropdownInput.checked) {
            this.dropdownMenu.classList.add('show');
        } else {
            this.dropdownMenu.classList.remove('show');
        }
    }

        closeDropdown() {
            this.dropdownInput.checked = false;
            this.dropdownMenu.classList.remove('show');
        }

    handleSelection(listItem) {
        // Get text content without the icon
        const textContent = listItem.firstChild.textContent.trim();
        this.selectedRemark = textContent;
        
        // Update button text while preserving any existing icons
        this.dropdownButton.textContent = this.selectedRemark;
        
        // Update selected state
        const allItems = this.dropdownMenu.querySelectorAll('li');
        allItems.forEach(item => item.classList.remove('selected'));
        listItem.classList.add('selected');
        
        this.closeDropdown();
        
        // Dispatch a custom event for selection change
        const event = new CustomEvent('remarkSelected', {
            detail: { remark: this.selectedRemark }
        });
        document.dispatchEvent(event);
    }

         getSelectedRemark() {
        // Ensure we always return a string, even if empty
        return this.selectedRemark || '';
    }

        reset() {
            this.dropdownButton.textContent = 'Remarks';
            this.selectedRemark = '';
            const allItems = this.dropdownMenu.querySelectorAll('li');
            allItems.forEach(item => item.classList.remove('selected'));
        }
    }

    // Initialize Application
   function initializeApp() {
    const chartManager = new ChartManager();
    const motorController = new MotorController();
    const ledController = new LEDController();
    const sensorDataManager = new SensorDataManager(chartManager, ledController);
    const formManager = new FormManager(
        motorController, 
        ledController, 
        sensorDataManager,
        chartManager  // Pass chartManager to FormManager
    );

        // Start periodic data updates
        setInterval(() => sensorDataManager.fetchAndUpdateData(), UPDATE_INTERVAL);
        
        // Initial data fetch
        sensorDataManager.fetchAndUpdateData();

    return {
        chartManager,
        motorController,
        ledController,
        sensorDataManager,
        formManager
    };
}

    // Start the application
    const app = initializeApp();

    // Make app instance available globally for debugging if needed
    window.monitoringApp = app;
});


                    
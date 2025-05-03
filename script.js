// --- MQTT Configuration  ---
const MQTT_BROKER = "47161622944946a5b84109affb7c79ce.s1.eu.hivemq.cloud";
const MQTT_PORT = 8884; 
const MQTT_USER = "ESP32"; 
const MQTT_PASSWORD = "Anakonda1#"; 
const MQTT_COMMAND_TOPIC = "esp32/buzzer/command";

// Create a random client ID for the browser session
const MQTT_CLIENT_ID = "webClient_" + Math.random().toString(16).substr(2, 8);

// --- UI Elements ---
const statusElement = document.getElementById('status');
const buzzerButton = document.getElementById('buzzerButton');

// State tracking
let isBuzzerOn = false;
let isConnected = false;
let mqttClient = null;

// Wait for the page to fully load before connecting to MQTT
window.onload = function() {
    // --- Create MQTT Client Instance ---
    console.log("Creating MQTT client...");
    mqttClient = new Paho.MQTT.Client(MQTT_BROKER, MQTT_PORT, MQTT_CLIENT_ID);
    
    // --- Set Callback Handlers ---
    mqttClient.onConnectionLost = onConnectionLost;
    mqttClient.onMessageArrived = onMessageArrived;
    
    // --- Connection Options ---
    const connectOptions = {
        timeout: 10,
        useSSL: true,
        userName: MQTT_USER,
        password: MQTT_PASSWORD,
        onSuccess: onConnect,
        onFailure: onFailure,
        cleanSession: true
    };
    
    // --- Connect to MQTT Broker ---
    console.log(`Attempting to connect to MQTT broker ${MQTT_BROKER}:${MQTT_PORT}...`);
    mqttClient.connect(connectOptions);
    
    // Setup button events for both desktop and mobile
    setupButtonEvents();
};

// Setup events for both mouse and touch interfaces
function setupButtonEvents() {
    // Mouse events
    buzzerButton.addEventListener('mousedown', activateBuzzer);
    document.addEventListener('mouseup', deactivateBuzzer);
    document.addEventListener('mouseleave', deactivateBuzzer);
    
    // Touch events for mobile
    buzzerButton.addEventListener('touchstart', function(e) {
        e.preventDefault(); // Prevent default touch behavior
        activateBuzzer();
    });
    
    buzzerButton.addEventListener('touchend', function(e) {
        e.preventDefault();
        deactivateBuzzer();
    });
    
    buzzerButton.addEventListener('touchcancel', function(e) {
        e.preventDefault();
        deactivateBuzzer();
    });
}

function activateBuzzer() {
    if (isConnected && !isBuzzerOn) {
        buzzerButton.classList.add('pressed');
        sendCommand("ON");
        isBuzzerOn = true;
    }
}

function deactivateBuzzer() {
    if (isConnected && isBuzzerOn) {
        buzzerButton.classList.remove('pressed');
        sendCommand("OFF");
        isBuzzerOn = false;
    }
}

// --- Callback Functions ---
function onConnect() {
    console.log("Connected to MQTT Broker!");
    statusElement.textContent = "Connected. Ready to use buzzer.";
    statusElement.style.color = 'green';
    isConnected = true;
    
    //Subscribe to status topic for feedback
    // mqttClient.subscribe("esp32/buzzer/status");
    // console.log("Subscribed to esp32/buzzer/status");
}

function onFailure(responseObject) {
    console.error(`MQTT Connection Failed: ${responseObject.errorMessage} (Code: ${responseObject.errorCode})`);
    statusElement.textContent = `Connection Failed: ${responseObject.errorMessage}`;
    statusElement.style.color = 'red';
    isConnected = false;
}

function onConnectionLost(responseObject) {
    if (responseObject.errorCode !== 0) {
        console.error(`MQTT Connection Lost: ${responseObject.errorMessage}`);
        statusElement.textContent = `Connection Lost: ${responseObject.errorMessage}. Please refresh.`;
        statusElement.style.color = 'red';
        isConnected = false;
        
        // Make sure buzzer is off if connection is lost
        if (isBuzzerOn) {
            buzzerButton.classList.remove('pressed');
            isBuzzerOn = false;
        }
    }
}

function onMessageArrived(message) {
    console.log(`Message Arrived: Topic=${message.destinationName}, Payload=${message.payloadString}`);
    // You could update the UI based on status messages from the ESP32 here
}

// --- Send MQTT Message Function ---
function sendCommand(command) {
    if (!isConnected) {
        console.error("Cannot send command, not connected to MQTT broker.");
        statusElement.textContent = "Error: Not connected. Please refresh.";
        statusElement.style.color = 'red';
        return;
    }
    
    console.log(`Sending command: ${command} to topic ${MQTT_COMMAND_TOPIC}`);
    const message = new Paho.MQTT.Message(command);
    message.destinationName = MQTT_COMMAND_TOPIC;
    message.qos = 0; // Quality of Service (0 = at most once)
    mqttClient.send(message);
    
    statusElement.textContent = `Buzzer ${command === "ON" ? "ON" : "OFF"}`;
    statusElement.style.color = command === "ON" ? '#ff6600' : 'green';
}

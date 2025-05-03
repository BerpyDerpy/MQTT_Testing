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
const onButton = document.getElementById('buzzerOnButton');
const offButton = document.getElementById('buzzerOffButton');

// --- Create MQTT Client Instance ---
// Use Paho.MQTT.Client
const client = new Paho.MQTT.Client(MQTT_BROKER, MQTT_PORT, MQTT_CLIENT_ID);

// --- Set Callback Handlers ---
client.onConnectionLost = onConnectionLost;
client.onMessageArrived = onMessageArrived; // Optional: If you want the dashboard to listen too

// --- Connection Options ---
const connectOptions = {
    timeout: 10,
    useSSL: true, // Enable TLS/SSL
    userName: MQTT_USER,
    password: MQTT_PASSWORD,
    onSuccess: onConnect,
    onFailure: onFailure,
    cleanSession: true
};

// --- Connect to MQTT Broker ---
console.log(`Attempting to connect to MQTT broker <span class="math-inline">\{MQTT\_BROKER\}\:</span>{MQTT_PORT}...`);
client.connect(connectOptions);

// --- Callback Functions ---
function onConnect() {
    console.log("Connected to MQTT Broker!");
    statusElement.textContent = "Connected. Ready to send commands.";
    statusElement.style.color = 'green';
    // Subscribe to status topic for feedback
    // client.subscribe("esp32/buzzer/status");
    // console.log("Subscribed to esp32/buzzer/status");
}

function onFailure(responseObject) {
    console.error(`MQTT Connection Failed: ${responseObject.errorMessage} (Code: ${responseObject.errorCode})`);
    statusElement.textContent = `Connection Failed: ${responseObject.errorMessage}`;
    statusElement.style.color = 'red';
}

function onConnectionLost(responseObject) {
    if (responseObject.errorCode !== 0) {
        console.error(`MQTT Connection Lost: ${responseObject.errorMessage}`);
        statusElement.textContent = `Connection Lost: ${responseObject.errorMessage}. Please refresh.`;
        statusElement.style.color = 'red';
    }
    // attempt to reconnect here
}

//  Handle incoming messages if subscribed
function onMessageArrived(message) {
    console.log(`Message Arrived: Topic=<span class="math-inline">\{message\.destinationName\}, Payload\=</span>{message.payloadString}`);
    // You could update the UI based on status messages from the ESP32 here
}

// --- Send MQTT Message Function ---
function sendCommand(command) {
    if (!client.isConnected()) {
        console.error("Cannot send command, not connected to MQTT broker.");
        statusElement.textContent = "Error: Not connected. Please refresh.";
        statusElement.style.color = 'red';
        return;
    }
    console.log(`Sending command: ${command} to topic ${MQTT_COMMAND_TOPIC}`);
    const message = new Paho.MQTT.Message(command);
    message.destinationName = MQTT_COMMAND_TOPIC;
    message.qos = 0; // Quality of Service
    client.send(message);
    statusElement.textContent = `Command '${command}' sent.`;
     statusElement.style.color = 'blue';
}

// --- Add Event Listeners to Buttons ---
onButton.onclick = () => sendCommand("ON");
offButton.onclick = () => sendCommand("OFF");

// --- Initial Status ---
statusElement.textContent = "Connecting to MQTT Broker...";
statusElement.style.color = 'orange';

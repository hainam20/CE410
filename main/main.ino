#include <ArduinoJson.h>
#include <ArduinoJson.hpp>

#include <Wire.h>
#include "MAX30105.h"
#include "heartRate.h"
#include "spo2_algorithm.h"
#include <Arduino.h>
#include <WiFi.h>
#include <PubSubClient.h>
#include <SPI.h>

#include <OneWire.h>
#include <DallasTemperature.h>

MAX30105 particleSensor;
const int oneWireBus = 4; 
// Setup a oneWire instance to communicate with any OneWire devices
OneWire oneWire(oneWireBus);

// Pass our oneWire reference to Dallas Temperature sensor 
DallasTemperature sensors(&oneWire);

const char *ssid = "Hai Nam";
const char *password = "23581104";


  
const char *mqtt_server = "mqtt.flespi.io";
const char *mqtt_topic = "Health-data";
const char *mqtt_user = "r5sB4Lo4EbSi6siLzlNkXx6waBsHRU56OnxIWLAoLjuFzCgYLR6zc0TdrbK6WF0A";
const char *mqtt_password = "";

char clientId[50];

WiFiClient espClient;
PubSubClient client(espClient);

unsigned long lastPublishTime = 0;
const unsigned long publishInterval = 5000; // Set the interval for publishing data (in milliseconds)
  
uint32_t irBuffer[100]; //infrared LED sensor data
uint32_t redBuffer[100];  //red LED sensor data

int32_t bufferLength; //data length
int32_t spo2; //SPO2 value
int8_t validSPO2; //indicator to show if the SPO2 calculation is valid
int32_t heartRate; //heart rate value
int8_t validHeartRate; //indicator to show if the heart rate calculation is valid
void setup()
{
  Serial.begin(115200);
  Serial.println("Initializing...");
  sensors.begin();
  StaticJsonDocument<200> jsonDocument;
  connectToWiFi(); // Connect to WiFi
  connectToMQTT(); // Connect to MQTT

  // Initialize sensor
  if (!particleSensor.begin(Wire, I2C_SPEED_FAST)) // Use default I2C port, 400kHz speed
  {
    Serial.println("MAX30102 was not found. Please check wiring/power. ");
    while (1);
  }
  byte ledBrightness = 50; //Options: 0=Off to 255=50mA
  byte sampleAverage = 4; //Options: 1, 2, 4, 8, 16, 32
  byte ledMode = 2; //Options: 1 = Red only, 2 = Red + IR, 3 = Red + IR + Green
  byte sampleRate = 100; //Options: 50, 100, 200, 400, 800, 1000, 1600, 3200
  int pulseWidth = 411; //Options: 69, 118, 215, 411
  int adcRange = 4096; //Options: 2048, 4096, 8192, 16384

  particleSensor.setup(ledBrightness, sampleAverage, ledMode, sampleRate, pulseWidth, adcRange); //Configure sensor with these settings
}

void loop()
{
    sensors.requestTemperatures(); 
  float temperatureC = sensors.getTempCByIndex(0);
  float temperatureF = sensors.getTempFByIndex(0);
  bufferLength = 100; //buffer length of 100 stores 4 seconds of samples running at 25sps

  //read the first 100 samples, and determine the signal range
  for (byte i = 0 ; i < bufferLength ; i++)
  {
    while (particleSensor.available() == false) //do we have new data?
      particleSensor.check(); //Check the sensor for new data

    redBuffer[i] = particleSensor.getRed();
    irBuffer[i] = particleSensor.getIR();
    particleSensor.nextSample(); //We're finished with this sample so move to next sample

    Serial.print(F("red="));
    Serial.print(redBuffer[i], DEC);
    Serial.print(F(", ir="));
    Serial.println(irBuffer[i], DEC);
  }

  //calculate heart rate and SpO2 after first 100 samples (first 4 seconds of samples)
  maxim_heart_rate_and_oxygen_saturation(irBuffer, bufferLength, redBuffer, &spo2, &validSPO2, &heartRate, &validHeartRate);

  //Continuously taking samples from MAX30102.  Heart rate and SpO2 are calculated every 1 second
  while (1)
  {
    //dumping the first 25 sets of samples in the memory and shift the last 75 sets of samples to the top
    for (byte i = 25; i < 100; i++)
    {
      redBuffer[i - 25] = redBuffer[i];
      irBuffer[i - 25] = irBuffer[i];
    }

    //take 25 sets of samples before calculating the heart rate.
    for (byte i = 75; i < 100; i++)
    {
      while (particleSensor.available() == false) //do we have new data?
        particleSensor.check(); //Check the sensor for new data

      // digitalWrite(readLED, !digitalRead(readLED)); //Blink onboard LED with every data read

      redBuffer[i] = particleSensor.getRed();
      irBuffer[i] = particleSensor.getIR();
      particleSensor.nextSample(); //We're finished with this sample so move to next sample

      //send samples and calculation result to terminal program through UART
      Serial.print(F("red="));
      Serial.print(redBuffer[i], DEC);
      Serial.print(F(", ir="));
      Serial.print(irBuffer[i], DEC);

      Serial.print(F(", HR="));
      Serial.print(heartRate, DEC);

      Serial.print(F(", HRvalid="));
      Serial.print(validHeartRate, DEC);

      Serial.print(F(", SPO2="));
      Serial.print(spo2, DEC);

      Serial.print(F(", SPO2Valid="));
      Serial.print(validSPO2, DEC);
      Serial.print(F(", temp="));
      Serial.print(temperatureC);
      Serial.println("ºC");
    }

    //After gathering 25 new samples recalculate HR and SP02
    maxim_heart_rate_and_oxygen_saturation(irBuffer, bufferLength, redBuffer, &spo2, &validSPO2, &heartRate, &validHeartRate);
    if(validHeartRate == 1 && validSPO2 == 1)
    {
      publishToMQTT(temperatureC, heartRate,spo2);
      delay(5000);
    }
  }
}


void connectToWiFi()
{
  Serial.print("Connecting to WiFi");
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED)
  {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nConnected to WiFi");
}


 
  void connectToMQTT()
  {
    client.setServer(mqtt_server, 1883);
    while (!client.connected())
    {
      Serial.print("Connecting to MQTT...");
      long r = random(1000);
      sprintf(clientId, "clientId-%ld", r);
      if (client.connect(clientId, mqtt_user , mqtt_password)) {
        Serial.print(clientId);
        Serial.println(" connected");
        client.subscribe("Health-data");
      } else {
        Serial.print("failed, rc=");
        Serial.print(client.state());
        Serial.println(" try again in 5 seconds");
        delay(5000);
      }
    }
  }
  
  void publishToMQTT(long temp, float HR, float SPO2)
  {
    // String message = String(irValue) + "," + String(bpm) + "," + String(avgBpm);
    StaticJsonDocument<200> jsonDocument;
    jsonDocument["temp"] = temp;
    jsonDocument["HR"] = HR;
    jsonDocument["SPO2"] = SPO2;
    String jsonString;
    serializeJson(jsonDocument, jsonString);
    Serial.println("Chuỗi JSON: " + jsonString);
    char jsonCharArray[jsonString.length() + 1];
    jsonString.toCharArray(jsonCharArray, sizeof(jsonCharArray));
    client.publish(mqtt_topic, jsonCharArray);
  } 

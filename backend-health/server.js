const express = require("express");
const mongoose = require("mongoose");
const morgan = require("morgan");
const bodyParser = require("body-parser");
const mqtt = require("mqtt");
const cors = require("cors");

// Route
const HealthDataRoute = require("./routes/HealthData");
const events = require("./models/HealthData");
const { emit } = require("process");
const { log } = require("console");

const app = express();

app.use(morgan("dev"));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cors());
app.options("*", cors());

const PORT = process.env.PORT || 5000;

const server = require("http").createServer(app);
const io = require("socket.io")(server, {
  cors: {
    origin: "*",
  },
});

//  MongoDB database
const db = mongoose.connection;

db.on("error", (err) => {
  console.log("error connecting to MongoDB", err);
});
db.on("connected", async () => {
  console.log("MongoDB Connected!");
});
async function sendDataToClient() {
  const today = new Date();
  const startOfToday = new Date(today);
  const startOfWeek = new Date(startOfToday);
  startOfWeek.setDate(
    startOfToday.getDate() -
      startOfToday.getDay() +
      (startOfToday.getDay() === 0 ? -6 : 1)
  );
  console.log(startOfWeek);

  const aggregateQuery = events.aggregate([
    {
      $match: { createdAt: { $gte: startOfWeek, $lte: startOfToday } },
    },
    {
      $group: {
        _id: { $dayOfWeek: "$createdAt" },
        avgHR: { $avg: "$HR" },
        avgSPO2: { $avg: "$SPO2" },
        avgTemp: { $avg: "$temp" },
      },
    },
  ]);
  aggregateQuery
    .exec()
    .then((result) => {
      io.emit("chart_data", result);
      console.log(result);
    })
    .catch((err) => {
      console.log(err);
    });
}

/**
 * Config MQTT
 */
// Config MQTT
const client = mqtt.connect("mqtt://mqtt.flespi.io:1883", {
  username: "On8kILHqGRrEIGBhNM6cH5Qw3cp2K3tpgsxN353zMj1kNqrp0mrxf8U8870I0kV4",
  password: "",
});
const topic = "Health-data";

client.on("connect", async () => {
  await mongoose.connect(
    "mongodb+srv://hainam20:20032002nam%40@cluster0.du4h7t4.mongodb.net/HealthDB"
  );
  console.log("MQTT Connected!!");
  client.subscribe(topic);
});

/**
 * Config MongoDB
 */
server.listen(PORT, async () => {
  // Connect MongoDb
  await mongoose.connect(
    "mongodb+srv://hainam20:20032002nam%40@cluster0.du4h7t4.mongodb.net/HealthDB"
  ),
    { useNewUrlParser: true, useUnifiedTopology: true };
  console.log(`app listening on port ${PORT}`);
});

/**
 * Connect Socket.io
 */
io.on("connection", (socket) => {
  console.log("socket client connected");
  sendDataToClient();
  // handle status Relay
});

// transmit data via MQTT into Flespi broker
client.on("message", async (topic, message) => {
  console.log("MQTT Received message:", message.toString());
  let data = message.toString();
  data = JSON.parse(data);
  await saveData(data);
  await io.emit("health_data", data);

  console.log("test: ", data);
});

//save data to mongoDB
saveData = async (data) => {
  data = new events(data);
  data = await data.save();
  console.log("save data to mongo", data);
};

app.use("/api/healthdata", HealthDataRoute);

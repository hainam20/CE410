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

/**
 * Notify Route
 */
const NotifyRoute = require("./routes/Notify");
const notify = require("./models/Notify");

// User Route
const UserRoute = require("./routes/User");
const User = require("./models/User");
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
      (startOfToday.getDay() === 0 ? -6 : 1) -
      1
  );
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
    {
      $sort: { _id: 1 }, // Sắp xếp _id từ nhỏ đến lớn (1 là ASC, -1 là DESC)
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

const findAndEmitNotifications = async (date) => {
  const dateFind = new Date(date);
  const startDate = new Date(dateFind);
  startDate.setHours(0, 0, 0, 0);
  startDate.setDate(startDate.getDate());
  const endDate = new Date(dateFind);
  endDate.setHours(23, 59, 59, 999);
  console.log(startDate.toLocaleString());
  console.log(endDate.toLocaleString());

  try {
    const data = await notify
      .find({
        createdAt: { $gte: startDate, $lt: endDate },
      })
      .sort({ createdAt: -1 })
      .limit(10);
    if (Array.isArray(data)) {
      console.log(data);
      io.emit("notify", data);
    } else {
      console.error("Error: Data returned by find method is not an array");
    }
  } catch (err) {
    console.log(err);
  }
};
io.on("connection", (socket) => {
  console.log("socket client connected");
  sendDataToClient();

  socket.on("Clicked", (message) => {
    console.log("Click in: ", message);
    findAndEmitNotifications(message);
  });
  // handle status Relay
});
const getCurrentDateFormatted = () => {
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const currentDate = new Date();
  const year = currentDate.getFullYear();
  const month = months[currentDate.getMonth()];
  const day = currentDate.getDate();

  const formattedDate = `${year} ${month} ${day}`;
  return formattedDate;
};
// transmit data via MQTT into Flespi broker
client.on("message", async (topic, message) => {
  console.log("MQTT Received message:", message.toString());
  let data = message.toString();
  data = JSON.parse(data);
  await notification(data.temp, data.SPO2, data.HR);
  dateNow = getCurrentDateFormatted();
  await io.emit("health_data", data);
  await findAndEmitNotifications(dateNow);
  sendDataToClient();
});

//save data to mongoDB
saveData = async (data) => {
  data = new events(data);
  data = await data.save();
};

saveNotify = async (notification) => {
  data = new notify({ Notification: notification });
  data = await data
    .save()
    .then((result) => {})
    .catch((error) => {
      console.log("error: ", error);
    });
};

notification = async (temp, spo2, hr) => {
  let notify;
  // notify for pulse oxymeter value
  if (spo2 < 91)
    notify = "Tình trạng nguy hiểm: Nồng độ oxy trong máu quá thấp.";
  else if (spo2 <= 94 && spo2 >= 91)
    notify = "Thiếu máu thiếu oxy: Nồng độ oxy trong máu thấp."; //>91 - <= 94
  else notify = "Người bình thường: Nồng độ oxy trong máu ổn định.";
  await saveNotify(notify);
  await io.emit("notifies", { Notification: notify });
  // notify for heart rate
  if (hr < 60) notify = "Thấp bất thường: Nhịp tim cơ thể quá chậm.";
  else if (hr < 100 && hr >= 60)
    notify = "Mức bình thường: Nhịp tim cơ thể ổn định.";
  else notify = "Cao bất thường: Nhịp tim cơ thể quá nhanh.";
  await saveNotify(notify);
  await io.emit("notifies", { Notification: notify });
  //notify for temperaature of body
  if (temp < 27) notify = "Hạ thân nhiệt nặng: Nhiệt độ cơ thể quá thấp.";
  else if (temp < 32 && temp >= 27)
    notify = "Hạ thân nhiệt vừa: Nhiệt độ cơ thể thấp."; // >27 <32
  else if (temp <= 35 && temp >= 32)
    notify = "Hạ thân nhiệt nhẹ: Nhiệt độ cơ thể hơi thấp."; //>=32 <=35
  else if (temp <= 37 && temp > 35)
    notify = "Người bình thường: Nhiệt độ cơ thể ổn định.";
  else if (temp <= 38 && temp > 37)
    notify = "Sốt nhẹ: Nhiệt độ cơ thể hơi cao.";
  else if (temp <= 39 && temp > 38) notify = "Sốt cao: Nhiệt độ cơ thể cao.";
  else notify = "Sốt rất cao: Nhiệt độ cơ thể quá cao.";
  await saveNotify(notify);
  await io.emit("notifies", { Notification: notify });
};

app.use("/api/healthdata", HealthDataRoute);
app.use("/api/notify", NotifyRoute);
app.use("/api/user", UserRoute);

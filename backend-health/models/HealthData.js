const mongoose = require("mongoose");

const HealthDataSchema = new mongoose.Schema(
  {
    temp: {
      type: Number,
      required: true,
    },
    HR: {
      type: Number,
      required: true,
    },
    SPO2: {
      type: Number,
      required: true,
    },
  },
  { timestamps: true }
);

const HealthData = mongoose.model("HealthData", HealthDataSchema);

module.exports = HealthData;

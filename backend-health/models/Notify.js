const mongoose = require("mongoose");

const NotifySchema = new mongoose.Schema(
  {
    Notification: {
      type: String,
    },
  },
  { timestamps: true }
);

const Notify = mongoose.model("Notify", NotifySchema);

module.exports = Notify;

const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    Height: {
      type: Number,
      required: true,
    },
    StudentID: {
      type: Number,
      required: true,
    },
    dateOfBirth: {
      type: Date,
      required: true,
      trim: true,
    },
    emailAddress: {
      type: String,
      required: true,
    },
    fullName: {
      type: String,
      required: true,
    },
    Weight: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

const User = mongoose.model("User", UserSchema);

module.exports = User;

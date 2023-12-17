const { response } = require("express");
const HealthData = require("../models/HealthData");
const { error } = require("console");

//Show the list of Lora Data

const index = (req, res, next) => {
  HealthData.find()
    .then((response) => {
      res.json({
        response,
      });
    })
    .catch((error) => {
      res.json({
        message: "An error occured",
      });
    });
};

// show single Lora data
const show = (req, res, next) => {
  let HealthDataID = req.body.HealthDataID;
  HealthData.findById(HealthDataID)
    .then((response) => {
      res.json({
        response,
      });
    })
    .catch((error) => {
      res.json({
        message: "An error Occured!",
      });
    });
};

// add new LoRa data
const store = (req, res, next) => {
  let healthdata = new HealthData({
    temp: req.body.temp,
    HR: req.body.HR,
    SPO2: req.body.SPO2,
  });
  healthdata
    .save()
    .then((response) => {
      res.json({
        message: "Data added successfully!",
      });
    })
    .catch((error) => {
      res.json({
        message: "An error Occured",
      });
    });
};

// upadate an LoRa data

const update = (req, res, next) => {
  let HealthDataID = req.body.HealthDataID;

  let updatedData = {
    temp: req.body.temp,
    HR: req.body.HR,
    SPO2: req.body.SPO2,
  };

  HealthData.findByIdAndUpdate(HealthDataID, { $set: updatedData })
    .then(() => {
      res.json({
        message: "Data update succesfully!!",
      });
    })
    .catch((error) => {
      res.json({
        message: "An error occured!!",
      });
    });
};

// Delete an Lora Data
const destroy = (req, res, next) => {
  let HealthDataID = req.body.HealthDataID;
  HealthData.findByIdAndRemove(HealthDataID)
    .then(() => {
      res.json({
        message: "Data deleted succesfully !!",
      });
    })
    .catch((error) => {
      req.json({
        message: "An error occured !",
      });
    });
};
module.exports = {
  index,
  show,
  store,
  update,
  destroy,
};

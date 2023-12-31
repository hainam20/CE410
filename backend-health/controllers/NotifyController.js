const { response } = require("express");
const Notify = require("../models/Notify");
const { error } = require("console");

//Show the list of Lora Data

const index = (req, res, next) => {
  Notify.find()
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
  let NotifyID = req.body.NotifyID;
  Notify.findById(NotifyID)
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
  let Notifydata = new Notify({
    temp: req.body.temp,
    HR: req.body.HR,
    SPO2: req.body.SPO2,
  });
  Notify.save()
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
  let NotifyID = req.body.NotifyID;

  let updatedData = {
    Notification: req.body.Notification,
  };

  Notify.findByIdAndUpdate(NotifyID, { $set: updatedData })
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
  let NotifyID = req.body.NotifyID;
  Notify.findByIdAndRemove(NotifyID)
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

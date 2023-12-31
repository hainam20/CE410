const { response } = require("express");
const User = require("../models/User");
const { error } = require("console");

//Show the list of User
const index = (req, res, next) => {
  User.find()
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
// show single User
const show = (req, res, next) => {
  let UserID = req.body.UserID;
  User.findById(UserID)
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

// add new User
const store = (req, res, next) => {
  let user = new User({
    Height: req.body.Height,
    StudentID: req.body.StudentID,
    dateOfBirth: req.body.dateOfBirth,
    emailAddress: req.body.emailAddress,
    fullName: req.body.fullName,
    Weight: req.body.Weight,
    password: req.body.password,
  });
  user
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

// upadate an User

const update = (req, res, next) => {
  let UserID = req.body.UserID;

  let updatedData = {
    Height: req.body.Height,
    StudentID: req.body.StudentID,
    dateOfBirth: req.body.dateOfBirth,
    emailAddress: req.body.emailAddress,
    fullName: req.body.fullName,
    Weight: req.body.Weight,
    password: req.body.password,
  };

  User.findByIdAndUpdate(UserID, { $set: updatedData })
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

// Delete an User
const destroy = (req, res, next) => {
  let UserID = req.body.UserID;
  User.findByIdAndRemove(UserID)
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
const authenticate = (req, res) => {
  const { StudentID, password } = req.body;
  User.findOne({ StudentID: StudentID }).then((user) => {
    if (user) {
      if (user.password === password) {
        res.json("Success");
      } else {
        res.json("Password Incorrect");
      }
    } else {
      res.json("No record exist");
    }
  });
};
const findStuId = async (req, res) => {
  const StudentID = req.params.stuid;
  try {
    const student = await User.findOne({ StudentID: StudentID });
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }
    const { fullName, Weight, Height, dateOfBirth, emailAddress } = student;
    res.json({ fullName, Weight, Height, dateOfBirth, emailAddress });
  } catch (err) {
    console.log(err);
    res.status(500).send("internal server error");
  }
};
module.exports = {
  index,
  show,
  store,
  update,
  destroy,
  authenticate,
  findStuId,
};

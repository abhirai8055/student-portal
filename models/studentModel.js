const { Schema, model } = require("mongoose");
const bcrypt = require("bcrypt");

const students = Schema(
  {
    firstName: {
      type: String,
    },
    lastName: {
      type: String,
    },
    email: {
      type: String,
      unique: true,
      required: true,
    },
    password: {
      type: String,
      required: true,
    },
    mobileNumber: {
      type: Number,
      unique: true,
      required: true,
    },

    dateOfBirth: {
      type: String,
    },
    otp: {
      type: Number,
    },
    isVarified: {
      type: Boolean,
      default: false,
    },

    expirationTime: {
      type: Date,
    },
    userType: {
      type: String,
      enum: ["student", "admin"],
      default: "student",
    },
    status: {
      type: String,
      enum: ["active", "deleted", "blocked"],
      default: "active",
    },
  },
  { timestamps: true }
);
module.exports = model("student", students, "student");

const admin = async () => {
  const adminData = await model("student", students).find({
    userType: "admin",
  });
  if (adminData.length !== 0) {
    console.log("admin already present");
  } else {
    let obj = {
      firstName: "Ad",
      lastName: "Admin",
      mobileNumber: 7985853064,
      email: "Abhijeetrai415@gmail.com",
      password: bcrypt.hashSync("admin@112", 10),
      dateOfBirth: "28-06-2002",
      userType: "admin",
      status: "active",
      isVarified: "true",
    };
    const result = await model("student", students).create(obj);
    console.log("admin created ", result);
  }
};
admin();

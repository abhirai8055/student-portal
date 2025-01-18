const commonFunction = require("../utils/common");
const userServices = require("./services/UserServices");
const mongoose = require("mongoose");
const Joi = require("joi");
require("dotenv").config();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const {
  checkUserExists,
  createUser,
  findUser,
  updateUserById,
  findAll,
  findUserById,
  find,
  findAdmin,
  deleteAll,
  findIdAndDelete,
} = userServices;

module.exports = {
  async userSignup(req, res) {
    const schema = Joi.object({
      firstName: Joi.string().min(2).max(30).required(),
      lastName: Joi.string().min(3).max(10).required(),
      email: Joi.string().required(),
      password: Joi.string().required(),
      mobileNumber: Joi.string()
        .length(10)
        .pattern(/^[0-9]+$/)
        .required(),
      dateOfBirth: Joi.string().required(),
    });
    try {
      const validatedBody = await schema.validateAsync(req.body);
      const {
        firstName,
        lastName,
        email,
        password,
        mobileNumber,
        dateOfBirth,
      } = validatedBody;
      const { otp, expirationTime } = commonFunction.otpGenerator();

      validatedBody.otp = otp;
      validatedBody.otpExpireTime = expirationTime;
      let pass = bcrypt.hashSync(validatedBody.password, 10);

      const user = await checkUserExists(email, mobileNumber);

      if (user) {
        if (user.status === "blocked") {
          return res.status(403).send({
            responseCode: 403,
            message: "You are blocked by admin.",
          });
        } else if (user.isVerified === true) {
          if (user.mobileNumber === mobileNumber) {
            return res.status(409).send({
              responseCode: 409,
              message: "Mobile number is already registered.",
            });
          } else if (user.email === email) {
            return res.status(409).send({
              responseCode: 409,
              message: "Email is already registered.",
            });
          }
        } else if (user.isVerified === false) {
          await commonFunction.sendMail(email, validatedBody.otp);
          await updateUserById(
            { _id: user._id },
            {
              $set: {
                otp: validatedBody.otp,
                otpExpireTime: validatedBody.otpExpireTime,
              },
            }
          );
          return res.status(200).send({
            responseCode: 200,
            message: "OTP has been sent. Please verify your email.",
          });
        } else {
          return res.status(409).send({
            responseCode: 409,
            message: "User already exists.",
          });
        }
      }
      await commonFunction.sendMail(email, "otp", otp);

      let obj = {
        email: email,
        password: pass,
        dateOfBirth: dateOfBirth,
        mobileNumber: mobileNumber,
        firstName: firstName,
        lastName: lastName,
        otp: otp,
        expirationTime: expirationTime,
      };
      const result = await createUser(obj);
      return res.status(201).send({
        responseCode: 201,
        message: "User created successfully. Please verify your email.",
        data: result,
      });
    } catch (error) {
      console.log("Error", error);
      return res
        .status(500)
        .send({ responseCode: 500, message: "Something went wrong.", error });
    }
  },

  async otpVerification(req, res) {
    const fields = Joi.object({
      email: Joi.string().required(),
      otp: Joi.number().required(),
    });
    try {
      const validate = await fields.validateAsync(req.body);
      const { email, otp } = validate;
      const userResult = await findUser(email);

      if (!userResult) {
        return res
          .status(404)
          .send({ responseCode: 404, responseMessage: "User not found." });
      }

      if (userResult.isVarified == true) {
        return res.status(409).send({
          responseCode: 409,
          responseMessage: "OTP already verified.",
        });
      }

      if (userResult.otpExpireTime < Date.now()) {
        return res
          .status(400)
          .send({ responseCode: 400, responseMessage: "OTP expired." });
      }

      if (userResult.otp !== otp) {
        return res
          .status(400)
          .send({ responseCode: 400, responseMessage: "Incorrect OTP." });
      }

      const updateOtp = await updateUserById(
        { _id: userResult._id },
        { $set: { isVarified: true, otp: "" } }
      );

      return res.status(200).send({
        responseCode: 200,
        responseMessage: "OTP verified.",
        data: updateOtp,
      });
    } catch (error) {
      console.error("Error:", error);
      return res.status(500).send({
        responseCode: 500,
        responseMessage: "Internal server error.",
      });
    }
  },

  async resendOtp(req, res) {
    const schema = Joi.object({
      email: Joi.string().email().required(),
    });

    try {
      const { email } = await schema.validateAsync(req.body);

      const userResult = await findUser(email);
      if (!userResult) {
        return res.status(404).send({
          responseCode: 404,
          responseMessage: "User not found.",
        });
      }

      //  if the user is already verified
      if (userResult.isVarified == true) {
        return res.status(409).send({
          responseCode: 409,
          responseMessage: "OTP already verified.",
        });
      }

      const { otp, expirationTime } = commonFunction.otpGenerator();
      await commonFunction.sendMail(email, `Your resend otp.`, otp);

      await updateUserById(
        { _id: userResult._id },
        { $set: { otp: otp, expirationTime: expirationTime } }
      );

      return res.status(200).send({
        responseCode: 200,
        responseMessage: "OTP has been resent successfully.",
      });
    } catch (error) {
      console.error("Error:", error);
      return res.status(500).send({
        responseCode: 500,
        responseMessage: "Internal server error.",
      });
    }
  },

  async login(req, res) {
    const fields = Joi.object({
      email: Joi.string().required(),
      password: Joi.string().required(),
    });

    try {
      const validate = await fields.validateAsync(req.body);
      const { email, password } = validate;

      const user = await checkUserExists(email);
      
      if (!user) {
        return res
          .status(404)
          .send({ responseCode: 404, responseMessage: "user not found." });
      }

      if (user.status === "blocked" || user.status === "deleted") {
        return res.status(401).send({
          responseCode: 401,
          responseMessage: "Unauthorized. Account is blocked or deleted.",
        });
      }

      const compare = await bcrypt.compare( password,user.password);
      if (!compare) {
        return res.status(401).send({
          responseCode: 401,
          responseMessage: "Incorrect password.",
        });
      }

      if (user.isVarified == false) {
        return res.status(403).send({
          responseCode: 403,
          responseMessage: "Please verify your account.",
        });
      }

      //JWT token
      const token = await commonFunction.getToken({
        _id: user._id,
        userType: user.userType,
      });
      return res.status(200).send({
        responseCode: 200,
        responseMessage: "Login successful.",
        token: token,
      });
    } catch (error) {
      console.log("Error :", error);
      return res.status(500).send({
        responseCode: 500,
        responseMessage: "Something went wrong.",
      });
    }
  },

  async resetPassword(req, res) {
    const fields = Joi.object({
      oldPassword: Joi.string().required(),
      newPassword: Joi.string().required(),
      confirmNewPassword: Joi.string().required(),
    });
    try {
      const validate = await fields.validateAsync(req.body);
      const { oldPassword, newPassword, confirmNewPassword } = validate;

      const user = await findUserById({ _id: req.userId });
      if (!user) {
        return res.status(404).send({
          responseCode: 404,
          responseMessage: "User not found.",
        });
      }

      // Check if the old password matches
      const isPasswordValid = await bcrypt.compare(oldPassword, user.password);
      if (isPasswordValid == false) {
        return res.status(400).send({
          responseCode: 400,
          responseMessage: "Invalid old password.",
        });
      }

      if (newPassword !== confirmNewPassword) {
        return res.status(400).send({
          responseCode: 400,
          responseMessage:
            "New password and confirm new password do not match.",
        });
      }

      const hashedPassword = bcrypt.hashSync(newPassword, 10);

      await updateUserById(
        { _id: user._id },
        { $set: { password: hashedPassword } }
      );

      // Send success response
      return res.status(200).send({
        responseCode: 200,
        responseMessage: "Password changed successfully.",
      });
    } catch (error) {
      console.log("Error :", error);
      return res
        .status(500)
        .send({ responseCode: 500, responseMessage: "Something went wrong." });
    }
  },

  async getProfile(req, res) {
    try {
      const userDetail = await findUserById({ _id: req.userId });
      if (!userDetail) {
        return res.status(404).send({
          responseCode: 404,
          responseMessage: "User not found.",
        });
      }
      return res.status(200).send({
        responseCode: 200,
        responseMessage: "User details retrieved successfully.",
        data: userDetail,
      });
    } catch (error) {
      console.error("Error retrieving user profile:", error);
      return res.status(500).send({
        responseCode: 500,
        responseMessage: "Something went wrong. Please try again.",
      });
    }
  },

  async userEditProfile(req, res) {
    const fields = Joi.object({
      firstName: Joi.string().min(2).max(30).optional(),
      lastName: Joi.string().min(3).max(10).optional(),
      email: Joi.string().optional(),
      password: Joi.string().optional(),
      mobileNumber: Joi.string()
        .length(10)
        .pattern(/^[0-9]+$/)
        .optional(),

      dateOfBirth: Joi.string().optional(),
    });

    try {
      const validate = await fields.validateAsync(req.body);

      const {
        email,
        mobileNumber,
        password,
        firstName,
        lastName,
        dateOfBirth,
      } = validate;

      const userDetail = await findUserById(req.userId);
      if (!userDetail) {
        return res.status(404).send({
          responseCode: 404,
          responseMessage: "User not found.",
        });
      }

      if (password) {
        const hashedPassword = bcrypt.hashSync(password, 10);
        await updateUserById(
          { _id: userDetail._id },
          { $set: { password: hashedPassword } }
        );
      }

      //  email and mobile number update
      if (email || mobileNumber) {
        const query = {
          $and: [
            {
              $or: [{ email }, { mobileNumber }],
            },
            {
              _id: { $ne: userDetail._id },
            },
          ],
        };

        const conflictUser = await find(query);
        if (conflictUser) {
          if (conflictUser.email === email) {
            return res.status(409).send({
              responseCode: 409,
              responseMessage: "Email already exists.",
            });
          }
          if (conflictUser.mobileNumber === mobileNumber) {
            return res.status(409).send({
              responseCode: 409,
              responseMessage: "Mobile number already exists.",
            });
          }
        }

        const updateFields = {};
        if (email) updateFields.email = email;
        if (mobileNumber) updateFields.mobileNumber = mobileNumber;

        await updateUserById({ _id: userDetail._id }, { $set: updateFields });
      }

      // Update other user fields
      const updateData = {};
      if (firstName) updateData.firstName = firstName;
      if (lastName) updateData.lastName = lastName;
      if (dateOfBirth) updateData.dateOfBirth = dateOfBirth;

      const updatedUser = await updateUserById(
        { _id: userDetail._id },
        { $set: updateData }
      );

      return res.status(200).send({
        responseCode: 200,
        responseMessage: "Profile updated successfully.",
        data: updatedUser,
      });
    } catch (error) {
      console.log("Error:", error);
      return res.status(500).send({
        responseCode: 500,
        responseMessage: "Something went wrong.",
      });
    }
  },

  async userDelete(req, res) {
    try {
      const userDetail = await findUserById({ _id: req.userId });
      if (!userDetail) {
        return res.status(404).send({
          responseCode: 404,
          responseMessage: "User not found.",
        });
      }
      await findIdAndDelete({ _id: userDetail._id });
      return res.status(200).send({
        responseCode: 200,
        responseMessage: "User profile deleted successfully.",
      });
    } catch (error) {
      console.log("Error:", error);
      return res.status(500).send({
        responseCode: 500,
        responseMessage: "Something went wrong.",
      });
    }
  },

  //admin opration only

  async getAllUser(req, res) {
    try {
      const user = req.userId;

      const admin = await findAdmin({
        _id: user,
        userType: "admin",
      });
      if (!admin) {
        return res.status(403).send({
          responseCode: 403,
          responseMessage: "Unothorized, only accessible for admin.",
        });
      }

      const allUsers = await findAll({
        userType: { $ne: "admin" },
        status: { $ne: "delete" },
      });
      return res.status(200).send({
        responseCode: 200,
        responseMessage: "Users fetched successfully.",
        users: allUsers,
      });
    } catch (error) {
      console.log("Error:", error);
      return res.status(500).send({
        responseCode: 500,
        responseMessage: "Something went wrong.",
      });
    }
  },

  async searchUsers(req, res) {
    const schema = Joi.object({
      status: Joi.string().valid("active", "blocked", "deleted").optional(),
      email: Joi.string().email().optional(),
      id: Joi.string().optional(),
      phoneNumber: Joi.string()
        .pattern(/^\d{10}$/)
        .optional(),
    });
    try {
      const validate = await schema.validateAsync(req.query);
      const { status, email, id, phoneNumber } = validate;
      const adminId = req.userId;

      const admin = await findAdmin({ _id: adminId, userType: "admin" });
      if (!admin) {
        return res.status(403).send({
          responseCode: 403,
          responseMessage:
            "Unauthorized access. Only admins can perform this action.",
        });
      }

      let query = {};
      if (status) query.status = status;
      if (email) query.email = email;
      if (id) query._id = id;
      if (phoneNumber) query.phoneNumber = phoneNumber;

      if (Object.keys(query).length === 0) {
        return res.status(400).send({
          responseCode: 400,
          responseMessage:
            "At least one search parameter (status, email, id, phoneNumber) is required.",
        });
      }

      const users = await findAll(query);
      if (users.length === 0) {
        return res.status(404).send({
          responseCode: 404,
          responseMessage: "No users found .",
        });
      }

      return res.status(200).send({
        responseCode: 200,
        responseMessage: "Search results.",
        data: users,
      });
    } catch (error) {
      console.error("Error in searchUsers:", error);
      return res.status(500).send({
        responseCode: 500,
        responseMessage: "Something went wrong.",
      });
    }
  },

  async deleteAllUser(req, res) {
    try {
      const user = req.userId;

      const admin = await findAdmin({
        _id: user,
        userType: "admin",
      });
      if (!admin) {
        return res.status(403).send({
          responseCode: 403,
          responseMessage: "Unothorized, only accessible for admin.",
        });
      }
      let result = await deleteAll({ userType: "student" });
      return res.status(200).send({
        responseCode: 200,
        responseMessage: "Opration successfull.",
        deletedUsers: result.deletedCount,
      });
    } catch (error) {
      console.log("Error:", error);
      return res.status(500).send({
        responseCode: 500,
        responseMessage: "Something went wrong.",
      });
    }
  },

  async deleteById(req, res) {
    try {
      const user = req.userId;
      const id = req.params.id;
      if (!id) {
        return res
          .status(400)
          .send({ responseCode: 400, responseMessage: "ID is required." });
      }

      if (!mongoose.isValidObjectId(id)) {
        return res
          .status(400)
          .send({ responseCode: 400, responseMessage: "Invalid ID format." });
      }

      const admin = await findAdmin({ _id: user, userType: "admin" });
      if (!admin) {
        return res.status(403).send({
          responseCode: 403,
          responseMessage: "Unauthorized, only accessible for admin.",
        });
      }

      const userToDelete = await findUserById({ _id: id, userType: "student" });
      if (!userToDelete) {
        return res.status(404).send({
          responseCode: 404,
          responseMessage: "User not found.",
        });
      }

      await findIdAndDelete({ _id: id });
      return res.status(200).send({
        responseCode: 200,
        responseMessage: "Operation successful. User deleted.",
      });
    } catch (error) {
      console.error("Error:", error);
      return res.status(500).send({
        responseCode: 500,
        responseMessage: "Something went wrong.",
      });
    }
  },

  async updateUserStatus(req, res) {
    const statusSchema = Joi.object({
      status: Joi.string().valid("active", "deleted", "blocked").required(),
      id: Joi.string().required(),
    });

    try {
      const validate = await statusSchema.validateAsync(req.body);
      const { status, id } = validate;
      const user = req.userId;
      const admin = await findAdmin({ _id: user, userType: "admin" });
      if (!admin) {
        return res.status(403).send({
          responseCode: 403,
          responseMessage: "Unauthorized, only accessible for admin.",
        });
      }

      const userToUpdate = await findUserById(id);
      if (!userToUpdate) {
        return res.status(404).send({
          responseCode: 404,
          responseMessage: "User not found.",
        });
      }
      await updateUserById({ _id: id }, { $set: { status: status } });
      return res.status(200).send({
        responseCode: 200,
        responseMessage: "User status updated successfully.",
      });
    } catch (error) {
      console.error("Error:", error);
      return res.status(500).send({
        responseCode: 500,
        responseMessage: "Something went wrong.",
      });
    }
  },
};

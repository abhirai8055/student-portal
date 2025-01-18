const commonFunction = require("../utils/common");
const applicationServices = require("./services/applicationServices");
const Joi = require("joi");
const jwt = require("jsonwebtoken");
const userServices = require("./services/UserServices");

const {
  checkApplicationExists,
  createApplication,
  findApplication,
  findApplicationById,
  updateApplication,
  findAllApplications,
  deleteApplicationById,
  deleteApplications,
  findAll,
} = applicationServices;
const { findAdmin } = userServices;
  
module.exports = {
  async submitApplication(req, res) {
    const schema = Joi.object({
      applicationName: Joi.string().required(),
      description: Joi.string().optional(),
    });

    try {
      const validate = await schema.validateAsync(req.body);
      const { applicationName, description } = validate;
      const userId = req.userId;
      const existingApplication = await checkApplicationExists(
        userId,
        applicationName
      );

      if (existingApplication) {
        return res.status(409).send({
          responseCode: 409,
          responseMessage: "Application already exists for this user.",
        });
      }

      const newApplication = await createApplication({
        studentId: userId,
        applicationName,
        description,
      });

  //sending mail confirmation mail.
  await commonFunction.sendMail(
    userId.email,
    "Application submitted",
    `Hello ${userId.firstName},\n\nYour application  has been submitted.`
  );
      return res.status(201).send({
        responseCode: 201,
        responseMessage: "Application submitted successfully.",
        application: newApplication,
      });
    } catch (error) {
      console.error("Error in submitApplication:", error);
      return res.status(500).send({
        responseCode: 500,
        responseMessage: "Something went wrong.",
      });
    }
  },

  async getMyApplications(req, res) {
    try {
      const studentId = req.userId;
      const applications = await findApplication({ studentId: studentId });

      if (!applications) {
        return res.status(404).send({
          responseCode: 404,
          responseMessage: "No applications found.",
        });
      }

      return res.status(200).send({
        responseCode: 200,
        responseMessage: "Applications retrieved successfully.",
        applications,
      });
    } catch (error) {
      console.error("Error fetching applications:", error);
      return res.status(500).send({
        responseCode: 500,
        responseMessage: "Something went wrong.",
      });
    }
  },

  async updateApplication(req, res) {
    const schema = Joi.object({
      description: Joi.string().optional(),
      applicationId: Joi.string().required(),
    });
    try {
      const validate = await schema.validateAsync(req.body);
      const { description, applicationId } = validate;
      const userId = req.userId;
      const application = await updateApplication(
        { _id: applicationId, studentId: userId },
        { $set: { description: description } }
      );
      if (!application) {
        return res.status(404).send({
          responseCode: 404,
          responseMessage: "Application not found or not authorized to update.",
        });
      }
      return res.status(200).send({
        responseCode: 200,
        responseMessage: "Application updated successfully.",
        application,
      });
    } catch (error) {
      console.error("Error updating application:", error);
      return res.status(500).send({
        responseCode: 500,
        responseMessage: "Something went wrong.",
      });
    }
  },

  async deleteApplication(req, res) {
    const schema = Joi.object({
      applicationId: Joi.string().required(),
    });
    try {
      const validate = await schema.validateAsync(req.params);
      const { applicationId } = validate;
      const userId = req.userId;
      await deleteApplicationById({ _id: applicationId });

      return res.status(200).send({
        responseCode: 200,
        responseMessage: "Application deleted successfully.",
      });
    } catch (error) {
      console.error("Error:", error);
      return res.status(500).send({
        responseCode: 500,
        responseMessage: "Something went wrong.",
      });
    }
  },

  // admin
  async filterApplications(req, res) {
    const schema = Joi.object({
      status: Joi.string()
        .valid("Submitted", "Reviewed", "Approved", "Rejected")
        .optional(),
      applicationName: Joi.string().optional(),
      studentId: Joi.string().optional(),
    });
    try {
      const validate = await schema.validateAsync(req.body);

      const { status, applicationName, studentId } = validate;
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
      const query = {};
      if (status) query.status = status;
      if (applicationName)
        query.applicationName = { $regex: applicationName, $options: "i" };
      if (studentId) query.studentId = studentId;

      const applications = await findAll(query).populate(
        "studentId",
        "fullName email"
      );
      if (applications.length <= 0) {
        return res.status(404).send({
          responseCode: 404,
          responseMessage: "No applications found with the provided filters.",
        });
      }

      return res.status(200).send({
        responseCode: 200,
        responseMessage: "Applications retrieved successfully.",
        data: applications,
      });
    } catch (error) {
      console.error("Error in filterApplications:", error);
      return res.status(500).send({
        responseCode: 500,
        responseMessage: "Something went wrong.",
      });
    }
  },

  async updateApplicationStatus(req, res) {
    const schema = Joi.object({
      applicationId: Joi.string().required(),
      status: Joi.string()
        .valid("Submitted", "Reviewed", "Approved", "Rejected")
        .required(),
    });

    try {
      const validatedBody = await schema.validateAsync(req.body);
      const { applicationId, status } = validatedBody;

      const application = await findApplication({
        _id: applicationId,
      }).populate("studentId");

      if (!application) {
        return res.status(404).send({
          responseCode: 404,
          message: "Application not found.",
        });
      }

      application.status = status;
      application.reviewedAt = new Date();
      await application.save();

      const student = application.studentId;

      if (!student) {
        return res.status(404).send({
          responseCode: 404,
          message: "Student associated with the application not found.",
        });
      }
      await commonFunction.sendMail(
        student.email,
        "Application Status Update",
        `Hello ${student.firstName},\n\nYour application status has been updated to: ${status}.\n\nBest regards,\nYour Application Portal Team`
      );

      return res.status(200).send({
        responseCode: 200,
        message: "Application status updated and notification sent.",
      });
    } catch (error) {
      console.error("Error:", error);
      return res.status(500).send({
        responseCode: 500,
        message: "Something went wrong.",
        error: error.message,
      });
    }
  },

  async getAllApplications(req,res){
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
          status: { $ne: "Rejected" },
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
    
  }
};

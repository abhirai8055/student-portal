const applicationModel = require("../../models/applicationModel");

const applicationServices = {
  checkApplicationExists: async (studentId, applicationName) => {
    const query = {
      $and: [
        { studentId: studentId },
        { applicationName: applicationName },
      ],
    };
    return await applicationModel.findOne(query);
  },

  createApplication: async (insertObj) => {
    return await applicationModel.create(insertObj);
  },
 
  findApplication: async (query) => {
    return await applicationModel.findOne(query);
  },

  findApplicationById: async (id) => {
    return await applicationModel.findOne({ _id: id});
  },

  updateApplication: async (query, updateObj) => {
    return await applicationModel.findOneAndUpdate(query, updateObj, {
      new: true,
    });
  },

  findAllApplications: async (query) => {
    return await applicationModel
      .find(query)
      .populate("studentId", "fullName email");
  },

  deleteApplicationById: async (id) => {
    return await applicationModel.findByIdAndDelete(id);
  },

  deleteApplications: async (query) => {
    return await applicationModel.deleteMany(query);
  },
  findAll: async(query)=>{
    return await applicationModel.find(query)
  }
};

module.exports = applicationServices;

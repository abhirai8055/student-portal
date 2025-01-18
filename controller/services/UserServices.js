const userModel = require("../../models/studentModel");
const userServices = {
  checkUserExists: async (email, mobileNumber) => {
    let query = {
      $and: [
        { status: { $ne: "deleted" } },
        { $or: [{ email: email }, { mobileNumber: mobileNumber }] },
      ],
    };
    return await userModel
      .findOne(query)
      
  },
  createUser: async (insertObj) => {
    return await userModel.create(insertObj);
  },
  findUser: async (email) => {
    return await userModel.findOne({
      $and: [{ email: email }, { status: { $ne: "deleted" } }],
    });
  },
  find: async (query) => {
    return await userModel.findOne(query);
  },
  findUserById: async (id) => {
    return await userModel
      .findOne({ $and: [{ _id: id }, { status: { $ne: "deleted" } }] })
      .select("firstName lastName email mobileNumber dateOfBirth userType");
  },
  updateUserById: async (query, obj) => {
    return await userModel.findByIdAndUpdate(query, obj, { new: true });
  },
  findAll: async () => {
    return await userModel.find();
  },
  findAdmin: async (query) => {
    return await userModel.findOne(query);
  },
  findIdAndDelete: async (query) => {
    return await userModel.findByIdAndDelete(query);
  },
  deleteAll: async (query) => {
    return await userModel.deleteMany(query);
  },
};
module.exports = userServices;

const { model, Schema } =require("mongoose") ;
const mongoose =require("mongoose") ;
const applications = Schema(
    {
        studentId: {
          type: mongoose.Types.ObjectId,
          ref: 'Student',
          required: true, 
        },
        applicationName: {
          type: String,
          required: true,
        },
        description: {
          type: String,
        },
        status: {
          type: String,
          enum: ['Submitted', 'Reviewed', 'Approved', 'Rejected'], 
          default: 'Submitted',
        },
        reviewedAt: {
          type: Date,
        },
      },
      {
        timestamps: true, 
      }
);
module.exports = model("application", applications, "application");

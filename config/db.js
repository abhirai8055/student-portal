const mongoose = require("mongoose");
const connectDB = async () => {
  try {
    await mongoose.connect(`mongodb://${process.env.DATABASE_HOST}:${process.env.DATABASE_PORT}/${process.env.DATABASE_NAME}`);
    console.log("DB is connected successfully.");
  } catch (err) {
    console.error("Error while connecting to MongoDB", err);
  }
};
connectDB();
    
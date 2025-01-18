require("dotenv").config();
const express = require("express");
const app = express();

require("./config/db");


const student = require("./routes/studentRoutes");
const application = require("./routes/applicationRoutes");

// Middleware to parse JSON request body
app.use(express.json());


app.use("/api/student", student); 
app.use("/api/application", application);

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

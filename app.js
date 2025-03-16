if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const app = express();
const DB_URL = process.env.DB_URL;

// MongoDB Atlas connection
async function connectDB() {
  try {
    await mongoose.connect(DB_URL);
    console.log("Database connection successful");
  } catch (error) {
    console.error("Database connection error:", error);
    process.exit(1);
  }
}

connectDB();

// Configure middleware
app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Faculty Schema with unique access code
const facultySchema = new mongoose.Schema({
  name: { type: String, required: true },
  department: { type: String, required: true },
  designation: { type: String, required: true },
  phone: { type: String, required: true },
  accessCode: { type: String, required: true, unique: true },
});

const Faculty = mongoose.model("FacultyAccess", facultySchema);

// Routes
app.get("/", (req, res) => {
  res.redirect("/add-faculty");
});

app.get("/add-faculty", (req, res) => {
  res.render("add-faculty", { error: null });
});

app.post("/add-faculty", async (req, res) => {
  try {
    const existingFaculty = await Faculty.findOne({
      accessCode: req.body.accessCode,
    });
    if (existingFaculty) {
      return res.render("add-faculty", {
        error: "Access code already exists. Please use a different code.",
        formData: req.body,
      });
    }

    const faculty = new Faculty(req.body);
    await faculty.save();
    res.redirect("/list-faculty");
  } catch (err) {
    res.render("add-faculty", {
      error: "Error adding faculty. Please try again.",
      formData: req.body,
    });
  }
});

app.get("/list-faculty", async (req, res) => {
  try {
    const faculties = await Faculty.find({});
    res.render("list-faculty", { faculties });
  } catch (err) {
    res.status(500).send(err);
  }
});

app.put("/update-faculty/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Check for duplicate access code
    const existingFaculty = await Faculty.findOne({
      accessCode: updateData.accessCode,
      _id: { $ne: id }
    });

    if (existingFaculty) {
      return res.status(400).json({
        success: false,
        message: "Access code already exists"
      });
    }

    // Update faculty with proper validation
    const updatedFaculty = await Faculty.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedFaculty) {
      return res.status(404).json({
        success: false,
        message: "Faculty not found"
      });
    }

    res.json({ 
      success: true,
      faculty: updatedFaculty
    });
  } catch (err) {
    res.status(500).json({ 
      success: false, 
      message: err.message 
    });
  }
});

app.delete("/delete-faculty/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid faculty ID" 
      });
    }

    const result = await Faculty.findByIdAndDelete(id);
    
    if (!result) {
      return res.status(404).json({ 
        success: false, 
        message: "Faculty not found" 
      });
    }

    res.json({ 
      success: true,
      message: "Faculty deleted successfully"
    });
  } catch (err) {
    console.error("Delete error:", err);
    res.status(500).json({ 
      success: false, 
      message: err.message 
    });
  }
});

app.get("*", (req, res) => {
  res.redirect("/list-faculty");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
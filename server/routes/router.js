const express = require("express");
const route = express.Router();
const Entry = require("../model/entry");

// assigning variable to the JSON file
const gradeSelection = require("../model/grades.json");

// assigning variables to the JSON files
const commArtsClasses = require("../model/commArtsClasses.json");
const cteClasses = require("../model/cteClasses.json");
const fineArtsClasses = require("../model/fineArtsClasses.json");
const historyClasses = require("../model/historyClasses.json");
const languageClasses = require("../model/languageClasses.json");
const mathClasses = require("../model/mathClasses.json");
const scienceClasses = require("../model/scienceClasses.json");
const wellnessClasses = require("../model/wellnessClasses.json");

// pass a path (e.g., "/") and a callback function to the get method
//  when the client makes an HTTP GET request to the specified path,
//  the callback function is executed
route.get("/", async (req, res) => {
  // the req parameter references the HTTP request object, which has
  //  a number of properties
  console.log("path: ", req.path);

  const entries = await Entry.find();

  // convert MongoDB objects to objects formatted for the EJS template
  const formattedEntries = entries.map((entry) => {
    return {
      id: entry._id,
      date: entry.date.toLocaleDateString(),
      habit: entry.habit,
      content: entry.content.slice(0, 20) + "...",
    };
  });

  // the res parameter references the HTTP response object
  res.render("index", { entries: formattedEntries });
});

route.post("/createEntry", async (req, res) => {
  const entry = new Entry({
    // When the time zone offset is absent, date-only forms are interpreted as
    //  a UTC time and date-time forms are interpreted as a local time. We want
    //  the date object to reflect local time; so add a time of midnight.
    date: new Date(req.body.date + "T00:00:00"),
    email: req.session.email,
    habit: req.body.habit,
    content: req.body.content,
  });
  await entry.save();

  res.status(201).end();
});

// route to render classes, grades
route.get("/tutHome", (req, res) => {
  res.render("tutHome", {
    commArtsClasses,
    cteClasses,
    fineArtsClasses,
    grades: gradeSelection,
    historyClasses,
    languageClasses,
    mathClasses,
    scienceClasses,
    wellnessClasses,
  });
});

// route to student home page
route.get("/stuHome", async (req, res) => {
  res.render("stuHome");
});

// route to tutor leader home page
route.get("/leadHome", async (req, res) => {
  res.render("leadHome");
});

// route to teacher home page
route.get("/teachHome", async (req, res) => {
  res.render("teachHome");
});

// rout to admin home page
route.get("/adminHome", async (req, res) => {
  res.render("adminHome");
});

// delegate all authentication to the auth.js router
route.use("/auth", require("./auth"));

module.exports = route;

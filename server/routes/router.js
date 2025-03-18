const express = require("express");
const route = express.Router();
const Entry = require("../model/entry");
const Session = require("../model/session"); // Import the Session schema
const Tutor = require("../model/tutor"); // Import the Tutor schema

// assigning variable to the JSON file
const gradeSelection = require("../model/grades.json");

const newReturningOptions = require("../model/newReturningOptions.json");
const lunchPeriods = require("../model/lunchPeriods.json");
const daysOfTheWeek = require("../model/daysOfTheWeek.json");

// assigning variables to the JSON files
const courseList = require("../model/courseList.json");

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
  res.render("tutHome");
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

// route to admin home page
route.get("/adminHome", async (req, res) => {
  res.render("adminHome");
});

// route to expertise form page
route.get("/expertiseForm", async (req, res) => {
  res.render("expertiseForm", {
    grades: gradeSelection,
    options: newReturningOptions,
    lunchPeriods,
    daysOfTheWeek,
    courseList,
  });
});

// delegate all authentication to the auth.js router
route.use("/auth", require("./auth"));

// Route to render the tutor form
route.get("/tutorForm", async (req, res) => {
  res.render("tutorForm");
});

// Route to handle tutor form submission
route.post("/submitTutorForm", async (req, res) => {
  try {
    console.log(req.body);
    const newSession = new Session({
      tutorFirstName: req.body.tutorFirstName,
      tutorLastName: req.body.tutorLastName,
      tutorID: req.body.tutorID,
      sessionDate: req.body.sessionDate,
      sessionPeriod: req.body.sessionPeriod,
      sessionPlace: req.body.sessionPlace,
      subject: req.body.subject,
      class: req.body.class,
      teacher: req.body.teacher,
      focusOfSession: req.body.focusOfSession,
      workAccomplished: req.body.workAccomplished,
      tuteeFirstName: req.body.tuteeFirstName,
      tuteeLastName: req.body.tuteeLastName,
      tuteeID: req.body.tuteeID,
      tuteeGrade: req.body.tuteeGrade,
    });
    await newSession.save();
    res.json({ success: true });
  } catch (error) {
    console.error("Error saving session:", error);
    res.status(500).json({ success: false, error: "Failed to save session" });
  }
});

// Route to render the expertise form
route.get("/expertiseForm", async (req, res) => {
  res.render("expertiseForm");
});

// Route to handle expertise form submission
route.post("/submitExpertiseForm", async (req, res) => {
  try {
    console.log(req.body);
    const newTutor = new Tutor({
      tutorFirstName: req.body.tutorFirstName,
      tutorLastName: req.body.tutorLastName,
      tutorID: req.body.tutorID,
      email: req.body.email,
      grade: req.body.grade,
      returning: req.body.returning,
      lunchPeriod: req.body.lunchPeriod,
      daysAvailable: req.body.daysAvailable,
      classes: req.body.classes,
      tutorLeader: req.body.tutorLeader,
      attendance: req.body.attendance,
      sessionHistory: req.body.sessionHistory,
    });
    await newTutor.save();
    res.json({ success: true });
  } catch (error) {
    console.error("Error saving expertise sheet:", error);
    res
      .status(500)
      .json({ success: false, error: "Failed to save expertise sheet" });
  }
});

route.get("/tutorTable", async (req, res) => {
  try {
    const tutors = await Tutor.find().sort({ date: -1 });

    // Convert MongoDB objects to objects formatted for the EJS template
    const tutorsFormatted = tutors.map((tutor) => {
      return {
        tutorName: `${tutor.tutorFirstName} ${tutor.tutorLastName}`,
        date: tutor.date,
        grade: tutor.grade,
        tutorID: tutor.tutorID,
        classes: Array.isArray(tutor.classes) ? tutor.classes : [],
        daysAvailable: Array.isArray(tutor.daysAvailable)
          ? tutor.daysAvailable
          : [],
        lunchPeriod: tutor.lunchPeriod,
        totalSessions: tutor.sessionHistory.length,
      };
    });

    res.render("tutorTable", { tutors: tutorsFormatted });
  } catch (error) {
    console.error("Error fetching tutors:", error);
    res.status(500).send("Error fetching tutors");
  }
});

route.get("/sessionTable", async (req, res) => {
  try {
    const sessions = await Session.find().sort({ date: -1 });

    // Convert MongoDB objects to objects formatted for the EJS template
    const sessionsFormatted = sessions.map((session) => {
      return {
        date: session.sessionDate
          ? new Date(session.sessionDate).toLocaleDateString("en-US", {
              timeZone: "UTC",
            })
          : null,
        tuteeName: `${session.tuteeFirstName} ${session.tuteeLastName}`,
        tuteeID: session.tuteeID,
        tutorName: `${session.tutorFirstName} ${session.tutorLastName}`,
        subject: session.subject,
        class: session.class,
        assignment: session.workAccomplished,
      };
    });

    res.render("sessionTable", { sessions: sessionsFormatted });
  } catch (error) {
    console.error("Error fetching sessions:", error);
    res.status(500).send("Error fetching tutors");
  }
});

module.exports = route;

// Route to render the attendance
const router = express.Router();

// Route to render the attendance
router.get("/attendance", async (req, res) => {
  try {
    const tutors = await Tutor.find(); // Fetch the tutors data from the database
    res.render("attendance", { tutors }); // Pass the tutors data to the template
  } catch (error) {
    console.error("Error fetching tutors:", error);
    res.status(500).send("Error fetching tutors");
  }
});

module.exports = router;

// Data structure holding subjects, classes, and teachers
const coursesData = {
  Math: {
    classes: [
      "Survey of Math Topics",
      "Algebra 1",
      "Blended Algebra 1",
      "Algebra 1 Support",
      "Algebra 1 w/ Geometry",
      "Geometry Core",
      "Geometry in Construction",
      "Geometry",
      "Blended Geometry",
      "Online Geometry",
      "Honors Geometry",
      "Algebra 2 core",
      "Algebra 2",
      "Blended Algebra 2",
      "Honors Algebra 2",
      "Quantitative Literacy and Statistics",
      "AP Statistics",
      "Business Precalculus",
      "Blended Business Precalculus",
      "Precalculus",
      "Blended Precalculus",
      "Honors Precalculus",
      "AP Calculus AB",
      "AP Calculus BC",
      "Multivariable Calculus",
      "Multivariable Calculus w/Lin Algebra",
      "STEM Capstone-Blended Learning",
    ],
    teachers: [
      "Jesus Aguilar",
      "Maggie Ambrose",
      "Katie Appenzeller",
      "Paul Becvar",
      "Lynette Christenson",
      "Will DeBolt",
      "Hannah Dufour",
      "Billy Ellinghaus",
      "Justin Hunniford",
      "Jessica John",
      "Jong Ho Kim",
      "Jeanette Martinez",
      "Margaret Molenda Lesniak",
      "Liz Moore",
      "Megan Murphy",
      "Katherine Papagiannis",
      "Howard Phelan",
      "Faith Reinlock",
      "Nicholas Rohl",
      "Justin Rubo",
      "Tracy Thomson",
      "Erin Truesdale",
      "Matthew Van",
      "Ritu Wilson",
      "Anne Zinzer",
    ],
  },
  English: {
    classes: [
      "Comm arts",
      "English 1",
      "English 2",
      "English 2: Journalism",
      "English 3",
      "American Studies",
      "Honors English 1",
      "Honors English 2",
      "Honors English 2: Journalism",
      "Honors English 3",
      "AP Language and Composition",
      "Honors Senior Rhetoric",
      "Blended Honors Senior Rhetoric",
      "English Literature",
      "Themes in Western Literature and Art",
      "AP Literature and Composition",
      "Blended AP Literature and Composition",
      "20th Century Literature",
      "Blended 20th-Century Literature",
      "World Literature",
      "Traditions in Communication",
      "Writing Styles and Forms",
      "Senior Rhetoric",
      "Blended Senior Rhetoric",
      "Creative Writing",
      "Blended Creative Writing",
      "Literary Themes",
      "Blended Literary Themes",
      "Blended African American Literature",
      "Special Topics in Literature",
      "Speech Communication",
      "Advanced Speech",
      "Film as Literature",
      "Blended Film Production",
      "Mass Media",
      "Blended Yearbook Production",
      "Blended Advanced Media Lab",
    ],
    teachers: [
      "Sean Adams",
      "Wanjugu Bukusi",
      "Patrick Burns",
      "Gino Campise",
      "Jenni Johnson",
      "Steve Madden",
      "Mitch Martin",
      "Tina Mazzaferro",
      "Dani Moravec",
      "Brian Nierman",
      "Sandy Parato Toczylowski",
      "Thomas Parry",
      "Mike Pearson",
      "Elizabeth Skopec",
      "Ryan Smith",
      "Matt Sniadecki",
      "Brian South",
      "Chris Stanicek",
      "Candace Thurmon",
      "Greta Williams",
      "Christy Wingle",
    ],
  },
  CTE: {
    classes: [
      "Accounting 1",
      "Advanced Web Page Design",
      "Advertising",
      "AP Computer Science A",
      "Blended Advanced Marketing",
      "Blended Business ACCELeratoredu",
      "Blended Consumer Economics",
      "Blended Introduction to Business",
      "Blended Software Engineering 2",
      "Blended STEM Inquiry & Research Capstone",
      "Business INCubatoredu",
      "Business Law",
      "Computer Programming 1",
      "Computer Programming 2",
      "Consumer Economics",
      "Game Design",
      "Health Occupations",
      "Honors College Accounting",
      "International Business",
      "Introduction to Business",
      "Introduction to Health Occupations",
      "Marketing",
      "Online Consumer Economics",
      "Software Engineering 1",
      "Tech Edge",
      "Tech Edge+",
      "Web Page Design",
    ],
    teachers: [
      "Benjamin Brandt",
      "Matthew Callaghan",
      "Rebecca Diorio",
      "Meghan Donovan",
      "Allison Hillyer",
      "Peter Hostrawser",
      "Dawn Ingram",
      "Dana Klen",
      "Dan Lentino",
      "Angela Lewandowski",
      "Amber Miles",
      "Terry Morenus",
      "Gene Nolan",
      "Jason Reid",
      "Jon (Jonathan) Ryan",
      "Geoff Schmit",
      "Brett Thompson",
      "Noelle Tragasz",
      "Jasmin Tuazon",
      "Sara Willard",
    ],
  },
  "Fine Arts": {
    classes: [
      "AP Art History",
      "AP Studio Art 2D",
      "AP Studio Art 2D Design",
      "AP Studio Art 3D",
    ],
    teachers: [
      "Rachel Hill",
      "Megan Kelly",
      "Janell Matas",
      "Zach Mory",
      "Shay Rehs",
    ],
  },
  Wellness: {
    classes: [
      "Advanced Health",
      "Blended Health",
      "Health",
      "Online Health",
      "Sports Medicine 1",
      "Sports Medicine 2",
    ],
    teachers: [
      "Kevin Benages",
      "Renee Billish",
      "Erin Cattell",
      "Deanna Nesci",
      "Meghan Donovan",
    ],
  },
  "World & Classical Language": {
    classes: [
      "Chinese 1-Mandarin",
      "Chinese 2-Mandarin",
      "Chinese 3-Mandarin",
      "Blended Chinese 4-Mandarin",
      "Blended AP Chinese Language & Culture",
      "Modern Chinese Literature",
      "French 1",
      "French 2",
      "French 3",
      "Blended French 4",
      "AP French Language & Culture",
      "German 1",
      "German 2",
      "German 3",
      "German 4",
      "German 5",
      "Latin 1",
      "Latin 2",
      "Honors Latin 3/4",
      "Spanish 1",
      "Spanish 2",
      "Spanish 3",
      "Blended Spanish 3",
      "Spanish 4",
      "Blended Spanish 4",
      "Spanish 5",
      "Spanish Language & Culture for the Spanish Speaker",
      "AP Spanish Language & Culture",
      "AP Spanish Literature",
      "Spanish for the Professions and Spanish Film & Literature",
      "Spanish Language & Culture for Heritage Learners 1",
      "Spanish Language & Culture for Heritage Learners 2",
      "Spanish Language & Culture for Heritage Learners 3",
      "Blended Humanities Capstone",
    ],
    teachers: [
      "Lisa Dinon",
      "Rita Rothmund",
      "Veronica Baracaldo",
      "Emily Bishop",
      "Kimberly Cancio",
      "Samantha Cermak",
      "Piling Chiu",
      "Lori Clark",
      "Leslie Conte-Russian",
      "Leslie Cortes-Markle",
      "Brooke Dickstein",
      "Jonathan Justice",
      "Mary (Shih Ming) Li",
      "Michelle Pitts",
      "Vanessa Ramos",
      "Lisa Shamrock",
      "Juan Luis Tafolla",
      "Brenna Verdier",
      "Abby Walter",
    ],
  },
  Science: {
    classes: [
      "Principles of Biology and Chemistry",
      "Chemistry",
      "Honors Chemistry",
      "Biology",
      "Blended Biology",
      "Honors Biology",
      "Physics",
      "AP Physics 1",
      "Advanced Chemistry",
      "Blended Advanced Chemistry",
      "Anatomy and Physiology",
      "Blended Anatomy and Physiology",
      "Astronomy",
      "Blended Astronomy",
      "Biotechnology",
      "Earth Science",
      "Blended Earth Science",
      "Research and Design",
      "Blended STEM Capstone",
      "Food Science",
      "Veterinary Science",
      "AP Biology",
      "AP Chemistry",
      "AP Environmental Science",
      "AP Physics 2",
      "AP Physics C",
    ],
    teachers: [
      "Liz Brucker",
      "Tom Champion",
      "John Cole",
      "Eva Cone",
      "Brady DeNio",
      "Sarah Eclavea",
      "Zoe Evans",
      "Kevin Farrell",
      "Kyle Girup",
      "Brian Glasby",
      "Katie Jacobs",
      "Jerry Kedziora",
      "Katherine Klett",
      "Anna Kraftson",
      "Katharine Lynch",
      "Elijah Medlock",
      "Kathryn Micensky",
      "Anthony Pellegrini",
      "Kristen Richardson",
      "Mark Rowzee",
      "Jason Ryan",
      "Katherine Smith",
    ],
  },
  "Social Studies": {
    classes: [
      "World Cultures",
      "Blended World Cultures",
      "Comparative Religions",
      "Cultural Anthropology",
      "AP Human Geography",
      "World History",
      "Blended World History",
      "20th Century History",
      "Blended 20th Century History",
      "AP World History",
      "Blended AP World History",
      "AP European History",
      "Blended AP European History",
      "Blended Humanities 1",
      "Blended Humanities 2",
      "Military History",
      "U.S. History",
      "Blended U.S. History",
      "Online U.S. History",
      "AP U.S. History",
      "American Studies",
      "Modern American Social History",
      "Voices",
      "Blended Voices",
      "Urban History",
      "American Government",
      "Blended American Government",
      "Online American Government",
      "AP U.S. Government",
      "AP Comparative Government & Politics",
      "Legal Issues in American Society",
      "Peace & Conflict Studies",
      "Economics",
      "Blended Economics",
      "AP Microeconomics",
      "Blended AP Microeconomics",
      "AP Macroeconomics",
      "Blended AP Macroeconomics",
      "Sociology",
      "Introduction to Psychology",
      "Blended Introduction to Psychology",
      "AP Psychology",
      "Blended Humanities",
      "Capstone",
    ],
    teachers: [
      "Eleanor Barbino",
      "Jim Chiappetta",
      "Ryan Dengel",
      "Ryan Hantak",
      "Kevin Nalefski",
      "Courtney Levin",
      "Ashley McMahon",
      "John Noffke",
      "Mike O’Connor",
      "Bob Platt",
      "Al Scott",
      "Lisa Stebnicki",
      "Stephanie Sullivan",
      "Holly Welsh",
      "Colin White",
      "Rochelle Wilder",
      "Jack Wright",
    ],
  },

  "EL classes": {
    classes: [
      "EL Conversion",
      "EL",
      "EL Beginning",
      "EL Intermediate",
      "EL Advanced",
      "EL Tutorial",
      "EL Composition and Literature",
      "Sheltered English 1",
    ],
    teachers: [
      "Lyssa Allen",
      "Elizabeth DeSantiago",
      "Kimberly Evans",
      "Sonia Jassal",
      "Amy Smith",
      "Megan Straka",
      "Stephanie Sullivan",
      "Emily Swistak",
      "Amy Vogelsang",
    ],
  },

  "Academic Support": {
    classes: ["Academic Reading", "Sophomore/ Junior Seminar"],
  },
};

// Function to update the class options based on the selected subject
function updateClasses() {
  const subject = document.getElementById("subject").value;
  const classDropdown = document.getElementById("class");
  const teacherDropdown = document.getElementById("teacher");
  // Clear previous options
  classDropdown.innerHTML = '<option value="">Select a Class</option>';
  teacherDropdown.innerHTML = '<option value="">Select a Teacher</option>';

  // Populate class dropdown based on selected subject
  if (subject && coursesData[subject]) {
    const classes = coursesData[subject].classes;
    classes.forEach((course) => {
      const option = document.createElement("option");
      option.value = course;
      option.textContent = course;
      classDropdown.appendChild(option);
    });

    // Populate teacher dropdown based on selected subject
    updateTeachers(subject);
  }
}

// Function to update teacher options based on the selected subject
function updateTeachers(subject) {
  const teacherDropdown = document.getElementById("teacher");

  // Clear previous teacher options
  teacherDropdown.innerHTML = '<option value="">Select a Teacher</option>';

  if (subject && coursesData[subject]) {
    const teachers = coursesData[subject].teachers;
    teachers.forEach((teacher) => {
      const option = document.createElement("option");
      option.value = teacher;
      option.textContent = teacher;
      teacherDropdown.appendChild(option);
    });
  }
}

const submitButton = document.querySelector("input.Submit");

submitButton.addEventListener("click", async (event) => {
  event.preventDefault(); // Prevent the default form submission

  // Get the values entered by the user
  const tutorFirstName = document.querySelector("input#tutorFirstName").value;
  const tutorLastName = document.querySelector("input#tutorLastName").value;
  const tutorID = document.querySelector("input#tutorID").value;
  const sessionDate = document.querySelector("input#sessionDate").value;
  const sessionPeriod = document.querySelector("select#sessionPeriod").value;
  const sessionPlace = document.querySelector("select#sessionPlace").value;
  const subject = document.querySelector("select#subject").value;
  const classValue = document.querySelector("select#class").value;
  const teacher = document.querySelector("select#teacher").value;
  const focusOfSession = document.querySelector("select#focusOfSession").value;
  const workAccomplished = document.querySelector(
    "input#workAccomplished"
  ).value;
  const tuteeFirstName = document.querySelector("input#tuteeFirstName").value;
  const tuteeLastName = document.querySelector("input#tuteeLastName").value;
  const tuteeID = document.querySelector("input#tuteeID").value;
  const gradeButtons = document.querySelectorAll(
    "input[name='tuteeGrade']:checked"
  );
  const tuteeGrade = gradeButtons.length > 0 ? gradeButtons[0].value : null;

  const formData = {
    tutorFirstName,
    tutorLastName,
    tutorID,
    sessionDate,
    sessionPeriod,
    sessionPlace,
    subject,
    class: classValue,
    teacher,
    focusOfSession,
    workAccomplished,
    tuteeFirstName,
    tuteeLastName,
    tuteeID,
    tuteeGrade,
  };

  const sessionData = {
    tuteeFirstName,
    tuteeLastName,
    tuteeID,
    sessionDate,
    tutorFirstName,
    tutorLastName,
    tutorID,
    subject,
    class: classValue,
    workAccomplished,
  };

  const tutorIDS = tutorID;

  try {
    const response = await fetch("/submitTutorForm", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(formData),
    });

    // Show an alert based on the response and redirect to the homepage
    if (response.ok) {
      alert("Form successfully submitted!");
      window.location = "/"; // Redirect to the homepage
    } else {
      const errorData = await response.json();
      console.error("Error submitting form:", errorData);
      alert("There was an error submitting the form.");
    }
  } catch (error) {
    console.error("Network error:", error);
    alert("There was a network error submitting the form.");
  }

  // session history try
  try {
    const response = await fetch("/getTutorSessionHistory", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ tutorIDS }),
    });

    // Show an alert based on the response and redirect to the homepage
    if (!response.ok) {
      const errorData = await response.json();
      console.error("Error getting tutor ID:", errorData);
      alert("There was an error getting tutor ID.");
    }
  } catch (error) {
    console.error("Network error:", error);
    alert("There was a network error placing into session table.");
  }

  // session table try

  try {
    const response = await fetch("/sessionTable", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(sessionData),
    });

    // Show an alert based on the response and redirect to the homepage
    if (!response.ok) {
      const errorData = await response.json();
      console.error("Error placing into session table:", errorData);
      alert("There was an error placing into session table.");
    }
  } catch (error) {
    console.error("Network error:", error);
    alert("There was a network error placing into session table.");
  }
});

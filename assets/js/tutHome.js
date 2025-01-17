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
    teachers: ["Mr. Smith", "Mrs. Johnson", "Mr. Lee", "Ms. Taylor"],
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
    teachers: ["Mr. Harris", "Mrs. Martin", "Ms. Thompson", "Mr. Clark"],
  },
  CTE: {
    classes: [
      "Introduction to Business",
      "Blended Introduction to Business",
      "Tech Edge",
      "Tech Edge+",
      "Consumer Economics",
      "Blended Consumer Economics",
      "Online Consumer Economics",
      "Accounting 1",
      "Honors College Accounting",
      "Marketing",
      "Blended Advanced Marketing",
      "Advertising",
      "Business Law",
      "International Business",
      "Business INCubatoredu",
      "Blended Business ACCELeratoredu",
      "Computer Programming 1",
      "Computer Programming 2",
      "Game Design",
      "Web Page Design",
      "Advanced Web Page Design",
      "AP Computer Science A",
      "Software Engineering 1",
      "Blended Software Engineering 2",
      "Blended STEM Inquiry & Research Capstone",
    ],
    teachers: ["Mr. Martinez", "Ms. Davis", "Mr. Anderson"],
  },
  "Fine Arts": {
    classes: [
      "AP Art History",
      "AP Studio Art 2D",
      "AP Studio Art 2D Design",
      "AP Studio Art 3D",
    ],
    teachers: ["Mr. Green", "Ms. Roberts"],
  },
  Wellness: {
    classes: ["Health", "Blended Health", "Online Health", "Advanced Health"],
    teachers: ["Mr. Walker", "Mrs. Robinson", "Ms. King"],
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
    teachers: ["Ms. Garcia", "Mr. Lee", "Ms. Miller"],
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
    teachers: ["Dr. Harris", "Mr. Green", "Ms. Allen", "Mr. Moore"],
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
    teachers: ["Mr. Adams", "Ms. Taylor", "Mr. Cooper", "Mrs. Scott"],
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

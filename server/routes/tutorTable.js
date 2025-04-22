const express = require('express');
const router = express.Router();

// Mock tutor data for demonstration
const tutorData = [
  {
    tutorName: 'John Doe',
    grade: '11',
    tutorID: '12345',
    classes: ['Algebra II', 'Chemistry', 'English'],
    daysAvailable: ['Monday', 'Wednesday'],
    lunchPeriod: '4th',
    totalSessions: 12,
  },
  {
    tutorName: 'Jane Smith',
    grade: '12',
    tutorID: '67890',
    classes: ['Calculus', 'Physics', 'Spanish'],
    daysAvailable: ['Tuesday', 'Thursday'],
    lunchPeriod: '5th',
    totalSessions: 8,
  },
  {
    tutorName: 'Alex Johnson',
    grade: '10',
    tutorID: '24680',
    classes: ['Geometry', 'Biology', 'History'],
    daysAvailable: ['Monday', 'Friday'],
    lunchPeriod: '6th',
    totalSessions: 15,
  },
];

// Route to render tutor table page
router.get('/', (req, res) => {
  res.render('tutorTable', {
    tutors: tutorData,
    title: 'Tutor Database Table',
  });
});

module.exports = router;

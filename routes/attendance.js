const express = require('express');
const router = express.Router();
const Tutor = require('../server/model/tutor'); // Fixed path to match project structure

router.post('/updateAttendance', async (req, res) => {
  const { tutorId, change } = req.body;
  try {
    await Tutor.findByIdAndUpdate(tutorId, { $inc: { attendance: change } });
    res.status(200).send('Attendance updated');
  } catch (error) {
    console.error(error);
    res.status(500).send('Error updating attendance');
  }
});

module.exports = router;

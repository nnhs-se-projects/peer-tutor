# Peer Tutoring App

# Overview
The Peer Tutoring App is for tutors, students, and teachers. Tutors can fill out the expertise and session forms accessible through the tutor homepage, and they can view their absences and session history through the tutor attendance page by entering their ID number. Teachers can view all the tutors and their information on the tutor database table on the teacher tab. They can also view all the sessions that have occurred on the session table. On the student tab, students can view which tutors can teach a certain subject and then request a tutor as well (Does not work). The Admin side is not yet made, but the user stories for the admin are below.
[Live Server] (https://peertutordev.nnhsse.org/) 
Used Tailwind CSS (lets you write CSS in your HTML in the form of predefined classes)


# Installation 

[Toolchain Setup] (https://docs.google.com/document/d/1wvdn-MVotuBM6wehNdPpbbOFMzmKLPxFzErH8-mkP1s/preview?tab=t.0)

[MongoDB compass 1.46.1 Stable dmg] (https://www.mongodb.com/try/download/compass) 


# How to Run it
* For running locally, search for 8082 in router.js and auth.js files and change to 8080 (8082 is used for running live server)

# Expected Result
* You will be asked to log in using google and then will reach the landing homepage. The session and tutor database tables should display the data from the database if correctly connected.

# Architecture 
* The app opens to a homepage. On the homepage are links to different pages for each group of people (teachers, students, tutors, etc.). These specific pages include resources linked for each group and their necessities. On the tutor page there are links to the Session  Form, Expertise form, and Attendance Profile. For tutor leaders, there is a link to the attendance-taking page. Teachers are given links to the session and tutor database tables. Finally the students can find a tutor and request a tutoring session page. The tutor leader, teacher, and admin pages require passwords to access. 

# Database/env File
The code for the env file is in the Trello under database 

**Mongoose Schema**
**Tutor**
* Tutor first name - string
* Tutor last name - string
* Tutor ID - int
* Email - string
* Grade - int
* Returning - boolean If the tutor has tutored before that semester.
* Lunch period - int
* [Days available] array (strings) The days a tutor is able to come into the center.
* [Classes] - array (strings)
* Tutor leader - boolean If the tutors are tutor leaders.
* Attendance - int The number of days a tutor has not come in.
* [Session history] - array (session objects)

**Session**
* Tutor first name - string
* Tutor last name - string
* Tutor ID - int
* Date - date
* Period - int
* Location - string
* Subject - string
* Class - string
* Teacher - string
* Focus of Session - string
* Work accomplished - string
* Tutee first name - string
* Tutee last name - string
* Tutee ID - int
* Tutee grade int

**Tutee**
* Tutee ID - int
* Email - email
* Tutee last name - string
* Tutee first name - string
* Grade - int
* [Session history]  array (session objects)

**Teacher**
* Email - email
* Teacher first name - string
* Teacher last name - string
* Admin - boolean If the teacher can access admin page


# JSON Files 

**(Server >> Model)**
* commArtsClasses - string
* courseList - string
* courses - string
* cteClasses - string
* daysOfTheWeek - string
* fineArtsClasses - string
* grades - string
* historyClasses - string
* languageClasses - string
* lunchPeriods - string
* mathClasses - string
* newReturningOptions - string
* scienceClasses - string
* wellnessClasses - string

**(Assets >> Public >> Data)**
* academic-support - string
* cte - string
* el-classes - string
* english - string
* fine-arts - string
* math - string
* science - string
* social-studies - string
* wellness - string
* world-classical-language - string


# User stories

* As an admin, I want to see the schedule formed by the student expertise form so that I can view the schedule
* As an admin, I want to be able to have the information from the tutor session form organized for me in the desired format
* As an admin, I want to see the tutors ranked by tutor session so I can see who is nearing 100 sessions and compare tutors and their sessions. 
* As an admin, I want an automated notification/email/message sent to tutors who have missed 1-2 sessions (have outstanding absences) so that I don't have to send them manually
* As an admin, I want to remove tutors so that after a semester has concluded, I can remove tutors who are no longer continuing. 
* As an admin, I want to add certain tutors at the beginning of the semester.
* As a tutor leader, I want to be able to take attendance for the tutors that come in each period/day and have it keep track of their attendance, letting me know how many days they've been absent
* As a student/tutee I want to be able to see which subjects are being tutored on a given day and lunch period (updated daily)


# Issues
* The attendance function does not work (no database structure, and the buttons don’t update the values correctly)
* Request a tutor does not send a request (Students can fill out and submit the form, but after it is submitted, the form doesn’t go anywhere)
* Authentication is not limited to district 203 members (people with non-school emails can log in and view the site)
* When submitting the session form, an error message pops up saying the form didn’t submit correctly,y despite it going into the database perfectly ok. 
* Data types in the schema do not always match with JSON files. The JSON files for grade and lunch period are strings in “”, but in the schema, it isof  type int. There may be other JSON files that run into this issue. 
* Need to remove habitsOfMind.json in server>model & entry.js
* Ensure academic support teachers are as follows (Stephanie Moore, Angel Kalat, Christy Mathews)
* Clean/organize files

Questions:
- Should we have question on the session form with a box for the tutor leader to type their code, confirming that the session occurred?
- What is the desired format? Is a Google Sheet? Or is a table on the website sufficient?
- Is this necessary? Why would someone want to log out?

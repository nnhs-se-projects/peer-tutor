# Copilot Instructions for Peer Tutoring App

## Overview
This document provides essential guidance for AI coding agents working on the Peer Tutoring App. Understanding the architecture, workflows, and conventions of this codebase is crucial for effective contributions.

## Architecture
- The application is structured around distinct user roles: **tutors**, **students**, and **teachers**. Each role has specific pages and functionalities:
  - **Tutors** can manage their sessions and attendance.
  - **Students** can request tutoring sessions.
  - **Teachers** can view tutor information and session history.
- The homepage serves as a navigation hub, linking to resources tailored for each user group.
- Key components include:
  - **Session Form**: For tutors to log sessions.
  - **Expertise Form**: For tutors to indicate their teaching capabilities.
  - **Attendance Profile**: For tracking tutor attendance.

## Critical Developer Workflows
- **Running the Application**: Change the port from `8082` to `8080` in `router.js` and `auth.js` for local development.
- **Database Connection**: Ensure MongoDB is correctly set up as per the installation guide.
- **Testing**: Use the provided JSON files for testing data integrity and schema compliance.

## Project-Specific Conventions
- **Mongoose Schemas**: Follow the defined schemas for `Tutor`, `Session`, and `Tutee` to maintain data consistency. Ensure data types in JSON files match the schema definitions.
- **File Organization**: Maintain the structure in `server/model` and `assets/public/data` for easy access and updates.

## Integration Points
- **Database**: The application relies on MongoDB for data storage. Ensure that the connection is established before running the app.
- **External Dependencies**: The app uses Tailwind CSS for styling. Familiarize yourself with its utility-first approach to CSS.

## Communication Patterns
- **Cross-Component Communication**: Use the session and expertise forms to facilitate communication between tutors and students. Ensure that data flows correctly from forms to the database.

## Example Patterns
- **Session Logging**: When a tutor logs a session, ensure that all required fields are filled out according to the `Session` schema.
- **Attendance Tracking**: Implement logic to update attendance records based on the data submitted in the attendance profile.

## Conclusion
This document should serve as a foundational guide for AI agents to navigate and contribute effectively to the Peer Tutoring App. For any unclear sections or additional details needed, please provide feedback for further iterations.
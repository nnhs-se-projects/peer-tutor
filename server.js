/**
 * main Javascript file for the application
 *  this file is executed by the Node server
 */

// import the http module, which provides an HTTP server
const http = require("http");

// import the express module, which exports the express function
const express = require("express");

// invoke the express function to create an Express application
const app = express();

// add middleware to handle JSON in HTTP request bodies (used with
//  POST commands)
app.use(express.json());

// load environment variables from the .env file into process.env
const dotenv = require("dotenv");
dotenv.config({ path: ".env" });

// connect to the database
const connectDB = require("./server/database/connection");
connectDB();

// import the express-session module, which is used to manage sessions
const session = require("express-session");
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
  })
);

// set the template engine to EJS, which generates HTML with embedded
//  JavaScript
app.set("view engine", "ejs");

// load assets
app.use("/css", express.static("assets/css"));
app.use("/img", express.static("assets/img"));
app.use("/js", express.static("assets/js"));

// app.use takes a function that is added to the chain of a request.
//  When we call next(), it goes to the next function in the chain.
app.use((req, res, next) => {
  // if the student is not already logged in, redirect all requests to the
  //  authentication page
  if (req.session.email === undefined && !req.path.startsWith("/auth")) {
    res.redirect("/auth/");
    return;
  }

  next();
});

// create the HTTP server
const server = http.createServer(app);

// to keep this file manageable, we will move the routes to a separate file
//  the exported router object is an example of middleware
app.use("/", require("./server/routes/router"));

// start the server on port 8080
server.listen(8080, () => {
  console.log("Server started on http://localhost:8080");
});

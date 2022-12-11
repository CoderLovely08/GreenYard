//jshint esversion:6

// Importing required modules
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const imgur = require('imgur-uploader');
const fs = require("fs")
const fileupload = require("express-fileupload");
const loadsh = require("lodash")
const session = require('express-session');
require("dotenv").config();
var async = require('async');

// module for password hashing
const bcrypt = require('bcrypt')

const saltRounds = 10

// creating app instance
const app = express();
app.use(bodyParser.urlencoded({ extended: true }))

// Connecting to database
const pg = require('pg');
const { result } = require("lodash");

const client = new pg.Client({
    host: process.env.ADMIN_HOST,
    user: process.env.ADMIN_USER,
    port: process.env.ADMIN_PORT,
    password: process.env.ADMIN_PASSWORD,
    database: process.env.ADMIN_DATABASE,
    idleTimeoutMillis: 0,
    connectionTimeoutMillis: 0
});

client.connect();


console.log("Connected");
app.set('view engine', 'ejs');


app.use(bodyParser.urlencoded({ extended: true }));
var urlencodedparser = bodyParser.urlencoded({ extended: false })
app.use(express.static("public"));
app.use(fileupload());

// Use the express-session middleware to manage user sessions
app.use(session({
    secret: "my-secret-key", // Use a secret key to encrypt the session data
    resave: false, // Don't resave the session if it hasn't changed
    saveUninitialized: true, // Save a new, uninitialized session
    expires: new Date(Date.now() + (60 * 60 * 1000)) // Set the session to expire after 1 hour
}));



app.get("/", function (req, res) {
    // Check if the user is authenticated
    if (req.session.authenticated) {
      // If the user is authenticated, redirect to the home page
      res.redirect('/home');
    } else {
      // If the user is not authenticated, render the signup page
      res.render("signup");
    }
  });
  
  app.get("/login", function (req, res) {
    // Check if the user is authenticated
    if (req.session.authenticated) {
      // If the user is authenticated, redirect to the home page
      res.redirect('/home')
    } else {
      // If the user is not authenticated, render the login page
      res.render("login")
    }
  })
  
  app.get("/home", function (req, res, next) {
    // Check if the user is authenticated
    if (!req.session.authenticated) {
      // If the user is not authenticated, redirect to the login page
      res.redirect('login')
    } else {
      // If the user is authenticated, query the database to get the post and user details
      client.query(
        "select p.post_id,p.post_title,p.post_description, p.post_image_reference, u.user_name from PostInfo p join UserInfo u on p.post_author_id = u.user_id ",
        function (err, result) {
          // Check for errors
          if (err) {
            // If there was an error, send a server error response
            res.status(500).send('Error querying database: ' + err);
          } else {
            // Otherwise, render the home page with the data received from the database
            let postDetails = result.rows;
            let userDetails = {
              userName: req.session.loggedUserName,
              userEmail: req.session.loggedUserEmail,
            };
            res.render('home', { userDetails, postDetails });
          }
        }
      );
    }
  });
  

  app.get("/addPlant", function (req, res) {
    // Get the logged-in user's details
    let userDetails = {
      userName: req.session.loggedUserName,
      userEmail: req.session.loggedUserEmail
    };
  
    // Render the upload page with the user's details
    res.render("upload", { userDetails });
  });
  
  app.get("/forgotPassword", function (req, res) {
    // Render the password reset page
    res.render("passwordReset");
  });
  
  app.get("/posts/:postId", function (req, res) {
    // Get the logged-in user's details
    let userDetails = {
      userName: req.session.loggedUserName,
      userEmail: req.session.loggedUserEmail
    };
  
    // Get the post ID from the route parameters
    const postId = req.params.postId[0];
  
    // Query the database to get the details of the post with the specified ID
    client.query(
      "select p.post_id,p.post_title,p.post_description, p.post_image_reference, u.user_name from PostInfo p join UserInfo u on p.post_author_id = u.user_id where post_id = $1",
      [postId],
      function (err, result) {
        // Check for errors
        if (err) {
          // If there was an error, send a server error response
          res.status(500).send('Error querying database: ' + err);
        } else {
          // Otherwise, render the posts page with the data received from the database
          let postResult = result.rows[0];
          res.render("posts", { postResult, userDetails });
        }
      }
    );
  });
  

app.post("/logoutUser", function (req, res) {
    req.session.destroy(function (err) {
        if (err) {
            // If there was an error, send a server error response
            // res.status(500).send({ success: false, error: err });
        } else {
            // Otherwise, send a success response
            // res.status(400).redirect('/login')
        }
    });
});

// --------------------------------------------------------
//                      POST ROUTES
// --------------------------------------------------------
app.post("/userSignup", urlencodedparser, function (req, res) {
    // Get the user's name, email, and password from the request body
    let userName = req.body.name.trim();
    let userEmail = req.body.email.trim();
    let userPassword = req.body.password.trim();
  
    // Query the database to check if the email already exists
    let checkExistingEmail = `Select * from UserInfo where user_email = '${userEmail}' limit 1`;
    client.query(checkExistingEmail, function (err, result) {
      if (result.rows.length == 1) {
        // If the email already exists, send a response indicating that the email is already in use
        res.send("Email already exist");
      } else {
        // If the email does not already exist, hash the user's password
        bcrypt.hash(userPassword, saltRounds, (err, hash) => {
          // Insert the user's details into the database
          let query = `INSERT INTO userinfo(user_name,user_email, user_password) VALUES('${userName}','${userEmail}','${hash}')`;
          client.query(query, function (err, result) {
            // Check for errors
            if (!err) {
              // If there was no error, send a response indicating that the registration was successful
              res.send('Registration Successfull')
            } else {
              // If there was an error, send a response indicating that there was an error
              res.send("Some error has occurred!");
            }
          });
        });
      }
    });
  });
  


  app.post("/userLogin", urlencodedparser, async function (req, res) {
    // Retrieve the email address and password from the request body
    let username = req.body.userEmail.trim();
    let userPassword = req.body.userPassword.trim();

    // Use a parameterized query to avoid SQL injection vulnerabilities
    client.query("Select * from UserInfo where user_email=$1", [username], function (err, result) {
        if (err) {
            // Handle the error
            console.error(err); // Log the error
            res.send({ success: false, error: err });
        } else if (result.rows.length != 0) {
            // Log the result for debugging purposes
            console.log(result.rows);

            // Retrieve the hashed password for the user
            let hashedPassword = result.rows[0].user_password

            // Compare the provided password to the hashed password using bcrypt
            bcrypt.compare(userPassword, hashedPassword, function (err, result) {
                if (err) {
                    // If an error occurred, handle it
                    console.error(err);
                    return;
                }

                if (result) {
                    // If the passwords match, log the user in by storing their
                    // user ID, email address, and username in the session
                    req.session.authenticated = true;
                    req.session.loggedUserId = result.rows[0].user_id
                    req.session.loggedUserName = result.rows[0].user_name
                    req.session.loggedUserEmail = result.rows[0].user_email

                    // Send a success response back to the user
                    res.send({ success: true, result: "Login Successfull" });
                } else {
                    // If the passwords don't match, display an error message
                    res.send({ success: false, error: "Invalid username or password" });
                }
            });
        }
    });
});



app.post("/uploadPost", urlencodedparser, async function (req, res) {

    // check if files are not empty
    if (!req.files) {
        return res.status(400).send("No files Found!");
    }
    // if file exists store it in myfile variable
    let myfile = req.files.thumbnail;

    let uploadPath = __dirname + "/uploads/" + myfile.name;
    // move the file to uploads folder for temp storage
    myfile.mv(uploadPath, function (err) {
        // if (err) console.log("Error!");

        // upload the moved file to imgur and recieve a callback
        imgur(fs.readFileSync(uploadPath)).then(data => {
            let postTitle = req.body.postTitle.trim();
            let plantInformation = req.body.plantInformation.trim();
            let postAuthorId = req.session.loggedUserId
            let postImageReference = data.link

            let insertQuery = `Insert into PostInfo(post_title, post_description, post_author_id, post_image_reference) values('${postTitle}', '${plantInformation}', ${postAuthorId}, '${postImageReference}')`

            console.log(insertQuery);

            client.query(insertQuery, function () {
                if (err) {
                    // Handle any errors that occurred during the query
                    console.error(err);
                } else {
                    // Send a response to the client
                    res.redirect("/home")
                }
            })
        });

        // removing the file from our temporary uploads folder
        fs.unlinkSync(uploadPath);

    });
});




app.use((req, res, next) => {
    res.status(404).render('error');
});


app.listen(3000, function () {
    console.log("Server is running on port 3000!");
});
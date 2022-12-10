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
var client = new pg.Client("postgres://ygxvpnte:Z76TPbkGhluY1P4yj_ZuERcNC3HuiMcQ@tiny.db.elephantsql.com/ygxvpnte");
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
    res.render("signup");
});

app.get("/login", function (req, res) {
    res.render("login")
})

app.get("/home", function (req, res, next) {
    let userDetails = {
        userName: req.session.loggedUserName,
        userEmail: req.session.loggedUserEmail
    }
    res.render('home', { userDetails });
})

app.get("/addPlant", function (req, res) {
    res.render("upload")
})

app.get("/forgotPassword", function (req, res) {
    res.render("passwordReset")
})


// --------------------------------------------------------
//                      POST ROUTES
// --------------------------------------------------------
app.post("/userSignup", urlencodedparser, function (req, res) {
    let userName = req.body.name;
    let userEmail = req.body.email;
    let userPassword = req.body.password;

    // check if email already exists
    let checkExistingEmail = `Select * from UserInfo where user_email = '${userEmail}'`
    client.query(checkExistingEmail, function (err, result) {
        if (result.rows.length == 1) {
            console.log("already exists");
            res.send("Email already exist");
        } else {
            bcrypt.hash(userPassword, saltRounds, (err, hash) => {
                let query = `INSERT INTO userinfo(user_name,user_email, user_password) VALUES('${userName}','${userEmail}','${hash}')`;
                console.log(query);
                client.query(query, function (err, result) {
                    if (!err) res.send('Registration Successfull')
                    else res.send("Some error has occurred!")
                })
            });
        }
    });
});


// let result = await getData(username)
app.post("/userLogin", urlencodedparser, async function (req, res) {
    let username = req.body.userEmail;
    let userPassword = req.body.userPassword;

    // Use a parameterized query to avoid SQL injection vulnerabilities
    client.query("Select * from UserInfo where user_email=$1", [username], function (err, result) {
        if (err) {
            // Handle the error
            console.error(err); // Log the error
            res.send({ success: false, error: err });
        } else {
            // Log the result for debugging purposes
            console.log(result.rows);

            let hashedPassword = result.rows[0].user_password
            let loggedUserName = result.rows[0].user_name
            let loggedUserEmail = result.rows[0].user_email

            bcrypt.compare(userPassword, hashedPassword, function (err, result) {
                if (err) {
                    // If an error occurred, handle it
                    console.error(err);
                    return;
                }

                if (result) {
                    // If the passwords match, log the user in
                    req.session.authenticated = true;
                    req.session.loggedUserName = loggedUserName
                    req.session.loggedUserEmail = loggedUserEmail
                    res.send({ success: true, result: "Login Successfull" });
                } else {
                    // If the passwords don't match, display an error message
                    res.send({ success: false, error: "Invalid username or password" });
                }
            });

            // Send the result to the client
            res.send({ success: false, error: "Invalid username or password" });
        }
    });
});




app.listen(3000, function () {
    console.log("Server is running on port 3000!");
});
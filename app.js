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

const oneDay = 1000 * 60 * 60 * 24;
app.use(session({
    secret: "thisismysecrctekeyfhrgfgrfrty84fwir767",
    saveUninitialized: true,
    cookie: { maxAge: oneDay },
    resave: false,
}));



app.get("/", function (req, res) {
    res.render("signup");
});

app.get("/login", function (req, res) {
    res.render("login")
})

app.get("/home", function (req, res) {
    res.render("home")
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

async function getData(username) {
    try {
        let query = `Select * from UserInfo where user_email='${username}'`
        return await client.query(query);;
    } catch (err) {
        return err.stack;
    }
};

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
  
        // Send the result to the client
        res.send({ success: true, result: result });
      }
    });
  });
  
  


app.listen(3000, function () {
    console.log("Server is running on port 3000!");
});
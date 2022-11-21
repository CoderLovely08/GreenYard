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

// creating app instance
const app = express();
app.use(bodyParser.urlencoded({ extended: true }))

// Connecting to database
const { Client } = require("pg");
// const client = new Client({
//     host: process.env.ADMIN_HOST,
//     user: process.env.ADMIN_USER,
//     port: process.env.ADMIN_PORT,
//     password: process.env.ADMIN_PASSWORD,
//     database: process.env.ADMIN_DATABASE,
//     idleTimeoutMillis: 0,
//     connectionTimeoutMillis: 0
// });

// client.connect();
app.set('view engine', 'ejs');


app.use(bodyParser.urlencoded({ extended: true }));
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
    res.render("home");
});





app.listen(3000, function () {
    console.log("Server is running on port 3000!");
});
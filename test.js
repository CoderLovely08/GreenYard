//jshint esversion:6

// Importing required modules
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
// const imgur = require('imgur-uploader');
const fs = require("fs")
const fileupload = require("express-fileupload");
const loadsh = require("lodash")
const session = require('express-session');
require("dotenv").config();
var async = require('async');
const request = require('request');

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

// const express = require('express');
const imgurUploader = require('imgur-uploader');

// const app = express();
app.get("/", function (req, res) {
    res.render("test")
})
// This route will handle the image upload
app.post('/upload', (req, res) => {
    console.log("called");
    // Read the image file from the request
    const image = req.files.thumbnail;
    console.log(image);   
    // image.mv
    // const imageStream = request(image.uri);

    // Use the imgurUploader to upload the image to imgur
    imgurUploader(image.data).then((data) => {
        // The uploaded image data will be available in the "data" variable
        // You can use this data to save the image information in your database, or to return the image data to the client
        // res.json(data);
        console.log(data);

    }).catch((error) => {
        // Handle any errors that may occur during the upload process
        console.error(error);
        res.status(500).send('Error uploading image to imgur');
    });
});

app.listen(3000, function () {
    console.log("Server is running on port 3000!");
});
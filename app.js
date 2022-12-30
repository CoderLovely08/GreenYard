//jshint esversion:6
// Import the required packages and modules
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const imgur = require('imgur-uploader');
// const fs = require("fs")
const fileupload = require("express-fileupload");
const loadsh = require("lodash")
const session = require('express-session');

// Import the dotenv module to load environment variables from a .env file
require("dotenv").config();

// Import the async module to use asynchronous functions
var async = require('async');

// Import the bcrypt module to use password hashing functions
const bcrypt = require('bcrypt');

// Set the number of salt rounds to use when hashing passwords
const saltRounds = 10;

// Create an app instance of the express web framework
const app = express();

// Connect to the database
const pg = require('pg');
const client = new pg.Client({
    host: process.env.ADMIN_HOST,
    user: process.env.ADMIN_USER,
    port: process.env.ADMIN_PORT,
    password: process.env.ADMIN_PASSWORD,
    database: process.env.ADMIN_DATABASE,
    idleTimeoutMillis: 0,
    connectionTimeoutMillis: 0
});

// Connect to the database
client.connect();

// Log a message to the console when the connection is established
console.log("Connected to the database");

app.set('view engine', 'ejs'); // Set the view engine to be EJS

app.use(bodyParser.urlencoded({ extended: true })); // Use body-parser to parse form data
var urlencodedparser = bodyParser.urlencoded({ extended: false }) // Create a urlencoded parser
app.use(express.static("public")); // Serve static files from the "public" directory
app.use(fileupload()); // Use the fileupload middleware to handle file uploads

// Use the express-session middleware to manage user sessions
app.use(session({
    secret: "my-secret-key", // Use a secret key to encrypt the session data
    resave: false, // Don't resave the session if it hasn't changed
    saveUninitialized: true, // Save a new, uninitialized session
    expires: new Date(Date.now() + (60 * 60 * 1000)) // Set the session to expire after 1 hour
}));



app.get("/", function (req, res) {
    // Check if the user is authenticated
    if (req.session.isUserAuthenticated || req.session.isAdminAuthenticated) {
        // If the user is authenticated, redirect to the home page
        res.redirect('/home');
    } else {
        // If the user is not authenticated, render the signup page
        res.render("signup");
    }
});

app.get("/login", function (req, res) {
    // Check if the user is authenticated
    if (req.session.isUserAuthenticated) {
        // If the user is authenticated, redirect to the home page
        res.redirect('/home')
    } else {
        // If the user is not authenticated, render the login page
        res.render("login")
    }
})

app.get("/home", function (req, res, next) {
    // Check if the user is authenticated
    if (req.session.isUserAuthenticated || req.session.isAdminAuthenticated) {
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
                    let loggedUserName = req.session.isUserAuthenticated == true ? req.session.loggedUserName : req.session.loggedAdminName
                    let userDetails = {
                        userName: loggedUserName,
                        userEmail: req.session.loggedUserEmail,
                    };
                    res.render('home', { userDetails, postDetails });
                }
            }
        );
    } else {
        res.redirect('/login');
    }
});


app.get("/addPlant", function (req, res) {
    // Check if the user is authenticated
    if (!req.session.isUserAuthenticated) {
        // If the user is not authenticated, redirect to the login page
        res.redirect('login')
    } else {
        // Get the logged-in user's details
        let userDetails = {
            userName: req.session.loggedUserName,
            userEmail: req.session.loggedUserEmail
        };

        // Render the upload page with the user's details
        res.render("upload", { userDetails });
    }
});

app.route("/forgotPassword")
    .get(function (req, res) {
        // Render the password reset page
        res.render("passwordReset");
    })
    .post(function (req, res) {
        let userEmail = req.body.email;
        client.query("Select * from UserInfo where user_email = $1", [userEmail], function (err, queryResult) {
            if (err) {
                console.log("Error querying database: " + err);
            } else {
                if (queryResult.rows.length == 1) {
                    req.session.isResetAuthorised = true
                    req.session.resetEmailId = queryResult.rows[0].user_email
                    res.redirect("/resetPassword")
                } else res.status(200).send(true)
            }
        })
    });


app.route("/resetPassword")
    .get(function (req, res) {
        console.log(req.session);
        res.render('resetPassword');
    })
    .post(function (req, res) {
        if (req.session.isResetAuthorised) {
            let confirmPassword = req.body.password
            bcrypt.hash(confirmPassword, saltRounds, (err, hashedPassword) => {
                if (!err) {
                    client.query("Update UserInfo set user_password = $1 where user_email = $2", [hashedPassword, req.session.resetEmailId], function (err, queryResult) {
                        console.log(queryResult);
                        if (!err) res.redirect("/login")
                        else res.status(200).send(true)
                    })
                }
            })
        } else {
            res.redirect("/forgotPassword")
        }
    })

// --------------------------------------------------------
//                      API Routes
// --------------------------------------------------------

// --------------------------------------------------------
//                            GET 
// --------------------------------------------------------
app.get("/posts/:postId", function (req, res) {
    if (!req.session.isUserAuthenticated) {
        // If the user is not authenticated, redirect to the login page
        res.redirect('/login')
    } else {
        // Get the logged-in user's details
        let userDetails = {
            userName: req.session.loggedUserName,
            userEmail: req.session.loggedUserEmail
        };

        // Get the post ID from the route parameters
        let postId = req.params.postId;
        postId = postId.split("-")[0];

        // Query the database to get the details of the post with the specified ID
        client.query(
            "select p.post_id,p.post_title,p.post_description, p.post_image_reference, u.user_name from PostInfo p join UserInfo u on p.post_author_id = u.user_id where post_id = $1",
            [postId],
            function (err, result) {
                // Check for errors
                if (err) {
                    // If there was an error, send a server error response
                    res.status(404).render('error');
                } else {
                    // Otherwise, render the posts page with the data received from the database
                    if (result.rows.length != 0) {
                        let postResult = result.rows[0];
                        // console.log(result);
                        let shareIntroText = "Found this informative article on GreenYard Check this out now "
                        shareIntroText = shareIntroText.replace(/\s/g, "%20")
                        let shareDataLink = "http://greenyard.onrender.com/posts/"
                        let shareData = "whatsapp://send?text=" + shareIntroText + shareDataLink + result.rows[0].post_id
                        res.render("posts", { postResult, userDetails, shareData });
                    } else {
                        res.status(404).render('error');
                    }
                }
            }
        );
    }
});


// --------------------------------------------------------
//                            DELETE 
// --------------------------------------------------------
app.post("/deletePost", function (req, res) {
    const postId = req.body.postId;
    client.query("Delete from PostInfo where post_id = $1", [postId], function (err, queryResult) {
        if (err) {
            console.log(err);
            res.status(400).send("Error while deleting post")
        } else {
            let response = "Post deleted with Id:" + postId
            res.status(200).send(response);
        }
    })
})

app.route("/adminLogin").get(function (req, res) {
    if (req.session.isAdminAuthenticated) {

        res.redirect('/adminView')
    } else {
        res.render('adminLogin')
    }
}).post(function (req, res) {
    let adminUserName = req.body.adminUserName
    let adminPassword = req.body.adminPassword

    client.query("Select * from AdminInfo where admin_user_name = $1 and admin_password = $2", [adminUserName, adminPassword]).then(queryResult => {
        if (queryResult.rows.length != 0) {
            req.session.isAdminAuthenticated = true
            req.session.loggedAdminId = queryResult.rows[0].admin_id
            req.session.loggedAdminName = queryResult.rows[0].admin_name
        }
        res.redirect('/adminView')
    })
})


app.route("/adminView").get(function (req, res) {
    if (!req.session.isAdminAuthenticated) {
        res.render('adminLogin')
    } else {

        client.query("select p.post_id,p.post_title,p.post_description, p.post_image_reference, u.user_name as post_author_name from PostInfo p join UserInfo u on p.post_author_id = u.user_id", function (err, queryResults) {

            let userPostDetails = queryResults.rows

            let userDetails = {
                adminId: req.session.loggedAdminId,
                userName: req.session.loggedAdminName
            }
            res.render('adminView', { userPostDetails, userDetails })
        })
    }
})


// --------------------------------------------------------
//                      POST ROUTES
// --------------------------------------------------------
app.post("/userSignup", urlencodedparser, function (req, res) {
    // Get the user's name, email, and password from the request body
    let userName = req.body.name.trim();
    let userEmail = req.body.email.trim();
    let userPassword = req.body.password.trim();

    // Use a parameterized query to check if the email already exists in the database
    client.query("Select * from UserInfo where user_email=$1", [userEmail], function (err, result) {
        if (result.rows.length == 1) {
            // If the email already exists, send a response indicating that the email is already in use
            res.send("Email already exist");
        } else {
            // If the email does not already exist, hash the user's password
            bcrypt.hash(userPassword, saltRounds, (err, hash) => {
                // Use a parameterized query to insert the user's details into the database
                client.query("INSERT INTO userinfo(user_name,user_email, user_password) VALUES($1,$2,$3)", [userName, userEmail, hash], function (err, result) {
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
    client.query("Select * from UserInfo where user_email=$1 limit 1", [username], function (err, queryResult) {
        if (err) {
            // Handle the error
            console.error(err); // Log the error
            res.send({ success: false, error: err });
        } else if (queryResult.rows.length != 0) {
            // Retrieve the hashed password for the user
            let hashedPassword = queryResult.rows[0].user_password

            // Compare the provided password to the hashed password using bcrypt
            bcrypt.compare(userPassword, hashedPassword, function (err, result) {
                if (err) {
                    // If an error occurred, handle it
                    console.error(err);
                    return;
                }

                if (result) {
                    console.log(queryResult.rows[0]);
                    // If the passwords match, log the user in by storing their
                    // user ID, email address, and username in the session
                    req.session.isUserAuthenticated = true;
                    req.session.loggedUserId = queryResult.rows[0].user_id
                    req.session.loggedUserName = queryResult.rows[0].user_name
                    req.session.loggedUserEmail = queryResult.rows[0].user_email

                    // Send a success response back to the user
                    let response = {
                        success: true,
                        result: "Login Successfull"
                    }
                    res.status(200).send("Login Successfull");
                    res.end();
                } else {
                    // If the passwords don't match, display an error message
                    let response = {
                        success: false,
                        result: "Invalid username or password"
                    }
                    res.status(200).send(response);
                    res.end();
                }
            });
        }
    });
});



app.post("/uploadPost", urlencodedparser, function (req, res) {
    if (!req.session.isUserAuthenticated) {
        // If the user is not authenticated, redirect to the login page
        res.redirect('login')
    } else {
        // check if files are not empty
        if (!req.files) {
            return res.status(400).send("No files Found!");
        }
        // if file exists store it in myfile variable
        let myfile = req.files.thumbnail;
        console.log(myfile);

        // upload the moved file to imgur and recieve a callback
        imgur(myfile.data).then(data => {
            // Read the post title and plant information from the request body
            let postTitle = req.body.postTitle.trim();
            let plantInformation = req.body.plantInformation.trim();

            // Read the ID of the logged-in user from the session data
            let postAuthorId = req.session.loggedUserId

            // Read the link to the uploaded image from the data returned by imgur
            let postImageReference = data.link



            const insertQuery = 'INSERT INTO PostInfo(post_title, post_description, post_author_id, post_image_reference) VALUES($1, $2, $3, $4)';

            // Use the client to execute the query with the provided parameters
            client.query(insertQuery, [postTitle, plantInformation, postAuthorId, postImageReference], function (err, results) {
                if (err) {
                    // Handle any errors that occurred during the query
                    console.error(err);
                } else {
                    // Send a response to the client
                    res.redirect("/home")
                }
            });

        });
    }
});


app.post("/logoutUser", function (req, res) {
    req.session.destroy(function (err) {
        if (err) {
            // If there was an error, send a server error response
            res.status(500).send({ success: false, error: err });
        } else {
            // Otherwise, send a success response
            res.status(400).redirect('/login')
        }
    });
});



app.use((req, res, next) => {
    res.status(404).render('error');
});


app.listen(3000, function () {
    console.log("Server is running on port 3000!");
});

const async = require("async")
const pg = require("pg")
const bcrypt = require('bcrypt')
const client = new pg.Client("postgres://ygxvpnte:Z76TPbkGhluY1P4yj_ZuERcNC3HuiMcQ@tiny.db.elephantsql.com/ygxvpnte");
client.connect();

let username = "sahil@gmail.com"
let userPassword = "sahil@123"

// Use a parameterized query to avoid SQL injection vulnerabilities
client.query("Select * from UserInfo where user_email=$1", [username], function (err, result) {
    if (err) {
        // Handle the error
        console.error(err); // Log the error
        res.send({ success: false, error: err });
    } else {
        // Log the result for debugging purposes
        console.log(result.rows[0].user_password,result.rows[0].user_name,result.rows[0].user_email);

        hashedPassword = result.rows[0].user_password
        bcrypt.compare(userPassword, hashedPassword, function (err, result) {
            if (err) {
                // If an error occurred, handle it
                console.error(err);
                return;
            }

            if (result) {
                // If the passwords match, log the user in
                // req.session.authenticated = true;
                console.log("Logged in");
                // res.send({ success: true, result: "Login Successfull" });
            } else {
                console.log("Login rejected");
                // If the passwords don't match, display an error message
                // res.send({ success: false, error: "Invalid username or password" });
            }
        });

        // Send the result to the client
    }
});
const async = require("async")
const pg = require("pg")
const bcrypt = require('bcrypt')
const client = new pg.Client("postgres://ygxvpnte:Z76TPbkGhluY1P4yj_ZuERcNC3HuiMcQ@tiny.db.elephantsql.com/ygxvpnte");
client.connect();

let username = "sahil@gmail.com"
let userPassword = "sahil@123"

// Use a parameterized query to avoid SQL injection vulnerabilities
client.query("select p.post_id,p.post_title,p.post_description, p.post_image_reference, u.user_name from PostInfo p join UserInfo u on p.post_author_id = u.user_id where post_id = 3", function (err, result) {
    let postDetails = result.rows
    console.log(postDetails[0]);
    // let userDetails = {
    //     userName: req.session.loggedUserName,
    //     userEmail: req.session.loggedUserEmail
    // }
    // res.render('home', { userDetails, postDetails });
})
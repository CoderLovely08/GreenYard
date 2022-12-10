const async = require("async")
const pg = require("pg")
const bcrypt = require('bcrypt')
const client = new pg.Client("postgres://ygxvpnte:Z76TPbkGhluY1P4yj_ZuERcNC3HuiMcQ@tiny.db.elephantsql.com/ygxvpnte");
client.connect();

let username = "sahil@gmail.com"
let userPassword = "sahil@123"

// Use a parameterized query to avoid SQL injection vulnerabilities
client.query("Insert into PostInfo(post_title, post_description, post_author_id, post_image_reference) values('Money plant', 'this is a money plant', 4, 'https://i.imgur.com/npPXSnL.jpg')", function (err, result) {
    console.log(err);
})
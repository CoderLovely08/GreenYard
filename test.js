const async = require("async")
var pg = require("pg")
var client = new pg.Client("postgres://ygxvpnte:Z76TPbkGhluY1P4yj_ZuERcNC3HuiMcQ@tiny.db.elephantsql.com/ygxvpnte");
// client.connect();

let userEmail = "lovelysingeras297@gmail.com"

let checkExistingEmail = `Select * from UserInfo `
// client.query(checkExistingEmail, function (err, result) {
//     // if (result.rows.length == 1) {
//         console.log(err);
//         console.log(result.rows);
//     // }
// });
// client.end();

const bcrypt = require('bcrypt')
let userPassword = "lovely"
bcrypt.hash(userPassword, 10, (err, hash) => { 
    console.log(hash);
    bcrypt.compare(userPassword,hash, (err,result) => {
        console.log(result);
    });
});

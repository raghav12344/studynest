const express = require('express');
const path = require('path');
const app = express();
const port = 8080;
let fileuploader = require('express-fileupload');
var cloudinary = require("cloudinary").v2;
cloudinary.config({
    cloud_name: 'drsm7bvgf',
    api_key: '441925695211367',
    api_secret: '-jhKZ_AH-55LErkx_jPF1wT89ec'
});
app.use(fileuploader());
app.use(express.urlencoded(true));
const bcrypt = require("bcrypt");
/* Serve static files from the "public" directory */
app.use(express.static("public"));
// avien cloud connection
var mysql = require("mysql2");
let config = "mysql://avnadmin:AVNS_vlC2U6o_RTqq987sX7F@studynest-studynest.i.aivencloud.com:25431/defaultdb?";
let db = mysql.createConnection(config);
db.connect(function (err) {
    if (err == null)
        console.log("connected to database");
    else
        console.log(err.message);
})
app.get("/", function (req, resp) {
    let path = __dirname + "/public/index.html";
    resp.sendFile(path);
})
app.use(express.urlencoded(true));

app.listen(port, function (req, resp) {
    console.log("Server is running on http://localhost:${port}");
})
app.get("/signup", function (req, resp) {

    let reg = req.query.reg;
    let pass = req.query.pass;
    let enc;
    bcrypt.genSalt(10, function (err, salt) {
        bcrypt.hash(pass, salt, function (err, hash) {
            enc = hash;
        })
    })
    let email = req.query.email;
    let utype = "STUDENT";
    db.query("select * from users where email=?", [email], function (err, jsonArray) {
        if (jsonArray.length == 1) {
            console.log("taken");
            resp.send("email id already taken");
        }
        else {
            db.query("insert into users values(?,?,?,?)", [email, reg, enc, utype], function (err) {
                if (err == null) {
                    resp.send("Successfully signed up as student please login to continue.");
                }
                else
                    resp.send("User with reg no exits please login");
            })
        }
    })

})
app.get("/login", function (req, resp) {
    let reg = req.query.txtreg;
    let pass = req.query.txtpass;
    let enc;
    bcrypt.genSalt(10, function (err, salt) {
        bcrypt.hash(pass, salt, function (err, hash) {
            enc = hash;
        })
    })
    // console.log(reg);
    db.query("select * from users where reg=?", [reg], function (err, jsonArray) {
        console.log(jsonArray.length);
        // console.log(jsonArray[0]["utype"]);
        if (jsonArray.length == 1) {
            bcrypt.compare(pass, enc, function (err, result) {
                if (result == true)
                    resp.send(jsonArray[0]["utype"])
                else
                    resp.send("invalid password");
            })
        }
        else
            resp.send("Invalid Reg. No.");
    })
})
app.post("/upload-assignments", async function (req, resp) {

    let reg = req.body.txtreg;
    let sub = req.body.txtSub;
    let title = req.body.txttitle;
    let email = req.body.txtEmail;
    let name = req.body.txtName;
    let dop = req.body.date_dop;
    let othinfo = req.body.txtinfo;
    let path = __dirname + "/public/uploads/" + req.files.pdffile.name;
    req.files.pdffile.mv(path);
    await cloudinary.uploader.upload(path).then(function (result) {
        pdfname = result.url;
        console.log(pdfname);
    });
    db.query("insert into assignments values(?,?,?,?,?,?,?,?,?)", [null, reg, email, sub, title, dop, name, othinfo, pdfname], function (err) {
        if (err == null) {
            resp.send("Uploaded Successfulyy");
        }
        else
            resp.send(err.message);
    })
})

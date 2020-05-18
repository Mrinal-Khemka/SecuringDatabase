//jshint esversion:6
require('dotenv').config();
const express=require("express");
const bodyParser=require("body-parser");
const ejs=require("ejs");
const mongoose=require("mongoose");
const md5=require("md5");
const bcrypt=require("bcrypt");
const saltRounds=10;
const app= express();
app.use(bodyParser.urlencoded({extended:true}));
app.set("view engine","ejs");
app.use(express.static("public"));
mongoose.connect("mongodb://localhost/userDB",{useNewUrlParser:true,useUnifiedTopology: true });
const userSchema= new mongoose.Schema({
  userName:String,
  password:String
});
//process.env.SOME_LONG_UNGUESSABLE_STRING;
// userSchema.plugin(encrypt, { secret: process.env.SECRET,encryptedFields:["password"]});
const User= new mongoose.model("User",userSchema);
app.get("/",function(req,res)
{
  res.render("home");
});
app.get("/register",function(req,res)
{
  res.render("register");
});
app.get("/login",function(req,res)
{
  res.render("login");
});
 app.post("/register",function(req,res)
 {
  bcrypt.hash(req.body.password, saltRounds, function(err, hash) {
  const user=new User(
    {
      userName:req.body.username,
      password:hash
    });
    user.save(function(err)
    {
      if(!err)
      {
        res.render("secrets");
      }
      else
      {
        console.log("some error has been occured while signing you up");
      }
    });
});
   

  
 });
  app.post("/login",function(req,res)
  {
   // console.log("hello");
     const password=req.body.password;
     User.findOne({userName:req.body.username},function(err,foundUser)
     {
       if(!err)
       {
        bcrypt.compare(password, foundUser.password, function(err, result) {
          if( result == true)
          {
               res.render("secrets");
               
             }
             else
             {
               console.log("error in logging you  ");
             }
      });
         
       }
     });
  });
  app.post("/submit",function(req,res)
  {
     const secret=req.body.secret;
     console.log(secret);
  });
app.listen("3000",function()
{
console.log("server started successfully");
});
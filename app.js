//jshint esversion:6
require('dotenv').config();
const express=require("express");
const bodyParser=require("body-parser");
const ejs=require("ejs");
const mongoose=require("mongoose");
const session = require('express-session');
const passport=require("passport");
const passportLocal=require("passport-local");
const passportLocalMongoose= require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy=require("passport-facebook").Strategy;
const findOrCreate = require('mongoose-findorcreate')

const app= express();
app.use(bodyParser.urlencoded({extended:true}));
app.set("view engine","ejs");
app.use(express.static("public"));
app.use(session({
  secret: 'our little secret',
  resave: false,
  saveUninitialized: true
}));
app.use(passport.initialize());
app.use(passport.session());
mongoose.connect("mongodb://localhost/userDB",{useNewUrlParser:true,useUnifiedTopology: true });
const secretSchema=new mongoose.Schema(
  {
     secret:String
  }
);
 const Secret= new mongoose.model("Secret",secretSchema);
const userSchema= new mongoose.Schema({
  userName:String,
  password:String,
  sId:String,
  secrets:[secretSchema]
});
userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);
const User= new mongoose.model("User",userSchema);
mongoose.set('useCreateIndex', true);
passport.use(User.createStrategy());
 
// passport.serializeUser(User.serializeUser());
// passport.deserializeUser(User.deserializeUser());
passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});
passport.use(new GoogleStrategy({
  clientID: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET,
  callbackURL: "http://localhost:3000/auth/google/secrets",
  userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
},
function(accessToken, refreshToken, profile, cb) {
  // console.log(profile);
  
  User.findOrCreate({ sId: profile.id }, function (err, user) {
    return cb(err, user);
  });
}
));
passport.use(new FacebookStrategy({
  clientID: process.env.FACEBOOK_APP_ID,
  clientSecret:  process.env.FACEBOOK_APP_SECRET,
  callbackURL: "http://localhost:3000/auth/facebook/secrets",
  profileFields: ['id', 'displayName', 'photos', 'email']
},
function(accessToken, refreshToken, profile, cb) {
  // console.log(profile);
  
  User.findOrCreate({ sId: profile.id }, function (err, user) {
    return cb(err, user);
  });
}
));
app.get("/",function(req,res)
{
  if(req.isAuthenticated())
  {
       res.redirect("secrets");
  }
  else
  {
  res.render("home");
  }
});
app.get('/auth/google',
  passport.authenticate("google", { scope: ['profile'] }));
  app.get("/auth/google/secrets", 
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/');
  });
  app.get('/auth/facebook',
  passport.authenticate('facebook'));
  app.get('/auth/facebook/secrets',
  passport.authenticate('facebook', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/');
  });
app.get("/register",function(req,res)
{
  res.render("register");
});
app.get("/login",function(req,res)
{
  res.render("login");
});
app.get("/secrets",function(req,res)
{
    //console.log(req.isAuthenticated());
   if(req.isAuthenticated( ))
   {
    User.findById(req.user.id, function(err, foundUser){

       // console.log(foundUser);
          if (err){
            console.log(err);
          } else {
            if (foundUser) {
      
              res.render("secrets", {usersWithSecrets: foundUser.secrets});
            }
          }
       });
     //console.log("hello");
     
     
   }
   else
   {
  //   console.log("world");
     res.redirect("/login");
   }
});
// app.get("/secrets", function(req, res){
//   User.find({"secrets": {$ne: null}}, function(err, foundUsers){
//     if (err){
//       console.log(err);
//     } else {
//       if (foundUsers) {

//         res.render("secrets", {usersWithSecrets: foundUsers});
//       }
//     }
//   });
// });

app.get("/submit", function(req, res){
  if (req.isAuthenticated()){
    res.render("submit");
  } else {
    res.redirect("/login");
  }
});

app.post("/submit", function(req, res){
  const submittedSecret = new Secret( {
   secret: req.body.secret
   } );

//Once the user is authenticated and their session gets saved, their user details are saved to req.user.
  // console.log(req.user.id);
    //console.log(submittedSecret);
  User.findById(req.user.id, function(err, foundUser){
  //  console.log(foundUser);
    if (err) {
      console.log(err);
    } else {
      if (foundUser) {
        foundUser.secrets.push(submittedSecret);
        foundUser.save(function(){
          res.redirect("/secrets");
        });
      }
    }
  });
});

app.get("/logout",function(req,res)
{
  req.logout();
  res.redirect("/");
})
 app.post("/register",function(req,res)
 {
  User.register({username:req.body.username},req.body.password, function(err, user) {
    if(err)
    {
      
      console.log(err);
      res.redirect("/register");
      
    }
    else{
      passport.authenticate("local")(req,res,function()
       {
           res.redirect("/secrets");
       });
    }
  });
});
   
  app.post("/login",function(req,res)
  {
   const user=new User(
     {
       userName:req.body.username,
       password:req.body.password
     }
   );
   req.login(user,function(err)
   {
     if(err)
     {

       console.log(err);   
     }
     else{
      passport.authenticate("local")(req,res,function()
      {
          res.redirect("/secrets");
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
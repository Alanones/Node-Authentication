//jshint esversion:6
require('dotenv').config()
const express = require('express');
const ejs = require('ejs');
const mongoose = require('mongoose');
const session = require('express-session')
const passport = require("passport");
const passportLocalMongoose = require('passport-local-mongoose');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate');


const app = express();

app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(express.urlencoded({extended:true}));

// //////// Sesssions and Cookies //////
app.use(session({
  secret: process.env.SECRET,
  resave: false,
  saveUninitialized: true
}));

app.use(passport.initialize());
app.use(passport.session());


mongoose.connect("mongodb://localhost:27017/userDB");

const userSchema = new mongoose.Schema({
  email:String,
  password:String,
  googleId: String
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);


const User = mongoose.model('User', userSchema);
app.get('/', (req, res)=>{
  res.render('home');
});


passport.use(User.createStrategy());

// passport.serializeUser(User.serializeUser());
// passport.deserializeUser(User.deserializeUser());

passport.serializeUser(function(user, cb) {
  process.nextTick(function() {
    return cb(null, {
      id: user.id,
      username: user.username
    });
  });
});

passport.deserializeUser(function(user, cb) {
  process.nextTick(function() {
    return cb(null, user);
  });
});




// //////  Google Login
//   userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets"
  },
  function(accessToken, refreshToken, profile, cb) {

    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));



app.get('/login', (req, res)=>{
  res.render('login');
});


// Note, No callback function
app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile'] }));


app.get('/auth/google/secrets',
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect secrets.
    res.redirect('/secrets');
  });


app.get('/register', (req, res)=>{
  res.render('register');
});

app.get('/secrets', (req, res)=>{
  if (req.isAuthenticated()){
    res.render("secrets");
  }else{
    res.redirect('login');
  }
});

app.get('/logout', (req, res)=>{
  req.logout(function(err){
    if(err){
      console.log(err);
      res.redirect('/secrets')
    }else{
      res.redirect('/');
    }
  });

});

app.post('/register', (req, res)=>{
  //  register method comes from passport-local-mongoose
  User.register({username:req.body.username}, req.body.password, (err, registeredUser)=>{
    if(err){
      console.log(err);
      res.redirect('/register');
    }else{
      passport.authenticate("local")(req, res, function(){
        res.redirect('/secrets');
      });
    }
  });
});

app.post('/login', (req, res)=>{
  const user = new User({
    username:req.body.username,
    passowrd:req.body.passowrd
  });
  // login method comes from passport
  req.login(user, (err)=>{
    if(err){
      console.log(err);
      res.redirect('/login');
    }else{
      passport.authenticate("local")(req, res, function(){
        res.redirect('/secrets');
      });
    }
  });

});


app.listen(3000, ()=>{
  console.log("Server started on port 3000");
});

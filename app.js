//jshint esversion:6
require('dotenv').config()
const express = require('express');
const ejs = require('ejs');
const mongoose = require('mongoose');
const session = require('express-session')
const passport = require("passport");
const passportLocalMongoose = require('passport-local-mongoose');


const app = express();

app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(express.urlencoded({extended:true}));

// //////// Sesssions and Cookies //////
app.use(session({
  secret: 'Our little secret',
  resave: false,
  saveUninitialized: true
}));

app.use(passport.initialize());
app.use(passport.session());


mongoose.connect("mongodb://localhost:27017/userDB");

const userSchema = new mongoose.Schema({
  email:String,
  password:String
});

userSchema.plugin(passportLocalMongoose);


const User = mongoose.model('User', userSchema);
app.get('/', (req, res)=>{
  res.render('home');
});


passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.get('/login', (req, res)=>{
  res.render('login');
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

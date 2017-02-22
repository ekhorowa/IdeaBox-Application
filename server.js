const express = require('express');
const bodyParser = require('body-parser');

const firebase = require('firebase');
const firebaseDb = require('firebase/database');
const session  = require('express-session'); // to store use session

const app = express();

// we try to use environment port if it exist or 3000 if it does not
const port = process.env.PORT || 3000;
app.set('trust proxy', 1);

app.use(session({
  secret: 'secret',
  resave: false,
  saveUninitialized: true
}));


// Initialize Firebase
var config = {
  apiKey: "AIzaSyCPPV4JVsXnAe7s31n0Pyc5vRd_zG70ikc",
  authDomain: "test-project-67ccc.firebaseapp.com",
  databaseURL: "https://test-project-67ccc.firebaseio.com",
  storageBucket: "test-project-67ccc.appspot.com",
  messagingSenderId: "467348098633"
};
firebase.initializeApp(config);

// require the models we've created
const userModel = require('./models/Users')(firebase);
const idea = require('./models/Idea')(firebase);

// use bodyParser to parse incoming payload request
app.use(bodyParser.urlencoded({ extended: false }));

app.set('view engine', 'ejs');

// parse application/json
app.use(bodyParser.json());



// set public directory as static

app.use(express.static('public'));

app.get('/', function(req, res) {
  if (typeof req.session.userData !== 'undefined') {
    res.redirect('/ideas');
  } else {
    res.redirect('/login');
  }
});

app.route('/login')
  .get(function (req, res) {
    res.render('login', {message:''});
  })
  .post(function (req, res) {
    const email = req.body.email;
    const password = req.body.password;

    const result = userModel.login(email, password, function(result) {
      console.log('Result is = ', result);
      if (result.status == 'success') {
        //We save the user session details

        req.session.isLoggedIn = true;
        req.session.userKey = result.data[0];
        req.session.userData = result.data[1];

        res.redirect('/ideas');

      } else {
        res.render('login', {errors: result.data, message: result.message});
      }
    });
  });

app.route('/register')
  .get(function (req, res) {
    res.render('register', {errors:[]});
  })
  .post(function (req, res) {

    const fullName = req.body.fullname;
    const email = req.body.email;
    const password = req.body.password;
    const retypePassword = req.body.retype_password;

    userModel.register(fullName, email, password, retypePassword, function(result) {
      if(result.status == 'success') {

        res.redirect('/');
      }else{
        res.render('register', {errors: result.data, message: result.message});
      }
    });


  });

app.get('/ideas', function(req, res){
  res.send('Ideas haha')
});

app.get('comments/:ideaId', function(req, res){

});

app.post('/idea', function (req, res) {

});

app.post('idea/comment/:id', function(req, res){

});


app.get('upvote/:ideaId', function(req, res){

});

app.get('downvote/:ideaId', function(req, res){

});

app.get('/logout', function(req, res){
  delete req.session.userKey;
  delete req.session.userData;
  res.redirect('/');
});

app.listen(port, function(){
  console.log('Application started on port '+ ( process.env.PORT || 3000 ));
});

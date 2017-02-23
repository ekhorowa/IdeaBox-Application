const express = require('express');//I imported express for use
const bodyParser = require('body-parser');//I imported body-parser for extract the entire body portion of an incoming request

const firebase = require('firebase');//I imported firebase for use
const firebaseDb = require('firebase/database');//I imported firebase database for use
const session  = require('express-session'); // I imported express-session to store users session

const app = express();//I assigned express function to the constant app

// I use environment port if it exist or 3000 if it does not
const port = process.env.PORT || 3000;
app.set('trust proxy', 1);//I am running express behind a proxy here and am telling it to trust the first proxy

app.use(session({ //I initialized my sessions
  secret: 'secret',
  resave: false,
  saveUninitialized: true
}));


// I Initialized Firebase
  var config = {
    apiKey: "AIzaSyBQxNSke9J0zdnZZLogg4JNavdqi1DheFc",
    authDomain: "idea-box-project.firebaseapp.com",
    databaseURL: "https://idea-box-project.firebaseio.com",
    storageBucket: "idea-box-project.appspot.com",
    messagingSenderId: "324400193565"
  };
  firebase.initializeApp(config)

//I required the models I created here
const userModel = require('./models/Users')(firebase);
const Idea = require('./models/Idea')(firebase);

//I use bodyParser to parse incoming payload request
app.use(bodyParser.urlencoded({ extended: false }));

//I set the view engine to ejs
app.set('view engine', 'ejs');

//I tell app to parse JSON
app.use(bodyParser.json());



//I set public directory as static
app.use(express.static('public'));

 //
app.get('/', function(req, res) {
  if (typeof req.session.userData !== 'undefined') {
    res.redirect('/ideas');
  } else {
    res.redirect('/login');//it redirects to the login route
  }
});


app.route('/login')
  .get(function (req, res) {//I tell express to get the handler for the login route
    res.render('login', {message:''});//my login template is compiled here and messages I used for validating users input are sent out as input
  })
  .post(function (req, res) {//I tell express to post the handler for the login route
    const email = req.body.email;
    const password = req.body.password;

    const result = userModel.login(email, password, function(result) {
      if (result.status == 'success') {
        //We save the user session details

        req.session.isLoggedIn = true;
        req.session.userKey = result.data[0];
        req.session.userData = result.data[1];

        res.redirect('/idea');

      } else {
        res.render('login', {errors: result.data, message: result.message});
      }
    });
  });

app.route('/register')
  .get(function (req, res) {
    if(typeof req.session.isLoggedIn !== 'undefined' && req.session.isLoggedIn){
      res.redirect('/');
    }
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

//Its having issues
app.get('/ideas', function(req, res) {
  if(typeof req.session.isLoggedIn !== 'undefined' && req.session.isLoggedIn){
    Idea.allIdeas(function(ideas) {
      res.render('ideas', {ideas: ideas });
    });
  }else {
    res.redirect('/login');
  }

});

app.get('/comments/:ideaId', function(req, res){

});

app.route('/idea')
  .get(function(req, res){
    if(typeof req.session.isLoggedIn !== 'undefined' && req.session.isLoggedIn){
      res.render('create_idea', {errors:[]});
    }else {
      res.redirect('/login');
    }

  })
  .post(function (req, res) {
    const title = req.body.title;
    const description = req.body.description;

    Idea.addIdea(title, description, function(response){
      if(response.status == 'success') {
        res.redirect('/ideas');
      }else{
        res.render('create_idea', {errors: response.data, message: response.message});
      }
    });

  });

app.post('/idea/comment/:ideaId', function(req, res){

});

app.get('/view_idea/:ideaId', function(req, res){
  if(typeof req.session.isLoggedIn !== 'undefined' && req.session.isLoggedIn){
    Idea.getIdea(req.params.ideaId, function(idea){
      res.render('idea_info', {idea: idea, errors:[]});
    });
  }else {
    res.redirect('/login');
  }

});


app.get('/upvote/:ideaId', function(req, res){

});

app.get('/downvote/:ideaId', function(req, res){

});

app.get('/logout', function(req, res){
  delete req.session.userKey;
  delete req.session.userData;
  delete req.session.isLoggedIn;
  res.redirect('/login');
});

app.listen(port, function(){
  console.log('Application started on port '+ ( process.env.PORT || 3000 ));
});

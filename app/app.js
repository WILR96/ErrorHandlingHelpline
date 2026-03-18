// Import express.js
const express = require("express");
const session = require('express-session');

// Import Controllers
const PostsController = require('./controllers/PostsController');
const UsersController = require('./controllers/UsersController');

// Create express app
var app = express();

// Add static files location
app.use(express.static("static"));

//Set viewengine to pug.
app.set('view engine', 'pug');

//Set views folder
app.set('views', './app/views')

// Allow Express to parse HTML forms
app.use(express.urlencoded({
    extended: true
}));

// Session setup
app.use(session({
    secret: 'errorhelpline-secret',
    resave: false,
    saveUninitialized: false
}));

// Allow pug templates to access user session
app.use((req, res, next) => {
    res.locals.user = req.session.user;
    next();
});

// Helper func to test if user is logged in
function requireLogin(req, res, next) {
    if (!req.session.user) {

        req.session.error = "You must log in first"

        return res.redirect('/login');
    }
    next();
}

//Routes
app.get('/', PostsController.showHome);
app.get('/posts', PostsController.showPosts);
app.get('/posts/:id', PostsController.showSinglePost);


app.get('/users', requireLogin, UsersController.listUsers);
app.get('/users/:id', requireLogin, UsersController.showUserProfile);

app.get('/sign-up', UsersController.showSignupForm);
app.post('/sign-up', UsersController.signupUser);

app.get('/login', UsersController.showLogin);
app.post('/login', UsersController.loginUser);


// Start server on port 3000
app.listen(3000, function() {
    console.log(`Server running at http://localhost:8080/`);
});
// Import express.js
const express = require("express");
// import express session so we can manage user sessions
const session = require('express-session');

// Import Controllers
const db = require('./services/db');
const UsersModel = require('./models/UserModel');
const PostsModel = require('./models/PostsModel');
const UserController = require('./controllers/UsersController');
const PostController = require('./controllers/PostsController');

// init models
const usersModel = new UsersModel(db);
const postsModel = new PostsModel(db, usersModel);
// init controllers
const userController = new UserController(usersModel, postsModel);
const postController = new PostController(usersModel, postsModel);

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

function requireGuest(req, res, next) {
    if (req.session.user) {
        return res.redirect('/'); // already logged in then go home
    }
    next();
}

//post routes
app.get('/', postController.showHome.bind(postController));
app.get('/posts', postController.showPosts.bind(postController));
app.get('/posts/new', requireLogin, postController.showCreatePost.bind(postController));
app.post('/posts/new', requireLogin, postController.createPost.bind(postController));
app.get('/posts/:id', postController.showSinglePost.bind(postController));

//responses (replies, votes, reports, accept answer)
app.post('/posts/:id/reply', requireLogin, postController.createComment.bind(postController));
app.post('/posts/reply/:id/report',requireLogin, postController.reportResponse.bind(postController));
app.post('/posts/reply/:id/upvote', requireLogin, postController.upvoteComment.bind(postController));
app.post('/posts/reply/:id/downvote', requireLogin, postController.downvoteComment.bind(postController));
app.post('/posts/reply/:id/accept', requireLogin, postController.acceptResponse.bind(postController));

//other pages 
app.get('/archives', postController.showPostsByOldest.bind(postController));
app.get('/leaderboards', requireLogin, userController.listUsers.bind(userController));
app.get('/users/:id', requireLogin, userController.showUserProfile.bind(userController));

//user account / auth
app.get('/sign-up', requireGuest, userController.showSignupForm.bind(userController));
app.post('/sign-up', requireGuest, userController.signupUser.bind(userController));
app.get('/login', requireGuest, userController.showLogin.bind(userController));
app.post('/login', requireGuest, userController.loginUser.bind(userController));
app.get('/logout', requireLogin, userController.logout.bind(userController))



// Legal pages
app.get('/terms', (req, res) => {
    res.render('terms', { active: 'terms' });
});

app.get('/privacy', (req, res) => {
    res.render('privacy', { active: 'privacy' });
});

app.get('/forgot-password', (req, res) => {
    res.render('forgot-password', { active: 'forgot-password' });
});

// OAuth routes (placeholder - to be implemented with actual OAuth providers)
app.get('/auth/github', (req, res) => {
    res.render('forgot-password', { 
        error: 'GitHub OAuth integration coming soon!',
        active: 'forgot-password'
    });
});

app.get('/auth/google', (req, res) => {
    res.render('forgot-password', { 
        error: 'Google OAuth integration coming soon!',
        active: 'forgot-password'
    });
});


// Start server on port 3000
app.listen(3000, function() {
    console.log(`Server running at http://localhost:8080/`);
});
// Import express.js
const express = require("express");
const session = require('express-session');
const bcrypt = require('bcrypt');

// Create express app
var app = express();

// Add static files location
app.use(express.static("static"));

//Set viewengine to pug.
app.set('view engine', 'pug');
app.set('views', './app/views')

// Get the functions in the db.js file to use
const db = require('./services/db');

// Allow Express to parse HTML forms
app.use(express.urlencoded({ extended: true }));

// Session setup
app.use(session({
  secret: 'errorhelpline-secret',
  resave: false,
  saveUninitialized: false
}));

// Helper func to test if user is logged in
function requireLogin(req, res, next) {
  if(!req.session.user){
    return res.redirect('/login');
  }
  next();
}

// Allow pug templates to access user session
app.use((req, res, next) => {
  res.locals.user = req.session.user;
  next();
});

// Create a route for root - /
app.get('/', async (req, res) => {
  const sql = 'SELECT * FROM posts ORDER BY created_at DESC LIMIT 5';
  try {
    const rows = await db.query(sql);
    res.render('index', {
      posts: rows,
      active: null
    });
  } catch (err) {
    console.error(err);
    res.render('index', { posts: [] });
  }
});

//List of users
app.get('/users', function(req, res){
    var sql = 'select * from users';
    db.query(sql).then(results => {
        res.render('users',{'users':results})
    });
});

//User profile page
app.get('/users/:id', function(req, res){
    sql = 'select * from users where id = ?';
    db.query(sql).then(results => {
        user = results[0];
        res.render('userProfile',{user})
    });
});

// Posts page (Listing page)
app.get('/posts', function(req, res){
    const sql = 'SELECT * FROM posts ORDER BY created_at DESC';
    db.query(sql).then(posts => {
        res.render('posts', { posts });
    });
});

// Posts page (Listing page)
app.get('/sign-up', function(req, res){
    res.render('sign-up');
});

//Post detail page
app.get('/posts/:id', function(req, res){
    const sql = 'SELECT * FROM posts WHERE id = ?';
    db.query(sql, [req.params.id]).then(rows => {
        const post = rows[0];
        if (!post) return res.status(404).send('Post not found');
        res.render('single-post', { post });
    });
});

//Post categories
app.get('/tags/:tag', function(req, res){
    //C++
    //Python
    //Java
    //JavaScript
});

// Login page
app.get('/login', function(req, res){
    res.render('login');
});

//Login Page POST logic
app.post('/login', async function(req, res){
    const { username, password } = req.body;
    const sql = 'SELECT * FROM users WHERE username = ?';
    const results = await db.query(sql, [username]);
    if(results.length === 0){
        return res.render('login', { error: "User not found" });
    }
    const user = results[0];
    const match = await bcrypt.compare(password, user.password_hash);
    if(!match){
        return res.render('login', { error: "Incorrect password" });
    }
    // store user session
    req.session.user = {
        id: user.id,
        username: user.username
    };
    res.redirect('/');
});

// Signup page POST logic
app.post('/sign-up', async function(req, res){
  const { username, email, password } = req.body;
  if(!username || !email || !password){
    return res.render('sign-up', { error: "All fields are required" });
  }
  // check if username already exists
  const existing = await db.query(
    'SELECT * FROM users WHERE username = ?',
    [username]
  );
  if(existing.length > 0){
    return res.render('sign-up', { error: "Username already taken" });
  }
  const hashedPassword = await bcrypt.hash(password, 10);
  await db.query(
    'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)',
    [username, email, hashedPassword]
  );
  res.redirect('/login');
});



// Create a route for testing the db
app.get("/db_test", requireLogin, function(req, res) {
    // Assumes a table called test_table exists in your database
    sql = 'select * from test_table';
    db.query(sql).then(results => {
        console.log(results);
        res.send(results)
    });
});

// Start server on port 3000
app.listen(3000,function(){
    console.log(`Server running at http://localhost:8080/`);
});
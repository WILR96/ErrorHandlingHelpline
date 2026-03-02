// Import express.js
const express = require("express");

// Create express app
var app = express();

// Add static files location
app.use(express.static("static"));

//Set viewengine to pug.
app.set('view engine', 'pug');
app.set('views', './app/views')

// Get the functions in the db.js file to use
const db = require('./services/db');

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
        res.render('AllUsers',{'Users':results})
    });
});

//User profile page
app.get('/users/:id', function(req, res){
    var sql = 'select * from users where id =' + req.params.user;
    db.query(sql).then(results => {
        user = results[0];
        res.render('userProfile',{user})
    });
});

// Posts page (Listing page)
app.get('/posts', function(req, res){

});

//Post detail page
app.get('/posts/:id', function(req, res){
    sql = 'select * from posts WHERE id =' + req.params.id;
    db.query(sql).then(posts => {
        const post = rows[0];
        if (!post) return res.status(404).send('Post not found');
        res.render('post', { post });
    });
});

//Post categories
app.get('/tags/:tag', function(req, res){
    //C++
    //Python
    //Java
    //JavaScript
});

// Create a route for testing the db
app.get("/db_test", function(req, res) {
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
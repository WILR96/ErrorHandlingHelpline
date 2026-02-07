// Import express.js
const express = require("express");

// Create express app
var app = express();

// Add static files location
app.use(express.static("static"));
app.use(express.json());
app.use(express.urlencoded({extended: true}));

// Get the functions in the db.js file to use
const db = require('./services/db');

// Create a route for root - /
app.get("/", function(req, res) {
    res.send("Hello world!");
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

// Create a route for /goodbye
// Responds to a 'GET' request
app.get("/goodbye", function(req, res) {
    res.send("Goodbye world!");
});

// Create a dynamic route for /hello/<name>, where name is any value provided by user
// At the end of the URL
// Responds to a 'GET' request
app.get("/hello/:name", function(req, res) {
    // req.params contains any parameters in the request
    // We can examine it in the console for debugging purposes
    console.log(req.params);
    //  Retrieve the 'name' parameter and use it in a dynamically generated page
    res.send("Hello " + req.params.name);
});

/*
db.connect(err => {
    if (err) {
        console.error('Database connection failed.', err);
        process.exit(1);
    }
    console.log('Connected to MySQL database.');
});
*/

app.post("/tickets", async function(req, res) {
    const {title, description} = req.body;
    if (!title || !description) {
        return res.status(400).json({error: 'Title and description are required.'});
    }
    const sql = 'INSERT INTO tickets (title, description) VALUES (?, ?)';
    await db.query(sql, [title, description], (err, result) => {
        if (err) return res.status(500).json({error: err.message});
        res.status(201).json({id: result.insertId, title, description, status: 'open'});
    });
});

app.get("/tickets", async function(req, res) {
    try {
        const tickets = await db.query(
            'SELECT * FROM tickets ORDER BY created_at DESC'
        );
        res.json(tickets);
    } catch (err) {
        console.error(err);
        res.status(500).json({error: err.message});
    }
    /*
    db.query('SELECT * FROM tickets ORDER BY created_at DESC', (err, results) => {
        if (err) return res.status(500).json({error: err.message});
        res.json(results);
    });
    */
});

app.put("/tickets/:id", function(req, res) {
    const {status} = req.body;
    const validStatuses = ['open', 'in_progress', 'closed'];
    if (!validStatuses.includes(status)) {
        return res.status(400).json({error: 'Invalid status'});
    }
    db.query('UPDATE tickets SET status = ? WHERE id = ?', [status, req.params.id], (err, result) => {
        if (err) return res.status(500).json({error:err.message});
        res.json({message: 'Ticket updated successfully'});
    });
});

// Start server on port 3000
app.listen(3000,function(){
    console.log(`Server running at http://127.0.0.1:3000/`);
});
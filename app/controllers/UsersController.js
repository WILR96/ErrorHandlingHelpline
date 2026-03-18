//imports
const UsersModel = require('../models/UserModel');
//using bcrypt for password hashing
const bcrypt = require('bcrypt');

//instantiate UsersModel with database connection
const usersModel = new UsersModel(require('../services/db'));

//listusers func that handles the users route, gets all users from the related method
async function listUsers(req, res) {
    const users = await usersModel.getAllUsers();
    res.render('users', {
        users,
        // active is a variable used by the layout pug to highlight the current page
        active: "Users"
    });
}

//just render the sign-up page 
async function showSignupForm(req, res) {
    res.render('sign-up');
}

//render the login page, with any errors that have been passed
async function showLogin(req, res) {
    const error = req.session.error
    req.session.error = null;
    res.render('login', {
        error: error,
        active: "login"
    });
}
//handles the /users/:id route, displays the requested users profile using the getUserById method
async function showUserProfile(req, res) {
    const user = await usersModel.getUserById(req.params.id);
    res.render('userProfile', {
        user
    });
}

function logout(req, res) {
    //remove the user from session
    delete req.session.user;
    res.redirect('/');
}

async function signupUser(req, res) {
    //extract user signup form fields from req.body
    const {
        username,
        email,
        password
    } = req.body;
    //if any of the fields are not supplied then return with an error
    if (!username || !email || !password) {
        return res.render('sign-up', {
            error: "All fields are required"
        });
    }
    //otherwise we will them check if the username supplied is the same as any other user
    const existingUser = await usersModel.getUserByUsername(username);
    //if they exist then we will notify the user 
    if (existingUser) return res.render('sign-up', {
        error: "Username already taken"
    });
    //all checks have been passed, we will now hash the password with bcrypt.
    const passwordHash = await bcrypt.hash(password, 10);
    //and create the user, which updates the user database
    await usersModel.createUser(username, email, passwordHash);
    //redirect the user to the login page
    res.redirect('/login');
}

//function to log the user in
async function loginUser(req, res) {
    //extract user signup form fields from req.body
    const {
        username,
        password
    } = req.body;
    //check if the user exists
    const user = await usersModel.getUserByUsername(username);
    //user doesn't exist
    if (!user) return res.render('login', {
        error: "User not found"
    });
    //user does exist, check the password next
    const match = await bcrypt.compare(password, user.password_hash);
    //if the password is incorrect, return an error
    if (!match) return res.render('login', {
        error: "Incorrect password"
    });
    //everything is good, username and password is correct!
    req.session.user = {
        id: user.id,
        username: user.username
    };
    //redirect to home
    res.redirect('/');
}
//export all functions
module.exports = {
    listUsers,
    showUserProfile,
    signupUser,
    loginUser,
    showLogin,
    showSignupForm,
    logout
};
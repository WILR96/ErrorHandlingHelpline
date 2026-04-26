//imports
const bcrypt = require('bcrypt');

class UserController {
    constructor(usersModel, postsModel) {
        this.usersModel = usersModel;
        this.postsModel = postsModel;
    }
    //listusers func that handles the users route, gets all users from the related method
    async listUsers(req, res) {
        try {
            const page = parseInt(req.query.page) || 1;
            const sortBy = req.query.sort || 'reputation';
            const searchQuery = req.query.search || '';
            const filter = req.query.filter || 'all';
            const itemsPerPage = 12;

            // Get all users
            let users = await this.usersModel.getAllUsers();

            // Filter based on activity or helpers  
            if (filter === 'active') {
                users = users.filter(u => u.isActive);
            } else if (filter === 'helpers') {
                users = users.sort((a, b) => (b.answer_count || 0) - (a.answer_count || 0));
                users = users.slice(0, Math.ceil(users.length * 0.2)); // Top 20%
            }

            // Search functionality
            if (searchQuery) {
                users = users.filter(u => 
                    (u.username && u.username.toLowerCase().includes(searchQuery.toLowerCase())) ||
                    (u.email && u.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
                    (u.name && u.name.toLowerCase().includes(searchQuery.toLowerCase()))
                );
            }

            // Sort functionality
            switch(sortBy) {
                case 'posts':
                    users.sort((a, b) => (b.post_count || 0) - (a.post_count || 0));
                    break;
                case 'recent':
                    users.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
                    break;
                case 'alpha':
                    users.sort((a, b) => (a.username || '').localeCompare(b.username || ''));
                    break;
                case 'reputation':
                default:
                    users.sort((a, b) => (b.reputation || 0) - (a.reputation || 0));
            }

            // Calculate pagination
            const totalUsers = users.length;
            const totalPages = Math.ceil(totalUsers / itemsPerPage);
            const startIdx = (page - 1) * itemsPerPage;
            const endIdx = startIdx + itemsPerPage;
            const paginatedUsers = users.slice(startIdx, endIdx);

            // Calculate stats
            const activeCount = (await this.usersModel.getAllUsers()).filter(u => u.isActive).length;
            const totalPosts = (await this.usersModel.getAllUsers()).reduce((sum, u) => sum + (u.post_count || 0), 0);
            const totalAnswers = (await this.usersModel.getAllUsers()).reduce((sum, u) => sum + (u.answer_count || 0), 0);

            res.render('users', {
                users: paginatedUsers,
                totalUsers,
                totalPages,
                currentPage: page,
                sortBy,
                searchQuery,
                activeFilter: filter,
                activeCount,
                totalPosts,
                totalAnswers,
                active: "leaderboards"
            });
        } catch (error) {
            console.error('Error in listUsers:', error);
            res.render('users', {
                users: [],
                totalUsers: 0,
                totalPages: 1,
                currentPage: 1,
                sortBy: 'reputation',
                searchQuery: '',
                activeFilter: 'all',
                activeCount: 0,
                totalPosts: 0,
                totalAnswers: 0,
                error: 'Error loading leaderboard'
            });
        }
    }

    //just render the sign-up page 
    async showSignupForm(req, res) {
        res.render('sign-up');
    }

    //render the login page, with any errors that have been passed
    async showLogin(req, res) {
        const error = req.session.error
        req.session.error = null;
        res.render('login', {
            error: error,
            active: "login"
        });
    }
    //handles the /users/:id route, displays the requested users profile using the getUserById method
    async showUserProfile(req, res) {
        const user = await this.usersModel.getUserById(req.params.id);
        user.postsByUser = await this.postsModel.getPostByUser(req.params.id)
        res.render('userProfile', {
            user
        });
    }

    logout(req, res) {
        //remove the user from session
        delete req.session.user;
        res.redirect('/');
    }

    async signupUser(req, res) {
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
        const existingUser = await this.usersModel.getUserByUsername(username);
        //if they exist then we will notify the user 
        if (existingUser) return res.render('sign-up', {
            error: "Username already taken"
        });
        //all checks have been passed, we will now hash the password with bcrypt.
        const passwordHash = await bcrypt.hash(password, 10);
        //and create the user, which updates the user database
        await this.usersModel.createUser(username, email, passwordHash);
        //redirect the user to the login page
        res.redirect('/login');
    }

    // to log the user in
    async loginUser(req, res) {
        //extract user signup form fields from req.body
        const {
            username,
            password
        } = req.body;
        //check if the user exists
        const user = await this.usersModel.getUserByUsername(username);
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
}

module.exports = UserController;
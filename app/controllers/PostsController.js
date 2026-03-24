//Imports
const PostModel = require('../models/PostsModel');
const db = require('../services/db');

//Create new postModel object
const postModel = new PostModel(db);

//showHome function that displays recent posts by calling the postmodels getRecentPosts method
async function showHome(req, res) {

    try {
        //Get posts
        const posts = await postModel.getRecentPosts();

        for (let post of posts) {
            post.comments = await postModel.getCommentsByPostId(post.id)
        }

        //Render the index pug with the response from the postmodel method ( also set active flag to home)
        res.render('index', {posts, active: "home"});

        //Catch any error 
    } catch (err) {

        //send it to the console
        console.error(err);

        //also render the page with no posts supplied
        res.render('index', {posts: [], active: "home"});
    }
}

//gets all posts from the db, then renders the posts page with the results if there are any.
async function showPosts(req, res) {
    try {
        const categoryId = req.query.category;

        let posts;

        //if we have been supplied with a category, then we will get those posts.
        if (categoryId) { 
            posts = await postModel.getPostByCategory(categoryId)

        //else get all posts using the postmodel    
        } else {    
            posts = await postModel.getAllPosts()
        }
        
        //get the list of categories
        const categories = await postModel.getAllCategories()
        
        //render the posts page with the returned posts
        res.render('posts', {posts, active: "posts", selectedCategory: categoryId, categories: categories});

        //if there are no posts, then we will display the page without them.
    } catch (err) {
        console.error(err);
        res.render('posts', {posts: [], categories: [], active: "posts"});
    }
}

//gets all posts from the db, then renders the posts page with the results if there are any.
async function showPostsByOldest(req, res) {
    try {
        //get all posts using the postmodel
        const posts = await postModel.getAllPostsByOldest();
        //render the posts page with the returned posts
        res.render('archives', {posts, active: "archives"});
        //if there are no posts, then we will display the page without them.
    } catch (err) {
        console.error(err);
        res.render('archives', {posts: [], active: "archives"});
    }
}

async function showSinglePost(req, res) {
    try {
        //get the id param from the request
        const postId = req.params.id;

        //use the postmodel method to get the post 
        const post = await postModel.getPostById(postId);

        //if there is no post for that id then we notify the user with an error text
        if (!post) {
            return res.render('single-post', {error: "Post not found", post: null, active: "posts"});
        }
        //get comments
        post.comments = await postModel.getCommentsByPostId(postId);

        //if we have posts then we can display the page normally
        res.render('single-post', { post, active: "posts"});

        //catch any errors and gracefully handle, notify the user. Output to console.
    } catch (err) {
        console.error("Error loading post:", err);

        res.render('single-post', {error: "Something went wrong. Please try again later.", post: null, active: "posts"});
    }
}

async function showCreatePost(req, res) {
    try {
        //get categories using the postmodel method 
        const categories = await postModel.getAllCategories();
        //render the page with the categories supplied to the pug template
        res.render('create-Post', {categories: categories, error: null});
    
    //catch any errors and supply a error message that can be displayed to the pug template
    } catch (err) {console.error(err);
        res.render('create-Post', {categories: [], error: "Failed to load categories"});
    }
}

async function createPost(req, res) {
    try {
        const { title, content, category_id } = req.body;
        const user_id = req.session.user.id;

        // validation
        if (!title || !content || !category_id) {
            const categories = await postModel.getAllCategories();
            return res.render('create-post', { error: "All fields are required", categories: categories, active: "posts"});
        }

        // pass category into model
        await postModel.createPost(title, content, user_id, category_id);

        res.redirect('/posts');

    } catch (err) {
        console.error(err);

        const categories = await postModel.getAllCategories();

        res.render('create-post', {error: "Failed to create post", categories: categories, active: "posts"});
    }
}

async function createComment(req, res) {
    try {
        const postId = req.params.id;
        const {
            content
        } = req.body;
        const userId = req.session.user.id;
        await postModel.createComment(postId, userId, content);
        res.redirect(`/posts/${postId}`);

    } catch (err) {
        console.error(err);
        res.render(`/posts/${req.params.id}`, {error: "Something went wrong"});
    }
}



//functions we will export.
module.exports = {
    showHome,
    showPosts,
    showSinglePost,
    showPostsByOldest,
    showCreatePost,
    createPost,
    createComment
};
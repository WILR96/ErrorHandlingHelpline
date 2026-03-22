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
        res.render('index', {
            posts,
            active: "home"
        });

        //Catch any error 
    } catch (err) {

        //send it to the console
        console.error(err);

        //also render the page with no posts supplied
        res.render('index', {
            posts: [],
            active: "home"
        });
    }
}

//gets all posts from the db, then renders the posts page with the results if there are any.
async function showPosts(req, res) {
    try {
        //get all posts using the postmodel
        const posts = await postModel.getAllPosts();
        //render the posts page with the returned posts
        res.render('posts', {
            posts,
            active: "posts"
        });
        //if there are no posts, then we will display the page without them.
    } catch (err) {
        console.error(err);
        res.render('posts', {
            posts: [],
            active: "posts"
        });
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
            return res.status(404).render('single-post', {
                error: "Post not found",
                post: null,
                active: "posts"
            });
        }
        //get comments
        post.comments = await postModel.getCommentsByPostId(postId);
        //if we have posts then we can display the page normally

        res.render('single-post', {
            post,
            active: "posts"
        });
        //catch any errors and gracefully handle, notify the user. Output to console.
    } catch (err) {
        console.error("Error loading post:", err);

        res.status(500).render('single-post', {
            error: "Something went wrong. Please try again later.",
            post: null,
            active: "posts"
        });
    }
}

//functions we will export.
module.exports = {
    showHome,
    showPosts,
    showSinglePost
};
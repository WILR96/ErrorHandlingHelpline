class PostsController {
    constructor(usersModel, postsModel) {
        this.usersModel = usersModel;
        this.postsModel = postsModel;
    }

    //showHome that displays recent posts by calling the this.postsmodels getRecentPosts method
    async showHome(req, res) {

        try {
            //Get posts
            const posts = await this.postsModel.getRecentPosts();
            for (let post of posts) {
                post.comments = await this.postsModel.getCommentsByPostId(post.id);
                for (let comment of post.comments){
                    if (comment.is_accepted) {
                        post.solved = true;
                        break
                    }
                }
            }

            //Render the index pug with the response from the this.postsmodel method ( also set active flag to home)
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
    async showPosts(req, res) {
        try {
            const categoryId = req.query.category;

            let posts;
            let thisPage;

            //if we have been supplied with a category, then we will get those posts.
            if (categoryId) { 
                posts = await this.postsModel.getPostByCategory(categoryId)
                thisPage = categoryId

            //else get all posts using the this.postsmodel    
            } else {    
                posts = await this.postsModel.getAllPosts()
                thisPage = "posts"
            }

            for (let post of posts) {
                post.comments = await this.postsModel.getCommentsByPostId(post.id);
                for (let comment of post.comments){
                    if (comment.is_accepted) {
                        post.solved = true;
                        break
                    }
                }
            }

            //get the list of categories
            const categories = await this.postsModel.getAllCategories()

            //render the posts page with the returned posts
            res.render('posts', {posts, active: thisPage, selectedCategory: categoryId, categories: categories});

            //if there are no posts, then we will display the page without them.
        } catch (err) {
            console.error(err);
            res.render('posts', {posts: [], categories: [], active: thisPage});
        }
    }

    //gets all posts from the db, then renders the posts page with the results if there are any.
    async showPostsByOldest(req, res) {
        try {
            //get all posts using the this.postsmodel
            const posts = await this.postsModel.getAllPostsByOldest();
            for (let post of posts){
                post.comments = await this.postsModel.getCommentsByPostId(post.id);
                for (let comment of post.comments){
                    if (comment.is_accepted) {
                        post.solved = true;
                        break
                    }
                }
            }     
            //render the posts page with the returned posts
            res.render('archives', {posts, active: "archives"});
            //if there are no posts, then we will display the page without them.
        } catch (err) {
            console.error(err);
            res.render('archives', {posts: [], active: "archives"});
        }
    }

    async showSinglePost(req, res) {
        try {
            //get the id param from the request
            const postId = req.params.id;
            if (req.session.user) {
                var loggedInUsername = req.session.user.username;
            }

            //use the this.postsmodel method to get the post 
            const post = await this.postsModel.getPostById(postId);

            //if there is no post for that id then we notify the user with an error text
            if (!post) {
                return res.render('single-post', {error: "Post not found", post: null, active: "posts"});
            }
            //get comments
            post.comments = await this.postsModel.getCommentsByPostId(postId);

            //if we have posts then we can display the page normally
            res.render('single-post', { post, loggedInUsername, active: "posts"});

            //catch any errors and gracefully handle, notify the user. Output to console.
        } catch (err) {
            console.error("Error loading post:", err);

            res.render('single-post', {error: "Something went wrong. Please try again later.", user: null, post: null, active: "posts"});
        }
    }

    async showCreatePost(req, res) {
        try {
            //get categories using the this.postsmodel method 
            const categories = await this.postsModel.getAllCategories();
            //render the page with the categories supplied to the pug template
            res.render('create-Post', {categories: categories, error: null});
        
        //catch any errors and supply a error message that can be displayed to the pug template
        } catch (err) {console.error(err);
            res.render('create-Post', {categories: [], error: "Failed to load categories"});
        }
    }

    async createPost(req, res) {
        try {
            const { title, content, category_id } = req.body;
            const user_id = req.session.user.id;

            // validation
            if (!title || !content || !category_id) {
                const categories = await this.postsModel.getAllCategories();
                return res.render('create-post', { error: "All fields are required", categories: categories, active: "posts"});
            }

            // pass category into model
            await this.postsModel.createPost(title, content, user_id, category_id);

            res.redirect('/posts');

        } catch (err) {
            console.error(err);

            const categories = await this.postsModel.getAllCategories();

            res.render('create-post', {error: "Failed to create post", categories: categories, active: "posts"});
        }
    }

    async createComment(req, res) {
        try {
            const postId = req.params.id;
            const {
                content
            } = req.body;
            const userId = req.session.user.id;
            await this.postsModel.createComment(postId, userId, content);
            res.redirect(`/posts/${postId}`);

        } catch (err) {
            console.error(err);
            res.render(`/posts/${req.params.id}`, {error: "Something went wrong"});
        }
    }

    async upvoteComment(req, res) {
        try {
            const userId = req.session.user.id;
            const commentId = req.params.id;
            await this.postsModel.voteResponse(userId, commentId, 1);
            
            res.redirect('back');
            
        } catch (err) {
            console.error(err);
            res.redirect('back');
        }
    }

    async downvoteComment(req, res) {
        try {
            const userId = req.session.user.id;
            const commentId = req.params.id;

            await this.postsModel.voteResponse(userId, commentId, -1);

            res.redirect('back');
        } catch (err) {
            console.error(err);
            res.redirect('back');
        }
    }

    async acceptResponse(req, res) {
        try {
            const responseId = req.params.id;
            const userId = req.session.user.id;

            await this.postsModel.acceptResponse(responseId, userId);

            res.redirect('back');

        } catch (err) {
            console.error(err);
            res.redirect('back');
        }
    }
    
    async reportResponse(req, res){
        try{
            const responseId = req.params.id;
            const userId = req.session.user.id;

            const response = await this.postsModel.getResponseById(responseId);
            console.log(response[0].user_id, userId)
            if (response[0].user_id === userId){
                return res.redirect(`/posts/${response[0].post_id}`, {error: "Something went wrong"});
            }
            await this.postsModel.reportResponse(responseId, userId);
            res.redirect(`/posts/${response[0].post_id}`);
        } catch (err) {
            console.error(err);
            res.redirect(`/posts/${response[0].post_id}`);
        }
    }
}

module.exports = PostsController
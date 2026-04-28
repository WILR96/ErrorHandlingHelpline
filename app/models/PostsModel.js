class PostModel {
    constructor(db, usersModel) {
        this.db = db;
        this.usersModel = usersModel;
    }

    //get a list of the most recent posts
    async getRecentPosts(limit = 5) {
        const safeLimit = parseInt(limit);
        //get the posts with the posts with the authors username
        const sql = `
            SELECT posts.*, users.username
            FROM posts
            JOIN users ON posts.user_id = users.id
            ORDER BY created_at DESC
            LIMIT ${safeLimit}
        `;
    
        return await this.db.query(sql);
    }
    
    //get all the posts from the db
    async getAllPosts() {
        const sql = `
        SELECT posts.*, users.username
        FROM posts
        JOIN users ON posts.user_id = users.id
        ORDER BY created_at DESC
        `;
        return await this.db.query(sql);
    }

    //get a post by its id
    async getPostById(id) {
        const parsedId = parseInt(id);
        //if the id is not a number then return
        if (!Number.isInteger(parsedId)) return null;

        const sql = `
        SELECT posts.*, users.username
        FROM posts
        JOIN users ON posts.user_id = users.id
        WHERE posts.id = ?
        `;
        const rows = await this.db.query(sql, [parsedId]);
        //only return the first item
        return rows[0];
    }

    //get all posts within a category 
    async getPostByCategory(category_id) {
        const sql = `
        SELECT posts.*, users.username
        FROM posts
        JOIN users ON posts.user_id = users.id
        WHERE category_id = ?
        ORDER BY created_at DESC;
        `;

        return await this.db.query(sql, [category_id]);
    }

    //only get posts by a user
    async getPostByUser(user_id) {
        const sql = `
        SELECT posts.*, users.username
        FROM posts
        JOIN users ON posts.user_id = users.id
        WHERE user_id = ?
        `;

        return await this.db.query(sql, [user_id]);
    }

    //get all comments that have been made to the post
    async getCommentsByPostId(post_id) {
        const sql = `
        SELECT responses.*, users.username, users.reputation
        FROM responses
        JOIN users ON responses.user_id = users.id
        WHERE responses.post_id = ?
        ORDER BY responses.created_at ASC
        `;

        return await this.db.query(sql, [post_id]);
    }

    //get all posts and sort them by oldest to newest
    async getAllPostsByOldest() {
        const sql = `
        SELECT posts.*, users.username
        FROM posts
        JOIN users ON posts.user_id = users.id
        ORDER BY created_at ASC
        `;
        return await this.db.query(sql);
    }

    //insert a post into the posts db table
    async createPost(title, content, user_id, category_id) {
        const sql = `
        INSERT INTO posts (title, content, user_id, category_id, created_at) 
        VALUES (?, ?, ?, ?, NOW())`;
        return await this.db.query(sql, [title, content, user_id, category_id]);
    }

    //insert a comment into the responses db table
    async createComment(post_id, user_id, content) {
        const sql = `
        INSERT INTO responses (post_id, user_id, content, created_at)
        VALUES (?, ?, ?, NOW())`;
        return await this.db.query(sql, [post_id, user_id, content]);
    }

    //get all categories
    async getAllCategories() {
        const sql = 'SELECT * FROM categories';
        return await this.db.query(sql);
    }

    //not implemented yet (could add to the users profile....?)
    async deletePost(postId) {
        const sql = `DELETE FROM posts WHERE id = ?`;
        return await this.db.query(sql, [postId]);
    }

    //mark a post as solved, mark the response as accepted
    async markResponseAsSolved(responseId, postId) {
        //remove any old accepted responses
        await this.db.query(`UPDATE responses SET is_accepted = FALSE WHERE post_id = ?`, [postId]);
        //add the new response as accepted
        await this.db.query(`UPDATE responses SET is_accepted = TRUE WHERE id = ?`, [responseId]);
    }

    //get a specific response by its id
    async getResponseById(id) {
        const rows = await this.db.query(
            `SELECT * FROM responses WHERE id = ?`,
            [id]
        );
        return rows;
    }

    //get all responses from a user by its id
    async getResponseByUserID(id){
        const rows = await this.db.query(
            `SELECT * FROM responses WHERE user_id = ?`,
            [id]
        );
        return rows;
    }

    //method to handle the voting system, can increase and decrease rep and update user titles
    async voteResponse(userId, responseId, value) {
        const REP = {
            1: 10,
            "-1": -10,
            0: 0
        };
        let oldResponse = 0;

        //get existing vote
        const existing = await this.db.query(
            `SELECT value FROM response_votes WHERE user_id = ? AND response_id = ?`,
            [userId, responseId]
        );
        
        //if there is no vote then set it to 0 (default)
        if (existing.length !== 0){
            oldResponse = existing[0].value;
        }else {
            oldResponse = 0;
        }
        //get response owner
        const rows = await this.db.query(
            `SELECT user_id FROM responses WHERE id = ?`,
            [responseId]
        );
        //if there is no response
        if (!rows.length) throw new Error("Response not found");

        //set the response owners user id
        const ownerId = rows[0].user_id;

        //apply vote change
        if (oldResponse === 0) {
            await this.db.query(
                `INSERT INTO response_votes (user_id, response_id, value) 
                VALUES (?, ?, ?)`,
                [userId, responseId, value]
            );
            await this.usersModel.addRep(ownerId, REP[value]);

        }
        //if its the same vote, then we will take the vote away
        else if (oldResponse === value) {
            await this.db.query(
                `DELETE FROM response_votes WHERE user_id = ? AND response_id = ?`,
                [userId, responseId]
            );
            //if it was an upvote, then we need to take rep away
            if (oldResponse === 1){
                await this.usersModel.addRep(ownerId, REP[-1]);
            }
            //if it was a downvote then we will add rep back to the user
            if (oldResponse === -1){
                await this.usersModel.addRep(ownerId, REP[1]);
            }
        }
        else {
            await this.db.query(
                `UPDATE response_votes SET value = ? WHERE user_id = ? AND response_id = ?`,
                [value, userId, responseId]
            );
            //if user upvoted originally, and then downvoted then we have to take double rep away
            if (oldResponse === 1 && value === -1){
                await this.usersModel.addRep(ownerId, (REP[-1]*2));
            }
            //if user downvoted originally, and then upvoted then we have to add double rep
            if (oldResponse === -1 && value === 1){
                await this.usersModel.addRep(ownerId, (REP[1]*2));
            }
        }
    }

    async acceptResponse(responseId, userId) {
        //get response + post owner
        const rows = await this.db.query(`SELECT r.post_id, p.user_id 
            AS post_owner 
            FROM responses r 
            JOIN posts p 
            ON r.post_id = p.id 
            WHERE r.id = ?`, [responseId]);

        if (!rows.length) {
            throw new Error("Response not found");
        }
        
        const { post_id, post_owner } = rows[0];

        //only post owner can accept
        if (parseInt(post_owner) !== userId) {
            throw new Error("Not authorized");
        }

        //check current state
        const current = await this.db.query(
            `SELECT is_accepted FROM responses WHERE id = ?`,
            [responseId]
        );

        const isAccepted = current[0].is_accepted;

        if (isAccepted) {
            //toggle OFF
            await this.db.query(
                `UPDATE responses SET is_accepted = FALSE WHERE id = ?`,
                [responseId]
            );
        } else {
            //remove any existing accepted
            await this.db.query(
                
                `UPDATE responses SET is_accepted = FALSE WHERE post_id = ?`,
                [post_id]
            );

            //set new accepted
            await this.db.query(
                `UPDATE responses SET is_accepted = TRUE WHERE id = ?`,
                [responseId]
            );
        }
    }

    //add report to the db, ignore duplicate reports.
    async reportResponse(responseId, userId) {
        await this.db.query(
            `INSERT IGNORE INTO response_reports (response_id, reporter_id)
            VALUES (?, ?)`,
            [responseId, userId]
        );
    }
}


module.exports = PostModel;
class PostModel {
    constructor(db, usersModel) {
        this.db = db;
        this.usersModel = usersModel;
    }

    async getRecentPosts(limit = 5) {
        const safeLimit = parseInt(limit);
    
        const sql = `
            SELECT posts.*, users.username
            FROM posts
            JOIN users ON posts.user_id = users.id
            ORDER BY created_at DESC
            LIMIT ${safeLimit}
        `;
    
        return await this.db.query(sql);
    }

    async getAllPosts() {
        const sql = `
        SELECT posts.*, users.username
        FROM posts
        JOIN users ON posts.user_id = users.id
        ORDER BY created_at DESC
        `;
        return await this.db.query(sql);
    }

    async getPostById(id) {
        const parsedId = parseInt(id);
        if (!Number.isInteger(parsedId)) return null;

        const sql = `
        SELECT posts.*, users.username
        FROM posts
        JOIN users ON posts.user_id = users.id
        WHERE posts.id = ?
        `;

        const rows = await this.db.query(sql, [parsedId]);
        return rows[0];
    }

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

    async getPostByUser(user_id) {
        const sql = `
        SELECT posts.*, users.username
        FROM posts
        JOIN users ON posts.user_id = users.id
        WHERE user_id = ?
        `;

        return await this.db.query(sql, [user_id]);
    }

    async getCommentsByPostId(post_id) {
        const sql = `
        SELECT responses.*, users.username, users.reputation,
        (
            SELECT COALESCE(SUM(value), 0)
            FROM response_votes
            WHERE response_votes.response_id = responses.id
        ) AS score
        FROM responses
        JOIN users ON responses.user_id = users.id
        WHERE responses.post_id = ?
        ORDER BY responses.created_at ASC
        `;

        return await this.db.query(sql, [post_id]);
    }

    async getAllPostsByOldest() {
        const sql = `
        SELECT posts.*, users.username
        FROM posts
        JOIN users ON posts.user_id = users.id
        ORDER BY created_at ASC
        `;
        return await this.db.query(sql);
    }

    async createPost(title, content, user_id, category_id) {
        const sql = `
        INSERT INTO posts (title, content, user_id, category_id, created_at) 
        VALUES (?, ?, ?, ?, NOW())`;
        return await this.db.query(sql, [title, content, user_id, category_id]);
    }

    async createComment(post_id, user_id, content) {
        const sql = `
        INSERT INTO responses (post_id, user_id, content, created_at)
        VALUES (?, ?, ?, NOW())`;
        return await this.db.query(sql, [post_id, user_id, content]);
    }

    async getAllCategories() {
        const sql = 'SELECT * FROM categories';
        return await this.db.query(sql);
    }

    async deletePost(postId) {
        const sql = `DELETE FROM posts WHERE id = ?`;
        return await this.db.query(sql, [postId]);
    }

    async markResponseAsSolved(responseId, postId) {
        await this.db.query(`UPDATE responses SET is_accepted = FALSE WHERE post_id = ?`, [postId]);
        await this.db.query(`UPDATE responses SET is_accepted = TRUE WHERE id = ?`, [responseId]);
    }

    async getResponseById(id) {
        const rows = await this.db.query(
            `SELECT * FROM responses WHERE id = ?`,
            [id]
        );
        return rows;
    }

    async getResponseByUserID(id){
        const rows = await this.db.query(
            `SELECT * FROM responses WHERE user_id = ?`,
            [id]
        );
        return rows;
    }


    async voteResponse(userId, responseId, value) {
        const REP = {
            1: 10,
            "-1": -10,
            0: 0
        };
        let oldResponse = 0;

        // 1. get existing vote
        const existing = await this.db.query(
            `SELECT value FROM response_votes WHERE user_id = ? AND response_id = ?`,
            [userId, responseId]
        );
        
        if (existing.length !== 0){
            oldResponse = existing[0].value;
        }else {
            oldResponse = 0;
        }
        // 2. get response owner
        const rows = await this.db.query(
            `SELECT user_id FROM responses WHERE id = ?`,
            [responseId]
        );

        if (!rows.length) throw new Error("Response not found");

        const ownerId = rows[0].user_id;

        // 3. apply vote change
        if (oldResponse === 0) {
            await this.db.query(
                `INSERT INTO response_votes (user_id, response_id, value) 
                VALUES (?, ?, ?)`,
                [userId, responseId, value]
            );
            await this.usersModel.addRep(ownerId, REP[value]);

        }
        else if (oldResponse === value) {
            await this.db.query(
                `DELETE FROM response_votes WHERE user_id = ? AND response_id = ?`,
                [userId, responseId]
            );

            if (oldResponse === 1){
                await this.usersModel.addRep(ownerId, REP[-1]);
            }
            if (oldResponse === -1){
                await this.usersModel.addRep(ownerId, REP[1]);
            }
        }
        else {
            await this.db.query(
                `UPDATE response_votes SET value = ? WHERE user_id = ? AND response_id = ?`,
                [value, userId, responseId]
            );
            if (oldResponse === 1 && value === -1){
                await this.usersModel.addRep(ownerId, -20);
            }
            if (oldResponse === -1 && value === 1){
                await this.usersModel.addRep(ownerId, 20);
            }
        }
    }

    async acceptResponse(responseId, userId) {
        // 1. get response + post owner
        const rows = await this.db.query(`SELECT r.post_id, p.user_id AS post_owner FROM responses r JOIN posts p ON r.post_id = p.id WHERE r.id = ?`, [responseId]);

        if (!rows.length) {
            throw new Error("Response not found");
        }
        
        const { post_id, post_owner } = rows[0];

        // 2. only post owner can accept
        if (parseInt(post_owner) !== userId) {
            throw new Error("Not authorized");
        }

        // 3. check current state
        const current = await this.db.query(
            `SELECT is_accepted FROM responses WHERE id = ?`,
            [responseId]
        );

        const isAccepted = current[0].is_accepted;

        if (isAccepted) {
            // toggle OFF
            await this.db.query(
                `UPDATE responses SET is_accepted = FALSE WHERE id = ?`,
                [responseId]
            );
        } else {
            // remove any existing accepted
            await this.db.query(
                
                `UPDATE responses SET is_accepted = FALSE WHERE post_id = ?`,
                [post_id]
            );

            // set new accepted
            await this.db.query(
                `UPDATE responses SET is_accepted = TRUE WHERE id = ?`,
                [responseId]
            );
        }
    }

    async reportResponse(responseId, userId) {
        await this.db.query(
            `INSERT IGNORE INTO response_reports (response_id, reporter_id)
            VALUES (?, ?)`,
            [responseId, userId]
        );
    }
}


module.exports = PostModel;
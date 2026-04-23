class PostModel {
    constructor(db) {
        this.db = db;
    }

    async getRecentPosts(limit = 5) {
        const safeLimit = parseInt(limit);
    
        const sql = `
            SELECT posts.*, users.username,
            (
                SELECT COALESCE(SUM(value), 0)
                FROM post_votes
                WHERE post_votes.post_id = posts.id
            ) AS upvotes
            FROM posts
            JOIN users ON posts.user_id = users.id
            ORDER BY created_at DESC
            LIMIT ${safeLimit}
        `;
    
        return await this.db.query(sql);
    }

    async getAllPosts() {
        const sql = `
        SELECT posts.*, users.username,
        (
            SELECT COALESCE(SUM(value), 0)
            FROM post_votes
            WHERE post_votes.post_id = posts.id
        ) AS upvotes
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
        SELECT posts.*, users.username,
        (
            SELECT COALESCE(SUM(value), 0)
            FROM post_votes
            WHERE post_votes.post_id = posts.id
        ) AS upvotes
        FROM posts
        JOIN users ON posts.user_id = users.id
        WHERE posts.id = ?
        `;

        const rows = await this.db.query(sql, [parsedId]);
        return rows[0];
    }

    async getPostByCategory(category_id) {
        const sql = `
        SELECT posts.*, users.username,
        (
            SELECT COALESCE(SUM(value), 0)
            FROM post_votes
            WHERE post_votes.post_id = posts.id
        ) AS upvotes
        FROM posts
        JOIN users ON posts.user_id = users.id
        WHERE category_id = ?
        `;

        return await this.db.query(sql, [category_id]);
    }

    async getPostByUser(user_id) {
        const sql = `
        SELECT posts.*, users.username,
        (
            SELECT COALESCE(SUM(value), 0)
            FROM post_votes
            WHERE post_votes.post_id = posts.id
        ) AS upvotes
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
        SELECT posts.*, users.username,
        (
            SELECT COALESCE(SUM(value), 0)
            FROM post_votes
            WHERE post_votes.post_id = posts.id
        ) AS score
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

    async voteResponse(userId, responseId, value) {
        const sql = `
        INSERT INTO response_votes (user_id, response_id, value)
        VALUES (?, ?, ?)
        ON DUPLICATE KEY UPDATE value = VALUES(value)
        `;
        await this.db.query(sql, [userId, responseId, value]);
}
}

module.exports = PostModel;
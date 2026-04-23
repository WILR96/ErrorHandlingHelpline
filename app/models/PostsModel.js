class PostModel {
    constructor(db) {
        this.db = db;
    }

    async getRecentPosts(limit = 5) {
        const sql = `SELECT * FROM posts ORDER BY created_at DESC LIMIT ${parseInt(limit)}`;
        return await this.db.query(sql);
    }

    async getAllPosts() {
        const sql = 'SELECT * FROM posts ORDER BY created_at DESC';
        return await this.db.query(sql);
    }

    async getPostById(id) {
        const parsedId = parseInt(id);
        if (!Number.isInteger(parsedId)) {
            return null
        }
        const sql = `SELECT * FROM posts WHERE id = ${parsedId}`;
        const rows = await this.db.query(sql);
        return rows[0];
    }

    async getPostByCategory(category_id) {
        const sql = `SELECT * FROM posts WHERE category_id = ${parseInt(category_id)}`
        return await this.db.query(sql);
    }

    async getPostByUser(user_id) {
        const sql = `SELECT * FROM posts WHERE user_id = ${parseInt(user_id)}`
        return await this.db.query(sql);
    }

    async getCommentsByPostId(post_id) {
        const sql = `SELECT responses.*, users.username, users.reputation 
        FROM responses 
        JOIN users ON responses.user_id = users.id 
        WHERE responses.post_id = ? 
        ORDER BY responses.created_at ASC;`;
        const rows = await this.db.query(sql, [post_id]);
        return rows;
    }

    async getAllPostsByOldest() {
        const sql = 'SELECT * FROM posts ORDER BY created_at ASC';
        return await this.db.query(sql);
    }

    async createPost(title, content, user_id, category_id) {
        const sql = `INSERT INTO posts (title, content, user_id, category_id, created_at) 
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
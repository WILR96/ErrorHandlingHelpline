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

    async getCommentsByPostId(post_id){
      const sql = `SELECT * FROM responses WHERE post_id = ${parseInt(post_id)}`
      const rows = await this.db.query(sql);
      return rows
    }

}

module.exports = PostModel;
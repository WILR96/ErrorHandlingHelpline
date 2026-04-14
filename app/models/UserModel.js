class UsersModel {
    constructor(db) {
        this.db = db;
    }

    async getAllUsers() {
        const users = await this.db.query('SELECT * FROM users');
        
        // Enhance users with post and answer counts
        for (let user of users) {
            const postCount = await this.db.query('SELECT COUNT(*) as count FROM posts WHERE user_id = ?', [user.id]);
            const answerCount = await this.db.query('SELECT COUNT(*) as count FROM responses WHERE user_id = ?', [user.id]);
            user.post_count = postCount[0].count;
            user.answer_count = answerCount[0].count;
            user.isActive = true; // All users are considered active for now
            user.title = 'Community Member'; // Default title
        }
        
        return users;
    }

    async getUserById(id) {
        const rows = await this.db.query('SELECT * FROM users WHERE id = ?', [id]);
        if (rows.length > 0) {
            const user = rows[0];
            const postCount = await this.db.query('SELECT COUNT(*) as count FROM posts WHERE user_id = ?', [user.id]);
            const answerCount = await this.db.query('SELECT COUNT(*) as count FROM responses WHERE user_id = ?', [user.id]);
            user.post_count = postCount[0].count;
            user.answer_count = answerCount[0].count;
            return user;
        }
        return null;
    }

    async getUserByUsername(username) {
        const rows = await this.db.query('SELECT * FROM users WHERE username = ?', [username]);
        return rows[0];
    }

    async createUser(username, email, passwordHash) {
        return await this.db.query(
            'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)',
            [username, email, passwordHash]
        );
    }
}

module.exports = UsersModel;
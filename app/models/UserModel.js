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
            user.isActive = true; // All users are considered active for now
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

    async addRep(userId, points) {

        // add reputation to user
        await this.db.query(`UPDATE users SET reputation = reputation + ? WHERE id = ?`,[points, userId]);

        // get the new rep value
        const rows = await this.db.query(`SELECT reputation FROM users WHERE id = ?`,[userId]);
        const rep = rows[0].reputation;

        // update user title.. 
        let title;

        if (rep >= 1000) {
            title = "Legendary Debugger";
        } else if (rep >= 500) {
            title = "Community Mentor";
        } else if (rep >= 250) {
            title = "Expert Helper";
        } else if (rep >= 100) {
            title = "Trusted Helper";
        } else if (rep >= 50) {
            title = "Active Contributor";
        } else if (rep >= 10) {
            title = "Contributor";
        } else {
            title = "New Member";
        }

        // Update title
        await this.db.query(`UPDATE users SET title = ? WHERE id = ?`, [title, userId]);
    }

}

module.exports = UsersModel;
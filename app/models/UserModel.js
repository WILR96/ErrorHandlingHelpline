class UsersModel {
    constructor(db) {
        this.db = db;
    }

    async getAllUsers() {
        return await this.db.query('SELECT * FROM users');
    }

    async getUserById(id) {
        const rows = await this.db.query('SELECT * FROM users WHERE id = ?', [id]);
        return rows[0];
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
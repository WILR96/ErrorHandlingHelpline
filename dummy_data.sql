CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  reputation INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) UNIQUE NOT NULL
);
CREATE TABLE posts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  category_id INT,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  upvotes INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
);
CREATE TABLE post_votes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  post_id INT NOT NULL,
  value TINYINT NOT NULL, -- 1 = upvote, -1 = downvote
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  UNIQUE(user_id, post_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
);
CREATE TABLE responses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  post_id INT NOT NULL,
  user_id INT NOT NULL,
  content TEXT NOT NULL,
  upvotes INT DEFAULT 0,
  is_accepted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE TABLE response_votes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  response_id INT NOT NULL,
  value TINYINT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  UNIQUE(user_id, response_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (response_id) REFERENCES responses(id) ON DELETE CASCADE
);
INSERT INTO categories (name) VALUES
('C++'),
('Python'),
('Node.js'),
('Docker'),
('MySQL'),
('JavaScript');
INSERT INTO users (username, email, password_hash, reputation) VALUES
('segfault_sam', 'sam@example.com', 'hashed_pw', 120),
('docker_dave', 'dave@example.com', 'hashed_pw', 80),
('nullpointer_nina', 'nina@example.com', 'hashed_pw', 200),
('panic_paul', 'paul@example.com', 'hashed_pw', 15);
INSERT INTO posts (user_id, category_id, title, content, upvotes) VALUES
(1, 1, 'Segmentation fault when using vectors',
 'My C++ program crashes when pushing into a vector. No idea why. Help.', 5),

(2, 4, 'Docker container works locally but not in production',
 'It runs fine on my machine but crashes on the server. Is Docker cursed?', 12),

(3, 2, 'Python script randomly exits without error',
 'no logs, just sadness.', 8),

(4, 3, 'Express app hangs on await',
 'Using async/await and sometimes the request never returns.', 3);
 INSERT INTO responses (post_id, user_id, content, upvotes, is_accepted) VALUES
(1, 3, 'Check if you are accessing freed memory. Sounds like UB.', 4, TRUE),
(1, 2, 'Try running with valgrind.', 2, FALSE),

(2, 1, 'Did you copy your .env file into the container?', 6, TRUE),

(3, 4, 'Maybe an unhandled exception inside a thread?', 1, FALSE),

(4, 3, 'You probably forgot to return the promise.', 5, TRUE);
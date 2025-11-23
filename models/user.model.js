// Model ini akan menangani query ke tabel 'users'

// Fungsi untuk membuat user baru (dan mengembalikan ID-nya)
// db adalah koneksi database dari server.js
exports.create = (db, user, callback) => {
  const sql = "INSERT INTO users (first_name, last_name, email) VALUES (?, ?, ?)";
  db.query(sql, [user.first_name, user.last_name, user.email], (err, result) => {
    if (err) {
      return callback(err);
    }
    // Mengembalikan ID dari user yang baru saja dibuat
    callback(null, result.insertId);
  });
};

// Fungsi untuk mencari user berdasarkan email
exports.findByEmail = (db, email, callback) => {
    const sql = "SELECT * FROM users WHERE email = ?";
    db.query(sql, [email], (err, results) => {
        if (err) {
            return callback(err);
        }
        callback(null, results[0]); // Kembalikan user pertama (atau undefined)
    });
};
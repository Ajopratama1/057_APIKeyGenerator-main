exports.create = (db, apiKeyData, callback) => {
  const sql = "INSERT INTO apikeys (user_id, api_key, start_date, end_date, status) VALUES (?, ?, ?, ?, ?)";
  db.query(
    sql,
    [
      apiKeyData.user_id,
      apiKeyData.api_key,
      apiKeyData.start_date,
      apiKeyData.end_date,
      apiKeyData.status || "valid", // Default status 'valid'
    ],
    (err, result) => {
      if (err) {
        return callback(err);
      }
      callback(null, result.insertId);
    }
  );
};
// Fungsi untuk mengupdate status key yang kadaluwarsa
exports.updateExpiredKeys = (db, callback) => {
  // Set status ke 'invalid' jika end_date sudah lewat
  const sql = "UPDATE apikeys SET status = 'invalid' WHERE end_date < CURDATE() AND status = 'valid'";
  db.query(sql, callback);
};
// Fungsi untuk mengambil SEMUA apikey (digabung dengan data user)
exports.getAllWithUser = (db, callback) => {
  const sql = [
    "SELECT",
    "  u.first_name AS first_name,",
    "  u.last_name AS last_name,",
    "  u.email AS email,",
    "  a.id AS id,",
    "  a.user_id AS user_id,",
    "  a.status AS status,",
    "  a.end_date AS end_date",
    "FROM apikeys a",
    "JOIN users u ON a.user_id = u.id",
    "ORDER BY a.id DESC"
  ].join(' ');
  db.query(sql, (err, results) => {
    if (err) return callback(err);
    callback(null, results);
  });
};
// Fungsi untuk mengambil SATU apikey (detail lengkap)
exports.getOneWithUser = (db, keyId, callback) => {
  const sql = `
    SELECT 
      users.first_name, 
      users.last_name, 
      users.email, 
      apikeys.api_key, 
      apikeys.start_date, 
      apikeys.end_date, 
      apikeys.status,
      apikeys.id,
      apikeys.user_id /* Tambahkan user_id */
    FROM apikeys 
    JOIN users ON apikeys.user_id = users.id 
    WHERE apikeys.id = ?
  `.trim();
  db.query(sql, [keyId], (err, results) => {
    if (err) {
      return callback(err);
    }
    callback(null, results[0]); // Kembalikan 1 data saja
  });
};
// Fungsi untuk menghapus API Key berdasarkan ID
exports.deleteById = (db, keyId, callback) => {
  // 1. Ambil dulu user_id dari key yang akan dihapus
  const findSql = "SELECT user_id FROM apikeys WHERE id = ?";
  db.query(findSql, [keyId], (err, results) => {
    if (err || results.length === 0) {
      return callback(err);
    }

    const userId = results[0].user_id;

    // 2. Hapus API Key
    const deleteKeySql = "DELETE FROM apikeys WHERE id = ?";
    db.query(deleteKeySql, [keyId], (err, result) => {
      if (err) {
        return callback(err);
      }

      // 3. Cek apakah user_id ini masih punya key lain
      exports.deleteUserIfNoKeys(db, userId, (userErr) => {
        // Jika ada error saat hapus user, kita log saja, 
        // tapi proses delete key utama tetap dianggap berhasil
        if (userErr) {
          console.error("Error menghapus user yang sudah tidak punya key:", userErr);
        }
        callback(null, result.affectedRows);
      });
    });
  });
};
// Fungsi BARU: Menghapus user jika dia tidak memiliki API key lain
exports.deleteUserIfNoKeys = (db, userId, callback) => {
  // Cek apakah ada key lain dengan user_id yang sama
  const checkSql = "SELECT COUNT(*) AS count FROM apikeys WHERE user_id = ?";
  db.query(checkSql, [userId], (err, results) => {
    if (err) return callback(err);

    if (results[0].count === 0) {
      // Jika count 0, user ini tidak punya key lagi, HAPUS user-nya
      const deleteUserSql = "DELETE FROM users WHERE id = ?";
      db.query(deleteUserSql, [userId], (err, result) => {
        if (err) return callback(err);
        console.log(`User ID ${userId} berhasil dihapus karena tidak punya key.`);
        callback(null, result.affectedRows);
      });
    } else {
      // User masih punya key, tidak perlu dihapus
      callback(null, 0);
    }
  });
};
// Tambahkan fungsi ini untuk dicari oleh controller
exports.findByEmail = (db, email, callback) => {
  const sql = "SELECT * FROM admins WHERE email = ? LIMIT 1";
  db.query(sql, [email], (err, results) => {
    if (err) return callback(err);
    callback(null, results && results.length ? results[0] : null);
  });
};
const ApikeyModel = {};

// Fungsi untuk membuat API Key baru
ApikeyModel.create = (db, apiKeyData, callback) => {
  const sql = "INSERT INTO apikeys (user_id, api_key, start_date, end_date, status) VALUES (?, ?, ?, ?, ?)";
  db.query(
    sql,
    [
      apiKeyData.user_id,
      apiKeyData.api_key,
      apiKeyData.start_date,
      apiKeyData.end_date,
      apiKeyData.status || 'valid'
    ],
    (err, result) => {
      if (err) {
        console.error("Error creating API key:", err.message);
        return callback(err);
      }
      callback(null, result.insertId);
    }
  );
};

// Fungsi untuk mengupdate status key yang kadaluwarsa
ApikeyModel.updateExpiredKeys = (db, callback) => {
  const sql = "UPDATE apikeys SET status = 'invalid' WHERE end_date < CURDATE() AND status = 'valid'";
  db.query(sql, callback);
};

// Fungsi untuk mengambil SEMUA apikey (digabung dengan data user)
ApikeyModel.getAllWithUser = (db, callback) => {
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

  // debugging: tampilkan SQL yang dikirim ke MySQL
  console.log('SQL getAllWithUser:', sql);

  db.query(sql, (err, results) => {
    if (err) {
      console.error("❌ SQL Error in getAllWithUser:", err.message);
      return callback(err);
    }
    callback(null, results);
  });
};

// Fungsi untuk mengambil SATU apikey (detail lengkap)
ApikeyModel.getOneWithUser = (db, keyId, callback) => {
  const sql = `
    SELECT 
      u.first_name AS first_name, 
      u.last_name AS last_name, 
      u.email AS email, 
      a.api_key AS api_key, 
      a.start_date AS start_date, 
      a.end_date AS end_date, 
      a.status AS status,
      a.id AS id,
      a.user_id AS user_id
    FROM apikeys a
    JOIN users u ON a.user_id = u.id 
    WHERE a.id = ?
  `; 
  db.query(sql, [keyId], (err, results) => {
    if (err) {
      console.error("❌ SQL Error in getOneWithUser:", err.message); 
      return callback(err);
    }
    callback(null, results[0]);
  });
};

// Fungsi untuk menghapus user jika dia tidak memiliki API key lain
ApikeyModel.deleteUserIfNoKeys = (db, userId, callback) => {
  // Cek apakah ada key lain dengan user_id yang sama
  const checkSql = "SELECT COUNT(*) AS count FROM apikeys WHERE user_id = ?";
  db.query(checkSql, [userId], (err, results) => {
    if (err) return callback(err);

    if (results[0].count === 0) {
      // HAPUS user-nya
      const deleteUserSql = "DELETE FROM users WHERE id = ?";
      db.query(deleteUserSql, [userId], (err, result) => {
        if (err) {
          console.error("Error deleting user:", err.message);
          return callback(err);
        }
        console.log(`User ID ${userId} berhasil dihapus karena tidak punya key.`);
        callback(null, result.affectedRows);
      });
    } else {
      callback(null, 0);
    }
  });
};

// Fungsi untuk menghapus API Key
ApikeyModel.deleteById = (db, keyId, callback) => {
  // 1. Ambil dulu user_id dari key yang akan dihapus
  const findSql = "SELECT user_id FROM apikeys WHERE id = ?";
  db.query(findSql, [keyId], (err, results) => {
    if (err) {
      console.error("Error finding user_id before delete:", err);
      return callback(err);
    }
    
    if (results.length === 0) {
        return callback(null, 0); 
    }

    const userId = results[0].user_id;

    // 2. Hapus API Key
    const deleteKeySql = "DELETE FROM apikeys WHERE id = ?";
    db.query(deleteKeySql, [keyId], (err, result) => {
      if (err) {
        console.error("Error deleting API key:", err);
        return callback(err);
      }

      // 3. Cek apakah user_id ini masih punya key lain
      ApikeyModel.deleteUserIfNoKeys(db, userId, (userErr) => {
        if (userErr) {
          console.error("Error menghapus user yang sudah tidak punya key:", userErr);
        }
        callback(null, result.affectedRows);
      });
    });
  });
};


module.exports = ApikeyModel;
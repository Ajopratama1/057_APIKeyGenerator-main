const express = require('express');
const router = express.Router();
const userController = require('../controllers/usercontroller');

// GET / -> Tampilkan halaman formulir
router.get('/', userController.renderCreatePage);

// GET /generate-key -> (AJAX) Endpoint untuk generate key
router.get('/generate-key', userController.generateNewKey);

// POST /save-key -> (FORM) Endpoint untuk menyimpan data
router.post('/save-key', userController.handleSaveKey);

module.exports = router;
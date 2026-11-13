const express = require('express');
const router = express.Router();
const {
  getExpenses,
  createExpense,
  updateExpense,
  deleteExpense,
} = require('../controllers/expenseController');
const { protectOwner } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.use(protectOwner);

router.route('/')
  .get(getExpenses)
  .post(upload.single('receipt'), createExpense);

router.route('/:id')
  .put(upload.single('receipt'), updateExpense)
  .delete(deleteExpense);

module.exports = router;


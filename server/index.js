/*
 * Expense Tracker API
 * Copyright (c) 2025 Soham
 * All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { appendToSheet, getExpenses, deleteExpense, getSavings, addSaving, updateSaving, deleteSaving } = require('./sheets');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const router = express.Router();

router.get('/', (req, res) => {
  res.send('Expense Tracker API is running');
});

// Expenses Routes
router.get('/expenses', async (req, res) => {
  try {
    const expenses = await getExpenses();
    res.status(200).json({ success: true, data: expenses });
  } catch (error) {
    console.error('Error fetching expenses:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch expenses', error: error.message });
  }
});

router.post('/expenses', async (req, res) => {
  try {
    const data = req.body;
    const result = await appendToSheet(data);
    res.status(200).json({ success: true, message: 'Expense added successfully', result });
  } catch (error) {
    console.error('Error adding expense:', error);
    res.status(500).json({ success: false, message: 'Failed to add expense', error: error.message });
  }
});

router.delete('/expenses/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await deleteExpense(id);
    res.status(200).json({ success: true, message: 'Expense deleted successfully' });
  } catch (error) {
    console.error('Error deleting expense:', error);
    res.status(500).json({ success: false, message: 'Failed to delete expense', error: error.message });
  }
});

// Savings Routes
router.get('/savings', async (req, res) => {
  try {
    const savings = await getSavings();
    res.status(200).json({ success: true, data: savings });
  } catch (error) {
    console.error('Error fetching savings:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch savings', error: error.message });
  }
});

router.post('/savings', async (req, res) => {
  try {
    const data = req.body;
    await addSaving(data);
    res.status(200).json({ success: true, message: 'Saving goal added successfully' });
  } catch (error) {
    console.error('Error adding saving goal:', error);
    res.status(500).json({ success: false, message: 'Failed to add saving goal', error: error.message });
  }
});

router.put('/savings/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const data = { ...req.body, id };
    await updateSaving(data);
    res.status(200).json({ success: true, message: 'Saving goal updated successfully' });
  } catch (error) {
    console.error('Error updating saving goal:', error);
    res.status(500).json({ success: false, message: 'Failed to update saving goal', error: error.message });
  }
});

router.delete('/savings/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await deleteSaving(id);
    res.status(200).json({ success: true, message: 'Saving goal deleted successfully' });
  } catch (error) {
    console.error('Error deleting saving goal:', error);
    res.status(500).json({ success: false, message: 'Failed to delete saving goal', error: error.message });
  }
});

app.use('/api', router);
app.use('/.netlify/functions/api', router);

// Only start the server if this file is run directly
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

module.exports = app;

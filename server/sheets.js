const { google } = require('googleapis');
const path = require('path');
const dotenv = require('dotenv');
const crypto = require('crypto');

dotenv.config();

const SPREADSHEET_ID = process.env.SPREADSHEET_ID;
const CREDENTIALS_PATH = path.join(__dirname, 'credentials.json');

async function getAuth() {
  // Check if environment variables are available (Production/Netlify)
  if (process.env.GOOGLE_CLIENT_EMAIL && process.env.GOOGLE_PRIVATE_KEY) {
    const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
    const privateKey = process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n');

    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: clientEmail,
        private_key: privateKey,
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
    return auth;
  }

  // Fallback to local credentials.json file (Development)
  const auth = new google.auth.GoogleAuth({
    keyFile: CREDENTIALS_PATH,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  return auth;
}

async function appendToSheet(data) {
  const auth = await getAuth();
  const sheets = google.sheets({ version: 'v4', auth });

  const metaData = await sheets.spreadsheets.get({
    spreadsheetId: SPREADSHEET_ID,
  });
  
  const sheetName = metaData.data.sheets[0].properties.title;

  const timestamp = new Date().toLocaleString();
  const id = crypto.randomUUID();
  
  const row = [
    timestamp,
    data.type,
    data.category,
    data.description,
    data.amount,
    data.paymentMode,
    data.date,
    data.remarks,
    id
  ];

  const request = {
    spreadsheetId: SPREADSHEET_ID,
    range: `${sheetName}!A:I`, 
    valueInputOption: 'USER_ENTERED',
    resource: {
      values: [row],
    },
  };

  const response = await sheets.spreadsheets.values.append(request);
  return response.data;
}

async function getExpenses() {
  const auth = await getAuth();
  const sheets = google.sheets({ version: 'v4', auth });

  const metaData = await sheets.spreadsheets.get({
    spreadsheetId: SPREADSHEET_ID,
  });
  
  const sheetName = metaData.data.sheets[0].properties.title;

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${sheetName}!A:I`,
  });

  const rows = response.data.values;
  if (!rows || rows.length === 0) {
    return [];
  }

  const updates = [];

  // Check header for ID column
  if (!rows[0][8]) {
    rows[0][8] = 'ID';
    updates.push({
      range: `${sheetName}!I1`,
      values: [['ID']]
    });
  }

  const data = rows.slice(1).map((row, index) => {
    let id = row[8];
    if (!id) {
      id = crypto.randomUUID();
      row[8] = id; // Update in memory
      updates.push({
        range: `${sheetName}!I${index + 2}`,
        values: [[id]]
      });
    }

    return {
      id: id,
      timestamp: row[0],
      type: row[1],
      category: row[2],
      description: row[3],
      amount: row[4],
      paymentMode: row[5],
      date: row[6],
      remarks: row[7]
    };
  });

  if (updates.length > 0) {
    await sheets.spreadsheets.values.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      resource: {
        data: updates,
        valueInputOption: 'USER_ENTERED'
      }
    });
  }

  return data;
}

async function deleteExpense(id) {
  const auth = await getAuth();
  const sheets = google.sheets({ version: 'v4', auth });

  const metaData = await sheets.spreadsheets.get({
    spreadsheetId: SPREADSHEET_ID,
  });
  
  const sheetId = metaData.data.sheets[0].properties.sheetId;
  const sheetName = metaData.data.sheets[0].properties.title;

  // Fetch all IDs to find the row index
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${sheetName}!I:I`,
  });

  const rows = response.data.values;
  if (!rows) throw new Error('No data found');

  // Find the row index (0-based)
  const rowIndex = rows.findIndex(row => row[0] === id);

  if (rowIndex === -1) {
    throw new Error('Transaction not found');
  }

  const request = {
    spreadsheetId: SPREADSHEET_ID,
    resource: {
      requests: [{
        deleteDimension: {
          range: {
            sheetId: sheetId,
            dimension: 'ROWS',
            startIndex: rowIndex,
            endIndex: rowIndex + 1
          }
        }
      }]
    }
  };

  const deleteResponse = await sheets.spreadsheets.batchUpdate(request);
  return deleteResponse.data;
}

async function ensureSheetExists(sheets, sheetName) {
  try {
    const metaData = await sheets.spreadsheets.get({
      spreadsheetId: SPREADSHEET_ID,
    });
    
    const sheet = metaData.data.sheets.find(s => s.properties.title === sheetName);
    if (!sheet) {
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: SPREADSHEET_ID,
        resource: {
          requests: [{
            addSheet: {
              properties: {
                title: sheetName
              }
            }
          }]
        }
      });
    }
  } catch (error) {
    console.error(`Error ensuring sheet ${sheetName} exists:`, error);
    throw error;
  }
}

async function getSavings() {
  const auth = await getAuth();
  const sheets = google.sheets({ version: 'v4', auth });
  const sheetName = 'Sheet2';

  try {
    // Check if sheet exists first to avoid 400 error
    const metaData = await sheets.spreadsheets.get({
      spreadsheetId: SPREADSHEET_ID,
    });
    const sheet = metaData.data.sheets.find(s => s.properties.title === sheetName);
    
    if (!sheet) {
      return [];
    }

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${sheetName}!A:F`,
    });

    const rows = response.data.values;
    if (!rows || rows.length === 0) {
      return [];
    }

    // Skip header if exists
    const data = rows.slice(1).map(row => ({
      id: row[0],
      name: row[1],
      target: Number(row[2]),
      current: Number(row[3]),
      updatedAt: row[4],
      targetDate: row[5] || null
    }));

    return data;
  } catch (error) {
    console.error('Error getting savings:', error);
    return [];
  }
}

async function addSaving(goal) {
  const auth = await getAuth();
  const sheets = google.sheets({ version: 'v4', auth });
  const sheetName = 'Sheet2';

  await ensureSheetExists(sheets, sheetName);

  const timestamp = new Date().toLocaleString();
  const row = [
    goal.id,
    goal.name,
    goal.target,
    goal.current,
    timestamp,
    goal.targetDate || ''
  ];

  // Check if header exists, if not add it
  const checkHeader = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${sheetName}!A1:F1`,
  });

  if (!checkHeader.data.values || checkHeader.data.values.length === 0) {
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: `${sheetName}!A1`,
      valueInputOption: 'USER_ENTERED',
      resource: {
        values: [['ID', 'Name', 'Target', 'Current', 'Last Updated', 'Target Date']]
      }
    });
  }

  const response = await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: `${sheetName}!A:F`,
    valueInputOption: 'USER_ENTERED',
    resource: {
      values: [row],
    },
  });
  return response.data;
}

async function updateSaving(goal) {
  const auth = await getAuth();
  const sheets = google.sheets({ version: 'v4', auth });
  const sheetName = 'Sheet2';

  // Get all rows to find the index
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${sheetName}!A:A`,
  });

  const rows = response.data.values;
  if (!rows) throw new Error('No data found');

  const rowIndex = rows.findIndex(row => row[0] == goal.id); // Loose equality for string/number match

  if (rowIndex === -1) {
    throw new Error('Goal not found');
  }

  const timestamp = new Date().toLocaleString();
  const updateRow = [
    goal.id,
    goal.name,
    goal.target,
    goal.current,
    timestamp,
    goal.targetDate || ''
  ];

  // Update the specific row (rowIndex + 1 because sheets are 1-indexed)
  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: `${sheetName}!A${rowIndex + 1}:F${rowIndex + 1}`,
    valueInputOption: 'USER_ENTERED',
    resource: {
      values: [updateRow]
    }
  });
}

async function deleteSaving(id) {
  const auth = await getAuth();
  const sheets = google.sheets({ version: 'v4', auth });
  const sheetName = 'Sheet2';

  const metaData = await sheets.spreadsheets.get({
    spreadsheetId: SPREADSHEET_ID,
  });
  
  const sheet = metaData.data.sheets.find(s => s.properties.title === sheetName);
  if (!sheet) throw new Error(`Sheet ${sheetName} not found`);
  const sheetId = sheet.properties.sheetId;

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${sheetName}!A:A`,
  });

  const rows = response.data.values;
  if (!rows) throw new Error('No data found');

  const rowIndex = rows.findIndex(row => row[0] == id);

  if (rowIndex === -1) {
    throw new Error('Goal not found');
  }

  const request = {
    spreadsheetId: SPREADSHEET_ID,
    resource: {
      requests: [{
        deleteDimension: {
          range: {
            sheetId: sheetId,
            dimension: 'ROWS',
            startIndex: rowIndex,
            endIndex: rowIndex + 1
          }
        }
      }]
    }
  };

  await sheets.spreadsheets.batchUpdate(request);
}

module.exports = { appendToSheet, getExpenses, deleteExpense, getSavings, addSaving, updateSaving, deleteSaving };

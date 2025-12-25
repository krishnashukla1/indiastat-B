const csv = require('csvtojson');
const xlsx = require('xlsx');
const fs = require('fs');

async function parseCSVFromFile(filePath) {
  // returns array of objects
  return csv().fromFile(filePath);
}

function parseXlsxFromFile(filePath) {
  const workbook = xlsx.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  return xlsx.utils.sheet_to_json(sheet);
}

function safeDeleteFile(path) {
  try {
    if (fs.existsSync(path)) fs.unlinkSync(path);
  } catch (err) {
    console.warn('Could not delete file', err.message);
  }
}

module.exports = { parseCSVFromFile, parseXlsxFromFile, safeDeleteFile };

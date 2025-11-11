/**
 * mock-db.js - Simple JSON file-based database for demo purposes
 * Use this when MongoDB is not available
 */
const fs = require('fs');
const path = require('path');

const dbFile = path.join(__dirname, 'mock-data.json');

// Initialize empty database
if (!fs.existsSync(dbFile)) {
  fs.writeFileSync(dbFile, JSON.stringify({
    users: [],
    modules: [],
    leakedPasswords: [],
    findings: []
  }, null, 2));
}

function readDB() {
  return JSON.parse(fs.readFileSync(dbFile, 'utf8'));
}

function writeDB(data) {
  fs.writeFileSync(dbFile, JSON.stringify(data, null, 2));
}

function generateId() {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

class MockModel {
  constructor(collection) {
    this.collection = collection;
  }

  async find(query = {}) {
    const data = readDB();
    return data[this.collection] || [];
  }

  async findOne(query) {
    const data = readDB();
    const items = data[this.collection] || [];
    const keys = Object.keys(query);
    return items.find(item => 
      keys.every(key => item[key] === query[key])
    ) || null;
  }

  async create(doc) {
    const data = readDB();
    const newDoc = { ...doc, _id: generateId(), createdAt: new Date() };
    data[this.collection].push(newDoc);
    writeDB(data);
    return newDoc;
  }

  async insertMany(docs) {
    const data = readDB();
    const newDocs = docs.map(doc => ({ 
      ...doc, 
      _id: generateId(), 
      createdAt: doc.createdAt || new Date() 
    }));
    data[this.collection].push(...newDocs);
    writeDB(data);
    return newDocs;
  }

  async deleteMany() {
    const data = readDB();
    data[this.collection] = [];
    writeDB(data);
    return { deletedCount: data[this.collection].length };
  }

  async save() {
    const data = readDB();
    if (!this._id) {
      this._id = generateId();
      this.createdAt = new Date();
      data[this.collection].push(this);
    }
    writeDB(data);
    return this;
  }
}

// Mock mongoose connection
const mockConnect = async (uri) => {
  console.log('Using mock database (file-based) - MongoDB not required');
  return Promise.resolve();
};

module.exports = {
  connect: mockConnect,
  model: (name, schema) => MockModel,
  User: MockModel,
  Module: MockModel,
  LeakedPassword: MockModel,
  Finding: MockModel
};
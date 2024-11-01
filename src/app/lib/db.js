// lib/db.js
import Database from 'better-sqlite3'
import path from 'path'

let db;

try {
  db = new Database(path.join(process.cwd(), 'database.db'), {
    verbose: console.log
  });
  
  db.pragma('foreign_keys = ON');

  db.exec(`
    CREATE TABLE IF NOT EXISTS contracts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      createdAt INTEGER NOT NULL,
      withdrawnAmount TEXT NOT NULL,
      end INTEGER NOT NULL,
      lastWithdrawnAt INTEGER NOT NULL,
      address TEXT NOT NULL,
      start INTEGER NOT NULL,
      depositedAmount TEXT NOT NULL,
      period INTEGER NOT NULL,
      amountPerPeriod TEXT NOT NULL,
      cliff INTEGER NOT NULL,
      cliffAmount TEXT NOT NULL,
      cancelableBySender INTEGER NOT NULL, -- Changed to INTEGER for boolean
      name TEXT NOT NULL,
      withdrawalFrequency INTEGER NOT NULL,
      closed INTEGER NOT NULL, -- Changed to INTEGER for boolean
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

} catch (error) {
  console.error('Database initialization error:', error);
  throw error;
}

// Sanitization helpers
const sanitizationHelpers = {
  sanitizeName: (name) => {
    return name.replace(/\0/g, '').trim();
  },

  sanitizeBigNumber: (bn) => {
    if (!bn) return '0';
    if (typeof bn === 'string') return bn;
    if (typeof bn.toString === 'function') return bn.toString();
    return '0';
  },

  sanitizeTimestamp: (timestamp) => {
    const num = parseInt(timestamp);
    return isNaN(num) ? 0 : num;
  },

  // Convert boolean to integer
  sanitizeBoolean: (value) => {
    return value ? 1 : 0;
  }
};

// Main sanitization function for contract data
const sanitizeContractData = (contract, address) => {
  const {
    sanitizeName,
    sanitizeBigNumber,
    sanitizeTimestamp,
    sanitizeBoolean
  } = sanitizationHelpers;

  return {
    createdAt: sanitizeTimestamp(contract.createdAt),
    withdrawnAmount: sanitizeBigNumber(contract.withdrawnAmount),
    end: sanitizeTimestamp(contract.end),
    lastWithdrawnAt: sanitizeTimestamp(contract.lastWithdrawnAt),
    address: address,
    start: sanitizeTimestamp(contract.start),
    depositedAmount: sanitizeBigNumber(contract.depositedAmount),
    period: sanitizeTimestamp(contract.period),
    amountPerPeriod: sanitizeBigNumber(contract.amountPerPeriod),
    cliff: sanitizeTimestamp(contract.cliff),
    cliffAmount: sanitizeBigNumber(contract.cliffAmount),
    cancelableBySender: sanitizeBoolean(contract.cancelableBySender), // Now returns 0 or 1
    name: sanitizeName(contract.name),
    withdrawalFrequency: sanitizeTimestamp(contract.withdrawalFrequency),
    closed: sanitizeBoolean(contract.closed) // Now returns 0 or 1
  };
};

// Database operations
export const dbOperations = {
  createContract: (contractData, address) => {
    try {
     
      const sanitizedData = sanitizeContractData(contractData, address);
     
      const stmt = db.prepare(`
        INSERT INTO contracts (
          createdAt, withdrawnAmount, end, lastWithdrawnAt, address,
          start, depositedAmount, period, amountPerPeriod, cliff,
          cliffAmount, cancelableBySender, name, withdrawalFrequency, closed
        ) VALUES (
          @createdAt, @withdrawnAmount, @end, @lastWithdrawnAt, @address,
          @start, @depositedAmount, @period, @amountPerPeriod, @cliff,
          @cliffAmount, @cancelableBySender, @name, @withdrawalFrequency, @closed
        )
      `);
      const result = stmt.run(sanitizedData);
      return result;
    } catch (error) {
      console.error('Error in createContract:', error);
      throw error;
    }
  },

  getContract: (id) => {
    const stmt = db.prepare('SELECT * FROM contracts WHERE id = ?');
    const result = stmt.get(id);
    if (result) {
      // Convert integers back to booleans
      result.cancelableBySender = Boolean(result.cancelableBySender);
      result.closed = Boolean(result.closed);
    }
    return result;
  },

  getAllContracts: () => {
    const stmt = db.prepare('SELECT * FROM contracts');
    const results = stmt.all();
    // Convert integers back to booleans for all results
    return results.map(result => ({
      ...result,
      cancelableBySender: Boolean(result.cancelableBySender),
      closed: Boolean(result.closed)
    }));
  },

  getContractByMint: (address) => {
    const stmt = db.prepare('SELECT * FROM contracts WHERE address = ?');
    const result = stmt.get(address);
    if (result) {
      // Convert integers back to booleans
      result.cancelableBySender = Boolean(result.cancelableBySender);
      result.closed = Boolean(result.closed);
    }
    return result;
  }
};

export default db;
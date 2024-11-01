// lib/db.js
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

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

  sanitizeBoolean: (value) => {
    return Boolean(value);
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
    created_at: new Date().toISOString(), // Use Supabase timestamp
    created_at_unix: sanitizeTimestamp(contract.createdAt),
    withdrawn_amount: sanitizeBigNumber(contract.withdrawnAmount),
    end: sanitizeTimestamp(contract.end),
    last_withdrawn_at: sanitizeTimestamp(contract.lastWithdrawnAt),
    address: address,
    start: sanitizeTimestamp(contract.start),
    deposited_amount: sanitizeBigNumber(contract.depositedAmount),
    period: sanitizeTimestamp(contract.period),
    amount_per_period: sanitizeBigNumber(contract.amountPerPeriod),
    cliff: sanitizeTimestamp(contract.cliff),
    cliff_amount: sanitizeBigNumber(contract.cliffAmount),
    cancelable_by_sender: sanitizeBoolean(contract.cancelableBySender),
    name: sanitizeName(contract.name),
    withdrawal_frequency: sanitizeTimestamp(contract.withdrawalFrequency),
    closed: sanitizeBoolean(contract.closed)
  };
};

// Database operations
export const dbOperations = {
  createContract: async (contractData, address) => {
    try {
      const sanitizedData = sanitizeContractData(contractData, address);
      
      console.log("sanitized data", sanitizedData);

      const { data, error } = await supabase
        .from('contracts')
        .insert([sanitizedData])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error in createContract:', error);
      throw error;
    }
  },

  getContract: async (id) => {
    try {
      const { data, error } = await supabase
        .from('contracts')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error in getContract:', error);
      throw error;
    }
  },

  getAllContracts: async () => {
    try {
      const { data, error } = await supabase
        .from('contracts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error in getAllContracts:', error);
      throw error;
    }
  },

  getContractByAddress: async (address) => {
    console.log("getContractByAddress", address);
    try {
      const { data, error } = await supabase
        .from('contracts')
        .select('*')
        .eq('address', address)
        .limit(1);

      console.log("data", data);

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error in getContractByAddress:', error);
      throw error;
    }
  },

  updateContract: async (contractData, address) => {
    console.log("updateContract", { address, contractData });
    try {
      const sanitizedData = sanitizeContractData(contractData, address);
      
      const { data, error } = await supabase
        .from('contracts')
        .update(sanitizedData)
        .eq('address', address)
        .select()
        .single();
  
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error in updateContract:', error);
      throw error;
    }
  }
};

export default supabase;
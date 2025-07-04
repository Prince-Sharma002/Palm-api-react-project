// Local Storage utility for managing conversation history
// Provides safe storage operations with size limits and error handling

const STORAGE_KEYS = {
  CONVERSATION_HISTORY: 'sofia-conversation-history',
  USER_PREFERENCES: 'sofia-user-preferences'
};

const STORAGE_LIMITS = {
  MAX_HISTORY_ITEMS: 100, // Maximum number of conversation items to store
  MAX_STORAGE_SIZE: 1024 * 1024 * 5 // 5MB limit for localStorage
};

/**
 * Safely save data to localStorage with error handling
 * @param {string} key - Storage key
 * @param {any} data - Data to store
 * @returns {boolean} - Success status
 */
export const saveToStorage = (key, data) => {
  try {
    const serializedData = JSON.stringify(data);
    
    // Check size limit
    if (serializedData.length > STORAGE_LIMITS.MAX_STORAGE_SIZE) {
      console.warn('Data exceeds storage size limit, trimming...');
      // If it's history data, keep only the most recent items
      if (key === STORAGE_KEYS.CONVERSATION_HISTORY && Array.isArray(data)) {
        const trimmedData = data.slice(-STORAGE_LIMITS.MAX_HISTORY_ITEMS);
        localStorage.setItem(key, JSON.stringify(trimmedData));
        return true;
      }
      return false;
    }
    
    localStorage.setItem(key, serializedData);
    return true;
  } catch (error) {
    console.error('Error saving to localStorage:', error);
    
    // Handle quota exceeded error
    if (error.name === 'QuotaExceededError') {
      console.warn('Storage quota exceeded, clearing old data...');
      clearOldestHistory();
      // Try again with reduced data
      try {
        if (key === STORAGE_KEYS.CONVERSATION_HISTORY && Array.isArray(data)) {
          const reducedData = data.slice(-50); // Keep only last 50 items
          localStorage.setItem(key, JSON.stringify(reducedData));
          return true;
        }
      } catch (retryError) {
        console.error('Failed to save even after clearing storage:', retryError);
      }
    }
    
    return false;
  }
};

/**
 * Safely load data from localStorage with error handling
 * @param {string} key - Storage key
 * @param {any} defaultValue - Default value if key doesn't exist
 * @returns {any} - Loaded data or default value
 */
export const loadFromStorage = (key, defaultValue = null) => {
  try {
    const item = localStorage.getItem(key);
    if (item === null) {
      return defaultValue;
    }
    return JSON.parse(item);
  } catch (error) {
    console.error('Error loading from localStorage:', error);
    return defaultValue;
  }
};

/**
 * Remove data from localStorage
 * @param {string} key - Storage key
 * @returns {boolean} - Success status
 */
export const removeFromStorage = (key) => {
  try {
    localStorage.removeItem(key);
    return true;
  } catch (error) {
    console.error('Error removing from localStorage:', error);
    return false;
  }
};

/**
 * Clear oldest history items to free up space
 */
const clearOldestHistory = () => {
  try {
    const history = loadFromStorage(STORAGE_KEYS.CONVERSATION_HISTORY, []);
    if (Array.isArray(history) && history.length > 20) {
      const reducedHistory = history.slice(-20); // Keep only last 20 items
      localStorage.setItem(STORAGE_KEYS.CONVERSATION_HISTORY, JSON.stringify(reducedHistory));
      console.log('Cleared oldest history items, kept last 20');
    }
  } catch (error) {
    console.error('Error clearing oldest history:', error);
  }
};

/**
 * Get storage usage information
 * @returns {object} - Storage usage stats
 */
export const getStorageInfo = () => {
  try {
    const totalSize = new Blob(Object.values(localStorage)).size;
    const historySize = localStorage.getItem(STORAGE_KEYS.CONVERSATION_HISTORY)?.length || 0;
    const historyCount = loadFromStorage(STORAGE_KEYS.CONVERSATION_HISTORY, []).length;
    
    return {
      totalSize,
      historySize,
      historyCount,
      maxHistoryItems: STORAGE_LIMITS.MAX_HISTORY_ITEMS,
      maxStorageSize: STORAGE_LIMITS.MAX_STORAGE_SIZE
    };
  } catch (error) {
    console.error('Error getting storage info:', error);
    return null;
  }
};

/**
 * Conversation history specific functions
 */
export const ConversationStorage = {
  save: (history) => saveToStorage(STORAGE_KEYS.CONVERSATION_HISTORY, history),
  load: () => loadFromStorage(STORAGE_KEYS.CONVERSATION_HISTORY, []),
  clear: () => removeFromStorage(STORAGE_KEYS.CONVERSATION_HISTORY),
  
  /**
   * Add a new conversation entry
   * @param {object} entry - Conversation entry {prompt, response}
   * @returns {array} - Updated history array
   */
  addEntry: (entry) => {
    const history = ConversationStorage.load();
    const updatedHistory = [...history, {
      ...entry,
      timestamp: new Date().toISOString(),
      id: Date.now() + Math.random() // Simple unique ID
    }];
    
    // Limit history size
    const limitedHistory = updatedHistory.slice(-STORAGE_LIMITS.MAX_HISTORY_ITEMS);
    ConversationStorage.save(limitedHistory);
    return limitedHistory;
  },
  
  /**
   * Export history as JSON file
   * @returns {string} - JSON string of history
   */
  export: () => {
    const history = ConversationStorage.load();
    return JSON.stringify({
      exportDate: new Date().toISOString(),
      version: '1.0',
      conversations: history
    }, null, 2);
  }
};

export default {
  saveToStorage,
  loadFromStorage,
  removeFromStorage,
  getStorageInfo,
  ConversationStorage,
  STORAGE_KEYS
};

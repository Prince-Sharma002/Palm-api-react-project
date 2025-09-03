import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  inputText: "",
  responseText: "",
  history: [],
};

const conversationSlice = createSlice({
  name: 'conversation',
  initialState,
  reducers: {
    setInputText: (state, action) => {
      state.inputText = action.payload;
    },
    setResponseText: (state, action) => {
      state.responseText = action.payload;
    },
    setHistory: (state, action) => {
      state.history = action.payload;
    },
    addToHistory: (state, action) => {
      state.history.push(action.payload);
    },
    clearInput: (state) => {
      state.inputText = "";
    },
    clearResponse: (state) => {
      state.responseText = "";
    },
    clearHistory: (state) => {
      state.history = [];
    },
    clearAll: (state) => {
      state.inputText = "";
      state.responseText = "";
    },
  },
});

export const {
  setInputText,
  setResponseText,
  setHistory,
  addToHistory,
  clearInput,
  clearResponse,
  clearHistory,
  clearAll,
} = conversationSlice.actions;

export default conversationSlice.reducer;

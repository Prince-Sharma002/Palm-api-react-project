import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  formExpanded: false,
  isPopupOpen: false,
  historyPanelOpen: false,
  windowWidth: typeof window !== 'undefined' ? window.innerWidth : 1024,
  commandHidden: false,
  loading: false,
  textcopy: false,
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setFormExpanded: (state, action) => {
      state.formExpanded = action.payload;
    },
    toggleFormExpanded: (state) => {
      state.formExpanded = !state.formExpanded;
    },
    setIsPopupOpen: (state, action) => {
      state.isPopupOpen = action.payload;
    },
    setHistoryPanelOpen: (state, action) => {
      state.historyPanelOpen = action.payload;
    },
    setWindowWidth: (state, action) => {
      state.windowWidth = action.payload;
    },
    setCommandHidden: (state, action) => {
      state.commandHidden = action.payload;
    },
    toggleCommandHidden: (state) => {
      state.commandHidden = !state.commandHidden;
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setTextCopy: (state, action) => {
      state.textcopy = action.payload;
    },
  },
});

export const {
  setFormExpanded,
  toggleFormExpanded,
  setIsPopupOpen,
  setHistoryPanelOpen,
  setWindowWidth,
  setCommandHidden,
  toggleCommandHidden,
  setLoading,
  setTextCopy,
} = uiSlice.actions;

export default uiSlice.reducer;

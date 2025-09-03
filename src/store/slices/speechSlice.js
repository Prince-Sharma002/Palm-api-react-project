import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  listening: true,
  transcript: "",
  speakerIcon: true,
  voices: [],
  femaleVoice: null,
};

const speechSlice = createSlice({
  name: 'speech',
  initialState,
  reducers: {
    setListening: (state, action) => {
      state.listening = action.payload;
    },
    toggleListening: (state) => {
      state.listening = !state.listening;
    },
    setTranscript: (state, action) => {
      state.transcript = action.payload;
    },
    setSpeakerIcon: (state, action) => {
      state.speakerIcon = action.payload;
    },
    toggleSpeakerIcon: (state) => {
      state.speakerIcon = !state.speakerIcon;
    },
    setVoices: (state, action) => {
      state.voices = action.payload;
    },
    setFemaleVoice: (state, action) => {
      state.femaleVoice = action.payload;
    },
    clearTranscript: (state) => {
      state.transcript = "";
    },
  },
});

export const {
  setListening,
  toggleListening,
  setTranscript,
  setSpeakerIcon,
  toggleSpeakerIcon,
  setVoices,
  setFemaleVoice,
  clearTranscript,
} = speechSlice.actions;

export default speechSlice.reducer;

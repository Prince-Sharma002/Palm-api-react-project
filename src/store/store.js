import { configureStore } from '@reduxjs/toolkit';
import uiReducer from './slices/uiSlice';
import speechReducer from './slices/speechSlice';
import imageReducer from './slices/imageSlice';
import conversationReducer from './slices/conversationSlice';

export const store = configureStore({
  reducer: {
    ui: uiReducer,
    speech: speechReducer,
    image: imageReducer,
    conversation: conversationReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['speech/setVoices', 'speech/setUtteranceRef'],
        ignoredPaths: ['speech.voices', 'speech.utteranceRef', 'speech.synth'],
      },
    }),
});

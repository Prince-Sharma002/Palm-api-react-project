import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  selectedImage: null,
  textresult: "",
  image: '',
  imageInlineData: null,
  aiResponse: '',
};

const imageSlice = createSlice({
  name: 'image',
  initialState,
  reducers: {
    setSelectedImage: (state, action) => {
      state.selectedImage = action.payload;
    },
    setTextResult: (state, action) => {
      state.textresult = action.payload;
    },
    setImage: (state, action) => {
      state.image = action.payload;
    },
    setImageInlineData: (state, action) => {
      state.imageInlineData = action.payload;
    },
    setAiResponse: (state, action) => {
      state.aiResponse = action.payload;
    },
    clearImageData: (state) => {
      state.selectedImage = null;
      state.textresult = "";
      state.image = '';
      state.imageInlineData = null;
      state.aiResponse = '';
    },
  },
});

export const {
  setSelectedImage,
  setTextResult,
  setImage,
  setImageInlineData,
  setAiResponse,
  clearImageData,
} = imageSlice.actions;

export default imageSlice.reducer;

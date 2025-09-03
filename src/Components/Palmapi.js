

import React, { useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} from "@google/generative-ai";

import { GiSpeaker } from "react-icons/gi";
import { GiSpeakerOff } from "react-icons/gi";
import { IoEnterSharp } from "react-icons/io5";
import { PiMicrophoneFill } from "react-icons/pi";
import { FaDeleteLeft , FaRepeat , FaFileImage , FaCamera  } from "react-icons/fa6";
import { IoCopySharp } from "react-icons/io5";
import { ImCross } from "react-icons/im";
import { TbKeyboardHide , TbKeyboardShow  } from "react-icons/tb";

import { ToastContainer , toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';


import "../style/palmapi.scss" 

import { createWorker } from 'tesseract.js';

// popup
import Popup from 'reactjs-popup';
import 'reactjs-popup/dist/index.css';

import { getBase64 } from './imageHelper';
import { ConversationStorage } from '../utils/localStorage';

// Redux actions
import {
  setFormExpanded,
  toggleFormExpanded,
  setIsPopupOpen,
  setHistoryPanelOpen,
  setWindowWidth,
  setCommandHidden,
  toggleCommandHidden,
  setLoading,
  setTextCopy,
} from '../store/slices/uiSlice';

import {
  setListening,
  toggleListening,
  setTranscript,
  setSpeakerIcon,
  toggleSpeakerIcon,
  setVoices,
  setFemaleVoice,
  clearTranscript,
} from '../store/slices/speechSlice';

import {
  setSelectedImage,
  setTextResult,
  setImage,
  setImageInlineData,
  setAiResponse,
  clearImageData,
} from '../store/slices/imageSlice';

import {
  setInputText,
  setResponseText,
  setHistory,
  addToHistory,
  clearInput,
  clearResponse,
  clearAll,
} from '../store/slices/conversationSlice';

const MODEL_NAME = "gemini-1.5-flash";
const API_KEY = "AIzaSyB2WAvA1StnH4HRwQq_9GWTIz275p7X0_A";


const Palmapi = () => {
  const dispatch = useDispatch();
  const genAI = new GoogleGenerativeAI(API_KEY);
  
  // Redux state selectors
  const {
    formExpanded,
    isPopupOpen,
    historyPanelOpen,
    windowWidth,
    commandHidden,
    loading,
    textcopy,
  } = useSelector((state) => state.ui);
  
  const {
    listening,
    transcript,
    speakerIcon,
    voices,
    femaleVoice,
  } = useSelector((state) => state.speech);
  
  const {
    selectedImage,
    textresult,
    image,
    imageInlineData,
    aiResponse,
  } = useSelector((state) => state.image);
  
  const {
    inputText,
    responseText,
    history,
  } = useSelector((state) => state.conversation);
  
  const utteranceRef = useRef(null);
  const synth = window.speechSynthesis;
  const isMobile = windowWidth <= 768;
  
  // Load history from localStorage using utility
  const loadHistoryFromStorage = () => {
    try {
      const savedHistory = ConversationStorage.load();
      if (Array.isArray(savedHistory)) {
        dispatch(setHistory(savedHistory));
        console.log('History loaded from localStorage:', savedHistory.length, 'items');
      }
    } catch (error) {
      console.error('Error loading history from localStorage:', error);
    }
  };
  
  // Save history to localStorage using utility
  const saveHistoryToStorage = (historyData) => {
    try {
      const success = ConversationStorage.save(historyData);
      if (success) {
        console.log('History saved to localStorage:', historyData.length, 'items');
      } else {
        console.warn('Failed to save history to localStorage');
        toast.warning('Failed to save conversation history', {
          position: "top-right",
          autoClose: 3000,
        });
      }
    } catch (error) {
      console.error('Error saving history to localStorage:', error);
    }
  };
  
  // Clear history from localStorage using utility
  const clearHistoryFromStorage = () => {
    try {
      const success = ConversationStorage.clear();
      if (success) {
        dispatch(setHistory([]));
        console.log('History cleared from localStorage');
        toast.success('Conversation history cleared!', {
          position: "top-right",
          autoClose: 2000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
      } else {
        throw new Error('Failed to clear storage');
      }
    } catch (error) {
      console.error('Error clearing history from localStorage:', error);
      toast.error('Failed to clear history', {
        position: "top-right",
        autoClose: 2000,
      });
    }
  };
  
  // Export history function
  const exportHistory = () => {
    try {
      const exportData = ConversationStorage.export();
      const blob = new Blob([exportData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sofia-conversation-history-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success('History exported successfully!', {
        position: "top-right",
        autoClose: 2000,
      });
    } catch (error) {
      console.error('Error exporting history:', error);
      toast.error('Failed to export history', {
        position: "top-right",
        autoClose: 2000,
      });
    }
  };
  
  
  
  
  const worker = createWorker({
    logger: m => console.log(m)
  });
  
  // Load history from localStorage on component mount
  useEffect(() => {
    loadHistoryFromStorage();
  }, []);
  
  // Save history to localStorage whenever it changes
  useEffect(() => {
    if (history.length > 0) {
      saveHistoryToStorage(history);
    }
  }, [history]);

  useEffect(() => {
    const textGenerate = async () => {
      await worker.load();
        await worker.loadLanguage('eng');
        await worker.initialize('eng');
        const { data: { text } } = await worker.recognize(selectedImage);
        console.log(text);
        await worker.terminate();   
        dispatch(setTextResult(text));
    };

    if (selectedImage) {
        textGenerate();
    }
}, [selectedImage]);


const handleSubmitImage = (e) => {
    console.log(e.target.files[0])
    dispatch(setSelectedImage(e.target.files[0]))
}



// image to process text
const handleImageChange =  (e) => {
  const file = e.target.files[0];
  dispatch(setSelectedImage(e.target.files[0]))

  dispatch(setIsPopupOpen(true));
  

  // getting base64 from file to render in DOM
  getBase64(file)
      .then((result) => {
          dispatch(setImage(result));
      })
      .catch(e => console.log(e))

  // generating content model for Gemini Google AI
  fileToGenerativePart(file).then((image) => {
      dispatch(setImageInlineData(image));
  });

}

async function aiImageRun() {
        
  dispatch(setLoading(true));
  dispatch(setAiResponse(''));
  
try{
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  const result = await model.generateContent([
      "What is this?", imageInlineData
  ]);
  const response = await result.response;
  const text = response.text();

  dispatch(setAiResponse(text));
  dispatch(setResponseText(text));
  dispatch(setLoading(false));

  speak(text);

  dispatch(addToHistory({ prompt: "image", response: response.text() }));
}catch(err){
  console.log(err);
}

}


async function fileToGenerativePart(file) {
  const base64EncodedDataPromise = new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result.split(',')[1]);
      reader.readAsDataURL(file);
  });

  return {
      inlineData: { data: await base64EncodedDataPromise, mimeType: file.type },
  };

  await aiImageRun();
}

const handleClick = () => {
  aiImageRun();
}
 

    useEffect(() => {
        if (listening) {
          startListening();
        } else {
          startListening();
        }


        const loadVoices = () => {
          const availableVoices = synth.getVoices();
          dispatch(setVoices(availableVoices));
          console.log('Available voices:', availableVoices.map(v => v.name));
    
          // Find a female voice
          const female = availableVoices.find(voice => 
            voice.name.toLowerCase().includes('female') ||
            voice.name.toLowerCase().includes('zira') ||
            voice.name.toLowerCase().includes('hazel') ||
            voice.gender === 'female'
          );
          dispatch(setFemaleVoice(female));
        };
    
        // Load voices initially and on voiceschanged event
        loadVoices();
        synth.onvoiceschanged = loadVoices;

      }, [listening , textcopy]);

      // Handle window resize for responsiveness
      useEffect(() => {
        const handleResize = () => {
          dispatch(setWindowWidth(window.innerWidth));
        };
        
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
      }, []);

      useEffect(() => {
        if (transcript.toLowerCase().includes("sofia") || transcript.toLowerCase().includes("sophia")) {
            runChat(transcript);
        }
    }, [transcript]);


      const startListening = () => {
        const recognition = new window.webkitSpeechRecognition();
        recognition.continuous = true;
        recognition.lang = 'en-US';
        recognition.onresult = (event) => {
          const currentTranscript = event.results[event.results.length - 1][0].transcript.toLowerCase();
          dispatch(setTranscript(currentTranscript));
          dispatch(setInputText(currentTranscript));
        
        };
        recognition.start();
      };   

      const stopListening = () => {
        const recognition = new window.webkitSpeechRecognition();
        recognition.stop();
      };


      const toggleListeningState = () => {
        dispatch(toggleListening());
      };

    const wordRemove = (text , wordToRemove)=>{
        let regex = new RegExp("\\b" + wordToRemove + "\\b", "gi");
        let newText = text.replace(regex, "");
        return newText;
    }


  const speak = (text) => {
    if (!text || !speakerIcon) return;
    
    // Cancel any ongoing speech
    synth.cancel();
    
    const utterThis = new SpeechSynthesisUtterance(text);
    utteranceRef.current = utterThis;

    // Use available voices
    if (voices.length > 0) {
      // Try to find a female voice, otherwise use first available
      const femaleVoice = voices.find(voice => 
        voice.name.toLowerCase().includes('female') ||
        voice.name.toLowerCase().includes('zira') ||
        voice.name.toLowerCase().includes('hazel')
      );
      utterThis.voice = femaleVoice || voices[0];
    }

    // Set speech properties
    utterThis.lang = 'en-US'; // Changed to English for better compatibility
    utterThis.rate = 1.0; // Normal speed
    utterThis.pitch = 1.0; // Normal pitch
    utterThis.volume = 1.0; // Normal volume (max is 1.0)

    // Add event listeners
    utterThis.onstart = () => {
      console.log('Speech started');
    };
    
    utterThis.onend = () => {
      console.log('Speech ended');
    };
    
    utterThis.onerror = (event) => {
      console.error('Speech error:', event.error);
    };

    // Speak the text
    synth.speak(utterThis);
  };


  const togglespeaker = () => {
        if(speakerIcon) {
          synth.pause();
        } else {
          synth.resume();
        }
        dispatch(toggleSpeakerIcon());
  };

  const clear = ()=>{
    synth.cancel();
    dispatch(clearTranscript());
    dispatch(clearResponse());
  }

  const repeat = ()=>{
    synth.cancel();
    speak(responseText);
  }

  
  const copy = () => {
    if (responseText && responseText.trim() !== '') {
      navigator.clipboard.writeText(responseText)
        .then(() => {
          console.log('Text copied to clipboard');
          toast.success('Response copied to clipboard!', {
            position: "top-right",
            autoClose: 2000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
          });
        })
        .catch((error) => {
          console.error('Error copying text: ', error);
          toast.error('Failed to copy text', {
            position: "top-right",
            autoClose: 2000,
          });
        });
    } else {
      toast.warning('No response to copy!', {
        position: "top-right",
        autoClose: 2000,
      });
    }
  };


  const copyhistory = (data)=>{
      
      dispatch(setTextCopy(true)); 
      navigator.clipboard.writeText(data)
      .then(() => {
        console.log('Text copied to clipboard');
      })
      .catch((error) => {
        console.error('Error copying text: ', error);
      });

      console.log("data is " ,data );
  }



const runChat = async (text) => {
    const genAI = new GoogleGenerativeAI(API_KEY);
    const model = genAI.getGenerativeModel({ model: MODEL_NAME });

    const generationConfig = {
      temperature: 0.9,
      topK: 1,
      topP: 1,
      maxOutputTokens: 2048,
    };

    const safetySettings = [
      {
        category: HarmCategory.HARM_CATEGORY_HARASSMENT,
        threshold: HarmBlockThreshold.ALLOW_ALL,
      },
      {
        category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
        threshold: HarmBlockThreshold.ALLOW_ALL,
      },
      {
        category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
        threshold: HarmBlockThreshold.ALLOW_ALL,
      },
      {
        category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
        threshold: HarmBlockThreshold.ALLOW_ALL,
      },
    ];
    

    const chat = model.startChat({
      generationConfig,
      safetySettings,
      history: [],
    });

    let afterremove = text;
    if(text.includes("sofia")){
        
        afterremove = wordRemove(text , "sofia");
        dispatch(setInputText(afterremove));
        console.log(afterremove)
        
    }

    dispatch(setLoading(true));

    if(afterremove === "")
      return ;
    const result = await chat.sendMessage(afterremove);
    dispatch(setInputText(""));
    const response = result.response;

    const responseTextWithoutAsterisk = response.text().replace(/\*/g, '');

    speak(responseTextWithoutAsterisk);
    dispatch(setResponseText(responseTextWithoutAsterisk));

    dispatch(setLoading(false));

    dispatch(addToHistory({ prompt: text, response: response.text() }));


  };
  

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("ip : " ,inputText)
    await runChat(inputText);
  };

  const inputStyle = {
    height: `${inputText.length > 150 ? '5rem' : 'auto'}`,
    transition: 'height 0.3s',
    overflowY: inputText.length > 150 ? 'auto' : 'hidden',
  };
  


    // side bar
    const sideButtonopen = () => {
      if (synth.speaking) {
          synth.pause();
      }
      dispatch(setHistoryPanelOpen(true));
    };
  
    const sideButtonclose = () => {
      console.log("close")
      synth.resume();
      dispatch(setHistoryPanelOpen(false));
    };
  


const toggleFormPosition = () => {
  dispatch(toggleFormExpanded());
};


const clearInputField = ()=>{
  dispatch(clearInput());
}


const handleClose = () => {
  dispatch(setIsPopupOpen(false));
};



  return (
    <div className='palmapi'>
      
      {/* Header */}
      <div className="jarvis-header">
        <div className="logo-container">
          <div className="logo-ring">
            <div className="logo-core"></div>
            <div className="logo-pulse"></div>
          </div>
          <h1 className="jarvis-title">S.0.F.I.A.</h1>
        </div>
        
        {/* Status indicators */}
        <div className="status-bar flex flex-row">
          <div className={`status-indicator ${listening ? 'active' : ''}`}>
            <span className="status-dot"></span>
            <span className="status-text">LISTENING</span>
          </div>
          <div className={`status-indicator ${loading ? 'active' : ''}`}>
            <span className="status-dot"></span>
            <span className="status-text">PROCESSING</span>
          </div>
          <div className={`status-indicator ${responseText ? 'active' : ''}`}>
            <span className="status-dot"></span>
            <span className="status-text">READY</span>
          </div>
        </div>
        
        {/* History Panel Toggle */}
        <button 
          style={{
            padding: isMobile ? '8px 12px' : '12px 20px',
            borderRadius: '10px',
            border: '2px solid #00FFFF',
            background: 'rgba(0, 0, 0, 0.8)',
            color: '#00FFFF',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: isMobile ? '4px' : '8px',
            fontSize: isMobile ? '12px' : '14px',
            fontWeight: 'bold',
            transition: 'all 0.3s ease',
            pointerEvents: 'auto',
            zIndex: 100000,
            position: 'relative'
          }}
          onClick={() => {
            console.log('History clicked');
            sideButtonopen();
          }}
          type="button"
          onMouseEnter={(e) => {
            e.target.style.transform = 'translateY(-2px)';
            e.target.style.boxShadow = '0 5px 15px rgba(0, 255, 255, 0.3)';
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = 'translateY(0px)';
            e.target.style.boxShadow = 'none';
          }}
        >
          <span>📜</span>
          <span>HISTORY</span>
        </button>
      </div>
      
      {/* History Panel */}
      <div className={`history-panel ${historyPanelOpen ? 'has-content' : ''}`}>
        <div className="history-header">
          <h3>CONVERSATION HISTORY</h3>
          <div className="history-controls">
            <button 
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                border: '2px solid #4ECDC4',
                background: 'rgba(0, 0, 0, 0.8)',
                color: '#4ECDC4',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '16px',
                fontWeight: 'bold',
                transition: 'all 0.3s ease',
                pointerEvents: 'auto',
                zIndex: 100001,
                marginRight: '10px'
              }}
              onClick={() => {
                console.log('Export history clicked');
                exportHistory();
              }}
              title="Export history"
              type="button"
              onMouseEnter={(e) => {
                e.target.style.transform = 'scale(1.1)';
                e.target.style.boxShadow = '0 0 15px #4ECDC4';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'scale(1)';
                e.target.style.boxShadow = 'none';
              }}
            >
              📤
            </button>
            <button 
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                border: '2px solid #FF6B6B',
                background: 'rgba(0, 0, 0, 0.8)',
                color: '#FF6B6B',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '16px',
                fontWeight: 'bold',
                transition: 'all 0.3s ease',
                pointerEvents: 'auto',
                zIndex: 100001,
                marginRight: '10px'
              }}
              onClick={() => {
                console.log('Clear history clicked');
                clearHistoryFromStorage();
              }}
              title="Clear history"
              type="button"
              onMouseEnter={(e) => {
                e.target.style.transform = 'scale(1.1)';
                e.target.style.boxShadow = '0 0 15px #FF6B6B';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'scale(1)';
                e.target.style.boxShadow = 'none';
              }}
            >
              🗑️
            </button>
            <button 
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                border: '2px solid #00FFFF',
                background: 'rgba(0, 0, 0, 0.8)',
                color: '#00FFFF',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '20px',
                fontWeight: 'bold',
                transition: 'all 0.3s ease',
                pointerEvents: 'auto',
                zIndex: 100001
              }}
              onClick={() => {
                console.log('Close history clicked');
                sideButtonclose();
              }}
              title="Close history"
              type="button"
              onMouseEnter={(e) => {
                e.target.style.transform = 'scale(1.1)';
                e.target.style.boxShadow = '0 0 15px #00FFFF';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'scale(1)';
                e.target.style.boxShadow = 'none';
              }}
            >
              ×
            </button>
          </div>
        </div>
        <div className="history-content">
          <div className="history-stats">
            <span>Total conversations: {history.length}</span>
            <span>Storage: {history.length > 0 ? '💾 Saved' : '📝 Empty'}</span>
          </div>
          {history.slice(-10).reverse().map((entry, index) => (
            <div className='history-item' key={history.length - index - 1}>
              <div className="history-prompt">
                <span className="history-label">USER:</span>
                <p>{entry.prompt}</p>
              </div>
              <div className="history-response">
                <span className="history-label">SOFIA:</span>
                <p>{entry.response}</p>
                <button 
                  className='copy-btn' 
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    copyhistory(entry.response);
                  }}
                  title="Copy response"
                  type="button"
                >
                  <IoCopySharp />
                </button>
              </div>
            </div>
          ))}
          {history.length === 0 && (
            <div className="history-empty">
              <p>No conversation history yet.</p>
              <span>Start talking to SOFIA...</span>
            </div>
          )}
        </div>
      </div>

{/* 
      <img src={image} style={{ width: '30%', marginTop: 30 }} />


{
loading == true && (aiResponse == '') ?
  <p style={{ margin: '30px 0' }}>Loading ...</p>
  :
  <div style={{ margin: '30px 0' }}>
      <p>{aiResponse}</p>
  </div>
} */}

{isPopupOpen && (
        <div className="image-analysis-modal">
          <div className="modal-header">
            <h3>IMAGE ANALYSIS</h3>
            <div className="modal-controls">
              <button className="modal-btn analyze-btn" onClick={() => handleClick()}>
                <span>ANALYZE</span>
              </button>
              <button className="modal-btn close-btn" onClick={handleClose}>
                <span>×</span>
              </button>
            </div>
          </div>
          
          <div className="modal-content">
            <div className="image-container">
              {selectedImage && (
                <img 
                  className="analyzed-image"
                  src={URL.createObjectURL(selectedImage)} 
                  alt='Selected for analysis' 
                />
              )}
            </div>
            
            <div className="analysis-result">
              {loading && responseText === "" ? (
                <div className="loading-animation">
                  <div className="loading-circle"></div>
                  <span>ANALYZING IMAGE...</span>
                </div>
              ) : (
                <div className="result-text">
                  <h4>ANALYSIS RESULT:</h4>
                  <p>{responseText}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}




      {/* Command Interface visibility toggle (floating) */}
      <button
        style={{
          position: 'fixed',
          bottom: isMobile ? '12px' : '20px',
          right: isMobile ? '12px' : '20px',
          borderRadius: '24px',
          border: '2px solid #00FFFF',
          background: 'rgba(0, 0, 0, 0.8)',
          color: '#00FFFF',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '10px 14px',
          fontSize: isMobile ? '14px' : '16px',
          fontWeight: 'bold',
          transition: 'all 0.3s ease',
          pointerEvents: 'auto',
          zIndex: 100000
        }}
        onClick={() => dispatch(toggleCommandHidden())}
        title={commandHidden ? 'Show command interface' : 'Hide command interface'}
        type="button"
        onMouseEnter={(e) => {
          e.target.style.transform = 'translateY(-2px)';
          e.target.style.boxShadow = '0 5px 15px rgba(0, 255, 255, 0.3)';
        }}
        onMouseLeave={(e) => {
          e.target.style.transform = 'translateY(0px)';
          e.target.style.boxShadow = 'none';
        }}
      >
        {commandHidden ? <TbKeyboardShow /> : <TbKeyboardHide />}
        <span>{commandHidden ? 'SHOW CONTROLS' : 'HIDE CONTROLS'}</span>
      </button>

      {/* Control Panel - Responsive for mobile/desktop */}
      <div 
        className='floating-control-panel'
        style={{
          position: 'fixed',
          top: isMobile ? 'auto' : '50%',
          bottom: isMobile ? '100px' : 'auto',
          right: isMobile ? '10px' : '20px',
          left: isMobile ? '10px' : 'auto',
          transform: isMobile ? 'none' : 'translateY(-50%)',
          display: 'flex',
          flexDirection: isMobile ? 'row' : 'column',
          justifyContent: isMobile ? 'space-around' : 'flex-start',
          gap: isMobile ? '10px' : '15px',
          zIndex: 99999,
          pointerEvents: 'auto',
          padding: isMobile ? '10px' : '0'
        }}
      >
        <button 
          style={{
            width: isMobile ? '50px' : '60px',
            height: isMobile ? '50px' : '60px',
            borderRadius: '50%',
            border: '2px solid #00FFFF',
            background: 'rgba(0, 0, 0, 0.8)',
            color: '#00FFFF',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: isMobile ? '16px' : '20px',
            transition: 'all 0.3s ease',
            pointerEvents: 'auto',
            zIndex: 100000
          }}
          onClick={() => {
            console.log('Speaker clicked');
            togglespeaker();
          }}
          title="Toggle Audio"
          type="button"
          onMouseEnter={(e) => {
            e.target.style.transform = 'scale(1.1)';
            e.target.style.boxShadow = '0 0 20px #00FFFF';
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = 'scale(1)';
            e.target.style.boxShadow = 'none';
          }}
        >
          {speakerIcon ? <GiSpeaker /> : <GiSpeakerOff />}
        </button>
        
        <button 
          style={{
            width: isMobile ? '50px' : '60px',
            height: isMobile ? '50px' : '60px',
            borderRadius: '50%',
            border: '2px solid #00FFFF',
            background: 'rgba(0, 0, 0, 0.8)',
            color: '#00FFFF',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: isMobile ? '16px' : '20px',
            transition: 'all 0.3s ease',
            pointerEvents: 'auto',
            zIndex: 100000
          }}
          onClick={() => {
            console.log('Clear clicked');
            clear();
          }}
          title="Clear"
          type="button"
          onMouseEnter={(e) => {
            e.target.style.transform = 'scale(1.1)';
            e.target.style.boxShadow = '0 0 20px #00FFFF';
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = 'scale(1)';
            e.target.style.boxShadow = 'none';
          }}
        >
          <FaDeleteLeft />
        </button>
        
        <button 
          style={{
            width: isMobile ? '50px' : '60px',
            height: isMobile ? '50px' : '60px',
            borderRadius: '50%',
            border: '2px solid #00FFFF',
            background: 'rgba(0, 0, 0, 0.8)',
            color: '#00FFFF',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: isMobile ? '16px' : '20px',
            transition: 'all 0.3s ease',
            pointerEvents: 'auto',
            zIndex: 100000
          }}
          onClick={() => {
            console.log('Copy clicked');
            copy();
          }}
          title="Copy Response"
          type="button"
          onMouseEnter={(e) => {
            e.target.style.transform = 'scale(1.1)';
            e.target.style.boxShadow = '0 0 20px #00FFFF';
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = 'scale(1)';
            e.target.style.boxShadow = 'none';
          }}
        >
          <IoCopySharp />
        </button>
        
        <button 
          style={{
            width: isMobile ? '50px' : '60px',
            height: isMobile ? '50px' : '60px',
            borderRadius: '50%',
            border: '2px solid #00FFFF',
            background: 'rgba(0, 0, 0, 0.8)',
            color: '#00FFFF',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: isMobile ? '16px' : '20px',
            transition: 'all 0.3s ease',
            pointerEvents: 'auto',
            zIndex: 100000
          }}
          onClick={() => {
            console.log('Repeat clicked');
            repeat();
          }}
          title="Repeat"
          type="button"
          onMouseEnter={(e) => {
            e.target.style.transform = 'scale(1.1)';
            e.target.style.boxShadow = '0 0 20px #00FFFF';
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = 'scale(1)';
            e.target.style.boxShadow = 'none';
          }}
        >
          <FaRepeat />
        </button>
      </div>

      {/* Main Interface */}
      <div className='main-interface'>

        {/* Response Display */}
        <div className='response-display'>
          <div className="response-header">
            <span className="response-label">SOFIA RESPONSE</span>
            <div className="response-indicators">
              <div className={`indicator ${loading ? 'active' : ''}`}></div>
              <div className={`indicator ${responseText ? 'active' : ''}`}></div>
              <div className={`indicator ${speakerIcon && responseText ? 'active' : ''}`}></div>
            </div>
          </div>
          
          <div className='response-content'>
            {loading && responseText === "" ? (
              <div className="loading-text">
                <div className="loading-dots">
                  <span></span><span></span><span></span>
                </div>
                <span>PROCESSING REQUEST...</span>
              </div>
            ) : (
              <div className="response-text">
                {responseText || "Awaiting your command..."}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Command Interface */}
      <div className='command-interface' style={{ display: commandHidden ? 'none' : 'block' }}>
        <div className='interface-tools'>
          <label 
            className='tool-btn' 
            htmlFor='camera' 
            title="Camera"
          >
            <FaCamera />
          </label>
          <input 
            className='hidden-input' 
            id='camera' 
            type="file" 
            accept="image/*" 
            capture="environment" 
            onChange={(e) => handleImageChange(e)} 
          />

          <label 
            className='tool-btn' 
            htmlFor='upload' 
            title="Upload Image"
          >
            <FaFileImage />
          </label>
          <input 
            className='hidden-input' 
            type='file' 
            id='upload' 
            accept='image/*' 
            onChange={(e) => handleImageChange(e)} 
          />

          <button 
            className='tool-btn' 
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              toggleFormPosition();
            }} 
            title="Toggle Interface"
            type="button"
          >
            {!formExpanded ? <TbKeyboardHide /> : <TbKeyboardShow />}
          </button>
        </div>

        <form className={`command-form ${formExpanded ? 'expanded' : ''}`} onSubmit={handleSubmit}>
          <div className='input-container'>
            <input
              type="text"
              className='command-input'
              value={inputText}
              onChange={(e) => dispatch(setInputText(e.target.value))}
              placeholder='Speak Sofia then task or type your command...'
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleSubmit(e);
                }
              }}
            />
            
            <div className='input-controls'>
              <button 
                className={`mic-btn ${listening ? 'listening' : ''}`} 
                type="button" 
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  toggleListeningState();
                }}
              >
                <PiMicrophoneFill />
                <span className="mic-pulse"></span>
              </button>
              <button 
                className='clear-btn' 
                type="button" 
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  clearInputField();
                }}
              >
                <ImCross />
              </button>
              <button 
                className='submit-btn' 
                type="submit"
                onClick={(e) => {
                  e.preventDefault();
                  handleSubmit(e);
                }}
              >
                <IoEnterSharp />
              </button>
            </div>
          </div>
        </form>
      </div>


  <ToastContainer />
    </div>
  ); 
};

export default Palmapi;

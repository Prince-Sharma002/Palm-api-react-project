

import React, { useEffect, useState , useRef } from 'react';
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

const MODEL_NAME = "gemini-1.5-flash";
const API_KEY = "AIzaSyB2WAvA1StnH4HRwQq_9GWTIz275p7X0_A";


const Palmapi = () => {
  const genAI = new GoogleGenerativeAI(API_KEY);
  const [formExpanded, setFormExpanded] = useState(false);
  
  const [inputText, setInputtext] = useState("");
  const [responseText, setResponsetext] = useState("");
  
  const [listening, setListening] = useState(true);
  const [transcript, setTranscript] = useState("");
  const [loading , setLoading]  = useState(false);

  const [ speakerIcon, setSpeakerIcon] = useState(true)

  const [history, setHistory] = useState([]);
  
  const utteranceRef = useRef(null);
  const synth = window.speechSynthesis;
  const [voices, setVoices] = useState([]);
  const [femaleVoice, setFemaleVoice] = useState(null);
  
  const [textcopy , settextCopy] = useState(false);
  
  
  // image to text
  const [selectedImage , setSelectedImage] = useState(null);
  const [textresult , setTextresult] = useState("");
  
  // image  
  const [image, setImage] = useState('');
  const [imageInineData , setImageInlineData ] = useState(null);
  const [aiResponse, setResponse] = useState('');
  
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [historyPanelOpen, setHistoryPanelOpen] = useState(false);
  
  // Responsive state
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const isMobile = windowWidth <= 768;
  
  
  
  
  const worker = createWorker({
    logger: m => console.log(m)
  });
  
  useEffect(() => {
    const textGenerate = async () => {
      await worker.load();
        await worker.loadLanguage('eng');
        await worker.initialize('eng');
        const { data: { text } } = await worker.recognize(selectedImage);
        console.log(text);
        await worker.terminate();   
        setTextresult(text);
    };

    if (selectedImage) {
        textGenerate();
    }
}, [selectedImage]);


const handleSubmitImage = (e) => {
    console.log(e.target.files[0])
    setSelectedImage(e.target.files[0])
}



// image to process text
const handleImageChange =  (e) => {
  const file = e.target.files[0];
  setSelectedImage(e.target.files[0])

  setIsPopupOpen(true);
  

  // getting base64 from file to render in DOM
  getBase64(file)
      .then((result) => {
          setImage(result);
      })
      .catch(e => console.log(e))

  // generating content model for Gemini Google AI
  fileToGenerativePart(file).then((image) => {
      setImageInlineData(image);
  });

}

async function aiImageRun() {
        
  setLoading(true);
  setResponse('');
  
try{
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  const result = await model.generateContent([
      "What is this?", imageInineData
  ]);
  const response = await result.response;
  const text = response.text();

  setResponse(text);
  setResponsetext(text);
  setLoading(false);

  speak(text);

  setHistory(prevHistory => [
    ...prevHistory,
    { prompt: "image", response: response.text() }
  ]);
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
          setVoices(availableVoices);
          console.log('Available voices:', availableVoices.map(v => v.name));
    
          // Find a female voice
          const female = availableVoices.find(voice => 
            voice.name.toLowerCase().includes('female') ||
            voice.name.toLowerCase().includes('zira') ||
            voice.name.toLowerCase().includes('hazel') ||
            voice.gender === 'female'
          );
          setFemaleVoice(female);
        };
    
        // Load voices initially and on voiceschanged event
        loadVoices();
        synth.onvoiceschanged = loadVoices;

      }, [listening , textcopy]);

      // Handle window resize for responsiveness
      useEffect(() => {
        const handleResize = () => {
          setWindowWidth(window.innerWidth);
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
          setTranscript(currentTranscript);
          setInputtext(currentTranscript);
        
        };
        recognition.start();
      };   

      const stopListening = () => {
        const recognition = new window.webkitSpeechRecognition();
        recognition.stop();
      };


      const toggleListening = () => {
        setListening((prevState) => !prevState);
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
        setSpeakerIcon(!speakerIcon);
  };

  const clear = ()=>{
    synth.cancel();
    setTranscript("");
    setResponsetext("")
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
      
      settextCopy(true); 
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
        setInputtext(afterremove);
        console.log(afterremove)
        
    }

    setLoading(true);

    if(afterremove === "")
      return ;
    const result = await chat.sendMessage(afterremove);
    setInputtext("");
    const response = result.response;

    const responseTextWithoutAsterisk = response.text().replace(/\*/g, '');

    speak(responseTextWithoutAsterisk);
    setResponsetext(responseTextWithoutAsterisk);

    setLoading(false);

    setHistory(prevHistory => [
      ...prevHistory,
      { prompt: text, response: response.text() }
    ]);


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
      setHistoryPanelOpen(true);
    };
  
    const sideButtonclose = () => {
      console.log("close")
      synth.resume();
      setHistoryPanelOpen(false);
    };
  


const toggleFormPosition = () => {
  setFormExpanded(!formExpanded);
};


const clearInput = ()=>{
  setInputtext("");
}


const handleClose = () => {
  setIsPopupOpen(false);
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
        <div className="history-content">
          {history.slice(-5).map((entry, index) => (
            <div className='history-item' key={index}>
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
      <div className='command-interface'>
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
              onChange={(e) => setInputtext(e.target.value)}
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
                  toggleListening();
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
                  clearInput();
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

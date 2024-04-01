
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
import { FaDeleteLeft } from "react-icons/fa6";
import { ImCross } from "react-icons/im";
import { TbKeyboardHide , TbKeyboardShow  } from "react-icons/tb";



import "../style/palmapi.scss" 

const MODEL_NAME = "gemini-1.0-pro";
const API_KEY = "AIzaSyB2WAvA1StnH4HRwQq_9GWTIz275p7X0_A";


const Palmapi = () => {
  const [formExpanded, setFormExpanded] = useState(false);
  
  const [inputText, setInputtext] = useState("");
  const [responseText, setResponsetext] = useState("");
  
  const [listening, setListening] = useState(true);
  const [transcript, setTranscript] = useState("");

  const [ speakerIcon, setSpeakerIcon] = useState(true)

    const [history, setHistory] = useState([]);

    const utteranceRef = useRef(null);
    const synth = window.speechSynthesis;

    useEffect(() => {
        if (listening) {
          startListening();
        } else {
          startListening();
        }
      }, [listening]);

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


  const speak = (text)=>{

    const utterThis = new SpeechSynthesisUtterance(text);

    utteranceRef.current = utterThis;

    synth.speak(utterThis);

    utterThis.addEventListener("end", () => {
      synth.cancel();
    });
    }


  const togglespeaker = () => {
        if(speakerIcon)
          synth.pause();
        else 
          synth.resume();
        toggleSpeaker();
  };

  const clear = ()=>{
    synth.cancel();
    setTranscript("");
    setResponsetext("")
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

    if(afterremove === "")
      return ;
    const result = await chat.sendMessage(afterremove);
    setInputtext("");
    const response = result.response;

    const responseTextWithoutAsterisk = response.text().replace(/\*/g, '');

    speak(responseTextWithoutAsterisk);
    setResponsetext(responseTextWithoutAsterisk);

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
  
  const toggleSpeaker = ()=>{
    setSpeakerIcon(!speakerIcon)
  }


    // side bar
    const sideButtonopen = () => {
      if (synth.speaking) {
          synth.pause();
      }
    };
  
    const sideButtonclose = () => {
      console.log("close")
      synth.resume();
    };
  


const toggleFormPosition = () => {
  setFormExpanded(!formExpanded);
};


const clearInput = ()=>{
  setInputtext("");
}

  return (
    <div className='palmapi'>
              <nav
        className="navbar navbar-light bg-light fixed-top mb-5 pt-3 pb-2"
        style={{
          background: "linear-gradient(45deg, #4158d0, #c850c0, #ffcc70)",
        }}
      >
        <div className="container-fluid">
        <a
            className="navbar-brand text-light"
            href="#"
            style={{
              fontFamily: "Sigmar",
              letterSpacing: "2px",
              fontSize: "22px",
            }}
          >
            SOFIAAA
          </a>
          <button
            className="navbar-toggler"
            type="button"
            data-bs-toggle="offcanvas"
            data-bs-target="#offcanvasDarkNavbar"
            aria-controls="offcanvasDarkNavbar"
            aria-label="Toggle navigation"
          >
            <span
              onClick={sideButtonopen}
              className="navbar-toggler-icon"
            ></span>
          </button>
          <div
            className="offcanvas offcanvas-end text-bg-dark"
            tabIndex="-1"
            id="offcanvasDarkNavbar"
            aria-labelledby="offcanvasDarkNavbarLabel"
          >
            <div className="offcanvas-header">
              <h5 className="offcanvas-title" id="offcanvasDarkNavbarLabel">
                HISTORY
              </h5>
              <button
                onClick={sideButtonclose}
                type="button"
                className="btn-close btn-close-white"
                data-bs-dismiss="offcanvas"
                aria-label="Close"
              ></button>
            </div>
            <div
              className="offcanvas-body"
              style={{
                background: "linear-gradient(45deg, #4158d0, #c850c0, #ffcc70)",
              }}
            >
              <div className="history accordion" id='accordionExample'>
                
                {history.slice(-4).map((entry, index) => (
                    <div className='historyDiv accordion-item' key={index}>
                        <h2 className="accordion-header">
                          <button className="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target={`#${index}`}  aria-expanded="true" aria-controls={`${index}`} >
                              {entry.prompt}
                          </button>
                        </h2>
                        <div id={`${index}`} className="accordion-collapse collapse " data-bs-parent="#accordionExample">
                          <div className="accordion-body">
                            {entry.response}
                            </div>
                        </div>
                    </div>
                ))}

                {
                  history.length === 0 && 
                  
                    "empty.."


                }
            </div>

            </div>
          </div>
        </div>
      </nav>


        <div className='bodyDiv'>
          <div className='icon'>
           <button className='' onClick={togglespeaker}> { speakerIcon ?  <GiSpeaker /> : <GiSpeakerOff /> }</button>
           <button className="" onClick={clear}> <FaDeleteLeft /> </button>
          </div>

            <div className='responseDiv'>
                {responseText}
            </div>


            <br/>

        </div>

        <form className={`inputForm ${formExpanded ? 'expanded' : ''}`} onSubmit={handleSubmit}>
    { !formExpanded ? <TbKeyboardHide onClick={toggleFormPosition} /> : <TbKeyboardShow onClick={toggleFormPosition} />}
    <div>
      <input
        type="text"
        className='inputField'
        value={inputText}
        onChange={(e) => setInputtext(e.target.value)}
        placeholder='Enter Command'
        style={inputStyle}
        onKeyPress={(e) => {
          if (e.key === 'Enter') {
            handleSubmit(e); // Pass the event object 'e'
          }
        }}
      />
      <div>
          <button className='mic' onClick={toggleListening}> <PiMicrophoneFill /> </button>
          <button className='mic' onClick={clearInput}> <ImCross /> </button>
      </div>
    </div>  
  </form>

    </div>
  ); // Component doesn't render anything
};

export default Palmapi;

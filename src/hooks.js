import { useState, useRef, useEffect } from 'react';

export const useRecorder = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);
  const mediaRecorder = useRef(null);
  const audioChunks = useRef([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder.current = new MediaRecorder(stream);
      audioChunks.current = [];

      mediaRecorder.current.ondataavailable = (event) => {
        audioChunks.current.push(event.data);
      };

      mediaRecorder.current.onstop = () => {
        const audioBlob = new Blob(audioChunks.current, { type: 'audio/wav' });
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
      };

      mediaRecorder.current.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Error accessing microphone:", err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorder.current && isRecording) {
      mediaRecorder.current.stop();
      setIsRecording(false);
      mediaRecorder.current.stream.getTracks().forEach(track => track.stop());
    }
  };

  return { isRecording, startRecording, stopRecording, audioUrl };
};

export const useAIEngine = () => {
  const [insights, setInsights] = useState([]);

  const generateInsight = (gate) => {
    const tips = {
      rapport: [
        "Mirror their tone — they seem professional but approachable.",
        "They mentioned a specific pain point about 'scaling'. Lean into that.",
        "Acknowledge their expertise before diving into the gate."
      ],
      g1: [
        "Ask about the 'Expected Outcome' again. They were a bit vague.",
        "They mentioned 'leads' but not 'quality'. Clarify the definition of a lead.",
        "Math check: If they spend $2k and want 50 leads, that's $40/lead. Is that realistic?"
      ],
      g2: [
        "Timeline seems urgent, but check if the 'decision maker' is actually on vacation.",
        "Ask what happens if they DON'T start by next month.",
        "Identify the 'Approval Process' bottleneck now."
      ],
      g3: [
        "They balked at the 'range'. Go back to Value Gap.",
        "Allocation vs Capacity: It sounds like they HAVE the money but DON'T want to spend it yet.",
        "Anchor to the $10k loss they mentioned in Gate 1."
      ]
    };

    const randomTip = tips[gate][Math.floor(Math.random() * tips[gate].length)];
    const newInsight = {
      id: Date.now(),
      type: 'tip',
      text: randomTip,
      gate
    };

    setInsights(prev => [newInsight, ...prev.slice(0, 4)]);
  };

  return { insights, generateInsight };
};

export const useTranscription = () => {
  const [transcript, setTranscript] = useState([]);
  const [isListening, setIsListening] = useState(false);
  const recognition = useRef(null);

  const startListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.error("Speech Recognition not supported in this browser.");
      return;
    }

    recognition.current = new SpeechRecognition();
    recognition.current.continuous = true;
    recognition.current.interimResults = false;
    recognition.current.lang = 'en-US';

    recognition.current.onstart = () => setIsListening(true);
    recognition.current.onend = () => setIsListening(false);
    
    recognition.current.onresult = (event) => {
      const last = event.results.length - 1;
      const text = event.results[last][0].transcript;
      
      setTranscript(prev => [...prev, { 
        role: 'closer', 
        text: text.trim(), 
        timestamp: new Date() 
      }]);
    };

    recognition.current.onerror = (event) => {
      console.error("Speech recognition error", event.error);
      setIsListening(false);
    };

    recognition.current.start();
  };

  const stopListening = () => {
    if (recognition.current) {
      recognition.current.stop();
    }
  };

  const clearTranscript = () => setTranscript([]);

  return { transcript, isListening, startListening, stopListening, clearTranscript };
};

export const useAudioVisualizer = (isRecording) => {
  const [dataArray, setDataArray] = useState(new Uint8Array(0));
  const animationFrame = useRef();
  const analyser = useRef();

  useEffect(() => {
    if (!isRecording) {
      if (animationFrame.current) cancelAnimationFrame(animationFrame.current);
      return;
    }

    const startVisualizer = async () => {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const source = audioContext.createMediaStreamSource(stream);
      analyser.current = audioContext.createAnalyser();
      analyser.current.fftSize = 64;
      source.connect(analyser.current);

      const bufferLength = analyser.current.frequencyBinCount;
      const data = new Uint8Array(bufferLength);

      const update = () => {
        analyser.current.getByteFrequencyData(data);
        setDataArray(new Uint8Array(data));
        animationFrame.current = requestAnimationFrame(update);
      };
      update();
    };

    startVisualizer();
    return () => {
      if (animationFrame.current) cancelAnimationFrame(animationFrame.current);
    };
  }, [isRecording]);

  return dataArray;
};

export const useAnalytics = (sessions) => {
  const [heatmap, setHeatmap] = useState({ g1: 0, g2: 0, g3: 0 });

  useEffect(() => {
    if (!sessions) return;
    const counts = { g1: 0, g2: 0, g3: 0 };
    sessions.forEach(s => {
      if (s.failedGate) counts[s.failedGate]++;
    });
    setHeatmap(counts);
  }, [sessions]);

  return { heatmap };
};

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

export const useAIEngine = (personality) => {
  const [insights, setInsights] = useState([]);

  const generateInsight = (gate, transcript) => {
    const lastWords = transcript.slice(-1)[0]?.text?.toLowerCase() || "";
    let tip = "";

    if (lastWords.includes("price") || lastWords.includes("cost")) {
      tip = `[${personality}] Objection Detected: Avoid defending the price. Ask about the 'Cost of Inaction' instead.`;
    } else if (lastWords.includes("later") || lastWords.includes("next month")) {
      tip = `[${personality}] Urgency Gap: They are pushing to G2. Pivot back to G1 to reinforce the Pain.`;
    } else {
      const tips = {
        rapport: [
          `[${personality}] Mirror their tone — they seem professional but approachable.`,
          `[${personality}] They mentioned a specific pain point about 'scaling'. Lean into that.`,
          `[${personality}] Acknowledge their expertise before diving into the gate.`
        ],
        g1: [
          `[${personality}] Ask about the 'Expected Outcome' again. They were a bit vague.`,
          `[${personality}] They mentioned 'leads' but not 'quality'. Clarify the definition of a lead.`,
          `[${personality}] Math check: If they spend $2k and want 50 leads, that's $40/lead. Is that realistic?`
        ],
        g2: [
          `[${personality}] Timeline seems urgent, but check if the 'decision maker' is actually on vacation.`,
          `[${personality}] Ask what happens if they DON'T start by next month.`,
          `[${personality}] Identify the 'Approval Process' bottleneck now.`
        ],
        g3: [
          `[${personality}] They balked at the 'range'. Go back to Value Gap.`,
          `[${personality}] Allocation vs Capacity: It sounds like they HAVE the money but DON'T want to spend it yet.`,
          `[${personality}] Anchor to the $10k loss they mentioned in Gate 1.`
        ]
      };
      const gateTips = tips[gate] || tips.rapport;
      tip = gateTips[Math.floor(Math.random() * gateTips.length)];
    }

    const newInsight = { id: Date.now(), text: tip };
    setInsights(prev => [newInsight, ...prev].slice(0, 3));
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

export const useDeepAnalysis = () => {
  const [analyzing, setAnalyzing] = useState(false);
  const [solution, setSolution] = useState(null);

  const analyzeConversation = async (transcript, prospectName) => {
    setAnalyzing(true);
    // Simulate a deep API call (e.g. OpenAI/Gemini)
    // In a real app, you'd fetch from your edge function here
    await new Promise(r => setTimeout(r, 2000));
    
    const analysis = {
      painPoints: ["Scaling bottleneck in Lead Gen", "High CAC from manual outreach"],
      personalizedValue: `For ${prospectName}, we move from $45/lead to $12/lead by automating Gate 1 validation.`,
      solutionArchitecture: "Automated Lead Funnel + AI Vetting Layer",
      strategicHook: "By not implementing this, you are burning $4k/month in manual labor costs."
    };
    
    setSolution(analysis);
    setAnalyzing(false);
    return analysis;
  };

  return { analyzeConversation, analyzing, solution };
};

export const useSound = () => {
  const playSound = (type) => {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === 'success') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.5);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
    } else if (type === 'gate') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(220, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(660, ctx.currentTime + 0.2);
      gain.gain.setValueAtTime(0.05, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
    } else if (type === 'click') {
      osc.type = 'square';
      osc.frequency.setValueAtTime(150, ctx.currentTime);
      gain.gain.setValueAtTime(0.02, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
    }

    osc.start();
    osc.stop(ctx.currentTime + 0.5);
  };

  return { playSound };
};

export const Embers = () => {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {[...Array(20)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute bg-[#FF3B30] rounded-full blur-[1px] opacity-20"
          initial={{ 
            x: Math.random() * window.innerWidth, 
            y: window.innerHeight + 10,
            width: Math.random() * 3 + 1,
            height: Math.random() * 3 + 1
          }}
          animate={{ 
            y: -100,
            x: `calc(${Math.random() * 100}vw + ${Math.sin(i) * 50}px)`,
            opacity: [0, 0.2, 0]
          }}
          transition={{ 
            duration: Math.random() * 10 + 10, 
            repeat: Infinity, 
            delay: Math.random() * 20 
          }}
        />
      ))}
    </div>
  );
};

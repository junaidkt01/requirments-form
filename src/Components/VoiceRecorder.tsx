import { useRef, useState } from "react";

/**
 * Improved Voice Recorder + Transcriber
 * - Separates final vs interim transcript
 * - Auto-restarts recognition on end while recording
 * - Keeps audio recording for playback
 *
 * Works best in Chrome. For Malayalam use "ml-IN", for English "en-US".
 */

const VoiceRecorder = () => {
    const [isRecording, setIsRecording] = useState(false);
    const [finalTranscript, setFinalTranscript] = useState(""); // stable/final text
    const [interimTranscript, setInterimTranscript] = useState(""); // live partial
    const [audioURL, setAudioURL] = useState<string | null>(null);
    const [language, setLanguage] = useState<"en-US" | "ml-IN">("en-US");

    const recognitionRef = useRef<any>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunks = useRef<Blob[]>([]);
    const mediaStreamRef = useRef<MediaStream | null>(null);

    const createRecognition = () => {
        const SpeechRecognition =
            (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) return null;

        const recog = new SpeechRecognition();
        recog.lang = language;
        recog.continuous = true; // keep receiving results
        recog.interimResults = true;
        recog.maxAlternatives = 3;

        // recog.onresult = (event: SpeechRecognitionEvent) => {
        recog.onresult = (event: any) => {
            let interim = "";
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                const res = event.results[i];
                if (res.isFinal) {
                    // Append final results to finalTranscript
                    setFinalTranscript((prev) => prev + (prev ? " " : "") + res[0].transcript.trim());
                } else {
                    interim += res[0].transcript;
                }
            }
            setInterimTranscript(interim);
        };

        recog.onerror = (e: any) => {
            console.warn("Recognition error:", e.error);
            // do not stop recording UI on transient errors
        };

        // Auto-restart if recording (Chrome may end recognition on silence)
        recog.onend = () => {
            if (isRecording) {
                // small timeout to avoid busy loop
                setTimeout(() => {
                    try {
                        recog.start();
                    } catch (err) {
                        // start may throw if already starting — ignore
                    }
                }, 200);
            }
        };

        return recog;
    };

    const startRecording = async () => {
        if (isRecording) return;
        setFinalTranscript("");
        setInterimTranscript("");
        setAudioURL(null);
        audioChunks.current = [];

        // request mic
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    sampleRate: 44100,
                },
            });
            mediaStreamRef.current = stream;

            // MediaRecorder
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            mediaRecorder.ondataavailable = (ev) => {
                if (ev.data && ev.data.size > 0) audioChunks.current.push(ev.data);
            };
            mediaRecorder.onstop = () => {
                const blob = new Blob(audioChunks.current, { type: "audio/webm" });
                const url = URL.createObjectURL(blob);
                setAudioURL(url);
            };
            mediaRecorder.start();

            // SpeechRecognition
            let recog = createRecognition();
            if (!recog) {
                alert("Speech recognition not supported in this browser (use Chrome).");
                // still record audio for playback
                setIsRecording(true);
                return;
            }
            recognitionRef.current = recog;
            recog.start();

            setIsRecording(true);
        } catch (err) {
            console.error("microphone error:", err);
            alert("Please allow microphone access and try again.");
        }
    };

    const stopRecording = () => {
        // stop recognition
        try {
            recognitionRef.current?.stop();
        } catch (e) { }
        recognitionRef.current = null;

        // stop media recorder
        try {
            mediaRecorderRef.current?.stop();
        } catch (e) { }
        mediaRecorderRef.current = null;

        // stop tracks
        try {
            mediaStreamRef.current?.getTracks().forEach((t) => t.stop());
            mediaStreamRef.current = null;
        } catch (e) { }

        setIsRecording(false);
        setInterimTranscript("");
    };

    const downloadTranscript = () => {
        const text = finalTranscript.trim() || interimTranscript.trim();
        if (!text) return alert("No transcript to download.");
        const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = `transcript_${language}_${new Date().toISOString()}.txt`;
        a.click();
    };

    const downloadAudio = () => {
        if (!audioURL) return alert("No audio recorded.");
        // fetch blob from url and trigger download
        fetch(audioURL)
            .then((r) => r.blob())
            .then((blob) => {
                const a = document.createElement("a");
                a.href = URL.createObjectURL(blob);
                a.download = `recording_${language}_${new Date().toISOString()}.webm`;
                a.click();
            });
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-700 p-6 text-white">
            <div className="w-full max-w-2xl bg-gray-800 rounded-2xl p-6 shadow-xl">
                <h2 className="text-2xl font-semibold text-center mb-4">Voice Recorder + Improved Transcription</h2>

                <div className="flex items-center gap-3 justify-center mb-4">
                    <select
                        value={language}
                        onChange={(e) => setLanguage(e.target.value as "en-US" | "ml-IN")}
                        className="bg-gray-900 border border-gray-600 px-3 py-2 rounded-md"
                        disabled={isRecording}
                    >
                        <option value="en-US">English (en-US)</option>
                        <option value="ml-IN">Malayalam (ml-IN)</option>
                    </select>

                    <button
                        onClick={isRecording ? stopRecording : startRecording}
                        className={`px-5 py-2 rounded-full font-medium ${isRecording ? "bg-red-500 hover:bg-red-600" : "bg-green-500 hover:bg-green-600"}`}
                    >
                        {isRecording ? "⏹ Stop" : "🎙 Start"}
                    </button>

                    <button onClick={downloadTranscript} className="px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-700">
                        Download Transcript
                    </button>

                    <button onClick={downloadAudio} className="px-4 py-2 rounded-md bg-indigo-600 hover:bg-indigo-700" disabled={!audioURL}>
                        Download Audio
                    </button>
                </div>

                <div className="grid grid-cols-1 gap-4">
                    <div className="bg-gray-900 p-4 rounded-lg min-h-[120px]">
                        <p className="text-sm text-gray-400 mb-2">Final Transcript</p>
                        <div className="text-gray-100 leading-relaxed">{finalTranscript || <span className="text-gray-500">(No final transcript yet)</span>}</div>
                    </div>

                    <div className="bg-gray-900 p-4 rounded-lg min-h-[80px]">
                        <p className="text-sm text-gray-400 mb-2">Interim (Live)</p>
                        <div className="text-gray-200 italic">{interimTranscript || <span className="text-gray-500">Listening...</span>}</div>
                    </div>

                    {audioURL && (
                        <div className="bg-gray-900 p-4 rounded-lg">
                            <p className="text-sm text-gray-400 mb-2">Recorded Audio</p>
                            <audio src={audioURL} controls className="w-full rounded" />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default VoiceRecorder;


// import React, { useState, useRef } from "react";

// const VoiceRecorder = () => {
//     const [isRecording, setIsRecording] = useState(false);
//     const [audioURL, setAudioURL] = useState<string | null>(null);
//     const [transcript, setTranscript] = useState("");
//     const [language, setLanguage] = useState<"en-US" | "ml-IN">("en-US");
//     const mediaRecorderRef = useRef<MediaRecorder | null>(null);
//     const recognitionRef = useRef<any>(null);
//     const audioChunks = useRef<Blob[]>([]);

//     const startRecording = async () => {
//         try {
//             const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
//             const mediaRecorder = new MediaRecorder(stream);
//             audioChunks.current = [];
//             mediaRecorderRef.current = mediaRecorder;

//             mediaRecorder.ondataavailable = (event) => {
//                 audioChunks.current.push(event.data);
//             };

//             mediaRecorder.onstop = () => {
//                 const audioBlob = new Blob(audioChunks.current, { type: "audio/webm" });
//                 const audioUrl = URL.createObjectURL(audioBlob);
//                 setAudioURL(audioUrl);
//             };

//             mediaRecorder.start();

//             // ✅ Setup Speech Recognition
//             const SpeechRecognition =
//                 (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

//             if (!SpeechRecognition) {
//                 alert("Speech recognition is not supported in this browser.");
//                 return;
//             }

//             const recognition = new SpeechRecognition();
//             recognition.lang = language; // English or Malayalam
//             recognition.continuous = true;
//             recognition.interimResults = true;

//             recognition.onresult = (event: any) => {
//                 const text = Array.from(event.results)
//                     .map((result: any) => result[0].transcript)
//                     .join(" ");
//                 setTranscript(text);
//             };

//             recognition.onerror = (event: any) => {
//                 console.error("Speech recognition error:", event.error);
//             };

//             recognitionRef.current = recognition;
//             recognition.start();

//             setIsRecording(true);
//         } catch (error) {
//             console.error("Error accessing microphone:", error);
//             alert("Please allow microphone access.");
//         }
//     };

//     const stopRecording = () => {
//         mediaRecorderRef.current?.stop();
//         recognitionRef.current?.stop();
//         setIsRecording(false);
//     };

//     return (
//         <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-700 text-white p-6">
//             <div className="w-full max-w-md bg-gray-800 rounded-2xl shadow-xl p-6">
//                 <h2 className="text-2xl font-semibold text-center mb-4">
//                     🎙️ Voice Recorder + Transcriber
//                 </h2>

//                 {/* Language Switcher */}
//                 <div className="flex justify-center mb-6">
//                     <select
//                         value={language}
//                         onChange={(e) => setLanguage(e.target.value as "en-US" | "ml-IN")}
//                         className="bg-gray-900 text-white border border-gray-600 rounded-lg px-3 py-2 focus:outline-none"
//                     >
//                         <option value="en-US">English (US)</option>
//                         <option value="ml-IN">Malayalam (India)</option>
//                     </select>
//                 </div>

//                 <div className="flex flex-col items-center gap-4">
//                     <button
//                         onClick={isRecording ? stopRecording : startRecording}
//                         className={`px-6 py-3 rounded-full font-semibold text-lg transition-all duration-300 ${isRecording
//                             ? "bg-red-500 hover:bg-red-600 animate-pulse"
//                             : "bg-green-500 hover:bg-green-600"
//                             }`}
//                     >
//                         {isRecording ? "⏹ Stop Recording" : "🎤 Start Recording"}
//                     </button>

//                     <div className="w-full mt-6">
//                         <p className="text-gray-300 mb-2 text-sm">🧠 Live Transcript:</p>
//                         <div className="bg-gray-900 p-4 rounded-xl min-h-[100px] text-gray-100 overflow-y-auto text-sm leading-relaxed">
//                             {transcript || "Speak something..."}
//                         </div>
//                     </div>

//                     {audioURL && (
//                         <div className="w-full mt-6">
//                             <p className="text-gray-300 mb-2 text-sm">🔊 Recorded Audio:</p>
//                             <audio
//                                 src={audioURL}
//                                 controls
//                                 className="w-full rounded-lg bg-gray-900"
//                             />
//                         </div>
//                     )}
//                 </div>
//             </div>

//             <footer className="text-gray-400 mt-8 text-sm text-center">
//                 🌐 Works best in Google Chrome
//                 <br />
//                 (Supports English 🇺🇸 & Malayalam 🇮🇳)
//             </footer>
//         </div>
//     );
// };

// export default VoiceRecorder;
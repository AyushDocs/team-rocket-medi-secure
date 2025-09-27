"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    Bot,
    User,
    Send,
    Loader2,
    Heart,
    Shield,
    AlertTriangle,
    Sparkles,
} from "lucide-react";
import { getAI, getGenerativeModel, GoogleAIBackend } from "firebase/ai";
import app from "../../firebase.config";

export default function HealthChatbot({ user }) {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const [isListening, setIsListening] = useState(false);
    
    const {
        transcript,
        listening,
        resetTranscript,
        browserSupportsSpeechRecognition
    } = useSpeechRecognition();

    useEffect(() => {
        if (transcript) {
            setInput(transcript);
        }
    }, [transcript]);

    const handleVoiceInput = () => {
        if (!browserSupportsSpeechRecognition) {
            alert('Browser doesn\'t support speech recognition.');
            return;
        }

        if (!isListening) {
            resetTranscript();
            SpeechRecognition.startListening();
        } else {
            SpeechRecognition.stopListening();
        }
        setIsListening(!isListening);
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    const handleInput = async (prompt, onChunk) => {
        const ai = getAI(app, { backend: new GoogleAIBackend() });
        const model = getGenerativeModel(ai, { model: "gemini-2.5-flash" });

        // Add healthcare context and guidelines to the prompt
        const healthcarePrompt = `You are a healthcare assistant chatbot. Follow these guidelines strictly:

1. Begin every response with this disclaimer:
"As an AI, I cannot prescribe medicines or replace professional medical advice. I can only share traditional and home-based methods for general wellness."

2. When responding to health concerns, only suggest:
- Traditional remedies
- Cultural healing practices
- Home-based methods
- Rest and lifestyle adjustments
- Hydration tips
- Breathing exercises
- Yoga or gentle exercises
- Herbal teas or natural foods
- General wellness practices

3. DO NOT:
- Suggest any modern medicines
- Recommend prescription drugs
- Advise about over-the-counter medications
- Make medical diagnoses

4. End responses with:
"If your condition is serious or persistent, please consult a qualified healthcare professional."

User's question: ${prompt}`;

        const result = await model.generateContentStream(healthcarePrompt);
        for await (const chunk of result.stream) {
            const chunkText = chunk.text();
            if (onChunk) onChunk(chunkText); // callback for partial updates
        }

        console.log("Aggregated response:", await result.response);
        return await result.response;
    };

    const sendMessage = async () => {
        if (!input.trim()) return;

        const userMessage = { sender: "user", text: input };
        setMessages((prev) => [...prev, userMessage]);
        setInput("");
        setIsTyping(true);

        const onChunk = (chunk) => {
            setMessages((prev) => {
                const lastMessage = prev[prev.length - 1];
                if (lastMessage.sender === "bot") {
                    // Update the last bot message with the new chunk
                    return [
                        ...prev.slice(0, -1),
                        { sender: "bot", text: lastMessage.text + chunk },
                    ];
                } else {
                    // Add a new bot message
                    return [...prev, { sender: "bot", text: chunk }];
                }
            });
        };

        try {
            await handleInput(input, onChunk);
        } catch (error) {
            console.error("Error generating response:", error);
            setMessages((prev) => [
                ...prev,
                {
                    sender: "bot",
                    text: "Sorry, something went wrong. Please try again.",
                },
            ]);
        } finally {
            setIsTyping(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                        <Bot className="h-6 w-6 text-[#7eb0d5]" />
                        Health Assistant
                    </h2>
                    <p className="text-gray-600">
                        Explore traditional wellness practices and natural remedies
                    </p>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Shield className="h-4 w-4 text-[#b2e061]" />
                    <span>HIPAA Compliant</span>
                </div>
            </div>

            {/* Disclaimer */}
            <Card className="border-[#FFDF00] bg-yellow-50">
                <CardContent className="p-4">
                    <div className="flex items-start space-x-3">
                        <AlertTriangle className="h-5 w-5 text-[#FFDF00] mt-0.5" />
                        <div>
                            <p className="text-sm font-medium text-gray-900">
                                Medical Disclaimer
                            </p>
                            <p className="text-sm text-gray-700 mt-1">
                                This AI assistant provides general health
                                information only. Always consult your healthcare
                                provider for medical advice, diagnosis, or
                                treatment decisions.
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Chat Interface */}
            <Card className="h-[calc(80vh-200px)] min-h-[500px] max-h-[800px] flex flex-col relative overflow-hidden">
                <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-[#7eb0d5]" />
                        Chat with Your Health Assistant
                    </CardTitle>
                    <CardDescription>
                        Ask questions about your health, medications, or
                        upcoming appointments
                    </CardDescription>
                </CardHeader>

                <CardContent className="flex-1 flex flex-col overflow-hidden pb-20">
                    {/* Messages */}
                    <ScrollArea className="flex-1 overflow-y-auto px-4">
                        <div className="space-y-4 pb-4 w-full max-w-[900px] mx-auto">
                            {messages.length === 0 && (
                                <div className="text-center py-8">
                                    <Bot className="h-12 w-12 text-[#7eb0d5] mx-auto mb-4" />
                                    <h3 className="font-medium text-gray-900 mb-2">
                                        Welcome to your Traditional Health & Wellness Guide!
                                    </h3>
                                    <p className="text-gray-600 text-sm mb-4">
                                        I can help you explore traditional remedies, home-based methods, 
                                        and natural wellness practices. Remember, I cannot provide medical 
                                        advice or replace consultation with healthcare professionals.
                                    </p>
                                    <div className="grid grid-cols-1 gap-2 max-w-md mx-auto">
                                        <p className="text-sm text-gray-600 italic">
                                            You can ask about:
                                        </p>
                                        <ul className="text-sm text-gray-600 list-disc pl-5 space-y-1">
                                            <li>Traditional remedies for common discomforts</li>
                                            <li>Natural wellness practices</li>
                                            <li>Breathing exercises and yoga</li>
                                            <li>Healthy lifestyle habits</li>
                                            <li>Herbal teas and natural foods</li>
                                        </ul>
                                    </div>
                                </div>
                            )}

                            {messages.map((message, index) => (
                                <div
                                    key={index}
                                    className={`flex w-full ${
                                        message.sender === "user"
                                            ? "justify-end"
                                            : "justify-start"
                                    }`}
                                >
                                    <div
                                        className={`p-3 rounded-lg max-w-[85%] break-words ${
                                            message.sender === "user"
                                                ? "bg-blue-500 text-white prose-invert"
                                                : "bg-gray-200 text-gray-800 prose prose-sm"
                                        } prose max-w-none`}
                                    >
                                        {message.sender === "user" ? (
                                            <p className="m-0 whitespace-pre-wrap">{message.text}</p>
                                        ) : (
                                            <ReactMarkdown
                                                remarkPlugins={[remarkGfm]}
                                                rehypePlugins={[rehypeRaw]}
                                                components={{
                                                    root: ({children}) => <div className="m-0">{children}</div>,
                                                    // Override paragraph to remove margin
                                                    p: ({node, children}) => <p className="m-0 mb-2 last:mb-0">{children}</p>,
                                                    // Style code blocks
                                                    pre: ({node, children}) => (
                                                        <pre className="bg-gray-100 rounded p-2 my-2">{children}</pre>
                                                    ),
                                                    // Style inline code
                                                    code: ({node, inline, children}) => (
                                                        <code className={inline ? "bg-gray-100 rounded px-1" : ""}>{children}</code>
                                                    ),
                                                    // Style links
                                                    a: ({node, href, children}) => (
                                                        <a href={href} className="text-blue-600 hover:underline">{children}</a>
                                                    ),
                                                    // Style lists
                                                    ul: ({children}) => <ul className="list-disc pl-4 mb-2">{children}</ul>,
                                                    ol: ({children}) => <ol className="list-decimal pl-4 mb-2">{children}</ol>,
                                                    li: ({children}) => <li className="mb-1">{children}</li>,
                                                    // Style headings
                                                    h1: ({children}) => <h1 className="text-xl font-bold mb-2">{children}</h1>,
                                                    h2: ({children}) => <h2 className="text-lg font-bold mb-2">{children}</h2>,
                                                    h3: ({children}) => <h3 className="text-base font-bold mb-2">{children}</h3>,
                                                    // Style blockquotes
                                                    blockquote: ({children}) => <blockquote className="border-l-4 border-gray-300 pl-4 my-2">{children}</blockquote>
                                                }}
                                            >
                                                {message.text}
                                            </ReactMarkdown>
                                        )}
                                    </div>
                                </div>
                            ))}

                            {isTyping && (
                                <div className="flex justify-start">
                                    <div className="p-3 rounded-lg max-w-xs bg-gray-200 text-gray-800">
                                        <Loader2 className="animate-spin h-5 w-5 inline-block mr-2" />
                                        Typing...
                                    </div>
                                </div>
                            )}
                        </div>
                    </ScrollArea>

                    {/* Input Form */}
                    <div className="flex items-center space-x-4 absolute bottom-4 left-4 right-4 bg-white p-4 border-t">
                        <Input
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyPress={handleKeyPress}
                            placeholder="Type your message... (Markdown supported)"
                            className="flex-1"
                        />
                        <Button
                            onClick={handleVoiceInput}
                            className={`${isListening ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'}`}
                            title={isListening ? 'Stop recording' : 'Start voice input'}
                        >
                            {isListening ? (
                                <span className="animate-pulse">●</span>
                            ) : (
                                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                                </svg>
                            )}
                        </Button>
                        <Button
                            onClick={sendMessage}
                            className="bg-blue-500 hover:bg-blue-600"
                        >
                            <Send className="h-5 w-5" />
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Features */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center space-x-3">
                            <Heart className="h-8 w-8 text-[#b2e061]" />
                            <div>
                                <h3 className="font-medium">
                                    Personalized Guidance
                                </h3>
                                <p className="text-sm text-gray-600">
                                    Get advice tailored to your health profile
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center space-x-3">
                            <Shield className="h-8 w-8 text-[#7eb0d5]" />
                            <div>
                                <h3 className="font-medium">
                                    Secure & Private
                                </h3>
                                <p className="text-sm text-gray-600">
                                    Your conversations are encrypted and private
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center space-x-3">
                            <Sparkles className="h-8 w-8 text-[#FFDF00]" />
                            <div>
                                <h3 className="font-medium">24/7 Available</h3>
                                <p className="text-sm text-gray-600">
                                    Get health support whenever you need it
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

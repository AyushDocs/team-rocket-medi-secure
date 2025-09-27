"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
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

    const handleInput = async (prompt, onChunk) => {
        const ai = getAI(app, { backend: new GoogleAIBackend() });
        const model = getGenerativeModel(ai, { model: "gemini-2.5-flash" });

        const result = await model.generateContentStream(prompt);
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
                        Get personalized health guidance and support
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
            <Card className="h-[600px] flex flex-col">
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

                <CardContent className="flex-1 flex flex-col space-y-4">
                    {/* Messages */}
                    <ScrollArea className="flex-1 pr-4">
                        <div className="space-y-4">
                            {messages.length === 0 && (
                                <div className="text-center py-8">
                                    <Bot className="h-12 w-12 text-[#7eb0d5] mx-auto mb-4" />
                                    <h3 className="font-medium text-gray-900 mb-2">
                                        Welcome to your Health Assistant!
                                    </h3>
                                    <p className="text-gray-600 text-sm mb-4">
                                        I'm here to help you with general health
                                        questions and guidance.
                                    </p>
                                    <div className="grid grid-cols-1 gap-2 max-w-md mx-auto"></div>
                                </div>
                            )}

                            {messages.map((message, index) => (
                                <div
                                    key={index}
                                    className={`flex ${
                                        message.sender === "user"
                                            ? "justify-end"
                                            : "justify-start"
                                    }`}
                                >
                                    <div
                                        className={`p-3 rounded-lg max-w-xs ${
                                            message.sender === "user"
                                                ? "bg-blue-500 text-white"
                                                : "bg-gray-200 text-gray-800"
                                        }`}
                                    >
                                        {message.text}
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
                    <div className="flex items-center space-x-4">
                        <Input
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Type your message..."
                            className="flex-1"
                        />
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

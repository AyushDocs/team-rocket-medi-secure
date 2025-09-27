"use client"

import { useState } from "react"
import { useChat } from "@vercel/ai"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Bot, User, Send, Loader2, Heart, Shield, AlertTriangle, Sparkles } from "lucide-react"

export default function HealthChatbot({ user }) {
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: "/api/chat",
    initialMessages: [],
    headers: {
      'Content-Type': 'application/json',
    },
  })

  const [quickQuestions] = useState([
    "What should I know about my diabetes medication?",
    "How can I prepare for my upcoming appointment?",
    "What are normal blood pressure ranges?",
    "Tips for managing stress and anxiety",
    "How to track my symptoms effectively",
  ])

  const handleQuickQuestion = (question) => {
    handleInputChange({ target: { value: question } })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Bot className="h-6 w-6 text-[#7eb0d5]" />
            Health Assistant
          </h2>
          <p className="text-gray-600">Get personalized health guidance and support</p>
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
              <p className="text-sm font-medium text-gray-900">Medical Disclaimer</p>
              <p className="text-sm text-gray-700 mt-1">
                This AI assistant provides general health information only. Always consult your healthcare provider for
                medical advice, diagnosis, or treatment decisions.
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
          <CardDescription>Ask questions about your health, medications, or upcoming appointments</CardDescription>
        </CardHeader>

        <CardContent className="flex-1 flex flex-col space-y-4">
          {/* Messages */}
          <ScrollArea className="flex-1 pr-4">
            <div className="space-y-4">
              {messages.length === 0 && (
                <div className="text-center py-8">
                  <Bot className="h-12 w-12 text-[#7eb0d5] mx-auto mb-4" />
                  <h3 className="font-medium text-gray-900 mb-2">Welcome to your Health Assistant!</h3>
                  <p className="text-gray-600 text-sm mb-4">
                    I'm here to help you with general health questions and guidance.
                  </p>
                  <div className="grid grid-cols-1 gap-2 max-w-md mx-auto">
                    {quickQuestions.slice(0, 3).map((question, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        size="sm"
                        className="text-left justify-start h-auto p-3 text-wrap bg-transparent"
                        onClick={() => handleQuickQuestion(question)}
                      >
                        {question}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex items-start space-x-3 ${
                    message.role === "user" ? "flex-row-reverse space-x-reverse" : ""
                  }`}
                >
                  <Avatar className="h-8 w-8">
                    {message.role === "user" ? (
                      <>
                        <AvatarImage src="/man.jpg" />
                        <AvatarFallback>
                          <User className="h-4 w-4" />
                        </AvatarFallback>
                      </>
                    ) : (
                      <AvatarFallback className="bg-[#7eb0d5] text-white">
                        <Bot className="h-4 w-4" />
                      </AvatarFallback>
                    )}
                  </Avatar>

                  <div className={`flex-1 max-w-[80%] ${message.role === "user" ? "text-right" : "text-left"}`}>
                    <div
                      className={`rounded-lg p-3 ${
                        message.role === "user" ? "bg-[#7eb0d5] text-white ml-auto" : "bg-gray-100 text-gray-900"
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{message.role === "user" ? "You" : "Health Assistant"}</p>
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex items-start space-x-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-[#7eb0d5] text-white">
                      <Bot className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="bg-gray-100 rounded-lg p-3">
                    <div className="flex items-center space-x-2">
                      <Loader2 className="h-4 w-4 animate-spin text-[#7eb0d5]" />
                      <span className="text-sm text-gray-600">Thinking...</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Quick Questions */}
          {messages.length > 0 && (
            <div className="border-t pt-4">
              <p className="text-sm font-medium text-gray-700 mb-2">Quick Questions:</p>
              <div className="flex flex-wrap gap-2">
                {quickQuestions.slice(3).map((question, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    className="text-xs bg-transparent"
                    onClick={() => handleQuickQuestion(question)}
                    disabled={isLoading}
                  >
                    {question}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Input Form */}
          <form onSubmit={handleSubmit} className="flex space-x-2">
            <Input
              value={input}
              onChange={handleInputChange}
              placeholder="Ask about your health, medications, or appointments..."
              disabled={isLoading}
              className="flex-1"
            />
            <Button type="submit" disabled={isLoading || !input.trim()} className="bg-[#7eb0d5] hover:bg-[#5a8bb5]">
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Features */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <Heart className="h-8 w-8 text-[#b2e061]" />
              <div>
                <h3 className="font-medium">Personalized Guidance</h3>
                <p className="text-sm text-gray-600">Get advice tailored to your health profile</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <Shield className="h-8 w-8 text-[#7eb0d5]" />
              <div>
                <h3 className="font-medium">Secure & Private</h3>
                <p className="text-sm text-gray-600">Your conversations are encrypted and private</p>
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
                <p className="text-sm text-gray-600">Get health support whenever you need it</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

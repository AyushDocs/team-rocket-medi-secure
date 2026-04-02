"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  MessageSquare,
  Send,
  Shield,
  AlertTriangle,
  Clock,
  CheckCircle,
  Search,
  Paperclip,
  Star,
  Archive,
  MoreHorizontal,
} from "lucide-react"

export default function MessagingSystem({ userType, currentUser }) {
  const [selectedConversation, setSelectedConversation] = useState(null)
  const [newMessage, setNewMessage] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [isComposing, setIsComposing] = useState(false)

  // Mock conversations data
  const conversations = [
    {
      id: 1,
      participant: userType === "doctor" ? "Sarah Johnson" : "Dr. Sarah Wilson",
      participantRole: userType === "doctor" ? "Patient" : "Doctor",
      avatar: userType === "doctor" ? "/diverse-woman-portrait.png" : "/doctor-avatar.jpg",
      lastMessage: "Thank you for the medication adjustment. I'm feeling much better.",
      timestamp: "2 hours ago",
      unread: true,
      priority: "normal",
      status: "active",
      messages: [
        {
          id: 1,
          sender: userType === "doctor" ? "Sarah Johnson" : "Dr. Sarah Wilson",
          content: "Hello, I've been experiencing some side effects from the new medication.",
          timestamp: "2024-01-15 09:30 AM",
          encrypted: true,
          priority: "high",
        },
        {
          id: 2,
          sender: userType === "doctor" ? "Dr. Sarah Wilson" : "Sarah Johnson",
          content: "I'm sorry to hear that. Can you describe the specific side effects you're experiencing?",
          timestamp: "2024-01-15 10:15 AM",
          encrypted: true,
          priority: "normal",
        },
        {
          id: 3,
          sender: userType === "doctor" ? "Sarah Johnson" : "Dr. Sarah Wilson",
          content: "I've been having mild nausea and dizziness, especially in the mornings.",
          timestamp: "2024-01-15 10:45 AM",
          encrypted: true,
          priority: "normal",
        },
        {
          id: 4,
          sender: userType === "doctor" ? "Dr. Sarah Wilson" : "Sarah Johnson",
          content:
            "Let's adjust your dosage. Please take half the current dose for the next week and monitor how you feel.",
          timestamp: "2024-01-15 11:30 AM",
          encrypted: true,
          priority: "normal",
        },
        {
          id: 5,
          sender: userType === "doctor" ? "Sarah Johnson" : "Dr. Sarah Wilson",
          content: "Thank you for the medication adjustment. I'm feeling much better.",
          timestamp: "2024-01-16 08:20 AM",
          encrypted: true,
          priority: "normal",
        },
      ],
    },
    {
      id: 2,
      participant: userType === "doctor" ? "Michael Chen" : "Dr. Michael Chen",
      participantRole: userType === "doctor" ? "Patient" : "Doctor",
      avatar: userType === "doctor" ? "/man.jpg" : "/doctor-avatar-2.jpg",
      lastMessage: "Your lab results look good. Keep up the great work!",
      timestamp: "1 day ago",
      unread: false,
      priority: "normal",
      status: "active",
      messages: [
        {
          id: 1,
          sender: userType === "doctor" ? "Dr. Michael Chen" : "Michael Chen",
          content: "Your recent blood work shows significant improvement in your cholesterol levels.",
          timestamp: "2024-01-14 02:30 PM",
          encrypted: true,
          priority: "normal",
        },
        {
          id: 2,
          sender: userType === "doctor" ? "Michael Chen" : "Dr. Michael Chen",
          content: "That's wonderful news! Should I continue with the current diet and exercise plan?",
          timestamp: "2024-01-14 03:15 PM",
          encrypted: true,
          priority: "normal",
        },
        {
          id: 3,
          sender: userType === "doctor" ? "Dr. Michael Chen" : "Michael Chen",
          content: "Yes, absolutely. Your lab results look good. Keep up the great work!",
          timestamp: "2024-01-14 04:00 PM",
          encrypted: true,
          priority: "normal",
        },
      ],
    },
    {
      id: 3,
      participant: userType === "doctor" ? "Emma Davis" : "Dr. Emma Davis",
      participantRole: userType === "doctor" ? "Patient" : "Doctor",
      avatar: userType === "doctor" ? "/diverse-woman-portrait.png" : "/doctor-avatar-3.jpg",
      lastMessage: "Appointment confirmed for next Tuesday at 2 PM.",
      timestamp: "2 days ago",
      unread: false,
      priority: "low",
      status: "active",
      messages: [
        {
          id: 1,
          sender: userType === "doctor" ? "Emma Davis" : "Dr. Emma Davis",
          content: "I'd like to schedule a follow-up appointment to discuss my asthma management.",
          timestamp: "2024-01-13 11:00 AM",
          encrypted: true,
          priority: "normal",
        },
        {
          id: 2,
          sender: userType === "doctor" ? "Dr. Emma Davis" : "Emma Davis",
          content: "Of course! I have availability next Tuesday at 2 PM. Would that work for you?",
          timestamp: "2024-01-13 11:30 AM",
          encrypted: true,
          priority: "normal",
        },
        {
          id: 3,
          sender: userType === "doctor" ? "Emma Davis" : "Dr. Emma Davis",
          content: "Perfect! Appointment confirmed for next Tuesday at 2 PM.",
          timestamp: "2024-01-13 12:00 PM",
          encrypted: true,
          priority: "normal",
        },
      ],
    },
  ]

  const filteredConversations = conversations.filter((conv) => {
    const matchesSearch = conv.participant.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesFilter =
      filterStatus === "all" ||
      (filterStatus === "unread" && conv.unread) ||
      (filterStatus === "priority" && conv.priority === "high")
    return matchesSearch && matchesFilter
  })

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedConversation) return

    const message = {
      id: selectedConversation.messages.length + 1,
      sender: currentUser.walletAddress,
      content: newMessage,
      timestamp: new Date().toLocaleString(),
      encrypted: true,
      priority: "normal",
    }

    // Update the conversation with the new message
    setSelectedConversation({
      ...selectedConversation,
      messages: [...selectedConversation.messages, message],
    })

    setNewMessage("")
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "high":
        return "destructive"
      case "medium":
        return "secondary"
      default:
        return "outline"
    }
  }

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case "high":
        return <AlertTriangle className="h-3 w-3" />
      case "medium":
        return <Clock className="h-3 w-3" />
      default:
        return null
    }
  }

  return (
    <div className="flex h-[calc(100vh-200px)] bg-white rounded-lg shadow-sm border">
      {/* Conversations List */}
      <div className="w-1/3 border-r bg-gray-50">
        <div className="p-4 border-b bg-white">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Messages</h2>
            <Dialog open={isComposing} onOpenChange={setIsComposing}>
              <DialogTrigger asChild>
                <Button size="sm" className="bg-[#7eb0d5] hover:bg-[#5a8bb5]">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  New
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>New Message</DialogTitle>
                  <DialogDescription>
                    Send a secure message to a {userType === "doctor" ? "patient" : "healthcare provider"}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="recipient">To</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder={`Select ${userType === "doctor" ? "patient" : "doctor"}`} />
                      </SelectTrigger>
                      <SelectContent>
                        {conversations.map((conv) => (
                          <SelectItem key={conv.id} value={conv.participant}>
                            {conv.participant}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="subject">Subject</Label>
                    <Input placeholder="Message subject" />
                  </div>
                  <div>
                    <Label htmlFor="priority">Priority</Label>
                    <Select defaultValue="normal">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="normal">Normal</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="message">Message</Label>
                    <Textarea placeholder="Type your message here..." rows={4} />
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Shield className="h-4 w-4 text-[#b2e061]" />
                    <span>This message will be encrypted end-to-end</span>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setIsComposing(false)}>
                      Cancel
                    </Button>
                    <Button className="bg-[#7eb0d5] hover:bg-[#5a8bb5]">
                      <Send className="h-4 w-4 mr-2" />
                      Send
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Search and Filter */}
          <div className="space-y-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search conversations..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Messages</SelectItem>
                <SelectItem value="unread">Unread</SelectItem>
                <SelectItem value="priority">High Priority</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Conversation List */}
        <div className="overflow-y-auto">
          {filteredConversations.map((conversation) => (
            <div
              key={conversation.id}
              className={`p-4 border-b cursor-pointer hover:bg-white transition-colors ${
                selectedConversation?.id === conversation.id ? "bg-white border-l-4 border-l-[#7eb0d5]" : ""
              }`}
              onClick={() => setSelectedConversation(conversation)}
            >
              <div className="flex items-start space-x-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={conversation.avatar || "/placeholder.svg"} />
                  <AvatarFallback>
                    {conversation.participant
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className={`font-medium truncate ${conversation.unread ? "font-semibold" : ""}`}>
                      {conversation.participant}
                    </h3>
                    <div className="flex items-center space-x-1">
                      {conversation.priority === "high" && (
                        <Badge variant="destructive" className="h-5">
                          {getPriorityIcon(conversation.priority)}
                        </Badge>
                      )}
                      {conversation.unread && <div className="w-2 h-2 bg-[#7eb0d5] rounded-full"></div>}
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mb-1">{conversation.participantRole}</p>
                  <p className={`text-sm truncate ${conversation.unread ? "font-medium" : "text-gray-600"}`}>
                    {conversation.lastMessage}
                  </p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-gray-500">{conversation.timestamp}</span>
                    <div className="flex items-center space-x-1">
                      <Shield className="h-3 w-3 text-[#b2e061]" />
                      <span className="text-xs text-gray-500">Secure</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Message Thread */}
      <div className="flex-1 flex flex-col">
        {selectedConversation ? (
          <>
            {/* Thread Header */}
            <div className="p-4 border-b bg-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={selectedConversation.avatar || "/placeholder.svg"} />
                    <AvatarFallback>
                      {selectedConversation.participant
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold">{selectedConversation.participant}</h3>
                    <p className="text-sm text-gray-600">{selectedConversation.participantRole}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="flex items-center space-x-1 text-sm text-gray-600">
                    <Shield className="h-4 w-4 text-[#b2e061]" />
                    <span>End-to-end encrypted</span>
                  </div>
                  <Button variant="outline" size="sm">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {selectedConversation.messages.map((message) => {
                const isCurrentUser =
                  message.sender === currentUser.walletAddress ||
                  (userType === "doctor" && message.sender.startsWith("Dr.")) ||
                  (userType === "patient" && !message.sender.startsWith("Dr."))

                return (
                  <div key={message.id} className={`flex ${isCurrentUser ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[70%] ${isCurrentUser ? "order-2" : "order-1"}`}>
                      <div
                        className={`p-3 rounded-lg ${
                          isCurrentUser ? "bg-[#7eb0d5] text-white" : "bg-gray-100 text-gray-900"
                        }`}
                      >
                        <p className="text-sm">{message.content}</p>
                        {message.priority === "high" && (
                          <div className="flex items-center mt-2">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            <span className="text-xs">High Priority</span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center justify-between mt-1 px-1">
                        <span className="text-xs text-gray-500">{message.timestamp}</span>
                        <div className="flex items-center space-x-1">
                          <Shield className="h-3 w-3 text-[#b2e061]" />
                          <CheckCircle className="h-3 w-3 text-gray-400" />
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Message Input */}
            <div className="p-4 border-t bg-white">
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm">
                  <Paperclip className="h-4 w-4" />
                </Button>
                <div className="flex-1 relative">
                  <Textarea
                    placeholder="Type your message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    className="min-h-[40px] max-h-[120px] resize-none pr-12"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault()
                        handleSendMessage()
                      }
                    }}
                  />
                  <Button
                    size="sm"
                    className="absolute right-2 top-2 bg-[#7eb0d5] hover:bg-[#5a8bb5]"
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim()}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center space-x-4 text-xs text-gray-500">
                  <div className="flex items-center space-x-1">
                    <Shield className="h-3 w-3 text-[#b2e061]" />
                    <span>Messages are encrypted</span>
                  </div>
                  <span>Press Enter to send, Shift+Enter for new line</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm">
                    <Star className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm">
                    <Archive className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Select a conversation</h3>
              <p className="text-gray-600">Choose a conversation from the list to start messaging</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { APP_TITLE, getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import {
  Sparkles,
  MessageSquare,
  Send,
  Loader2,
  LogOut,
  ArrowLeft,
  Clock,
  CheckCheck,
} from "lucide-react";
import { Link } from "wouter";
import { useState } from "react";
import { toast } from "sonner";

export default function Messages() {
  const { user, loading, logout } = useAuth();
  const [selectedConversation, setSelectedConversation] = useState<
    number | null
  >(null);
  const [messageBody, setMessageBody] = useState("");

  const { data: conversations, refetch: refetchConversations } =
    trpc.messaging.conversations.useQuery(undefined, {
      enabled: !!user,
    });

  const { data: messages, refetch: refetchMessages } =
    trpc.messaging.messages.useQuery(
      { conversationId: selectedConversation! },
      { enabled: !!selectedConversation }
    );

  const sendMessage = trpc.messaging.send.useMutation({
    onSuccess: () => {
      setMessageBody("");
      refetchMessages();
      refetchConversations();
      toast.success("Message sent successfully!");
    },
    onError: error => {
      toast.error("Failed to send message: " + error.message);
    },
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    );
  }

  if (!user) {
    window.location.href = getLoginUrl();
    return null;
  }

  const selectedConv = conversations?.find(
    c => c.conversation.id === selectedConversation
  );

  const handleSendMessage = () => {
    if (!messageBody.trim() || !selectedConv) return;

    sendMessage.mutate({
      prospectId: selectedConv.conversation.prospectId,
      matchId: selectedConv.conversation.matchId || undefined,
      body: messageBody,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900">
      {/* Navigation */}
      <nav className="border-b border-white/10 bg-black/20 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/">
              <a className="flex items-center gap-2 text-xl font-bold">
                <Sparkles className="w-6 h-6 text-orange-500" />
                <span className="bg-gradient-to-r from-orange-500 to-purple-500 bg-clip-text text-transparent">
                  {APP_TITLE}
                </span>
              </a>
            </Link>

            <div className="flex items-center gap-6">
              <Link href="/dashboard">
                <a className="text-sm font-medium text-gray-400 hover:text-orange-500 transition-colors">
                  Dashboard
                </a>
              </Link>
              <Link href="/matches">
                <a className="text-sm font-medium text-gray-400 hover:text-orange-500 transition-colors">
                  Matches
                </a>
              </Link>
              <Link href="/messages">
                <a className="text-sm font-medium text-white hover:text-orange-500 transition-colors">
                  Messages
                </a>
              </Link>
              <div className="flex items-center gap-3 pl-6 border-l border-white/10">
                <div className="text-right">
                  <div className="text-sm font-medium text-white">
                    {user.name}
                  </div>
                  <div className="text-xs text-gray-400">{user.email}</div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => logout()}>
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-white">Messages</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-250px)]">
          {/* Conversations List */}
          <Card className="bg-gray-800/50 border-white/10 overflow-hidden flex flex-col">
            <div className="p-4 border-b border-white/10">
              <h2 className="font-semibold text-white flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-orange-500" />
                Conversations
              </h2>
            </div>
            <div className="flex-1 overflow-y-auto">
              {!conversations || conversations.length === 0 ? (
                <div className="p-8 text-center">
                  <MessageSquare className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-400 text-sm">No conversations yet</p>
                  <p className="text-gray-500 text-xs mt-2">
                    Start messaging your matches!
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-white/5">
                  {conversations.map(({ conversation, prospect }) => (
                    <button
                      key={conversation.id}
                      onClick={() => setSelectedConversation(conversation.id)}
                      className={`w-full p-4 text-left hover:bg-white/5 transition-colors ${
                        selectedConversation === conversation.id
                          ? "bg-white/10"
                          : ""
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-semibold text-white text-sm">
                          {prospect?.name || "Unknown"}
                        </h3>
                        {conversation.unreadCount > 0 && (
                          <span className="px-2 py-0.5 rounded-full bg-orange-500 text-white text-xs font-semibold">
                            {conversation.unreadCount}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 line-clamp-1">
                        {prospect?.title || ""}
                      </p>
                      {conversation.lastMessageAt && (
                        <div className="flex items-center gap-1 mt-2 text-xs text-gray-500">
                          <Clock className="w-3 h-3" />
                          {new Date(
                            conversation.lastMessageAt
                          ).toLocaleDateString()}
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </Card>

          {/* Chat Area */}
          <Card className="lg:col-span-2 bg-gray-800/50 border-white/10 overflow-hidden flex flex-col">
            {selectedConv ? (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b border-white/10 bg-black/20">
                  <h2 className="font-semibold text-white">
                    {selectedConv.prospect?.name || "Unknown"}
                  </h2>
                  <p className="text-sm text-gray-400">
                    {selectedConv.prospect?.title || ""}
                  </p>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {!messages || messages.length === 0 ? (
                    <div className="text-center py-12">
                      <MessageSquare className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                      <p className="text-gray-400">No messages yet</p>
                      <p className="text-gray-500 text-sm mt-2">
                        Start the conversation!
                      </p>
                    </div>
                  ) : (
                    messages.map(message => {
                      const isOwn = message.senderId === user.id;
                      return (
                        <div
                          key={message.id}
                          className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`max-w-[70%] rounded-lg p-3 ${
                              isOwn
                                ? "bg-gradient-to-r from-orange-500 to-purple-600 text-white"
                                : "bg-gray-700/50 text-gray-100"
                            }`}
                          >
                            {message.subject && (
                              <div className="font-semibold mb-1 text-sm">
                                {message.subject}
                              </div>
                            )}
                            <p className="text-sm whitespace-pre-wrap">
                              {message.body}
                            </p>
                            <div
                              className={`flex items-center gap-2 mt-2 text-xs ${
                                isOwn ? "text-white/70" : "text-gray-400"
                              }`}
                            >
                              <span>
                                {new Date(message.sentAt).toLocaleTimeString(
                                  [],
                                  {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  }
                                )}
                              </span>
                              {isOwn && message.status === "read" && (
                                <CheckCheck className="w-3 h-3" />
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Message Input */}
                <div className="p-4 border-t border-white/10 bg-black/20">
                  <div className="flex gap-3">
                    <Textarea
                      value={messageBody}
                      onChange={e => setMessageBody(e.target.value)}
                      placeholder="Type your message..."
                      className="flex-1 bg-gray-700/50 border-white/10 text-white placeholder:text-gray-500 resize-none"
                      rows={3}
                      onKeyDown={e => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                    />
                    <Button
                      onClick={handleSendMessage}
                      disabled={!messageBody.trim() || sendMessage.isPending}
                      className="bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 self-end"
                    >
                      {sendMessage.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <Send className="w-4 h-4 mr-2" />
                          Send
                        </>
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Press Enter to send, Shift+Enter for new line
                  </p>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <MessageSquare className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">
                    Select a conversation
                  </h3>
                  <p className="text-gray-400">
                    Choose a conversation from the list to start messaging
                  </p>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

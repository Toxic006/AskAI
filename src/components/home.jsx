
import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";

function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [theme, setTheme] = useState('dark');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [currentConversationId, setCurrentConversationId] = useState(null);

  // Read API key from .env
  const API_KEY = import.meta.env.VITE_API_KEY;

  // Refs for textarea and messages container
  const textareaRef = useRef(null);
  const messagesEndRef = useRef(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + "px";
    }
  }, [input]);

  // Scroll to bottom when new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Load conversations from localStorage
  useEffect(() => {
    const savedConversations = JSON.parse(localStorage.getItem('conversations') || '[]');
    setConversations(savedConversations);
  }, []);

  // Save conversations to localStorage and update state with functional update to avoid stale closures
  const saveConversations = (newConversations) => {
    localStorage.setItem('conversations', JSON.stringify(newConversations));
    setConversations(newConversations);
  };

  const createNewConversation = () => {
    const newConversation = {
      id: Date.now().toString(),
      title: 'New Chat',
      messages: [],
      createdAt: new Date().toISOString()
    };
    setConversations(prevConversations => {
      const updatedConversations = [newConversation, ...prevConversations];
      localStorage.setItem('conversations', JSON.stringify(updatedConversations));
      return updatedConversations;
    });
    setCurrentConversationId(newConversation.id);
    setMessages([]);
    setSidebarOpen(false);
  };

  const selectConversation = (conversationId) => {
    const conversation = conversations.find(c => c.id === conversationId);
    if (conversation) {
      setCurrentConversationId(conversationId);
      setMessages(conversation.messages);
      setSidebarOpen(false);
    }
  };

  const updateConversationTitle = (conversationId, newTitle) => {
    setConversations(prevConversations => {
      const updatedConversations = prevConversations.map(conv =>
        conv.id === conversationId ? { ...conv, title: newTitle } : conv
      );
      localStorage.setItem('conversations', JSON.stringify(updatedConversations));
      return updatedConversations;
    });
  };

  const deleteConversation = (conversationId) => {
    setConversations(prevConversations => {
      const updatedConversations = prevConversations.filter(c => c.id !== conversationId);
      localStorage.setItem('conversations', JSON.stringify(updatedConversations));
      return updatedConversations;
    });
    if (currentConversationId === conversationId) {
      setCurrentConversationId(null);
      setMessages([]);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage = { role: "user", content: input };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    // Create or update conversation
    let conversationId = currentConversationId;
    if (!conversationId) {
      const newConversation = {
        id: Date.now().toString(),
        title: input.length > 50 ? input.substring(0, 50) + '...' : input,
        messages: newMessages,
        createdAt: new Date().toISOString()
      };
      // Use functional update to avoid stale conversations state
      setConversations(prevConversations => {
        const updatedConversations = [newConversation, ...prevConversations];
        localStorage.setItem('conversations', JSON.stringify(updatedConversations));
        return updatedConversations;
      });
      setCurrentConversationId(newConversation.id);
      conversationId = newConversation.id;
    } else {
      // Update existing conversation
      setConversations(prevConversations => {
        const updatedConversations = prevConversations.map(conv =>
          conv.id === conversationId
            ? { ...conv, messages: newMessages, title: conv.title === 'New Chat' ? (input.length > 50 ? input.substring(0, 50) + '...' : input) : conv.title }
            : conv
        );
        localStorage.setItem('conversations', JSON.stringify(updatedConversations));
        return updatedConversations;
      });
    }

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: `${userMessage.content}`
                  }
                ]
              }
            ]
          })
        }
      );

      const data = await response.json();
      const explanation =
        data?.candidates?.[0]?.content?.parts?.[0]?.text ||
        "No explanation found.";

      const assistantMessage = { role: "assistant", content: explanation };
      const finalMessages = [...newMessages, assistantMessage];
      setMessages(finalMessages);

      // Update conversation with assistant message
      const updatedConversations = conversations.map(conv =>
        conv.id === conversationId ? { ...conv, messages: finalMessages } : conv
      );
      // Use functional update to avoid stale conversations state
      setConversations(prevConversations => {
        const updatedConversations = prevConversations.map(conv =>
          conv.id === conversationId ? { ...conv, messages: finalMessages } : conv
        );
        localStorage.setItem('conversations', JSON.stringify(updatedConversations));
        return updatedConversations;
      });
    } catch (err) {
      const errorMessage = { role: "assistant", content: "⚠️ Error: Could not connect to Gemini API." };
      const finalMessages = [...newMessages, errorMessage];
      setMessages(finalMessages);

      // Update conversation with error message
      const updatedConversations = conversations.map(conv =>
        conv.id === conversationId ? { ...conv, messages: finalMessages } : conv
      );
      // Use functional update to avoid stale conversations state
      setConversations(prevConversations => {
        const updatedConversations = prevConversations.map(conv =>
          conv.id === conversationId ? { ...conv, messages: finalMessages } : conv
        );
        localStorage.setItem('conversations', JSON.stringify(updatedConversations));
        return updatedConversations;
      });
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const toggleTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark');
  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  return (
    <>
      <style>
        {`
          .messages-container::-webkit-scrollbar {
            display: none;
          }
          .messages-container {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
        `}
      </style>
      <div className={`h-screen overflow-hidden ${theme === 'dark' ? 'bg-black text-white' : 'bg-white text-black'} flex`}>
      {/* Sidebar */}
      <div className={`w-64 ${sidebarOpen ? 'block' : 'hidden'} md:block md:relative absolute inset-y-0 left-0 z-50 ${theme === 'dark' ? 'bg-black border-r border-gray-700' : 'bg-gray-50 border-r border-gray-200'} flex flex-col`}>
        {/* Sidebar Header */}
        <div className={`p-4 border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
          <button
            onClick={createNewConversation}
            className={`w-full flex items-center justify-center gap-2 p-3 rounded-lg ${theme === 'dark' ? 'bg-gray-800 hover:bg-gray-700 text-white' : 'bg-white hover:bg-gray-50 text-gray-900 border border-gray-300'}`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Chat
          </button>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto p-2">
          {conversations.map((conversation) => (
            <div
              key={conversation.id}
              onClick={() => selectConversation(conversation.id)}
              className={`group relative p-3 mb-1 rounded-lg cursor-pointer transition-all ${
                currentConversationId === conversation.id
                  ? theme === 'dark' ? 'bg-gray-800' : 'bg-gray-200'
                  : theme === 'dark' ? 'hover:bg-gray-800' : 'hover:bg-gray-100'
              }`}
            >
              <div className="flex flex-col">
                <p className={`text-sm truncate font-semibold ${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>
                  {conversation.title}
                </p>
                <p className={`text-xs truncate mt-0.5 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                  {conversation.messages.length > 0 ? conversation.messages[conversation.messages.length - 1].content : 'No messages yet'}
                </p>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteConversation(conversation.id);
                  }}
                  className={`opacity-0 group-hover:opacity-100 p-1 rounded transition-all ${theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}`}
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Backdrop for mobile */}
      {sidebarOpen && <div className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className={`p-4 flex items-center justify-between ${theme === 'dark' ? 'bg-black border-b border-gray-700' : 'bg-white border-b border-gray-200'}`}>
          <div className="flex items-center space-x-4">
            <button
              onClick={toggleSidebar}
              className={`p-2 rounded-lg ${theme === 'dark' ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-100 hover:bg-gray-200'}`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div className="flex items-center space-x-2">
              <img src="/favicon.png" alt="AskAi Logo" className="w-8 h-8" />
              <h1 className="text-xl font-semibold">AskAi</h1>
            </div>
          </div>
          <button onClick={toggleTheme} className={`p-2 rounded-lg ${theme === 'dark' ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-100 hover:bg-gray-200'}`}>
            {theme === 'dark' ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            )}
          </button>
        </header>

        {/* Messages Container */}
      <div className="flex-1 px-4 py-4 md:py-8 max-w-full md:max-w-6xl space-y-6 overflow-y-auto" style={{scrollBehavior: 'smooth', scrollbarWidth: 'none', msOverflowStyle: 'none'}}>
          {messages.length === 0 && (
            <div className="text-center py-12">
              <div className="mb-8">
                <svg className="w-16 h-16 mx-auto mb-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
                <h2 className={`text-2xl font-semibold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Welcome to AskAi</h2>
                <p className={`text-lg ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>How can I help you with your code today?</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
                <div className={`p-4 rounded-lg border ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
                  <p className="text-sm font-medium mb-1">💡 Example</p>
                  <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Paste your JavaScript code to get a detailed explanation</p>
                </div>
                <div className={`p-4 rounded-lg border ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
                  <p className="text-sm font-medium mb-1">🔧 Debug</p>
                  <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Share problematic code for debugging assistance</p>
                </div>
              </div>
            </div>
          )}
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-2xl p-4 rounded-2xl ${
                  message.role === "user"
                    ? "bg-blue-600 text-white ml-12"
                    : theme === 'dark' ? "bg-gray-800 text-white mr-12 border border-gray-700" : "bg-white text-gray-900 mr-12 border border-gray-200 shadow-sm"
                }`}
              >
                {message.role === "assistant" ? (
                  <ReactMarkdown
                    components={{
                      code({ node, inline, className, children, ...props }) {
                        return inline ? (
                          <code className={`px-1.5 py-0.5 rounded text-sm font-mono ${theme === 'dark' ? 'bg-gray-700 text-gray-200' : 'bg-gray-100 text-gray-800'}`}>{children}</code>
                        ) : (
                          <pre className={`p-3 rounded-lg overflow-x-auto text-sm font-mono ${theme === 'dark' ? 'bg-gray-800 border border-gray-700' : 'bg-gray-50 border border-gray-200'}`}>
                            <code {...props}>{children}</code>
                          </pre>
                        );
                      },
                      table({ children }) {
                        return (
                          <div className="overflow-x-auto my-4">
                            <table className={`table-auto border-collapse border text-sm ${theme === 'dark' ? 'border-gray-600' : 'border-gray-300'}`}>
                              {children}
                            </table>
                          </div>
                        );
                      },
                      th({ children }) {
                        return <th className={`border px-3 py-2 text-left font-semibold ${theme === 'dark' ? 'border-gray-600 bg-gray-700' : 'border-gray-300 bg-gray-50'}`}>{children}</th>;
                      },
                      td({ children }) {
                        return <td className={`border px-3 py-2 ${theme === 'dark' ? 'border-gray-600' : 'border-gray-300'}`}>{children}</td>;
                      }
                    }}
                  >
                    {message.content}
                  </ReactMarkdown>
                ) : (
                  <div className="whitespace-pre-wrap text-sm">{message.content}</div>
                )}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className={`max-w-2xl p-4 rounded-2xl mr-12 ${theme === 'dark' ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200 shadow-sm'}`}>
                <div className="flex space-x-2">
                  <div className={`w-2 h-2 rounded-full animate-bounce ${theme === 'dark' ? 'bg-gray-400' : 'bg-gray-600'}`}></div>
                  <div className={`w-2 h-2 rounded-full animate-bounce ${theme === 'dark' ? 'bg-gray-400' : 'bg-gray-600'}`} style={{ animationDelay: "0.1s" }}></div>
                  <div className={`w-2 h-2 rounded-full animate-bounce ${theme === 'dark' ? 'bg-gray-400' : 'bg-gray-600'}`} style={{ animationDelay: "0.2s" }}></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        {/* Input Container */}
        <div className={`p-4 ${theme === 'dark' ? 'bg-black border-t border-gray-700' : 'bg-white border-t border-gray-200'}`}>
          <div className="max-w-full md:max-w-6xl">
            <div className="flex space-x-3">
              <div className="flex-1 relative">
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Message AskAi..."
                  className={`w-full border rounded-xl px-4 py-3 pr-12 text-sm resize-none overflow-hidden focus:outline-none focus:ring-2 focus:ring-blue-500 ${theme === 'dark' ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400' : 'bg-gray-100 border-gray-300 text-gray-900 placeholder-gray-500'}`}
                  rows={1}
                />
                <button
                  onClick={handleSend}
                  disabled={loading || !input.trim()}
                  className={`absolute right-2 top-2 p-1.5 rounded-lg transition-all ${
                    loading || !input.trim()
                      ? 'text-gray-400 cursor-not-allowed'
                      : 'text-blue-600 hover:bg-blue-50'
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </button>
              </div>
            </div>
            <p className={`text-xs mt-2 text-center ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
              AskAi can make mistakes. Consider checking important information.
            </p>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}

export default App;

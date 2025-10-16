import React, { useState, useRef, useEffect } from 'react';
import './AIAssistant.css';

const AIAssistant = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [userInput, setUserInput] = useState('');
  const [conversation, setConversation] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [conversationContext, setConversationContext] = useState('');
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [conversation]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [userInput]);

  // Build conversation context from recent messages
  useEffect(() => {
    if (conversation.length > 0) {
      const recentMessages = conversation.slice(-4); // Last 2 exchanges
      const context = recentMessages.map(msg => 
        `${msg.type === 'user' ? 'User' : 'Assistant'}: ${msg.content}`
      ).join('\n');
      setConversationContext(context);
    }
  }, [conversation]);

  const handleInputChange = (e) => {
    setUserInput(e.target.value);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleSendMessage = async () => {
    if (!userInput.trim() || isLoading) return;

    const userMessage = userInput.trim();
    setUserInput('');
    setConversation(prev => [...prev, { type: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      // Enhanced system prompt with electronic voting focus and conversation context
      const systemPrompt = `You are an interactive AI assistant specialized exclusively in South African elections with a focus on ELECTRONIC VOTING systems. 

IMPORTANT CONTEXT ABOUT THE VOTING SYSTEM:
- This is an ELECTRONIC VOTING system, NOT traditional paper ballots
- Voters register with fingerprint biometrics for security
- Voting happens through a digital interface where voters select candidates electronically
- Votes are counted automatically and results are generated in real-time
- The system ensures secure, transparent, and efficient elections

CONVERSATION CONTEXT (last few messages):
${conversationContext}

RESPONSE GUIDELINES:
1. Maintain conversation flow naturally - if user says "yes", "tell me more", "continue", etc., continue from previous context
2. Be interactive and engaging like a human conversation
3. Focus ONLY on South African elections, political parties, voting procedures, recent trends, and historical data
4. Always reference ELECTRONIC VOTING when discussing the voting process
5. Provide comprehensive information about parties, candidates, election procedures, and current political landscape
6. For voting process, explain the electronic system: fingerprint registration → digital ballot → electronic vote casting → automated counting
7. Include recent trends in South African parliament and party developments
8. If asked about non-election topics, politely redirect to South African election topics
9. Be conversational and avoid sounding like a scripted response

Current user question: "${userMessage}"

Provide a helpful, engaging response that continues the conversation naturally.`;

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=AIzaSyD0wOjEHxwtJF2IDzHhsLDFGcfSpCxI84o`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: systemPrompt
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 1024,
          }
        })
      });

      if (!response.ok) {
        throw new Error('API request failed');
      }

      const data = await response.json();
      const aiResponse = data.candidates[0].content.parts[0].text;
      
      setConversation(prev => [...prev, { type: 'assistant', content: aiResponse }]);
    } catch (error) {
      console.error('Error calling Gemini API:', error);
      setConversation(prev => [...prev, { 
        type: 'assistant', 
        content: 'I apologize, but I\'m having trouble connecting right now. Please try again in a moment. I\'m here to help with any questions about South African electronic elections.' 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleRecording = () => {
    // Placeholder for speech-to-text functionality
    setIsRecording(!isRecording);
    if (!isRecording) {
      console.log('Recording started...');
      // In a real implementation, you would start speech recognition here
    } else {
      console.log('Recording stopped...');
      // Stop speech recognition here
    }
  };

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  const clearConversation = () => {
    setConversation([]);
    setConversationContext('');
  };

  // Quick action buttons for common election questions
  const quickQuestions = [
    "How does electronic voting work in South Africa?",
    "Which parties are leading in current elections?",
    "Explain the fingerprint registration process",
    "What's new in South African politics?",
    "How are votes counted electronically?",
    "What security measures protect electronic voting?",
    "Explain the digital ballot process"
  ];

  const handleQuickQuestion = (question) => {
    setUserInput(question);
  };

  return (
    <div className={`ai-assistant ${isExpanded ? 'expanded' : ''}`}>
      {/* Header */}
      <div className="ai-header" onClick={toggleExpand}>
        <div className="ai-title">
          <span className="ai-icon">🤖</span>
          <span>Election AI Assistant</span>
        </div>
        <div className="ai-controls">
          {conversation.length > 0 && (
            <button 
              className="clear-btn" 
              onClick={(e) => {
                e.stopPropagation();
                clearConversation();
              }} 
              title="Clear conversation"
            >
              🗑️
            </button>
          )}
          <button 
            className="expand-btn"
            onClick={(e) => {
              e.stopPropagation();
              toggleExpand();
            }}
          >
            {isExpanded ? '▼' : '▲'}
          </button>
        </div>
      </div>

      {/* Conversation Area */}
      {isExpanded && (
        <div className="conversation-area">
          <div className="messages-container">
            {conversation.length === 0 ? (
              <div className="welcome-message">
                <h4>🇿🇦 South African Election Assistant</h4>
                <p>Ask me anything about electronic voting, political parties, election results, or current political trends in South Africa.</p>
                <div className="suggestions">
                  <h5>Quick Questions:</h5>
                  {quickQuestions.map((question, index) => (
                    <button 
                      key={index}
                      className="suggestion-btn"
                      onClick={() => handleQuickQuestion(question)}
                    >
                      {question}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              conversation.map((message, index) => (
                <div key={index} className={`message ${message.type}`}>
                  <div className="message-content">
                    {message.content.split('\n').map((line, i) => (
                      <p key={i}>{line}</p>
                    ))}
                  </div>
                </div>
              ))
            )}
            {isLoading && (
              <div className="message assistant">
                <div className="message-content">
                  <div className="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="input-area">
            <div className="input-container">
              <textarea
                ref={textareaRef}
                value={userInput}
                onChange={handleInputChange}
                onKeyPress={handleKeyPress}
                placeholder="Ask about South African electronic elections..."
                rows="1"
                className="text-input"
              />
              <div className="input-buttons">
                <button 
                  className={`record-btn ${isRecording ? 'recording' : ''}`}
                  onClick={toggleRecording}
                  title="Voice input"
                >
                  🎤
                </button>
                <button 
                  className="send-btn"
                  onClick={handleSendMessage}
                  disabled={!userInput.trim() || isLoading}
                >
                  {isLoading ? '⏳' : '📤'}
                </button>
              </div>
            </div>
            <div className="disclaimer">
              Specialized in South African Electronic Elections • Context-Aware
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIAssistant;
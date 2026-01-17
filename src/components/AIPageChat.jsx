/**
 * AIPageChat Component
 * Chat panel for AI brainstorming on page design
 */

import React, { useState, useRef, useEffect } from 'react';
import { API_BASE } from '../constants';

const styles = {
  container: {
    background: 'rgba(255, 255, 255, 0.02)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '12px',
    overflow: 'hidden'
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '12px 16px',
    background: 'rgba(99, 102, 241, 0.1)',
    borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
    cursor: 'pointer'
  },
  headerIcon: {
    fontSize: '1.2rem'
  },
  headerTitle: {
    flex: 1,
    fontSize: '0.9rem',
    fontWeight: '600',
    color: '#fff'
  },
  headerToggle: {
    fontSize: '0.8rem',
    color: '#888'
  },
  chatArea: {
    maxHeight: '300px',
    overflowY: 'auto',
    padding: '12px 16px'
  },
  chatAreaHidden: {
    display: 'none'
  },
  messagesContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  message: {
    display: 'flex',
    gap: '10px'
  },
  messageUser: {
    flexDirection: 'row-reverse'
  },
  avatar: {
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '0.9rem',
    flexShrink: 0
  },
  avatarAI: {
    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)'
  },
  avatarUser: {
    background: 'rgba(255, 255, 255, 0.1)'
  },
  messageBubble: {
    maxWidth: '85%',
    padding: '10px 14px',
    borderRadius: '12px',
    fontSize: '0.85rem',
    lineHeight: '1.5'
  },
  messageBubbleAI: {
    background: 'rgba(99, 102, 241, 0.15)',
    color: '#e4e4e4',
    borderBottomLeftRadius: '4px'
  },
  messageBubbleUser: {
    background: 'rgba(255, 255, 255, 0.1)',
    color: '#fff',
    borderBottomRightRadius: '4px'
  },
  suggestions: {
    marginTop: '8px',
    padding: '10px',
    background: 'rgba(16, 185, 129, 0.1)',
    borderRadius: '8px',
    border: '1px solid rgba(16, 185, 129, 0.2)'
  },
  suggestionTitle: {
    fontSize: '0.75rem',
    fontWeight: '600',
    color: '#10b981',
    marginBottom: '8px'
  },
  suggestionItem: {
    fontSize: '0.8rem',
    color: '#e4e4e4',
    marginBottom: '4px',
    paddingLeft: '12px',
    position: 'relative'
  },
  suggestionBullet: {
    position: 'absolute',
    left: 0,
    color: '#10b981'
  },
  actions: {
    display: 'flex',
    gap: '8px',
    marginTop: '12px'
  },
  actionBtn: {
    padding: '6px 12px',
    fontSize: '0.75rem',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    border: 'none'
  },
  applyBtn: {
    background: '#10b981',
    color: '#fff'
  },
  modifyBtn: {
    background: 'rgba(255, 255, 255, 0.1)',
    color: '#fff'
  },
  ignoreBtn: {
    background: 'transparent',
    color: '#888',
    border: '1px solid rgba(255, 255, 255, 0.1)'
  },
  inputArea: {
    display: 'flex',
    gap: '8px',
    padding: '12px 16px',
    borderTop: '1px solid rgba(255, 255, 255, 0.05)'
  },
  input: {
    flex: 1,
    padding: '10px 14px',
    background: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '8px',
    color: '#fff',
    fontSize: '0.9rem',
    outline: 'none'
  },
  sendBtn: {
    padding: '10px 16px',
    background: '#6366f1',
    border: 'none',
    borderRadius: '8px',
    color: '#fff',
    fontSize: '0.85rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  },
  sendBtnDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed'
  },
  loading: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '12px',
    color: '#888',
    fontSize: '0.85rem'
  },
  loadingDots: {
    display: 'flex',
    gap: '4px'
  },
  dot: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    background: '#6366f1',
    animation: 'pulse 1.4s infinite ease-in-out both'
  },
  emptyState: {
    padding: '20px',
    textAlign: 'center',
    color: '#888',
    fontSize: '0.85rem'
  },
  quickPrompts: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
    marginTop: '12px'
  },
  quickPrompt: {
    padding: '6px 12px',
    background: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '20px',
    color: '#aaa',
    fontSize: '0.75rem',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  }
};

export default function AIPageChat({
  pageType,
  pageName,
  businessContext,
  currentSettings,
  onApplySuggestions,
  onCollapse
}) {
  const [expanded, setExpanded] = useState(true);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [pendingSuggestions, setPendingSuggestions] = useState(null);
  const messagesEndRef = useRef(null);

  const quickPrompts = [
    `What layout works best for a ${pageType} page?`,
    'Make it feel more premium',
    'Keep it simple and clean',
    'Add more visual interest',
    'What sections should I include?'
  ];

  useEffect(() => {
    // Scroll to bottom when messages change
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (messageText = input) => {
    if (!messageText.trim() || loading) return;

    const userMessage = messageText.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);
    setPendingSuggestions(null);

    try {
      const response = await fetch(`${API_BASE}/api/ai/page-chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          pageType,
          pageName,
          businessContext,
          currentSettings,
          conversationHistory: messages.slice(-10) // Last 10 messages for context
        })
      });

      const data = await response.json();

      if (data.success) {
        const aiMessage = {
          role: 'assistant',
          content: data.response,
          suggestions: data.suggestions || null
        };
        setMessages(prev => [...prev, aiMessage]);

        if (data.suggestions) {
          setPendingSuggestions(data.suggestions);
        }
      } else {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: "I'm having trouble processing that request. Could you try rephrasing?"
        }]);
      }
    } catch (err) {
      console.error('AI chat error:', err);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "Sorry, I couldn't connect. Please try again."
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleApply = () => {
    if (pendingSuggestions && onApplySuggestions) {
      onApplySuggestions(pendingSuggestions);
      setPendingSuggestions(null);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "Great! I've applied those suggestions. Feel free to tweak anything!"
      }]);
    }
  };

  const handleIgnore = () => {
    setPendingSuggestions(null);
  };

  return (
    <div style={styles.container}>
      <div
        style={styles.header}
        onClick={() => setExpanded(!expanded)}
      >
        <span style={styles.headerIcon}>💬</span>
        <span style={styles.headerTitle}>Chat with AI about this page</span>
        <span style={styles.headerToggle}>{expanded ? '▼' : '▶'}</span>
      </div>

      <div style={expanded ? styles.chatArea : styles.chatAreaHidden}>
        {messages.length === 0 ? (
          <div style={styles.emptyState}>
            <p>Ask me anything about designing this page!</p>
            <div style={styles.quickPrompts}>
              {quickPrompts.map((prompt, idx) => (
                <button
                  key={idx}
                  style={styles.quickPrompt}
                  onClick={() => sendMessage(prompt)}
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div style={styles.messagesContainer}>
            {messages.map((msg, idx) => (
              <div
                key={idx}
                style={{
                  ...styles.message,
                  ...(msg.role === 'user' ? styles.messageUser : {})
                }}
              >
                <div style={{
                  ...styles.avatar,
                  ...(msg.role === 'assistant' ? styles.avatarAI : styles.avatarUser)
                }}>
                  {msg.role === 'assistant' ? '🤖' : '👤'}
                </div>
                <div>
                  <div style={{
                    ...styles.messageBubble,
                    ...(msg.role === 'assistant' ? styles.messageBubbleAI : styles.messageBubbleUser)
                  }}>
                    {msg.content}
                  </div>

                  {msg.suggestions && pendingSuggestions && (
                    <div style={styles.suggestions}>
                      <div style={styles.suggestionTitle}>Suggestions:</div>
                      {msg.suggestions.layout && (
                        <div style={styles.suggestionItem}>
                          <span style={styles.suggestionBullet}>•</span>
                          Layout: {msg.suggestions.layout}
                        </div>
                      )}
                      {msg.suggestions.style && (
                        <div style={styles.suggestionItem}>
                          <span style={styles.suggestionBullet}>•</span>
                          Style: {msg.suggestions.style}
                        </div>
                      )}
                      {msg.suggestions.sections && (
                        <div style={styles.suggestionItem}>
                          <span style={styles.suggestionBullet}>•</span>
                          Sections: {msg.suggestions.sections.join(', ')}
                        </div>
                      )}
                      {msg.suggestions.colors && (
                        <div style={styles.suggestionItem}>
                          <span style={styles.suggestionBullet}>•</span>
                          Colors: {msg.suggestions.colors.primary} / {msg.suggestions.colors.accent}
                        </div>
                      )}
                      <div style={styles.actions}>
                        <button style={{...styles.actionBtn, ...styles.applyBtn}} onClick={handleApply}>
                          Apply Suggestions
                        </button>
                        <button style={{...styles.actionBtn, ...styles.modifyBtn}} onClick={() => setInput('Modify: ')}>
                          Modify
                        </button>
                        <button style={{...styles.actionBtn, ...styles.ignoreBtn}} onClick={handleIgnore}>
                          Ignore
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div style={styles.loading}>
                <div style={styles.loadingDots}>
                  <div style={{...styles.dot, animationDelay: '0s'}} />
                  <div style={{...styles.dot, animationDelay: '0.2s'}} />
                  <div style={{...styles.dot, animationDelay: '0.4s'}} />
                </div>
                AI is thinking...
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {expanded && (
        <div style={styles.inputArea}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Describe how you want this page to look..."
            style={styles.input}
            disabled={loading}
          />
          <button
            onClick={() => sendMessage()}
            disabled={!input.trim() || loading}
            style={{
              ...styles.sendBtn,
              ...(!input.trim() || loading ? styles.sendBtnDisabled : {})
            }}
          >
            Send
          </button>
        </div>
      )}
    </div>
  );
}

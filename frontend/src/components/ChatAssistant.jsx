import React, { useState, useEffect, useRef } from 'react';

export default function ChatAssistant({ token, user }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => { fetchChatHistory(); }, []);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const fetchChatHistory = async () => {
    try {
      const res = await fetch('/api/chats', { headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) setMessages(await res.json());
    } catch (err) { console.error(err); }
  };

  const handleSendMessage = async () => {
    if (!input.trim()) return;
    const msg = input;
    setInput('');
    setMessages(prev => [...prev, { sender: 'user', message: msg }]);
    setLoading(true);
    try {
      const res = await fetch('/api/chats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ message: msg })
      });
      const data = await res.json();
      setMessages(prev => [...prev, { sender: 'ai', message: data.aiMessage }]);
    } catch (err) { alert(err.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="chat-container">
      <div className="chat-history">
        {messages.map((m, i) => <div key={i} className={`chat-bubble ${m.sender === 'user' ? 'user' : 'ai'}`} style={{ alignSelf: m.sender === 'user' ? 'flex-end' : 'flex-start' }}>{m.message}</div>)}
        <div ref={messagesEndRef} />
      </div>
      <div className="chat-input-area">
        <input className="form-input" value={input} onChange={e => setInput(e.target.value)} placeholder="Ask coach..." />
        <button className="btn btn-primary" onClick={handleSendMessage}>Send</button>
      </div>
    </div>
  );
}

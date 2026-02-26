import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import { Send, User, Calendar, MessageSquare, Heart, Home, Sparkles } from 'lucide-react';

const API_BASE_URL = '';

function App() {
  const [notes, setNotes] = useState([]);
  const [newNote, setNewNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchNotes = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/notes`);
      if (Array.isArray(response.data)) {
        setNotes(response.data);
        setError(null);
      } else {
        console.error('Received non-array data:', response.data);
        setError('Hmm, the family wall sent back something strange.');
      }
    } catch (err) {
      console.error('Error fetching notes:', err);
      setError('Oops! We couldn\'t reach the family wall. Check your connection?');
    }
  };

  useEffect(() => {
    fetchNotes();
    const interval = setInterval(fetchNotes, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newNote.trim()) return;

    setLoading(true);
    try {
      await axios.post(`${API_BASE_URL}/notes`, {
        content: newNote,
        author: 'Guest'
      });
      setNewNote('');
      fetchNotes();
      setError(null);
    } catch (err) {
      console.error('Error posting note:', err);
      setError('Oh no! Something went wrong while saving your note.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;

    return date.toLocaleString([], {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="container">
      <header className="header">
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: '#D97706', marginBottom: '8px' }}>
          <Home size={32} />
          <Sparkles size={20} />
        </div>
        <h1>Family Notes</h1>
        <p>A little corner for our thoughts and love.</p>
      </header>

      {error && (
        <div style={{
          background: '#FFF1F2',
          color: '#E11D48',
          padding: '1.2rem',
          borderRadius: '20px',
          marginBottom: '2rem',
          border: '2px solid #FFE4E6',
          textAlign: 'center',
          fontWeight: '600',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px'
        }}>
          <MessageSquare size={18} />
          {error}
        </div>
      )}

      <form className="input-card" onSubmit={handleSubmit}>
        <textarea
          placeholder="Share something sweet, helpful, or just a hello! (Markdown supported ✨)"
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          disabled={loading}
        />
        <div className="button-row">
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading || !newNote.trim()}
          >
            {loading ? 'Sending with love...' : (
              <>
                <Heart size={18} />
                Post to Wall
              </>
            )}
          </button>
        </div>
      </form>

      <div className="notes-list">
        {notes.length === 0 && !loading && !error && (
          <div style={{
            textAlign: 'center',
            padding: '4rem 2rem',
            color: '#9CA3AF',
            background: 'white',
            borderRadius: '24px',
            boxShadow: '0 4px 6px rgba(0,0,0,0.02)'
          }}>
            <MessageSquare size={48} style={{ margin: '0 auto 1.5rem', opacity: 0.2, color: '#D97706' }} />
            <p style={{ fontSize: '1.2rem', fontWeight: '500' }}>The wall is waiting for your first note!</p>
            <p style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>Write something joyous above.</p>
          </div>
        )}

        {Array.isArray(notes) && notes.map((note) => (
          <div key={note.id} className="note-card">
            <div className="note-header">
              <div className="note-author">
                <User size={16} style={{ marginRight: '6px', verticalAlign: 'middle', color: '#059669' }} />
                {note.author}
              </div>
              <div className="note-date">
                <Calendar size={14} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
                {formatDate(note.timestamp)}
              </div>
            </div>
            <div className="note-content">
              <ReactMarkdown>{note.content}</ReactMarkdown>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import { Send, User, Calendar, MessageSquare } from 'lucide-react';

const API_BASE_URL = '';

function App() {
  const [notes, setNotes] = useState([]);
  const [newNote, setNewNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchNotes = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/notes`);
      setNotes(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching notes:', err);
      setError('Could not connect to the backend server.');
    }
  };

  useEffect(() => {
    fetchNotes();
    // Refresh every 30 seconds
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
        author: 'Guest' // Backend will override with header if present
      });
      setNewNote('');
      fetchNotes();
      setError(null);
    } catch (err) {
      console.error('Error posting note:', err);
      setError('Could not post your note. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString([], {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="container">
      <header className="header">
        <h1>Family Notes</h1>
        <p>The shared "Global Wall" for everyone.</p>
      </header>

      {error && (
        <div style={{
          background: '#fee2e2',
          color: '#b91c1c',
          padding: '1rem',
          borderRadius: '8px',
          marginBottom: '1rem',
          border: '1px solid #fecaca'
        }}>
          {error}
        </div>
      )}

      <form className="input-card" onSubmit={handleSubmit}>
        <textarea
          placeholder="Type a note (Markdown supported!)..."
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
            {loading ? 'Sending...' : (
              <>
                <Send size={18} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
                Post Note
              </>
            )}
          </button>
        </div>
      </form>

      <div className="notes-list">
        {notes.length === 0 && !loading && !error && (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
            <MessageSquare size={48} style={{ margin: '0 auto 1rem', opacity: 0.3 }} />
            <p>No notes yet. Be the first to post!</p>
          </div>
        )}

        {notes.map((note) => (
          <div key={note.id} className="note-card">
            <div className="note-header">
              <div className="note-author">
                <User size={14} style={{ marginRight: '4px', verticalAlign: 'text-bottom' }} />
                {note.author}
              </div>
              <div className="note-date">
                <Calendar size={14} style={{ marginRight: '4px', verticalAlign: 'text-bottom' }} />
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

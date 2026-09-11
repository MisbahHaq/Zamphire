import { useState } from 'react';
import { replySupport, markRead, formatDate } from '../../store';
import { useData } from '../../context/DataContext';

export default function Support({ mode = 'all' }) {
  const [selected, setSelected] = useState(null);
  const [reply, setReply] = useState('');
  const { support } = useData();
  const allTickets = support;
  const tickets = allTickets.filter((t) => {
    if (mode === 'unread') return !t.read;
    if (mode === 'cancellations') return /cancel|order/i.test(t.subject);
    return true;
  });

  const open = tickets.find((t) => t.id === selected);
  const thread = open
    ? [
        { fromAdmin: false, message: open.message, date: open.createdAt },
        ...(open.adminResponse ? [{ fromAdmin: true, message: open.adminResponse, date: open.updatedAt }] : [])
      ]
    : [];

  const send = async (e) => {
    e.preventDefault();
    if (!reply.trim() || !open) return;
    await replySupport(open.id, reply.trim());
    setReply('');
  };

  const select = async (t) => {
    setSelected(t.id);
    if (!t.isRead) await markRead(t.id);
  };

  return (
    <div className="admin-support">
      <h1 className="admin-page-title">Support</h1>
      <div className="admin-support-grid">
        <div className="admin-support-list">
          {tickets.map((t) => (
            <button key={t.id} className={'admin-ticket' + (selected === t.id ? ' active' : '')} onClick={() => select(t)}>
              <div className="d-flex justify-content-between">
                <strong>{t.subject}</strong>
                {!t.read && <span className="admin-unread-dot"></span>}
              </div>
              <div className="text-caption">{t.email}</div>
              <div className="text-caption">{formatDate(t.date)}</div>
            </button>
          ))}
          {tickets.length === 0 && <p className="text-caption">No support requests.</p>}
        </div>
        <div className="admin-support-thread">
          {open ? (
            <>
              <h3 className="admin-section-title">{open.subject}</h3>
              <div className="admin-thread-messages">
                {thread.map((m, i) => (
                  <div key={i} className={'admin-msg' + (m.fromAdmin ? ' admin' : '')}>
                    <div className="admin-msg-meta">{m.fromAdmin ? 'Admin' : open.email} • {formatDate(m.date)}</div>
                    <div>{m.message}</div>
                  </div>
                ))}
              </div>
              <form onSubmit={send} className="admin-reply-box">
                <textarea value={reply} onChange={(e) => setReply(e.target.value)} placeholder="Type a reply..." rows={3} />
                <button type="submit" className="auth-submit" aria-label="Send reply"><i className="bi bi-send"></i></button>
              </form>
            </>
          ) : <p className="text-caption">Select a ticket.</p>}
        </div>
      </div>
    </div>
  );
}

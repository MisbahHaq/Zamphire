import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { createSupport, repliesFor } from '../store';

const REPLY_KEY = 'chatbotDisplayedReplyIds';

export default function Chatbot() {
  const { user } = useAuth();
  const { orders, support } = useData();

  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState('');
  const [messages, setMessages] = useState([
    { text: 'Hi, I can check order status, send a cancellation request to admin, or notify admin to chat.', sender: 'bot' }
  ]);
  const messagesRef = useRef(null);

  const addMessage = (text, sender) => setMessages((m) => [...m, { text, sender }]);

  const orderById = (num) => orders.find((o) => String(o.id) === String(num));

  const showMode = (m) => {
    setMode(m);
    const prompt = m === 'status'
      ? 'Enter the order number and I will check its status.'
      : m === 'cancel'
        ? 'Enter the order number and cancellation reason. Admin will review it.'
        : 'Enter your details and message. Admin will be notified.';
    addMessage(prompt, 'bot');
  };

  const requireLogin = () => {
    if (user) return true;
    addMessage('You need to sign in first. Please open the account menu to log in.', 'bot');
    return false;
  };

  const fetchReplies = (force) => {
    if (!user) return;
    const seen = (localStorage.getItem(REPLY_KEY) || '').split(',').filter(Boolean);
    repliesFor(support, user.email).forEach((reply) => {
      if (seen.indexOf(String(reply.id)) !== -1) return;
      if (!force && reply.updatedAt && reply.updatedAt.seconds) {
        const lastKnown = Number(localStorage.getItem('chatbotLastReply') || 0);
        const replyTime = reply.updatedAt.seconds * 1000;
        if (lastKnown && replyTime <= lastKnown) return;
      }
      seen.push(String(reply.id));
      const label = reply.requestType === 'Cancellation' ? 'cancellation request' : 'support request';
      addMessage('Admin reply to your ' + label + ': ' + reply.adminResponse, 'bot');
      if (reply.status === 'Resolved') addMessage('Your ' + label + ' has been resolved.', 'bot');
    });
    if (seen.length) localStorage.setItem(REPLY_KEY, seen.join(','));
  };

  useEffect(() => {
    if (open) fetchReplies(true);
    const t = setInterval(fetchReplies, 10000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, support, user]);

  useEffect(() => {
    if (messagesRef.current) messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
  }, [messages]);

  const onStatus = (e) => {
    e.preventDefault();
    const num = e.target.order.value.trim();
    if (!num) return addMessage('Please enter an order number.', 'bot');
    addMessage('Order #' + num, 'user');
    const o = orderById(num);
    if (!o) return addMessage('No order found with that number.', 'bot');
    addMessage('Order #' + o.id + ' is currently: ' + o.status + '.', 'bot');
  };

  const onCancel = (e) => {
    e.preventDefault();
    const num = e.target.order.value.trim();
    const reason = e.target.reason.value.trim();
    if (!num || !reason) return addMessage('Please enter both order number and cancellation reason.', 'bot');
    addMessage('Cancel order #' + num + ': ' + reason, 'user');
    const o = orderById(num);
    if (!o) return addMessage('No order found with that number.', 'bot');
    if (o.userEmail !== user.email) return addMessage('That order does not belong to your account.', 'bot');
    if (o.status === 'Cancelled') return addMessage('That order is already cancelled.', 'bot');
    if (o.status === 'Delivered') return addMessage('That order has already been delivered and cannot be cancelled.', 'bot');
    createSupport({ requestType: 'Cancellation', orderId: o.id, customerName: user.name, customerEmail: user.email, message: 'Cancellation requested for order #' + o.id + '. Reason: ' + reason, reason });
    addMessage('Cancellation request sent to admin. It will be reviewed shortly.', 'bot');
  };

  const onAdmin = (e) => {
    e.preventDefault();
    const message = e.target.message.value.trim();
    if (!message) return addMessage('Please enter a message for admin.', 'bot');
    addMessage(message, 'user');
    const orderNumber = e.target.order.value.trim();
    const orderId = orderNumber ? (orderById(orderNumber)?.id || null) : null;
    createSupport({ requestType: 'AdminChat', orderId, customerName: user.name, customerEmail: user.email, message });
    addMessage('Your message has been sent to admin. Replies will appear here.', 'bot');
  };

  return (
    <div className="chatbot-widget">
      <div className={`chatbot-panel ${open ? 'open' : ''}`} aria-hidden={!open}>
        <div className="chatbot-header">
          <strong>Represent Assistant</strong>
          <button type="button" className="chatbot-close" aria-label="Close chatbot" onClick={() => setOpen(false)}>×</button>
        </div>
        <div className="chatbot-messages" ref={messagesRef}>
          {messages.map((m, i) => (
            <div key={i} className={`chatbot-message ${m.sender}`}>{m.text}</div>
          ))}
        </div>
        <div className="chatbot-actions">
          <button type="button" className="chatbot-action" onClick={() => showMode('status')}>Order Status</button>
          <button type="button" className="chatbot-action" onClick={() => { if (requireLogin()) showMode('cancel'); }}>Cancel Order</button>
          <button type="button" className="chatbot-action" onClick={() => { if (requireLogin()) showMode('admin'); }}>Chat With Admin</button>
        </div>
        <form id="chatbotStatusForm" className={`chatbot-context-form ${mode === 'status' ? 'open' : ''}`} onSubmit={onStatus}>
          <input name="order" type="text" placeholder="Order number, e.g. 12" autoComplete="off" />
          <button type="submit" className="chatbot-submit">Check Status</button>
        </form>
        <form id="chatbotCancelForm" className={`chatbot-context-form ${mode === 'cancel' ? 'open' : ''}`} onSubmit={onCancel}>
          <input name="order" type="text" placeholder="Order number, e.g. 12" autoComplete="off" />
          <textarea name="reason" placeholder="Cancellation reason"></textarea>
          <button type="submit" className="chatbot-submit">Send Cancellation Request</button>
        </form>
        <form id="chatbotAdminForm" className={`chatbot-context-form ${mode === 'admin' ? 'open' : ''}`} onSubmit={onAdmin}>
          <input name="name" type="text" placeholder="Your name" autoComplete="name" defaultValue={user ? user.name : ''} />
          <input name="email" type="email" placeholder="Email" autoComplete="email" defaultValue={user ? user.email : ''} />
          <input name="order" type="text" placeholder="Order number, optional" autoComplete="off" />
          <textarea name="message" placeholder="Message for admin"></textarea>
          <button type="submit" className="chatbot-submit">Notify Admin</button>
        </form>
      </div>
      <button type="button" className="chatbot-toggle" aria-label="Open chatbot" onClick={() => setOpen(!open)}>{open ? 'Close' : 'Chat'}</button>
    </div>
  );
}

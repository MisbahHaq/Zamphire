import { Link } from 'react-router-dom';

export default function Vault() {
  return (
    <div className="vault-page">
      <img className="bg" src="/assets/vault.png" alt="" />
      <div className="content">
        <h1>The Vault</h1>
        <div className="divider-line"></div>
        <p style={{ maxWidth: 520, color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem', lineHeight: 1.8 }}>
          A members-only archive of rare, limited-run pieces. New drops are released in small batches and never restocked.
        </p>
        <Link className="btn-vault" to="/">Back to Store</Link>
      </div>
    </div>
  );
}

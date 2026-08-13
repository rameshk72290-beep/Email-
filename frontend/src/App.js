import "@fontsource/space-grotesk/500.css";
import "@fontsource/space-grotesk/700.css";
import "@fontsource/ibm-plex-mono/400.css";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Toaster, toast } from "sonner";
import { ArrowUpRight, Check, ChevronDown, Inbox, Link2, LockKeyhole, LogOut, Mail, Plus, RefreshCw, Search, ShieldCheck, Trash2, Unplug, X } from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const authHeaders = (token) => ({ headers: { Authorization: `Bearer ${token}` } });

function Stat({ label, value, accent }) { return <div data-testid={`stat-${label.toLowerCase()}`} className="stat"><span>{label}</span><strong className={accent}>{value}</strong></div>; }

export default function App() {
  const [accounts, setAccounts] = useState([]);
  const [emails, setEmails] = useState([]);
  const [adminToken, setAdminToken] = useState(localStorage.getItem("owner_token"));
  const [loginOpen, setLoginOpen] = useState(false);
  const [login, setLogin] = useState({ username: "", password: "" });
  const [filter, setFilter] = useState({ account: "all", category: "All", search: "" });
  const [selected, setSelected] = useState([]);
  const [busy, setBusy] = useState(false);

  const loadAccounts = useCallback(async () => { try { setAccounts((await axios.get(`${API}/accounts`)).data); } catch { toast.error("Could not load Gmail accounts"); } }, []);
  const loadEmails = useCallback(async () => {
    if (!adminToken) return;
    try { const params = new URLSearchParams(filter); setEmails((await axios.get(`${API}/emails?${params}`, authHeaders(adminToken))).data); } catch (error) { if (error.response?.status === 401) logout(); }
  }, [adminToken, filter]);
  const refreshLive = useCallback(async () => {
    setBusy(true);
    try {
      const { data } = await axios.post(`${API}/accounts/refresh`);
      await loadAccounts();
      if (adminToken) await loadEmails();
      toast.success(data.count ? `Synced ${data.count} mailbox${data.count === 1 ? "" : "es"} live` : "No mailboxes connected yet");
    } catch { toast.error("Live refresh failed"); }
    finally { setBusy(false); }
  }, [adminToken, loadAccounts, loadEmails]);
  useEffect(() => { loadAccounts(); }, [loadAccounts]);
  useEffect(() => { loadEmails(); }, [loadEmails]);
  useEffect(() => { const query = new URLSearchParams(window.location.search); if (query.get("oauth") === "success") toast.success(`${query.get("email")} connected`); if (query.get("oauth") === "duplicate") toast.info(`${query.get("email")} is already connected`); if (query.has("oauth")) window.history.replaceState({}, "", window.location.pathname); }, []);

  function logout() { localStorage.removeItem("owner_token"); setAdminToken(null); setSelected([]); setEmails([]); toast.success("Owner session ended"); }
  async function startOAuth() { try { const { data } = await axios.get(`${API}/oauth/gmail/start`); window.location.href = data.authorization_url; } catch { toast.error("Google OAuth is not configured yet"); } }
  async function submitLogin(event) { event.preventDefault(); try { const { data } = await axios.post(`${API}/admin/login`, login); localStorage.setItem("owner_token", data.token); setAdminToken(data.token); setLoginOpen(false); setLogin({ username: "", password: "" }); toast.success("Owner panel unlocked"); } catch { toast.error("Invalid owner credentials"); } }
  function toggle(id) { setSelected((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]); }
  async function moveToTrash() { if (!selected.length) return toast.info("Select emails first"); setBusy(true); try { const { data } = await axios.post(`${API}/emails/trash`, { email_ids: selected }, authHeaders(adminToken)); toast.success(data.message); setSelected([]); loadEmails(); loadAccounts(); } catch { toast.error("Could not move emails to Trash"); } finally { setBusy(false); } }
  async function unlink(account) { if (!window.confirm(`Disconnect ${account.email}?`)) return; try { await axios.delete(`${API}/accounts/${account.id}`, authHeaders(adminToken)); toast.success("Gmail account disconnected"); loadAccounts(); } catch { toast.error("Owner permission is required"); } }
  const totalUnread = accounts.reduce((sum, item) => sum + item.unread_count, 0);
  const visibleEmails = useMemo(() => emails.filter((item) => item.subject.toLowerCase().includes(filter.search.toLowerCase()) || item.sender_email.toLowerCase().includes(filter.search.toLowerCase())), [emails, filter.search]);

  return <div className="app-shell"><Toaster position="top-right" richColors />
    <header className="topbar"><div className="brand"><div className="brand-mark">M</div><div><div className="brand-name">Mailroom <span>CONTROL</span></div><div className="brand-sub">Multi-account Gmail workspace</div></div></div><div className="top-actions"><div className="security-label"><ShieldCheck size={15} /> OAuth secured</div>{adminToken ? <button data-testid="owner-logout-button" className="ghost-button" onClick={logout}><LogOut size={16} /> Owner active</button> : <button data-testid="owner-login-button" className="dark-button" onClick={() => setLoginOpen(true)}><LockKeyhole size={16} /> Owner login</button>}</div></header>
    <main className="main-content"><section className="hero"><div><p className="eyebrow">COMMAND CENTER / {accounts.length.toString().padStart(2, "0")} MAILBOXES</p><h1>One calm view<br /><em>for every inbox.</em></h1><p className="hero-copy">Connect your Gmail accounts, see each mailbox at a glance, and let the owner keep unwanted mail moving.</p></div><div className="hero-stats"><Stat label="Connected" value={accounts.length} accent="blue" /><Stat label="Unread" value={totalUnread} accent="amber" /><Stat label="Owner mode" value={adminToken ? "ON" : "OFF"} accent="green" /></div></section>
      <section className="section-block"><div className="section-heading"><div><p className="eyebrow">01 / CONNECTED MAILBOXES</p><h2>Account slots</h2></div><div className="heading-actions"><button data-testid="refresh-accounts-button" className="ghost-button" onClick={refreshLive} disabled={busy}><RefreshCw size={16} className={busy ? "spin" : ""} /> {busy ? "Syncing…" : "Refresh live"}</button><button data-testid="add-gmail-button" className="dark-button" onClick={startOAuth}><Plus size={17} /> Add Gmail <ArrowUpRight size={15} /></button></div></div><div className="account-grid">{accounts.map((account) => <article data-testid={`account-card-${account.email}`} className="account-card" key={account.id}><div className="account-top"><div className="gmail-avatar">{account.email[0].toUpperCase()}</div><div className="account-identity"><strong>{account.name}</strong><span>{account.email}</span></div><button data-testid={`disconnect-${account.email}`} className="icon-button" title="Disconnect account" onClick={() => unlink(account)}><Unplug size={16} /></button></div><div className="account-line"><span><i className="status-dot" /> Connected</span><span>{new Date(account.linked_at).toLocaleDateString()}</span></div><div className="account-stats"><Stat label="Unread" value={account.unread_count} accent="blue" /><Stat label="Spam" value={account.spam_count} accent="amber" /><Stat label="Messages" value={account.total_emails || "—"} accent="dark" /></div></article>)}<button data-testid="add-gmail-card" className="add-card" onClick={startOAuth}><span><Plus size={20} /></span><strong>Connect another mailbox</strong><small>Choose a Google account to create a new slot</small></button></div></section>
      <section className="section-block cleanup-section"><div className="section-heading"><div><p className="eyebrow">02 / OWNER CLEANUP</p><h2>Inbox review</h2></div>{adminToken ? <button data-testid="trash-selected-button" className="amber-button" disabled={busy || !selected.length} onClick={moveToTrash}><Trash2 size={16} /> Move {selected.length || "selected"} to Trash</button> : <button data-testid="unlock-cleanup-button" className="outline-button" onClick={() => setLoginOpen(true)}><LockKeyhole size={16} /> Unlock owner controls</button>}</div>{adminToken ? <div className="inbox-panel"><div className="filter-bar"><div className="search-wrap"><Search size={16} /><input data-testid="email-search-input" value={filter.search} onChange={(event) => setFilter({ ...filter, search: event.target.value })} placeholder="Search sender or subject" /></div><select data-testid="account-filter" value={filter.account} onChange={(event) => setFilter({ ...filter, account: event.target.value })}><option value="all">All accounts</option>{accounts.map((account) => <option key={account.email} value={account.email}>{account.email}</option>)}</select><select data-testid="category-filter" value={filter.category} onChange={(event) => setFilter({ ...filter, category: event.target.value })}><option>All</option><option>Spam</option><option>Primary</option><option>Promotions</option></select><button data-testid="refresh-inbox-button" className="icon-button" onClick={refreshLive} title="Refresh live from Gmail"><RefreshCw size={16} className={busy ? "spin" : ""} /></button></div>{visibleEmails.length ? <div className="email-list">{visibleEmails.map((email) => <label data-testid={`email-row-${email.id}`} className={`email-row ${selected.includes(email.account_email + "::" + email.id) ? "selected" : ""}`} key={`${email.account_email}-${email.id}`}><input data-testid={`email-checkbox-${email.id}`} type="checkbox" checked={selected.includes(email.account_email + "::" + email.id)} onChange={() => toggle(email.account_email + "::" + email.id)} /><div className="email-icon"><Mail size={16} /></div><div className="email-main"><strong>{email.subject}</strong><span>{email.sender} · {email.sender_email}</span><p>{email.snippet}</p></div><div className={`mail-label ${email.is_spam ? "spam" : "primary"}`}>{email.category}</div></label>)}</div> : <div className="empty-state"><Inbox size={24} /><strong>No messages in this view</strong><span>Connect a mailbox or adjust your filters.</span></div>}</div> : <div className="locked-panel"><div className="lock-icon"><LockKeyhole size={22} /></div><div><strong>Owner permission required</strong><p>Sign in to read connected inboxes and move selected messages to Trash.</p></div></div>}</section>
    </main><footer><span>MAILROOM / PRIVATE WORKSPACE</span><span>Gmail API · Least privilege access</span></footer>
    {loginOpen && <div className="modal-backdrop" onMouseDown={() => setLoginOpen(false)}><div className="login-modal" onMouseDown={(event) => event.stopPropagation()}><button data-testid="close-login-button" className="modal-close" onClick={() => setLoginOpen(false)}><X size={18} /></button><p className="eyebrow">OWNER ACCESS</p><h2>Open the control room.</h2><p className="modal-copy">Only the owner can review messages or move mail to Trash.</p><form onSubmit={submitLogin}><label>Username<input data-testid="owner-username-input" value={login.username} onChange={(event) => setLogin({ ...login, username: event.target.value })} required /></label><label>Password<input data-testid="owner-password-input" type="password" value={login.password} onChange={(event) => setLogin({ ...login, password: event.target.value })} required /></label><button data-testid="owner-submit-button" className="dark-button full-button" type="submit"><LockKeyhole size={16} /> Unlock workspace</button></form></div></div>}
  </div>;
}
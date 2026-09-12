import React, { useState, useEffect, useMemo } from 'react';
import { Search, Wallet, ArrowDownCircle, ArrowUpCircle, XCircle } from 'lucide-react';
import { useSettlements } from '../hooks/useSettlements';
import { useAuth } from '../context/AuthContext';
import { useCityFilter } from '../context/CityContext';
import { useAutoRefresh } from '../hooks/useAutoRefresh';
import { Badge } from '../components/common/Badge';
import Modal from '../components/common/Modal';
import api from '../services/api';
import { formatAmount } from '../utils/format';

const fmt = (n) => formatAmount(n);
const ITEMS_PER_PAGE = 10;

const STATUS_BADGE = { unsettled: 'warning', settled: 'success', voided: 'danger' };

export default function Settlements() {
  const { showToast } = useAuth();
  const { fetchList } = useSettlements();
  const { cityParam } = useCityFilter();
  const [search, setSearch] = useState('');
  const [partners, setPartners] = useState([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [page, setPage] = useState(1);

  const [selected, setSelected] = useState(null);
  const [ledger, setLedger] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const [settleType, setSettleType] = useState('payout');
  const [settleAmount, setSettleAmount] = useState('');
  const [settleMethod, setSettleMethod] = useState('');
  const [settleNote, setSettleNote] = useState('');
  const [settling, setSettling] = useState(false);

  const loadPartners = (silent = false) => {
    if (!silent) setPageLoading(true);
    const params = cityParam ? { cityIds: cityParam, limit: 1000 } : { limit: 1000 };
    fetchList(params).then(res => {
      if (res.ok) setPartners(res.data?.data ?? []);
      setPageLoading(false);
    });
  };

  useEffect(() => { loadPartners(); }, [cityParam]);
  useAutoRefresh(() => loadPartners(true));

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return partners.filter(p =>
      !q || (p.name ?? '').toLowerCase().includes(q) || (p.phone ?? '').includes(q)
    );
  }, [partners, search]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const pageData = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const stats = {
    owedToPartners: partners.reduce((s, p) => s + Math.max(0, p.walletBalance), 0),
    owedByPartners: partners.reduce((s, p) => s + Math.max(0, -p.walletBalance), 0),
    partnersWithDues: partners.filter(p => p.walletBalance !== 0).length,
  };

  const openDetail = async (p) => {
    setSelected(p);
    setLedger(null);
    setSettleAmount('');
    setSettleMethod('');
    setSettleNote('');
    setDetailLoading(true);
    try {
      const res = await api.get(`/api/v1/admin/settlements/partners/${p.id}`);
      const data = res.data?.data;
      setLedger(data);
      setSettleType((data?.partner?.walletBalance ?? 0) >= 0 ? 'payout' : 'collection');
    } catch (err) {
      showToast(err.response?.data?.message ?? 'Failed to load partner ledger.', 'danger');
    }
    setDetailLoading(false);
  };

  const closeDetail = () => { setSelected(null); setLedger(null); };

  const handleSettle = async () => {
    const amount = parseFloat(settleAmount);
    const balance = ledger?.partner?.walletBalance ?? 0;
    const maxAmount = settleType === 'payout' ? Math.max(0, balance) : Math.max(0, -balance);
    if (!amount || amount <= 0) { showToast('Enter a valid amount.', 'warning'); return; }
    if (amount > maxAmount) { showToast(`Amount cannot exceed ₹${fmt(maxAmount)}.`, 'warning'); return; }

    setSettling(true);
    try {
      await api.post(`/api/v1/admin/settlements/partners/${selected.id}/settle`, {
        type: settleType, amount, method: settleMethod || undefined, note: settleNote || undefined,
      });
      showToast('Settlement recorded successfully.', 'success');
      setSettleAmount(''); setSettleMethod(''); setSettleNote('');
      await openDetail(selected);
      loadPartners();
    } catch (err) {
      showToast(err.response?.data?.message ?? 'Failed to record settlement.', 'danger');
    }
    setSettling(false);
  };

  const handleVoid = async (entryId) => {
    const reason = window.prompt('Reason for voiding this entry (optional):') ?? '';
    try {
      await api.patch(`/api/v1/admin/settlements/entries/${entryId}/void`, { reason });
      showToast('Ledger entry voided.', 'success');
      await openDetail(selected);
      loadPartners();
    } catch (err) {
      showToast(err.response?.data?.message ?? 'Failed to void entry.', 'danger');
    }
  };

  const balance = ledger?.partner?.walletBalance ?? 0;

  return (
    <div>
      <div className="stats-grid stats-grid-3" style={{ marginBottom: 24 }}>
        <div className="stat-card">
          <div className="stat-label">Admin Owes Partners</div>
          <div className="stat-value" style={{ color: '#22C55E' }}>₹{fmt(stats.owedToPartners)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Partners Owe Admin</div>
          <div className="stat-value" style={{ color: '#EF4444' }}>₹{fmt(stats.owedByPartners)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Partners With Dues</div>
          <div className="stat-value" style={{ color: '#064081' }}>{stats.partnersWithDues}</div>
        </div>
      </div>

      <div className="card">
        <div className="filters-bar">
          <div className="search-input-wrap">
            <Search size={16} />
            <input className="search-input" placeholder="Search by partner name or phone…" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
          </div>
        </div>

        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Partner</th>
                <th>City</th>
                <th>Lifetime Earnings</th>
                <th>Balance</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pageLoading ? (
                <tr><td colSpan={6} className="table-empty"><p>Loading…</p></td></tr>
              ) : pageData.length === 0 ? (
                <tr><td colSpan={6} className="table-empty">
                  <Search size={32} style={{ color: 'var(--c-text-muted)', display: 'block', margin: '0 auto 8px' }} />
                  <p>No partners match your search.</p>
                </td></tr>
              ) : pageData.map(p => (
                <tr key={p.id}>
                  <td>
                    <div className="table-cell-main">{p.name}</div>
                    <div className="table-cell-sub">{p.phone}</div>
                  </td>
                  <td>{p.city || '—'}</td>
                  <td>₹{fmt(p.totalEarnings)}</td>
                  <td style={{ fontWeight: 700, color: p.walletBalance > 0 ? '#22C55E' : p.walletBalance < 0 ? '#EF4444' : 'var(--c-text-muted)' }}>
                    {p.walletBalance > 0 ? '+' : ''}₹{fmt(p.walletBalance)}
                  </td>
                  <td>
                    {p.walletBalance === 0
                      ? <Badge status="success" label="Settled" />
                      : p.walletBalance > 0
                        ? <Badge status="warning" label="Owed to partner" />
                        : <Badge status="danger" label="Owed by partner" />}
                  </td>
                  <td>
                    <button className="btn btn-ghost btn-icon" title="View Ledger" onClick={() => openDetail(p)}>
                      <Wallet size={15} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="pagination">
          <span className="pagination-info">Showing {Math.min((page - 1) * ITEMS_PER_PAGE + 1, filtered.length)}–{Math.min(page * ITEMS_PER_PAGE, filtered.length)} of {filtered.length} partners</span>
          <div className="pagination-controls">
            <button className="pagination-btn" onClick={() => setPage(p => p - 1)} disabled={page === 1}>‹</button>
            <button className="pagination-btn" onClick={() => setPage(p => p + 1)} disabled={page === totalPages || totalPages === 0}>›</button>
          </div>
        </div>
      </div>

      <Modal isOpen={!!selected} onClose={closeDetail} title={`Settlement Ledger — ${selected?.name ?? ''}`} size="lg"
        dismissOnBackdrop={false} dismissOnEscape={false}>
        {detailLoading ? (
          <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--c-text-muted)' }}>Loading ledger…</div>
        ) : ledger && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ background: 'linear-gradient(135deg,var(--c-brand-teal-mid),var(--c-brand-teal-dark))', borderRadius: 'var(--r-md)', padding: 16, color: 'white' }}>
              <div style={{ fontSize: 11, fontWeight: 700, opacity: 0.7, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>Current Balance</div>
              <div style={{ fontSize: 24, fontWeight: 800 }}>
                {balance === 0 ? 'Settled' : balance > 0 ? `Owe partner ₹${fmt(balance)}` : `Partner owes ₹${fmt(-balance)}`}
              </div>
              <div style={{ fontSize: 12, opacity: 0.75, marginTop: 4 }}>Lifetime earnings: ₹{fmt(ledger.partner.totalEarnings)}</div>
            </div>

            {balance !== 0 && (
              <div style={{ background: 'var(--c-border-light)', borderRadius: 'var(--r-md)', padding: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--c-text-secondary)', marginBottom: 10 }}>Record Settlement</div>
                <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                  <select value={settleType} onChange={e => setSettleType(e.target.value)} style={{ border: '1px solid var(--c-border)', borderRadius: 'var(--r-sm)', padding: '6px 10px', fontSize: 13, background: 'var(--c-bg-card)', color: 'var(--c-text-primary)' }}>
                    <option value="payout">Pay out to partner</option>
                    <option value="collection">Collect from partner</option>
                  </select>
                  <input type="number" placeholder="Amount" value={settleAmount} onChange={e => setSettleAmount(e.target.value)}
                    style={{ flex: 1, border: '1px solid var(--c-border)', borderRadius: 'var(--r-sm)', padding: '6px 10px', fontSize: 13, background: 'var(--c-bg-card)', color: 'var(--c-text-primary)' }} />
                  <select value={settleMethod} onChange={e => setSettleMethod(e.target.value)} style={{ border: '1px solid var(--c-border)', borderRadius: 'var(--r-sm)', padding: '6px 10px', fontSize: 13, background: 'var(--c-bg-card)', color: 'var(--c-text-primary)' }}>
                    <option value="">Method…</option>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="upi">UPI</option>
                    <option value="cash">Cash</option>
                  </select>
                </div>
                <input type="text" placeholder="Note (optional)…" value={settleNote} onChange={e => setSettleNote(e.target.value)}
                  style={{ width: '100%', border: '1px solid var(--c-border)', borderRadius: 'var(--r-sm)', padding: '6px 10px', fontSize: 13, background: 'var(--c-bg-card)', color: 'var(--c-text-primary)', boxSizing: 'border-box', marginBottom: 8 }} />
                <button className="btn btn-primary btn-sm" onClick={handleSettle} disabled={settling}>
                  {settling ? '…' : 'Record Settlement'}
                </button>
              </div>
            )}

            <div>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>Ledger Entries</div>
              {ledger.entries.length === 0 ? (
                <div style={{ fontSize: 13, color: 'var(--c-text-muted)' }}>No ledger entries yet.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {ledger.entries.map(e => (
                    <div key={e.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0', borderBottom: '1px solid var(--c-border-light)' }}>
                      {e.direction === 'credit'
                        ? <ArrowDownCircle size={18} style={{ color: '#22C55E' }} />
                        : <ArrowUpCircle size={18} style={{ color: '#EF4444' }} />}
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 600 }}>{e.bookingCode}</div>
                        <div style={{ fontSize: 11, color: 'var(--c-text-muted)' }}>
                          {e.paymentMode === 'cod' ? 'COD' : 'Online'} · {e.commissionPercent}% commission
                        </div>
                      </div>
                      <Badge status={STATUS_BADGE[e.status] ?? 'warning'} label={e.status} />
                      <div style={{ fontSize: 13, fontWeight: 700, minWidth: 80, textAlign: 'right', color: e.direction === 'credit' ? '#22C55E' : '#EF4444' }}>
                        {e.direction === 'credit' ? '+' : '-'}₹{fmt(e.amount)}
                      </div>
                      {e.status === 'unsettled' && (
                        <button className="btn btn-ghost btn-icon" title="Void entry" onClick={() => handleVoid(e.id)} style={{ color: 'var(--c-danger)' }}>
                          <XCircle size={14} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>Settlement History</div>
              {ledger.settlements.length === 0 ? (
                <div style={{ fontSize: 13, color: 'var(--c-text-muted)' }}>No settlements recorded yet.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {ledger.settlements.map(s => (
                    <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 13 }}>
                      <span>{s.type === 'payout' ? 'Paid to partner' : 'Collected from partner'} {s.method ? `(${s.method})` : ''}</span>
                      <span style={{ fontWeight: 700 }}>₹{fmt(s.amount)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

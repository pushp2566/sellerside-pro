'use client';
import { useMemo, useState } from 'react';
import Link from 'next/link';
import { AgGridReact } from 'ag-grid-react';
import { AllCommunityModule, ModuleRegistry, themeQuartz, type ColDef } from 'ag-grid-community';
import { ArrowRight, ArrowUpRight, Check, ChevronRight, ClipboardList, Cookie, LayoutDashboard, MessageSquareText, Plus, Search, ShieldCheck, Sparkles, X } from 'lucide-react';
import { orders, sampleMessage } from '@/lib/samples';
import { lineTotal, refundTotal, usd } from '@/lib/money';

ModuleRegistry.registerModules([AllCommunityModule]);
const gridTheme = themeQuartz.withParams({ accentColor: '#176b57', backgroundColor: '#ffffff', foregroundColor: '#243b34', headerBackgroundColor: '#f7f8f5', borderColor: '#e6ebe5', fontFamily: 'Arial, sans-serif', fontSize: 13, rowBorder: true, wrapperBorder: false });
type Order = typeof orders[number];

export default function Workspace() {
  const [view, setView] = useState<'orders' | 'support'>('orders');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All orders');
  const [draftOpen, setDraftOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [showSample, setShowSample] = useState(false);
  const [selected, setSelected] = useState<Order | null>(null);
  const [qty, setQty] = useState(6);
  const [reviewRefund, setReviewRefund] = useState(false);
  const [notice, setNotice] = useState('');
  const rows = useMemo(() => orders.filter(o => filter === 'All orders' || o.status === filter), [filter]);
  const cols = useMemo<ColDef<Order>[]>(() => [
    { field: 'id', headerName: 'Order', width: 118, cellClass: 'order-id' },
    { field: 'customer', headerName: 'Customer', minWidth: 155, flex: 1 },
    { field: 'items', headerName: 'Order details', minWidth: 200, flex: 1.4 },
    { field: 'delivery', headerName: 'Delivery', width: 155 },
    { field: 'total', headerName: 'Amount', width: 115, valueFormatter: p => usd(p.value) },
    { field: 'status', headerName: 'Status', minWidth: 175, flex: 1, cellRenderer: (p: {value: string}) => <span className={`badge ${p.value === 'Paid' ? 'green' : p.value === 'Needs details' ? 'amber' : 'neutral'}`}>{p.value}</span> },
  ], []);
  let refund: number | null = null;
  try { refund = refundTotal(qty, 250, 4500); } catch { /* Invalid quantity keeps approval unavailable. */ }

  return <div className="app-shell">
    <aside className="sidebar">
      <Link href="/" className="brand"><span className="brand-icon"><Cookie size={23}/></span>SellerSide<span className="pro">PRO</span></Link>
      <div className="shop"><div className="shop-avatar">B</div><div><strong>Butter & Crumb</strong><small>Demo bakery · USD</small></div></div>
      <div className="nav-label">WORKSPACE</div>
      <nav aria-label="Workspace"><button className={view === 'orders' ? 'nav active' : 'nav'} onClick={() => setView('orders')}><LayoutDashboard size={18}/>Orders<span>5</span></button><button className={view === 'support' ? 'nav active' : 'nav'} onClick={() => setView('support')}><MessageSquareText size={18}/>Customer support<span>1</span></button></nav>
      <div className="sidebar-note"><ShieldCheck size={22}/><strong>Your business. Your call.</strong><p>You review every order and approve every refund.</p></div>
      <div className="profile"><div className="avatar">JD</div><div><strong>Demo seller</strong><small>Sample workspace</small></div><span className="online"/></div>
    </aside>
    <main className="main">
      <header className="topbar"><span>Workspace <ChevronRight size={14}/> {view === 'orders' ? 'Orders' : 'Customer support'}</span><span className="sandbox"><span/>Sandbox · test money only</span></header>
      <div className="content">
        <div className="page-heading"><div><p className="eyebrow">A LITTLE LESS ADMIN. A LOT MORE CREATING.</p><h1>{view === 'orders' ? 'Good things are baking.' : 'Make things right.'}</h1><p className="subtitle">{view === 'orders' ? 'Every conversation, order, and payment. A little more organized.' : 'Clear facts, fair refunds, and a human in control.'}</p></div><button className="button primary" onClick={() => {setDraftOpen(true);setShowSample(false);}}><Plus size={18}/> New order</button></div>
        <div className="build-note"><span className="tiny-label">LOCAL PREVIEW</span> Fictional sample orders. AI and database connections are not enabled yet.</div>
        {notice && <div className="notice" role="status">{notice}<button aria-label="Dismiss message" onClick={() => setNotice('')}><X size={16}/></button></div>}
        {view === 'orders' ? <>
          <section className="stats" aria-label="Sample order statistics"><Stat label="Sample order value" value="$210.00" detail="Across 5 example orders"/><Stat label="Orders paid" value="2" detail="Ready for the next step"/><Stat label="Needs your attention" value="1" detail="Missing delivery details" highlight/><Stat label="Sample refund" value="$15.00" detail="6 cupcakes × $2.50"/></section>
          <section className="assist-banner"><div className="spark-icon"><Sparkles size={24}/></div><div><span className="eyebrow">FROM MESSAGE TO ORDER</span><h2>Let’s untangle that customer message.</h2><p>Start with a sample conversation and explore the order review.</p></div><button className="button light" onClick={() => {setMessage(sampleMessage);setShowSample(true);setDraftOpen(true);}}>Try sample order <ArrowRight size={17}/></button></section>
          <section className="table-card"><div className="table-title"><div><h2>Your orders <span>5</span></h2><p>A clear view of what’s coming up.</p></div><span className="tiny-label">SAMPLE DATA</span></div><div className="table-tools"><div className="tabs">{['All orders','Needs details','Paid','Awaiting payment'].map(f => <button key={f} className={filter === f ? 'selected' : ''} onClick={() => setFilter(f)}>{f}</button>)}</div><label className="search"><Search size={16}/><input aria-label="Search orders" placeholder="Search orders…" value={search} onChange={e => setSearch(e.target.value)}/></label></div><div className="grid"><AgGridReact<Order> theme={gridTheme} rowData={rows} columnDefs={cols} defaultColDef={{sortable:true,filter:true,resizable:true}} quickFilterText={search} rowHeight={65} headerHeight={44} domLayout="autoHeight" onRowClicked={e => e.data && setSelected(e.data)} getRowId={p => p.data.id}/></div><div className="table-foot">Click an order to see its details.<span>All amounts in USD</span></div></section>
        </> : <section className="support-layout"><div className="card"><span className="tiny-label">SAMPLE SUPPORT CASE · SS-1040</span><h2>Six cupcakes arrived damaged</h2><p className="quote">“Hi, six of the cupcakes arrived damaged. Can you refund those?”</p><p className="subtitle">This is a sample case. The seller must check the complaint and any required evidence before approving a refund.</p><label className="field">Affected cupcakes<input type="number" min="1" max="24" value={qty} onChange={e => {setQty(Number(e.target.value));setReviewRefund(false);}}/></label><div className="calculation"><span>{qty || '—'} cupcakes × $2.50</span><strong>{refund === null ? 'Invalid amount' : usd(refund)}</strong></div><button className="button primary" disabled={refund === null} onClick={() => setReviewRefund(true)}>Review refund <ArrowRight size={16}/></button>{reviewRefund && <div className="review-box"><strong>Review the exact amount: {usd(refund!)}</strong><p>This sample case is not connected to a PayPal payment. No refund will be sent from this preview.</p><button className="button light" onClick={() => setNotice('Sample reviewed. No payment action was taken.')}>Finish sample review</button></div>}</div><div className="card policy"><ShieldCheck size={28}/><h2>Approval comes first.</h2><p>Customer messages are evidence, not permission to move money.</p><ul><li>Seller checks the claim.</li><li>The app calculates the amount.</li><li>The seller approves the exact refund.</li><li>PayPal confirms the result.</li></ul><span className="badge green">Sandbox payment + partial refund tested</span></div></section>}
        <footer className="workspace-footer"><ShieldCheck size={14}/> Thoughtful assistance. You stay in control.<span>SellerSide Pro · Hackathon build</span></footer>
      </div>
    </main>
    {draftOpen && <div className="modal-backdrop"><section className="modal" role="dialog" aria-modal="true" aria-labelledby="draft-title"><div className="modal-title"><div><span className="eyebrow">NEW ORDER</span><h2 id="draft-title">Start with a conversation.</h2></div><button className="icon-button" aria-label="Close order draft" onClick={() => setDraftOpen(false)}><X/></button></div><label className="field">Customer message<textarea rows={4} value={message} onChange={e => {setMessage(e.target.value);setShowSample(false);}} placeholder="Paste the customer’s message here…"/></label><div className="draft-actions"><button className="button light" onClick={() => {setMessage(sampleMessage);setShowSample(true);}}>Load sample walkthrough</button><span>AI connection coming next</span></div>{showSample ? <div className="sample-result"><span className="badge neutral">Preset example · not AI-generated</span><h3>Proposed order</h3><div className="line"><span>12 chocolate cupcakes</span><strong>{usd(lineTotal(12,250))}</strong></div><div className="line"><span>12 vanilla cupcakes</span><strong>{usd(lineTotal(12,250))}</strong></div><p>Eggless · birthday decorations</p><div className="missing"><strong>Still needed</strong><p>Exact date, delivery time, delivery address, and decoration details.</p></div><div className="line total"><span>Sample total</span><strong>$60.00</strong></div><Link className="button primary" href="/order/sample">Preview customer page <ArrowUpRight size={16}/></Link></div> : <p className="helper">We’ll connect message analysis after validating the AI account. You can explore the preset sample now.</p>}</section></div>}
    {selected && <div className="modal-backdrop"><section className="modal compact" role="dialog" aria-modal="true" aria-labelledby="order-title"><div className="modal-title"><h2 id="order-title">{selected.id}</h2><button className="icon-button" aria-label="Close order details" onClick={() => setSelected(null)}><X/></button></div><span className="badge neutral">Fictional sample order</span><h3>{selected.customer}</h3><p>{selected.items}</p><div className="line"><span>Delivery</span><strong>{selected.delivery}</strong></div><div className="line"><span>Status</span><strong>{selected.status}</strong></div><div className="line total"><span>Order total</span><strong>{usd(selected.total)}</strong></div><button className="button light" onClick={() => {setSelected(null);setView('support');}}>Explore sample support case <ArrowRight size={16}/></button></section></div>}
  </div>;
}

function Stat({label,value,detail,highlight=false}:{label:string;value:string;detail:string;highlight?:boolean}) { return <div className={`stat ${highlight ? 'attention' : ''}`}><span>{label}</span><strong>{value}</strong><small>{highlight ? <span className="dot"/> : <Check size={12}/>} {detail}</small></div>; }

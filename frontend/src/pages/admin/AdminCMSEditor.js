import { useState, useEffect } from 'react';
import { X } from '@phosphor-icons/react';
import { toast } from 'sonner';
import axios from 'axios';
import { API, getAuthHeaders, inputCls, textareaCls } from './helpers';

export function AdminCMSEditor() {
  const [activeTab, setActiveTab] = useState('hero');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const tabs = [
    { id: 'hero', label: 'Hero Section' }, { id: 'stats', label: 'Stats Bar' },
    { id: 'about', label: 'About Section' }, { id: 'faq', label: 'FAQ' },
    { id: 'addons', label: 'Add-ons' }, { id: 'contact', label: 'Contact Info' }
  ];

  useEffect(() => { fetchData(); }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try { const res = await axios.get(`${API}/admin/cms/${activeTab}`, { headers: getAuthHeaders() }); setData(res.data); }
    catch (error) { toast.error('Failed to load content'); }
    finally { setLoading(false); }
  };

  const handleSave = async () => {
    setSaving(true);
    try { await axios.put(`${API}/admin/cms/${activeTab}`, { content: data }, { headers: getAuthHeaders() }); toast.success(`${activeTab} content saved!`); }
    catch (error) { toast.error('Failed to save'); }
    finally { setSaving(false); }
  };

  const renderEditor = () => {
    if (loading || !data) return <div className="animate-pulse h-64 bg-white/5" />;
    switch (activeTab) {
      case 'hero': return (<div className="space-y-4">
        <div><label className="block text-sm text-white/60 mb-2">Headline</label><textarea value={data.headline || ''} onChange={e => setData(d => ({ ...d, headline: e.target.value }))} className={textareaCls} /></div>
        <div><label className="block text-sm text-white/60 mb-2">Subtitle</label><textarea value={data.subtitle || ''} onChange={e => setData(d => ({ ...d, subtitle: e.target.value }))} className={textareaCls} /></div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-sm text-white/60 mb-2">CTA Button Text</label><input value={data.cta_text || ''} onChange={e => setData(d => ({ ...d, cta_text: e.target.value }))} className={inputCls} /></div>
          <div><label className="block text-sm text-white/60 mb-2">CTA Link</label><input value={data.cta_link || ''} onChange={e => setData(d => ({ ...d, cta_link: e.target.value }))} className={inputCls} /></div>
        </div>
        <div><label className="block text-sm text-white/60 mb-2">Background Image URL</label><input value={data.background_image || ''} onChange={e => setData(d => ({ ...d, background_image: e.target.value }))} className={inputCls} /></div>
        {data.background_image && <img src={data.background_image} alt="Preview" className="w-full max-h-48 object-cover border border-white/10" />}
      </div>);
      case 'stats': return (<div className="space-y-3">
        {Array.isArray(data) && data.map((stat, idx) => (
          <div key={idx} className="flex gap-3 items-center">
            <input value={stat.value} onChange={e => { const s = [...data]; s[idx] = { ...s[idx], value: e.target.value }; setData(s); }} className={`${inputCls} w-32`} placeholder="500+" />
            <input value={stat.label} onChange={e => { const s = [...data]; s[idx] = { ...s[idx], label: e.target.value }; setData(s); }} className={`${inputCls} flex-1`} placeholder="Properties Shot" />
            <button onClick={() => setData(data.filter((_, i) => i !== idx))} className="text-red-400 p-2"><X size={16} /></button>
          </div>
        ))}
        <button onClick={() => setData([...(data || []), { value: '', label: '' }])} className="text-sm text-[#d4af37]">+ Add Stat</button>
      </div>);
      case 'about': return (<div className="space-y-4">
        <div><label className="block text-sm text-white/60 mb-2">Tagline</label><input value={data.tagline || ''} onChange={e => setData(d => ({ ...d, tagline: e.target.value }))} className={inputCls} /></div>
        <div><label className="block text-sm text-white/60 mb-2">Headline</label><textarea value={data.headline || ''} onChange={e => setData(d => ({ ...d, headline: e.target.value }))} className={textareaCls} /></div>
        <div><label className="block text-sm text-white/60 mb-2">Description</label><textarea value={data.description || ''} onChange={e => setData(d => ({ ...d, description: e.target.value }))} className={`${textareaCls} min-h-[120px]`} /></div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-sm text-white/60 mb-2">Compliance Title</label><input value={data.compliance_title || ''} onChange={e => setData(d => ({ ...d, compliance_title: e.target.value }))} className={inputCls} /></div>
          <div><label className="block text-sm text-white/60 mb-2">Compliance Image URL</label><input value={data.compliance_image || ''} onChange={e => setData(d => ({ ...d, compliance_image: e.target.value }))} className={inputCls} /></div>
        </div>
        <div><label className="block text-sm text-white/60 mb-2">Compliance Text</label><textarea value={data.compliance_text || ''} onChange={e => setData(d => ({ ...d, compliance_text: e.target.value }))} className={textareaCls} /></div>
        <div><label className="block text-sm text-white/60 mb-2">About Page Hero Image</label><input value={data.about_page_hero_image || ''} onChange={e => setData(d => ({ ...d, about_page_hero_image: e.target.value }))} className={inputCls} /></div>
        <div><label className="block text-sm text-white/60 mb-2">About Page Equipment Image</label><input value={data.about_page_equipment_image || ''} onChange={e => setData(d => ({ ...d, about_page_equipment_image: e.target.value }))} className={inputCls} /></div>
        <div>
          <div className="flex items-center justify-between mb-2"><label className="text-sm text-white/60">Difference Items</label><button onClick={() => setData(d => ({ ...d, difference_items: [...(d.difference_items || []), { title: '', description: '' }] }))} className="text-xs text-[#d4af37]">+ Add</button></div>
          {(data.difference_items || []).map((item, idx) => (
            <div key={idx} className="border border-white/10 p-3 mb-2">
              <div className="flex justify-between mb-2"><span className="text-xs text-white/40">Item #{idx + 1}</span><button onClick={() => setData(d => ({ ...d, difference_items: d.difference_items.filter((_, i) => i !== idx) }))} className="text-red-400"><X size={14} /></button></div>
              <input value={item.title} onChange={e => { const items = [...data.difference_items]; items[idx] = { ...items[idx], title: e.target.value }; setData(d => ({ ...d, difference_items: items })); }} className={`${inputCls} mb-2`} placeholder="Title" />
              <input value={item.description} onChange={e => { const items = [...data.difference_items]; items[idx] = { ...items[idx], description: e.target.value }; setData(d => ({ ...d, difference_items: items })); }} className={inputCls} placeholder="Description" />
            </div>
          ))}
        </div>
        <div>
          <div className="flex items-center justify-between mb-2"><label className="text-sm text-white/60">Service Cities</label><button onClick={() => setData(d => ({ ...d, service_cities: [...(d.service_cities || []), ''] }))} className="text-xs text-[#d4af37]">+ Add</button></div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {(data.service_cities || []).map((city, idx) => (
              <div key={idx} className="flex gap-1 items-center">
                <input value={city} onChange={e => { const c = [...data.service_cities]; c[idx] = e.target.value; setData(d => ({ ...d, service_cities: c })); }} className={`${inputCls} flex-1`} />
                <button onClick={() => setData(d => ({ ...d, service_cities: d.service_cities.filter((_, i) => i !== idx) }))} className="text-red-400"><X size={14} /></button>
              </div>
            ))}
          </div>
        </div>
      </div>);
      case 'faq': return (<div className="space-y-4">
        {Array.isArray(data) && data.map((item, idx) => (
          <div key={idx} className="border border-white/10 p-4">
            <div className="flex justify-between mb-2"><span className="text-xs text-white/40">FAQ #{idx + 1}</span><button onClick={() => setData(data.filter((_, i) => i !== idx))} className="text-red-400"><X size={14} /></button></div>
            <input value={item.question} onChange={e => { const f = [...data]; f[idx] = { ...f[idx], question: e.target.value }; setData(f); }} className={`${inputCls} mb-2`} placeholder="Question" />
            <textarea value={item.answer} onChange={e => { const f = [...data]; f[idx] = { ...f[idx], answer: e.target.value }; setData(f); }} className={textareaCls} placeholder="Answer" />
          </div>
        ))}
        <button onClick={() => setData([...(data || []), { question: '', answer: '' }])} className="text-sm text-[#d4af37]">+ Add FAQ</button>
      </div>);
      case 'addons': return (<div className="space-y-3">
        {Array.isArray(data) && data.map((addon, idx) => (
          <div key={idx} className="flex gap-3 items-center">
            <input value={addon.name} onChange={e => { const a = [...data]; a[idx] = { ...a[idx], name: e.target.value }; setData(a); }} className={`${inputCls} flex-1`} placeholder="Name" />
            <input type="number" value={addon.price} onChange={e => { const a = [...data]; a[idx] = { ...a[idx], price: parseInt(e.target.value) || 0 }; setData(a); }} className={`${inputCls} w-24`} placeholder="Price" />
            <input value={addon.description} onChange={e => { const a = [...data]; a[idx] = { ...a[idx], description: e.target.value }; setData(a); }} className={`${inputCls} flex-1`} placeholder="Description" />
            <button onClick={() => setData(data.filter((_, i) => i !== idx))} className="text-red-400"><X size={14} /></button>
          </div>
        ))}
        <button onClick={() => setData([...(data || []), { name: '', price: 0, description: '' }])} className="text-sm text-[#d4af37]">+ Add Add-on</button>
      </div>);
      case 'contact': return (<div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-sm text-white/60 mb-2">Phone</label><input value={data.phone || ''} onChange={e => setData(d => ({ ...d, phone: e.target.value }))} className={inputCls} /></div>
          <div><label className="block text-sm text-white/60 mb-2">Email</label><input value={data.email || ''} onChange={e => setData(d => ({ ...d, email: e.target.value }))} className={inputCls} /></div>
        </div>
        <div><label className="block text-sm text-white/60 mb-2">Address / Location</label><input value={data.address || ''} onChange={e => setData(d => ({ ...d, address: e.target.value }))} className={inputCls} /></div>
        <div><label className="block text-sm text-white/60 mb-2">Business Hours</label><input value={data.hours || ''} onChange={e => setData(d => ({ ...d, hours: e.target.value }))} className={inputCls} /></div>
        <div><label className="block text-sm text-white/60 mb-2">Response Time Note</label><input value={data.response_time || ''} onChange={e => setData(d => ({ ...d, response_time: e.target.value }))} className={inputCls} /></div>
      </div>);
      default: return null;
    }
  };

  return (
    <div data-testid="admin-cms-editor">
      <h1 className="text-3xl font-black tracking-tight mb-6">Website Content Editor</h1>
      <p className="text-sm text-white/40 mb-8">Edit all website sections. Changes appear on the live site immediately after saving.</p>
      <div className="flex flex-wrap gap-2 mb-8 border-b border-white/10 pb-4">
        {tabs.map(tab => (<button key={tab.id} onClick={() => setActiveTab(tab.id)} data-testid={`cms-tab-${tab.id}`} className={`px-4 py-2 text-sm transition-colors ${activeTab === tab.id ? 'bg-[#d4af37] text-black font-medium' : 'border border-white/20 text-white/60 hover:text-white hover:bg-white/5'}`}>{tab.label}</button>))}
      </div>
      {renderEditor()}
      <div className="mt-8 pt-6 border-t border-white/10">
        <button data-testid="cms-save" onClick={handleSave} disabled={saving} className="bg-[#d4af37] text-black px-8 py-3 text-sm font-medium tracking-wide uppercase hover:bg-[#c4a030] transition-colors disabled:opacity-50">{saving ? 'Saving...' : `Save ${tabs.find(t => t.id === activeTab)?.label}`}</button>
      </div>
    </div>
  );
}

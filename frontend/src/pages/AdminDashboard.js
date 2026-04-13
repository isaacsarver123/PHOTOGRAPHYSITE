import { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  House, CalendarDots, Users, EnvelopeSimple, SignOut,
  Gear, NotePencil, Package, Images, Layout, PencilSimpleLine, X, Upload
} from '@phosphor-icons/react';
import { toast } from 'sonner';
import axios from 'axios';

// Shared helpers
const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const getAuthHeaders = () => {
  const token = localStorage.getItem('admin_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};
const inputCls = "w-full bg-white/5 border border-white/10 px-4 py-3 text-sm focus:border-[#d4af37] focus:outline-none";

// Reusable image field: upload file OR paste URL
function ImageField({ label, value, onChange, placeholder }) {
  const [uploading, setUploading] = useState(false);
  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await axios.post(`${API}/admin/upload-image`, formData, { headers: { ...getAuthHeaders(), 'Content-Type': 'multipart/form-data' } });
      onChange(`${process.env.REACT_APP_BACKEND_URL}${res.data.url}`);
      toast.success('Image uploaded');
    } catch (error) { toast.error('Failed to upload image'); }
    finally { setUploading(false); }
  };
  return (
    <div>
      <label className="block text-sm text-white/60 mb-2">{label}</label>
      <div className="flex gap-2">
        <input value={value || ''} onChange={e => onChange(e.target.value)} placeholder={placeholder || 'Paste URL or upload file'} className={`${inputCls} flex-1`} />
        <label className="cursor-pointer flex-shrink-0">
          <input type="file" accept="image/*" onChange={handleUpload} className="hidden" />
          <span className="inline-flex items-center gap-1.5 bg-white/10 hover:bg-white/20 px-3 py-3 text-sm transition-colors h-full"><Upload size={16} />{uploading ? '...' : 'Upload'}</span>
        </label>
      </div>
      {value && <img src={value} alt="Preview" className="mt-2 max-h-24 object-cover border border-white/10" onError={e => e.target.style.display='none'} />}
    </div>
  );
}

// Extracted components
import { AdminOverview } from './admin/AdminOverview';
import { AdminBookings } from './admin/AdminBookings';
import { AdminClients } from './admin/AdminClients';
import { AdminContacts } from './admin/AdminContacts';
import { AdminCMSEditor } from './admin/AdminCMSEditor';

// ==================== PORTFOLIO ====================
function AdminPortfolio() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const categories = ['residential', 'commercial', 'land', 'construction'];
  useEffect(() => { fetchItems(); }, []);
  const fetchItems = async () => { try { const res = await axios.get(`${API}/admin/portfolio`, { headers: getAuthHeaders() }); setItems(res.data); } catch (error) { toast.error('Failed to load portfolio'); } finally { setLoading(false); } };
  const handleSave = async (item) => { setSaving(true); try { if (item.id) { await axios.put(`${API}/admin/portfolio/${item.id}`, item, { headers: getAuthHeaders() }); toast.success('Item updated'); } else { await axios.post(`${API}/admin/portfolio`, item, { headers: getAuthHeaders() }); toast.success('Item created'); } setEditItem(null); fetchItems(); } catch (error) { toast.error('Failed to save'); } finally { setSaving(false); } };
  const handleDelete = async (id) => { if (!window.confirm('Delete this portfolio item?')) return; try { await axios.delete(`${API}/admin/portfolio/${id}`, { headers: getAuthHeaders() }); toast.success('Item deleted'); fetchItems(); } catch (error) { toast.error('Failed to delete'); } };
  if (loading) return <div className="animate-pulse space-y-4"><div className="h-64 bg-white/5" /></div>;
  return (
    <div data-testid="admin-portfolio">
      <div className="flex items-center justify-between mb-8"><h1 className="text-3xl font-black tracking-tight">Portfolio</h1><button data-testid="portfolio-add" onClick={() => setEditItem({ title: '', description: '', category: 'residential', image_url: '', before_image_url: '', after_image_url: '', location: '' })} className="bg-[#d4af37] text-black px-4 py-2 text-sm font-medium">+ Add Item</button></div>
      {editItem && (<div className="border border-[#d4af37] bg-[#141414] p-6 mb-6"><h2 className="text-lg font-bold mb-4">{editItem.id ? 'Edit Item' : 'New Item'}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div><label className="block text-sm text-white/60 mb-2">Title</label><input value={editItem.title} onChange={e => setEditItem(i => ({ ...i, title: e.target.value }))} className={inputCls} /></div>
          <div><label className="block text-sm text-white/60 mb-2">Location</label><input value={editItem.location} onChange={e => setEditItem(i => ({ ...i, location: e.target.value }))} className={inputCls} placeholder="Red Deer, AB" /></div>
          <div><label className="block text-sm text-white/60 mb-2">Category</label><select value={editItem.category} onChange={e => setEditItem(i => ({ ...i, category: e.target.value }))} className={inputCls}>{categories.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}</select></div>
          <ImageField label="Main Image" value={editItem.image_url} onChange={v => setEditItem(i => ({ ...i, image_url: v }))} />
        </div>
        <div className="mb-4"><label className="block text-sm text-white/60 mb-2">Description</label><input value={editItem.description} onChange={e => setEditItem(i => ({ ...i, description: e.target.value }))} className={inputCls} /></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <ImageField label="Before Image" value={editItem.before_image_url} onChange={v => setEditItem(i => ({ ...i, before_image_url: v }))} />
          <ImageField label="After Image" value={editItem.after_image_url} onChange={v => setEditItem(i => ({ ...i, after_image_url: v }))} />
        </div>
        <div className="flex gap-3"><button data-testid="portfolio-save-item" onClick={() => handleSave(editItem)} disabled={saving} className="bg-[#d4af37] text-black px-6 py-2 text-sm font-medium disabled:opacity-50">{saving ? 'Saving...' : 'Save'}</button><button onClick={() => setEditItem(null)} className="border border-white/20 px-6 py-2 text-sm">Cancel</button></div>
      </div>)}
      <div className="space-y-3">{items.length === 0 ? <p className="text-white/40 text-center py-12">No portfolio items yet.</p> : items.map((item) => (
        <div key={item.id} className="border border-white/10 bg-[#141414] p-4 flex items-center gap-4">
          {item.image_url && <img src={item.image_url} alt={item.title} className="w-20 h-14 object-cover flex-shrink-0" />}
          <div className="flex-1 min-w-0"><p className="font-medium truncate">{item.title}</p><p className="text-xs text-white/40">{item.category} &bull; {item.location}</p></div>
          <div className="flex gap-2 flex-shrink-0"><button onClick={() => setEditItem({ ...item })} className="text-sm text-[#d4af37] hover:text-[#c4a030]">Edit</button><button onClick={() => handleDelete(item.id)} className="text-sm text-red-400 hover:text-red-300">Delete</button></div>
        </div>
      ))}</div>
    </div>
  );
}

// ==================== HOME SERVICES ====================
function AdminHomeServices() {
  const [services, setServices] = useState([]); const [loading, setLoading] = useState(true); const [saving, setSaving] = useState(false);
  useEffect(() => { fetchServices(); }, []);
  const fetchServices = async () => { try { const res = await axios.get(`${API}/admin/home-services`, { headers: getAuthHeaders() }); setServices(res.data); } catch (error) { toast.error('Failed to load services'); } finally { setLoading(false); } };
  const handleSave = async () => { setSaving(true); try { await axios.put(`${API}/admin/home-services`, { services }, { headers: getAuthHeaders() }); toast.success('Home services updated'); } catch (error) { toast.error('Failed to save'); } finally { setSaving(false); } };
  const updateService = (idx, field, value) => { const s = [...services]; s[idx] = { ...s[idx], [field]: value }; setServices(s); };
  if (loading) return <div className="animate-pulse space-y-4"><div className="h-64 bg-white/5" /></div>;
  return (
    <div data-testid="admin-home-services"><h1 className="text-3xl font-black tracking-tight mb-8">Home Page Services</h1><p className="text-sm text-white/40 mb-6">Edit the "What We Offer" service cards shown on the homepage.</p>
      <div className="space-y-4">{services.map((svc, idx) => (
        <div key={idx} className="border border-white/10 bg-[#141414] p-4">
          <div className="flex items-center justify-between mb-3"><span className="text-sm font-medium text-white/60">Service #{idx + 1}</span><button onClick={() => setServices(s => s.filter((_, i) => i !== idx))} className="text-red-400 hover:text-red-300"><X size={16} /></button></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div><label className="block text-xs text-white/40 mb-1">Title</label><input value={svc.title} onChange={e => updateService(idx, 'title', e.target.value)} className={inputCls} /></div>
            <div><label className="block text-xs text-white/40 mb-1">Description</label><input value={svc.description} onChange={e => updateService(idx, 'description', e.target.value)} className={inputCls} /></div>
          </div>
          <div className="mt-3">
            <ImageField label="Image" value={svc.image} onChange={v => updateService(idx, 'image', v)} />
          </div>
          <div className="mt-2"><label className="block text-xs text-white/40 mb-1">Column Span</label>
            <select value={svc.span} onChange={e => updateService(idx, 'span', e.target.value)} className={`${inputCls} w-48`}>
              <option value="md:col-span-5">Narrow (5/12)</option><option value="md:col-span-6">Half (6/12)</option><option value="md:col-span-7">Wide (7/12)</option><option value="md:col-span-12">Full Width (12/12)</option>
            </select></div>
        </div>
      ))}</div>
      <div className="mt-4 flex gap-3"><button onClick={() => setServices(s => [...s, { title: '', description: '', image: '', span: 'md:col-span-7' }])} className="border border-white/20 px-4 py-2 text-sm hover:bg-white/5">+ Add Service</button>
        <button data-testid="home-services-save" onClick={handleSave} disabled={saving} className="bg-[#d4af37] text-black px-8 py-2 text-sm font-medium uppercase hover:bg-[#c4a030] disabled:opacity-50">{saving ? 'Saving...' : 'Save Services'}</button></div>
    </div>
  );
}

// ==================== SITE CONTENT ====================
function AdminContent() {
  const [content, setContent] = useState({ phone: '', email: '', main_location: '', service_areas: [], travel_fee_note: '', fleet: [] });
  const [loading, setLoading] = useState(true); const [saving, setSaving] = useState(false);
  useEffect(() => { fetchContent(); }, []);
  const fetchContent = async () => { try { const res = await axios.get(`${API}/admin/site-content`, { headers: getAuthHeaders() }); setContent(prev => ({ ...prev, ...res.data })); } catch (error) { toast.error('Failed to load site content'); } finally { setLoading(false); } };
  const handleSave = async () => { setSaving(true); try { const payload = { ...content }; delete payload.id; delete payload.created_at; delete payload.updated_at; await axios.put(`${API}/admin/site-content`, payload, { headers: getAuthHeaders() }); toast.success('Site content updated'); } catch (error) { toast.error('Failed to save'); } finally { setSaving(false); } };
  const updateArea = (idx, field, value) => { const areas = [...content.service_areas]; areas[idx] = { ...areas[idx], [field]: field === 'fee' ? parseInt(value) || 0 : value }; setContent(c => ({ ...c, service_areas: areas })); };
  const updateFleet = (idx, field, value) => { const fleet = [...content.fleet]; fleet[idx] = { ...fleet[idx], [field]: value }; setContent(c => ({ ...c, fleet })); };
  if (loading) return <div className="animate-pulse space-y-4"><div className="h-64 bg-white/5" /></div>;
  return (
    <div data-testid="admin-content"><h1 className="text-3xl font-black tracking-tight mb-8">Site Content</h1>
      <div className="border border-white/10 bg-[#141414] p-6 mb-6"><h2 className="text-lg font-bold mb-4">Contact Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><label className="block text-sm text-white/60 mb-2">Phone Number</label><input data-testid="content-phone" value={content.phone} onChange={e => setContent(c => ({ ...c, phone: e.target.value }))} className={inputCls} /></div>
          <div><label className="block text-sm text-white/60 mb-2">Email</label><input data-testid="content-email" value={content.email} onChange={e => setContent(c => ({ ...c, email: e.target.value }))} className={inputCls} /></div>
          <div><label className="block text-sm text-white/60 mb-2">Main Location</label><input data-testid="content-location" value={content.main_location} onChange={e => setContent(c => ({ ...c, main_location: e.target.value }))} className={inputCls} /></div>
          <div><label className="block text-sm text-white/60 mb-2">Travel Fee Note</label><input value={content.travel_fee_note} onChange={e => setContent(c => ({ ...c, travel_fee_note: e.target.value }))} className={inputCls} /></div>
        </div>
      </div>
      <div className="border border-white/10 bg-[#141414] p-6 mb-6"><div className="flex items-center justify-between mb-4"><h2 className="text-lg font-bold">Service Areas</h2><button onClick={() => setContent(c => ({ ...c, service_areas: [...c.service_areas, { name: '', fee: 0 }] }))} className="text-sm text-[#d4af37]">+ Add Area</button></div>
        <div className="space-y-3">{content.service_areas.map((area, idx) => (
          <div key={idx} className="flex gap-3 items-center"><input value={area.name} onChange={e => updateArea(idx, 'name', e.target.value)} placeholder="Area name" className={`${inputCls} flex-1`} />
            <div className="flex items-center gap-2"><span className="text-sm text-white/40">$</span><input type="number" value={area.fee} onChange={e => updateArea(idx, 'fee', e.target.value)} className={`${inputCls} w-24`} /><span className="text-sm text-white/40">fee</span></div>
            <button onClick={() => setContent(c => ({ ...c, service_areas: c.service_areas.filter((_, i) => i !== idx) }))} className="text-red-400 p-2"><X size={16} /></button>
          </div>
        ))}</div>
      </div>
      <div className="border border-white/10 bg-[#141414] p-6 mb-6"><div className="flex items-center justify-between mb-4"><h2 className="text-lg font-bold">Drone Fleet</h2><button onClick={() => setContent(c => ({ ...c, fleet: [...c.fleet, { name: '', description: '', image: '' }] }))} className="text-sm text-[#d4af37]">+ Add Drone</button></div>
        <div className="space-y-4">{content.fleet.map((drone, idx) => (
          <div key={idx} className="border border-white/10 p-4 space-y-3"><div className="flex items-center justify-between"><span className="text-sm text-white/40">Drone #{idx + 1}</span><button onClick={() => setContent(c => ({ ...c, fleet: c.fleet.filter((_, i) => i !== idx) }))} className="text-red-400"><X size={16} /></button></div>
            <input value={drone.name} onChange={e => updateFleet(idx, 'name', e.target.value)} placeholder="Drone name" className={inputCls} />
            <input value={drone.description} onChange={e => updateFleet(idx, 'description', e.target.value)} placeholder="Description" className={inputCls} />
            <input value={drone.image || ''} onChange={e => updateFleet(idx, 'image', e.target.value)} placeholder="Image URL (optional)" className={inputCls} />
          </div>
        ))}</div>
      </div>
      <button data-testid="content-save" onClick={handleSave} disabled={saving} className="bg-[#d4af37] text-black px-8 py-3 text-sm font-medium tracking-wide uppercase hover:bg-[#c4a030] transition-colors disabled:opacity-50">{saving ? 'Saving...' : 'Save Site Content'}</button>
    </div>
  );
}

// ==================== PACKAGES ====================
function AdminPackages() {
  const [packages, setPackages] = useState([]); const [loading, setLoading] = useState(true); const [saving, setSaving] = useState(false);
  useEffect(() => { fetchPackages(); }, []);
  const fetchPackages = async () => { try { const res = await axios.get(`${API}/admin/packages`, { headers: getAuthHeaders() }); setPackages(res.data); } catch (error) { toast.error('Failed to load packages'); } finally { setLoading(false); } };
  const handleSave = async () => { setSaving(true); try { await axios.put(`${API}/admin/packages`, { packages }, { headers: getAuthHeaders() }); toast.success('Packages updated'); } catch (error) { toast.error('Failed to save packages'); } finally { setSaving(false); } };
  const updatePkg = (idx, field, value) => { const pkgs = [...packages]; pkgs[idx] = { ...pkgs[idx], [field]: field === 'price' ? parseFloat(value) || 0 : value }; setPackages(pkgs); };
  const updateFeature = (pkgIdx, featIdx, value) => { const pkgs = [...packages]; pkgs[pkgIdx] = { ...pkgs[pkgIdx], features: [...pkgs[pkgIdx].features] }; pkgs[pkgIdx].features[featIdx] = value; setPackages(pkgs); };
  const addFeature = (pkgIdx) => { const pkgs = [...packages]; pkgs[pkgIdx] = { ...pkgs[pkgIdx], features: [...pkgs[pkgIdx].features, ''] }; setPackages(pkgs); };
  const removeFeature = (pkgIdx, featIdx) => { const pkgs = [...packages]; pkgs[pkgIdx] = { ...pkgs[pkgIdx], features: pkgs[pkgIdx].features.filter((_, i) => i !== featIdx) }; setPackages(pkgs); };
  const togglePopular = (idx) => { setPackages(packages.map((p, i) => ({ ...p, popular: i === idx ? !p.popular : false }))); };
  if (loading) return <div className="animate-pulse space-y-4"><div className="h-64 bg-white/5" /></div>;
  return (
    <div data-testid="admin-packages"><h1 className="text-3xl font-black tracking-tight mb-8">Pricing Packages</h1>
      <div className="space-y-6">{packages.map((pkg, idx) => (
        <div key={idx} className={`border bg-[#141414] p-6 ${pkg.popular ? 'border-[#d4af37]' : 'border-white/10'}`}>
          <div className="flex items-center justify-between mb-4"><h2 className="text-lg font-bold">{pkg.name || `Package ${idx + 1}`}</h2>
            <button onClick={() => togglePopular(idx)} className={`text-xs px-3 py-1 border transition-colors ${pkg.popular ? 'bg-[#d4af37]/20 text-[#d4af37] border-[#d4af37]/30' : 'border-white/20 text-white/40 hover:text-white'}`}>{pkg.popular ? 'Popular' : 'Set Popular'}</button></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div><label className="block text-sm text-white/60 mb-2">Package ID</label><input value={pkg.id} onChange={e => updatePkg(idx, 'id', e.target.value)} className={inputCls} /></div>
            <div><label className="block text-sm text-white/60 mb-2">Name</label><input value={pkg.name} onChange={e => updatePkg(idx, 'name', e.target.value)} className={inputCls} /></div>
            <div><label className="block text-sm text-white/60 mb-2">Price (CAD)</label><input type="number" value={pkg.price} onChange={e => updatePkg(idx, 'price', e.target.value)} className={inputCls} /></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div><label className="block text-sm text-white/60 mb-2">Description</label><input value={pkg.description} onChange={e => updatePkg(idx, 'description', e.target.value)} className={inputCls} /></div>
            <div><label className="block text-sm text-white/60 mb-2">Recommended For</label><input value={pkg.recommended_for || ''} onChange={e => updatePkg(idx, 'recommended_for', e.target.value)} className={inputCls} /></div>
          </div>
          <div><label className="block text-sm text-white/60 mb-2">Notes</label><input value={pkg.notes || ''} onChange={e => updatePkg(idx, 'notes', e.target.value)} className={inputCls} /></div>
          <div className="mt-4"><div className="flex items-center justify-between mb-2"><label className="text-sm text-white/60">Features</label><button onClick={() => addFeature(idx)} className="text-xs text-[#d4af37]">+ Add Feature</button></div>
            <div className="space-y-2">{pkg.features.map((feat, fidx) => (
              <div key={fidx} className="flex gap-2 items-center"><input value={feat} onChange={e => updateFeature(idx, fidx, e.target.value)} className={`${inputCls} flex-1`} /><button onClick={() => removeFeature(idx, fidx)} className="text-red-400 p-2"><X size={14} /></button></div>
            ))}</div>
          </div>
        </div>
      ))}</div>
      <button data-testid="packages-save" onClick={handleSave} disabled={saving} className="mt-6 bg-[#d4af37] text-black px-8 py-3 text-sm font-medium tracking-wide uppercase hover:bg-[#c4a030] transition-colors disabled:opacity-50">{saving ? 'Saving...' : 'Save All Packages'}</button>
    </div>
  );
}

// ==================== SETTINGS ====================
function AdminSettings() {
  const [settings, setSettings] = useState({ photo_storage_path: '', photo_retention_days: 30, smtp_host: '', smtp_port: 587, smtp_user: '', smtp_password: '', sender_email: '' });
  const [loading, setLoading] = useState(true); const [saving, setSaving] = useState(false); const [testing, setTesting] = useState(false);
  const [uploadingFavicon, setUploadingFavicon] = useState(false);
  const [faviconPreview, setFaviconPreview] = useState(null);
  useEffect(() => { fetchSettings(); }, []);
  const fetchSettings = async () => { try { const res = await axios.get(`${API}/admin/settings`, { headers: getAuthHeaders() }); setSettings(prev => ({ ...prev, ...res.data })); } catch (error) { toast.error('Failed to load settings'); } finally { setLoading(false); } };
  const handleSave = async () => { setSaving(true); try { const payload = { ...settings }; if (payload.smtp_password === '***') delete payload.smtp_password; delete payload.id; delete payload.updated_at; await axios.put(`${API}/admin/settings`, payload, { headers: getAuthHeaders() }); toast.success('Settings saved successfully'); } catch (error) { toast.error('Failed to save settings'); } finally { setSaving(false); } };
  const handleTestEmail = async () => { setTesting(true); try { const res = await axios.post(`${API}/admin/test-email`, {}, { headers: getAuthHeaders() }); if (res.data.status === 'mocked') { toast.info(res.data.message); } else if (res.data.status === 'error') { toast.error(res.data.message); } else { toast.success('Test email sent!'); } } catch (error) { toast.error(error.response?.data?.detail || 'Failed to send test email'); } finally { setTesting(false); } };
  const handleFaviconUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingFavicon(true);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await axios.post(`${API}/admin/favicon`, formData, { headers: { ...getAuthHeaders(), 'Content-Type': 'multipart/form-data' } });
      toast.success(res.data.message);
      setFaviconPreview(URL.createObjectURL(file));
    } catch (error) { toast.error(error.response?.data?.detail || 'Failed to upload favicon'); }
    finally { setUploadingFavicon(false); }
  };
  if (loading) return <div className="animate-pulse space-y-4"><div className="h-64 bg-white/5" /></div>;
  return (
    <div data-testid="admin-settings"><h1 className="text-3xl font-black tracking-tight mb-8">Settings</h1>
      {/* Favicon */}
      <div className="border border-white/10 bg-[#141414] p-6 mb-6">
        <h2 className="text-lg font-bold mb-4">Site Favicon</h2>
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden">
            {faviconPreview ? <img src={faviconPreview} alt="Favicon preview" className="w-full h-full object-contain" /> : <img src="/favicon.ico" alt="Current favicon" className="w-full h-full object-contain" />}
          </div>
          <div>
            <label className="cursor-pointer">
              <input type="file" accept=".png,.jpg,.jpeg,.ico,.svg,.webp" onChange={handleFaviconUpload} className="hidden" />
              <span className="inline-block bg-white/10 hover:bg-white/20 px-4 py-2 text-sm transition-colors">{uploadingFavicon ? 'Uploading...' : 'Upload New Favicon'}</span>
            </label>
            <p className="text-xs text-white/30 mt-2">Upload PNG, JPG, ICO, or SVG. Will be resized automatically. Hard refresh (Ctrl+Shift+R) to see changes.</p>
          </div>
        </div>
      </div>
      <div className="border border-white/10 bg-[#141414] p-6 mb-6"><h2 className="text-lg font-bold mb-4">Photo Storage</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><label className="block text-sm text-white/60 mb-2">Storage Path</label><input data-testid="settings-storage-path" value={settings.photo_storage_path} onChange={e => setSettings(s => ({ ...s, photo_storage_path: e.target.value }))} placeholder="D:/Photos or /mnt/storage/photos" className="w-full bg-white/5 border border-white/10 px-4 py-3 text-sm focus:border-[#d4af37] focus:outline-none placeholder:text-white/20" /><p className="text-xs text-white/30 mt-1.5">Any absolute path (e.g. <span className="text-white/50">D:/Photos</span>, <span className="text-white/50">/mnt/storage</span>). Folder will be created automatically.</p></div>
          <div><label className="block text-sm text-white/60 mb-2">Retention Period (days)</label><input data-testid="settings-retention-days" type="number" value={settings.photo_retention_days} onChange={e => setSettings(s => ({ ...s, photo_retention_days: parseInt(e.target.value) || 30 }))} className="w-full bg-white/5 border border-white/10 px-4 py-3 text-sm focus:border-[#d4af37] focus:outline-none" /><p className="text-xs text-white/30 mt-1.5">Photos older than this will be auto-deleted.</p></div>
        </div>
      </div>
      <div className="border border-white/10 bg-[#141414] p-6 mb-6">
        <div className="flex items-center justify-between mb-4"><h2 className="text-lg font-bold">Email (SMTP) Configuration</h2><span className={`text-xs px-3 py-1 ${settings.smtp_host && settings.smtp_user ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>{settings.smtp_host && settings.smtp_user ? 'Configured' : 'Not Configured'}</span></div>
        <p className="text-sm text-white/40 mb-6">Configure SMTP to send real email notifications.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><label className="block text-sm text-white/60 mb-2">SMTP Host</label><input data-testid="settings-smtp-host" value={settings.smtp_host} onChange={e => setSettings(s => ({ ...s, smtp_host: e.target.value }))} placeholder="smtp.gmail.com" className="w-full bg-white/5 border border-white/10 px-4 py-3 text-sm focus:border-[#d4af37] focus:outline-none placeholder:text-white/20" /></div>
          <div><label className="block text-sm text-white/60 mb-2">SMTP Port</label><input data-testid="settings-smtp-port" type="number" value={settings.smtp_port} onChange={e => setSettings(s => ({ ...s, smtp_port: parseInt(e.target.value) || 587 }))} className="w-full bg-white/5 border border-white/10 px-4 py-3 text-sm focus:border-[#d4af37] focus:outline-none" /></div>
          <div><label className="block text-sm text-white/60 mb-2">SMTP Username / Email</label><input data-testid="settings-smtp-user" value={settings.smtp_user} onChange={e => setSettings(s => ({ ...s, smtp_user: e.target.value }))} placeholder="your-email@gmail.com" className="w-full bg-white/5 border border-white/10 px-4 py-3 text-sm focus:border-[#d4af37] focus:outline-none placeholder:text-white/20" /></div>
          <div><label className="block text-sm text-white/60 mb-2">SMTP Password / App Password</label><input data-testid="settings-smtp-password" type="password" value={settings.smtp_password} onChange={e => setSettings(s => ({ ...s, smtp_password: e.target.value }))} placeholder="App password" className="w-full bg-white/5 border border-white/10 px-4 py-3 text-sm focus:border-[#d4af37] focus:outline-none placeholder:text-white/20" /></div>
          <div className="md:col-span-2"><label className="block text-sm text-white/60 mb-2">Sender Email Address</label><input data-testid="settings-sender-email" value={settings.sender_email} onChange={e => setSettings(s => ({ ...s, sender_email: e.target.value }))} placeholder="noreply@skylinemedia.net" className="w-full bg-white/5 border border-white/10 px-4 py-3 text-sm focus:border-[#d4af37] focus:outline-none placeholder:text-white/20" /></div>
        </div>
        <div className="mt-4 flex gap-3"><button data-testid="settings-test-email" onClick={handleTestEmail} disabled={testing} className="px-4 py-2 text-sm border border-white/20 hover:bg-white/5 transition-colors disabled:opacity-50">{testing ? 'Sending...' : 'Send Test Email'}</button></div>
      </div>
      <button data-testid="settings-save" onClick={handleSave} disabled={saving} className="bg-[#d4af37] text-black px-8 py-3 text-sm font-medium tracking-wide uppercase hover:bg-[#c4a030] transition-colors disabled:opacity-50">{saving ? 'Saving...' : 'Save Settings'}</button>
    </div>
  );
}

// ==================== MAIN DASHBOARD LAYOUT ====================
export default function AdminDashboard() {
  const location = useLocation();
  const navigate = useNavigate();
  const [admin, setAdmin] = useState(null);

  useEffect(() => {
    const storedAdmin = localStorage.getItem('admin_user');
    if (storedAdmin) { setAdmin(JSON.parse(storedAdmin)); } else { navigate('/admin'); }
  }, [navigate]);

  const handleLogout = () => { localStorage.removeItem('admin_token'); localStorage.removeItem('admin_user'); navigate('/admin'); };

  const navItems = [
    { path: '/admin/dashboard', icon: House, label: 'Overview', exact: true },
    { path: '/admin/dashboard/bookings', icon: CalendarDots, label: 'Bookings' },
    { path: '/admin/dashboard/clients', icon: Users, label: 'Clients' },
    { path: '/admin/dashboard/contacts', icon: EnvelopeSimple, label: 'Contacts' },
    { path: '/admin/dashboard/cms', icon: PencilSimpleLine, label: 'Website Editor' },
    { path: '/admin/dashboard/portfolio', icon: Images, label: 'Portfolio' },
    { path: '/admin/dashboard/home-services', icon: Layout, label: 'Home Services' },
    { path: '/admin/dashboard/content', icon: NotePencil, label: 'Site Content' },
    { path: '/admin/dashboard/packages', icon: Package, label: 'Packages' },
    { path: '/admin/dashboard/settings', icon: Gear, label: 'Settings' }
  ];

  const isActive = (path, exact = false) => { if (exact) return location.pathname === path; return location.pathname.startsWith(path) && path !== '/admin/dashboard'; };

  if (!admin) return null;

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex" data-testid="admin-dashboard">
      <aside className="w-64 bg-[#141414] border-r border-white/10 fixed h-full">
        <div className="p-6 border-b border-white/10"><div className="flex items-center gap-3"><img src="/logo.png" alt="SkyLine Media" className="h-10" /><div><span className="font-bold tracking-tight block text-[#d4af37]">SkyLine Media</span><span className="text-xs text-white/40">Admin Panel</span></div></div></div>
        <nav className="p-4">{navItems.map((item) => (
          <Link key={item.path} to={item.path} data-testid={`admin-nav-${item.label.toLowerCase()}`} className={`flex items-center gap-3 px-4 py-3 mb-1 transition-colors ${isActive(item.path, item.exact) || (item.exact && location.pathname === item.path) ? 'bg-[#d4af37] text-black' : 'text-white/60 hover:text-white hover:bg-white/5'}`}><item.icon size={20} />{item.label}</Link>
        ))}</nav>
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/10">
          <div className="flex items-center gap-3 mb-4 px-4"><div className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center"><Users size={16} /></div><div className="flex-1 min-w-0"><p className="text-sm font-medium truncate">{admin.name}</p><p className="text-xs text-white/40 truncate">{admin.email}</p></div></div>
          <button onClick={handleLogout} data-testid="admin-logout" className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-400 hover:bg-red-400/10 transition-colors"><SignOut size={18} />Sign Out</button>
        </div>
      </aside>
      <main className="flex-1 ml-64 p-8">
        <Routes>
          <Route index element={<AdminOverview />} />
          <Route path="bookings" element={<AdminBookings />} />
          <Route path="clients" element={<AdminClients />} />
          <Route path="contacts" element={<AdminContacts />} />
          <Route path="cms" element={<AdminCMSEditor />} />
          <Route path="portfolio" element={<AdminPortfolio />} />
          <Route path="home-services" element={<AdminHomeServices />} />
          <Route path="content" element={<AdminContent />} />
          <Route path="packages" element={<AdminPackages />} />
          <Route path="settings" element={<AdminSettings />} />
        </Routes>
      </main>
    </div>
  );
}

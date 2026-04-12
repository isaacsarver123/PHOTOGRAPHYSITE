import axios from 'axios';

export const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export const getAuthHeaders = () => {
  const token = localStorage.getItem('admin_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export function StatusBadge({ status }) {
  const colors = {
    pending: 'bg-yellow-500/20 text-yellow-400',
    approved: 'bg-orange-500/20 text-orange-400',
    awaiting_payment: 'bg-orange-500/20 text-orange-400',
    confirmed: 'bg-blue-500/20 text-blue-400',
    completed: 'bg-green-500/20 text-green-400',
    cancelled: 'bg-red-500/20 text-red-400',
    paid: 'bg-green-500/20 text-green-400',
    new: 'bg-purple-500/20 text-purple-400',
    contacted: 'bg-blue-500/20 text-blue-400',
    closed: 'bg-gray-500/20 text-gray-400'
  };
  return (
    <span className={`text-xs px-2 py-1 ${colors[status] || 'bg-white/10'}`}>
      {status}
    </span>
  );
}

export const inputCls = "w-full bg-white/5 border border-white/10 px-4 py-3 text-sm focus:border-[#d4af37] focus:outline-none";
export const textareaCls = `${inputCls} min-h-[80px] resize-y`;

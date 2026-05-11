'use client';

import { useState } from 'react';
import type { BankConfig } from '@tuvi/db';

export default function BankConfigClient({ initial }: { initial: BankConfig | null }) {
  const [bankName, setBankName] = useState(initial?.bankName ?? '');
  const [accountNumber, setAccountNumber] = useState(initial?.accountNumber ?? '');
  const [accountHolder, setAccountHolder] = useState(initial?.accountHolder ?? '');
  const [qrImageUrl, setQrImageUrl] = useState(initial?.qrImageUrl ?? '');
  const [refPrefix, setRefPrefix] = useState(initial?.refPrefix ?? 'VTV');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const onUpload = async (file: File) => {
    setUploading(true);
    setMsg(null);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/admin/bank-config/upload-qr', {
        method: 'POST',
        body: fd,
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
      setQrImageUrl(data.url);
      setMsg({ type: 'ok', text: 'Upload QR thành công' });
    } catch (e) {
      setMsg({ type: 'err', text: (e as Error).message });
    } finally {
      setUploading(false);
    }
  };

  const save = async () => {
    setSaving(true);
    setMsg(null);
    try {
      const res = await fetch('/api/admin/bank-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bankName,
          accountNumber,
          accountHolder,
          qrImageUrl,
          refPrefix,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
      setMsg({ type: 'ok', text: 'Đã lưu cấu hình bank' });
    } catch (e) {
      setMsg({ type: 'err', text: (e as Error).message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-3xl border border-[#4a6c7a]/45 bg-[#fbf3e2]/95 p-5 md:p-7">
      <h2 className="text-xl font-semibold mb-1">Cấu hình ngân hàng</h2>
      <p className="text-[13px] text-[#4a3a30] mb-5">
        Thông tin này hiển thị cho user ở trang ví. Upload ảnh QR (PNG/JPG &lt;
        500KB).
      </p>

      <div className="grid md:grid-cols-[200px_1fr] gap-6">
        <div>
          {qrImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={qrImageUrl}
              alt="QR"
              className="w-48 h-48 rounded-xl border border-[#4a6c7a]/30 bg-white p-2 object-contain"
            />
          ) : (
            <div className="w-48 h-48 rounded-xl border-2 border-dashed border-[#c89146]/55 flex items-center justify-center text-[12px] text-[#4a3a30]">
              Chưa có QR
            </div>
          )}
          <label className="mt-2 inline-block px-4 py-2 rounded-full bg-[#5a3a1a] text-[#fbf3e2] text-[12px] cursor-pointer hover:bg-[#4a6c7a]">
            {uploading ? 'Đang upload…' : 'Upload QR'}
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              hidden
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) onUpload(f);
                e.target.value = '';
              }}
            />
          </label>
        </div>

        <div className="space-y-3">
          <Field label="Tên ngân hàng" value={bankName} onChange={setBankName} placeholder="VD: Vietcombank" />
          <Field
            label="Số tài khoản"
            value={accountNumber}
            onChange={setAccountNumber}
            placeholder="VD: 0123456789"
          />
          <Field
            label="Chủ tài khoản"
            value={accountHolder}
            onChange={setAccountHolder}
            placeholder="VD: NGUYEN VAN A"
          />
          <Field
            label="URL QR (nếu có sẵn)"
            value={qrImageUrl}
            onChange={setQrImageUrl}
            placeholder="https://... hoặc upload bên trái"
          />
          <Field
            label="Prefix mã chuyển khoản"
            value={refPrefix}
            onChange={(v) => setRefPrefix(v.toUpperCase().slice(0, 6))}
            placeholder="VTV"
          />

          {msg && (
            <div
              className={`rounded-xl px-3 py-2 text-[13px] ${
                msg.type === 'ok'
                  ? 'border border-[#3a8a5e]/40 bg-[#3a8a5e]/10 text-[#2a6e48]'
                  : 'border border-[#c8361d]/40 bg-[#c8361d]/10 text-[#c8361d]'
              }`}
            >
              {msg.type === 'ok' ? '✓' : '⚠'} {msg.text}
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="button"
              onClick={save}
              disabled={saving}
              className="px-6 py-2.5 rounded-full bg-gradient-to-r from-[#5a3a1a] to-[#c89146] text-[#fbf3e2] font-semibold disabled:opacity-50"
            >
              {saving ? 'Đang lưu…' : 'Lưu cấu hình'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-[11px] tracking-[0.2em] uppercase text-[#4a3a30] font-semibold mb-1">
        {label}
      </label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full h-11 px-4 rounded-2xl border border-[#4a6c7a]/35 bg-[#fbf3e2] text-[14px] focus:outline-none focus:border-[#4a6c7a]"
      />
    </div>
  );
}

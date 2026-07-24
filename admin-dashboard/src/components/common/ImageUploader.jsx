import React, { useState } from 'react';
import { Image, FileText } from 'lucide-react';
import api from '../../services/api';

const ImageUploader = ({
  value,
  onChange,
  width = 80,
  height = 48,
  accept = 'image/jpeg,image/jpg,image/png,image/webp',
  label = 'Upload Image',
}) => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const handleFile = async (e) => {
    const file = e.target.files[0];
    e.target.value = ''; // allow re-selecting the same file after a failed attempt
    if (!file) return;
    setUploading(true);
    setError('');
    try {
      const fd = new FormData();
      fd.append('image', file);
      // Don't set Content-Type manually — axios/the browser needs to generate its own
      // multipart boundary for FormData, and a hardcoded header here overrides that and
      // breaks parsing on the server (req.file ends up undefined).
      const res = await api.post('/api/v1/admin/upload', fd);
      if (res.data?.status && res.data?.url) {
        onChange(res.data.url);
      } else {
        setError(res.data?.message || 'Upload failed. Please try again.');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Upload failed. Please try again.');
    }
    setUploading(false);
  };

  const isPdf = /\.pdf($|\?)/i.test(value ?? '');

  return (
    <div>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        {value ? (
          isPdf ? (
            <a href={value} target="_blank" rel="noreferrer" style={{ width, height, borderRadius: 6, border: '1px solid var(--c-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: 'var(--c-brand-primary)', background: '#f5f5f5' }}>
              <FileText size={20}/>
            </a>
          ) : (
            <img src={value} alt="preview" style={{ width, height, objectFit: 'cover', borderRadius: 6, border: '1px solid var(--c-border)', flexShrink: 0 }} />
          )
        ) : (
          <div style={{ width, height, borderRadius: 6, border: '2px dashed var(--c-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: 'var(--c-text-muted)' }}>
            <Image size={18}/>
          </div>
        )}
        <div>
          <label style={{ display: 'block' }}>
            <input type="file" accept={accept} style={{ display: 'none' }} onChange={handleFile} disabled={uploading} />
            <span className="btn btn-outline btn-sm" style={{ cursor: uploading ? 'default' : 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, opacity: uploading ? 0.6 : 1 }}>
              <Image size={12}/> {uploading ? 'Uploading…' : value ? 'Change' : label}
            </span>
          </label>
          {value && <button type="button" style={{ marginTop: 4, fontSize: 11, color: 'var(--c-danger)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }} onClick={() => onChange('')}>Remove</button>}
        </div>
      </div>
      {error && (
        <div style={{ marginTop: 6, fontSize: 12, color: 'var(--c-danger)' }}>{error}</div>
      )}
    </div>
  );
};

export default ImageUploader;

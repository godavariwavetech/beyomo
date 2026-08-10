import React, { useState } from 'react';
import { Image, FileText } from 'lucide-react';
import api from '../../services/api';

// Validates image dimensions using a hidden Image element.
// Returns a promise that resolves to { w, h } or rejects with an error string.
const checkDimensions = (file) =>
  new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new window.Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ w: img.naturalWidth, h: img.naturalHeight });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject('Could not read image dimensions.');
    };
    img.src = url;
  });

const ImageUploader = ({
  value,
  onChange,
  width = 80,
  height = 48,
  accept = 'image/jpeg,image/jpg,image/png,image/webp',
  label = 'Upload Image',
  hidePreview = false,
  // Required exact dimensions — leave undefined to skip dimension check
  exactWidth,
  exactHeight,
  // Hint text shown below the button
  sizeHint,
}) => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const handleFile = async (e) => {
    const file = e.target.files[0];
    e.target.value = '';
    if (!file) return;

    // Size check
    if (file.size > 2 * 1024 * 1024) {
      setError('File too large — max 2 MB.');
      return;
    }

    // Dimension check (only for images, not PDFs)
    if ((exactWidth || exactHeight) && file.type.startsWith('image/')) {
      try {
        const { w, h } = await checkDimensions(file);
        if (exactWidth && exactHeight && (w !== exactWidth || h !== exactHeight)) {
          setError(`Wrong size: image is ${w}×${h} px. Required: ${exactWidth}×${exactHeight} px.`);
          return;
        }
      } catch (dimErr) {
        setError(dimErr);
        return;
      }
    }

    setUploading(true);
    setError('');
    try {
      const fd = new FormData();
      fd.append('image', file);
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

  // Default hint text
  const hint = sizeHint ||
    (exactWidth && exactHeight
      ? `JPG/PNG/WebP · max 2 MB · ${exactWidth}×${exactHeight} px`
      : 'JPG/PNG/WebP · max 2 MB');

  return (
    <div>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        {!hidePreview && (value ? (
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
        ))}
        <div>
          <label style={{ display: 'block' }}>
            <input type="file" accept={accept} style={{ display: 'none' }} onChange={handleFile} disabled={uploading} />
            <span className="btn btn-outline btn-sm" style={{ cursor: uploading ? 'default' : 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, opacity: uploading ? 0.6 : 1 }}>
              <Image size={12}/> {uploading ? 'Uploading…' : value ? 'Change' : label}
            </span>
          </label>
          <div style={{ marginTop: 4, fontSize: 11, color: 'var(--c-text-muted)' }}>{hint}</div>
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

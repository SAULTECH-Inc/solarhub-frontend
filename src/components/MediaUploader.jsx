import { useState, useRef, useCallback } from 'react';
import api from '../lib/apiClient';

/**
 * MediaUploader — reusable drag-drop uploader for images + videos.
 *
 * Props:
 *   value       : array of { url, resourceType } already uploaded
 *   onChange    : (newList) => void   — called after successful upload(s)
 *   folder      : Cloudinary folder   (default: 'general')
 *   maxFiles    : max total files      (default: 10)
 *   accept      : MIME accept string   (default: 'image/*,video/*')
 *   label       : section label text
 *   avatarMode  : single-avatar upload mode (circular preview, no multi)
 */
export default function MediaUploader({
  value = [],
  onChange,
  folder = 'general',
  maxFiles = 10,
  accept = 'image/*,video/*',
  label = 'Photos & Videos',
  avatarMode = false,
}) {
  const inputRef = useRef();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [dragOver, setDragOver] = useState(false);

  async function handleFiles(files) {
    const fileArr = Array.from(files);
    if (!fileArr.length) return;

    if (!avatarMode && value.length + fileArr.length > maxFiles) {
      setError(`Max ${maxFiles} files allowed`);
      return;
    }

    setError(null);
    setUploading(true);

    try {
      if (avatarMode) {
        // Single avatar upload
        const fd = new FormData();
        fd.append('file', fileArr[0]);
        const res = await api.post('/uploads/avatar', fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        const result = res?.data ?? res;
        onChange?.([{ url: result.url, publicId: result.publicId, resourceType: 'image' }]);
      } else {
        // Multiple images + videos
        const fd = new FormData();
        fileArr.forEach(f => fd.append('files', f));
        const res = await api.post(`/uploads/media-multiple?folder=${folder}`, fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        const results = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []);
        onChange?.([...value, ...results]);
      }
    } catch (e) {
      setError(e.response?.data?.message || e.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  }

  function remove(idx) {
    onChange?.(value.filter((_, i) => i !== idx));
  }

  const onDrop = useCallback(e => {
    e.preventDefault();
    setDragOver(false);
    handleFiles(e.dataTransfer.files);
  }, [value]);

  // ── Avatar mode ──────────────────────────────────────────
  if (avatarMode) {
    const current = value[0];
    return (
      <div className="flex flex-col items-center gap-3">
        <div
          onClick={() => !uploading && inputRef.current?.click()}
          className="relative w-24 h-24 rounded-full cursor-pointer group"
        >
          {current?.url ? (
            <img src={current.url} alt="Avatar"
              className="w-24 h-24 rounded-full object-cover border-4 border-solar-accent/30" />
          ) : (
            <div className="w-24 h-24 rounded-full bg-solar-surface border-2 border-dashed border-solar-border
                            flex items-center justify-center text-3xl text-solar-dim group-hover:border-solar-accent/50 transition-all">
              👤
            </div>
          )}
          <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center
                          opacity-0 group-hover:opacity-100 transition-opacity">
            {uploading
              ? <span className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              : <span className="text-white text-xs font-medium">Upload</span>}
          </div>
        </div>
        {error && <p className="text-red-400 text-xs">{error}</p>}
        <input ref={inputRef} type="file" accept="image/*" className="hidden"
          onChange={e => handleFiles(e.target.files)} />
      </div>
    );
  }

  // ── Multi-file mode ───────────────────────────────────────
  return (
    <div className="space-y-3">
      {label && (
        <div className="text-xs font-medium text-solar-muted">
          {label}
          <span className="text-solar-dim ml-1">({value.length}/{maxFiles})</span>
        </div>
      )}

      {/* Drop zone */}
      {value.length < maxFiles && (
        <div
          onClick={() => !uploading && inputRef.current?.click()}
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all
            ${dragOver
              ? 'border-solar-accent bg-solar-accent/10'
              : 'border-solar-border hover:border-solar-accent/50 hover:bg-solar-surface'}`}
        >
          {uploading ? (
            <div className="flex flex-col items-center gap-2">
              <span className="w-8 h-8 border-2 border-solar-accent/30 border-t-solar-accent rounded-full animate-spin" />
              <span className="text-xs text-solar-muted">Uploading to Cloudinary…</span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <span className="text-3xl">📸</span>
              <div>
                <p className="text-sm font-medium text-solar-text">Drag & drop or click to upload</p>
                <p className="text-xs text-solar-dim mt-0.5">Images (JPG, PNG, WebP) · Videos (MP4, MOV) · Max 10 files</p>
              </div>
            </div>
          )}
        </div>
      )}

      {error && <p className="text-red-400 text-xs">{error}</p>}

      {/* Previews grid */}
      {value.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {value.map((item, idx) => (
            <div key={idx} className="relative group rounded-xl overflow-hidden bg-solar-surface aspect-square">
              {item.resourceType === 'video' ? (
                <video src={item.url} className="w-full h-full object-cover" muted playsInline />
              ) : (
                <img src={item.url} alt={`Upload ${idx + 1}`} className="w-full h-full object-cover" />
              )}
              {/* Overlay */}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity
                              flex items-center justify-center gap-2">
                {item.resourceType === 'video' && (
                  <span className="absolute top-1 left-1 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded">▶ Video</span>
                )}
                {idx === 0 && (
                  <span className="absolute top-1 right-1 bg-solar-accent text-black text-[10px] px-1.5 py-0.5 rounded font-medium">Main</span>
                )}
                <button
                  onClick={e => { e.stopPropagation(); remove(idx); }}
                  className="w-7 h-7 bg-red-500 rounded-full flex items-center justify-center text-white text-sm hover:bg-red-600 transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={!avatarMode}
        className="hidden"
        onChange={e => handleFiles(e.target.files)}
      />
    </div>
  );
}

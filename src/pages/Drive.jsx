import { useEffect, useState, useRef } from 'react'
import { useGoogle } from '../context/GoogleContext'
import styles from './Drive.module.css'

const FOLDERS = [
  { name: 'Work', icon: '💼', query: 'Work' },
  { name: 'School', icon: '🎓', query: 'School' },
  { name: 'Game Dev', icon: '🎮', query: 'Unity' },
  { name: 'Archive', icon: '📦', query: 'Archive' },
]

const MIME_ICONS = {
  'application/vnd.google-apps.document': '📄',
  'application/vnd.google-apps.spreadsheet': '📊',
  'application/vnd.google-apps.presentation': '📋',
  'application/vnd.google-apps.folder': '📁',
  'application/pdf': '📕',
  'image/jpeg': '🖼',
  'image/png': '🖼',
  'image/gif': '🖼',
  'text/plain': '📝',
}

const PREVIEWABLE = ['application/pdf', 'image/jpeg', 'image/png', 'image/gif', 'image/webp']

function timeAgo(str) {
  if (!str) return ''
  const d = new Date(str), now = new Date()
  const diff = Math.floor((now - d) / 86400000)
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Yesterday'
  if (diff < 7) return `${diff}d ago`
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

function fileIcon(mime) {
  return MIME_ICONS[mime] || '📄'
}

// Filter out system/cache files
function isRealFile(f) {
  const skip = ['.sqlite', '.wal', '.shm', '.db', '.tmp', 'Thumbs.db', '.DS_Store']
  return !skip.some(s => f.name.toLowerCase().includes(s.toLowerCase()))
}

export default function Drive() {
  const { token, gFetch, login } = useGoogle()
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [search, setSearch] = useState('')
  const [preview, setPreview] = useState(null)
  const [activeFolder, setActiveFolder] = useState('Recent')
  const fileRef = useRef()

  const loadFiles = (folder = 'Recent') => {
    if (!token) return
    setLoading(true)
    let url = 'https://www.googleapis.com/drive/v3/files?pageSize=30&fields=files(id,name,mimeType,modifiedTime,webViewLink,thumbnailLink,size)'
    if (folder === 'Recent') {
      url += '&orderBy=viewedByMeTime desc'
    } else {
      const q = FOLDERS.find(f => f.name === folder)?.query || folder
      url += `&orderBy=modifiedTime desc&q=name contains '${q}'`
    }
    gFetch(url).then(data => {
      const filtered = (data?.files || []).filter(isRealFile)
      setFiles(filtered)
      setLoading(false)
    })
  }

  useEffect(() => { if (token) loadFiles(activeFolder) }, [token, activeFolder])

  const handleUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file || !token) return
    setUploading(true)
    try {
      const metadata = { name: file.name }
      const form = new FormData()
      form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }))
      form.append('file', file)
      const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: form
      })
      if (res.ok) loadFiles(activeFolder)
    } catch(err) { console.error(err) }
    setUploading(false)
    e.target.value = ''
  }

  const handleFileClick = (f) => {
    if (PREVIEWABLE.includes(f.mimeType)) {
      setPreview(f)
    } else {
      window.open(f.webViewLink, '_blank')
    }
  }

  const filtered = files.filter(f => f.name.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className={styles.wrap}>
      {!token && (
        <div className={styles.banner}>
          <span>Connect Google Drive to see your files</span>
          <button className={styles.bannerBtn} onClick={login}>Connect →</button>
        </div>
      )}

      <div className={styles.layout}>
        <div className={styles.sidebar}>
          <div className={styles.sidebarHead}>My Drive</div>
          {['Recent', ...FOLDERS.map(f => f.name)].map(name => (
            <button key={name}
              className={`${styles.folderBtn} ${activeFolder === name ? styles.folderActive : ''}`}
              onClick={() => { setActiveFolder(name); setSearch('') }}
            >
              {name === 'Recent' ? '🕐' : FOLDERS.find(f=>f.name===name)?.icon} {name}
            </button>
          ))}
          <div className={styles.sidebarDivider} />
          {token && (
            <>
              <button className={styles.uploadBtn} onClick={() => fileRef.current?.click()} disabled={uploading}>
                {uploading ? '⟳ Uploading…' : '↑ Upload file'}
              </button>
              <input ref={fileRef} type="file" style={{ display: 'none' }} onChange={handleUpload} />
            </>
          )}
        </div>

        <div className={styles.main}>
          <div className={styles.toolbar}>
            <input className={styles.search} placeholder="Search files…" value={search}
              onChange={e => setSearch(e.target.value)} />
          </div>

          {loading && <p className={styles.loading}>Loading…</p>}

          <div className={styles.fileList}>
            <div className={styles.fileHeader}>
              <span>Name</span>
              <span>Modified</span>
            </div>
            {filtered.length === 0 && !loading && (
              <p className={styles.empty}>No files found</p>
            )}
            {filtered.map(f => (
              <div key={f.id} className={styles.file} onClick={() => handleFileClick(f)}>
                <span className={styles.fileIcon}>{fileIcon(f.mimeType)}</span>
                <span className={styles.fileName}>{f.name}</span>
                <span className={styles.fileDate}>{timeAgo(f.modifiedTime)}</span>
              </div>
            ))}
          </div>
        </div>

        {preview && (
          <div className={styles.previewPanel}>
            <div className={styles.previewHead}>
              <span className={styles.previewName}>{preview.name}</span>
              <div className={styles.previewActions}>
                <a href={preview.webViewLink} target="_blank" rel="noreferrer" className={styles.openBtn}>Open in Drive ↗</a>
                <button className={styles.closeBtn} onClick={() => setPreview(null)}>✕</button>
              </div>
            </div>
            <div className={styles.previewBody}>
              {preview.mimeType.startsWith('image/') ? (
                <img src={`https://drive.google.com/thumbnail?id=${preview.id}&sz=w800`} alt={preview.name} className={styles.previewImg} />
              ) : preview.mimeType === 'application/pdf' ? (
                <iframe
                  src={`https://drive.google.com/file/d/${preview.id}/preview`}
                  className={styles.previewFrame}
                  title={preview.name}
                />
              ) : (
                <div className={styles.previewFallback}>
                  <p>Preview not available</p>
                  <a href={preview.webViewLink} target="_blank" rel="noreferrer" className={styles.openBtn}>Open in Google Drive ↗</a>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

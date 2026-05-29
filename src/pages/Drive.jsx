import { useEffect, useState, useRef } from 'react'
import { useGoogle } from '../context/GoogleContext'
import styles from './Drive.module.css'

const MIME_ICONS = {
  'application/vnd.google-apps.document': '📄',
  'application/vnd.google-apps.spreadsheet': '📊',
  'application/vnd.google-apps.presentation': '📋',
  'application/vnd.google-apps.folder': '📁',
  'application/pdf': '📕',
  'image/jpeg': '🖼', 'image/png': '🖼', 'image/gif': '🖼', 'image/webp': '🖼',
  'text/plain': '📝',
}
const PREVIEWABLE_IMAGE = ['image/jpeg','image/png','image/gif','image/webp']

function fileIcon(mime) { return MIME_ICONS[mime] || '📄' }
function isFolder(f) { return f.mimeType === 'application/vnd.google-apps.folder' }
function isSystem(f) {
  const skip = ['.sqlite','.wal','.shm','.db','.tmp','Thumbs.db','.DS_Store','.localized']
  return skip.some(s => f.name.toLowerCase().endsWith(s))
}
function timeAgo(str) {
  if (!str) return ''
  const d = new Date(str), now = new Date()
  const diff = Math.floor((now - d) / 86400000)
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Yesterday'
  if (diff < 7) return `${diff}d ago`
  return d.toLocaleDateString('en-GB',{day:'numeric',month:'short'})
}

export default function Drive() {
  const { token, gFetch, login } = useGoogle()
  const [rootFolders, setRootFolders] = useState([])
  const [currentFolder, setCurrentFolder] = useState(null) // null = My Drive root
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [search, setSearch] = useState('')
  const [preview, setPreview] = useState(null)
  const [breadcrumbs, setBreadcrumbs] = useState([])
  const fileRef = useRef()

  // Load root folders
  useEffect(() => {
    if (!token) return
    gFetch(`https://www.googleapis.com/drive/v3/files?q='root' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false&orderBy=name&fields=files(id,name,mimeType)`)
      .then(data => setRootFolders(data?.files || []))
      .catch(() => {})
  }, [token])

  // Load folder contents
  const loadFolder = (folderId, folderName, newBreadcrumbs) => {
    if (!token) return
    setCurrentFolder(folderId)
    setBreadcrumbs(newBreadcrumbs || [])
    setSearch('')
    setLoading(true)
    const parentId = folderId || 'root'
    gFetch(`https://www.googleapis.com/drive/v3/files?q='${parentId}' in parents and trashed=false&orderBy=folder,name&fields=files(id,name,mimeType,modifiedTime,webViewLink,size)&pageSize=50`)
      .then(data => {
        setFiles((data?.files || []).filter(f => !isSystem(f)))
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }

  useEffect(() => {
    if (token) loadFolder(null, 'My Drive', [])
  }, [token])

  const handleUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file || !token) return
    setUploading(true)
    try {
      const metadata = {
        name: file.name,
        ...(currentFolder ? { parents: [currentFolder] } : {})
      }
      const form = new FormData()
      form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }))
      form.append('file', file)
      const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: form
      })
      if (res.ok) loadFolder(currentFolder, null, breadcrumbs)
    } catch(err) { console.error(err) }
    setUploading(false)
    e.target.value = ''
  }

  const handleFileClick = (f) => {
    if (isFolder(f)) {
      const newCrumbs = [...breadcrumbs, { id: currentFolder, name: breadcrumbs.length === 0 ? 'My Drive' : breadcrumbs[breadcrumbs.length-1]?.name }]
      loadFolder(f.id, f.name, newCrumbs)
    } else if (PREVIEWABLE_IMAGE.includes(f.mimeType)) {
      setPreview(f)
    } else if (f.mimeType === 'application/pdf') {
      setPreview(f)
    } else {
      window.open(f.webViewLink, '_blank')
    }
  }

  const goToBreadcrumb = (idx) => {
    if (idx < 0) {
      loadFolder(null, 'My Drive', [])
    } else {
      const crumb = breadcrumbs[idx]
      loadFolder(crumb.id, crumb.name, breadcrumbs.slice(0, idx))
    }
  }

  const filtered = files.filter(f => f.name.toLowerCase().includes(search.toLowerCase()))
  const currentName = breadcrumbs.length > 0 ? breadcrumbs[breadcrumbs.length-1]?.name : 'My Drive'

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
          <button
            className={`${styles.folderBtn} ${!currentFolder && breadcrumbs.length === 0 ? styles.folderActive : ''}`}
            onClick={() => loadFolder(null, 'My Drive', [])}
          >📁 All files</button>
          {rootFolders.map(f => (
            <button key={f.id}
              className={`${styles.folderBtn} ${currentFolder === f.id ? styles.folderActive : ''}`}
              onClick={() => loadFolder(f.id, f.name, [{ id: null, name: 'My Drive' }])}
            >📁 {f.name}</button>
          ))}
          <div className={styles.sidebarDivider} />
          {token && (
            <>
              <button className={styles.uploadBtn} onClick={() => fileRef.current?.click()} disabled={uploading}>
                {uploading ? '⟳ Uploading…' : '↑ Upload file'}
              </button>
              <input ref={fileRef} type="file" style={{display:'none'}} onChange={handleUpload} />
            </>
          )}
        </div>

        <div className={styles.main}>
          <div className={styles.toolbar}>
            <div className={styles.breadcrumb}>
              <button className={styles.crumbBtn} onClick={() => goToBreadcrumb(-1)}>My Drive</button>
              {breadcrumbs.slice(1).map((c, i) => (
                <span key={i}>
                  <span className={styles.crumbSep}>/</span>
                  <button className={styles.crumbBtn} onClick={() => goToBreadcrumb(i+1)}>{c.name}</button>
                </span>
              ))}
              {currentFolder && (
                <span>
                  <span className={styles.crumbSep}>/</span>
                  <span className={styles.crumbCurrent}>{files.length > 0 ? '' : '…'}</span>
                </span>
              )}
            </div>
            <input className={styles.search} placeholder="Search…" value={search}
              onChange={e => setSearch(e.target.value)} />
          </div>

          <div className={styles.fileList}>
            <div className={styles.fileHeader}>
              <span>Name</span>
              <span>Modified</span>
            </div>
            {loading && <p className={styles.loading}>Loading…</p>}
            {!loading && filtered.length === 0 && <p className={styles.empty}>No files</p>}
            {filtered.map(f => (
              <div key={f.id} className={`${styles.file} ${isFolder(f) ? styles.folderFile : ''}`}
                onClick={() => handleFileClick(f)}>
                <span className={styles.fileIcon}>{fileIcon(f.mimeType)}</span>
                <span className={styles.fileName}>{f.name}</span>
                <span className={styles.fileDate}>{isFolder(f) ? '—' : timeAgo(f.modifiedTime)}</span>
              </div>
            ))}
          </div>
        </div>

        {preview && (
          <div className={styles.previewPanel}>
            <div className={styles.previewHead}>
              <span className={styles.previewName}>{preview.name}</span>
              <div className={styles.previewActions}>
                <a href={preview.webViewLink} target="_blank" rel="noreferrer" className={styles.openBtn}>Open ↗</a>
                <button className={styles.closeBtn} onClick={() => setPreview(null)}>✕</button>
              </div>
            </div>
            <div className={styles.previewBody}>
              {PREVIEWABLE_IMAGE.includes(preview.mimeType) ? (
                <img src={`https://drive.google.com/thumbnail?id=${preview.id}&sz=w800`}
                  alt={preview.name} className={styles.previewImg} />
              ) : (
                <iframe src={`https://drive.google.com/file/d/${preview.id}/preview`}
                  className={styles.previewFrame} title={preview.name} />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

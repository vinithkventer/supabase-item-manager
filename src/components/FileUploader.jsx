import { useState } from 'react'
import { supabase } from '../supabaseClient'

export default function FileUploader({ item }) {
  const [file, setFile] = useState(null)
  const [fileType, setFileType] = useState('drawing')
  const [version, setVersion] = useState(1)
  const [isLatest, setIsLatest] = useState(true)
  const [loading, setLoading] = useState(false)

  const upload = async (e) => {
    e.preventDefault()
    if (!file) return alert('Pick a file')
    setLoading(true)
    try {
      const ext = file.name.split('.').pop()
      const path = `items/${item.id}/${fileType}/v${version}/${Date.now()}.${ext}`
      const { error: upErr } = await supabase.storage.from('files').upload(path, file)
      if (upErr) throw upErr

      const { error: insErr } = await supabase.from('files').insert({
        item_id: item.id,
        file_type: fileType,
        version: Number(version),
        path,
        is_latest: isLatest
      })
      if (insErr) throw insErr
      alert('Uploaded!')
    } catch (err) {
      alert(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={upload} style={{display:'flex', gap:8, alignItems:'center', flexWrap:'wrap'}}>
      <select value={fileType} onChange={(e)=>setFileType(e.target.value)}>
        <option value="drawing">Drawing</option>
        <option value="certificate">Certificate</option>
        <option value="other">Other</option>
      </select>
      <input type="number" min="1" value={version} onChange={(e)=>setVersion(e.target.value)} placeholder="Version" style={{width:100}} />
      <label style={{display:'flex', gap:6, alignItems:'center'}}>
        <input type="checkbox" checked={isLatest} onChange={(e)=>setIsLatest(e.target.checked)} />
        Mark as latest
      </label>
      <input type="file" onChange={(e)=>setFile(e.target.files?.[0] || null)} />
      <button disabled={loading} type="submit">{loading ? 'Uploading...' : 'Upload'}</button>
    </form>
  )
}
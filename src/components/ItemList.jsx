import React, { useEffect, useMemo, useState } from 'react'
import { supabase } from '../supabaseClient'

// ItemList.jsx — with Drawings (latest + older), Certificates/Other uploads & downloads
export default function ItemList() {
  const [items, setItems] = useState([])
  const [selected, setSelected] = useState(null)
  const [files, setFiles] = useState([])
  const [loadingFiles, setLoadingFiles] = useState(false)

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all') // all | active | inactive
  const [saving, setSaving] = useState(false)

  useEffect(() => { fetchItems() }, [])

  async function fetchItems() {
    const { data, error } = await supabase
      .from('items')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) return alert(error.message)
    setItems(data || [])
  }

  async function loadFiles(itemId) {
    setLoadingFiles(true)
    const { data, error } = await supabase
      .from('files')
      .select('*')
      .eq('item_id', itemId)
      .order('version', { ascending: false })
    setLoadingFiles(false)
    if (error) return alert(error.message)
    setFiles(data || [])
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return (items || []).filter(i => {
      const inQuery = !q || [i.item_code, i.item_name, i.material, i.vendor, i.remarks]
        .filter(Boolean)
        .some(v => String(v).toLowerCase().includes(q))
      const isActive = i.active !== false
      const inStatus = statusFilter === 'all' || (statusFilter === 'active' ? isActive : !isActive)
      return inQuery && inStatus
    })
  }, [items, search, statusFilter])

  function exportCSV() {
    const headers = ['Item Code','Item Name','Material','Vendor','Remarks','Status','Created At']
    const rows = filtered.map(i => [i.item_code, i.item_name, i.material || '', i.vendor || '', i.remarks || '', (i.active === false ? 'Inactive' : 'Active'), new Date(i.created_at).toISOString()])
    const csv = [headers, ...rows]
  .map(r =>
    r
      .map(cell => {
        const val = (cell ?? '').toString()
        const needsQuotes =
          val.includes(',') || val.includes('"') || val.includes('\n')
        return needsQuotes ? '"' + val.replace(/"/g, '""') + '"' : val
      })
      .join(',')
  )
  .join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'items_export.csv'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  async function saveItem(updates) {
    if (!selected) return
    setSaving(true)
    const { data, error } = await supabase
      .from('items')
      .update({
        item_code: updates.item_code.trim(),
        item_name: updates.item_name.trim(),
        material: (updates.material || '').trim() || null,
        vendor: (updates.vendor || '').trim() || null,
        remarks: (updates.remarks || '').trim() || null,
        active: !!updates.active,
      })
      .eq('id', selected.id)
      .select()
    setSaving(false)
    if (error) return alert(error.message)
    // refresh list + selection
    await fetchItems()
    const fresh = data?.[0]
    setSelected(fresh || updates)
    alert('Saved!')
  }

  async function onSelectRow(i) {
    setSelected(i)
    await loadFiles(i.id)
  }

  return (
    <div style={{display:'grid', gridTemplateColumns: selected ? '1fr 1fr' : '1fr', gap:16}}>
      {/* LEFT: controls + table */}
      <div>
        <div style={{display:'flex', gap:8, alignItems:'center', flexWrap:'wrap', marginBottom:12}}>
          <input
            value={search}
            onChange={(e)=>setSearch(e.target.value)}
            placeholder="Search code, name, material, vendor, remarks"
            style={{flex:'1 1 320px', padding:8}}
          />
          <select value={statusFilter} onChange={(e)=>setStatusFilter(e.target.value)} style={{padding:8}}>
            <option value="all">All</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <button onClick={exportCSV}>Export CSV</button>
        </div>

        <div style={{fontSize:12, opacity:0.7, marginBottom:6}}>Showing {filtered.length} of {items.length} items</div>

        <table style={{width:'100%', borderCollapse:'collapse'}}>
          <thead>
            <tr>
              <th style={{textAlign:'left', borderBottom:'1px solid #ddd', padding:'8px'}}>Item Code</th>
              <th style={{textAlign:'left', borderBottom:'1px solid #ddd', padding:'8px'}}>Item Name</th>
              <th style={{textAlign:'left', borderBottom:'1px solid #ddd', padding:'8px'}}>Material</th>
              <th style={{textAlign:'left', borderBottom:'1px solid #ddd', padding:'8px'}}>Vendor</th>
              <th style={{textAlign:'left', borderBottom:'1px solid #ddd', padding:'8px'}}>Remarks</th>
              <th style={{textAlign:'left', borderBottom:'1px solid #ddd', padding:'8px'}}>Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(i => (
              <tr
                key={i.id}
                onClick={()=> onSelectRow(i)}
                style={{cursor:'pointer', backgroundColor: selected?.id === i.id ? '#f5faff' : 'transparent'}}
                title="Click to select"
              >
                <td style={{borderBottom:'1px solid #f0f0f0', padding:'8px'}}>{i.item_code}</td>
                <td style={{borderBottom:'1px solid #f0f0f0', padding:'8px'}}>{i.item_name}</td>
                <td style={{borderBottom:'1px solid #f0f0f0', padding:'8px'}}>{i.material}</td>
                <td style={{borderBottom:'1px solid #f0f0f0', padding:'8px'}}>{i.vendor}</td>
                <td style={{borderBottom:'1px solid #f0f0f0', padding:'8px', maxWidth:320, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}} title={i.remarks || ''}>{i.remarks || '-'}</td>
                <td style={{borderBottom:'1px solid #f0f0f0', padding:'8px'}}>{i.active === false ? 'Inactive' : 'Active'}</td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={6} style={{padding:12, opacity:0.6}}>No items match your search/filters.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* RIGHT: details/editor + files */}
      {selected && (
        <div style={{borderLeft:'1px solid #eee', paddingLeft:16}}>
          <h3 style={{marginTop:0}}>{selected.item_name} <span style={{opacity:0.6}}>({selected.item_code})</span></h3>
          <SimpleEditor key={selected.id} item={selected} onSave={saveItem} saving={saving} />

          <div style={{marginTop:16}}>
            <h4 style={{margin:'12px 0 8px'}}>Files</h4>
            <FileUploader item={selected} onUploaded={() => loadFiles(selected.id)} />

            {loadingFiles ? (
              <div style={{opacity:0.7}}>Loading files…</div>
            ) : (
              <>
                <FileSection title="Drawings (latest + older)" files={files.filter(f => f.file_type === 'drawing')} />
                <FileSection title="Test Certificates" files={files.filter(f => f.file_type === 'certificate')} />
                <FileSection title="Other Files" files={files.filter(f => f.file_type === 'other')} />
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function SimpleEditor({ item, onSave, saving }) {
  const [form, setForm] = useState({
    item_code: item.item_code || '',
    item_name: item.item_name || '',
    material: item.material || '',
    vendor: item.vendor || '',
    remarks: item.remarks || '',
    active: item.active !== false,
  })

  function submit(e){
    e.preventDefault()
    onSave(form)
  }

  return (
    <form onSubmit={submit} style={{display:'grid', gap:8, gridTemplateColumns:'repeat(2, minmax(0,1fr))'}}>
      <label style={{display:'grid', gap:4}}>
        <span style={{fontSize:12, opacity:0.7}}>Item Code</span>
        <input value={form.item_code} onChange={(e)=>setForm({...form, item_code: e.target.value})} required />
      </label>
      <label style={{display:'grid', gap:4}}>
        <span style={{fontSize:12, opacity:0.7}}>Item Name</span>
        <input value={form.item_name} onChange={(e)=>setForm({...form, item_name: e.target.value})} required />
      </label>
      <label style={{display:'grid', gap:4}}>
        <span style={{fontSize:12, opacity:0.7}}>Material</span>
        <input value={form.material} onChange={(e)=>setForm({...form, material: e.target.value})} />
      </label>
      <label style={{display:'grid', gap:4}}>
        <span style={{fontSize:12, opacity:0.7}}>Vendor</span>
        <input value={form.vendor} onChange={(e)=>setForm({...form, vendor: e.target.value})} />
      </label>
      <label style={{display:'grid', gap:4, gridColumn:'1 / -1'}}>
        <span style={{fontSize:12, opacity:0.7}}>Remarks</span>
        <textarea rows={3} value={form.remarks} onChange={(e)=>setForm({...form, remarks: e.target.value})} />
      </label>
      <label style={{display:'flex', alignItems:'center', gap:8}}>
        <input type="checkbox" checked={!!form.active} onChange={(e)=>setForm({...form, active: e.target.checked})} />
        <span>Active</span>
      </label>
      <div style={{gridColumn:'1 / -1', display:'flex', gap:8}}>
        <button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save changes'}</button>
      </div>
    </form>
  )
}

function FileSection({ title, files }) {
  // Latest is the highest version flagged as is_latest, else first row
  const latest = files.find(f => f.is_latest) || files[0]
  const older = files.filter(f => f.id !== latest?.id)

  return (
    <div style={{marginBottom:16}}>
      <div style={{fontWeight:600, marginBottom:6}}>{title}</div>
      {latest ? (
        <LatestFileRow file={latest} />
      ) : (
        <div style={{opacity:0.6}}>No files yet.</div>
      )}
      {older.length > 0 && (
        <details style={{marginTop:6}}>
          <summary>Older versions</summary>
          <ul>
            {older.map(f => (
              <li key={f.id}><FileLink f={f} /></li>
            ))}
          </ul>
        </details>
      )}
    </div>
  )
}

function LatestFileRow({ file }) {
  return (
    <div>
      <span style={{fontWeight:500}}>Latest:</span> <FileLink f={file} />
    </div>
  )
}

function FileLink({ f }) {
  const [url, setUrl] = useState(null)
  useEffect(() => {
    let cancelled = false
    async function run() {
      const { data, error } = await supabase.storage.from('files').createSignedUrl(f.path, 3600)
      if (!cancelled) setUrl(data?.signedUrl || null)
    }
    run()
    return () => { cancelled = true }
  }, [f.path])
  return <a href={url || '#'} target="_blank" rel="noreferrer">v{f.version} · {f.original_name || f.path.split('/').pop()}</a>
}

function FileUploader({ item, onUploaded }) {
  const [file, setFile] = useState(null)
  const [kind, setKind] = useState('drawing') // drawing | certificate | other
  const [uploading, setUploading] = useState(false)

  async function handleUpload(e){
    e.preventDefault()
    if (!file) return alert('Choose a file first')

    setUploading(true)

    // Determine next version for drawings; for others we keep version=1 (or next as well)
    const { data: existing, error: err1 } = await supabase
      .from('files')
      .select('id, version, file_type, is_latest')
      .eq('item_id', item.id)
      .eq('file_type', kind)
      .order('version', { ascending: false })

    if (err1) { setUploading(false); return alert(err1.message) }

    const nextVersion = (existing?.[0]?.version || 0) + 1

    // Storage path: itemId/kind/vX_originalName
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
    const path = `${item.id}/${kind}/v${nextVersion}_${safeName}`

    const { error: upErr } = await supabase.storage.from('files').upload(path, file, { upsert: false })
    if (upErr) { setUploading(false); return alert(upErr.message) }

    // Mark previous latest=false when uploading a new drawing/certificate/other
    if (existing && existing.length > 0) {
      await supabase.from('files').update({ is_latest: false }).eq('item_id', item.id).eq('file_type', kind).eq('is_latest', true)
    }

    const { error: insErr } = await supabase
      .from('files')
      .insert({
        item_id: item.id,
        file_type: kind,
        version: nextVersion,
        is_latest: true,
        path,
        original_name: file.name,
      })

    setUploading(false)
    if (insErr) return alert(insErr.message)
    setFile(null)
    onUploaded?.()
  }

  return (
    <form onSubmit={handleUpload} style={{display:'flex', gap:8, alignItems:'center', flexWrap:'wrap', margin:'8px 0 12px'}}>
      <select value={kind} onChange={(e)=>setKind(e.target.value)} style={{padding:6}}>
        <option value="drawing">Drawing</option>
        <option value="certificate">Certificate</option>
        <option value="other">Other</option>
      </select>
      <input type="file" onChange={(e)=>setFile(e.target.files?.[0] || null)} />
      <button type="submit" disabled={uploading}>{uploading ? 'Uploading…' : 'Upload'}</button>
    </form>
  )
}

import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import FileUploader from './FileUploader'

function FileRow({ f }) {
  const [url, setUrl] = useState(null)
  useEffect(() => {
    let cancelled = false
    async function run() {
      const { data, error } = await supabase.storage.from('files').createSignedUrl(f.path, 60*60)
      if (!cancelled) {
        if (error) console.error(error)
        setUrl(data?.signedUrl || null)
      }
    }
    run()
    return () => { cancelled = True }
  }, [f.path])

  return (
    <li style={{display:'flex', gap:8, alignItems:'center'}}>
      <span>v{f.version}</span>
      <a href={url || '#'} target="_blank" rel="noreferrer">{f.file_type}</a>
      {f.is_latest ? <span style={{fontSize:12, padding:'2px 6px', border:'1px solid #aaa', borderRadius:6}}>latest</span> : null}
    </li>
  )
}

export default function ItemList() {
  const [items, setItems] = useState([])
  const [selected, setSelected] = useState(null)
  const [files, setFiles] = useState([])

  const loadItems = async () => {
    const { data, error } = await supabase.from('items').select('*').order('created_at', { ascending: false })
    if (error) alert(error.message)
    else setItems(data || [])
  }

  const loadFiles = async (itemId) => {
    const { data, error } = await supabase
      .from('files')
      .select('*')
      .eq('item_id', itemId)
      .order('version', { ascending: false })
    if (error) alert(error.message)
    else setFiles(data || [])
  }

  useEffect(()=>{ loadItems() }, [])

  return (
    <div style={{display:'grid', gridTemplateColumns: selected ? '1fr 1fr' : '1fr', gap:16}}>
      <div>
        <table style={{width:'100%', borderCollapse:'collapse'}}>
          <thead>
            <tr>
              <th style={{textAlign:'left', borderBottom:'1px solid #ddd'}}>Item Code</th>
              <th style={{textAlign:'left', borderBottom:'1px solid #ddd'}}>Item Name</th>
              <th style={{textAlign:'left', borderBottom:'1px solid #ddd'}}>Material</th>
              <th style={{textAlign:'left', borderBottom:'1px solid #ddd'}}>Vendor</th>
            </tr>
          </thead>
          <tbody>
            {items.map(i => (
              <tr key={i.id} onClick={()=>{ setSelected(i); loadFiles(i.id) }} style={{cursor:'pointer'}}>
                <td style={{borderBottom:'1px solid #f0f0f0'}}>{i.item_code}</td>
                <td style={{borderBottom:'1px solid #f0f0f0'}}>{i.item_name}</td>
                <td style={{borderBottom:'1px solid #f0f0f0'}}>{i.material}</td>
                <td style={{borderBottom:'1px solid #f0f0f0'}}>{i.vendor}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selected && (
        <div style={{borderLeft:'1px solid #eee', paddingLeft:16}}>
          <h3>{selected.item_name} <span style={{opacity:0.6}}>({selected.item_code})</span></h3>
          <FileUploader item={selected} />
          <h4 style={{marginTop:16}}>Drawings</h4>
          <FileGroup files={files.filter(f => f.file_type === 'drawing')} />
          <h4>Certificates</h4>
          <FileGroup files={files.filter(f => f.file_type === 'certificate')} />
          <h4>Other Files</h4>
          <FileGroup files={files.filter(f => f.file_type === 'other')} />
        </div>
      )}
    </div>
  )
}

function FileGroup({ files }) {
  const latest = files.find(f => f.is_latest) || files[0]
  const older = files.filter(f => f.id !== latest?.id)

  return (
    <div style={{marginBottom:16}}>
      {latest ? (
        <div style={{marginBottom:8}}>
          <strong>Latest:</strong> <FileLink f={latest} />
        </div>
      ) : <div style={{opacity:0.6}}>No files yet.</div>}
      {older.length > 0 && (
        <details>
          <summary>Older versions</summary>
          <ul>
            {older.map(f => <li key={f.id}><FileLink f={f} /></li>)}
          </ul>
        </details>
      )}
    </div>
  )
}

function FileLink({ f }) {
  const [url, setUrl] = useState(null)
  useEffect(() => {
    let cancelled = false
    async function run() {
      const { data, error } = await supabase.storage.from('files').createSignedUrl(f.path, 60*60)
      if (!cancelled) setUrl(data?.signedUrl || null)
    }
    run()
    return () => { cancelled = true }
  }, [f.path])
  return <a href={url || '#'} target="_blank" rel="noreferrer">v{f.version}</a>
}
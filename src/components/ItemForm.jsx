import { useState } from 'react'
import { supabase } from '../supabaseClient'

export default function ItemForm({ onSaved }) {
  const [form, setForm] = useState({ item_code:'', item_name:'', material:'', vendor:'' })
  const [loading, setLoading] = useState(false)

  const save = async (e) => {
    e.preventDefault()
    setLoading(true)
    const { error } = await supabase.from('items').insert(form)
    setLoading(false)
    if (error) alert(error.message)
    else {
      setForm({ item_code:'', item_name:'', material:'', vendor:'' })
      onSaved?.()
    }
  }

  return (
    <form onSubmit={save} style={{display:'grid', gap:8, gridTemplateColumns:'repeat(2, minmax(0,1fr))'}}>
      <input placeholder="Item Code" value={form.item_code} onChange={(e)=>setForm({...form, item_code:e.target.value})} required />
      <input placeholder="Item Name" value={form.item_name} onChange={(e)=>setForm({...form, item_name:e.target.value})} required />
      <input placeholder="Material" value={form.material} onChange={(e)=>setForm({...form, material:e.target.value})} />
      <input placeholder="Vendor" value={form.vendor} onChange={(e)=>setForm({...form, vendor:e.target.value})} />
      <button type="submit" disabled={loading} style={{gridColumn:'1 / -1', padding:'8px 12px'}}>{loading ? 'Saving...' : 'Add Item'}</button>
    </form>
  )
}
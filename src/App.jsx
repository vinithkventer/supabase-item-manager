import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'
import Login from './components/Login'
import ItemForm from './components/ItemForm'
import ItemList from './components/ItemList'

export default function App() {
  const [session, setSession] = useState(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => setSession(session))
    return () => sub.subscription.unsubscribe()
  }, [])

  if (!session) {
    return <Login />
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  return (
    <div style={{maxWidth: 1100, margin:'4vh auto', padding: 16}}>
      <header style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: 16}}>
        <h2>Item Manager</h2>
        <div style={{display:'flex', gap:8, alignItems:'center'}}>
          <span style={{opacity:0.7, fontSize:14}}>{session.user.email}</span>
          <button onClick={signOut}>Sign out</button>
        </div>
      </header>

      <section style={{padding:16, border:'1px solid #eee', borderRadius:12, marginBottom:16}}>
        <h3>Add Item</h3>
        <ItemForm onSaved={()=>{}} />
      </section>

      <section style={{padding:16, border:'1px solid #eee', borderRadius:12}}>
        <h3>Items</h3>
        <ItemList />
      </section>
    </div>
  )
}
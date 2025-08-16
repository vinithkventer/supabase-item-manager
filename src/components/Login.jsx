import { supabase } from '../supabaseClient'
import { useState } from 'react'

export default function Login() {
  const [email, setEmail] = useState('')

  const signInWithGoogle = async () => {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: window.location.origin }, // sends user back to your app
  })
  if (error) alert(error.message)
}

  const signInWithOtp = async (e) => {
    e.preventDefault()
    const { error } = await supabase.auth.signInWithOtp({ email })
    if (error) alert(error.message)
    else alert('Check your email for a magic link!')
  }

  return (
    <div style={{maxWidth: 420, margin: '10vh auto', padding: 24, border: '1px solid #ddd', borderRadius: 12}}>
      <h2>Sign in</h2>
      <button onClick={signInWithGoogle} style={{padding: '8px 12px'}}>Continue with Google</button>
      <div style={{margin: '16px 0', opacity: 0.6}}>— or —</div>
      <form onSubmit={signInWithOtp}>
        <input
          type="email"
          placeholder="your@email.com"
          value={email}
          onChange={(e)=>setEmail(e.target.value)}
          required
          style={{width:'100%', padding:8, marginBottom:8}}
        />
        <button type="submit" style={{padding:'8px 12px', width:'100%'}}>Send magic link</button>
      </form>
    </div>
  )
}
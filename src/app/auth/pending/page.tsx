import Link from "next/link"
export default function PendingPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{background:"hsl(0 0% 3.5%)"}}>
      <div className="text-center space-y-5 max-w-sm">
        <div className="text-5xl">⏳</div>
        <h1 className="text-2xl" style={{fontFamily:"'DM Serif Display',serif"}}>Application under review</h1>
        <p className="text-sm leading-relaxed" style={{color:"hsl(0 0% 45%)"}}>Your registration is pending approval. You'll receive an email once approved.</p>
        <Link href="/" className="inline-flex text-sm py-2 px-4 rounded-lg border" style={{borderColor:"hsl(0 0% 20%)",color:"hsl(0 0% 60%)"}}>← Back to sign in</Link>
      </div>
    </div>
  )
}

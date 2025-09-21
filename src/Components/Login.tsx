// src/components/Login.tsx
import React, { useState } from "react";
import { signInWithEmailAndPassword, auth } from "../firebase";
import { useNavigate } from "react-router-dom"; // <-- import

export default function Login({ onLogin }: { onLogin?: () => void }) {
    const [email, setEmail] = useState("");
    const [pw, setPw] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate(); // <-- initialize

    async function handleLogin(e: React.FormEvent) {
        e.preventDefault();
        setError(null);
        setLoading(true);
        try {
            const cred = await signInWithEmailAndPassword(auth, email, pw);
            if (!cred.user.emailVerified) {
                setError("Please verify your email before logging in. Check your inbox.");
            } else {
                onLogin?.();
                navigate("/"); // <-- redirect to home page
            }
        } catch (err: any) {
            setError(err.message || "Login failed.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="auth-card">
            <h2>Welcome back</h2>
            <form onSubmit={handleLogin}>
                <div className="field">
                    <label className="label">Your Email</label>
                    <input className="input" value={email} onChange={e => setEmail(e.target.value)} />
                </div>

                <div className="field">
                    <label className="label">Password</label>
                    <input type="password" className="input" value={pw} onChange={e => setPw(e.target.value)} />
                </div>

                {error && <div className="error">{error}</div>}

                <div className="actions">
                    <button className="btn" type="submit" disabled={loading}>{loading ? "Logging..." : "Continue"}</button>
                    <a className="small-link" href="/forgot">Forgot password?</a>
                </div>
            </form>
            <div style={{ marginTop: 12 }}>Don't have an account? <a href="/register" className="small-link">Sign up</a></div>
        </div>
    );
}



// // src/components/Login.tsx
// import React, { useState } from "react";
// import { signInWithEmailAndPassword, auth } from "../firebase";

// export default function Login({ onLogin }: { onLogin?: ()=>void }) {
//   const [email, setEmail] = useState("");
//   const [pw, setPw] = useState("");
//   const [error, setError] = useState<string | null>(null);
//   const [loading, setLoading] = useState(false);

//   async function handleLogin(e: React.FormEvent) {
//     e.preventDefault();
//     setError(null);
//     setLoading(true);
//     try {
//       const cred = await signInWithEmailAndPassword(auth, email, pw);
//       if (!cred.user.emailVerified) {
//         setError("Please verify your email before logging in. Check your inbox.");
//         // optionally re-send verification
//       } else {
//         onLogin?.();
//       }
//     } catch (err: any) {
//       setError(err.message || "Login failed.");
//     } finally {
//       setLoading(false);
//     }
//   }

//   return (
//     <div className="auth-card">
//       <h2>Welcome back</h2>
//       <form onSubmit={handleLogin}>
//         <div className="field">
//           <label className="label">Your Email</label>
//           <input className="input" value={email} onChange={e=>setEmail(e.target.value)} />
//         </div>

//         <div className="field">
//           <label className="label">Password</label>
//           <input type="password" className="input" value={pw} onChange={e=>setPw(e.target.value)} />
//         </div>

//         {error && <div className="error">{error}</div>}

//         <div className="actions">
//           <button className="btn" type="submit" disabled={loading}>{loading ? "Logging..." : "Continue"}</button>
//           <a className="small-link" href="/forgot">Forgot password?</a>
//         </div>
//       </form>
//       <div style={{marginTop:12}}>Don't have an account? <a href="/register" className="small-link">Sign up</a></div>
//     </div>
//   );
// }

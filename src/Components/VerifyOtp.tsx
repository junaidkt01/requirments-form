// src/components/VerifyOtp.tsx
import React, { useState } from "react";
import { useSearchParams } from "react-router-dom";

export default function VerifyOtp() {
  const [params] = useSearchParams();
  const email = params.get("email") || "";
  const [otp, setOtp] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirm, setConfirm] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    if (newPw !== confirm) return setMsg("Passwords do not match.");
    setLoading(true);
    try {
      const res = await fetch("/api/verify-otp", {
        method: "POST",
        headers: {"Content-Type":"application/json"},
        body: JSON.stringify({ email, otp, newPassword: newPw })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.message || "Invalid OTP");
      setMsg("Password updated — you can now log in.");
    } catch (err: any) {
      setMsg(err.message || "Failed to verify OTP");
    } finally { setLoading(false); }
  }

  return (
    <div className="auth-card">
      <h2>Verify OTP</h2>
      <form onSubmit={handleVerify}>
        <div className="field">
          <label className="label">Email</label>
          <input className="input" value={email} disabled />
        </div>
        <div className="field">
          <label className="label">OTP</label>
          <input className="input" value={otp} onChange={e=>setOtp(e.target.value)} />
        </div>
        <div className="field">
          <label className="label">New Password</label>
          <input type="password" className="input" value={newPw} onChange={e=>setNewPw(e.target.value)} />
        </div>
        <div className="field">
          <label className="label">Confirm Password</label>
          <input type="password" className="input" value={confirm} onChange={e=>setConfirm(e.target.value)} />
        </div>

        {msg && <div className="helper">{msg}</div>}
        <div className="actions">
          <button className="btn" type="submit" disabled={loading}>{loading ? "Verifying..." : "Verify & Reset"}</button>
        </div>
      </form>
    </div>
  );
}

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { API } from "../services/api";
import { Loader2 } from "lucide-react";
import toast from "react-hot-toast";

// ── Design tokens identical to Login.jsx ─────────────────────────────────────
const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Mukta:wght@400;600;700;800&family=Hind:wght@400;500;600&family=JetBrains+Mono:wght@400;700&display=swap');

:root{
  --navy:#0B2447;
  --navy-deep:#081A33;
  --saffron:#FF9933;
  --green:#138808;
  --cyan:#0EA5A0;
  --paper:#F4F0E8;
  --paper-line:rgba(11,36,71,0.06);
  --ink:#10233F;
  --ink-soft:#3C5070;
  --white:#FFFEFB;
  --gold-line:#C7A55A;
  --font-display:'Mukta',sans-serif;
  --font-body:'Hind',sans-serif;
  --font-mono:'JetBrains Mono',monospace;
}

.auth-root *{margin:0;padding:0;box-sizing:border-box;}
.auth-root{
  font-family:var(--font-body);
  min-height:100vh;
  background:var(--navy-deep);
  color:var(--ink);
  display:flex;
  flex-direction:column;
  position:relative;
  overflow:hidden;
}

.auth-tricolor{height:5px;display:flex;flex-shrink:0;}
.auth-tricolor .s{flex:1;background:var(--saffron);}
.auth-tricolor .w{flex:1;background:#fff;}
.auth-tricolor .g{flex:1;background:var(--green);}

.auth-chakra{
  position:absolute;
  width:520px;height:520px;
  opacity:0.04;
  pointer-events:none;
}
.auth-chakra-tl{left:-180px;top:-140px;animation:auth-spin-tl 110s linear infinite;}
.auth-chakra-br{right:-200px;bottom:-180px;animation:auth-spin-br 90s linear infinite;}
@keyframes auth-spin-tl{from{transform:rotate(0deg);}to{transform:rotate(360deg);}}
@keyframes auth-spin-br{from{transform:rotate(0deg);}to{transform:rotate(-360deg);}}

.auth-topbar{
  background:rgba(8,26,51,0.6);
  color:#9FB4D6;
  font-family:var(--font-mono);
  font-size:12px;
  letter-spacing:0.02em;
  padding:5px 28px;
  display:flex;
  justify-content:space-between;
  align-items:center;
  border-bottom:1px solid rgba(255,255,255,0.06);
  flex-shrink:0;
}
.auth-topbar a{color:#9FB4D6;text-decoration:none;}
.auth-topbar a:hover{color:var(--saffron);}

.auth-layout{
  flex:1;
  display:flex;
  align-items:center;
  justify-content:center;
  padding:36px 24px;
  position:relative;
  z-index:2;
}

/* Card — slightly wider for signup to hold the 2-col row */
.auth-card{
  width:100%;
  max-width:480px;
  background:rgba(255,255,255,0.035);
  border:1px solid rgba(255,255,255,0.09);
  border-top:3px solid var(--cyan);   /* cyan accent differentiates from login's saffron */
  border-radius:4px;
  padding:36px 32px 32px;
  position:relative;
}

.auth-brand{display:flex;align-items:center;gap:14px;margin-bottom:28px;}
.auth-seal{width:46px;height:46px;flex-shrink:0;}
.auth-brand-text .auth-dept{font-family:var(--font-mono);font-size:10px;letter-spacing:0.06em;text-transform:uppercase;color:#7C90B5;}
.auth-brand-text .auth-name{font-family:var(--font-display);font-weight:800;font-size:18px;color:#fff;letter-spacing:0.01em;}

.auth-eyebrow{
  font-family:var(--font-mono);
  font-size:10.5px;
  letter-spacing:0.1em;
  text-transform:uppercase;
  color:var(--saffron);
  display:flex;align-items:center;gap:8px;
  margin-bottom:8px;
}
.auth-eyebrow::before{content:'';width:14px;height:1px;background:var(--saffron);}
.auth-heading{
  font-family:var(--font-display);
  font-weight:800;
  font-size:26px;
  color:#fff;
  letter-spacing:-0.01em;
  margin-bottom:5px;
}
.auth-sub{font-size:14px;color:#7C90B5;margin-bottom:26px;}

.auth-divider{height:1px;background:rgba(255,255,255,0.07);margin:0 -32px 26px;}

.auth-row{display:grid;grid-template-columns:1fr 1fr;gap:12px;}

.auth-field{margin-bottom:14px;}
.auth-label{
  display:block;
  font-family:var(--font-mono);
  font-size:11px;
  letter-spacing:0.06em;
  text-transform:uppercase;
  color:#9FB4D6;
  margin-bottom:7px;
}
.auth-input{
  width:100%;
  padding:10px 13px;
  background:rgba(255,255,255,0.04);
  border:1px solid rgba(255,255,255,0.12);
  border-radius:3px;
  color:#fff;
  font-family:var(--font-body);
  font-size:14.5px;
  outline:none;
  transition:border-color 0.18s,box-shadow 0.18s;
}
.auth-input::placeholder{color:#4A607A;}
.auth-input:focus{
  border-color:var(--cyan);
  box-shadow:0 0 0 3px rgba(14,165,160,0.12);
}

/* Password strength bar */
.auth-pw-bar{margin-top:6px;height:3px;border-radius:2px;background:rgba(255,255,255,0.08);overflow:hidden;}
.auth-pw-fill{height:100%;border-radius:2px;transition:width 0.3s,background 0.3s;}

/* Notice */
.auth-notice{
  margin-top:12px;
  padding:10px 13px;
  background:rgba(14,165,160,0.08);
  border:1px solid rgba(14,165,160,0.2);
  border-radius:3px;
  font-family:var(--font-mono);
  font-size:11px;
  color:#7CCFCC;
  line-height:1.5;
}

.auth-submit{
  width:100%;
  margin-top:14px;
  padding:12px;
  background:var(--navy);
  color:#fff;
  font-family:var(--font-display);
  font-weight:700;
  font-size:15px;
  border:1.5px solid var(--gold-line);
  border-radius:3px;
  cursor:pointer;
  display:flex;
  align-items:center;
  justify-content:center;
  gap:8px;
  letter-spacing:0.01em;
  transition:background 0.18s,opacity 0.18s;
}
.auth-submit:disabled{opacity:0.6;cursor:not-allowed;}
.auth-submit:not(:disabled):hover{background:#0f2f5a;}

.auth-foot{
  margin-top:22px;
  padding-top:18px;
  border-top:1px solid rgba(255,255,255,0.07);
  text-align:center;
  font-size:13.5px;
  color:#7C90B5;
}
.auth-foot a{color:var(--cyan);font-weight:600;text-decoration:none;}
.auth-foot a:hover{color:#fff;}

.auth-trust{
  display:flex;
  justify-content:center;
  gap:24px;
  margin-top:20px;
  flex-wrap:wrap;
}
.auth-trust-item{
  display:flex;align-items:center;gap:6px;
  font-family:var(--font-mono);
  font-size:11px;
  color:#4A607A;
  letter-spacing:0.02em;
}
.auth-trust-item svg{width:12px;height:12px;stroke:var(--saffron);flex-shrink:0;}

.auth-footer{
  background:rgba(0,0,0,0.3);
  border-top:1px solid rgba(255,255,255,0.06);
  padding:12px 28px;
  display:flex;
  justify-content:space-between;
  align-items:center;
  flex-shrink:0;
  flex-wrap:wrap;
  gap:6px;
}
.auth-footer span{font-family:var(--font-mono);font-size:11px;color:#4A607A;}
.auth-footer a{color:#4A607A;text-decoration:none;}
.auth-footer a:hover{color:var(--saffron);}

@media(max-width:560px){
  .auth-card{padding:28px 20px 24px;}
  .auth-divider{margin:0 -20px 22px;}
  .auth-row{grid-template-columns:1fr;}
  .auth-topbar{display:none;}
}
`;

// ── SVGs ─────────────────────────────────────────────────────────────────────
function CivicSeal({ className }) {
  return (
    <svg className={className} viewBox="0 0 100 100">
      <circle cx="50" cy="50" r="46" fill="none" stroke="#0EA5A0" strokeWidth="2" />
      <circle cx="50" cy="50" r="38" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1" />
      <g stroke="rgba(255,255,255,0.5)" strokeWidth="1">
        {Array.from({ length: 24 }).map((_, i) => {
          const angle = (i * 360) / 24;
          const rad = (angle * Math.PI) / 180;
          return (
            <line
              key={i}
              x1={50 + 30 * Math.cos(rad)} y1={50 + 30 * Math.sin(rad)}
              x2={50 + 36 * Math.cos(rad)} y2={50 + 36 * Math.sin(rad)}
            />
          );
        })}
      </g>
      <circle cx="50" cy="50" r="6" fill="#0EA5A0" />
      <text x="50" y="14" textAnchor="middle" fontSize="6" fontFamily="JetBrains Mono" fill="rgba(255,255,255,0.6)" letterSpacing="1">PROPOSED FOR BIHAR</text>
      <text x="50" y="93" textAnchor="middle" fontSize="6" fontFamily="JetBrains Mono" fill="rgba(255,255,255,0.6)" letterSpacing="1">CIVICCALL</text>
    </svg>
  );
}

function ChakraSVG({ className }) {
  return (
    <svg className={className} viewBox="0 0 200 200">
      <circle cx="100" cy="100" r="95" fill="none" stroke="#fff" strokeWidth="1.5" />
      <circle cx="100" cy="100" r="10" fill="#fff" />
      <g stroke="#fff" strokeWidth="1.5">
        {Array.from({ length: 8 }).map((_, i) => {
          const rad = ((i * 22.5) * Math.PI) / 180;
          return <line key={i} x1={100 + 10 * Math.cos(rad)} y1={100 + 10 * Math.sin(rad)} x2={100 + 95 * Math.cos(rad)} y2={100 + 95 * Math.sin(rad)} />;
        })}
      </g>
    </svg>
  );
}

const ShieldIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.6"><path d="M12 2l8 4v6c0 5-3.5 8-8 10-4.5-2-8-5-8-10V6z" /></svg>
);
const LockIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.6"><rect x="5" y="11" width="14" height="9" rx="1" /><path d="M8 11V7a4 4 0 018 0v4" /></svg>
);

// ── Password strength helper ──────────────────────────────────────────────────
function pwStrength(pw) {
  if (!pw) return { width: "0%", bg: "transparent", label: "" };
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  const map = [
    { width: "25%", bg: "#e53e3e", label: "Weak" },
    { width: "50%", bg: "#dd6b20", label: "Fair" },
    { width: "75%", bg: "#d69e2e", label: "Good" },
    { width: "100%", bg: "#38a169", label: "Strong" },
  ];
  return map[score - 1] || { width: "0%", bg: "transparent", label: "" };
}

// ─────────────────────────────────────────────────────────────────────────────
export default function Signup() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const strength = pwStrength(password);

  const handleSignup = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch(`${API}/api/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Signup failed");
      login(data.user, data.token);
      toast.success("Account created securely");
      navigate("/dashboard");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-root">
      <style>{STYLES}</style>

      {/* Tricolor */}
      <div className="auth-tricolor">
        <span className="s" /><span className="w" /><span className="g" />
      </div>

      {/* Topbar */}
      <div className="auth-topbar">
        <span>CivicCall · नागरिक शिकायत निवारण मंच</span>
        <span>
          <Link to="/">← Back to Landing</Link>
          <span style={{ margin: "0 12px", opacity: 0.3 }}>|</span>
          Helpline · <b style={{ color: "#9FB4D6" }}>1857-855-6170</b>
        </span>
      </div>

      {/* Watermarks */}
      <ChakraSVG className="auth-chakra auth-chakra-tl" />
      <ChakraSVG className="auth-chakra auth-chakra-br" />

      {/* Main */}
      <div className="auth-layout">
        <div>
          <div className="auth-card">
            {/* Brand */}
            <div className="auth-brand">
              <Link to="/">
                <CivicSeal className="auth-seal" />
              </Link>
              <div className="auth-brand-text">
                <div className="auth-dept">Govt. e-Governance Mission · Bihar</div>
                <div className="auth-name">CivicCall</div>
              </div>
            </div>

            <div className="auth-divider" />

            {/* Heading */}
            <div className="auth-eyebrow">Officer Registration</div>
            <div className="auth-heading">Create Account</div>
            <div className="auth-sub">Register to access live dashboards and complaints</div>

            {/* Form */}
            <form onSubmit={handleSignup}>
              <div className="auth-field">
                <label className="auth-label">Full Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="auth-input"
                  placeholder="Officer Jane Doe"
                />
              </div>

              <div className="auth-field">
                <label className="auth-label">Official Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="auth-input"
                  placeholder="jane@civicsense.gov"
                />
              </div>

              <div className="auth-field">
                <label className="auth-label">
                  Password
                  {strength.label && (
                    <span style={{ float: "right", color: strength.bg, fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>
                      {strength.label}
                    </span>
                  )}
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="auth-input"
                  placeholder="••••••••"
                />
                <div className="auth-pw-bar">
                  <div className="auth-pw-fill" style={{ width: strength.width, background: strength.bg }} />
                </div>
              </div>

              <div className="auth-notice">
                ✦ Access is subject to departmental verification. Use your official government email address.
              </div>

              <button type="submit" disabled={isSubmitting} className="auth-submit">
                {isSubmitting
                  ? <Loader2 className="w-5 h-5 animate-spin" />
                  : "Register Officer Account"}
              </button>
            </form>

            {/* Footer link */}
            <div className="auth-foot">
              Already registered?{" "}
              <Link to="/login">Sign in instead</Link>
            </div>
          </div>

          {/* Trust strip */}
          <div className="auth-trust">
            <span className="auth-trust-item"><ShieldIcon /> Data hosted in India</span>
            <span className="auth-trust-item"><LockIcon /> End-to-end encrypted</span>
            <span className="auth-trust-item"><LockIcon /> Full audit trail</span>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="auth-footer">
        <span>CivicCall · Not yet an official government system</span>
        <span>
          <Link to="/">civiccall.in</Link>
          <span style={{ margin: "0 10px", opacity: 0.3 }}>·</span>
          <Link to="/login">Staff Login</Link>
        </span>
      </div>
    </div>
  );
}

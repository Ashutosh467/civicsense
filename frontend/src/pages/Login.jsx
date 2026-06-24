import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { API } from "../services/api";
import { Loader2 } from "lucide-react";
import toast from "react-hot-toast";

// ── Shared design tokens (mirrors landing page CSS vars) ──────────────────────
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

/* ── Tricolor bar ── */
.auth-tricolor{height:5px;display:flex;flex-shrink:0;}
.auth-tricolor .s{flex:1;background:var(--saffron);}
.auth-tricolor .w{flex:1;background:#fff;}
.auth-tricolor .g{flex:1;background:var(--green);}

/* ── Chakra watermark ── */
.auth-chakra{
  position:absolute;
  width:520px;height:520px;
  opacity:0.04;
  animation:auth-spin 100s linear infinite;
  pointer-events:none;
}
.auth-chakra-left{left:-200px;top:50%;transform:translateY(-50%);}
.auth-chakra-right{right:-200px;bottom:-100px;}
@keyframes auth-spin{from{transform:translateY(-50%) rotate(0deg);}to{transform:translateY(-50%) rotate(360deg);}}
.auth-chakra-right-anim{animation:auth-spin-r 100s linear infinite;}
@keyframes auth-spin-r{from{transform:rotate(0deg);}to{transform:rotate(360deg);}}

/* ── Mini topbar ── */
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

/* ── Layout ── */
.auth-layout{
  flex:1;
  display:flex;
  align-items:center;
  justify-content:center;
  padding:40px 24px;
  position:relative;
  z-index:2;
}

/* ── Card ── */
.auth-card{
  width:100%;
  max-width:440px;
  background:rgba(255,255,255,0.035);
  border:1px solid rgba(255,255,255,0.09);
  border-top:3px solid var(--saffron);
  border-radius:4px;
  padding:36px 32px 32px;
  position:relative;
}

/* ── Brand header ── */
.auth-brand{display:flex;align-items:center;gap:14px;margin-bottom:28px;}
.auth-seal{width:46px;height:46px;flex-shrink:0;}
.auth-brand-text .auth-dept{font-family:var(--font-mono);font-size:10px;letter-spacing:0.06em;text-transform:uppercase;color:#7C90B5;}
.auth-brand-text .auth-name{font-family:var(--font-display);font-weight:800;font-size:18px;color:#fff;letter-spacing:0.01em;}

/* ── Eyebrow / heading ── */
.auth-eyebrow{
  font-family:var(--font-mono);
  font-size:10.5px;
  letter-spacing:0.1em;
  text-transform:uppercase;
  color:var(--cyan);
  display:flex;align-items:center;gap:8px;
  margin-bottom:8px;
}
.auth-eyebrow::before{content:'';width:14px;height:1px;background:var(--cyan);}
.auth-heading{
  font-family:var(--font-display);
  font-weight:800;
  font-size:26px;
  color:#fff;
  letter-spacing:-0.01em;
  margin-bottom:5px;
}
.auth-sub{
  font-size:14px;
  color:#7C90B5;
  margin-bottom:26px;
}

/* ── Divider ── */
.auth-divider{height:1px;background:rgba(255,255,255,0.07);margin:0 -32px 26px;}

/* ── Form ── */
.auth-field{margin-bottom:16px;}
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
  transition:border-color 0.18s, box-shadow 0.18s;
}
.auth-input::placeholder{color:#4A607A;}
.auth-input:focus{
  border-color:var(--cyan);
  box-shadow:0 0 0 3px rgba(14,165,160,0.12);
}

/* ── Submit button ── */
.auth-submit{
  width:100%;
  margin-top:8px;
  padding:12px;
  background:var(--saffron);
  color:var(--navy-deep);
  font-family:var(--font-display);
  font-weight:700;
  font-size:15px;
  border:none;
  border-radius:3px;
  cursor:pointer;
  display:flex;
  align-items:center;
  justify-content:center;
  gap:8px;
  letter-spacing:0.01em;
  transition:opacity 0.18s;
}
.auth-submit:disabled{opacity:0.6;cursor:not-allowed;}
.auth-submit:not(:disabled):hover{opacity:0.9;}

/* ── Footer link ── */
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

/* ── Trust strip ── */
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

/* ── Bottom bar ── */
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

@media(max-width:520px){
  .auth-card{padding:28px 20px 24px;}
  .auth-divider{margin:0 -20px 22px;}
  .auth-topbar{display:none;}
  .auth-trust{gap:14px;}
}
`;

// ── Reused SVGs from landing page ────────────────────────────────────────────
function CivicSeal({ className }) {
  return (
    <svg className={className} viewBox="0 0 100 100">
      <circle cx="50" cy="50" r="46" fill="none" stroke="#FF9933" strokeWidth="2" />
      <circle cx="50" cy="50" r="38" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1" />
      <g stroke="rgba(255,255,255,0.5)" strokeWidth="1">
        {Array.from({ length: 24 }).map((_, i) => {
          const angle = (i * 360) / 24;
          const rad = (angle * Math.PI) / 180;
          const x1 = 50 + 30 * Math.cos(rad);
          const y1 = 50 + 30 * Math.sin(rad);
          const x2 = 50 + 36 * Math.cos(rad);
          const y2 = 50 + 36 * Math.sin(rad);
          return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} />;
        })}
      </g>
      <circle cx="50" cy="50" r="6" fill="#FF9933" />
      <text x="50" y="14" textAnchor="middle" fontSize="6" fontFamily="JetBrains Mono" fill="rgba(255,255,255,0.6)" letterSpacing="1">
        PROPOSED FOR BIHAR
      </text>
      <text x="50" y="93" textAnchor="middle" fontSize="6" fontFamily="JetBrains Mono" fill="rgba(255,255,255,0.6)" letterSpacing="1">
        CIVICCALL
      </text>
    </svg>
  );
}

function ChakraWatermark({ className, style }) {
  return (
    <svg className={className} style={style} viewBox="0 0 200 200">
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
  <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.6" width="12" height="12">
    <path d="M12 2l8 4v6c0 5-3.5 8-8 10-4.5-2-8-5-8-10V6z" />
  </svg>
);
const LockIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.6" width="12" height="12">
    <rect x="5" y="11" width="14" height="9" rx="1" /><path d="M8 11V7a4 4 0 018 0v4" />
  </svg>
);

// ─────────────────────────────────────────────────────────────────────────────
export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch(`${API}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Login failed");
      login(data.user, data.token);
      toast.success("Welcome back to CivicCall");
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
      <ChakraWatermark className="auth-chakra auth-chakra-left" />
      <svg
        className="auth-chakra auth-chakra-right auth-chakra-right-anim"
        style={{ left: "auto", right: "-200px", bottom: "-100px", top: "auto", transform: "none" }}
        viewBox="0 0 200 200"
      >
        <circle cx="100" cy="100" r="95" fill="none" stroke="#fff" strokeWidth="1.5" />
        <circle cx="100" cy="100" r="10" fill="#fff" />
        <g stroke="#fff" strokeWidth="1.5">
          {Array.from({ length: 8 }).map((_, i) => {
            const rad = ((i * 22.5) * Math.PI) / 180;
            return <line key={i} x1={100 + 10 * Math.cos(rad)} y1={100 + 10 * Math.sin(rad)} x2={100 + 95 * Math.cos(rad)} y2={100 + 95 * Math.sin(rad)} />;
          })}
        </g>
      </svg>

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
            <div className="auth-eyebrow">Staff Login</div>
            <div className="auth-heading">Welcome Back</div>
            <div className="auth-sub">Sign in to your officer dashboard</div>

            {/* Form */}
            <form onSubmit={handleLogin}>
              <div className="auth-field">
                <label className="auth-label">Email Address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="auth-input"
                  placeholder="officer@civicsense.gov"
                />
              </div>

              <div className="auth-field">
                <label className="auth-label">Password</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="auth-input"
                  placeholder="••••••••"
                />
              </div>

              <button type="submit" disabled={isSubmitting} className="auth-submit">
                {isSubmitting
                  ? <Loader2 className="w-5 h-5 animate-spin" />
                  : "Sign In to Dashboard"}
              </button>
            </form>

            {/* Footer link */}
            <div className="auth-foot">
              Not registered yet?{" "}
              <Link to="/signup">Create an account</Link>
            </div>
          </div>

          {/* Trust strip below card */}
          <div className="auth-trust">
            <span className="auth-trust-item"><ShieldIcon /> Data hosted in India</span>
            <span className="auth-trust-item"><LockIcon /> End-to-end encrypted</span>
            <span className="auth-trust-item"><LockIcon /> Officer-grade access</span>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="auth-footer">
        <span>CivicCall · Not yet an official government system</span>
        <span>
          <Link to="/">civiccall.in</Link>
          <span style={{ margin: "0 10px", opacity: 0.3 }}>·</span>
          <Link to="/signup">Create Account</Link>
        </span>
      </div>
    </div>
  );
}

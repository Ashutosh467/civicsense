import { Link } from "react-router-dom";
import { useState } from "react";

const STYLES = `
:root{
  --navy:#0B2447;
  --navy-deep:#081A33;
  --saffron:#FF9933;
  --green:#138808;
  --cyan:#0EA5A0;
  --paper:#F4F0E8;
  --paper-line: rgba(11,36,71,0.06);
  --ink:#10233F;
  --ink-soft:#3C5070;
  --white:#FFFEFB;
  --gold-line:#C7A55A;
  --font-display:'Mukta', sans-serif;
  --font-body:'Hind', sans-serif;
  --font-mono:'JetBrains Mono', monospace;
}
.cc-root *{margin:0;padding:0;box-sizing:border-box;}
.cc-root{
  font-family:var(--font-body);
  background:var(--paper);
  color:var(--ink);
  font-size:16.5px;
  line-height:1.55;
  background-image: radial-gradient(rgba(11,36,71,0.025) 1px, transparent 1px);
  background-size: 4px 4px;
  scroll-behavior:smooth;
}
.cc-root img, .cc-root svg{display:block;}
.cc-root a{color:inherit;text-decoration:none;}
.cc-container{max-width:1180px;margin:0 auto;padding:0 28px;}

.cc-tricolor{height:5px;display:flex;}
.cc-tricolor span{flex:1;}
.cc-tricolor .s{background:var(--saffron);}
.cc-tricolor .w{background:#fff;}
.cc-tricolor .g{background:var(--green);}

.cc-topbar{background:var(--navy-deep);color:#D9E2F1;font-size:12.5px;font-family:var(--font-mono);letter-spacing:0.02em;}
.cc-topbar .cc-container{display:flex;justify-content:space-between;align-items:center;padding-top:6px;padding-bottom:6px;}
.cc-topbar-left{display:flex;gap:22px;}
.cc-topbar a:hover{color:var(--saffron);}
.cc-topbar-right{display:flex;gap:18px;align-items:center;}
.cc-lang-toggle{border:1px solid rgba(255,255,255,0.25);padding:2px 8px;border-radius:2px;font-family:var(--font-body);cursor:pointer;background:none;color:inherit;font-size:12.5px;}

.cc-header{background:var(--white);border-bottom:1px solid var(--paper-line);position:sticky;top:0;z-index:50;box-shadow:0 1px 0 rgba(11,36,71,0.05);}
.cc-header-inner{display:flex;align-items:center;justify-content:space-between;padding:14px 0;}
.cc-brand{display:flex;align-items:center;gap:14px;}
.cc-seal{width:54px;height:54px;flex-shrink:0;}
.cc-dept-line{font-family:var(--font-mono);font-size:10.5px;letter-spacing:0.06em;text-transform:uppercase;color:var(--ink-soft);}
.cc-title-line{font-family:var(--font-display);font-weight:800;font-size:21px;color:var(--navy);letter-spacing:0.01em;}
.cc-title-line .cc-hi{font-family:var(--font-body);font-weight:600;font-size:13px;color:var(--ink-soft);display:block;margin-top:1px;}
.cc-header-actions{display:flex;align-items:center;gap:14px;flex-wrap:nowrap;}
.cc-helpline{font-family:var(--font-mono);font-size:13px;color:var(--navy);border-left:2px solid var(--saffron);padding-left:12px;}
.cc-helpline b{font-size:15px;letter-spacing:0.02em;}
.cc-btn{font-family:var(--font-display);font-weight:600;font-size:13.5px;padding:9px 18px;border-radius:3px;border:1.5px solid var(--navy);display:inline-block;cursor:pointer;letter-spacing:0.01em;white-space:nowrap;}
.cc-btn-ghost{color:var(--navy)!important;background:transparent;}
.cc-btn-solid{color:#FFFFFF!important;background:var(--navy);}

.cc-hero{position:relative;overflow:hidden;border-bottom:1px solid var(--paper-line);background:linear-gradient(180deg, #F7F3EA 0%, var(--paper) 100%);}
.cc-chakra-watermark{position:absolute;right:-180px;top:-160px;width:560px;height:560px;opacity:0.05;animation:cc-spin 90s linear infinite;}
@keyframes cc-spin{from{transform:rotate(0deg);}to{transform:rotate(360deg);}}
.cc-hero-inner{padding:64px 0 56px;display:grid;grid-template-columns:1.05fr 0.95fr;gap:48px;align-items:center;position:relative;z-index:2;}
.cc-live-badge{display:inline-flex;align-items:center;gap:8px;font-family:var(--font-mono);font-size:11.5px;letter-spacing:0.06em;color:var(--cyan);border:1px solid rgba(14,165,160,0.35);background:rgba(14,165,160,0.06);padding:5px 11px;border-radius:20px;margin-bottom:20px;text-transform:uppercase;}
.cc-pulse-dot{width:7px;height:7px;border-radius:50%;background:var(--cyan);box-shadow:0 0 0 0 rgba(14,165,160,0.6);animation:cc-pulse 1.8s infinite;}
@keyframes cc-pulse{0%{box-shadow:0 0 0 0 rgba(14,165,160,0.55);}70%{box-shadow:0 0 0 7px rgba(14,165,160,0);}100%{box-shadow:0 0 0 0 rgba(14,165,160,0);}}
.cc-hero h1{font-family:var(--font-display);font-weight:800;font-size:44px;line-height:1.12;color:var(--navy);letter-spacing:-0.01em;}
.cc-hero h1 .cc-hi{display:block;font-family:var(--font-body);font-weight:600;font-size:24px;color:var(--ink-soft);margin-top:8px;}
.cc-lede{margin-top:18px;font-size:16.5px;color:var(--ink-soft);max-width:480px;}
.cc-hero-ctas{display:flex;gap:14px;margin-top:30px;}
.cc-btn-primary-lg{font-family:var(--font-display);font-weight:700;font-size:15px;background:var(--navy);color:#FFFFFF!important;padding:13px 24px;border-radius:3px;border:1.5px solid var(--navy);cursor:pointer;display:inline-block;text-decoration:none;}
.cc-btn-secondary-lg{font-family:var(--font-display);font-weight:700;font-size:15px;background:transparent;color:var(--navy)!important;padding:13px 24px;border-radius:3px;border:1.5px solid var(--gold-line);cursor:pointer;display:inline-block;text-decoration:none;}

.cc-pipeline-card{background:var(--navy-deep);border-radius:6px;padding:26px 22px;position:relative;border:1px solid rgba(255,255,255,0.06);box-shadow:0 18px 40px -16px rgba(11,36,71,0.45);}
.cc-pipeline-title{font-family:var(--font-mono);font-size:11px;color:#9FB4D6;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:18px;display:flex;justify-content:space-between;}
.cc-pipeline-row{display:flex;align-items:center;justify-content:space-between;position:relative;}
.cc-pnode{flex:1;text-align:center;position:relative;z-index:2;}
.cc-pnode .cc-icon{width:42px;height:42px;border-radius:50%;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.14);margin:0 auto 8px;display:flex;align-items:center;justify-content:center;}
.cc-pnode .cc-icon svg{width:20px;height:20px;stroke:#CFE0F7;}
.cc-pnode.cc-active .cc-icon{border-color:var(--cyan);background:rgba(14,165,160,0.12);}
.cc-pnode .cc-label{font-family:var(--font-mono);font-size:9.5px;color:#9FB4D6;letter-spacing:0.04em;line-height:1.3;}
.cc-pipeline-line{position:absolute;top:21px;left:5%;right:5%;height:1px;background:rgba(255,255,255,0.12);z-index:1;}
.cc-scan{position:absolute;top:21px;left:5%;width:18%;height:1px;background:var(--cyan);box-shadow:0 0 8px var(--cyan);animation:cc-scan 4s ease-in-out infinite;}
@keyframes cc-scan{0%{left:5%;}100%{left:77%;}}
.cc-pipeline-foot{margin-top:22px;padding-top:16px;border-top:1px solid rgba(255,255,255,0.08);display:flex;justify-content:space-between;font-family:var(--font-mono);font-size:11px;color:#9FB4D6;}
.cc-pipeline-foot b{color:#fff;font-size:13px;}

.cc-trust-strip{background:var(--navy);padding:16px 0;}
.cc-trust-strip .cc-container{display:flex;justify-content:space-between;flex-wrap:wrap;gap:14px;}
.cc-trust-item{display:flex;align-items:center;gap:9px;color:#D9E2F1;font-family:var(--font-mono);font-size:12px;letter-spacing:0.01em;}
.cc-trust-item svg{width:16px;height:16px;stroke:var(--saffron);flex-shrink:0;}

.cc-stat-strip{background:var(--white);border-bottom:1px solid var(--paper-line);padding:30px 0;}
.cc-stat-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:0;}
.cc-stat{text-align:center;border-right:1px solid var(--paper-line);}
.cc-stat:last-child{border-right:none;}
.cc-stat .cc-num{font-family:var(--font-mono);font-weight:700;font-size:32px;color:var(--navy);}
.cc-stat .cc-num span{color:var(--cyan);}
.cc-stat .cc-lbl{font-size:12.5px;color:var(--ink-soft);margin-top:4px;text-transform:uppercase;letter-spacing:0.04em;}

.cc-section{padding:72px 0;}
.cc-section.cc-alt{background:var(--white);border-top:1px solid var(--paper-line);border-bottom:1px solid var(--paper-line);}
.cc-eyebrow{font-family:var(--font-mono);font-size:11.5px;letter-spacing:0.1em;text-transform:uppercase;color:var(--green);display:flex;align-items:center;gap:10px;margin-bottom:10px;}
.cc-eyebrow::before{content:'';width:18px;height:1px;background:var(--green);}
.cc-section-title{font-family:var(--font-display);font-weight:800;font-size:30px;color:var(--navy);letter-spacing:-0.01em;max-width:640px;}
.cc-section-title .cc-hi{display:block;font-family:var(--font-body);font-weight:500;font-size:16px;color:var(--ink-soft);margin-top:5px;}
.cc-section-head{margin-bottom:42px;}

.cc-map-wrap{display:grid;grid-template-columns:1fr 1fr;gap:48px;align-items:center;}
.cc-map-card{background:var(--white);border:1px solid var(--paper-line);border-radius:6px;padding:24px;position:relative;}
.cc-map-legend{display:flex;gap:20px;margin-top:18px;font-family:var(--font-mono);font-size:11px;color:var(--ink-soft);}
.cc-legend-dot{width:8px;height:8px;border-radius:50%;display:inline-block;margin-right:6px;}
.cc-district-list{list-style:none;}
.cc-district-list li{display:flex;justify-content:space-between;padding:11px 0;border-bottom:1px dashed var(--paper-line);font-size:14.5px;}
.cc-district-list .cc-status{font-family:var(--font-mono);font-size:10.5px;text-transform:uppercase;letter-spacing:0.05em;color:var(--cyan);display:flex;align-items:center;gap:6px;}

.cc-flow{display:flex;justify-content:space-between;position:relative;margin-top:10px;}
.cc-flow::before{content:'';position:absolute;top:30px;left:30px;right:30px;height:1px;background:repeating-linear-gradient(90deg, var(--gold-line) 0 6px, transparent 6px 12px);}
.cc-fstep{width:23%;text-align:center;position:relative;z-index:2;}
.cc-fstep .cc-num-badge{width:60px;height:60px;border-radius:50%;background:var(--white);border:1.5px solid var(--navy);display:flex;align-items:center;justify-content:center;margin:0 auto 16px;font-family:var(--font-mono);font-weight:700;color:var(--navy);font-size:18px;}
.cc-fstep h4{font-family:var(--font-display);font-weight:700;font-size:15.5px;color:var(--navy);margin-bottom:6px;}
.cc-fstep p{font-size:13.5px;color:var(--ink-soft);}

.cc-compare{display:grid;grid-template-columns:1fr 1fr;gap:0;border:1px solid var(--paper-line);border-radius:6px;overflow:hidden;}
.cc-compare > div{padding:32px;}
.cc-compare .cc-old{background:#EDE7DA;}
.cc-compare .cc-new{background:var(--navy);color:#fff;}
.cc-compare h3{font-family:var(--font-display);font-weight:700;font-size:18px;margin-bottom:18px;}
.cc-compare .cc-old h3{color:var(--ink-soft);}
.cc-compare .cc-new h3{color:var(--saffron);}
.cc-compare ul{list-style:none;}
.cc-compare li{font-size:14.5px;padding:9px 0;border-bottom:1px solid rgba(0,0,0,0.06);display:flex;gap:10px;}
.cc-compare .cc-new li{border-bottom:1px solid rgba(255,255,255,0.1);}
.cc-compare li svg{width:16px;height:16px;flex-shrink:0;margin-top:2px;}
.cc-compare .cc-old li svg{stroke:#9a8b6a;}
.cc-compare .cc-new li svg{stroke:var(--cyan);}

.cc-dept-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:1px;background:var(--paper-line);border:1px solid var(--paper-line);}
.cc-dept-card{background:var(--white);padding:26px 20px;text-align:center;}
.cc-dept-card .cc-icon{width:46px;height:46px;margin:0 auto 14px;border-radius:50%;border:1.5px solid var(--navy);display:flex;align-items:center;justify-content:center;}
.cc-dept-card .cc-icon svg{width:22px;height:22px;stroke:var(--navy);}
.cc-dept-card span{font-family:var(--font-display);font-weight:600;font-size:13.5px;color:var(--navy);}

.cc-officer-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:24px;}
.cc-officer-card{background:var(--white);border:1px solid var(--paper-line);border-radius:6px;padding:24px;border-top:3px solid var(--saffron);}
.cc-officer-card h4{font-family:var(--font-display);font-weight:700;font-size:16px;color:var(--navy);margin-bottom:8px;}
.cc-officer-card p{font-size:13.5px;color:var(--ink-soft);}

.cc-narrative{background:var(--navy-deep);color:#fff;padding:70px 0;text-align:center;position:relative;overflow:hidden;}
.cc-narrative .cc-quote{font-family:var(--font-display);font-weight:700;font-size:26px;max-width:780px;margin:0 auto 14px;line-height:1.35;}
.cc-narrative .cc-quote .cc-accent{color:var(--saffron);}
.cc-timeline{display:flex;justify-content:center;gap:0;margin-top:50px;max-width:800px;margin-left:auto;margin-right:auto;position:relative;}
.cc-timeline::before{content:'';position:absolute;top:9px;left:8%;right:8%;height:1px;background:rgba(255,255,255,0.18);}
.cc-tl-step{flex:1;text-align:center;position:relative;}
.cc-tl-step .cc-dot{width:9px;height:9px;border-radius:50%;background:#7C90B5;margin:0 auto 14px;position:relative;z-index:2;}
.cc-tl-step.cc-now .cc-dot{background:var(--cyan);box-shadow:0 0 0 4px rgba(14,165,160,0.2);}
.cc-tl-step .cc-yr{font-family:var(--font-mono);font-size:11px;color:#9FB4D6;}
.cc-tl-step .cc-lbl{font-size:13px;color:#D9E2F1;margin-top:4px;}

.cc-security-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:24px;}
.cc-sec-card{display:flex;gap:16px;background:var(--paper);border:1px solid var(--paper-line);border-radius:6px;padding:22px;}
.cc-sec-card .cc-icon{width:40px;height:40px;border-radius:50%;border:1.5px solid var(--navy);display:flex;align-items:center;justify-content:center;flex-shrink:0;}
.cc-sec-card .cc-icon svg{width:18px;height:18px;stroke:var(--navy);}
.cc-sec-card h4{font-family:var(--font-display);font-weight:700;font-size:15px;color:var(--navy);margin-bottom:6px;}
.cc-sec-card p{font-size:13.5px;color:var(--ink-soft);}

.cc-cta-banner{background:var(--navy);color:#fff;padding:64px 0;}
.cc-cta-inner{display:grid;grid-template-columns:1fr 1fr;gap:48px;align-items:start;}
.cc-cta-inner h2{font-family:var(--font-display);font-weight:800;font-size:26px;line-height:1.3;}
.cc-cta-inner h2 .cc-hi{display:block;font-family:var(--font-body);font-weight:500;font-size:15px;color:#AEC0DD;margin-top:6px;}
.cc-cta-form{background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.12);border-radius:6px;padding:22px;display:flex;flex-direction:column;gap:10px;}
.cc-cta-form .cc-row{display:grid;grid-template-columns:1fr 1fr;gap:10px;}
.cc-cta-form input{padding:10px 12px;border:1px solid rgba(255,255,255,0.15);border-radius:3px;background:rgba(255,255,255,0.06);color:#fff;font-family:var(--font-body);font-size:14px;}
.cc-cta-form input::placeholder{color:#8DA0BD;}
.cc-cta-form button{font-family:var(--font-display);font-weight:700;font-size:14.5px;background:var(--saffron);color:var(--navy-deep);padding:12px;border-radius:3px;border:none;cursor:pointer;margin-top:4px;}

.cc-footer{background:var(--navy-deep);color:#AEC0DD;padding:48px 0 24px;}
.cc-footer-top{display:grid;grid-template-columns:repeat(4,1fr);gap:32px;padding-bottom:32px;border-bottom:1px solid rgba(255,255,255,0.08);}
.cc-footer-col h5{font-family:var(--font-display);font-weight:700;font-size:13px;color:#fff;margin-bottom:14px;text-transform:uppercase;letter-spacing:0.04em;}
.cc-footer-col a{display:block;font-size:13.5px;color:#AEC0DD;margin-bottom:10px;}
.cc-footer-col a:hover{color:var(--saffron);}
.cc-sr-toggle{font-size:13.5px;}
.cc-footer-bottom{display:flex;justify-content:space-between;padding-top:20px;font-size:11.5px;color:#7C90B5;font-family:var(--font-mono);flex-wrap:wrap;gap:8px;}

@media (max-width: 900px){
  .cc-hero-inner{grid-template-columns:1fr;}
  .cc-stat-grid, .cc-dept-grid, .cc-officer-grid, .cc-security-grid, .cc-footer-top, .cc-compare, .cc-map-wrap, .cc-cta-inner{grid-template-columns:1fr;}
  .cc-flow{flex-direction:column;gap:24px;}
  .cc-flow::before{display:none;}
  .cc-fstep{width:100%;}
}
`;

const Icon = {
  phone: (p) => (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.6" {...p}>
      <path d="M3 5a2 2 0 012-2h2l2 5-2 2a12 12 0 006 6l2-2 5 2v2a2 2 0 01-2 2A16 16 0 013 5z" />
    </svg>
  ),
  doc: (p) => (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.6" {...p}>
      <rect x="4" y="3" width="16" height="18" rx="1" />
      <line x1="8" y1="8" x2="16" y2="8" />
      <line x1="8" y1="12" x2="16" y2="12" />
    </svg>
  ),
  route: (p) => (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.6" {...p}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 3v18M3 12h18" />
    </svg>
  ),
  officer: (p) => (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.6" {...p}>
      <circle cx="12" cy="8" r="3.2" />
      <path d="M5 21c0-4 3-6 7-6s7 2 7 6" />
    </svg>
  ),
  check: (p) => (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.6" {...p}>
      <path d="M5 12l4 4L19 6" />
    </svg>
  ),
  shield: (p) => (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.6" {...p}>
      <path d="M12 2l8 4v6c0 5-3.5 8-8 10-4.5-2-8-5-8-10V6z" />
    </svg>
  ),
  lock: (p) => (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.6" {...p}>
      <rect x="5" y="11" width="14" height="9" rx="1" />
      <path d="M8 11V7a4 4 0 018 0v4" />
    </svg>
  ),
  list: (p) => (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.6" {...p}>
      <path d="M4 6h16M4 12h16M4 18h10" />
    </svg>
  ),
  clock: (p) => (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.6" {...p}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  ),
  close: (p) => (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.6" {...p}>
      <path d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
  municipal: (p) => (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.6" {...p}>
      <path d="M3 21h18M5 21V9l7-5 7 5v12M9 21v-6h6v6" />
    </svg>
  ),
  water: (p) => (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.6" {...p}>
      <path d="M12 2v6M5 9h14l2 11H3z" />
    </svg>
  ),
  bolt: (p) => (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.6" {...p}>
      <path d="M13 2L4 14h7l-1 8 9-12h-7z" />
    </svg>
  ),
  road: (p) => (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.6" {...p}>
      <path d="M4 6h16M4 12h10M4 18h16" />
    </svg>
  ),
  health: (p) => (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.6" {...p}>
      <path d="M12 21c4-4 7-7.5 7-11a7 7 0 10-14 0c0 3.5 3 7 7 11z" />
    </svg>
  ),
  education: (p) => (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.6" {...p}>
      <path d="M4 19V5a2 2 0 012-2h8l6 6v10a2 2 0 01-2 2H6a2 2 0 01-2-2z" />
    </svg>
  ),
  land: (p) => (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.6" {...p}>
      <path d="M3 12l9-9 9 9M5 10v10h14V10" />
    </svg>
  ),
};

function CivicSeal() {
  return (
    <svg className="cc-seal" viewBox="0 0 100 100">
      <circle
        cx="50"
        cy="50"
        r="46"
        fill="none"
        stroke="#0B2447"
        strokeWidth="2"
      />
      <circle
        cx="50"
        cy="50"
        r="38"
        fill="none"
        stroke="#FF9933"
        strokeWidth="1"
      />
      <g stroke="#0B2447" strokeWidth="1">
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
      <circle cx="50" cy="50" r="6" fill="#0B2447" />
      <text
        x="50"
        y="14"
        textAnchor="middle"
        fontSize="6"
        fontFamily="JetBrains Mono"
        fill="#0B2447"
        letterSpacing="1"
      >
        PROPOSED FOR BIHAR
      </text>
      <text
        x="50"
        y="93"
        textAnchor="middle"
        fontSize="6"
        fontFamily="JetBrains Mono"
        fill="#0B2447"
        letterSpacing="1"
      >
        CIVICCALL
      </text>
    </svg>
  );
}

function ChakraWatermark({ style }) {
  const spokeAngles = Array.from({ length: 8 }).map((_, i) => i * 22.5);
  return (
    <svg className="cc-chakra-watermark" style={style} viewBox="0 0 200 200">
      <circle
        cx="100"
        cy="100"
        r="95"
        fill="none"
        stroke="#0B2447"
        strokeWidth="1.5"
      />
      <circle cx="100" cy="100" r="10" fill="#0B2447" />
      <g stroke="#0B2447" strokeWidth="1.5">
        {spokeAngles.map((angle, i) => {
          const rad = (angle * Math.PI) / 180;
          const x1 = 100 + 10 * Math.cos(rad);
          const y1 = 100 + 10 * Math.sin(rad);
          const x2 = 100 + 95 * Math.cos(rad);
          const y2 = 100 + 95 * Math.sin(rad);
          return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} />;
        })}
      </g>
    </svg>
  );
}

const PIPELINE_STEPS = [
  { icon: Icon.phone, label: "CALL\nRECEIVED", active: true },
  { icon: Icon.doc, label: "TRANSCRIBED\n& SCORED" },
  { icon: Icon.route, label: "ROUTED TO\nDEPARTMENT" },
  { icon: Icon.officer, label: "OFFICER\nASSIGNED" },
  { icon: Icon.check, label: "RESOLVED\n& LOGGED" },
];

const FLOW_STEPS = [
  {
    num: "01",
    title: "Call Registered",
    desc: "Citizen dials a toll-free IVR line — no smartphone or internet required.",
  },
  {
    num: "02",
    title: "AI Urgency Scoring",
    desc: "Speech is transcribed and scored for urgency, category and sentiment.",
  },
  {
    num: "03",
    title: "Department Routing",
    desc: "Complaint is auto-routed to the correct department and jurisdiction.",
  },
  {
    num: "04",
    title: "Officer Resolution",
    desc: "Assigned officer resolves with deadline tracking and audit logging.",
  },
];

const DEPARTMENTS = [
  { icon: Icon.municipal, label: "Municipal" },
  { icon: Icon.water, label: "Water Supply" },
  { icon: Icon.bolt, label: "Electricity" },
  { icon: Icon.clock, label: "Police" },
  { icon: Icon.road, label: "Roads & PWD" },
  { icon: Icon.health, label: "Health" },
  { icon: Icon.education, label: "Education" },
  { icon: Icon.land, label: "Law/Order" },
];

const OFFICER_CARDS = [
  {
    title: "Deadline Tracking",
    desc: "Every complaint carries an SLA clock visible to the assigned officer and their reporting chain.",
  },
  {
    title: "Reassignment Controls",
    desc: "Officers can reassign or escalate complaints with a logged reason, never silently.",
  },
  {
    title: "District Heatmaps",
    desc: "Visualise complaint density and resolution lag by ward, block and department.",
  },
  {
    title: "Trust Scoring",
    desc: "Officer-level performance scoring based on turnaround time and citizen feedback.",
  },
  {
    title: "Escalation Workflow",
    desc: "Unresolved complaints auto-escalate up the hierarchy after SLA breach.",
  },
  {
    title: "Audit-Ready Records",
    desc: "Every action — assignment, reassignment, resolution — is timestamped and exportable.",
  },
];

const SECURITY_CARDS = [
  {
    icon: Icon.shield,
    title: "Data Sovereignty",
    desc: "All citizen and complaint data is hosted on servers located within India, in compliance with data residency norms.",
  },
  {
    icon: Icon.lock,
    title: "Encryption Standards",
    desc: "End-to-end encryption in transit and at rest, with role-based key management.",
  },
  {
    icon: Icon.officer,
    title: "Officer-Only Access",
    desc: "Granular, role-based access control aligned to department and jurisdiction hierarchy.",
  },
  {
    icon: Icon.list,
    title: "Immutable Audit Trail",
    desc: "Every assignment, escalation and resolution is logged and exportable for review.",
  },
];

export default function Landing() {
  const [form, setForm] = useState({
    name: "",
    designation: "",
    district: "",
    department: "",
    contact: "",
  });

  return (
    <div className="cc-root">
      <style>{STYLES}</style>

      <div className="cc-tricolor">
        <span className="s"></span>
        <span className="w"></span>
        <span className="g"></span>
      </div>

      <div className="cc-topbar">
        <div className="cc-container">
          <div className="cc-topbar-left">
            <a href="#">Skip to Main Content</a>
            <a href="#">Screen Reader Access</a>
          </div>
          <div className="cc-topbar-right">
            <button className="cc-lang-toggle">हिंदी</button>
          </div>
        </div>
      </div>

      <header className="cc-header">
        <div className="cc-container cc-header-inner">
          <div className="cc-brand">
            <CivicSeal />
            <div>
              <div className="cc-dept-line">
                Civic-Tech Platform · Proposed for Govt. e-Governance Mission
              </div>
              <div className="cc-title-line">
                CivicCall{" "}
                <span className="cc-hi">नागरिक शिकायत निवारण मंच</span>
              </div>
            </div>
          </div>
          <div className="cc-header-actions">
            <div className="cc-helpline">
              Helpline · <b>1857-855-6170</b>
            </div>
            <Link to="/login" className="cc-btn cc-btn-ghost">
              Staff Login
            </Link>
            <Link to="/signup" className="cc-btn cc-btn-solid">
              Access Dashboard
            </Link>
          </div>
        </div>
      </header>

      <section className="cc-hero">
        <ChakraWatermark />

        <div className="cc-container cc-hero-inner">
          <div>
            <div className="cc-live-badge">
              <span className="cc-pulse-dot"></span> In Development · Seeking
              Pilot District
            </div>
            <h1>
              Citizen Grievance Redressal &amp; Monitoring System
              <span className="cc-hi">
                नागरिक शिकायत निवारण एवं अनुश्रवण प्रणाली
              </span>
            </h1>
            <p className="cc-lede">
              Voice-first complaint registration, AI-driven urgency scoring, and
              automatic officer routing — built for districts where smartphones
              and broadband are not guaranteed, but accountability still is.
            </p>
            <div className="cc-hero-ctas">
              <Link to="/signup" className="cc-btn-primary-lg">
                Access Dashboard
              </Link>
              <a href="#pilot" className="cc-btn-secondary-lg">
                Request Pilot for Your District
              </a>
            </div>
          </div>

          <div className="cc-pipeline-card">
            <div className="cc-pipeline-title">
              <span>Complaint Pipeline — Demo</span>
              <span style={{ color: "#9FB4D6" }}>● SIMULATION</span>
            </div>
            <div className="cc-pipeline-row">
              <div className="cc-pipeline-line"></div>
              <div className="cc-scan"></div>
              {PIPELINE_STEPS.map((step, i) => (
                <div
                  key={i}
                  className={`cc-pnode ${step.active ? "cc-active" : ""}`}
                >
                  <div className="cc-icon">{step.icon({})}</div>
                  <div className="cc-label">
                    {step.label.split("\n").map((line, j) => (
                      <span key={j}>
                        {line}
                        <br />
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="cc-pipeline-foot">
              <span>
                Target routing time: <b>&lt;15 sec</b>
              </span>
              <span>
                Status: <b>Pre-Pilot</b>
              </span>
            </div>
          </div>
        </div>
      </section>

      <div className="cc-trust-strip">
        <div className="cc-container">
          <div className="cc-trust-item">
            {Icon.shield({})} Data hosted in India
          </div>
          <div className="cc-trust-item">
            {Icon.lock({})} End-to-end encryption
          </div>
          <div className="cc-trust-item">
            {Icon.officer({})} Officer-grade access control
          </div>
          <div className="cc-trust-item">{Icon.list({})} Full audit trail</div>
          <div className="cc-trust-item">{Icon.clock({})} 99.9% Uptime SLA</div>
        </div>
      </div>

      <div className="cc-stat-strip">
        <div className="cc-container cc-stat-grid">
          <div className="cc-stat">
            <div className="cc-num">7</div>
            <div className="cc-lbl">Departments Supported</div>
          </div>
          <div className="cc-stat">
            <div className="cc-num">
              <span>&lt;15s</span>
            </div>
            <div className="cc-lbl">Target Routing Time</div>
          </div>
          <div className="cc-stat">
            <div className="cc-num">
              24<small style={{ fontSize: "16px" }}>/7</small>
            </div>
            <div className="cc-lbl">Voice IVR Availability</div>
          </div>
          <div className="cc-stat">
            <div className="cc-num">0</div>
            <div className="cc-lbl">Smartphone Required</div>
          </div>
        </div>
      </div>

      <section className="cc-section cc-alt">
        <div className="cc-container">
          <div className="cc-section-head">
            <div className="cc-eyebrow">How It Works</div>
            <h2 className="cc-section-title">
              From a phone call to a closed file — automatically.
            </h2>
          </div>
          <div className="cc-flow">
            {FLOW_STEPS.map((step) => (
              <div key={step.num} className="cc-fstep">
                <div className="cc-num-badge">{step.num}</div>
                <h4>{step.title}</h4>
                <p>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="cc-section">
        <div className="cc-container">
          <div className="cc-section-head">
            <div className="cc-eyebrow">Old Way vs CivicCall Way</div>
            <h2 className="cc-section-title">
              Replace the register, not the responsibility.
            </h2>
          </div>
          <div className="cc-compare">
            <div className="cc-old">
              <h3>Manual Register System</h3>
              <ul>
                <li>{Icon.close({})} Paper-based complaint registers</li>
                <li>{Icon.close({})} Manual file movement between desks</li>
                <li>{Icon.close({})} No urgency-based prioritisation</li>
                <li>{Icon.close({})} Turnaround time: 12–20 days</li>
                <li>{Icon.close({})} No citizen visibility into status</li>
              </ul>
            </div>
            <div className="cc-new">
              <h3>CivicCall AI Pipeline</h3>
              <ul>
                <li>{Icon.check({})} Voice-based digital registration</li>
                <li>{Icon.check({})} Instant AI routing to officer</li>
                <li>{Icon.check({})} Urgency scoring on every complaint</li>
                <li>{Icon.check({})} Designed for turnaround under 48 hours</li>
                <li>
                  {Icon.check({})} SMS &amp; IVR status updates to citizen
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="cc-section cc-alt">
        <div className="cc-container">
          <div className="cc-section-head">
            <div className="cc-eyebrow">Departments Covered</div>
            <h2 className="cc-section-title">
              One platform, every department.
            </h2>
          </div>
          <div className="cc-dept-grid">
            {DEPARTMENTS.map((d) => (
              <div key={d.label} className="cc-dept-card">
                <div className="cc-icon">{d.icon({})}</div>
                <span>{d.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="cc-section">
        <div className="cc-container">
          <div className="cc-section-head">
            <div className="cc-eyebrow">For the Officer</div>
            <h2 className="cc-section-title">
              Built around accountability, not just intake.
            </h2>
          </div>
          <div className="cc-officer-grid">
            {OFFICER_CARDS.map((c) => (
              <div key={c.title} className="cc-officer-card">
                <h4>{c.title}</h4>
                <p>{c.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="cc-narrative">
        <div className="cc-container">
          <div
            className="cc-eyebrow"
            style={{ justifyContent: "center", color: "var(--saffron)" }}
          >
            A Changing Bharat
          </div>
          <p className="cc-quote">
            India's citizens have moved to smartphones, voice, and instant
            expectations.{" "}
            <span className="cc-accent">
              Grievance redressal hasn't moved with them — until now.
            </span>
          </p>
          <div className="cc-timeline">
            <div className="cc-tl-step">
              <div className="cc-dot"></div>
              <div className="cc-yr">1990s</div>
              <div className="cc-lbl">Manual Registers</div>
            </div>
            <div className="cc-tl-step">
              <div className="cc-dot"></div>
              <div className="cc-yr">2010s</div>
              <div className="cc-lbl">Call Centres</div>
            </div>
            <div className="cc-tl-step cc-now">
              <div className="cc-dot"></div>
              <div className="cc-yr">NOW</div>
              <div className="cc-lbl">CivicCall AI</div>
            </div>
          </div>
        </div>
      </section>

      <section className="cc-section cc-alt">
        <div className="cc-container">
          <div className="cc-section-head">
            <div className="cc-eyebrow">Security &amp; Compliance</div>
            <h2 className="cc-section-title">
              Built for government sign-off, not just for scale.
            </h2>
          </div>
          <div className="cc-security-grid">
            {SECURITY_CARDS.map((c) => (
              <div key={c.title} className="cc-sec-card">
                <div className="cc-icon">{c.icon({})}</div>
                <div>
                  <h4>{c.title}</h4>
                  <p>{c.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="pilot" className="cc-cta-banner">
        <div className="cc-container cc-cta-inner">
          <div>
            <h2>
              Be the first district to pilot CivicCall.{" "}
              <span className="cc-hi">पहले पायलट ज़िले के रूप में जुड़ें</span>
            </h2>
            <p
              style={{ marginTop: "14px", color: "#AEC0DD", maxWidth: "420px" }}
            >
              CivicCall is in active development. Share your details and our
              team will reach out to discuss a structured pilot for your
              district.
            </p>
          </div>
          <form
            className="cc-cta-form"
            onSubmit={(e) => {
              e.preventDefault();
              alert("Thank you. Our team will reach out shortly.");
            }}
          >
            <div className="cc-row">
              <input
                type="text"
                placeholder="Officer Name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
              <input
                type="text"
                placeholder="Designation"
                value={form.designation}
                onChange={(e) =>
                  setForm({ ...form, designation: e.target.value })
                }
              />
            </div>
            <div className="cc-row">
              <input
                type="text"
                placeholder="District"
                value={form.district}
                onChange={(e) => setForm({ ...form, district: e.target.value })}
              />
              <input
                type="text"
                placeholder="Department"
                value={form.department}
                onChange={(e) =>
                  setForm({ ...form, department: e.target.value })
                }
              />
            </div>
            <input
              type="text"
              placeholder="Official Email / Phone"
              value={form.contact}
              onChange={(e) => setForm({ ...form, contact: e.target.value })}
            />
            <button type="submit">Propose a Pilot</button>
          </form>
        </div>
      </section>

      <footer className="cc-footer">
        <div className="cc-container cc-footer-top">
          <div className="cc-footer-col">
            <h5>Quick Links</h5>
            <a href="#">RTI</a>
            <a href="#">Accessibility Statement</a>
            <a href="#">Terms of Use</a>
            <a href="#">Privacy Policy</a>
          </div>
          <div className="cc-footer-col">
            <h5>Platform</h5>
            <Link to="/officer-login">Officer Dashboard</Link>
            <a href="#pilot">District Onboarding</a>
            <a href="#">API Documentation</a>
          </div>
          <div className="cc-footer-col">
            <h5>Contact</h5>
            <a href="#">Helpline: 1800-345-6116</a>
            <a href="#">support@civiccall.gov.in</a>
            <a href="#">Dept. of IT, Govt. of Bihar</a>
          </div>
          <div className="cc-footer-col">
            <h5>Accessibility</h5>
            <span
              className="cc-sr-toggle"
              style={{ display: "inline-block", cursor: "pointer" }}
            >
              Screen Reader Access
            </span>
          </div>
        </div>
        <div className="cc-container cc-footer-bottom">
          <span>
            CivicCall is a civic-tech platform proposed for adoption under Govt.
            of e-Governance Mission. Not yet an official government
            system.
          </span>
          <span>
            Last Updated: 22 June 2026 · Best viewed in 1280×800 resolution
          </span>
        </div>
      </footer>
    </div>
  );
}

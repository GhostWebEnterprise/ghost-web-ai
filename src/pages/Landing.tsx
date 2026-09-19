import { useState } from "react";
import { Link } from "react-router";
import {
  Activity, ArrowRight, Bell, Bot, CheckCircle2, ChevronDown, CircleDot,
  Code2, Github, Grid3X3, Layers3, Menu, MoreHorizontal, Rocket, Search,
  Settings, ShieldCheck, Sparkles, Terminal, Users, Wrench, X, Zap,
} from "lucide-react";
import "@/styles/ghost-ai-home.css";

const pipeline = [
  ["Plan", "Analyze request & create plan", "complete"],
  ["Branch", "Create git branch", "complete"],
  ["Implement", "Write and test code", "complete"],
  ["Guardrails", "Security, license & code review", "complete"],
  ["CI Build", "Build and run tests", "running"],
  ["Repair", "Fix first real error (if any)", "pending"],
  ["Commit & Push", "Push changes to repository", "pending"],
  ["Pull Request", "Create and update PR", "pending"],
  ["Verify", "Final verification & artifacts", "pending"],
] as const;
const providers = [["OpenRouter","~1.2s"],["OpenAI","~1.4s"],["Anthropic","~1.8s"],["Ollama (Local)","~0.7s"],["SambaNova","~2.3s"]];
const agents = [["Code Architect","CA"],["Security Analyst","SA"],["DevOps Engineer","DE"],["QA Tester","QA"],["Documentation","DO"]];
const security = ["SAST (CodeQL)","Dependency Scan","License Check","Secret Scan","Container Scan"];
const artifacts = ["Build Artifacts","SBOM","Signature","Provenance"];
function GhostLogo({className=""}:{className?:string}){return <img src="/icon.svg" alt="GhostWeb AI" className={`gw-logo ${className}`} />;}
function StatusDot(){return <span className="gw-online-dot" aria-hidden="true"/>;}
export default function Landing(){
 const [mobileOpen,setMobileOpen]=useState(false); const [prompt,setPrompt]=useState("");
 return <div className="gw-ai-app">
  <header className="gw-ai-topbar">
   <div className="gw-ai-brand"><GhostLogo className="gw-logo-top"/><span>GhostWeb <b>AI</b></span></div>
   <div className="gw-ai-search"><Search className="size-4"/><input aria-label="Search" placeholder="Search repositories, tasks, or ask AI…"/><kbd>/</kbd></div>
   <div className="gw-ai-top-actions">
    <button className="gw-ghost-btn gw-github-btn"><Github className="size-4"/><span>GitHub Connected</span><small>GhostWebEnterprise</small></button>
    <button className="gw-icon-btn" aria-label="Notifications"><Bell className="size-4"/></button>
    <button className="gw-icon-btn" aria-label="Theme"><Sparkles className="size-4"/></button>
    <div className="gw-user-chip"><span>BM</span><div><b>Ben-Yamin Mester</b><small>Developer</small></div><ChevronDown className="size-3"/></div>
   </div>
   <button className="gw-mobile-menu" onClick={()=>setMobileOpen(v=>!v)} aria-label="Menu">{mobileOpen?<X/>:<Menu/>}</button>
  </header>
  <div className={`gw-ai-layout ${mobileOpen?"is-mobile-open":""}`}>
   <aside className="gw-ai-sidebar"><div className="gw-ai-nav">{[[Grid3X3,"Dashboard"],[Terminal,"Chat"],[Zap,"Build"],[Activity,"Pipeline"],[Users,"Team"],[Layers3,"Repositories"],[ShieldCheck,"Security"],[Settings,"Settings"]].map(([Icon,label],i)=><Link key={label as string} className={`gw-nav-item ${i===0?"active":""}`} to={i===0?"/":"/auth"}><Icon className="size-4"/><span>{label as string}</span></Link>)}</div><div className="gw-sidebar-status"><div><StatusDot/><b>System Online</b></div><small>All systems operational</small><span>v1.2.0</span></div></aside>
   <main className="gw-ai-main"><section className="gw-dashboard-grid"><div className="gw-dashboard-left">
    <section className="gw-ai-hero"><div className="gw-hero-mountain" aria-hidden="true"/><div className="gw-hero-content"><div className="gw-brand-line"><GhostLogo className="gw-logo-hero"/><b>GhostWeb AI</b></div><h1>Your AI-Powered<br/>Development Partner</h1><p>Plan <span>•</span> Build <span>•</span> Test <span>•</span> Secure <span>•</span> Deploy</p><div className="gw-hero-meta"><span>Private Intelligence.</span><span>Maximum Security.</span></div></div></section>
    <section className="gw-command-card"><div className="gw-tabs">{[[Terminal,"Chat"],[Zap,"Build"],[Code2,"Code"],[Bot,"Agents"]].map(([Icon,label],i)=><button key={label as string} className={i===0?"active":""}><Icon className="size-3.5"/>{label as string}</button>)}</div><textarea value={prompt} onChange={e=>setPrompt(e.target.value)} placeholder="Describe your project, feature or issue…" aria-label="Describe your project"/><div className="gw-command-footer"><div className="gw-controls"><button>⚙ GPT-5.6 <ChevronDown className="size-3"/></button><button><Github className="size-3"/> Web <ChevronDown className="size-3"/></button><button><Wrench className="size-3"/> Tools <ChevronDown className="size-3"/></button></div><Link className="gw-send" to="/auth"><ArrowRight className="size-5"/></Link></div></section>
    <div className="gw-quick-grid">{[[Sparkles,"Plan & Analyze","Create a plan"],[Code2,"Build & Code","Generate code"],[Wrench,"Fix & Improve","Debug and repair"],[Rocket,"Deploy & Release","Ship to production"]].map(([Icon,title,copy])=><Link to="/auth" className="gw-quick-card" key={title as string}><Icon className="size-4"/><span><b>{title as string}</b><small>{copy as string}</small></span></Link>)}</div>
    <div className="gw-three-grid">
     <section className="gw-card"><div className="gw-card-title"><span><Github className="size-4"/> Repository</span><em>✓ Synced</em></div><div className="gw-repo-name">GhostWebEnterprise/ghost-web-ai</div><div className="gw-repo-meta">AI-powered development platform with 15-agent team, security scanning and multi-provider support.</div><div className="gw-repo-stats"><span>☆ 12</span><span>⑂ 3</span><span>◫ 3</span></div><a href="https://github.com/GhostWebEnterprise/ghost-web-ai" target="_blank" rel="noreferrer">View repository <ArrowRight className="size-3"/></a></section>
     <section className="gw-card"><div className="gw-card-title"><span><Sparkles className="size-4"/> AI Providers</span><em>✓ Healthy</em></div><div className="gw-list">{providers.map(([name,latency])=><div key={name}><StatusDot/><span>{name}</span><small>{latency}</small></div>)}</div><Link to="/auth">Provider settings <ArrowRight className="size-3"/></Link></section>
     <section className="gw-card"><div className="gw-card-title"><span><Users className="size-4"/> 15-Agent Task Force</span><em>✓ Active</em></div><div className="gw-list">{agents.map(([name,tag])=><div key={name}><span className="gw-agent-icon">{tag}</span><span>{name}</span><small>1/1</small></div>)}</div><Link to="/auth">View all agents <ArrowRight className="size-3"/></Link></section>
    </div>
    <div className="gw-bottom-grid">
     <section className="gw-card"><div className="gw-card-title"><span><ShieldCheck className="size-4"/> Security &amp; CI</span><em>✓ All clear</em></div><div className="gw-check-list">{security.map(item=><div key={item}><CheckCircle2 className="size-3.5"/><span>{item}</span><small>Passed</small></div>)}</div><Link to="/auth">View security report <ArrowRight className="size-3"/></Link></section>
     <section className="gw-card"><div className="gw-card-title"><span><CheckCircle2 className="size-4"/> Artifact Verification</span><em>✓ Verified</em></div><div className="gw-check-list">{artifacts.map(item=><div key={item}><CheckCircle2 className="size-3.5"/><span>{item}</span><small>Verified</small></div>)}</div><Link to="/auth">View artifacts <ArrowRight className="size-3"/></Link></section>
     <section className="gw-card"><div className="gw-card-title"><span><Activity className="size-4"/> Recent Activity</span><em>View all →</em></div><div className="gw-activity"><div><StatusDot/><span>CI build completed successfully<br/><small>#1834 · Build &amp; Test</small></span><time>2m ago</time></div><div><StatusDot/><span>Security scan passed<br/><small>SAST, Dependency, License</small></span><time>4m ago</time></div><div><CircleDot className="size-3.5"/><span>PR created<br/><small>#1832 · Add AI provider support</small></span><time>6m ago</time></div><div><CircleDot className="size-3.5"/><span>Code committed<br/><small>feat: add multi-provider support</small></span><time>8m ago</time></div></div></section>
    </div>
   </div>
   <section className="gw-pipeline-card"><div className="gw-pipeline-head"><span>◈ Delivery Pipeline</span><em>● Running</em></div><div className="gw-pipeline">{pipeline.map(([title,copy,state],i)=><div className={`gw-pipeline-step ${state}`} key={title}><span className="gw-step-badge">{i+1}</span><div><b>{title}</b><small>{copy}</small></div><span className="gw-pipeline-state">{state==="complete"?"✓ Complete":state==="running"?"◔ Running":"◷ Pending"}</span></div>)}</div><div className="gw-pipeline-mobile-note">Live build state updates here as agents work.</div></section>
  </section></main>
  </div>
  <nav className="gw-mobile-nav"><Link to="/"><Terminal/><span>Chat</span></Link><Link to="/auth"><Zap/><span>Build</span></Link><Link to="/auth"><Users/><span>Team</span></Link><Link to="/"><Grid3X3/><span>Dashboard</span></Link><Link to="/auth"><MoreHorizontal/><span>More</span></Link></nav>
 </div>;
}

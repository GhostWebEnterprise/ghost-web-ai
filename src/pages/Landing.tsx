import { useMemo, useState } from "react";
import { Link } from "react-router";
import {
  Activity, ArrowRight, Bell, Bot, CheckCircle2, ChevronDown, CircleDot,
  Code2, Cpu, Github, Grid3X3, Layers3, Menu, MoreHorizontal, Rocket,
  Search, Settings, ShieldCheck, Sparkles, Terminal, Users, Wrench, X, Zap,
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

const providers: Array<[string, string]> = [
  ["OpenRouter", "~1.2s"], ["OpenAI", "~1.4s"], ["Anthropic", "~1.8s"],
  ["Ollama (Local)", "~0.7s"], ["SambaNova", "~2.3s"],
];
const agents: Array<[string, string]> = [
  ["Code Architect", "CA"], ["Security Analyst", "SA"], ["DevOps Engineer", "DE"],
  ["QA Tester", "QA"], ["Documentation", "DO"],
];
const security = ["SAST (CodeQL)", "Dependency Scan", "License Check", "Secret Scan", "Container Scan"];
const artifacts = ["Build Artifacts", "SBOM", "Signature", "Provenance"];

const navItems: Array<[typeof Grid3X3, string, string]> = [
  [Grid3X3, "Dashboard", "/dashboard"], [Terminal, "Chat", "/chat"], [Zap, "Build", "/build"],
  [Activity, "Pipeline", "/dashboard"], [Users, "Team", "/team"], [Layers3, "Repos", "/dashboard"],
  [ShieldCheck, "Security", "/securities"], [Settings, "Settings", "/settings"],
];

function Cross() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true">
      <path d="M8 0v16M0 8h16" stroke="currentColor" strokeWidth="1" />
    </svg>
  );
}

function Crosses() {
  return (
    <>
      <span className="px-cross tl"><Cross /></span>
      <span className="px-cross tr"><Cross /></span>
      <span className="px-cross bl"><Cross /></span>
      <span className="px-cross br"><Cross /></span>
    </>
  );
}

function NodeGraph() {
  const pts = [
    [10, 70], [34, 54], [22, 30], [58, 40], [46, 12], [82, 24], [72, 62], [104, 44],
  ];
  const edges = [[0, 1], [1, 2], [1, 3], [2, 4], [3, 4], [3, 5], [3, 6], [5, 7], [6, 7]];
  return (
    <svg className="px-nodes" viewBox="0 0 120 84" aria-hidden="true">
      {edges.map(([a, b], i) => (
        <line key={i} x1={pts[a][0]} y1={pts[a][1]} x2={pts[b][0]} y2={pts[b][1]} />
      ))}
      {pts.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={i % 3 === 0 ? 2.4 : 1.6} />
      ))}
    </svg>
  );
}

function useBinary(len: number, seed: number) {
  return useMemo(() => {
    let s = seed;
    let out = "";
    for (let i = 0; i < len; i++) {
      s = (s * 1103515245 + 12345) & 0x7fffffff;
      out += s % 2 === 0 ? "0" : "1";
      if (i % 6 === 5) out += " ";
    }
    return out;
  }, [len, seed]);
}

function StatusDot() {
  return <span className="px-dot" aria-hidden="true" />;
}

export default function Landing() {
  const [open, setOpen] = useState(false);
  const [prompt, setPrompt] = useState("");
  const binTop = useBinary(120, 7);
  const binBottom = useBinary(120, 42);

  return (
    <div className="px-app">
      <header className="px-top">
        <div className="px-brand">
          <span className="px-brand-mark">GW</span>
          <span>GHOST<b>//</b>WEB<b>.AI</b></span>
        </div>
        <dl className="px-top-read">
          <div><dt>Node</dt><dd>RX0-7</dd></div>
          <div><dt>Uptime</dt><dd>99.98%</dd></div>
          <div><dt>Queue</dt><dd>03</dd></div>
        </dl>
        <div className="px-top-actions">
          <div className="px-chip-btn">
            <Search className="size-4" />
            <span>Search / Ask</span>
            <small>[ / ]</small>
          </div>
          <button className="px-chip-btn" type="button">
            <Github className="size-4" /> Connected <small>GhostWebEnterprise</small>
          </button>
          <button className="px-icon-btn" aria-label="Notifications" type="button"><Bell className="size-4" /></button>
          <div className="px-user">
            <span>BM</span>
            <div><b>Ben-Yamin Mester</b><small>Developer</small></div>
            <ChevronDown className="size-3" />
          </div>
        </div>
        <button className="px-menu-btn" onClick={() => setOpen((v) => !v)} aria-label="Menu" type="button">
          {open ? <X className="size-4" /> : <Menu className="size-4" />}
        </button>
      </header>

      <div className={`px-shell ${open ? "open" : ""}`}>
        <aside className="px-side">
          <nav className="px-nav">
            {navItems.map(([Icon, label, href]) => (
              <Link key={label} to={href}>
                <Icon className="size-4" /><span>{label}</span>
              </Link>
            ))}
          </nav>
          <div className="px-side-status">
            <div className="row"><StatusDot /><b>System Online</b></div>
            <small>All systems operational</small>
            <b className="ver">BUILD v1.2.0 · RX0</b>
          </div>
        </aside>

        <main className="px-main">
          <div className="px-grid">
            <div className="px-col">
              {/* HERO */}
              <section className="px-frame px-hero">
                <div className="px-binary px-hero-binary t">{binTop}</div>
                <div className="px-binary px-hero-binary b">{binBottom}</div>
                <Crosses />
                <div className="px-eyebrow px-hero-tag">[ AGENT CHAIN ONLINE ]</div>
                <h1 className="px-glitch" data-text="GHOST WEB">GHOST WEB</h1>
                <div className="px-sub">AI DEV AGENT</div>
                <div className="px-hero-pipe">
                  <span><b>PLAN</b></span><span>/</span>
                  <span><b>BRANCH</b></span><span>/</span>
                  <span><b>BUILD</b></span><span>/</span>
                  <span><b>SELF-HEAL</b></span><span>/</span>
                  <span><b>SHIP</b></span>
                </div>
                <NodeGraph />
              </section>

              {/* CONSOLE */}
              <section className="px-frame px-console">
                <div className="px-tabs">
                  {([[Terminal, "Chat"], [Zap, "Build"], [Code2, "Code"], [Bot, "Agents"]] as const).map(
                    ([Icon, label], i) => (
                      <button key={label} className={i === 0 ? "active" : ""} type="button">
                        <Icon className="size-3.5" />{label}
                      </button>
                    ),
                  )}
                </div>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="> describe your project, feature or issue…"
                  aria-label="Describe your project"
                />
                <div className="px-console-foot">
                  <div className="px-ctrls">
                    <button type="button"><Cpu className="size-3" /> GPT-5.6 <ChevronDown className="size-3" /></button>
                    <button type="button"><Github className="size-3" /> Web <ChevronDown className="size-3" /></button>
                    <button type="button"><Wrench className="size-3" /> Tools <ChevronDown className="size-3" /></button>
                  </div>
                  <Link className="px-send" to={prompt.trim() ? `/chat?task=${encodeURIComponent(prompt.trim())}` : "/chat"} aria-label="Send"><ArrowRight className="size-5" /></Link>
                </div>
              </section>

              {/* QUICK ACTIONS */}
              <div className="px-quick">
                {([
                  [Sparkles, "Plan & Analyze", "Create a plan", "/build"],
                  [Code2, "Build & Code", "Generate code", "/chat"],
                  [Wrench, "Fix & Improve", "Debug and repair", "/chat"],
                  [Rocket, "Deploy & Release", "Ship to production", "/build"],
                ] as const).map(([Icon, title, copy, href], i) => (
                  <Link to={href} className="px-frame" key={title}>
                    <span className="idx">0{i + 1}</span>
                    <Icon className="size-4" />
                    <b>{title}</b>
                    <small>{copy}</small>
                  </Link>
                ))}
              </div>

              {/* INFO CARDS */}
              <div className="px-cards">
                <section className="px-frame px-card">
                  <div className="px-panel-head"><span className="t"><Github className="size-4" /> Repository</span><span className="s">Synced</span></div>
                  <div className="body">
                    <div className="px-repo-name">GhostWebEnterprise/ghost-web-ai</div>
                    <div className="px-repo-meta">AI-powered development platform with a 15-agent team, security scanning and multi-provider support.</div>
                    <div className="px-repo-stats"><span>STAR 12</span><span>FORK 3</span><span>ISSUE 3</span></div>
                    <a className="px-link" href="https://github.com/GhostWebEnterprise/ghost-web-ai" target="_blank" rel="noreferrer">View repository <ArrowRight className="size-3" /></a>
                  </div>
                </section>

                <section className="px-frame px-card">
                  <div className="px-panel-head"><span className="t"><Sparkles className="size-4" /> AI Providers</span><span className="s">Healthy</span></div>
                  <div className="body">
                    <div className="px-list">
                      {providers.map(([name, latency]) => (
                        <div key={name}><StatusDot /><span>{name}</span><small>{latency}</small></div>
                      ))}
                    </div>
                    <Link className="px-link" to="/settings">Provider settings <ArrowRight className="size-3" /></Link>
                  </div>
                </section>

                <section className="px-frame px-card">
                  <div className="px-panel-head"><span className="t"><Users className="size-4" /> 15-Agent Task Force</span><span className="s">Active</span></div>
                  <div className="body">
                    <div className="px-list">
                      {agents.map(([name, tag]) => (
                        <div key={name}><span className="px-agent">{tag}</span><span>{name}</span><small>1/1</small></div>
                      ))}
                    </div>
                    <Link className="px-link" to="/team">View all agents <ArrowRight className="size-3" /></Link>
                  </div>
                </section>

                <section className="px-frame px-card">
                  <div className="px-panel-head"><span className="t"><ShieldCheck className="size-4" /> Security &amp; CI</span><span className="s">All clear</span></div>
                  <div className="body">
                    <div className="px-checks">
                      {security.map((item) => (
                        <div key={item}><CheckCircle2 className="size-3.5" /><span>{item}</span><small>Passed</small></div>
                      ))}
                    </div>
                    <Link className="px-link" to="/securities">View security report <ArrowRight className="size-3" /></Link>
                  </div>
                </section>

                <section className="px-frame px-card">
                  <div className="px-panel-head"><span className="t"><CheckCircle2 className="size-4" /> Artifact Verification</span><span className="s">Verified</span></div>
                  <div className="body">
                    <div className="px-checks">
                      {artifacts.map((item) => (
                        <div key={item}><CheckCircle2 className="size-3.5" /><span>{item}</span><small>Verified</small></div>
                      ))}
                    </div>
                    <Link className="px-link" to="/securities">View artifacts <ArrowRight className="size-3" /></Link>
                  </div>
                </section>

                <section className="px-frame px-card">
                  <div className="px-panel-head"><span className="t"><Activity className="size-4" /> Recent Activity</span><span className="s">Live</span></div>
                  <div className="body">
                    <div className="px-activity">
                      <div><StatusDot /><span>CI build completed successfully<small>#1834 · Build &amp; Test</small></span><time>2m</time></div>
                      <div><StatusDot /><span>Security scan passed<small>SAST, Dependency, License</small></span><time>4m</time></div>
                      <div><CircleDot className="size-3.5" /><span>PR created<small>#1832 · Add AI provider support</small></span><time>6m</time></div>
                      <div><CircleDot className="size-3.5" /><span>Code committed<small>feat: add multi-provider support</small></span><time>8m</time></div>
                    </div>
                  </div>
                </section>
              </div>
            </div>

            {/* PIPELINE */}
            <section className="px-frame px-pipe">
              <div className="px-panel-head"><span className="t"><Activity className="size-4" /> Delivery Pipeline</span><span className="s">Running</span></div>
              <div className="steps">
                {pipeline.map(([title, copy, state], i) => (
                  <div className={`px-step ${state}`} key={title}>
                    <span className="badge">{String(i + 1).padStart(2, "0")}</span>
                    <div><b>{title}</b><small>{copy}</small></div>
                    <span className="st">{state === "complete" ? "Done" : state === "running" ? "Run" : "Wait"}</span>
                  </div>
                ))}
              </div>
              <div className="px-pipe-note">Live build state updates here as agents work through the chain.</div>
            </section>
          </div>
        </main>
      </div>

      <nav className="px-mnav">
        <Link to="/chat"><Terminal /><span>Chat</span></Link>
        <Link to="/build"><Zap /><span>Build</span></Link>
        <Link to="/team"><Users /><span>Team</span></Link>
        <Link to="/dashboard"><Grid3X3 /><span>Dash</span></Link>
        <Link to="/settings"><MoreHorizontal /><span>More</span></Link>
      </nav>
    </div>
  );
}

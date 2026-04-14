import { useState, useCallback } from "react";

const C = {
  dark: "#141413", light: "#faf9f5", surface: "#fffefa", surfaceAlt: "#f7f5ee",
  surfaceHover: "#f3f0e8", midGray: "#b0aea5", lightGray: "#e8e6dc",
  orange: "#d97757", orangeHover: "#c4634a", orangeLight: "#fef2ee",
  blue: "#6a9bcc", green: "#788c5d", purple: "#b07cc6", gold: "#d4a259", teal: "#6aadad",
  border: "#e0ddd3", borderStrong: "#ccc9be",
  textPrimary: "#1a1a19", textSecondary: "#5a584f", textMuted: "#8a877d",
};
const DEPTH_COLORS = ["#d97757", "#6a9bcc", "#788c5d", "#b07cc6", "#d4a259", "#6aadad"];

const SYSTEM_PROMPT = `You are a MECE (Mutually Exclusive, Collectively Exhaustive) decomposition expert.

When given a topic, break it into MECE categories. Each category must be:
- Mutually Exclusive: No overlaps between categories
- Collectively Exhaustive: Together they cover the entire topic

IMPORTANT: Evaluate whether this topic CAN be meaningfully decomposed further. If the topic is:
- Too atomic/granular to split further
- A concrete action item rather than a category
- Something where sub-categories would be forced or overlapping
Then set "decomposable" to false.

Respond ONLY with valid JSON, no markdown, no backticks:
{
  "confidence": "high" | "medium" | "low",
  "confidence_reason": "Brief reason if medium/low",
  "categories": [
    {
      "name": "Short Name",
      "description": "One sentence description",
      "decomposable": true
    }
  ]
}

Rules:
- 3-6 categories per decomposition
- Names: 2-4 words max
- Descriptions: one concise sentence
- confidence: "high" = clean MECE split, "medium" = reasonable but some overlap possible, "low" = topic too granular or categories are forced
- Set decomposable: false on categories that are too atomic to split further`;

function AnthropicMark({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M13.5 2L22 22H17.2L14.7 16H9.3L13.5 2Z" fill={C.orange} />
      <path d="M10.5 2L2 22H6.8L9.3 16H14.7L10.5 2Z" fill={C.orange} opacity="0.6" />
    </svg>
  );
}

function PlusIcon({ color, size = 16 }) {
  return (<svg width={size} height={size} viewBox="0 0 16 16" fill="none"><path d="M8 3.5V12.5M3.5 8H12.5" stroke={color} strokeWidth="1.8" strokeLinecap="round" /></svg>);
}
function MinusIcon({ color, size = 16 }) {
  return (<svg width={size} height={size} viewBox="0 0 16 16" fill="none"><path d="M3.5 8H12.5" stroke={color} strokeWidth="1.8" strokeLinecap="round" /></svg>);
}

function LoadingDots({ color }) {
  return (
    <span style={{ display: "inline-flex", gap: 3 }}>
      {[0, 1, 2].map(i => (
        <span key={i} style={{
          width: 4, height: 4, borderRadius: "50%", background: color,
          animation: `dotPulse 1s ease-in-out ${i * 0.15}s infinite`,
        }} />
      ))}
    </span>
  );
}

function Tooltip({ text, children }) {
  const [show, setShow] = useState(false);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  return (
    <span
      style={{ position: "relative", display: "inline-flex", alignItems: "center" }}
      onMouseEnter={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        setPos({ x: r.left + r.width / 2, y: r.top });
        setShow(true);
      }}
      onMouseLeave={() => setShow(false)}
    >
      {children}
      {show && text && (
        <span style={{
          position: "fixed", left: Math.min(pos.x, typeof window !== "undefined" ? window.innerWidth - 260 : 500), top: pos.y - 8,
          transform: "translateX(-50%) translateY(-100%)",
          background: C.dark, color: "#e8e6dc", padding: "8px 12px", borderRadius: 8,
          fontSize: 12, lineHeight: 1.5, maxWidth: 280, width: "max-content",
          fontFamily: "'Lora', Georgia, serif", fontWeight: 400,
          boxShadow: "0 4px 16px rgba(20,20,19,0.2)",
          zIndex: 100, pointerEvents: "none",
          animation: "tooltipIn 0.15s ease",
        }}>
          {text}
          <span style={{
            position: "absolute", bottom: -4, left: "50%", transform: "translateX(-50%) rotate(45deg)",
            width: 8, height: 8, background: C.dark,
          }} />
        </span>
      )}
    </span>
  );
}

function ConfidenceBanner({ confidence, reason, onDismiss }) {
  if (confidence === "high") return null;
  const isLow = confidence === "low";
  return (
    <div style={{
      padding: "8px 16px 8px 44px",
      background: isLow ? "#fef2ee" : "#fdf8ee",
      borderBottom: `1px solid ${isLow ? C.orange + "33" : C.gold + "33"}`,
      display: "flex", alignItems: "center", gap: 8,
      fontSize: 12, color: isLow ? C.orange : "#9a7b2e",
      fontFamily: "'Lora', Georgia, serif", fontStyle: "italic",
      animation: "slideDown 0.2s ease",
    }}>
      <span style={{ fontWeight: 600, fontStyle: "normal", fontFamily: "'Poppins', Arial, sans-serif" }}>
        {isLow ? "⚠ Low confidence" : "◐ Medium confidence"}
      </span>
      <span style={{ color: isLow ? "#c4634a" : "#8a6d24" }}>—</span>
      <span>{reason}</span>
      <button onClick={onDismiss} style={{
        marginLeft: "auto", background: "none", border: "none", cursor: "pointer",
        color: isLow ? C.orange : "#9a7b2e", fontSize: 14, padding: "0 4px", lineHeight: 1,
      }}>×</button>
    </div>
  );
}

function TreeRow({ node, nodes, expanded, loading, notifications, onToggle, onExpand, onDismiss, depth = 0 }) {
  const color = DEPTH_COLORS[depth % DEPTH_COLORS.length];
  const isExpanded = expanded.has(node.id);
  const isLoading = loading === node.id;
  const children = nodes.filter(n => n.parentId === node.id);
  const hasChildren = children.length > 0;
  const canDecompose = node.decomposable !== false;
  const isTerminal = !canDecompose && !hasChildren;
  const [hovered, setHovered] = useState(false);
  const notification = notifications[node.id];

  return (
    <>
      <tr
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{ background: hovered ? C.surfaceHover : "transparent", transition: "background 0.12s ease" }}
      >
        <td style={{ padding: 0, borderBottom: `1px solid ${C.border}`, fontFamily: "'Poppins', Arial, sans-serif" }}>
          <div style={{ display: "flex", alignItems: "center", paddingLeft: depth * 28 + 16, minHeight: 44, gap: 0 }}>
            {/* +/- or leaf */}
            <span style={{ width: 28, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              {isLoading ? (
                <LoadingDots color={color} />
              ) : hasChildren ? (
                <button onClick={(e) => { e.stopPropagation(); onToggle(node.id); }} style={{
                  width: 22, height: 22, borderRadius: 6, border: `1px solid ${color}40`,
                  background: isExpanded ? `${color}12` : "transparent",
                  cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s ease",
                }} title={isExpanded ? "Collapse" : "Expand"}>
                  {isExpanded ? <MinusIcon color={color} size={14} /> : <PlusIcon color={color} size={14} />}
                </button>
              ) : canDecompose ? (
                <button onClick={(e) => { e.stopPropagation(); onExpand(node); }} style={{
                  width: 22, height: 22, borderRadius: 6, border: `1px solid ${C.border}`,
                  background: hovered ? `${color}08` : "transparent",
                  cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "all 0.15s ease", opacity: hovered ? 1 : 0.5,
                }} title="Decompose this category">
                  <PlusIcon color={color} size={14} />
                </button>
              ) : (
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="2.5" fill={color} opacity="0.35" /></svg>
              )}
            </span>
            {/* Color bar */}
            <span style={{ width: 3, height: 20, borderRadius: 2, background: color, opacity: depth === 0 ? 1 : 0.45, flexShrink: 0, marginRight: 10, marginLeft: 6 }} />
            {/* Label with tooltip */}
            <Tooltip text={node.description !== "Root topic" ? node.description : null}>
              <span style={{
                fontSize: depth === 0 ? 15 : 14, fontWeight: depth === 0 ? 700 : 600,
                color: isTerminal ? C.textSecondary : C.textPrimary, lineHeight: 1.3, cursor: "default",
                borderBottom: (hovered && node.description && node.description !== "Root topic") ? `1px dashed ${C.midGray}` : "1px dashed transparent",
                transition: "border-color 0.15s", paddingBottom: 1,
              }}>
                {node.label}
              </span>
            </Tooltip>
            {/* Terminal badge */}
            {isTerminal && (
              <span style={{
                marginLeft: 8, fontSize: 10, fontWeight: 600, color: C.textMuted,
                background: C.lightGray, padding: "2px 7px", borderRadius: 4,
                fontFamily: "'Poppins', Arial, sans-serif",
              }}>LEAF</span>
            )}
          </div>
        </td>
      </tr>
      {/* Confidence banner */}
      {notification && isExpanded && (
        <tr><td style={{ padding: 0, borderBottom: `1px solid ${C.border}` }}>
          <ConfidenceBanner confidence={notification.confidence} reason={notification.reason} onDismiss={() => onDismiss(node.id)} />
        </td></tr>
      )}
      {/* Children */}
      {isExpanded && children.map(child => (
        <TreeRow key={child.id} node={child} nodes={nodes} expanded={expanded} loading={loading}
          notifications={notifications} onToggle={onToggle} onExpand={onExpand} onDismiss={onDismiss} depth={depth + 1} />
      ))}
    </>
  );
}

export default function MECEExplorer() {
  const [topic, setTopic] = useState("Tennis Rackets");
  const [nodes, setNodes] = useState([]);
  const [expanded, setExpanded] = useState(new Set());
  const [loading, setLoading] = useState(null);
  const [started, setStarted] = useState(false);
  const [error, setError] = useState(null);
  const [notifications, setNotifications] = useState({});

  const callClaude = useCallback(async (prompt) => {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1000,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: prompt }],
      }),
    });
    const data = await res.json();
    const text = data.content?.map(b => b.text || "").join("") || "";
    return JSON.parse(text.replace(/```json|```/g, "").trim());
  }, []);

  const getPath = useCallback((node) => {
    const path = [];
    let cur = node;
    while (cur) { path.unshift(cur.label); cur = nodes.find(n => n.id === cur.parentId); }
    return path;
  }, [nodes]);

  const startExploration = useCallback(async () => {
    if (!topic.trim()) return;
    setError(null); setStarted(true); setNodes([]); setExpanded(new Set()); setNotifications({});
    const rootId = "root";
    setNodes([{ id: rootId, label: topic.trim(), depth: 0, parentId: null, description: "Root topic", decomposable: true }]);
    setLoading(rootId);
    try {
      const r = await callClaude(`Break down this topic into MECE categories: "${topic.trim()}"`);
      const kids = r.categories.map((c, i) => ({
        id: `${rootId}-${i}`, label: c.name, description: c.description,
        depth: 1, parentId: rootId, decomposable: c.decomposable !== false,
      }));
      setNodes(prev => [...prev, ...kids]);
      setExpanded(new Set([rootId]));
      if (r.confidence && r.confidence !== "high") {
        setNotifications(prev => ({ ...prev, [rootId]: { confidence: r.confidence, reason: r.confidence_reason || "Decomposition may not be fully MECE." } }));
      }
    } catch (e) { setError("Failed to generate breakdown. Please try again."); console.error(e); }
    setLoading(null);
  }, [topic, callClaude]);

  const expandNode = useCallback(async (node) => {
    if (expanded.has(node.id) || loading) return;
    setError(null); setLoading(node.id);
    const path = getPath(node);
    try {
      const prompt = `We are doing a MECE decomposition. Full path: ${path.join(" → ")}. Now break down "${node.label}" into MECE sub-categories within the context of the root topic "${path[0]}".`;
      const r = await callClaude(prompt);
      const kids = r.categories.map((c, i) => ({
        id: `${node.id}-${i}`, label: c.name, description: c.description,
        depth: node.depth + 1, parentId: node.id, decomposable: c.decomposable !== false,
      }));
      setNodes(prev => [...prev, ...kids]);
      setExpanded(prev => new Set([...prev, node.id]));
      if (r.confidence && r.confidence !== "high") {
        setNotifications(prev => ({ ...prev, [node.id]: { confidence: r.confidence, reason: r.confidence_reason || "Further decomposition may not be fully MECE." } }));
      }
    } catch (e) { setError("Failed to expand. Try again."); console.error(e); }
    setLoading(null);
  }, [expanded, loading, getPath, callClaude]);

  const toggleExpanded = useCallback((nodeId) => {
    setExpanded(prev => { const n = new Set(prev); if (n.has(nodeId)) n.delete(nodeId); else n.add(nodeId); return n; });
  }, []);

  const dismissNotification = useCallback((nodeId) => {
    setNotifications(prev => { const n = { ...prev }; delete n[nodeId]; return n; });
  }, []);

  const rootNodes = nodes.filter(n => n.parentId === null);
  const nodeCount = nodes.length;
  const depthMax = nodes.reduce((m, n) => Math.max(m, n.depth), 0);

  if (!started) {
    return (
      <div style={{
        minHeight: "100vh", background: C.light, display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", fontFamily: "'Poppins', Arial, sans-serif", padding: 24,
      }}>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&family=Lora:ital,wght@0,400;0,500;0,600;1,400&display=swap');
          @keyframes dotPulse { 0%,100%{opacity:.3;transform:scale(.8)} 50%{opacity:1;transform:scale(1.2)} }
          @keyframes tooltipIn { from{opacity:0;transform:translateX(-50%) translateY(calc(-100% + 4px))} to{opacity:1;transform:translateX(-50%) translateY(-100%)} }
          @keyframes slideDown { from{opacity:0;max-height:0} to{opacity:1;max-height:60px} }
          *{box-sizing:border-box;margin:0;padding:0} input::placeholder{color:${C.midGray}}
        `}</style>
        <div style={{ position:"fixed",inset:0,opacity:0.35,backgroundImage:`radial-gradient(circle,${C.borderStrong} 0.8px,transparent 0.8px)`,backgroundSize:"28px 28px" }}/>
        <div style={{ position:"relative",textAlign:"center",maxWidth:500 }}>
          <div style={{ display:"inline-flex",alignItems:"center",gap:8,marginBottom:20,background:C.surface,padding:"8px 16px",borderRadius:24,border:`1px solid ${C.border}`,boxShadow:"0 1px 3px rgba(20,20,19,0.04)" }}>
            <AnthropicMark size={18}/>
            <span style={{ fontSize:11,fontWeight:600,color:C.textSecondary,textTransform:"uppercase",letterSpacing:"0.1em" }}>Structured Thinking</span>
          </div>
          <h1 style={{ fontSize:44,fontWeight:700,color:C.dark,lineHeight:1.1,marginBottom:14,letterSpacing:"-0.02em" }}>MECE Explorer</h1>
          <p style={{ fontSize:16,color:C.textSecondary,lineHeight:1.65,marginBottom:36,fontFamily:"'Lora', Georgia, serif",maxWidth:400,margin:"0 auto 36px" }}>
            Enter any topic and get a structured, mutually exclusive &amp; collectively exhaustive breakdown. Expand categories to dig deeper.
          </p>
          <div style={{ display:"flex",gap:10 }}>
            <input type="text" value={topic} onChange={e=>setTopic(e.target.value)} onKeyDown={e=>e.key==="Enter"&&startExploration()}
              placeholder="e.g. Product Strategy, Climate Change..."
              style={{ flex:1,padding:"15px 20px",fontSize:15,background:C.surface,border:`1px solid ${C.border}`,borderRadius:12,color:C.textPrimary,outline:"none",fontFamily:"'Lora', Georgia, serif",boxShadow:"0 1px 3px rgba(20,20,19,0.04)",transition:"border-color 0.2s, box-shadow 0.2s" }}
              onFocus={e=>{e.target.style.borderColor=C.orange;e.target.style.boxShadow=`0 0 0 3px ${C.orange}18`}}
              onBlur={e=>{e.target.style.borderColor=C.border;e.target.style.boxShadow="0 1px 3px rgba(20,20,19,0.04)"}}
            />
            <button onClick={startExploration} disabled={!topic.trim()} style={{
              padding:"15px 28px",fontSize:14,fontWeight:600,background:C.orange,color:"#fff",border:"none",borderRadius:12,cursor:"pointer",
              opacity:topic.trim()?1:0.4,fontFamily:"'Poppins', Arial, sans-serif",boxShadow:`0 2px 8px ${C.orange}33`,transition:"background 0.15s, transform 0.15s",
            }}
              onMouseEnter={e=>{if(topic.trim()){e.target.style.background=C.orangeHover;e.target.style.transform="translateY(-1px)"}}}
              onMouseLeave={e=>{e.target.style.background=C.orange;e.target.style.transform="translateY(0)"}}
            >Decompose</button>
          </div>
          <div style={{ marginTop:28,display:"flex",gap:10,justifyContent:"center",flexWrap:"wrap" }}>
            {["Product Strategy","Climate Change","AI Risk","Supply Chain"].map(ex=>(
              <button key={ex} onClick={()=>setTopic(ex)} style={{
                padding:"7px 16px",fontSize:12,fontWeight:500,background:C.surfaceAlt,border:`1px solid ${C.border}`,borderRadius:20,color:C.textSecondary,
                cursor:"pointer",fontFamily:"'Poppins', Arial, sans-serif",transition:"all 0.15s",
              }}
                onMouseEnter={e=>{e.target.style.borderColor=C.orange;e.target.style.color=C.textPrimary}}
                onMouseLeave={e=>{e.target.style.borderColor=C.border;e.target.style.color=C.textSecondary}}
              >{ex}</button>
            ))}
          </div>
          <div style={{ marginTop:48,fontSize:11,color:C.textMuted,fontFamily:"'Lora', Georgia, serif",fontStyle:"italic" }}>Powered by Claude · Anthropic</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight:"100vh",background:C.light,fontFamily:"'Poppins', Arial, sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&family=Lora:ital,wght@0,400;0,500;0,600;1,400&display=swap');
        @keyframes dotPulse { 0%,100%{opacity:.3;transform:scale(.8)} 50%{opacity:1;transform:scale(1.2)} }
        @keyframes tooltipIn { from{opacity:0;transform:translateX(-50%) translateY(calc(-100% + 4px))} to{opacity:1;transform:translateX(-50%) translateY(-100%)} }
        @keyframes slideDown { from{opacity:0;max-height:0} to{opacity:1;max-height:60px} }
        *{box-sizing:border-box;margin:0;padding:0}
      `}</style>
      <div style={{
        padding:"14px 24px",borderBottom:`1px solid ${C.border}`,display:"flex",alignItems:"center",justifyContent:"space-between",
        background:C.surface,position:"sticky",top:0,zIndex:10,
      }}>
        <div style={{ display:"flex",alignItems:"center",gap:12 }}>
          <button onClick={()=>{setStarted(false);setNodes([]);setExpanded(new Set());setNotifications({})}} style={{
            display:"flex",alignItems:"center",gap:6,padding:"7px 14px",fontSize:12,fontWeight:600,background:C.surfaceAlt,
            border:`1px solid ${C.border}`,borderRadius:8,color:C.textSecondary,cursor:"pointer",fontFamily:"'Poppins', Arial, sans-serif",
          }}><AnthropicMark size={14}/> New</button>
          <div style={{ height:20,width:1,background:C.border }}/>
          <h2 style={{ fontSize:16,fontWeight:700,color:C.textPrimary,margin:0 }}>{topic}</h2>
        </div>
        <div style={{ display:"flex",alignItems:"center",gap:16,fontSize:12,color:C.textMuted,fontWeight:500 }}>
          <span>{nodeCount} nodes</span>
          <span style={{ color:C.border }}>·</span>
          <span>{depthMax} deep</span>
          <span style={{ color:C.border }}>·</span>
          <span style={{ fontSize:10,padding:"2px 8px",borderRadius:4,background:C.lightGray,color:C.textSecondary }}>hover for details</span>
        </div>
      </div>
      {error && (
        <div style={{ margin:"12px 24px 0",padding:"10px 18px",borderRadius:10,background:C.orangeLight,border:`1px solid ${C.orange}33`,fontSize:13,color:C.orange,fontFamily:"'Lora', Georgia, serif" }}>{error}</div>
      )}
      <div style={{ padding:"0 24px 48px",maxWidth:720,margin:"0 auto" }}>
        <table style={{ width:"100%",borderCollapse:"collapse",marginTop:4 }}>
          <tbody>
            {rootNodes.map(node=>(
              <TreeRow key={node.id} node={node} nodes={nodes} expanded={expanded} loading={loading}
                notifications={notifications} onToggle={toggleExpanded} onExpand={expandNode} onDismiss={dismissNotification} depth={0}/>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

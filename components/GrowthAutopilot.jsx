"use client";

import { useEffect, useState } from "react";

function money(pence = 0) {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format((Number(pence) || 0) / 100);
}

export default function GrowthAutopilot() {
  const [data, setData] = useState(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function refresh() {
    const response = await fetch("/api/growth/status", { cache: "no-store" });
    const body = await response.json();
    if (!response.ok) throw new Error(body.error || "Could not load growth status");
    setData(body);
  }

  useEffect(() => { refresh().catch((error) => setMessage(error.message)); }, []);

  async function plan() {
    setBusy(true); setMessage("Planning next experiments…");
    try {
      const response = await fetch("/api/growth/plan", { method: "POST" });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Planner failed");
      setMessage(`Plan created: ${body.plan?.summary || "ready"}`);
      await refresh();
    } catch (error) { setMessage(error.message); }
    finally { setBusy(false); }
  }

  async function configure(patch) {
    setBusy(true);
    try {
      const response = await fetch("/api/growth/config", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(patch) });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Update failed");
      setMessage(patch.stop_requested ? "Autopilot stopped." : `Autopilot updated${patch.mode ? ` to ${patch.mode}` : ""}.`);
      await refresh();
    } catch (error) { setMessage(error.message); }
    finally { setBusy(false); }
  }

  if (!data) return <main style={{maxWidth:1100,margin:"60px auto",padding:24}}><h1>RentClock Growth Autopilot</h1><p>{message || "Loading…"}</p></main>;
  const { state, actions = [], runs = [] } = data;

  return <main style={{maxWidth:1100,margin:"40px auto",padding:24,fontFamily:"system-ui,sans-serif"}}>
    <div style={{display:"flex",justifyContent:"space-between",gap:16,alignItems:"center",flexWrap:"wrap"}}>
      <div><div style={{fontSize:13,textTransform:"uppercase",letterSpacing:1.4,opacity:.65}}>Internal workspace</div><h1 style={{margin:"4px 0"}}>Growth Autopilot</h1><p style={{margin:0,opacity:.75}}>Objective: maximise paid subscriptions without risking more than £100/month.</p></div>
      <button disabled={busy} onClick={() => configure({stop_requested:true,mode:"dry_run"})} style={{padding:"14px 20px",fontWeight:800,borderRadius:10,border:"2px solid #b42318",background:"#fff",color:"#b42318"}}>■ STOP AUTOPILOT</button>
    </div>

    <section style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",gap:12,margin:"28px 0"}}>
      {[["Spent",money(state.spent_pence)],["Remaining",money(state.remaining_pence)],["Trials",state.trials],["Paid customers",state.paid_customers],["Revenue",money(state.revenue_pence)]].map(([label,value]) => <div key={label} style={{padding:18,border:"1px solid #ddd",borderRadius:14}}><div style={{fontSize:13,opacity:.65}}>{label}</div><div style={{fontSize:28,fontWeight:800,marginTop:5}}>{value}</div></div>)}
    </section>

    <section style={{padding:20,border:"1px solid #ddd",borderRadius:14,marginBottom:22}}>
      <h2 style={{marginTop:0}}>Control mode</h2>
      <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
        {["dry_run","approval","autonomous"].map((mode) => <button key={mode} disabled={busy} onClick={() => configure({mode,stop_requested:false})} style={{padding:"10px 14px",borderRadius:9,border:"1px solid #aaa",fontWeight:700,background:state.mode===mode?"#111":"#fff",color:state.mode===mode?"#fff":"#111"}}>{mode.replace("_"," ")}</button>)}
        <button disabled={busy || state.stop_requested} onClick={plan} style={{padding:"10px 16px",borderRadius:9,border:0,fontWeight:800,background:"#111",color:"#fff",marginLeft:"auto"}}>🤖 Plan next move</button>
      </div>
      <p style={{marginBottom:0,opacity:.72}}>Dry run can never execute external actions. Approval mode queues changes. Autonomous mode only auto-allows the narrow low-risk action list; new campaigns and channels still require approval.</p>
      {message && <p style={{fontWeight:650}}>{message}</p>}
    </section>

    <section style={{marginBottom:26}}><h2>Latest AI actions</h2>{actions.length===0?<p>No actions yet. Run the planner to create the first batch.</p>:<div style={{display:"grid",gap:10}}>{actions.map((action)=><div key={action.id} style={{padding:15,border:"1px solid #ddd",borderRadius:12}}><div style={{display:"flex",justifyContent:"space-between",gap:12}}><strong>{action.action_type} · {action.channel || "internal"}</strong><span>{action.status}</span></div><div style={{marginTop:6}}>{action.target}</div><div style={{opacity:.72,fontSize:14,marginTop:5}}>{action.reason}</div>{action.validation_reason&&<div style={{fontSize:13,marginTop:5,color:"#b42318"}}>{action.validation_reason}</div>}</div>)}</div>}</section>

    <section><h2>Planner history</h2>{runs.map((run)=><div key={run.id} style={{padding:"10px 0",borderBottom:"1px solid #eee"}}><strong>{new Date(run.created_at).toLocaleString("en-GB")}</strong> · {run.mode}<div style={{opacity:.75}}>{run.summary}</div></div>)}</section>
  </main>;
}

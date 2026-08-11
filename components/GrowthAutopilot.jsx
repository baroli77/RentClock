"use client";

import { useEffect, useState } from "react";

function money(pence = 0) {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format((Number(pence) || 0) / 100);
}

function statusLabel(action, mode) {
  if (mode === "dry_run" && action.status === "blocked" && action.validation_reason?.includes("Dry-run")) return "simulated";
  return String(action.status || "unknown").replaceAll("_", " ");
}

function ConnectionCard({ name, provider, connection }) {
  const ready = connection?.connected && connection?.verified;
  const oauthReady = connection?.oauthReady;
  const developerReady = connection?.developerTokenReady;
  const href = `/api/growth/connections/${provider}/connect`;
  return <div style={{padding:18,border:"1px solid #ddd",borderRadius:14,display:"grid",gap:10}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:12}}>
      <strong style={{fontSize:17}}>{name}</strong>
      <span style={{fontWeight:800,color:ready?"#067647":connection?.connected?"#b54708":"#667085"}}>{ready?"● Ready":connection?.connected?"● Authorised":"○ Not connected"}</span>
    </div>
    {connection?.accountId && <div style={{fontSize:14}}>Account: <strong>{connection.accountId}</strong></div>}
    <div style={{fontSize:13,opacity:.74,lineHeight:1.45}}>
      {!oauthReady ? "OAuth application credentials still need configuring. " : "OAuth is configured. "}
      {!developerReady ? "A developer token is still required before RentClock can read or manage campaigns." : "Developer token is configured."}
    </div>
    <a href={href} aria-disabled={!oauthReady} onClick={(event)=>{if(!oauthReady) event.preventDefault();}} style={{justifySelf:"start",padding:"9px 13px",borderRadius:8,textDecoration:"none",fontWeight:800,background:oauthReady?"#111":"#eee",color:oauthReady?"#fff":"#888",pointerEvents:oauthReady?"auto":"none"}}>{connection?.connected?"Reconnect":"Connect"} {name}</a>
  </div>;
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

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("connectionError")) setMessage(params.get("connectionError"));
    else if (params.get("googleAds") === "connected") setMessage("Google Ads authorised successfully.");
    else if (params.get("microsoftAds") === "connected") setMessage("Microsoft Advertising authorised successfully.");
    refresh().catch((error) => setMessage(error.message));
  }, []);

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
    if (patch.mode === "autonomous" && !window.confirm("Enable autonomous mode? RentClock will be allowed to execute only the low-risk action allow-list within the hard £100 monthly cap. New campaigns and channels still require approval.")) return;
    setBusy(true);
    try {
      const response = await fetch("/api/growth/config", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(patch) });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Update failed");
      setMessage(patch.stop_requested ? "Autopilot stopped. No external actions can run." : `Autopilot updated${patch.mode ? ` to ${patch.mode.replace("_"," ")}` : ""}.`);
      await refresh();
    } catch (error) { setMessage(error.message); }
    finally { setBusy(false); }
  }

  if (!data) return <main style={{maxWidth:1100,margin:"60px auto",padding:24}}><h1>RentClock Growth Autopilot</h1><p>{message || "Loading…"}</p></main>;
  const { state, actions = [], runs = [], adConnections = {} } = data;
  const isStopped = state.stop_requested;

  return <main style={{maxWidth:1100,margin:"40px auto",padding:24,fontFamily:"system-ui,sans-serif"}}>
    <div style={{display:"flex",justifyContent:"space-between",gap:16,alignItems:"center",flexWrap:"wrap"}}>
      <div><div style={{fontSize:13,textTransform:"uppercase",letterSpacing:1.4,opacity:.65}}>Internal workspace</div><h1 style={{margin:"4px 0"}}>Growth Autopilot</h1><p style={{margin:0,opacity:.75}}>Objective: maximise paid subscriptions without risking more than £100/month.</p></div>
      <button disabled={busy || isStopped} onClick={() => configure({stop_requested:true,mode:"dry_run"})} style={{padding:"14px 20px",fontWeight:800,borderRadius:10,border:"2px solid #b42318",background:isStopped?"#f2f4f7":"#fff",color:isStopped?"#667085":"#b42318"}}>{isStopped?"AUTOPILOT STOPPED":"■ STOP AUTOPILOT"}</button>
    </div>

    {isStopped && <div style={{marginTop:18,padding:14,borderRadius:10,background:"#fff4ed",border:"1px solid #ffddb8",fontWeight:700}}>Autopilot is stopped. Choose a control mode below to resume planning.</div>}

    <section style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))",gap:12,margin:"28px 0"}}>
      {[["Spent",money(state.spent_pence)],["Remaining",money(state.remaining_pence)],["Trials",state.trials],["Paid customers",state.paid_customers],["Revenue",money(state.revenue_pence)]].map(([label,value]) => <div key={label} style={{padding:18,border:"1px solid #ddd",borderRadius:14}}><div style={{fontSize:13,opacity:.65}}>{label}</div><div style={{fontSize:28,fontWeight:800,marginTop:5}}>{value}</div></div>)}
    </section>

    <section style={{marginBottom:24}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"end",gap:12,flexWrap:"wrap"}}><div><h2 style={{marginBottom:4}}>Advertising accounts</h2><p style={{marginTop:0,opacity:.7}}>OAuth authorisation is separate from the platform developer token. Both are required before live campaign actions can execute.</p></div></div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))",gap:12}}>
        <ConnectionCard name="Google Ads" provider="google" connection={adConnections.google} />
        <ConnectionCard name="Microsoft Ads" provider="microsoft" connection={adConnections.microsoft} />
      </div>
    </section>

    <section style={{padding:20,border:"1px solid #ddd",borderRadius:14,marginBottom:22}}>
      <h2 style={{marginTop:0}}>Control mode</h2>
      <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
        {["dry_run","approval","autonomous"].map((mode) => <button key={mode} disabled={busy} onClick={() => configure({mode,stop_requested:false})} style={{padding:"10px 14px",borderRadius:9,border:"1px solid #aaa",fontWeight:700,background:state.mode===mode?"#111":"#fff",color:state.mode===mode?"#fff":"#111"}}>{mode.replace("_"," ")}</button>)}
        <button disabled={busy || isStopped} onClick={plan} style={{padding:"10px 16px",borderRadius:9,border:0,fontWeight:800,background:"#111",color:"#fff",marginLeft:"auto"}}>Plan next move</button>
      </div>
      <p style={{marginBottom:0,opacity:.72}}>Dry run simulates actions only. Approval mode queues changes for you. Autonomous mode can execute only the narrow low-risk allow-list; new campaigns and new channels still require approval.</p>
      {message && <p role="status" style={{fontWeight:650}}>{message}</p>}
    </section>

    <section style={{marginBottom:26}}><h2>Latest AI actions</h2>{actions.length===0?<p>No actions yet. Run the planner to create the first batch.</p>:<div style={{display:"grid",gap:10}}>{actions.map((action)=>{
      const label=statusLabel(action,state.mode); const simulated=label==="simulated"; return <div key={action.id} style={{padding:15,border:"1px solid #ddd",borderRadius:12}}><div style={{display:"flex",justifyContent:"space-between",gap:12,flexWrap:"wrap"}}><strong>{action.action_type.replaceAll("_"," ")} · {action.channel || "internal"}</strong><span style={{fontWeight:800,color:simulated?"#175cd3":action.status==="blocked"?"#b42318":"#344054"}}>{label}</span></div><div style={{marginTop:6}}>{action.target}</div><div style={{opacity:.72,fontSize:14,marginTop:5}}>{action.reason}</div>{action.validation_reason&&<div style={{fontSize:13,marginTop:5,color:simulated?"#175cd3":"#b42318"}}>{simulated?"Dry run only: this was deliberately not executed.":action.validation_reason}</div>}</div>})}</div>}</section>

    <section><h2>Planner history</h2>{runs.length===0?<p>No planner runs yet.</p>:runs.map((run)=><div key={run.id} style={{padding:"10px 0",borderBottom:"1px solid #eee"}}><strong>{new Date(run.created_at).toLocaleString("en-GB")}</strong> · {run.mode.replace("_"," ")}<div style={{opacity:.75}}>{run.summary}</div></div>)}</section>
  </main>;
}

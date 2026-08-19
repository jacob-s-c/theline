let rounds = [];
let manifest = [];
const categories = [
  ["MIN","TOTAL MINUTES"],["FGM","FIELD GOALS MADE"],["FGA","FIELD GOALS ATTEMPTED"],["FG_PCT","FIELD GOAL %"],
  ["FG3M","3-POINTERS MADE"],["FG3A","3-POINTERS ATTEMPTED"],["FG3_PCT","3-POINT %"],["FTM","FREE THROWS MADE"],
  ["FTA","FREE THROWS ATTEMPTED"],["FT_PCT","FREE THROW %"],["OREB","OFFENSIVE REBOUNDS"],["DREB","DEFENSIVE REBOUNDS"],
  ["REB","TOTAL REBOUNDS"],["AST","TOTAL ASSISTS"],["STL","TOTAL STEALS"],["BLK","TOTAL BLOCKS"],
  ["TOV","TOTAL TURNOVERS"],["EFF","EFFICIENCY"],["PTS","TOTAL POINTS"],["AST_TO","ASSIST / TURNOVER"],
  ["STL_TOV","STEAL / TURNOVER"],["PF","PERSONAL FOULS"]
];

const $ = (id) => document.getElementById(id);
let mode = "classic", roundIndex = 0, selected = null, results = [], locked = false;
let tripleChallenge = rounds[0];

function initials(name){return name.split(/\s+/).map(x=>x[0]).slice(0,2).join("");}
function allNames(){return [...new Map(rounds.flatMap(r=>r.players).map(p=>[p[0],p])).values()];}
function playerMeta(player){return [player[1],player[2]].filter(Boolean).join(" • ");}
function currentChallenge(){return mode==="triple"?tripleChallenge:rounds[roundIndex];}

function renderRound(){
  const round=currentChallenge(); selected=null; locked=false;
  const totalSteps=mode==="triple"?3:rounds.length;
  $("round-number").textContent=String(roundIndex+1).padStart(2,"0");
  $("round-total").textContent=`/${String(totalSteps).padStart(2,"0")}`;
  $("round-label").textContent=mode==="triple"?"PICK":"ROUND";
  $("pick-step").textContent=String(roundIndex+1).padStart(2,"0");
  $("progress-fill").style.width=`${((roundIndex+1)/totalSteps)*100}%`;
  $("season").textContent=round.season; $("category").textContent=round.category;
  if(mode==="triple"){
    const running=results.reduce((n,r)=>n+r.rank,0), remaining=Math.max(0,100-running);
    $("challenge-title").innerHTML=`Build a total of <span>100</span><br />across three picks.`;
    $("challenge-note").textContent=`Your running rank total is ${running}. Cross 100 and the run is a bust.`;
    $("pick-prompt").textContent=`Pick ${roundIndex+1}: who adds the right rank?`;
    $("target-copy").textContent=`${remaining} RANK POINTS LEFT`;
    $("microcopy").textContent="Every revealed rank is a clue. Recalibrate and make the next pick count.";
  }else{
    $("challenge-title").innerHTML=`Find the player closest to <span>#50</span><br />without going over.`;
    $("challenge-note").textContent="Higher rank, higher score. Rank 51 or lower? That's a bust.";
    $("pick-prompt").textContent="Who lands nearest the line?";
    $("target-copy").textContent="TARGET: RANK 50";
    $("microcopy").textContent="One shot. No stat peeking. Trust your hoops memory.";
  }
  $("player-search").value=""; $("player-search").disabled=false;
  $("selected-player").classList.add("hidden"); $("round-result").classList.add("hidden");
  $("lock-pick").classList.remove("hidden"); $("lock-pick").disabled=true;
  renderScoreRow();
}

function renderOptions(query=""){
  const spelling=query.trim().toLowerCase();
  if(!spelling){
    $("player-options").innerHTML="";
    $("player-options").classList.remove("open");
    return;
  }
  const picked=new Set(results.map(r=>r.player));
  const pool=currentChallenge().players.filter(p=>p[0].toLowerCase().includes(spelling)&&!picked.has(p[0])).slice(0,8);
  $("player-options").innerHTML=pool.map(p=>`<button class="player-option" role="option" data-name="${p[0]}"><span class="mini-mono">${initials(p[0])}</span><strong>${p[0]}</strong><span>${playerMeta(p)}</span></button>`).join("");
  $("player-options").classList.toggle("open",pool.length>0);
}

function choosePlayer(name){
  const challenge=currentChallenge();
  const generic=allNames().find(p=>p[0]===name); selected=challenge.players.find(p=>p[0]===name) || generic;
  $("player-search").value=""; $("player-options").classList.remove("open");
  $("player-monogram").textContent=initials(selected[0]); $("player-name").textContent=selected[0];
  $("player-team").textContent=playerMeta(selected);
  $("selected-player").classList.remove("hidden"); $("lock-pick").disabled=false;
}

function lockPick(){
  if(!selected||locked)return; locked=true;
  const challenge=currentChallenge();
  const exact=challenge.players.find(p=>p[0]===selected[0]);
  const rank=exact ? exact[3] : 51 + ((initials(selected[0]).charCodeAt(0)+roundIndex*17)%73);
  const points=mode==="triple"?rank:(rank<=50?rank:0); results.push({round:challenge,player:selected[0],rank,points});
  const running=results.reduce((n,r)=>n+r.rank,0);
  $("header-score").textContent=mode==="triple"?Math.min(running,100):results.reduce((n,r)=>n+r.points,0);
  $("result-rank").textContent=`#${rank}`; $("result-points").textContent=mode==="triple"?`${running}/100`:(points?`+${points}`:"0");
  const distance=Math.abs(50-rank), bust=mode==="triple"?running>100:rank>50;
  $("round-result").classList.toggle("bust",bust);
  $("result-label").textContent=bust?"BUSTED":mode==="triple"?(running===100?"PERFECT TOTAL":"RANK REVEALED"):(rank===50?"PERFECT PICK":distance<=4?"SO CLOSE":"ON THE BOARD");
  $("result-title").textContent=bust?"You crossed the line.":mode==="triple"?(running===100?"You hit 100 exactly.":`${100-running} points still on the board.`):(rank===50?"Right on the fifty.":`${distance} spot${distance===1?"":"s"} from perfection.`);
  $("result-detail").textContent=`${selected[0]} • ${challenge.season} ${challenge.category.toLowerCase()}`;
  const isLast=mode==="triple"?(roundIndex===2||bust||running===100):roundIndex===rounds.length-1;
  $("next-round").querySelector("span").textContent=isLast?"SEE RESULTS":(mode==="triple"?"NEXT PICK":"NEXT ROUND");
  $("next-round").dataset.finish=String(isLast);
  $("round-result").classList.remove("hidden"); $("lock-pick").classList.add("hidden");
  $("player-search").disabled=true; $("clear-player").classList.add("hidden"); renderScoreRow();
  $("round-result").scrollIntoView({behavior:"smooth",block:"center"});
}

function renderScoreRow(){
  const count=mode==="triple"?3:rounds.length;
  $("score-row").style.gridTemplateColumns=`repeat(${count},1fr)`;
  $("score-row").innerHTML=Array.from({length:count},(_,i)=>`<div class="score-pill ${i<results.length?"done":""} ${i===roundIndex?"current":""}"><span>${mode==="triple"?"P":"R"}${i+1}</span><b>${results[i]?(mode==="triple"?`#${results[i].rank}`:results[i].points):"—"}</b></div>`).join("");
}

function nextRound(){
  if($("next-round").dataset.finish!=="true"){roundIndex++;renderRound();window.scrollTo({top:0,behavior:"smooth"});}
  else showSummary();
}

function showSummary(){
  $("game-view").classList.add("hidden"); $("summary-view").classList.remove("hidden");
  const rankTotal=results.reduce((n,r)=>n+r.rank,0), tripleBust=mode==="triple"&&rankTotal>100;
  const total=mode==="triple"?(tripleBust?0:rankTotal):results.reduce((n,r)=>n+r.points,0); $("final-score").textContent=total;
  $("final-max").textContent=mode==="triple"?"/100":"/250";
  $("final-verdict").textContent=mode==="triple"?(tripleBust?`Your picks totaled ${rankTotal}. You crossed the line.`:total===100?"Perfect. Three picks, 100 on the nose.":`${100-total} points shy of the target. Run it back with what you learned.`):(total>=220?"Elite hoops recall. You practically live at the scorer's table.":total>=150?"A strong run — you know the league, and you respect the line.":total>=75?"Solid instincts. A few deep cuts caught you reaching.":"The line got you today. Film room, then run it back.");
  $("summary-rounds").style.gridTemplateColumns=`repeat(${results.length},1fr)`;
  $("summary-rounds").innerHTML=results.map((r,i)=>`<div class="summary-round"><span>${mode==="triple"?"PICK":"ROUND"} ${i+1}</span><strong>${mode==="triple"?`#${r.rank}`:r.points}</strong><small>${r.player}<br>${r.round.category}</small></div>`).join("");
  window.scrollTo({top:0,behavior:"smooth"});
}

function restart(){roundIndex=0;results=[];$("header-score").textContent="0";$("summary-view").classList.add("hidden");$("game-view").classList.remove("hidden");$("clear-player").classList.remove("hidden");$("next-round").dataset.finish="false";renderRound();}
function setMode(next){
  mode=next;
  document.body.classList.toggle("triple-mode",mode==="triple");
  $("classic-mode").classList.toggle("active",mode==="classic"); $("triple-mode").classList.toggle("active",mode==="triple");
  if(rounds.length){tripleChallenge=rounds[Math.floor(Math.random()*rounds.length)];restart();}
}
function toast(msg){$("toast").textContent=msg;$("toast").classList.add("show");setTimeout(()=>$("toast").classList.remove("show"),1800);}

$("player-search").addEventListener("input",e=>renderOptions(e.target.value));
$("player-options").addEventListener("click",e=>{const btn=e.target.closest("[data-name]");if(btn)choosePlayer(btn.dataset.name)});
$("clear-player").addEventListener("click",()=>{selected=null;$("selected-player").classList.add("hidden");$("lock-pick").disabled=true;$("player-search").focus()});
$("lock-pick").addEventListener("click",lockPick); $("next-round").addEventListener("click",nextRound);
$("play-again").addEventListener("click",restart);
$("share-score").addEventListener("click",async()=>{const raw=results.reduce((n,r)=>n+(mode==="triple"?r.rank:r.points),0),score=mode==="triple"&&raw>100?0:raw,max=mode==="triple"?100:250;const text=`I scored ${score}/${max} on ${mode==="triple"?"Triple Take":"The 50 Line"} 🏀`;try{await navigator.clipboard.writeText(text);toast("SCORE COPIED TO CLIPBOARD")}catch{toast(text)}});
$("classic-mode").addEventListener("click",()=>setMode("classic"));
$("triple-mode").addEventListener("click",()=>setMode("triple"));
$("how-to-open").addEventListener("click",()=>$("how-to-modal").showModal());
$("how-to-close").addEventListener("click",()=>$("how-to-modal").close());
$("how-to-play").addEventListener("click",()=>$("how-to-modal").close());
document.addEventListener("click",e=>{if(!e.target.closest(".search-wrap"))$("player-options").classList.remove("open")});
document.addEventListener("keydown",e=>{if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==="k"){e.preventDefault();$("player-search").focus()}});
function shuffle(items){
  return [...items].sort(()=>Math.random()-.5);
}
function makeBoard(season,category){
  const [key,label]=category;
  const ranked=season.players.filter(player=>Number.isFinite(player.stats[key])).sort((a,b)=>b.stats[key]-a.stats[key]||a.name.localeCompare(b.name));
  return {season:season.season,category:label,players:ranked.map((player,index)=>[player.name,player.team,"",index+1])};
}
async function startDecade(decade){
  const available=manifest.filter(item=>Math.floor(item.startYear/10)*10===decade);
  const pairs=[];
  while(pairs.length<5){
    const season=available[Math.floor(Math.random()*available.length)];
    const category=categories[Math.floor(Math.random()*categories.length)];
    if(!pairs.some(pair=>pair.season.file===season.file&&pair.category[0]===category[0]))pairs.push({season,category});
  }
  $("decade-options").innerHTML=`<button class="decade-button"><strong>LOADING</strong><span>BUILDING YOUR RUN…</span></button>`;
  try{
    const seasonFiles=await Promise.all(pairs.map(pair=>fetch(`data/seasons/${pair.season.file}`).then(response=>{if(!response.ok)throw new Error(`HTTP ${response.status}`);return response.json()})));
    rounds=pairs.map((pair,index)=>makeBoard(seasonFiles[index],pair.category));
    tripleChallenge=rounds[Math.floor(Math.random()*rounds.length)];
    $("setup-view").classList.add("hidden"); $("game-view").classList.remove("hidden");
    restart();
  }catch(error){console.error("Unable to build run",error);toast("COULD NOT LOAD NBA DATA");renderDecades();}
}
function renderDecades(){
  const decades=[...new Set(manifest.map(item=>Math.floor(item.startYear/10)*10))];
  $("decade-options").innerHTML=decades.map(decade=>{
    const seasons=manifest.filter(item=>Math.floor(item.startYear/10)*10===decade);
    return `<button class="decade-button" data-decade="${decade}"><strong>${decade}s</strong><span>${seasons[0].season} — ${seasons.at(-1).season}</span></button>`;
  }).join("");
}
function showSetup(){
  rounds=[];results=[];roundIndex=0;$("header-score").textContent="0";
  $("game-view").classList.add("hidden");$("summary-view").classList.add("hidden");$("setup-view").classList.remove("hidden");renderDecades();
}
async function loadData(){
  try{
    const response=await fetch("data/manifest.json");
    if(!response.ok)throw new Error(`HTTP ${response.status}`);
    manifest=(await response.json()).seasons;
    renderDecades();
  }catch(error){
    console.error("Unable to load leaderboard data",error);
    $("player-search").placeholder="Leaderboard data could not be loaded";
    $("player-search").disabled=true;
    toast("COULD NOT LOAD NBA DATA");
  }
}
$("decade-options").addEventListener("click",event=>{const button=event.target.closest("[data-decade]");if(button)startDecade(Number(button.dataset.decade))});
$("change-decade").addEventListener("click",showSetup);
loadData();

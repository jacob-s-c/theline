const rounds = [
  { season:"2023–24", category:"TOTAL POINTS", players:[
    ["Jayson Tatum","BOS","F",7],["DeMar DeRozan","CHI","F-G",11],["Mikal Bridges","BKN","G-F",18],["Derrick White","BOS","G",42],["Jalen Green","HOU","G",24],["Austin Reaves","LAL","G",47],["Keegan Murray","SAC","F",50],["Josh Hart","NYK","G-F",56],["Chris Paul","GSW","G",91],["Franz Wagner","ORL","F",39],["Jrue Holiday","BOS","G",63],["Naz Reid","MIN","C-F",52]] },
  { season:"2022–23", category:"TOTAL ASSISTS", players:[
    ["Trae Young","ATL","G",1],["Nikola Jokic","DEN","C",3],["Jalen Brunson","NYK","G",15],["Jordan Poole","GSW","G",28],["Josh Giddey","OKC","G",11],["Alperen Sengun","HOU","C",46],["Jaylen Brown","BOS","G-F",48],["Bam Adebayo","MIA","C-F",50],["Desmond Bane","MEM","G-F",55],["Brook Lopez","MIL","C",102],["Kyle Kuzma","WAS","F",61],["Marcus Smart","BOS","G",23]] },
  { season:"2021–22", category:"TOTAL REBOUNDS", players:[
    ["Nikola Jokic","DEN","C",1],["Rudy Gobert","UTA","C",2],["Julius Randle","NYK","F-C",9],["Kyle Kuzma","WAS","F",25],["Scottie Barnes","TOR","F-G",30],["Andrew Wiggins","GSW","F",49],["Jaren Jackson Jr.","MEM","F-C",50],["Tyler Herro","MIA","G",57],["CJ McCollum","NOP","G",72],["Devin Booker","PHX","G",79],["Robert Williams III","BOS","C-F",38],["Kevin Love","CLE","F-C",45]] },
  { season:"2020–21", category:"TOTAL 3-POINTERS", players:[
    ["Stephen Curry","GSW","G",1],["Buddy Hield","SAC","G",2],["Joe Harris","BKN","G-F",7],["Jayson Tatum","BOS","F-G",12],["Lonzo Ball","NOP","G",25],["Dorian Finney-Smith","DAL","F",46],["Bojan Bogdanovic","UTA","F",49],["Jae Crowder","PHX","F",50],["Chris Paul","PHX","G",66],["Ben Simmons","PHI","G-F",190],["Dillon Brooks","MEM","G-F",34],["Kelly Olynyk","HOU","F-C",81]] },
  { season:"2019–20", category:"TOTAL STEALS", players:[
    ["James Harden","HOU","G",1],["Ben Simmons","PHI","G-F",2],["Chris Paul","OKC","G",8],["Jayson Tatum","BOS","F-G",14],["Kawhi Leonard","LAC","F",27],["Danny Green","LAL","G-F",43],["Carmelo Anthony","POR","F",48],["Myles Turner","IND","C-F",50],["Zion Williamson","NOP","F",105],["JJ Redick","NOP","G",78],["Jerami Grant","DEN","F",35],["Gordon Hayward","BOS","F",61]] }
];

const $ = (id) => document.getElementById(id);
let roundIndex = 0, selected = null, results = [], locked = false;

function initials(name){return name.split(/\s+/).map(x=>x[0]).slice(0,2).join("");}
function allNames(){return [...new Map(rounds.flatMap(r=>r.players).map(p=>[p[0],p])).values()];}

function renderRound(){
  const round=rounds[roundIndex]; selected=null; locked=false;
  $("round-number").textContent=String(roundIndex+1).padStart(2,"0");
  $("progress-fill").style.width=`${(roundIndex+1)*20}%`;
  $("season").textContent=round.season; $("category").textContent=round.category;
  $("player-search").value=""; $("player-search").disabled=false;
  $("selected-player").classList.add("hidden"); $("round-result").classList.add("hidden");
  $("lock-pick").classList.remove("hidden"); $("lock-pick").disabled=true;
  renderScoreRow();
}

function renderOptions(query=""){
  const pool=allNames().filter(p=>p[0].toLowerCase().includes(query.trim().toLowerCase())).slice(0,8);
  $("player-options").innerHTML=pool.map((p,i)=>`<button class="player-option" role="option" data-name="${p[0]}"><span class="mini-mono">${initials(p[0])}</span><strong>${p[0]}</strong><span>${p[1]} • ${p[2]}</span></button>`).join("");
  $("player-options").classList.toggle("open",pool.length>0);
}

function choosePlayer(name){
  const generic=allNames().find(p=>p[0]===name); selected=rounds[roundIndex].players.find(p=>p[0]===name) || generic;
  $("player-search").value=""; $("player-options").classList.remove("open");
  $("player-monogram").textContent=initials(selected[0]); $("player-name").textContent=selected[0];
  $("player-team").textContent=`${selected[1]} • ${selected[2]}`;
  $("selected-player").classList.remove("hidden"); $("lock-pick").disabled=false;
}

function lockPick(){
  if(!selected||locked)return; locked=true;
  const exact=rounds[roundIndex].players.find(p=>p[0]===selected[0]);
  const rank=exact ? exact[3] : 51 + ((initials(selected[0]).charCodeAt(0)+roundIndex*17)%73);
  const points=rank<=50?rank:0; results.push({round:rounds[roundIndex],player:selected[0],rank,points});
  $("header-score").textContent=results.reduce((n,r)=>n+r.points,0);
  $("result-rank").textContent=`#${rank}`; $("result-points").textContent=points?`+${points}`:"0";
  const distance=Math.abs(50-rank), bust=rank>50;
  $("round-result").classList.toggle("bust",bust);
  $("result-label").textContent=bust?"BUSTED":rank===50?"PERFECT PICK":distance<=4?"SO CLOSE":"ON THE BOARD";
  $("result-title").textContent=bust?"You crossed the line.":rank===50?"Right on the fifty.":`${distance} spot${distance===1?"":"s"} from perfection.`;
  $("result-detail").textContent=`${selected[0]} • ${rounds[roundIndex].season} ${rounds[roundIndex].category.toLowerCase()}`;
  $("next-round").querySelector("span").textContent=roundIndex===rounds.length-1?"SEE RESULTS":"NEXT ROUND";
  $("round-result").classList.remove("hidden"); $("lock-pick").classList.add("hidden");
  $("player-search").disabled=true; $("clear-player").classList.add("hidden"); renderScoreRow();
  $("round-result").scrollIntoView({behavior:"smooth",block:"center"});
}

function renderScoreRow(){
  $("score-row").innerHTML=rounds.map((_,i)=>`<div class="score-pill ${i<results.length?"done":""} ${i===roundIndex?"current":""}"><span>R${i+1}</span><b>${results[i]?results[i].points:"—"}</b></div>`).join("");
}

function nextRound(){
  if(roundIndex<rounds.length-1){roundIndex++;renderRound();window.scrollTo({top:0,behavior:"smooth"});}
  else showSummary();
}

function showSummary(){
  $("game-view").classList.add("hidden"); $("summary-view").classList.remove("hidden");
  const total=results.reduce((n,r)=>n+r.points,0); $("final-score").textContent=total;
  $("final-verdict").textContent=total>=220?"Elite hoops recall. You practically live at the scorer's table.":total>=150?"A strong run — you know the league, and you respect the line.":total>=75?"Solid instincts. A few deep cuts caught you reaching.":"The line got you today. Film room, then run it back.";
  $("summary-rounds").innerHTML=results.map((r,i)=>`<div class="summary-round"><span>ROUND ${i+1}</span><strong>${r.points}</strong><small>${r.player}<br>#${r.rank}</small></div>`).join("");
  window.scrollTo({top:0,behavior:"smooth"});
}

function restart(){roundIndex=0;results=[];$("header-score").textContent="0";$("summary-view").classList.add("hidden");$("game-view").classList.remove("hidden");$("clear-player").classList.remove("hidden");renderRound();}
function toast(msg){$("toast").textContent=msg;$("toast").classList.add("show");setTimeout(()=>$("toast").classList.remove("show"),1800);}

$("player-search").addEventListener("focus",e=>renderOptions(e.target.value));
$("player-search").addEventListener("input",e=>renderOptions(e.target.value));
$("player-options").addEventListener("click",e=>{const btn=e.target.closest("[data-name]");if(btn)choosePlayer(btn.dataset.name)});
$("clear-player").addEventListener("click",()=>{selected=null;$("selected-player").classList.add("hidden");$("lock-pick").disabled=true;$("player-search").focus()});
$("lock-pick").addEventListener("click",lockPick); $("next-round").addEventListener("click",nextRound);
$("play-again").addEventListener("click",restart);
$("share-score").addEventListener("click",async()=>{const text=`I scored ${results.reduce((n,r)=>n+r.points,0)}/250 on The 50 Line 🏀`;try{await navigator.clipboard.writeText(text);toast("SCORE COPIED TO CLIPBOARD")}catch{toast(text)}});
$("how-to-open").addEventListener("click",()=>$("how-to-modal").showModal());
$("how-to-close").addEventListener("click",()=>$("how-to-modal").close());
$("how-to-play").addEventListener("click",()=>$("how-to-modal").close());
document.addEventListener("click",e=>{if(!e.target.closest(".search-wrap"))$("player-options").classList.remove("open")});
document.addEventListener("keydown",e=>{if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==="k"){e.preventDefault();$("player-search").focus()}});
renderRound();

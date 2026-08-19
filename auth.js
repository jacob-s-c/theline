import { initializeApp } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js";
import {
  getAuth,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js";
import {
  getFirestore,
  addDoc,
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  where
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyApZHnh_Oeonw7Z533Vtksicpy83-CMFKo",
  authDomain: "theline-258fe.firebaseapp.com",
  projectId: "theline-258fe",
  storageBucket: "theline-258fe.firebasestorage.app",
  messagingSenderId: "275005309208",
  appId: "1:275005309208:web:6a9fe938304aaa5d821e6d",
  measurementId: "G-Q5EGF9Z6Z0"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();
provider.setCustomParameters({ prompt: "select_account" });

const signInButton = document.getElementById("google-sign-in");
const accountButton = document.getElementById("account-button");
const accountMenu = document.getElementById("account-menu");
const avatar = document.getElementById("account-avatar");
const accountName = document.getElementById("account-name");
const accountEmail = document.getElementById("account-email");
const communityModal = document.getElementById("community-modal");
let currentUser = null;
let activeBoard = "classic";

function showError(message) {
  const notice = document.createElement("div");
  notice.className = "auth-error";
  notice.textContent = message;
  document.body.appendChild(notice);
  setTimeout(() => notice.remove(), 3500);
}

onAuthStateChanged(auth, (user) => {
  currentUser = user;
  signInButton.classList.toggle("hidden", Boolean(user));
  accountButton.classList.toggle("hidden", !user);
  if (user) {
    avatar.src = user.photoURL || "";
    avatar.alt = user.displayName ? `${user.displayName}'s profile photo` : "Profile photo";
    accountName.textContent = user.displayName || "PLAYER";
    accountEmail.textContent = user.email || "Google account";
  } else {
    accountMenu.classList.add("hidden");
    accountButton.setAttribute("aria-expanded", "false");
  }
  renderProfileState();
});

function scoreCollection(mode) { return `scores_${mode}`; }
function safe(value) {
  const element=document.createElement("span");element.textContent=value || "PLAYER";return element.innerHTML;
}
function renderProfileState() {
  document.getElementById("profile-guest").classList.toggle("hidden",Boolean(currentUser));
  document.getElementById("profile-content").classList.toggle("hidden",!currentUser);
  if(currentUser){
    document.getElementById("profile-avatar").src=currentUser.photoURL || "";
    document.getElementById("profile-name").textContent=currentUser.displayName || "PLAYER";
    document.getElementById("profile-email").textContent=currentUser.email || "";
  }
}
async function saveRun(run) {
  if(!currentUser)return;
  try{
    await addDoc(collection(db,scoreCollection(run.mode)),{
      uid:currentUser.uid,mode:run.mode,score:Math.round(run.score),decade:run.decade,
      displayName:currentUser.displayName || "Player",photoURL:currentUser.photoURL || "",
      picks:run.picks,createdAt:serverTimestamp()
    });
  }catch(error){console.error("Score save failed",error);showError(error.code==="permission-denied"?"ENABLE FIRESTORE AND PUBLISH ITS RULES":"YOUR SCORE COULD NOT BE SAVED");}
}
async function loadLeaderboard(mode) {
  const list=document.getElementById("leaderboard-list");
  list.innerHTML='<p class="empty-state">Loading leaderboard…</p>';
  try{
    const snapshot=await getDocs(query(collection(db,scoreCollection(mode)),orderBy("score","desc"),limit(200)));
    const best=new Map();
    snapshot.forEach(doc=>{const run=doc.data();if(!best.has(run.uid))best.set(run.uid,run)});
    const leaders=[...best.values()].slice(0,25);
    list.innerHTML=leaders.length?leaders.map((run,index)=>`<div class="leaderboard-row"><span class="leaderboard-rank">${index+1}</span><img src="${safe(run.photoURL)}" alt="" referrerpolicy="no-referrer"><div class="leaderboard-player"><strong>${safe(run.displayName)}</strong><span>${run.decade ? `${run.decade}s` : "ALL ERAS"}</span></div><strong class="leaderboard-score">${run.score}</strong></div>`).join(""):'<p class="empty-state">No scores yet. Be the first on the board.</p>';
  }catch(error){console.error("Leaderboard load failed",error);list.innerHTML='<p class="empty-state">Leaderboard unavailable. Firestore may still need to be enabled.</p>';}
}
async function loadProfile() {
  if(!currentUser)return;
  const getRuns=async mode=>{
    const snapshot=await getDocs(query(collection(db,scoreCollection(mode)),where("uid","==",currentUser.uid),limit(200)));
    return [...snapshot.docs].map(doc=>({...doc.data(),mode}));
  };
  try{
    const [classic,triple]=await Promise.all([getRuns("classic"),getRuns("triple")]);
    const all=[...classic,...triple].sort((a,b)=>(b.createdAt?.seconds||0)-(a.createdAt?.seconds||0));
    document.getElementById("profile-runs").textContent=all.length;
    document.getElementById("profile-classic-best").textContent=classic.length?Math.max(...classic.map(run=>run.score)):"—";
    document.getElementById("profile-triple-best").textContent=triple.length?Math.max(...triple.map(run=>run.score)):"—";
    document.getElementById("recent-runs").innerHTML=all.length?all.slice(0,8).map(run=>`<div class="recent-run"><strong>${run.mode==="classic"?"THE 50 LINE":"TRIPLE TAKE"}</strong><span>${run.decade ? `${run.decade}s` : ""}</span><b>${run.score}</b></div>`).join(""):'<p class="empty-state">Finish a run to start your history.</p>';
  }catch(error){console.error("Profile load failed",error);document.getElementById("recent-runs").innerHTML='<p class="empty-state">Stats unavailable. Firestore may still need to be enabled.</p>';}
}
function showCommunity(panel="leaderboard") {
  const profile=panel==="profile";
  document.getElementById("profile-panel").classList.toggle("hidden",!profile);
  document.getElementById("leaderboard-panel").classList.toggle("hidden",profile);
  document.getElementById("profile-tab").classList.toggle("active",profile);
  document.getElementById("leaderboard-tab").classList.toggle("active",!profile);
  if(!communityModal.open)communityModal.showModal();
  profile?loadProfile():loadLeaderboard(activeBoard);
}

async function performSignIn() {
  signInButton.disabled = true;
  try {
    await signInWithPopup(auth, provider);
  } catch (error) {
    if (error.code !== "auth/popup-closed-by-user") {
      console.error("Google sign-in failed", error);
      showError(error.code === "auth/unauthorized-domain" ? "ADD THIS DOMAIN IN FIREBASE AUTH SETTINGS" : "GOOGLE SIGN-IN FAILED — PLEASE TRY AGAIN");
    }
  } finally {
    signInButton.disabled = false;
  }
}
signInButton.addEventListener("click", performSignIn);
document.getElementById("profile-sign-in").addEventListener("click",performSignIn);
window.addEventListener("theline:run-complete",event=>saveRun(event.detail));
document.getElementById("leaderboard-open").addEventListener("click",()=>showCommunity("leaderboard"));
document.getElementById("profile-open").addEventListener("click",()=>showCommunity("profile"));
document.getElementById("community-close").addEventListener("click",()=>communityModal.close());
document.getElementById("leaderboard-tab").addEventListener("click",()=>showCommunity("leaderboard"));
document.getElementById("profile-tab").addEventListener("click",()=>showCommunity("profile"));
document.querySelector(".board-switch").addEventListener("click",event=>{
  const button=event.target.closest("[data-board]");if(!button)return;
  activeBoard=button.dataset.board;
  document.querySelectorAll("[data-board]").forEach(item=>item.classList.toggle("active",item===button));
  loadLeaderboard(activeBoard);
});

accountButton.addEventListener("click", () => {
  const willOpen = accountMenu.classList.contains("hidden");
  accountMenu.classList.toggle("hidden", !willOpen);
  accountButton.setAttribute("aria-expanded", String(willOpen));
});

document.getElementById("sign-out").addEventListener("click", async () => {
  try { await signOut(auth); }
  catch (error) { console.error("Sign out failed", error); showError("COULD NOT SIGN OUT"); }
});

document.addEventListener("click", (event) => {
  if (!event.target.closest("#auth-shell")) {
    accountMenu.classList.add("hidden");
    accountButton.setAttribute("aria-expanded", "false");
  }
});

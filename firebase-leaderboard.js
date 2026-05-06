import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  query,
  orderBy,
  limit,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

import {
  firebaseConfig,
  FIREBASE_LEADERBOARD_ENABLED,
  FIREBASE_LEADERBOARD_COLLECTION
} from "./firebase-config.js";

let db = null;

if (FIREBASE_LEADERBOARD_ENABLED) {
  try {
    const app = initializeApp(firebaseConfig);
    db = getFirestore(app);
  } catch (e) {
    console.warn("Firebase init error", e);
  }
}

function getScore() {
  const el = document.getElementById("finalScore");
  return Number((el?.textContent || "").replace(/[^0-9]/g, "")) || 0;
}

function getMode() {
  return document.getElementById("finalMode")?.textContent || "";
}

async function submitScore() {
  if (!db) return;

  const score = getScore();
  if (!score) return;

  try {
    await addDoc(collection(db, FIREBASE_LEADERBOARD_COLLECTION), {
      score,
      mode: getMode(),
      createdAt: Date.now()
    });
  } catch (e) {
    console.warn("Error saving score", e);
  }
}

async function loadLeaderboard() {
  if (!db) return [];

  try {
    const q = query(
      collection(db, FIREBASE_LEADERBOARD_COLLECTION),
      orderBy("score", "desc"),
      limit(10)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => doc.data());
  } catch (e) {
    console.warn("Error loading leaderboard", e);
    return [];
  }
}

async function renderLeaderboard() {
  const list = document.getElementById("leaderboardList");
  if (!list) return;

  const entries = await loadLeaderboard();

  list.innerHTML = entries.map((entry, i) => `
    <div class="detail-row">
      <span>#${i + 1} · ${entry.mode}</span>
      <strong>${entry.score} pts</strong>
    </div>
  `).join("");
}

const observer = new MutationObserver(() => {
  const result = document.getElementById("result");
  if (result?.classList.contains("is-visible")) {
    submitScore();
  }
});

observer.observe(document.body, { attributes: true, subtree: true });

window.renderFirebaseLeaderboard = renderLeaderboard;

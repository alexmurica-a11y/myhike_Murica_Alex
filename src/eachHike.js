import { db } from "./firebaseConfig.js";
import { doc, getDoc } from "firebase/firestore";
import { updateDoc, increment } from "firebase/firestore";
import { onAuthReady } from "./authentication.js";
import { collection, addDoc, getDocs, serverTimestamp, query, where, orderBy, limit } from "firebase/firestore";

let currentUser = null;

onAuthReady(function (user) {
    if (!user) {
        location.href = "index.html";
    } else {
        currentUser = user;
    }
});

// Declare variable: the hike ID from the URL (eachHike.html?docID=abc123)
const params = new URL(window.location.href).searchParams;
const hikeId = params.get("docID");

// Fetch the hike and display its name and image
async function displayHikeInfo() {
    try {
        const hikeRef = doc(db, "hikes", hikeId);
        const hikeSnap = await getDoc(hikeRef);

        const hike = hikeSnap.data();
        const name = hike.name;
        const code = hike.code;

        // Update the page
        document.getElementById("hikeName").textContent = name;
        const img = document.getElementById("hikeImage");
        img.src = `./images/${code}.jpg`;
        img.alt = `${name} image`;
        // [BACK END] Count this visit: add 1 to this hike's "views" in Firestore
        await updateDoc(hikeRef, { views: increment(1) });

        // [FRONT END] Show the new number (old count + this visit)
        document.getElementById("viewCount").textContent = (hike.views || 0) + 1;
    } catch (error) {
        console.error("Error loading hike:", error);
        document.getElementById("hikeName").textContent = "Error loading hike.";
    }
}

displayHikeInfo();

async function displayReviews() {
    const container = document.getElementById("reviews-go-here");
    const template = document.getElementById("reviewTemplate");
    container.innerHTML = "";     // start empty so we don't show duplicates

    // Build the question we want to ask Firestore
    const q = query(
        collection(db, "reviews"),
        where("hikeDocID", "==", hikeId),    // only THIS hike
        // orderBy("timestamp", "desc"),         // newest first
        // limit(5)                        // optional: only the latest 5 (try it after Step 1.4)
    );

    try {
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            container.innerHTML = "<p class='text-muted'>No reviews yet. Be the first!</p>";
            return;
        }

        querySnapshot.forEach(doc => {
            const review = doc.data();
            const card = template.content.cloneNode(true);

            card.querySelector(".review-title").textContent = `${review.title} ${"★".repeat(review.rating)}`;
            const date = review.timestamp ? review.timestamp.toDate().toLocaleDateString() : "just now";
            card.querySelector(".review-meta").textContent = `${review.userName} · ${date}`;
            card.querySelector(".review-text").textContent = review.text;

            container.appendChild(card);
        });
    } catch (error) {
        console.error("Error loading reviews:", error);
    }
}
displayReviews();

// ---- (1) What to do when the review form is submitted ----
async function submitReview(event) {
    event.preventDefault();

    const newReview = {
        hikeDocID: hikeId,                                   // the PARENT (from the URL)
        userID: currentUser.uid,                             // who
        userName: currentUser.displayName || currentUser.email,
        title: document.getElementById("reviewTitle").value,
        rating: Number(document.getElementById("reviewRating").value),
        text: document.getElementById("reviewText").value,
        timestamp: serverTimestamp()                         // when
    };

    try {
        await addDoc(collection(db, "reviews"), newReview);
        event.target.reset();     // clear the form
        displayReviews();         // re-read the list so the new review shows (Step 1.3)
    } catch (error) {
        alert(`Error saving review:\n${error.code || ""}\n${error.message || error}`);
    }
}

// ---- (2) Connect it: "form, when you are submitted, run submitReview" ----
document.getElementById("reviewForm").addEventListener("submit", submitReview);

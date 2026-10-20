// Import the file that has the authentication helper function we want to use.
// The function we want to use is called "onAuthReady" which returns the login state
import { onAuthReady } from "/src/authentication.js";
import { db } from "./firebaseConfig.js";
import { doc, onSnapshot, collection, getDocs, addDoc, serverTimestamp } from "firebase/firestore";

function showName() {
    // Pass a CALLBACK function to run when Firebase finishes checking login status
    onAuthReady(function (user) {  // Firebase passes the user object (or null)
        if (user) {
            const name = document.getElementById("name-goes-here");
            const nameInFirebase = user.displayName || user.email;
            name.textContent = nameInFirebase;
            // User is logged in
            // document.getElementById("name-goes-here").textContent = name + "!";
        } else {
            // User is NOT logged in
            console.log("user not logged in")
            location.href = "index.html";  // Redirect to login page
        }
    });
}

showName();


function readQuote(day) {
    //reference to the quotes collection
    const quotesRef = doc(db, "quotes", day);

    //read the collection
    onSnapshot(quotesRef, docSnap => {
        console.log(docSnap.data().quote)
        console.log(document.getElementById("quote-goes-here"));
        //replace the front end with the quote from the day document
        document.getElementById("quote-goes-here").innerHTML = docSnap.data().quote;
    }, (error) => {
        console.error("failed reading the document", error);
    })
}

readQuote("tuesday");

// Helper function to add the sample hike documents.
function addHikeData() {
    const hikesRef = collection(db, "hikes");
    console.log("Adding sample hike data...");
    addDoc(hikesRef, {
        code: "BBY01", name: "Burnaby Lake Park Trail", city: "Burnaby",
        level: "easy", details: "A lovely place for a lunch walk.", length: 10,
        hike_time: 60, lat: 49.2467097082573, lng: -122.9187029619698,
        last_updated: serverTimestamp()
    });
    addDoc(hikesRef, {
        code: "AM01", name: "Buntzen Lake Trail", city: "Anmore",
        level: "moderate", details: "Close to town, and relaxing.", length: 10.5,
        hike_time: 80, lat: 49.3399431028579, lng: -122.85908496766939,
        last_updated: serverTimestamp()
    });
    addDoc(hikesRef, {
        code: "NV01", name: "Mount Seymour Trail", city: "North Vancouver",
        level: "hard", details: "Amazing ski slope views.", length: 8.2,
        hike_time: 120, lat: 49.38847101455571, lng: -122.94092543551031,
        last_updated: serverTimestamp()
    });
}

async function seedHikes() {
    //make reference to the hikes collection
    const hikesRef = collection(db, "hikes");

    //read this hikesRef to go through checks later
    const hikesSnapshot = await getDocs(hikesRef);

    //if hikes collection does not exist, then write
    if (hikesSnapshot.empty) {
        console.log("seeding the hikes collection...")
        addHikeData();
    } else {
        //else do nothing
    }

}
seedHikes()

async function displayHikesDynamically() {
    //reference to the hikes collection
    const hikesRef = collection(db, "hikes");

    //get the template from front-end
    let cartTemplate = document.getElementById("hikeCardTemplate");

    //read the hikes collection 
    const querySnapshot = await getDocs(hikesRef);

    //loop through three hikes
    querySnapshot.forEach(doc => {
        //create the copy of the template
        let newcard = cartTemplate.content.cloneNode(true);

        //read this hike in the loop
        const thisHike = doc.data();

        //populate data in the template
        newcard.querySelector('.card-title').textContent = thisHike.name;
        newcard.querySelector('.card-text').textContent = thisHike.details || `Located in ${hike.city}.`;
        newcard.querySelector('.card-length').textContent = thisHike.length;
        newcard.querySelector('.card-image').src = `./images/${thisHike.code}.jpg`;
        newcard.querySelector(".read-more").href = `eachHike.html?docID=${doc.id}`;
        //attach the teamplate to the front-end
        document.getElementById("hikes-go-here").appendChild(newcard);
    })


}
displayHikesDynamically()
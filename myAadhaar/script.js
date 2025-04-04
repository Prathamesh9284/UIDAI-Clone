const mouseData = [];
const keyData = [];
var deviceFingerprint = "";

async function generateFingerprint() {
  // Helper function to generate hash
  function hash(data) {
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const chr = data.charCodeAt(i);
      hash = (hash << 5) - hash + chr;
      hash |= 0; // Convert to 32-bit integer
    }
    return hash.toString();
  }

  // Canvas Fingerprint
  function getCanvasFingerprint() {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    canvas.width = 800;
    canvas.height = 600;

    ctx.textBaseline = "alphabetic";
    ctx.font = "italic 28px Verdana";
    ctx.fillStyle = "rgba(255, 0, 0, 0.8)";
    ctx.fillText("Unique Canvas Fingerprint", 20, 50);

    ctx.strokeStyle = "rgba(0, 255, 0, 0.6)";
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.moveTo(50, 150);
    ctx.lineTo(750, 150);
    ctx.stroke();

    ctx.fillStyle = "rgba(0, 0, 255, 0.5)";
    ctx.beginPath();
    ctx.arc(400, 300, 200, 0, Math.PI * 2, false);
    ctx.fill();

    const gradient = ctx.createLinearGradient(0, 0, 800, 600);
    gradient.addColorStop(0, "yellow");
    gradient.addColorStop(1, "purple");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 500, 800, 100);

    return hash(canvas.toDataURL());
  }

  // WebGL Fingerprint
  function getWebGLFingerprint() {
    const canvas = document.createElement("canvas");
    const gl =
      canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
    if (!gl) return null;

    const debugInfo = gl.getExtension("WEBGL_debug_renderer_info");
    if (!debugInfo) return null;

    const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
    const vendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
    return `${renderer} | ${vendor}`;
  }

  // Audio Fingerprint
  async function getAudioFingerprint() {
    const audioContext = new (window.OfflineAudioContext ||
      window.webkitOfflineAudioContext)(1, 44100, 44100);
    const oscillator = audioContext.createOscillator();
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(1000, audioContext.currentTime);

    const gainNode = audioContext.createGain();
    gainNode.gain.setValueAtTime(0.5, audioContext.currentTime);

    const filterNode = audioContext.createBiquadFilter();
    filterNode.type = "lowpass";
    filterNode.frequency.setValueAtTime(1000, audioContext.currentTime);

    oscillator.connect(gainNode);
    gainNode.connect(filterNode);
    filterNode.connect(audioContext.destination);
    oscillator.start();
    audioContext.startRendering();

    return new Promise((resolve) => {
      audioContext.oncomplete = (event) => {
        const fingerprint = event.renderedBuffer
          .getChannelData(0)
          .slice(0, 500)
          .reduce((hash, val) => hash + Math.abs(val), 0);
        resolve(fingerprint);
      };
    });
  }

  // Browser Feature Fingerprint
  function getBrowserFeatureFingerprint() {
    const userAgent = navigator.userAgent;
    const platform = navigator.platform;
    const vendor = navigator.vendor;
    const hardwareConcurrency = navigator.hardwareConcurrency || "unknown";
    const language = navigator.language;
    const colorDepth = screen.colorDepth;
    const resolution = `${screen.width}x${screen.height}`;

    return `UserAgent: ${userAgent}, Platform: ${platform}, Vendor: ${vendor}, HardwareConcurrency: ${hardwareConcurrency}, Language: ${language}, ColorDepth: ${colorDepth}, Resolution: ${resolution}`;
  }

  // Generate all fingerprints
  const canvasFingerprint = getCanvasFingerprint();
  const webGLFingerprint = getWebGLFingerprint();
  const audioFingerprint = await getAudioFingerprint();
  const browserFeatureFingerprint = getBrowserFeatureFingerprint();

  // Combine all fingerprints into one string
  const combinedFingerprint = [
    canvasFingerprint,
    webGLFingerprint,
    audioFingerprint,
    browserFeatureFingerprint,
  ].join(" | ");

  // Return the hashed fingerprint
  return hash(combinedFingerprint);
}

// import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js";
// import { getDatabase, ref, set, push, query, orderByChild, startAt, get } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-database.js";

// // Your web app's Firebase configuration
// const firebaseConfig = {
//   apiKey: "AIzaSyD8USMdgvUB0YJ8r45NCofe_Sr--cyiync",
//   authDomain: "sihp-2135d.firebaseapp.com",
//   projectId: "sihp-2135d",
//   storageBucket: "sihp-2135d.appspot.com",
//   messagingSenderId: "321995673340",
//   appId: "1:321995673340:web:183f6e7433bfde26cb5179",
// };

// // Initialize Firebase
// const app = initializeApp(firebaseConfig);
// const database = getDatabase(app);

// async function checkRecentFingerprints(fingerprint) {
//   const thirtySecondsAgo = Date.now() - 30000; // 30 seconds ago

//   // Reference to the database path for this fingerprint
//   const fingerprintRef = ref(database, `fingerprints/${fingerprint}`);

//   // Create a query to get entries from the last 30 seconds
//   const recentEntriesQuery = query(
//     fingerprintRef,
//     orderByChild('timestamp'),
//     startAt(thirtySecondsAgo)
//   );

//   console.log(`Query path: fingerprints/${fingerprint}`);
//   console.log(`Query startAt: ${thirtySecondsAgo}`);

//   try {
//     // Retrieve the entries
//     const snapshot = await get(recentEntriesQuery);
//     if (snapshot.exists()) {
//       // Count the number of entries
//       const entries = snapshot.val();
//       console.log('Entries found:', entries); // Log the entries to inspect
//       const count = Object.keys(entries).length;
//       console.log(`Number of entries with the same fingerprint in the last 30 seconds: ${count}`);
//     } else {
//       console.log('No recent entries found.');
//     }
//   } catch (error) {
//     console.error('Error retrieving data from database: ', error);
//   }
// }

// Function to send the fingerprint to the backend
// Function to send the fingerprint and timestamp to the backend
function sendFingerprint(fingerprint) {
  const timestamp = Date.now(); // Get current timestamp in milliseconds

  // Create FormData and append the fingerprint and timestamp
  const formData = new FormData();
  formData.append("fingerprint", fingerprint);
  formData.append("timestamp", timestamp);

  // Send the request to the backend
  fetch("http://127.0.0.1:8000/add_visit_info", {
    method: "POST",
    body: formData,
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      return response.json();
    })
    .then((data) => {
      console.log("Visit info saved successfully:", data);
    })
    .catch((error) => {
      console.error("Error during fetch operation:", error);
      document.getElementById("result").innerText =
        "An error occurred while processing the request.";
    });
}

// Add fingerprint to Firebase Realtime Database with timestamp
generateFingerprint().then((fingerprint) => {
  console.log("Generated Fingerprint: " + fingerprint);
  sendFingerprint(fingerprint);
  deviceFingerprint = fingerprint;
});

// Event listener for mouse movements
document.addEventListener("mousemove", function (e) {
  mouseData.push({
    eventType: "mousemove",
    timestamp: new Date().toISOString(),
    x: e.clientX,
    y: e.clientY,
  });
});

// Event listener for mouse clicks
document.addEventListener("click", function (e) {
  mouseData.push({
    eventType: "click",
    timestamp: new Date().toISOString(),
    x: e.clientX,
    y: e.clientY,
  });
});

// Event listener for input field changes
document.querySelectorAll("input").forEach(function (inputField) {
  inputField.addEventListener("input", function (e) {
    keyData.push({
      eventType: "input",
      timestamp: new Date().toISOString(),
      fieldName: e.target.name,
      fieldValue: e.target.value,
    });
  });
});

// Function to get browser information
function getBrowserInfo() {
  return {
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    webdriver: navigator.webdriver,
    languages: navigator.languages || [],
    pluginsCount: navigator.plugins.length,
    screenResolution: `${window.screen.width}x${window.screen.height}`,
    screenWidth: window.screen.width,
    screenHeight: window.screen.height,
    maxTouchPoints: navigator.maxTouchPoints || 0,
  };
}

// Function to convert JSON data to CSV format
function convertArrayToCSV(data) {
  if (data.length === 0) return "";

  const headers = Object.keys(data[0]);
  const csvRows = [];
  csvRows.push(headers.join(","));

  data.forEach((row) => {
    const values = headers.map((header) =>
      JSON.stringify(row[header], (key, value) => (value === null ? "" : value))
    );
    csvRows.push(values.join(","));
  });

  return csvRows.join("\n");
}

function sendDataToServer(mouseData, keyData) {
  const formData = new FormData();
  const mouseBlob = new Blob([convertArrayToCSV(mouseData)], {
    type: "text/csv",
  });
  const keyBlob = new Blob([convertArrayToCSV(keyData)], { type: "text/csv" });

  // const downloadLink = document.createElement("a");
  // const url = URL.createObjectURL(mouseBlob);
  // downloadLink.href = url;
  // downloadLink.download = "mouseData.csv"; // Specify the file name
  // document.body.appendChild(downloadLink);
  // downloadLink.click();
  // document.body.removeChild(downloadLink);
  // URL.revokeObjectURL(url); // Clean up the object URL

  console.log(mouseData);
  console.log(keyData);
  formData.append("mouse_file", mouseBlob, "mouse_interactions.csv");
  formData.append("key_file", keyBlob, "key_interactions.csv");
  formData.append("browser_info", JSON.stringify(getBrowserInfo()));
  formData.append("fingerprint", deviceFingerprint);

  fetch("http://127.0.0.1:8000/predict_behavior", {
    method: "POST",
    body: formData,
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      return response.json();
    })
    .then((data) => {
      if (
        data.mouse_result === "Human" &&
        data.key_result === "Human" &&
        data.is_automated === "No" &&
        data.is_bot === "No"
      ) {
        document.getElementById("p").innerText = "OTP has been sent to your mobile number!";
      } else {
        document.getElementById("msg").innerText = "Verify you are a Human!";
        // document.getElementById("p").innerText =
        //   "Mouse result: " +
        //   data.mouse_result +
        //   "\n" +
        //   "Key result: " +
        //   data.key_result +
        //   "\n" +
        //   "Browser is controlled by: " +
        //   data.is_automated +
        //   "\n" +
        //   "Exist in bot database:" +
        //   data.is_bot;
        document.querySelector(".Btn").innerText = "Next";
      }
      document.querySelector(".popup").style.display = "block";
      document.querySelector(".overlay").style.display = "block";

      // Handle click outside the popup or on the button
      document.querySelector(".overlay").addEventListener("click", function () {
        document.querySelector(".popup").style.display = "none";
        document.querySelector(".overlay").style.display = "none";
      });

      document.querySelector(".Btn").addEventListener("click", function () {
        document.querySelector(".popup").style.display = "none";
        document.querySelector(".overlay").style.display = "none";
      });

      document.getElementById("result").innerText =
        "Mouse result: " +
        data.mouse_result +
        "\n" +
        "Key result: " +
        data.key_result +
        "\n" +
        "Browser is controlled by: " +
        data.is_automated +
        "\n" +
        "Exist in bot database:" +
        data.is_bot;
    })
    .catch((error) => {
      console.error("Error during fetch operation:", error);
      document.getElementById("result").innerText =
        "An error occurred while processing the request.";
    });
}

// Handle form submission
document.getElementById("getotp").addEventListener("click", function (e) {
  e.preventDefault(); // Prevent actual form submission

  // Send mouse and key interaction data to the server
  if (mouseData.length > 0 || keyData.length > 0) {
    sendDataToServer(mouseData, keyData);
  } else {
    alert("No interaction data to send.");
  }
});
document.getElementById("download").addEventListener("click", function (e) {
  var otp = document.getElementById("otp").value;

  // Send mouse and key interaction data to the server
  if (otp == "999999") {
    window.location.href = "https://www.google.co.in/";
  } else {
    alert("Error");
  }
});

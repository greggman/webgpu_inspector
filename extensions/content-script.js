const webgpuInspectorLoadedKey = "WEBGPU_INSPECTOR_LOADED";
const webgpuRecorderLoadedKey = "WEBGPU_RECORDER_LOADED";
const webgpuInspectorGrabFrameKey = "WEBGPU_INSPECTOR_GRAB_FRAME";

let port = chrome.runtime.connect({ name: "webgpu-inspector-content" });

port.onDisconnect.addListener(() => {
  port = chrome.runtime.connect({ name: "webgpu-inspector-content" });
});

// Listen for messages from the server background
port.onMessage.addListener((message) => {
  const action = message.action;
  if (!action) {
    return;
  }

  if (action == "initialize_inspector") {
    sessionStorage.setItem(webgpuInspectorLoadedKey, "true");
    setTimeout(function () {
      window.location.reload();
    }, 50);
  } else if (action == "initialize_recorder") {
    sessionStorage.setItem(webgpuRecorderLoadedKey, `${message.frames}%${message.filename}`);
    setTimeout(function () {
      window.location.reload();
    }, 50);
  }
});

// Listen for messages from the page
window.addEventListener('message', (event) => {
  if (event.source !== window) {
    return;
  }
  const message = event.data;
  if (typeof message !== 'object' || message === null) {
    return;
  }
  try {
    port.postMessage(message);
  } catch (e) {
    console.log("#### error:", e);
  }
});

function injectScriptNode(url) {
  const script = document.createElement("script");
  script.src = url;
  (document.head || document.documentElement).appendChild(script);
  script.parentNode.removeChild(script);
}


if (sessionStorage.getItem(webgpuInspectorLoadedKey)) {
  injectScriptNode(chrome.runtime.getURL(`webgpu-inspector.js`));
  sessionStorage.removeItem(webgpuInspectorLoadedKey);
} else if (sessionStorage.getItem(webgpuRecorderLoadedKey)) {
  const data = sessionStorage.getItem(webgpuRecorderLoadedKey).split("%");
  const url = `webgpu-recorder.js?filename=${encodeURIComponent(data[1])}&frames=${encodeURIComponent(data[0])}&removeUnusedResources=1&messageRecording=1`;
  injectScriptNode(chrome.runtime.getURL(url));
  sessionStorage.removeItem(webgpuRecorderLoadedKey);
}

port.postMessage({action: "PageLoaded"});

const logContainer = document.getElementById("main");
function addToLog(text) {
    const ul = document.createElement("ul");
    ul.textContent = text;
    logContainer.appendChild(ul);
}
window.addEventListener("hashchange", _ => window.location.reload());

console.debug("loaded", window.location.hash);

(async ()=>{
    const infoRequest = await fetch(`https://api.lightspeed.tv/streams/${window.location.hash.slice(1)}`);
    console.debug("inforequest", infoRequest);
    if (!infoRequest.ok) {
        addToLog(`error fetching info: ${infoRequest.status} ${infoRequest.statusText}, body: ${await infoRequest.text()}`);
        return;
    }
    const streamData = await infoRequest.json();
    console.debug("streamdata", streamData);
    addToLog(`user id: ${streamData._id}`);
    const events = new WebSocket(`wss://events.lightspeed.tv/?channel=${streamData._id}`);
    events.onopen = e => {addToLog("connected to events!")};

})();

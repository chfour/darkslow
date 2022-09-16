const logContainer = document.querySelector("#chat");
const addToLog = text => addMessage({author: {username: "*"}, content: text});
function addMessage(msg) {
    const li = document.createElement("li");

    const user = document.createElement("span");
    user.classList.add("user");

    if (msg.author.avatar && !argv.has("Pnone")) {
        const profile = document.createElement("img");
        profile.classList.add("profile");
        profile.setAttribute("src", `https://media.lightspeed.tv/avatars/${msg.author.avatar}?max_side=32`);
        user.appendChild(profile);
    }

    const username = document.createElement("span");
    username.classList.add("username");
    username.textContent = msg.author.username;
    user.appendChild(username);

    li.appendChild(user);

    const content = document.createElement("span");
    content.classList.add("content");
    content.textContent = msg.content;
    li.appendChild(content);

    logContainer.appendChild(li);
    window.scrollTo(0, document.body.scrollHeight);
    return li;
}
window.addEventListener("hashchange", _ => window.location.reload());

console.debug("loaded", window.location.hash);

const argv = new URLSearchParams(window.location.hash.slice(1));
console.debug("args", argv);
if (argv.has("Sirc")) document.body.classList.add("irc");
if (argv.has("Cfg")) document.body.style.color = argv.get("Cfg");
if (argv.has("Ffont")) document.body.style.fontFamily = argv.get("Ffont");
if (argv.has("Fsize")) document.body.style.fontSize = argv.get("Fsize");
if (argv.has("Fweight")) document.body.style.fontWeight = argv.get("Fweight");
if (argv.has("Pradius")) document.body.style.setProperty("--profile-radius", argv.get("Pradius"));

(async ()=>{
    const infoRequest = await fetch(`https://api.lightspeed.tv/streams/${argv.get("u")}`);
    console.debug("inforequest", infoRequest);
    if (!infoRequest.ok) {
        addToLog(`error fetching info: ${infoRequest.status} ${infoRequest.statusText}, body: ${await infoRequest.text()}`);
        return;
    }
    const streamData = await infoRequest.json();
    console.debug("streamdata", streamData);
    addToLog(`user id: ${streamData._id}`);

    addToLog("fetching messages...");
    const messagesRequest = await fetch(`https://api.lightspeed.tv/chat/${streamData._id}/messages`);
    if (!infoRequest.ok) {
        addToLog(`error fetching messages: ${messagesRequest.status} ${messagesRequest.statusText}, body: ${await messagesRequest.text()}`);
        return;
    }
    const messages = await messagesRequest.json();
    console.debug(messages);
    messages.reverse().forEach(addMessage);

    const events = new WebSocket(`wss://events.lightspeed.tv/?channel=${streamData._id}`);
    events.addEventListener("message", e => {
        const message = JSON.parse(e.data);
        console.debug(message);
        switch (message.type) {
            case "ChatMessage":
                addMessage(message.message);
                break;
            case "StreamStart":
                addToLog("stream start");
                break;
            case "StreamEnd":
                addToLog("stream end");
                break;
            case "Follow":
                addToLog(`${message.user_id} followed`);
                break;
            case "Unfollow":
                addToLog(`${message.user_id} unfollowed`);
                break;
            default:
                addToLog("// unknown: " + JSON.dumps(message));
        }
    });
    events.addEventListener("open", e => {
        const logEntry = addToLog("connected to events!");
        setTimeout(() => logContainer.removeChild(logEntry), 1000);
    });

})();

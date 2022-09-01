const logContainer = document.getElementById("main");
const addToLog = text => addMessage({author: {username: "*"}, content: text});
function addMessage(msg) {
    const li = document.createElement("li");

    const user = document.createElement("span");
    user.classList.add("user");

    if (msg.author.avatar) {
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
    return li;
}
window.addEventListener("hashchange", _ => window.location.reload());

console.debug("loaded", window.location.hash);

const argv = [window.location.origin, ...decodeURIComponent(window.location.hash.slice(1)).split(" ")];
console.debug("args", argv);

argv.forEach(arg => {
    switch (arg) {
        case "-Sirc":
            document.body.classList.add("irc");
            break;
        default:
            if (arg.startsWith("-Cfg=")) document.body.style.color = arg.slice(5);
            else if (arg.startsWith("-Tfont=")) document.body.style.fontFamily = arg.slice(7).replace(/\+/g, " ");
            else if (arg.startsWith("-Tsize=")) document.body.style.fontSize = arg.slice(7);
            else if (arg.startsWith("-Tfweight=")) document.body.style.fontWeight = arg.slice(10);
    }
});

(async ()=>{
    const infoRequest = await fetch(`https://api.lightspeed.tv/streams/${argv[1]}`);
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

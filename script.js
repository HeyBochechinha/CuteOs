function updateTime() {
    var currentTime = new Date().toLocaleString("en-US",{dateStyle: "short", timeStyle: "short"});
    var timeText = document.querySelector("#timeElement");
    timeText.innerHTML = currentTime;
}

updateTime();
setInterval(updateTime, 1000);

function sayHello() {
    document.querySelector("#message").innerHTML = "You're doing great! Keep creating! ✨";
}
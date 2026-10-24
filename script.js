const desktop = document.querySelector(".desktop");
const taskbarApps = document.querySelector("#taskbarApps");
const windows = document.querySelectorAll(".window");
const appIcons = document.querySelectorAll(".app-icon");

let highestZIndex = 1;

function updateClock(){
    const now = new Date();
    document.querySelector("#clock").textContent =
        now.toLocaleTimeString([],{ hour: "2-digit", minute: "2-digit" });
}

updateClock();
setInterval(updateClock, 1000);

function focusWindow(win){
    highestZIndex++;
    win.style.zIndex = highestZIndex;
}

function getTaskbarButton(win){
    return [...taskbarApps.children].find(button => button.dataset.window === win.id);
}

function updateTaskbarButton(win){
    const button = getTaskbarButton(win);
    if(button) button.classList.toggle("active", win.style.display !== "none");
}

function openWindow(id){
    const win = document.getElementById(id);
    if(!win) return;

    win.style.display = "flex";
    focusWindow(win);

    let button = getTaskbarButton(win);
    if(!button){
        button = document.createElement("button");
        button.className = "taskbar-app";
        button.dataset.window = win.id;
        const appIcon = document.querySelector(`.app-icon[data-window="${win.id}"] .icon`);
        button.textContent = appIcon ? appIcon.textContent : "📱";
        button.title = win.dataset.title;
        button.setAttribute("aria-label", win.dataset.title);

        button.addEventListener("click", function(){
            if(win.style.display === "none") openWindow(win.id);
            else minimizeWindow(win);
        });

        taskbarApps.appendChild(button);
    }
    updateTaskbarButton(win);
}

function closeWindow(win){
    win.style.display = "none";
    const button = getTaskbarButton(win);
    if(button) button.remove();
}

function minimizeWindow(win){
    win.style.display = "none";
    updateTaskbarButton(win);
}

appIcons.forEach(function(icon){
    icon.addEventListener("click", function(){
        openWindow(icon.dataset.window);
    });
});

windows.forEach(function(win){
    const closeButton = win.querySelector(".close");
    const minimizeButton = win.querySelector(".minimize");
    const header = win.querySelector(".window-header");

    closeButton.addEventListener("click",() => closeWindow(win));
    minimizeButton.addEventListener("click",() => minimizeWindow(win));
    win.addEventListener("pointerdown",() => focusWindow(win));

    header.addEventListener("pointerdown", function(event){
        if(event.target.closest("button")) return;
        event.preventDefault();

        const windowRect = win.getBoundingClientRect();
        const desktopRect = desktop.getBoundingClientRect();
        const startX = event.clientX;
        const startY = event.clientY;
        const startLeft = windowRect.left - desktopRect.left;
        const startTop = windowRect.top - desktopRect.top;

        win.style.transform = "none";
        win.style.left = startLeft + "px";
        win.style.top = startTop + "px";
        header.setPointerCapture(event.pointerId);

        function moveWindow(moveEvent){
            const newLeft = startLeft + moveEvent.clientX - startX;
            const newTop = startTop + moveEvent.clientY - startY;
            const maxLeft = desktop.clientWidth - win.offsetWidth;
            const maxTop = desktop.clientHeight - 45;

            win.style.left = Math.max(0, Math.min(newLeft, maxLeft)) + "px";
            win.style.top = Math.max(0, Math.min(newTop, maxTop)) + "px";
        }

        function stopMoving(){
            header.removeEventListener("pointermove", moveWindow);
            header.removeEventListener("pointerup", stopMoving);
            header.removeEventListener("pointercancel", stopMoving);
        }

        header.addEventListener("pointermove", moveWindow);
        header.addEventListener("pointerup", stopMoving);
        header.addEventListener("pointercancel", stopMoving);
    });
});

const canvas = document.querySelector("#drawingCanvas");
const ctx = canvas.getContext("2d");
const colorPicker = document.querySelector("#brushColor");
const sizePicker = document.querySelector("#brushSize");
const sizeLabel = document.querySelector("#brushSizeLabel");
const eraserButton = document.querySelector("#eraserBtn");
const clearButton = document.querySelector("#clearCanvasBtn");
const downloadButton = document.querySelector("#downloadCanvasBtn");

let drawing = false;
let erasing = false;
let brushColor = colorPicker.value;
let brushSize = Number(sizePicker.value);

function setupCanvas(){
    canvas.width = 900;
    canvas.height = 600;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = brushSize;
    ctx.strokeStyle = brushColor;
}

function getPosition(event){
    const rect = canvas.getBoundingClientRect();
    return{x:(event.clientX - rect.left) * canvas.width / rect.width, y:(event.clientY - rect.top) * canvas.height / rect.height};
}

canvas.addEventListener("pointerdown", function(event){
    drawing = true;
    canvas.setPointerCapture(event.pointerId);
    const position = getPosition(event);
    ctx.globalCompositeOperation = erasing ? "destination-out" : "source-over";
    ctx.fillStyle = brushColor;
    ctx.beginPath();
    ctx.arc(position.x, position.y, brushSize / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(position.x, position.y);
});

canvas.addEventListener("pointermove", function(event){
    if(!drawing) return;
    const position = getPosition(event);

    ctx.globalCompositeOperation = erasing ? "destination-out" : "source-over";
    ctx.strokeStyle = brushColor;
    ctx.lineWidth = brushSize;
    ctx.lineTo(position.x, position.y);
    ctx.stroke();
});

function stopDrawing(){
    drawing = false;
    ctx.beginPath();
}

canvas.addEventListener("pointerup", stopDrawing);
canvas.addEventListener("pointercancel", stopDrawing);
canvas.addEventListener("lostpointercapture", stopDrawing);

colorPicker.addEventListener("input", function(){
    brushColor = colorPicker.value;
    erasing = false;
    eraserButton.classList.remove("selected");
});

sizePicker.addEventListener("input", function(){
    brushSize = Number(sizePicker.value);
    sizeLabel.textContent = brushSize + " px";
});

eraserButton.addEventListener("click", function(){
    erasing = !erasing;
    eraserButton.classList.toggle("selected", erasing);
});

clearButton.addEventListener("click", function(){
    if(confirm("Clear your whole drawing?")){
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
});

downloadButton.addEventListener("click", function(){
    const exportCanvas = document.createElement("canvas");
    exportCanvas.width = canvas.width;
    exportCanvas.height = canvas.height;
    const exportContext = exportCanvas.getContext("2d");
    exportContext.fillStyle = "#ffffff";
    exportContext.fillRect(0, 0, exportCanvas.width, exportCanvas.height);
    exportContext.drawImage(canvas, 0, 0);

    const link = document.createElement("a");
    link.download = "my-drawing.png";
    link.href = exportCanvas.toDataURL("image/png");
    link.click();
});

setupCanvas();
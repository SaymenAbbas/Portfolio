export function displayDialogue(k, text, onDisplayEnd) {
    const dialogueUI = document.getElementById("textbox-container");
    const dialogue = document.getElementById("dialogue");

    dialogueUI.style.display = "block";
    
    // Text scrolling
    let index = 0;
    let currentText = "";

    const npcSound = k.play("npc-voice", {loop: true, volume: 0.05});

    const intervalRef = setInterval(() => {
        if (index < text.length) {
            currentText += text[index];
            dialogue.innerHTML = currentText;
            index++;
            return;
        }

        clearInterval(intervalRef)
        npcSound.stop();
    }, 30);

    const closeBtn = document.getElementById("close");

    function onCloseBtnClick() {
        onDisplayEnd();
        dialogueUI.style.display = "none";
        dialogue.innerHTML = "";
        clearInterval(intervalRef)
        npcSound.stop();
        closeBtn.removeEventListener("click", onCloseBtnClick);
    }

    closeBtn.addEventListener("click", onCloseBtnClick)
}

// Adjust Camera scale based on the device 
export function cameraScale(k) {
    const resizeFactor = k.width() / k.height();

    if (resizeFactor < 1) {
        k.camScale(k.vec2(1))
        return;
    }

    k.camScale(k.vec2(1.5));
}
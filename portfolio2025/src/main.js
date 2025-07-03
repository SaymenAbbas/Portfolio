import { dialogueData, scaleFactor } from "./constants";
import { k } from "./kaboomCtx";
import { cameraScale, displayDialogue } from "./utils";

k.loadSprite("spritesheet", "./spritesheet.png", {
    sliceX: 39,
    sliceY: 31,
    anims: {
        "idle-down": 940,
        "walk-down": { from: 940, to: 943, loop: true, speed: 8 },

        "idle-side": 975,
        "walk-side": { from: 979, to: 982, loop: true, speed: 8 },

        "idle-up": 1018,
        "walk-up": { from: 1018, to: 1021, loop: true, speed: 8 }
    }, 
 });

k.loadSprite("map", "./map.png")

k.setBackground(k.Color.fromHex("#191919"));

const grassTileIndex = 40;
const tileSize = 16;
const tileX = Math.ceil(k.width() / (tileSize * scaleFactor));
const tileY = Math.ceil(k.height() / (tileSize * scaleFactor));

for (let x = 0; x < tileX; x++) {
    for (let y = 0; y < tileY; y++) {
        k.add([
            k.sprite("spritesheet", {frame: grassTileIndex}),
            k.pos(x * tileSize * scaleFactor, y * tileSize * scaleFactor),
            k.scale(scaleFactor),
            "bg-tile"
        ]);
    }
}

k.loadSound("npc-voice", "./audio/video-games-speak-358238.mp3");
k.loadSound("bg-music", "./audio/tokyo-glow-285247.mp3");

// get map.json file with async (fetch call)
k.scene("main", async () => {
    k.play("bg-music", {loop: true, volume: 0.2});
    
    if (k.audioCtx.state === "suspended") {
        const resumeAudio = () => {
            k.audioCtx.resume();
            window.removeEventListener("click", resumeAudio);
            window.removeEventListener("keydown", resumeAudio);
        }
        window.addEventListener("click", resumeAudio);
        window.addEventListener("keydown", resumeAudio);
    }
    

    // await; finishes the codeline first, then continues
    const mapData = await (await fetch("./map.json")).json()
    const layers = mapData.layers

    const map = k.add([
        k.sprite("map"),
        k.pos(0),
        k.scale(scaleFactor)
    ])

    const player = k.make([
        k.sprite("spritesheet", {anim: "idle-down"}),
        k.area({shape: new k.Rect(k.vec2(0, 3), 10, 10), }),
        k.body(),
        k.anchor("center"),
        k.pos(),
        k.scale(scaleFactor),
        {
            speed: 250,
            direction: "down",
            isInDialogue: false,
        },
        "player", 
    ]);

    for (const layer of layers) {
      if(layer.name === "boundaries") {
        for (const boundary of layer.objects) {
            map.add([
                k.area({ shape: new k.Rect(k.vec2(0), boundary.width, boundary.height),
                }),
                k.body({ isStatic: true}),
                k.pos(boundary.x, boundary.y),
                boundary.name,
            ]);

            if (boundary.name) {
                player.onCollide(boundary.name, () => {
                    player.isInDialogue = true;
                    displayDialogue(k, dialogueData[boundary.name], () => player.isInDialogue = false);
                })
            }

        }
        continue;
      }
      
      if (layer.name === "spawnpoint") {
        for (const entity of layer.objects) {
            if (entity.name === "player") {
                player.pos = k.vec2(
                    (map.pos.x + entity.x) * scaleFactor,
                    (map.pos.y + entity.y) * scaleFactor);
                    k.add(player)
                    continue;
            }
        }
      }
    }

    cameraScale(k);

    k.onResize(() => {
        cameraScale(k);
    })

    k.onUpdate(() => {
        k.camPos(player.pos.x, player.pos.y + 100);
    })

    k.onMouseDown((mouseBtn) => {
        if(mouseBtn !== "left" || player.isInDialogue) return;

        const worldMousePos = k.toWorld(k.mousePos());
        player.moveTo(worldMousePos, player.speed);


    })

});

k.go("main")

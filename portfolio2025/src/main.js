import { dialogueData, scaleFactor } from "./constants";
import { k } from "./kaboomCtx";
import { cameraScale, displayDialogue } from "./utils";

k.loadSprite("spritesheet", "./spritesheet.png", {
    sliceX: 39,
    sliceY: 31,
    anims: {
        "idle-down": 940,
        "walk-down": { from: 940, to: 943, loop: true, speed: 8 },

        "idle-side": 979,
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

k.loadSound("npc-voice", "./video-games-speak-358238.mp3");
k.loadSound("bg-music", "./tokyo-glow-285247.mp3");
k.loadSound("player-footsteps", "./walking-on-wood-363349.mp3");

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
            footstepsSound: null,

            isMoving() {
                return this.moveTarget != null;
            }
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
                    player.moveTarget  = null;
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

        if (player.moveTarget && player.pos.dist(player.moveTarget) < 2) {
            player.moveTarget = null;
            
            if (player.direction === "down") {
                player.play("idle-down");
            } else if (player.direction === "up") {
                player.play("idle-up");
            } else {
                player.play("idle-side");
            }

        }

        const isMoving = player.moveTarget != null && !player.isInDialogue;

        if (isMoving && player.footstepsSound === null) {
            player.footstepsSound = k.play("player-footsteps", {loop: true, volume: 0.2});
        }

        if ((!isMoving || player.isInDialogue) && player.footstepsSound !== null) {
            player.footstepsSound.stop();
            player.footstepsSound = null;
        }
    })

    k.onMouseDown((mouseBtn) => {
        if(mouseBtn !== "left" || player.isInDialogue) return;

        const worldMousePos = k.toWorld(k.mousePos());
        player.moveTarget = worldMousePos;
        player.moveTo(worldMousePos, player.speed);

        // Player animation 
        //Angle between player and worldMousePos
        const mouseAngle = player.pos.angle(worldMousePos);

        const lowerBoundary = 50;
        const upperBoundary = 125;

        if (mouseAngle > lowerBoundary && 
            mouseAngle < upperBoundary &&
            player.curAnim() !== "walk-up" 
        ) {
            player.play("walk-up");
            player.direction = "up";
            return;
        }

        if (mouseAngle < -lowerBoundary && 
            mouseAngle > -upperBoundary &&
            player.curAnim() !== "walk-down" 
        ) {
            player.play("walk-down");
            player.direction = "down";
            return;
        }

        if(Math.abs(mouseAngle) > upperBoundary) {
            player.flipX = false;
            if (player.curAnim() !== "walk-side") player.play("walk-side")
            player.direction = "right";
            return;
        }

        if(Math.abs(mouseAngle) < lowerBoundary) {
            player.flipX = true;
            if (player.curAnim() !== "walk-side") player.play("walk-side")
            player.direction = "left";
            return;
        }
    })

    k.onMouseRelease(() => {
        player.moveTarget = null;
        
        if (player.direction === "down") {
            player.play("idle-down");
            return;
        }

         if (player.direction === "up") {
            player.play("idle-up");
            return;
        }

        player.play("idle-side");
    })

});

k.go("main")

import { scaleFactor } from "./constants";
import { k } from "./kaboomCtx";

k.loadSprite("spritesheet.png", "./spritesheet.png", {
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

// get map.json file with async (fetch call)
k.scene("main", async () => {
    // await; finishes the codeline first, then continues
    const mapData = await (await fetch("./map.json")).json()
    const layers = mapData.layers

    const map = k.make([
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
            speed: 25,
            direction: "down",
            isInDialogue: false,
        },
        "player", 
    ]);

    for (const layer of layers) {
      if(layer.name === "boundaries") {
        for (const boundary of layer.objects) {
            map.add([
                k.area({ shape: new k.Rect(vec2(0), boundary.width, boundary.height),
                }),
                k.body({ isStatic: true}),
                k.pos(boundary.x, boundary.y),
                boundary.name,
            ]);

            if (boundary.name) {
                player.onCollide(boundary.name, () => {
                    player.isInDialogue = true;
                    // Things I have to do
                })
            }

        }
      }   
    }

});

k.go("main")

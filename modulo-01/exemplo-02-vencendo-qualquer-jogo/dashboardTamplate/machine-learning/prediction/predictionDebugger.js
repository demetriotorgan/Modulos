import * as PIXI from "pixi.js";

export class PredictionDebugger {

    constructor(stage) {
        this.stage = stage
        this.graphics = new PIXI.Graphics();
        this.stage.addChild(this.graphics);
    }

    clear() {
        this.graphics.clear();
    }

    draw(detectedX,
        detectedY
    ) {
        this.clear();

        //ponto verde (posição detectada peolo YOLO)
        this.graphics.beginFill(0x00ff00);
        this.graphics.drawCircle(
            detectedX,
            detectedY,
            6
        );
        this.graphics.endFill();
    }
    drawRect(x, y, width, height) {

        this.graphics
            .rect(x, y, width, height)
            .stroke({
                color: 0xffff00,
                width: 2
            });
        
    }

}
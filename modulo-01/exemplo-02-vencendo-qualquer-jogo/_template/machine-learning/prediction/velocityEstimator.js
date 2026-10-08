import { PredictionConfig } from "./config";


export function estimateVelocity(history){


    const validSamples =
        history
        .filter(sample =>
            sample.deltaTime >
            PredictionConfig.minimumDeltaTime
        )
        .slice(-PredictionConfig.historySize);



    if(validSamples.length === 0){

        return {

            velocityX:0,
            velocityY:0

        };

    }



    let velocityX = 0;
    let velocityY = 0;



    validSamples.forEach(sample=>{

        velocityX += sample.velocityX;
        velocityY += sample.velocityY;

    });



    return {

        velocityX:
        velocityX / validSamples.length,


        velocityY:
        velocityY / validSamples.length

    };


}
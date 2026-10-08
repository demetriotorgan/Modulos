export function generateMatchStatistics(shotTelemetry){
    const shots = shotTelemetry.length
    const hits= shotTelemetry.reduce((acc, shot)=>{
        return shot.hit ? acc + 1 : acc;
    },0);

    return{
        shots,
        hits,
        errors: shots - hits,
        acuracy: ((hits/shots)*100).toFixed(2)
    }
}
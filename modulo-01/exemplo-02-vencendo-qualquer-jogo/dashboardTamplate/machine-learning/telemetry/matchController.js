export class MatchController {

    finished(game) {
        return game.stage.hud.replayButton != null;
    }

}
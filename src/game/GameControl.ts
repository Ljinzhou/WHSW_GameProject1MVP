import Phaser from 'phaser';

export default class GameControl {
    /**
     * 暂停游戏逻辑和物理系统。
     * @param game Phaser 游戏实例
     */
    static pauseGame(game: Phaser.Game) {
        if (!game) return;
        
        // 遍历所有活动场景并暂停它们
        game.scene.scenes.forEach(scene => {
            if (scene.scene.isActive()) {
                scene.physics.pause();
                scene.time.paused = true;
                // 如果我们也想显式暂停动画/补间动画，虽然 time.paused 通常会处理它。
                // scene.tweens.pauseAll();
            }
        });
    }

    /**
     * 恢复游戏逻辑和物理系统。
     * @param game Phaser 游戏实例
     */
    static resumeGame(game: Phaser.Game) {
        if (!game) return;

        game.scene.scenes.forEach(scene => {
            if (scene.scene.isActive() || scene.scene.isPaused()) { // 检查暂停状态？
                // 如果只是暂停物理，isActive() 可能返回 true？
                // 实际上 scene.pause() 会暂停整个场景更新。
                // 但我们手动暂停物理/时间以便允许 UI 更新（如果是单独的场景）。
                // 这里我们只是恢复物理/时间。
                
                scene.physics.resume();
                scene.time.paused = false;
                // scene.tweens.resumeAll();
            }
        });
    }
}

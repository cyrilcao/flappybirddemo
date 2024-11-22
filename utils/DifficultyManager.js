export class DifficultyManager {
  constructor() {
    this.levels = [
      { speed: 1, gap: 200, interval: 300, name: '简单', scoreThreshold: 0 },
      { speed: 1.3, gap: 180, interval: 280, name: '普通', scoreThreshold: 10 },
      { speed: 1.6, gap: 160, interval: 260, name: '困难', scoreThreshold: 25 },
      { speed: 2, gap: 150, interval: 240, name: '专家', scoreThreshold: 50 }
    ]
    this.currentLevel = 0
    this.transitionProgress = 0
  }

  getCurrentLevel() {
    return this.levels[this.currentLevel]
  }

  increaseLevel() {
    if (this.currentLevel < this.levels.length - 1) {
      this.currentLevel++
      return true
    }
    return false
  }

  getLevelConfig() {
    const currentLevel = this.getCurrentLevel()
    const nextLevel = this.levels[this.currentLevel + 1]
    
    if (nextLevel && this.transitionProgress > 0) {
      // 在难度之间平滑过渡
      return {
        pipeSpeed: this.lerp(currentLevel.speed, nextLevel.speed, this.transitionProgress) * 3,
        pipeGap: this.lerp(currentLevel.gap, nextLevel.gap, this.transitionProgress),
        pipeInterval: this.lerp(currentLevel.interval, nextLevel.interval, this.transitionProgress),
        backgroundSpeed: this.lerp(currentLevel.speed, nextLevel.speed, this.transitionProgress) * 2
      }
    }
    
    return {
      pipeSpeed: currentLevel.speed * 3,
      pipeGap: currentLevel.gap,
      pipeInterval: currentLevel.interval,
      backgroundSpeed: currentLevel.speed * 2
    }
  }

  lerp(start, end, progress) {
    return start + (end - start) * progress
  }

  updateTransition(dt) {
    if (this.transitionProgress > 0) {
      this.transitionProgress = Math.max(0, this.transitionProgress - dt)
    }
  }

  reset() {
    this.currentLevel = 0
  }
} 
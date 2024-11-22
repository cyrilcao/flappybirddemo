import { GameCore } from './game-core'

const gameConfig = {
  gravity: 0.6,
  flapPower: -10,
  pipeGap: 200,
  pipeInterval: 300,
  gameSpeed: 1,
  scoreIncrement: 1,
  difficultyIncrease: {
    scoreInterval: 5,
    speedIncrease: 0.1,
    gapDecrease: 5,
    maxSpeed: 2.5,
    minGap: 150
  },
  visualEffects: {
    scorePopup: true,
    screenShake: true,
    particleEffects: true
  },
  audio: {
    enabled: true,
    volume: 0.7
  },
  performance: {
    maxParticles: 100,
    useRequestAnimationFrame: true,
    cullingDistance: 100
  },
  debug: {
    showFPS: false,
    showHitbox: false,
    showStats: false
  },
  adaptiveDifficulty: {
    enabled: true,
    scoreThreshold: 5,
    adjustmentRate: 0.1
  }
}

const FPS = 60
const frameInterval = 1000 / FPS

const GameState = {
  READY: 'ready',
  PLAYING: 'playing',
  PAUSED: 'paused',
  GAME_OVER: 'gameOver'
}

const TARGET_FPS = 60
const FRAME_TIME = 1000 / TARGET_FPS
const MAX_FRAME_TIME = FRAME_TIME * 2 // 防止帧率过低时的大跳跃

Page({
  data: {
    score: 0,
    gameOver: false,
    highScore: 0,
    isPlaying: false,
    isPaused: false,
    currentLevel: '简单',
    showLevelUp: false,
    showFPS: false,
    fps: 0,
    difficulties: [
      { name: '简单', speed: 1, gap: 200 },
      { name: '普通', speed: 1.3, gap: 180 },
      { name: '困难', speed: 1.6, gap: 160 },
      { name: '专家', speed: 2, gap: 150 }
    ],
    selectedDifficulty: '简单'
  },

  onLoad() {
    // 等待页面渲染完成后再初始化 Canvas
    wx.createSelectorQuery()
      .select('#gameCanvas')
      .fields({ node: true, size: true })
      .exec(this.initCanvas.bind(this))
  },

  initCanvas(res) {
    if (!res[0]) {
      console.error('Canvas element not found')
      return
    }

    const canvas = res[0].node
    const ctx = canvas.getContext('2d')
    
    // 使用新的API获取窗口信息
    const windowInfo = wx.getWindowInfo()
    
    // 设置画布大小
    canvas.width = windowInfo.windowWidth
    canvas.height = windowInfo.windowHeight
    
    this.canvas = canvas
    this.ctx = ctx
    
    // 直接初始化游戏
    this.initGame()
  },

  startGame() {
    if (!this.data.canvasReady) {
      wx.showToast({
        title: '游戏正在加载...',
        icon: 'loading',
        duration: 2000
      })
      return
    }

    this.setData({
      hasStarted: true,
      score: 0,
      currentLevel: this.data.selectedDifficulty
    }, () => {
      this.initGame()
    })
  },

  initGame() {
    if (!this.canvas || !this.ctx) {
      console.error('Canvas not initialized')
      return
    }

    try {
      // 先重置状态
      this.setData({ 
        score: 0,
        isPlaying: false,
        gameOver: false,
        currentLevel: '简单',
        showLevelUp: false,
        isPaused: false
      })

      // 创建游戏对象
      this.createGameObjects()
      
      // 加载最高分
      this.loadHighScore()
      
      // 初始化难度管理器
      this.difficultyManager = new GameCore.DifficultyManager()
      
      // 设置初始游戏配置
      gameConfig.gameSpeed = 1
      this.updateGameConfig()
      
      // 强制更新一次渲染
      this.render()
    } catch (error) {
      console.error('Game initialization failed:', error)
      wx.showToast({
        title: '游戏初始化失败',
        icon: 'none',
        duration: 2000
      })
    }
  },

  createGameObjects() {
    this.background = new GameCore.Background(this.canvas)
    this.bird = new GameCore.Bird(
      this.canvas.width / 3, 
      this.canvas.height / 2, 
      this.canvas
    )
    this.pipes = []
    this.effectManager = new GameCore.EffectManager(this.canvas)
    this.tutorialManager = new GameCore.TutorialManager(this.canvas)
  },

  loadHighScore() {
    try {
      const highScore = wx.getStorageSync('highScore') || 0
      this.setData({ highScore })
    } catch (e) {
      console.warn('Failed to load high score:', e)
      this.setData({ highScore: 0 })
    }
  },

  lastFrameTime: 0,

  startGameLoop() {
    if (this._gameLoopTimer) {
      if (this.canvas) {
        this.canvas.cancelAnimationFrame(this._gameLoopTimer)
      }
    }
    
    let lastTime = Date.now()
    const loop = () => {
      if (!this.data.isPlaying || this.data.isPaused) {
        this._gameLoopTimer = null
        return
      }
      
      const currentTime = Date.now()
      const deltaTime = Math.min((currentTime - lastTime) / 1000, MAX_FRAME_TIME)
      lastTime = currentTime
      
      this.update(deltaTime)
      this.render()
      
      // 使用 canvas 的 requestAnimationFrame
      if (this.canvas) {
        this._gameLoopTimer = this.canvas.requestAnimationFrame(loop)
      }
    }
    
    // 使用 canvas 的 requestAnimationFrame
    if (this.canvas) {
      this._gameLoopTimer = this.canvas.requestAnimationFrame(loop)
    }
  },

  stopGameLoop() {
    if (this._gameLoopTimer && this.canvas) {
      this.canvas.cancelAnimationFrame(this._gameLoopTimer)
      this._gameLoopTimer = null
    }
  },

  handleTap() {
    if (this.data.gameOver) {
      this.restartGame()
      return
    }
    
    if (!this.data.isPlaying) {
      this.setData({ isPlaying: true })
      this.startGameLoop()
      return
    }
    
    if (this.bird) {
      this.bird.flap()
    }
  },

  update(dt) {
    try {
      if (!this.data.isPlaying || this.data.gameOver || this.data.isPaused) return
      
      // 更新游戏对象
      if (this.bird) {
        this.bird.update(dt)
        // 限制小鸟的活动范围
        this.bird.y = Math.max(this.bird.height / 2, Math.min(this.bird.y, this.canvas.height - this.bird.height / 2))
      }
      
      if (this.background) this.background.update(dt)
      if (this.effectManager) this.effectManager.update(dt)
      
      this.updatePipes(dt)
      this.checkCollisions()
      this.updateScore()
      
      // 更新难度
      if (this.difficultyManager) {
        this.difficultyManager.updateTransition(dt)
      }
      
      // 计算FPS
      if (gameConfig.debug.showFPS) {
        this.calculateFPS()
      }
      
    } catch (error) {
      console.error('Update error:', error)
      this.handleError(error)
    }
  },

  updatePipes(dt) {
    const currentSpeed = gameConfig.gameSpeed + 
      (this.data.score * gameConfig.difficultyIncrease.speedIncrease)

    // 生成新管道
    if (this.pipes.length === 0 || 
        this.canvas.width - this.pipes[this.pipes.length - 1].x >= gameConfig.pipeInterval) {
      const newPipe = new GameCore.Pipe(this.canvas)
      newPipe.speed = 3 * currentSpeed
      this.pipes.push(newPipe)
    }
    
    // 更新管道位置
    this.pipes.forEach(pipe => pipe.update(dt))
    
    // 使用filter优化性能
    const visiblePipes = []
    for (let i = 0; i < this.pipes.length; i++) {
      if (this.pipes[i].x + this.pipes[i].width > 0) {
        visiblePipes.push(this.pipes[i])
      }
    }
    this.pipes = visiblePipes
  },

  checkCollisions() {
    if (!this.bird || !this.bird.hitbox || this.data.gameOver) return;

    let collision = false;

    // 检查是否碰到天花板
    if (this.bird.y - this.bird.hitbox.radius <= 0) {
      collision = true;
    }

    // 检查是否碰到地面或草地
    if (this.background && this.background.checkGroundCollision(this.bird.y, this.bird.hitbox.radius)) {
      collision = true;
    }

    // 检查是否碰到管道
    if (this.pipes) {
      for (const pipe of this.pipes) {
        if (pipe && this.bird.checkCollision(pipe)) {
          collision = true;
          break;
        }
      }
    }

    if (collision && !this.data.gameOver) {
      this.gameOver();
    }
  },

  updateScore() {
    this.pipes.forEach(pipe => {
      if (!pipe.passed && pipe.x + pipe.width < this.bird.x) {
        pipe.passed = true
        const newScore = this.data.score + 1
        
        // 添加分数弹出效果
        if (gameConfig.visualEffects.scorePopup) {
          this.effectManager.addScorePopup(this.bird.x, this.bird.y - 30, '+1')
        }
        
        // 添加粒子效果
        if (gameConfig.visualEffects.particleEffects) {
          this.effectManager.addParticles(this.bird.x, this.bird.y, {
            count: 5,
            color: '#FFD700',
            speed: 2
          })
        }
        
        // 更新分数
        this.setData({ score: newScore })
        
        // 检查并更新难度
        this.updateDifficulty(newScore)
        
        // 检查成就
        this.checkAchievements()
        
        // 播放音效
        if (gameConfig.audio.enabled && this.soundManager) {
          this.soundManager.play('score')
        }
      }
    })
  },

  // 添加新的难度更新方法
  updateDifficulty(score) {
    // 根据分数确定难度
    let newLevel = '简单'
    if (score >= 50) {
      newLevel = '专家'
    } else if (score >= 25) {
      newLevel = '困难'
    } else if (score >= 10) {
      newLevel = '普通'
    }
    
    // 如果难度发生变化
    if (newLevel !== this.data.currentLevel) {
      // 获取对应的难度配置
      const difficulty = this.data.difficulties.find(d => d.name === newLevel)
      if (difficulty) {
        this.setData({ 
          currentLevel: newLevel,
          showLevelUp: true 
        })
        
        // 更新游戏参数
        gameConfig.gameSpeed = difficulty.speed
        gameConfig.pipeGap = difficulty.gap
        
        // 更新管道速度
        this.pipes.forEach(pipe => {
          pipe.speed = 3 * difficulty.speed
        })
        
        // 更新背景速度
        if (this.background) {
          this.background.speed = 2 * difficulty.speed
        }
        
        // 添加等级提升特效
        if (this.effectManager) {
          this.effectManager.addLevelUpEffect()
        }
        
        // 3秒后隐藏等级提升提示
        setTimeout(() => {
          this.setData({ showLevelUp: false })
        }, 3000)
      }
    }
  },

  checkLevelUp() {
    if (this.difficultyManager && this.difficultyManager.increaseLevel()) {
      const level = this.difficultyManager.getCurrentLevel()
      
      // 使用同步方式更新难度
      this.setData({
        currentLevel: level.name,
        showLevelUp: true
      })
      
      // 更新游戏配置
      this.updateGameConfig()
      
      // 添加等级提升特效
      if (this.effectManager) {
        this.addLevelUpEffect()
      }
      
      // 3秒后隐藏等级提升提示
      setTimeout(() => {
        this.setData({ showLevelUp: false })
      }, 3000)
    }
  },

  addLevelUpEffect() {
    // 直接使用 effectManager 的 addLevelUpEffect 方法
    if (this.effectManager) {
      this.effectManager.addLevelUpEffect()
    }
    
    // 播放等级提升音效
    if (this.soundManager) {
      this.soundManager.play('levelUp')
    }
  },

  updateGameConfig() {
    const config = this.difficultyManager.getLevelConfig()
    gameConfig.gameSpeed = config.pipeSpeed / 3
    this.updateGameObjects(config)
  },

  updateGameObjects(config) {
    if (this.background) {
      this.background.speed = config.backgroundSpeed
    }
    
    if (this.pipes) {
      this.pipes.forEach(pipe => {
        pipe.speed = config.pipeSpeed
        pipe.gap = config.pipeGap
      })
    }
  },

  gameOver() {
    // 先停止游戏循环
    this.stopGameLoop()
    
    try {
      // 添加游戏结束特效
      if (this.effectManager) {
        if (gameConfig.visualEffects.screenShake) {
          this.effectManager.addScreenShake(5, 200)
        }
        
        if (gameConfig.visualEffects.particleEffects) {
          this.effectManager.addExplosion(this.bird.x, this.bird.y)
        }
      }
      
      // 获取并更新最高分
      let highScore = 0
      try {
        highScore = wx.getStorageSync('highScore') || 0
      } catch (e) {
        console.warn('Failed to read high score:', e)
      }
      
      highScore = Math.max(highScore, this.data.score)
      
      // 使用同步方式更新状态
      this.setData({
        gameOver: true,
        isPlaying: false,
        highScore: highScore,
        isPaused: false
      })
      
      // 保存最高分
      try {
        wx.setStorageSync('highScore', highScore)
      } catch (e) {
        console.warn('Failed to save high score:', e)
      }
      
      // 播放音效
      if (this.soundManager) {
        this.soundManager.play('hit')
        setTimeout(() => this.soundManager.play('die'), 300)
      }
      
      // 重置游戏速度
      gameConfig.gameSpeed = 1
      
      // 添加震动效果
      try {
        wx.vibrateShort({
          type: 'medium'
        })
      } catch (e) {
        console.warn('Vibration failed:', e)
      }
      
      // 强制更新一次渲染
      this.render()
      
    } catch (error) {
      console.error('Game over effect error:', error)
      // 确保游戏状态正确更新，即使特效失败
      this.setData({
        gameOver: true,
        isPlaying: false
      })
    }
  },

  restartGame() {
    // 重置游戏配置
    gameConfig.gameSpeed = 1
    gameConfig.pipeGap = 200
    
    this.setData({
      score: 0,
      gameOver: false,
      isPlaying: false,
      isPaused: false,
      showLevelUp: false,
      currentLevel: '简单'
    }, () => {
      this.initGame()
    })
  },

  render(interpolation = 1) {
    if (!this.ctx || !this.canvas) return
    
    const ctx = this.ctx
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
    
    // 按顺序绘制游戏元素
    if (this.background) this.background.draw(ctx)
    if (this.pipes) this.pipes.forEach(pipe => pipe.draw(ctx))
    if (this.bird) {
      // 使用插值平滑小鸟的运动
      if (this.bird.previousY !== undefined) {
        const smoothY = this.bird.previousY + (this.bird.y - this.bird.previousY) * interpolation
        this.bird.drawAt(ctx, this.bird.x, smoothY)
      } else {
        this.bird.draw(ctx)
      }
    }
    
    // 先绘制游戏效果
    if (this.effectManager) {
      this.effectManager.draw(ctx)
    }
    
    // 单独绘制难度显示，确保它在最上层
    if (this.effectManager && this.data.isPlaying && !this.data.gameOver) {
      ctx.save()
      this.effectManager.drawDifficultyLevel(ctx, this.data.currentLevel)
      ctx.restore()
    }
    
    // 绘制教程
    if (!this.data.isPlaying && !this.data.gameOver && this.tutorialManager) {
      this.tutorialManager.draw(ctx)
    }
  },

  initSounds() {
    this.sounds = {
      flap: wx.createInnerAudioContext(),
      score: wx.createInnerAudioContext(),
      die: wx.createInnerAudioContext()
    }
    
    this.sounds.flap.src = '/assets/sounds/flap.mp3'
    this.sounds.score.src = '/assets/sounds/score.mp3'
    this.sounds.die.src = '/assets/sounds/die.mp3'
  },

  playSound(soundName) {
    if (this.sounds[soundName]) {
      this.sounds[soundName].play()
    }
  },

  togglePause() {
    if (this.data.gameOver) return
    
    this.setData({
      isPaused: !this.data.isPaused,
      isPlaying: !this.data.isPaused
    })
    
    if (!this.data.isPaused) {
      this.startGameLoop()
    }
  },

  // 更新游戏状态管理
  updateGameState(newState) {
    this.setData({ gameState: newState })
    
    switch (newState) {
      case GameState.PLAYING:
        this.setData({ isPlaying: true, isPaused: false })
        this.startGameLoop()
        break
      case GameState.PAUSED:
        this.setData({ isPlaying: false, isPaused: true })
        break
      case GameState.GAME_OVER:
        this.setData({ 
          isPlaying: false, 
          isPaused: false,
          gameOver: true 
        })
        break
      case GameState.READY:
        this.initGame()
        break
    }
  },

  async addScoreEffect(x, y) {
    const effect = await Animation.createParticles(
      this.ctx, 
      x, 
      y, 
      '#FFD700', // 金色粒子
      15
    )
    this.data.effects.push(effect)
  },

  updateEffects() {
    if (!this.data.effects.length) return
    
    for (const effect of this.data.effects) {
      effect.update()
    }
    
    // 移除已完成的效果
    this.data.effects = this.data.effects.filter(effect => !effect.isFinished())
  },

  async addScreenShake() {
    const intensity = 5
    const duration = 200
    const startTime = Date.now()
    
    const shakeEffect = {
      update() {
        const elapsed = Date.now() - startTime
        if (elapsed >= duration) return true
        
        const progress = elapsed / duration
        const decay = 1 - progress
        const offset = intensity * decay
        
        this.canvas.style.transform = `translate(${Math.random() * offset - offset/2}px, ${Math.random() * offset - offset/2}px)`
        
        return false
      }
    }
    
    this.data.effects.push(shakeEffect)
    
    // 震动反馈
    wx.vibrateShort({
      type: 'medium'
    })
  },

  calculateFPS() {
    const now = Date.now()
    if (!this.lastFPSUpdate) {
      this.lastFPSUpdate = now
      this.frames = 0
      return
    }
    
    this.frames++
    
    const elapsed = now - this.lastFPSUpdate
    if (elapsed >= 1000) { // 每秒更新一次
      const fps = Math.round((this.frames * 1000) / elapsed)
      this.setData({
        fps: fps
      })
      
      this.frames = 0
      this.lastFPSUpdate = now
    }
  },

  // 在页面卸载时清理资源
  onUnload() {
    this.stopGameLoop()
    if (this.soundManager) {
      this.soundManager.dispose()
    }
  },

  selectDifficulty(e) {
    const difficulty = e.currentTarget.dataset.difficulty
    this.setData({
      selectedDifficulty: difficulty
    })
  },

  backToStart() {
    this.setData({
      hasStarted: false,
      gameOver: false,
      score: 0,
      isPlaying: false
    })
  },

  // 添加性能监控
  onShow() {
    // 重置FPS计数器
    this.frames = 0
    this.lastFPSUpdate = Date.now()
    
    if (this.data.isPlaying && !this.data.gameOver) {
      this.startGameLoop()
    }
  },

  onHide() {
    // 暂停游戏
    if (this.data.isPlaying && !this.data.gameOver) {
      this.togglePause()
    }
  },

  // 添加错误恢复机制
  handleError(error) {
    console.error('Game error:', error)
    
    // 保存游戏状态
    try {
      const gameState = {
        score: this.data.score,
        highScore: this.data.highScore,
        level: this.data.currentLevel
      }
      wx.setStorageSync('gameState', gameState)
    } catch (e) {
      console.warn('Failed to save game state:', e)
    }
    
    // 尝试恢复游戏
    this.setData({
      isPlaying: false,
      gameOver: true
    }, () => {
      this.initGame()  // 重新初始化游戏
      
      wx.showModal({
        title: '游戏出现错误',
        content: '是否恢复上次游戏进度？',
        success: (res) => {
          if (res.confirm) {
            // 恢复保存的游戏状态
            const gameState = wx.getStorageSync('gameState')
            if (gameState) {
              this.setData({
                score: gameState.score,
                highScore: gameState.highScore,
                currentLevel: gameState.level
              })
            }
          }
        }
      })
    })
  },

  increaseDifficulty() {
    // 增加游戏速度
    const newSpeed = Math.min(
      gameConfig.gameSpeed + gameConfig.difficultyIncrease.speedIncrease,
      gameConfig.difficultyIncrease.maxSpeed
    )
    
    // 减少管道间隙
    const newGap = Math.max(
      gameConfig.pipeGap - gameConfig.difficultyIncrease.gapDecrease,
      gameConfig.difficultyIncrease.minGap
    )
    
    // 更新游戏配置
    gameConfig.gameSpeed = newSpeed
    gameConfig.pipeGap = newGap
    
    // 更新现有管道的速度
    this.pipes.forEach(pipe => {
      pipe.speed = 3 * newSpeed
    })
    
    // 更新背景速度
    if (this.background) {
      this.background.speed = 2 * newSpeed
    }
    
    // 显示难度提升提示
    this.setData({
      showLevelUp: true,
      currentLevel: `难度 ${Math.floor((newSpeed - 1) * 10)}`
    })
    
    // 添加等级提升特效
    if (this.effectManager) {
      this.addLevelUpEffect()
    }
    
    // 3秒后隐藏等级提升提示
    setTimeout(() => {
      this.setData({ showLevelUp: false })
    }, 3000)
  },

  checkAchievements() {
    const score = this.data.score
    const achievements = [
      { score: 10, text: '初级飞行员', icon: '🐤' },
      { score: 20, text: '熟练飞行员', icon: '🦅' },
      { score: 50, text: '飞行大师', icon: '👑' }
    ]
    
    achievements.forEach(achievement => {
      if (score === achievement.score) {
        this.effectManager.addAchievementEffect(
          achievement.text,
          achievement.icon
        )
        
        // 添加震动反馈
        wx.vibrateShort({ type: 'medium' })
      }
    })
  },

  // 如果需要获取其他系统信息，可以添加以下方法
  getSystemInfo() {
    // 获取设备信息
    const deviceInfo = wx.getDeviceInfo()
    
    // 获取基础信息
    const appBaseInfo = wx.getAppBaseInfo()
    
    // 获取系统设置
    const systemSetting = wx.getSystemSetting()
    
    return {
      deviceInfo,
      appBaseInfo,
      systemSetting,
      windowInfo: wx.getWindowInfo()
    }
  }
}) 
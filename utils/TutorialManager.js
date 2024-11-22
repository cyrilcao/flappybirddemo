export class TutorialManager {
  constructor(canvas) {
    this.canvas = canvas
    this.isActive = true
    this.alpha = 1
    this.pulseDirection = -1
    this.pulseSpeed = 0.02
    
    // 教程步骤
    this.steps = [
      {
        text: '点击屏幕让小鸟飞翔',
        y: canvas.height * 0.4,
        icon: '👆'
      },
      {
        text: '穿过管道得分',
        y: canvas.height * 0.5,
        icon: '⭐'
      },
      {
        text: '避免碰撞',
        y: canvas.height * 0.6,
        icon: '💥'
      }
    ]
    
    this.currentStep = 0
    this.stepChangeInterval = 2000 // 每2秒切换一次提示
    this.lastStepChange = Date.now()
  }

  update(dt) {
    if (!this.isActive) return
    
    // 更新呼吸效果
    this.alpha += this.pulseDirection * this.pulseSpeed
    if (this.alpha <= 0.5) {
      this.alpha = 0.5
      this.pulseDirection = 1
    } else if (this.alpha >= 1) {
      this.alpha = 1
      this.pulseDirection = -1
    }
    
    // 更新教程步骤
    const now = Date.now()
    if (now - this.lastStepChange > this.stepChangeInterval) {
      this.currentStep = (this.currentStep + 1) % this.steps.length
      this.lastStepChange = now
    }
  }

  draw(ctx) {
    if (!this.isActive) return
    
    const step = this.steps[this.currentStep]
    
    ctx.save()
    ctx.globalAlpha = this.alpha
    
    // 绘制图标
    ctx.font = '40px Arial'
    ctx.textAlign = 'center'
    ctx.fillText(step.icon, this.canvas.width / 2, step.y - 40)
    
    // 绘制文本
    ctx.font = '24px Arial'
    ctx.fillStyle = '#ffffff'
    ctx.textAlign = 'center'
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)'
    ctx.shadowBlur = 4
    ctx.fillText(step.text, this.canvas.width / 2, step.y)
    
    ctx.restore()
  }

  hide() {
    this.isActive = false
  }

  show() {
    this.isActive = true
    this.currentStep = 0
    this.lastStepChange = Date.now()
  }
} 
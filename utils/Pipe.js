export class Pipe {
  constructor(canvas) {
    this.canvas = canvas
    this.width = 80
    this.gap = 200
    this.x = canvas.width
    this.passed = false
    
    // 随机生成管道高度，但确保合理的游戏难度
    const minTopHeight = 100 // 最小顶部高度
    const maxTopHeight = canvas.height - this.gap - 100 // 最大顶部高度
    this.topHeight = Math.random() * (maxTopHeight - minTopHeight) + minTopHeight
    this.bottomY = this.topHeight + this.gap
    
    // 管道移动速度
    this.speed = 3
    
    // 管道样式配置
    this.style = {
      mainColor: '#43a047',
      borderColor: '#2e7d32',
      highlightColor: '#66bb6a',
      shadowColor: 'rgba(0, 0, 0, 0.3)',
      textureSpacing: 20,
      capHeight: 30,
      capOverhang: 5,
      borderWidth: 2
    }
    
    // 添加视觉效果状态
    this.visualState = {
      highlight: false,
      shake: 0,
      opacity: 1
    }
  }

  update() {
    this.x -= this.speed
    
    // 更新视觉效果
    if (this.visualState.highlight) {
      this.visualState.highlight = false
    }
    if (this.visualState.shake > 0) {
      this.visualState.shake *= 0.9
    }
  }

  draw(ctx) {
    ctx.save()
    
    // 应用管道的透明度
    ctx.globalAlpha = this.visualState.opacity
    
    // 应用震动效果
    if (this.visualState.shake > 0) {
      const shakeOffset = (Math.random() - 0.5) * this.visualState.shake
      ctx.translate(shakeOffset, shakeOffset)
    }
    
    // 绘制上管道
    this.drawPipe(ctx, this.x, 0, this.width, this.topHeight, true)
    
    // 绘制下管道
    this.drawPipe(ctx, this.x, this.bottomY, this.width, this.canvas.height - this.bottomY, false)
    
    ctx.restore()
  }

  drawPipe(ctx, x, y, width, height, isTop) {
    const { style } = this
    
    // 绘制管道阴影
    ctx.shadowColor = style.shadowColor
    ctx.shadowBlur = 10
    ctx.shadowOffsetX = 5
    ctx.shadowOffsetY = isTop ? 5 : -5
    
    // 绘制管道主体
    const gradient = ctx.createLinearGradient(x, y, x + width, y)
    gradient.addColorStop(0, style.mainColor)
    gradient.addColorStop(0.5, style.highlightColor)
    gradient.addColorStop(1, style.mainColor)
    
    ctx.fillStyle = gradient
    ctx.fillRect(x, y, width, height)
    
    // 重置阴影
    ctx.shadowColor = 'transparent'
    
    // 绘制管道口
    const capY = isTop ? y + height - style.capHeight : y
    const capGradient = ctx.createLinearGradient(x, capY, x, capY + style.capHeight)
    capGradient.addColorStop(0, style.highlightColor)
    capGradient.addColorStop(1, style.mainColor)
    
    ctx.fillStyle = capGradient
    ctx.fillRect(
      x - style.capOverhang,
      capY,
      width + style.capOverhang * 2,
      style.capHeight
    )
    
    // 绘制边框
    ctx.strokeStyle = style.borderColor
    ctx.lineWidth = style.borderWidth
    
    // 主体边框
    ctx.strokeRect(x, y, width, height)
    
    // 管道口边框
    ctx.strokeRect(
      x - style.capOverhang,
      capY,
      width + style.capOverhang * 2,
      style.capHeight
    )
    
    // 添加纹理
    this.drawPipeTexture(ctx, x, y, width, height)
  }

  drawPipeTexture(ctx, x, y, width, height) {
    const { style } = this
    
    ctx.strokeStyle = style.borderColor
    ctx.lineWidth = 1
    ctx.globalAlpha = 0.1
    
    // 垂直纹理线条
    for (let i = style.textureSpacing; i < width - style.textureSpacing; i += style.textureSpacing) {
      ctx.beginPath()
      ctx.moveTo(x + i, y)
      ctx.lineTo(x + i, y + height)
      ctx.stroke()
    }
    
    // 水平纹理线条
    for (let i = style.textureSpacing; i < height; i += style.textureSpacing) {
      ctx.beginPath()
      ctx.moveTo(x, y + i)
      ctx.lineTo(x + width, y + i)
      ctx.stroke()
    }
    
    ctx.globalAlpha = 1
  }

  // 获取精确的碰撞边界
  getBounds() {
    const bounds = {
      top: {
        x: this.x - this.style.capOverhang,
        y: 0,
        width: this.width + this.style.capOverhang * 2,
        height: this.topHeight
      },
      bottom: {
        x: this.x - this.style.capOverhang,
        y: this.bottomY,
        width: this.width + this.style.capOverhang * 2,
        height: this.canvas.height - this.bottomY
      }
    }
    
    // 添加管道口的碰撞区域
    bounds.top.capArea = {
      x: bounds.top.x,
      y: this.topHeight - this.style.capHeight,
      width: bounds.top.width,
      height: this.style.capHeight
    }
    
    bounds.bottom.capArea = {
      x: bounds.bottom.x,
      y: this.bottomY,
      width: bounds.bottom.width,
      height: this.style.capHeight
    }
    
    return bounds
  }

  // 添加视觉反馈效果
  addHitEffect() {
    this.visualState.highlight = true
    this.visualState.shake = 5
  }

  // 添加消失动画
  fadeOut() {
    this.visualState.opacity = 0.7
  }
} 
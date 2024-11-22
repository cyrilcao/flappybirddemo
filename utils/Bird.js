export class Bird {
  constructor(x, y, canvas) {
    this.canvas = canvas
    this.x = x
    this.y = y
    this.velocity = 0
    
    // 调整物理参数
    this.gravity = 0.4        // 降低重力
    this.flapPower = -7      // 减小跳跃力度
    this.maxVelocity = 10    // 限制最大速度
    this.minVelocity = -8    // 限制最小速度（向上速度）
    this.terminalVelocity = 12 // 终端速度（最大下落速度）
    
    this.width = 40
    this.height = 30
    this.rotation = 0
    
    // 调整旋转参数
    this.maxRotation = 45     // 减小最大旋转角度
    this.minRotation = -25    // 调整最小旋转角度
    this.rotationSpeed = 3    // 调整旋转速度
    
    // 动画相关属性
    this.wingAngle = 0
    this.wingSpeed = 0.15     // 降低翅膀扇动速度
    
    // 颜色配置
    this.colors = {
      body: '#FFD700',
      wing: '#FFA500',
      beak: '#FF6B6B',
      eye: '#000000',
      eyeLight: '#FFFFFF'
    }
    
    // 碰撞检测属性
    this.hitbox = {
      radius: this.width / 2.5,
      offset: { x: this.x, y: this.y }
    }
  }

  flap() {
    // 只有当下落速度大于最小速度时才能跳跃
    if (this.velocity > this.minVelocity) {
      this.velocity = this.flapPower
      this.rotation = this.minRotation
      this.wingAngle = 0 // 重置翅膀动画
    }
  }

  update(dt) {
    // 记录上一帧位置用于插值
    this.previousY = this.y
    
    // 使用更平滑的重力加速度
    this.velocity += this.gravity * dt * 60
    
    // 限制速度范围
    if (this.velocity > this.terminalVelocity) {
      this.velocity = this.terminalVelocity
    } else if (this.velocity < this.minVelocity) {
      this.velocity = this.minVelocity
    }
    
    // 更新位置，使用较小的移动步长
    this.y += this.velocity * dt * 50
    
    // 平滑的旋转过渡
    if (this.velocity > 0) {
      const rotationTarget = Math.min(this.maxRotation, 
        (this.velocity / this.terminalVelocity) * this.maxRotation)
      this.rotation += (rotationTarget - this.rotation) * this.rotationSpeed * dt
    } else {
      // 向上飞时快速转向上方
      this.rotation = this.minRotation
    }
    
    // 限制旋转角度
    if (this.rotation > this.maxRotation) {
      this.rotation = this.maxRotation
    } else if (this.rotation < this.minRotation) {
      this.rotation = this.minRotation
    }
    
    // 更平滑的翅膀动画
    this.wingAngle += this.wingSpeed * dt * 60
    if (this.wingAngle >= Math.PI * 2) {
      this.wingAngle = 0
    }
    
    // 更新碰撞盒
    this.hitbox.offset = {
      x: this.x,
      y: this.y
    }
  }

  draw(ctx) {
    ctx.save()
    
    // 移动到小鸟位置并旋转
    ctx.translate(this.x, this.y)
    ctx.rotate(this.rotation * Math.PI / 180)
    
    // 绘制阴影
    ctx.shadowColor = 'rgba(0, 0, 0, 0.2)'
    ctx.shadowBlur = 10
    ctx.shadowOffsetY = 5
    
    // 绘制身体
    ctx.fillStyle = this.colors.body
    ctx.beginPath()
    ctx.arc(0, 0, this.width / 2, 0, Math.PI * 2)
    ctx.fill()
    
    // 重置阴影
    ctx.shadowColor = 'transparent'
    
    // 绘制翅膀
    const wingY = Math.sin(this.wingAngle) * 10
    ctx.strokeStyle = this.colors.wing
    ctx.lineWidth = 3
    ctx.lineCap = 'round'
    
    // 绘制翅膀（添加渐变效果）
    const gradient = ctx.createLinearGradient(
      -this.width / 2, 0,
      -this.width / 4, -this.height / 2
    )
    gradient.addColorStop(0, this.colors.wing)
    gradient.addColorStop(1, this.colors.body)
    
    ctx.strokeStyle = gradient
    ctx.beginPath()
    ctx.moveTo(-this.width / 4, 0)
    ctx.quadraticCurveTo(
      -this.width / 2,
      wingY,
      -this.width / 4,
      -this.height / 2
    )
    ctx.stroke()
    
    // 绘制眼睛
    ctx.fillStyle = this.colors.eye
    ctx.beginPath()
    ctx.arc(this.width / 4, -this.height / 6, 4, 0, Math.PI * 2)
    ctx.fill()
    
    // 绘制眼睛高光
    ctx.fillStyle = this.colors.eyeLight
    ctx.beginPath()
    ctx.arc(this.width / 4 + 1, -this.height / 6 - 1, 1.5, 0, Math.PI * 2)
    ctx.fill()
    
    // 绘制嘴巴
    ctx.fillStyle = this.colors.beak
    ctx.beginPath()
    ctx.moveTo(this.width / 2, 0)
    ctx.lineTo(this.width * 0.8, 0)
    ctx.lineTo(this.width / 2, this.height / 6)
    ctx.closePath()
    ctx.fill()
    
    // 调试模式：显示碰撞盒
    if (this.canvas.debugMode) {
      ctx.strokeStyle = 'red'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.arc(0, 0, this.hitbox.radius, 0, Math.PI * 2)
      ctx.stroke()
    }
    
    ctx.restore()
  }

  checkCollision(pipe) {
    // 使用圆形碰撞检测来优化碰撞判定
    const birdCenter = {
      x: this.hitbox.offset.x,
      y: this.hitbox.offset.y
    }
    
    // 检查与上管道的碰撞
    const topPipe = {
      left: pipe.x,
      right: pipe.x + pipe.width,
      top: 0,
      bottom: pipe.topHeight
    }
    
    // 检查与下管道的碰撞
    const bottomPipe = {
      left: pipe.x,
      right: pipe.x + pipe.width,
      top: pipe.bottomY,
      bottom: this.canvas.height
    }
    
    // 检查与边界的碰撞
    if (birdCenter.y - this.hitbox.radius <= 0 || 
        birdCenter.y + this.hitbox.radius >= this.canvas.height) {
      return true
    }
    
    // 检查与管道的碰撞
    return this.checkCircleRectCollision(birdCenter, this.hitbox.radius, topPipe) ||
           this.checkCircleRectCollision(birdCenter, this.hitbox.radius, bottomPipe)
  }

  checkCircleRectCollision(circle, radius, rect) {
    // 获取矩形上最近的点
    const closestX = Math.max(rect.left, Math.min(circle.x, rect.right))
    const closestY = Math.max(rect.top, Math.min(circle.y, rect.bottom))
    
    // 计算距离
    const distanceX = circle.x - closestX
    const distanceY = circle.y - closestY
    
    // 使用勾股定理检查碰撞
    const distanceSquared = (distanceX * distanceX) + (distanceY * distanceY)
    return distanceSquared < (radius * radius)
  }

  // 添加 drawAt 方法
  drawAt(ctx, x, y) {
    // 保存当前位置
    const originalX = this.x
    const originalY = this.y
    
    // 临时设置新位置
    this.x = x
    this.y = y
    
    // 绘制小鸟
    this.draw(ctx)
    
    // 恢复原始位置
    this.x = originalX
    this.y = originalY
  }
} 
export class Background {
  constructor(canvas) {
    this.canvas = canvas
    this.width = canvas.width
    this.height = canvas.height
    this.speed = 2
    this.x = 0
    
    // 地面高度配置
    this.groundConfig = {
      grassHeight: 20,  // 草地高度
      groundY: this.height - 100,  // 地面Y坐标
      totalHeight: 100  // 总地面高度（包括草地）
    }
    
    this.image = canvas.createImage()
    this.image.src = '/assets/images/background.png'
    
    this.image.onload = () => {
      this.isLoaded = true
    }
    
    this.image.onerror = (err) => {
      console.error('背景图片加载失败:', err)
      this.isLoaded = false
    }
  }

  update() {
    this.x -= this.speed
    if (this.x <= -this.width) {
      this.x = 0
    }
  }

  // 添加地面碰撞检测方法
  checkGroundCollision(birdY, birdRadius) {
    // 检查是否触碰到草地部分
    return birdY + birdRadius >= this.groundConfig.groundY - this.groundConfig.grassHeight
  }

  draw(ctx) {
    if (!this.isLoaded) {
      // 如果图片未加载完成，绘制纯色背景
      ctx.fillStyle = '#87CEEB'
      ctx.fillRect(0, 0, this.width, this.height)
      
      // 绘制草地
      ctx.fillStyle = '#90EE90'
      ctx.fillRect(0, this.groundConfig.groundY - this.groundConfig.grassHeight, 
                  this.width, this.groundConfig.grassHeight)
      
      // 绘制地面
      ctx.fillStyle = '#8B4513'
      ctx.fillRect(0, this.groundConfig.groundY, 
                  this.width, this.groundConfig.totalHeight - this.groundConfig.grassHeight)
      
      return
    }
    
    // 绘制背景图片
    ctx.drawImage(this.image, this.x, 0, this.width, this.height)
    ctx.drawImage(this.image, this.x + this.width, 0, this.width, this.height)
  }
} 
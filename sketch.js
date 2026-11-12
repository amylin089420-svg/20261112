// 宣告各狀態的精靈圖表物件變數
let stopSpriteSheet;
let walkSpriteSheet;
let skillSpriteSheet;
let jumpSpriteSheet;
let effectSpriteSheet;

// 宣告用來存放各狀態裁切後畫格的陣列
let stopFrames = [];
let walkFrames = [];
let skillFrames = [];
let jumpFrames = [];
let effectFrames = [];

// 【1. 靜止狀態】精靈圖參數設定 (11/1/stop.png，共7張，寬758，高105)
const STOP_SHEET_WIDTH = 758;
const STOP_SHEET_HEIGHT = 105;
const STOP_TOTAL_FRAMES = 7;
const STOP_FRAME_WIDTH = STOP_SHEET_WIDTH / STOP_TOTAL_FRAMES;
const STOP_FRAME_HEIGHT = STOP_SHEET_HEIGHT;

// 【2. 移動狀態】精靈圖參數設定 (11/2/walk.png，共11張，寬1359，高133)
const WALK_SHEET_WIDTH = 1359;
const WALK_SHEET_HEIGHT = 133;
const WALK_TOTAL_FRAMES = 11;
const WALK_FRAME_WIDTH = WALK_SHEET_WIDTH / WALK_TOTAL_FRAMES;
const WALK_FRAME_HEIGHT = WALK_SHEET_HEIGHT;

// 【3. 技能/攻擊狀態】精靈圖參數設定 (11/3/run.png，共14張，寬1199，高124)
const SKILL_SHEET_WIDTH = 1199;
const SKILL_SHEET_HEIGHT = 124;
const SKILL_TOTAL_FRAMES = 14;
const SKILL_FRAME_WIDTH = SKILL_SHEET_WIDTH / SKILL_TOTAL_FRAMES;
const SKILL_FRAME_HEIGHT = SKILL_SHEET_HEIGHT;

// 【4. 跳躍狀態】精靈圖參數設定 (11/4/jump.png，共10張，寬1075，高82)
const JUMP_SHEET_WIDTH = 1075;
const JUMP_SHEET_HEIGHT = 82;
const JUMP_TOTAL_FRAMES = 10;
const JUMP_FRAME_WIDTH = JUMP_SHEET_WIDTH / JUMP_TOTAL_FRAMES;
const JUMP_FRAME_HEIGHT = JUMP_SHEET_HEIGHT;

// 【5. 特效狀態】精靈圖參數設定 (11/5/特效.png，共4張，寬487，高112)
const EFFECT_SHEET_WIDTH = 487;
const EFFECT_SHEET_HEIGHT = 112;
const EFFECT_TOTAL_FRAMES = 4;
const EFFECT_FRAME_WIDTH = EFFECT_SHEET_WIDTH / EFFECT_TOTAL_FRAMES;
const EFFECT_FRAME_HEIGHT = EFFECT_SHEET_HEIGHT;

// 動畫播放速度（幀率 FPS）
const ANIMATION_FPS = 10;

// 角色座標與移動參數
let posX, posY;
let basePosY;            // 記錄角色原本的地面 Y 軸基準位置
let targetHeight;
let targetWidth;
let moveSpeed = 5;

// 狀態控制變數
let direction = 1;       // 角色朝向：1 表示面向右方，-1 表示面向左方
let isSkillPlaying = false; // 是否正在播放空白鍵技能動畫
let skillCurrentFrame = 0;  // 技能動畫當前播放到第幾張

// 跳躍控制變數
let isJumping = false;     // 是否正在跳躍
let jumpCurrentFrame = 0;  // 跳躍動畫當前播放到第幾張
let jumpVelocityY = 0;     // 跳躍時的垂直速度
let gravity = 0.8;         // 重力加速度

// 特效物件變數
let effect = null;

// 預載入函式：在程式啟動前優先載入所有圖片資源
function preload() {
  stopSpriteSheet = loadImage('11/1/stop.png');
  walkSpriteSheet = loadImage('11/2/walk.png');
  skillSpriteSheet = loadImage('11/3/run.png');
  jumpSpriteSheet = loadImage('11/4/jump.png');
  effectSpriteSheet = loadImage('11/5/特效.png');
}

// 初始化設定函式：網頁載入後執行一次
function setup() {
  createCanvas(windowWidth, windowHeight);
  frameRate(ANIMATION_FPS);

  // 設定角色高度為畫布高度的 1/3
  targetHeight = height / 3;
  
  // 初始位置設定在畫布 X 軸的 2/3 處，Y 軸基準貼齊底部
  posX = (width * 2) / 3;
  basePosY = height - (targetHeight / 2);
  posY = basePosY;

  // 1. 切割靜止狀態畫格
  for (let i = 0; i < STOP_TOTAL_FRAMES; i++) {
    let sx = i * STOP_FRAME_WIDTH;
    stopFrames.push(stopSpriteSheet.get(sx, 0, STOP_FRAME_WIDTH, STOP_FRAME_HEIGHT));
  }

  // 2. 切割移動狀態畫格
  for (let i = 0; i < WALK_TOTAL_FRAMES; i++) {
    let sx = i * WALK_FRAME_WIDTH;
    walkFrames.push(walkSpriteSheet.get(sx, 0, WALK_FRAME_WIDTH, WALK_FRAME_HEIGHT));
  }

  // 3. 切割技能狀態畫格
  for (let i = 0; i < SKILL_TOTAL_FRAMES; i++) {
    let sx = i * SKILL_FRAME_WIDTH;
    skillFrames.push(skillSpriteSheet.get(sx, 0, SKILL_FRAME_WIDTH, SKILL_FRAME_HEIGHT));
  }

  // 4. 切割跳躍狀態畫格
  for (let i = 0; i < JUMP_TOTAL_FRAMES; i++) {
    let sx = i * JUMP_FRAME_WIDTH;
    jumpFrames.push(jumpSpriteSheet.get(sx, 0, JUMP_FRAME_WIDTH, JUMP_FRAME_HEIGHT));
  }

  // 5. 切割特效狀態畫格
  for (let i = 0; i < EFFECT_TOTAL_FRAMES; i++) {
    let sx = i * EFFECT_FRAME_WIDTH;
    effectFrames.push(effectSpriteSheet.get(sx, 0, EFFECT_FRAME_WIDTH, EFFECT_FRAME_HEIGHT));
  }
}

// 繪圖主迴圈函式：不斷重複執行以繪製畫面與動畫
function draw() {
  // 設定背景為天空藍
  background(135, 206, 235);

  let currentFrames;
  let isMoving = false;

  // 優先判斷是否正在進行跳躍動作
  if (isJumping) {
    currentFrames = jumpFrames;
    let jumpAspectRatio = JUMP_FRAME_WIDTH / JUMP_FRAME_HEIGHT;
    targetWidth = targetHeight * jumpAspectRatio;

    // 處理跳躍的物理運動（Y軸往上拉起、受重力影響落下）
    posY += jumpVelocityY;
    jumpVelocityY += gravity;

    // 逐格推進跳躍動畫
    jumpCurrentFrame++;

    // 當跳躍落地（回到或低於原本地面位置）且動畫播放完畢時結束跳躍
    if (posY >= basePosY) {
      posY = basePosY;       // 確保回到原來的播放位置
      isJumping = false;     // 結束跳躍狀態
      jumpCurrentFrame = 0;  // 重置跳躍畫格
    }
  } 
  // 其次判斷是否正在播放空白鍵技能動畫
  else if (isSkillPlaying) {
    currentFrames = skillFrames;
    let skillAspectRatio = SKILL_FRAME_WIDTH / SKILL_FRAME_HEIGHT;
    targetWidth = targetHeight * skillAspectRatio;

    // 播放技能動畫（逐格播放）
    skillCurrentFrame++;
    
    // 當技能動畫完整播放執行過一次後
    if (skillCurrentFrame >= SKILL_TOTAL_FRAMES) {
      isSkillPlaying = false; // 結束技能狀態
      skillCurrentFrame = 0;  // 重置計數

      // 執行完後，根據當前角色面向產生特效圖片
      let effectWidth = targetHeight * (EFFECT_FRAME_WIDTH / EFFECT_FRAME_HEIGHT);
      let effectHeight = targetHeight;
      effect = {
        x: posX,
        y: basePosY, // 特效維持在地面基準高度
        vx: direction * 8, // 依據角色面向決定特效移動方向（右為正，左為負）
        width: effectWidth,
        height: effectHeight,
        dir: direction
      };
    }
  } 
  else {
    // 沒有跳躍或放技能時，檢查鍵盤左右鍵移動與狀態
    if (keyIsDown(LEFT_ARROW)) {
      direction = -1;
      isMoving = true;
      posX -= moveSpeed;
      let halfWidth = targetWidth / 2;
      // 碰到畫布最左端即停止移動
      if (posX < halfWidth) {
        posX = halfWidth;
        isMoving = false;
      }
    } else if (keyIsDown(RIGHT_ARROW)) {
      direction = 1;
      isMoving = true;
      posX += moveSpeed;
      let halfWidth = targetWidth / 2;
      // 碰到畫布最右端即停止移動
      if (posX > width - halfWidth) {
        posX = width - halfWidth;
        isMoving = false;
      }
    }

    // 決定要顯示移動精靈還是靜止精靈
    if (isMoving) {
      currentFrames = walkFrames;
      let walkAspectRatio = WALK_FRAME_WIDTH / WALK_FRAME_HEIGHT;
      targetWidth = targetHeight * walkAspectRatio;
    } else {
      currentFrames = stopFrames;
      let stopAspectRatio = STOP_FRAME_WIDTH / STOP_FRAME_HEIGHT;
      targetWidth = targetHeight * stopAspectRatio;
    }
  }

  // 繪製角色 1
  if (currentFrames && currentFrames.length > 0) {
    push();
    translate(posX, posY);
    scale(direction, 1); // 根據方向做水平鏡射轉向
    imageMode(CENTER);
    
    let frameIndex;
    if (isJumping) {
      // 確保跳躍畫格索引不超出範圍
      frameIndex = min(floor(jumpCurrentFrame / (ANIMATION_FPS / 6)), JUMP_TOTAL_FRAMES - 1);
    } else if (isSkillPlaying) {
      frameIndex = skillCurrentFrame;
    } else {
      frameIndex = floor(frameCount / (60 / ANIMATION_FPS)) % currentFrames.length;
    }

    image(currentFrames[frameIndex], 0, 0, targetWidth, targetHeight);
    pop();
  }

  // 處理與繪製特效動畫
  if (effect !== null) {
    effect.x += effect.vx; // 特效持續往對應方向移動

    // 繪製特效精靈動畫
    push();
    translate(effect.x, effect.y);
    scale(effect.dir, 1);
    imageMode(CENTER);
    let effectFrameIndex = floor(frameCount / (60 / ANIMATION_FPS)) % EFFECT_TOTAL_FRAMES;
    image(effectFrames[effectFrameIndex], 0, 0, effect.width, effect.height);
    pop();

    // 判斷特效是否移動到畫布邊端，若碰到即消失不見
    if (effect.x > width + effect.width / 2 || effect.x < -effect.width / 2) {
      effect = null; // 移除特效
    }
  }
}

// 鍵盤按下事件監聽：用來捕捉空白鍵與往上鍵的觸發
function keyPressed() {
  // 當按下空白鍵（key === ' '）且目前沒有在播放技能、也沒有在跳躍時觸發
  if (key === ' ' && !isSkillPlaying && !isJumping) {
    isSkillPlaying = true;
    skillCurrentFrame = 0;
  }
  
  // 當按下鍵盤往上鍵（UP_ARROW）且目前沒有在跳躍時觸發
  if (keyCode === UP_ARROW && !isJumping) {
    isJumping = true;
    jumpCurrentFrame = 0;
    jumpVelocityY = -14; // 給予一個向上的初速度，將角色往上拉起
  }
}

// 視窗尺寸改變監聽函式：讓畫布維持全螢幕自適應
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  basePosY = height - (targetHeight / 2);
  if (!isJumping) {
    posY = basePosY;
  }
}
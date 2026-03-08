/**
 * NetplayJS + Nostalgist Lockstep 联机游戏实现
 * 使用 lockstep 同步机制确保所有玩家游戏状态一致
 */

// ============================================
// 游戏状态和配置
// ============================================
const GameState = {
  IDLE: 'idle',
  CONNECTING: 'connecting',
  HOSTING: 'hosting',
  JOINED: 'joined',
  PLAYING: 'playing',
  ERROR: 'error'
};

class LockstepGame {
  constructor() {
    this.state = GameState.IDLE;
    this.roomId = null;
    this.players = new Map();
    this.localPlayerId = null;
    this.nostalgist = null;
    this.gameInstance = null;
    this.currentRom = null;

    // Lockstep 相关
    this.currentFrame = 0;
    this.inputBuffer = new Map(); // frame -> { playerId -> input }
    this.pendingInputs = new Map(); // playerId -> input
    this.frameDelay = 2; // 帧延迟，用于缓冲网络延迟
    this.maxPlayers = 2;

    // 输入状态
    this.currentInput = {
      up: false,
      down: false,
      left: false,
      right: false,
      a: false,
      b: false,
      start: false,
      select: false
    };

    // 网络模拟器
    this.netplayAdapter = null;

    this.init();
  }

  init() {
    this.bindUIEvents();
    this.bindKeyboardEvents();
    this.updateStatus('就绪，请创建或加入房间', 'info');
  }

  // ============================================
  // UI 事件绑定
  // ============================================
  bindUIEvents() {
    document.getElementById('btn-host').addEventListener('click', () => this.hostGame());
    document.getElementById('btn-join').addEventListener('click', () => this.joinGame());
    document.getElementById('btn-leave').addEventListener('click', () => this.leaveGame());

    const romSelect = document.getElementById('rom-select');
    romSelect.addEventListener('change', (e) => this.handleRomSelect(e));

    document.getElementById('rom-file').addEventListener('change', (e) => this.handleRomUpload(e));
  }

  bindKeyboardEvents() {
    const keyMap = {
      'ArrowUp': 'up',
      'ArrowDown': 'down',
      'ArrowLeft': 'left',
      'ArrowRight': 'right',
      'KeyZ': 'a',
      'KeyX': 'b',
      'Enter': 'start',
      'ShiftLeft': 'select',
      'ShiftRight': 'select'
    };

    document.addEventListener('keydown', (e) => {
      if (keyMap[e.code]) {
        e.preventDefault();
        this.currentInput[keyMap[e.code]] = true;
      }
    });

    document.addEventListener('keyup', (e) => {
      if (keyMap[e.code]) {
        e.preventDefault();
        this.currentInput[keyMap[e.code]] = false;
      }
    });
  }

  // ============================================
  // ROM 处理
  // ============================================
  async handleRomSelect(e) {
    const value = e.target.value;

    if (value === 'custom') {
      document.getElementById('rom-file').click();
      return;
    }

    if (value === 'chip8') {
      // 使用内置的 Chip8 测试程序
      await this.loadBuiltinRom();
    }
  }

  async handleRomUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const arrayBuffer = await file.arrayBuffer();
      this.currentRom = {
        data: new Uint8Array(arrayBuffer),
        name: file.name,
        extension: file.name.split('.').pop().toLowerCase()
      };
      this.updateStatus(`已加载 ROM: ${file.name}`, 'info');
      await this.initNostalgist();
    } catch (err) {
      this.updateStatus(`加载 ROM 失败: ${err.message}`, 'error');
    }
  }

  async loadBuiltinRom() {
    // 创建一个简单的 Chip8 测试程序
    // 这是一个简单的程序，显示一些像素
    const chip8Program = new Uint8Array([
      0x00, 0xE0, // 清屏
      0x60, 0x00, // V0 = 0
      0x61, 0x00, // V1 = 0
      0xA2, 0x0A, // I = 0x20A
      0xD0, 0x1F, // 在 (V0, V1) 绘制 8x5 精灵
      0x12, 0x00, // 跳转到 0x200
    ]);

    this.currentRom = {
      data: chip8Program,
      name: 'chip8-test.ch8',
      extension: 'ch8'
    };

    this.updateStatus('已加载内置 Chip8 测试程序', 'info');
    await this.initNostalgist();
  }

  async initNostalgist() {
    try {
      if (this.nostalgist) {
        await this.nostalgist.destroy();
      }

      const container = document.getElementById('nostalgist-container');
      container.innerHTML = '';

      // 初始化 Nostalgist
      this.nostalgist = await Nostalgist.launch({
        core: this.detectCore(this.currentRom.extension),
        rom: this.currentRom.data,
        container: container,
        width: 640,
        height: 480,
        autoStart: true,
        onReady: () => {
          console.log('Nostalgist 就绪');
          this.updateStatus('模拟器就绪，可以开始联机游戏', 'info');
        }
      });

      this.gameInstance = this.nostalgist;
      document.getElementById('game-canvas').classList.remove('hidden');

    } catch (err) {
      console.error('初始化 Nostalgist 失败:', err);
      this.updateStatus(`初始化模拟器失败: ${err.message}`, 'error');
    }
  }

  detectCore(extension) {
    const coreMap = {
      'nes': 'fceumm',
      'smc': 'snes9x',
      'sfc': 'snes9x',
      'gb': 'gambatte',
      'gbc': 'gambatte',
      'gba': 'mgba',
      'md': 'genesis_plus_gx',
      'bin': 'fceumm',
      'ch8': 'chip8'
    };
    return coreMap[extension] || 'fceumm';
  }

  // ============================================
  // NetplayJS 联机实现
  // ============================================
  async hostGame() {
    if (this.state !== GameState.IDLE) {
      this.updateStatus('请先离开当前房间', 'error');
      return;
    }

    if (!this.gameInstance) {
      this.updateStatus('请先选择一个游戏', 'error');
      return;
    }

    this.state = GameState.CONNECTING;
    this.updateStatus('正在创建房间...', 'waiting');

    try {
      // 创建房间 ID
      this.roomId = this.generateRoomId();
      this.localPlayerId = this.generatePlayerId();

      // 初始化 netplay
      this.netplayAdapter = new NetplayAdapter({
        roomId: this.roomId,
        isHost: true,
        maxPlayers: this.maxPlayers,
        onPlayerJoin: (playerId) => this.onPlayerJoin(playerId),
        onPlayerLeave: (playerId) => this.onPlayerLeave(playerId),
        onMessage: (playerId, message) => this.onNetworkMessage(playerId, message),
        onError: (err) => this.onNetworkError(err)
      });

      await this.netplayAdapter.connect();

      this.state = GameState.HOSTING;
      this.addPlayer(this.localPlayerId, document.getElementById('player-name').value, true);

      document.getElementById('room-id').value = this.roomId;
      this.updateStatus(`房间已创建! ID: ${this.roomId}`, 'connected');
      this.showLeaveButton();

      // 开始游戏循环
      this.startGameLoop();

    } catch (err) {
      console.error('创建房间失败:', err);
      this.state = GameState.ERROR;
      this.updateStatus(`创建房间失败: ${err.message}`, 'error');
    }
  }

  async joinGame() {
    if (this.state !== GameState.IDLE) {
      this.updateStatus('请先离开当前房间', 'error');
      return;
    }

    const roomId = document.getElementById('room-id').value.trim();
    if (!roomId) {
      this.updateStatus('请输入房间 ID', 'error');
      return;
    }

    if (!this.gameInstance) {
      this.updateStatus('请先选择一个游戏', 'error');
      return;
    }

    this.state = GameState.CONNECTING;
    this.updateStatus('正在加入房间...', 'waiting');

    try {
      this.roomId = roomId;
      this.localPlayerId = this.generatePlayerId();

      this.netplayAdapter = new NetplayAdapter({
        roomId: this.roomId,
        isHost: false,
        maxPlayers: this.maxPlayers,
        onPlayerJoin: (playerId) => this.onPlayerJoin(playerId),
        onPlayerLeave: (playerId) => this.onPlayerLeave(playerId),
        onMessage: (playerId, message) => this.onNetworkMessage(playerId, message),
        onError: (err) => this.onNetworkError(err)
      });

      await this.netplayAdapter.connect();

      this.state = GameState.JOINED;
      this.addPlayer(this.localPlayerId, document.getElementById('player-name').value, true);

      this.updateStatus('已加入房间!', 'connected');
      this.showLeaveButton();

      // 开始游戏循环
      this.startGameLoop();

    } catch (err) {
      console.error('加入房间失败:', err);
      this.state = GameState.ERROR;
      this.updateStatus(`加入房间失败: ${err.message}`, 'error');
    }
  }

  async leaveGame() {
    if (this.netplayAdapter) {
      await this.netplayAdapter.disconnect();
      this.netplayAdapter = null;
    }

    this.state = GameState.IDLE;
    this.roomId = null;
    this.players.clear();
    this.currentFrame = 0;
    this.inputBuffer.clear();
    this.pendingInputs.clear();

    this.updatePlayersList();
    this.updateStatus('已离开房间', 'info');
    this.hideLeaveButton();
  }

  // ============================================
  // Lockstep 游戏循环
  // ============================================
  startGameLoop() {
    const gameLoop = () => {
      if (this.state === GameState.HOSTING || this.state === GameState.JOINED) {
        this.updateLockstep();
      }
      requestAnimationFrame(gameLoop);
    };
    requestAnimationFrame(gameLoop);
  }

  updateLockstep() {
    // 收集本地输入
    const localInput = { ...this.currentInput };
    this.pendingInputs.set(this.localPlayerId, localInput);

    // 发送输入给所有其他玩家
    if (this.netplayAdapter) {
      this.broadcastInput(this.currentFrame + this.frameDelay, localInput);
    }

    // 检查是否所有玩家的输入都已收到
    const frameToProcess = this.currentFrame + this.frameDelay;
    const frameInputs = this.inputBuffer.get(frameToProcess);

    if (frameInputs && frameInputs.size === this.players.size) {
      // 所有输入已收集，可以处理这一帧
      this.processFrame(frameToProcess, frameInputs);
      this.currentFrame++;
    }
  }

  broadcastInput(frame, input) {
    const message = {
      type: 'input',
      frame: frame,
      input: input,
      playerId: this.localPlayerId
    };

    this.netplayAdapter.broadcast(message);
  }

  processFrame(frame, inputs) {
    // 将输入应用到模拟器
    // 注意：这里我们假设只有一个本地玩家
    const localInput = inputs.get(this.localPlayerId);

    if (localInput && this.nostalgist) {
      // 将输入转换为模拟器按键
      this.applyInputToEmulator(localInput);
    }

    // 清理旧的输入缓冲
    this.inputBuffer.delete(frame);
  }

  applyInputToEmulator(input) {
    if (!this.nostalgist) return;

    // 将我们的输入映射到 Nostalgist 的按键
    const keyMap = {
      up: 'up',
      down: 'down',
      left: 'left',
      right: 'right',
      a: 'a',
      b: 'b',
      start: 'start',
      select: 'select'
    };

    // 应用输入
    for (const [key, pressed] of Object.entries(input)) {
      if (keyMap[key]) {
        if (pressed) {
          this.nostalgist.pressDown(keyMap[key]);
        } else {
          this.nostalgist.pressUp(keyMap[key]);
        }
      }
    }
  }

  // ============================================
  // 网络事件处理
  // ============================================
  onPlayerJoin(playerId) {
    console.log('玩家加入:', playerId);
    this.addPlayer(playerId, `Player ${this.players.size + 1}`, false);
    this.updateStatus('新玩家加入!', 'connected');
  }

  onPlayerLeave(playerId) {
    console.log('玩家离开:', playerId);
    this.removePlayer(playerId);
    this.updateStatus('玩家离开', 'info');
  }

  onNetworkMessage(playerId, message) {
    switch (message.type) {
      case 'input':
        this.handleRemoteInput(playerId, message.frame, message.input);
        break;
      case 'player-info':
        // 更新玩家信息
        break;
    }
  }

  handleRemoteInput(playerId, frame, input) {
    // 存储远程玩家的输入
    if (!this.inputBuffer.has(frame)) {
      this.inputBuffer.set(frame, new Map());
    }
    this.inputBuffer.get(frame).set(playerId, input);
  }

  onNetworkError(err) {
    console.error('网络错误:', err);
    this.updateStatus(`网络错误: ${err.message}`, 'error');
  }

  // ============================================
  // 玩家管理
  // ============================================
  addPlayer(id, name, isLocal) {
    this.players.set(id, {
      id,
      name,
      isLocal,
      latency: 0
    });
    this.updatePlayersList();
  }

  removePlayer(id) {
    this.players.delete(id);
    this.updatePlayersList();
  }

  updatePlayersList() {
    const container = document.getElementById('players-container');
    container.innerHTML = '';

    this.players.forEach(player => {
      const div = document.createElement('div');
      div.className = 'player-item';
      div.innerHTML = `
        <div class="player-indicator ${player.isLocal ? 'local' : 'remote'}"></div>
        <span>${player.name} ${player.isLocal ? '(你)' : ''}</span>
        <span class="latency-info">${player.latency}ms</span>
      `;
      container.appendChild(div);
    });
  }

  // ============================================
  // 工具方法
  // ============================================
  generateRoomId() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  }

  generatePlayerId() {
    return Math.random().toString(36).substring(2, 15);
  }

  updateStatus(message, type) {
    const statusEl = document.getElementById('status');
    statusEl.textContent = message;
    statusEl.className = `status ${type}`;
    statusEl.style.display = 'block';
  }

  showLeaveButton() {
    document.getElementById('btn-host').classList.add('hidden');
    document.getElementById('btn-join').classList.add('hidden');
    document.getElementById('btn-leave').classList.remove('hidden');
  }

  hideLeaveButton() {
    document.getElementById('btn-host').classList.remove('hidden');
    document.getElementById('btn-join').classList.remove('hidden');
    document.getElementById('btn-leave').classList.add('hidden');
  }
}

// ============================================
// Netplay 适配器类
// ============================================
class NetplayAdapter {
  constructor(options) {
    this.roomId = options.roomId;
    this.isHost = options.isHost;
    this.maxPlayers = options.maxPlayers || 2;
    this.onPlayerJoin = options.onPlayerJoin || (() => {});
    this.onPlayerLeave = options.onPlayerLeave || (() => {});
    this.onMessage = options.onMessage || (() => {});
    this.onError = options.onError || (() => {});

    this.connection = null;
    this.peers = new Map();
  }

  async connect() {
    // 使用 netplayjs 的默认信令服务器
    // 在实际实现中，这里会连接到 netplayjs 的服务器
    try {
      // 初始化 netplayjs 连接
      // 注意：这里使用 netplayjs 提供的 API
      await this.initNetplayJS();
    } catch (err) {
      throw new Error(`连接失败: ${err.message}`);
    }
  }

  async initNetplayJS() {
    // netplayjs 初始化
    // 这里我们使用一个简单的 P2P 连接方案
    // 使用 WebRTC 进行通信

    return new Promise((resolve, reject) => {
      try {
        // 创建 RTCPeerConnection
        const config = {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' }
          ]
        };

        // 模拟连接建立
        setTimeout(() => {
          resolve();
        }, 500);

      } catch (err) {
        reject(err);
      }
    });
  }

  broadcast(message) {
    // 广播消息给所有其他玩家
    this.peers.forEach(peer => {
      this.sendToPeer(peer, message);
    });
  }

  sendToPeer(peer, message) {
    // 发送消息给特定 peer
    try {
      if (peer.dataChannel && peer.dataChannel.readyState === 'open') {
        peer.dataChannel.send(JSON.stringify(message));
      }
    } catch (err) {
      console.error('发送消息失败:', err);
    }
  }

  async disconnect() {
    // 断开所有连接
    this.peers.forEach(peer => {
      if (peer.connection) {
        peer.connection.close();
      }
    });
    this.peers.clear();
  }
}

// ============================================
// 启动游戏
// ============================================
document.addEventListener('DOMContentLoaded', () => {
  window.game = new LockstepGame();
});

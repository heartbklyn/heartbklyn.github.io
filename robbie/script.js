// Game elements
const introScreen = document.getElementById("intro-screen")
const gameScreen = document.getElementById("game-screen")
const gameBoard = document.getElementById("game-board")
const gameOverScreen = document.getElementById("game-over-screen")
const winScreen = document.getElementById("win-screen")
const pauseScreen = document.getElementById("pause-screen")
const lifeLostScreen = document.getElementById("life-lost-screen")
const livesRemainingText = document.getElementById("lives-remaining-text")
const scoreDisplay = document.getElementById("score")
const highScoreDisplay = document.getElementById("high-score")
const livesDisplay = document.getElementById("lives")
const introPacman = document.getElementById("intro-pacman")
const instructionsScreen = document.getElementById("instructions-screen")
const mobileControls = document.getElementById("mobile-controls")

// Sound elements
const startSound = document.getElementById("start-sound")
const chompSound = document.getElementById("chomp-sound")
const deathSound = document.getElementById("death-sound")
const powerPelletSound = document.getElementById("power-pellet-sound")
const eatGhostSound = document.getElementById("eat-ghost-sound")
const winSound = document.getElementById("win-sound")

// Mobile control buttons
const upButton = document.getElementById("up-btn")
const downButton = document.getElementById("down-btn")
const leftButton = document.getElementById("left-btn")
const rightButton = document.getElementById("right-btn")
const mobilePauseButton = document.getElementById("mobile-pause-btn")

// Game variables
let gameStarted = false
let gameRunning = false
let gamePaused = false
let score = 0
let highScore = 0
let lives = 3
let grid = []
let dotsRemaining = 0
let powerMode = false
let powerModeTimer = null
let animationFrameId = null
let soundEnabled = true
let gameOver = false
let firstPlay = false // Will be set based on localStorage
const debugMode = true // Enable debug mode for troubleshooting

// Game timing variables
let lastFrameTime = 0
const FRAME_RATE = 60 // Target frame rate
const FRAME_DURATION = 1000 / FRAME_RATE // Duration of one frame in ms
let accumulatedTime = 0
const GAME_SPEED = 4 // Reduced from 8 for smoother movement
const GAME_TICK = 1000 / GAME_SPEED // Duration between game logic updates in ms

// Pacman and ghost positions
const pacman = { x: 0, y: 0, direction: "right", nextDirection: "right" }
let ghosts = []

// Emoji characters
const PACMAN = {
  right: "😮",
  left: "😮",
  up: "😮",
  down: "😮",
  closed: "😗",
}
// Reduced ghost set
const GHOST = ["👻", "👹", "🤖", "👾"]
const GHOST_SCARED = "😱" // Ghosts that can be eaten
const GHOST_EATEN = "💀" // Ghosts that have been eaten and are returning
const DOT = "·"
// Food emojis for power pellets (with red glow)
const POWER_PELLET_EMOJIS = ["🍔", "🍕", "🌮", "🍟"]
const WALL = " "
const EMPTY = " "
const FRUIT = "🍒"

// Fruit emojis for bonus items (with blue glow)
const BONUS_ITEMS = ["🍒", "🍉", "🍎", "🍌"]

// Add these variables for the mouth animation and bonus items
let mouthOpen = true
let mouthAnimationInterval = null
let bonusItemTimer = null
let activeBonus = null
let lastChompTime = 0

// Initial directions for ghosts to spread out
const INITIAL_DIRECTIONS = ["up", "down", "left", "right"]

// Level design - W=wall, D=dot, P=power pellet, E=empty, G=ghost start, S=pacman start, F=fruit
// Modified to ensure all dots are reachable and fix the blocking wall
// Updated to have 4 power pellets in different quadrants and move Pacman's starting position
const LEVEL = [
  "WWWWWWWWWWWWWWWWWWWW",
  "WDDDDDDDWWDDDDDDDDDW",
  "WDWWWDWWWDDDWWWDWWWD",
  "WDWEWDWEEDDDWEWDWEWD",
  "WDDDPDDDWWWWDDDPDDDW", // Power pellets in top quadrants
  "WDWWWDWWWDDWWWDWWWDW",
  "WDDDDDDDDGGGGDDDDDDW", // Exactly 4 ghost positions in the middle
  "WWWWDWWWWWWWWWDWWWWW",
  "WDDDDDDDDWWDDDDDDDDW",
  "WDWWWDWWWDDDWWWDWWWD",
  "WDWEWDWEEDDDWEWDWEWD",
  "WDDDPDDDWWWWDDDPDDDW", // Power pellets in bottom quadrants
  "WDWWWDWWWDDWWWDWWWDW",
  "WDDDDDDDDDDDDDDDDSW", // Pacman starts at bottom right
  "WWWWWWWWWWWWWWWWWWWW",
]

// Debug function
function debug(...args) {
  if (debugMode) {
    console.log(...args)
  }
}

// Initialize the game
function init() {
  console.log("Game initializing...")

  // Load high score from local storage
  const savedHighScore = localStorage.getItem("pacmanHighScore")
  if (savedHighScore) {
    highScore = Number.parseInt(savedHighScore)
    highScoreDisplay.textContent = highScore
  }

  // Check if this is the first time playing
  const hasPlayedBefore = localStorage.getItem("pacmanHasPlayed")
  if (!hasPlayedBefore) {
    firstPlay = true
    console.log("First time player detected")
  } else {
    firstPlay = false
    console.log("Returning player detected")
  }

  // Preload audio
  preloadAudio()

  // Add event listeners
  document.addEventListener("keydown", handleKeyDown)

  // Add click event listener to start prompt - try multiple selectors
  const startPrompt = document.querySelector(".start-prompt")
  const startPromptP = document.querySelector(".start-prompt p")

  console.log("Start prompt element:", startPrompt)
  console.log("Start prompt P element:", startPromptP)

  if (startPrompt) {
    console.log("Adding click listener to start prompt div")
    startPrompt.addEventListener("click", (e) => {
      console.log("Start prompt div clicked!")
      e.preventDefault()
      e.stopPropagation()
      startGame()
    })
  }

  if (startPromptP) {
    console.log("Adding click listener to start prompt p")
    startPromptP.addEventListener("click", (e) => {
      console.log("Start prompt p clicked!")
      e.preventDefault()
      e.stopPropagation()
      startGame()
    })
  }

  // Add click event listener to close instructions button
  const closeInstructionsButton = document.getElementById("close-instructions-btn")
  if (closeInstructionsButton) {
    closeInstructionsButton.onclick = () => {
      console.log("Instructions close clicked")
      hideInstructions()
    }
  }

  // Mobile controls
  setupMobileControls()

  // Check if mobile device
  if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
    if (mobileControls) {
      mobileControls.style.display = "flex"
    }
  }

  // Start mouth animation for intro screen
  startIntroMouthAnimation()

  console.log("Game initialization complete.")
}

// Setup mobile controls
function setupMobileControls() {
  if (upButton) {
    upButton.addEventListener("touchstart", (e) => {
      e.preventDefault()
      handleDirection("up")
    })
    upButton.addEventListener("click", (e) => {
      e.preventDefault()
      handleDirection("up")
    })
  }
  if (downButton) {
    downButton.addEventListener("touchstart", (e) => {
      e.preventDefault()
      handleDirection("down")
    })
    downButton.addEventListener("click", (e) => {
      e.preventDefault()
      handleDirection("down")
    })
  }
  if (leftButton) {
    leftButton.addEventListener("touchstart", (e) => {
      e.preventDefault()
      handleDirection("left")
    })
    leftButton.addEventListener("click", (e) => {
      e.preventDefault()
      handleDirection("left")
    })
  }
  if (rightButton) {
    rightButton.addEventListener("touchstart", (e) => {
      e.preventDefault()
      handleDirection("right")
    })
    rightButton.addEventListener("click", (e) => {
      e.preventDefault()
      handleDirection("right")
    })
  }
  if (mobilePauseButton) {
    mobilePauseButton.addEventListener("touchstart", (e) => {
      e.preventDefault()
      togglePause()
    })
    mobilePauseButton.addEventListener("click", (e) => {
      e.preventDefault()
      togglePause()
    })
  }
}

// Preload audio
function preloadAudio() {
  const audioElements = [startSound, chompSound, deathSound, powerPelletSound, eatGhostSound, winSound]
  audioElements.forEach((audio) => {
    if (audio) {
      audio.load()
    }
  })
}

// Update the intro mouth animation
function startIntroMouthAnimation() {
  if (mouthAnimationInterval) clearInterval(mouthAnimationInterval)

  mouthAnimationInterval = setInterval(() => {
    mouthOpen = !mouthOpen
    if (introPacman) {
      introPacman.textContent = mouthOpen ? PACMAN.right : PACMAN.closed
    }
  }, 200)
}

// Add function to start mouth animation for game
function startGameMouthAnimation() {
  if (mouthAnimationInterval) clearInterval(mouthAnimationInterval)

  mouthAnimationInterval = setInterval(() => {
    mouthOpen = !mouthOpen
    if (gameStarted && gameRunning && !gamePaused) {
      updatePacmanAppearance()
    }
  }, 200)
}

// Add function to update Pacman's appearance
function updatePacmanAppearance() {
  const pacmanElements = grid[pacman.y][pacman.x].element.querySelectorAll(".pacman-active")
  pacmanElements.forEach((el) => {
    el.textContent = mouthOpen ? PACMAN[pacman.direction] : PACMAN.closed
  })
}

// Play sound function with throttling for chomp sounds
function playSound(sound) {
  if (!soundEnabled) return

  // Special handling for chomp sound to prevent too many overlapping sounds
  if (sound === chompSound) {
    const now = Date.now()
    if (now - lastChompTime < 150) return // Don't play chomp sounds too close together
    lastChompTime = now

    // Create a new audio element for each chomp to allow overlapping
    const tempChompSound = new Audio(chompSound.src)
    tempChompSound.volume = 0.3 // Lower volume for chomp sounds
    tempChompSound.play().catch((e) => console.log("Error playing sound:", e))
    return
  }

  // For other sounds, just play them
  if (sound) {
    sound.currentTime = 0
    sound.play().catch((e) => console.log("Error playing sound:", e))
  }
}

// Toggle sound
function toggleSound() {
  soundEnabled = !soundEnabled
  const soundToggleBtn = document.getElementById("sound-toggle-btn")
  if (soundToggleBtn) {
    soundToggleBtn.textContent = soundEnabled ? "🔊" : "🔇"
  }
}

// Start the game
function startGame() {
  console.log("Starting game...")

  // Show instructions for first-time players
  if (firstPlay) {
    console.log("Showing instructions for first-time player")
    setTimeout(() => {
      showInstructions()
    }, 500) // Small delay to let the game screen load
    firstPlay = false
    localStorage.setItem("pacmanHasPlayed", "true")
  }

  // Hide intro screen, show game screen
  introScreen.style.display = "none"
  gameScreen.style.display = "flex"
  gameOverScreen.style.display = "none"
  winScreen.style.display = "none"
  pauseScreen.style.display = "none"
  lifeLostScreen.style.display = "none"
  if (instructionsScreen) {
    instructionsScreen.style.display = "none"
  }

  // Reset game variables
  gameStarted = true
  gameRunning = true
  gamePaused = false

  // Only reset score, lives, and board if starting a completely new game
  if (gameOver || grid.length === 0) {
    score = 0
    lives = 3
    gameOver = false
    // Initialize the game board only for new games
    initializeGameBoard()
  }

  powerMode = false
  mouthOpen = true
  accumulatedTime = 0
  lastFrameTime = 0

  // Clear any existing timers
  if (powerModeTimer) clearTimeout(powerModeTimer)
  if (animationFrameId) cancelAnimationFrame(animationFrameId)
  if (bonusItemTimer) clearTimeout(bonusItemTimer)
  activeBonus = null

  // Update display
  scoreDisplay.textContent = score
  updateLives()

  // Start game mouth animation
  startGameMouthAnimation()

  // Play start sound
  playSound(startSound)

  // Start game loop using requestAnimationFrame
  lastFrameTime = performance.now()
  animationFrameId = requestAnimationFrame(gameLoop)

  // Schedule bonus items
  scheduleBonusItem()

  console.log("Game started successfully!")
}

// Pause the game
function togglePause() {
  if (!gameStarted || !gameRunning) return

  if (gamePaused) {
    // Resume game
    gamePaused = false
    pauseScreen.style.display = "none"
    lastFrameTime = performance.now() // Reset time to avoid large time jumps
    animationFrameId = requestAnimationFrame(gameLoop)
  } else {
    // Pause game
    gamePaused = true
    pauseScreen.style.display = "flex"
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId)
      animationFrameId = null
    }
  }
}

// Add function to schedule bonus items
function scheduleBonusItem() {
  const delay = 10000 + Math.random() * 15000 // 10-25 seconds

  bonusItemTimer = setTimeout(() => {
    if (gameRunning && !gamePaused) {
      placeRandomBonusItem()
    }

    // Schedule next bonus item
    scheduleBonusItem()
  }, delay)
}

// Add function to place a random bonus item
function placeRandomBonusItem() {
  // Find empty cells that aren't walls and don't have dots
  const emptyCells = []

  for (let y = 0; y < grid.length; y++) {
    for (let x = 0; x < grid[y].length; x++) {
      if (grid[y][x].type === "E" && !(y === pacman.y && x === pacman.x)) {
        emptyCells.push({ x, y })
      }
    }
  }

  if (emptyCells.length > 0) {
    // Remove existing bonus item if there is one
    if (activeBonus) {
      grid[activeBonus.y][activeBonus.x].element.textContent = ""
      grid[activeBonus.y][activeBonus.x].element.classList.remove("bonus-item")
      grid[activeBonus.y][activeBonus.x].type = "E"
    }

    // Place new bonus item
    const randomCell = emptyCells[Math.floor(Math.random() * emptyCells.length)]
    const bonusType = BONUS_ITEMS[Math.floor(Math.random() * BONUS_ITEMS.length)]

    grid[randomCell.y][randomCell.x].element.textContent = bonusType
    grid[randomCell.y][randomCell.x].element.classList.add("bonus-item")
    grid[randomCell.y][randomCell.x].type = "B" // Mark as bonus

    activeBonus = {
      x: randomCell.x,
      y: randomCell.y,
      type: bonusType,
    }

    // Remove bonus item after a while if not collected
    setTimeout(() => {
      if (activeBonus && activeBonus.x === randomCell.x && activeBonus.y === randomCell.y) {
        grid[randomCell.y][randomCell.x].element.textContent = ""
        grid[randomCell.y][randomCell.x].element.classList.remove("bonus-item")
        grid[randomCell.y][randomCell.x].type = "E"
        activeBonus = null
      }
    }, 8000) // 8 seconds
  }
}

// Initialize the game board
function initializeGameBoard() {
  // Clear game board
  gameBoard.innerHTML = ""
  grid = []
  ghosts = []
  dotsRemaining = 0

  // Set grid template
  gameBoard.style.gridTemplateColumns = `repeat(${LEVEL[0].length}, 1fr)`
  gameBoard.style.gridTemplateRows = `repeat(${LEVEL.length}, 1fr)`

  // Count how many ghost positions we have
  const ghostPositions = []
  for (let y = 0; y < LEVEL.length; y++) {
    for (let x = 0; x < LEVEL[y].length; x++) {
      if (LEVEL[y][x] === "G") {
        ghostPositions.push({ x, y })
      }
    }
  }

  // Create grid based on level design
  for (let y = 0; y < LEVEL.length; y++) {
    const row = LEVEL[y]
    grid[y] = []

    for (let x = 0; x < row.length; x++) {
      const cell = document.createElement("div")
      cell.className = "cell"
      cell.dataset.x = x
      cell.dataset.y = y
      gameBoard.appendChild(cell)

      const cellType = row[x]
      grid[y][x] = { type: cellType, element: cell }

      switch (cellType) {
        case "W":
          cell.classList.add("wall")
          break
        case "D":
          cell.classList.add("dot")
          cell.textContent = DOT
          dotsRemaining++
          break
        case "P":
          cell.classList.add("power-pellet")
          // Use a random food emoji for power pellets
          const randomFoodEmoji = POWER_PELLET_EMOJIS[Math.floor(Math.random() * POWER_PELLET_EMOJIS.length)]
          cell.textContent = randomFoodEmoji
          dotsRemaining++
          break
        case "S":
          pacman.x = x
          pacman.y = y
          pacman.direction = "right"
          pacman.nextDirection = "right"
          const pacmanElement = document.createElement("span")
          pacmanElement.textContent = PACMAN[pacman.direction]
          pacmanElement.className = "pacman-active"
          cell.appendChild(pacmanElement)
          break
        case "G":
          // Only create a ghost if we haven't reached 4 ghosts yet
          if (ghosts.length < 4) {
            const ghostIndex = ghosts.length
            const ghost = {
              x: x,
              y: y,
              startX: x,
              startY: y,
              direction: INITIAL_DIRECTIONS[ghostIndex], // Assign initial direction to spread out
              emoji: GHOST[ghostIndex],
              state: "normal", // "normal", "scared", "eaten"
              eatenTimer: 0,
              id: ghostIndex,
              element: null, // Will store the DOM element
              distanceToPacman: 0, // Track distance to Pacman
              isClosest: false, // Flag to track if this ghost is closest to Pacman
              lastDirection: INITIAL_DIRECTIONS[ghostIndex], // Track last direction to prevent immediate reversals
            }
            ghosts.push(ghost)
            const ghostElement = document.createElement("span")
            ghostElement.textContent = ghost.emoji
            ghostElement.className = "ghost"
            ghostElement.dataset.ghostId = ghost.id
            ghostElement.dataset.state = ghost.state
            cell.appendChild(ghostElement)
            ghost.element = ghostElement // Store reference to the element
          }
          break
        case "F":
          cell.classList.add("fruit")
          cell.textContent = FRUIT
          break
      }
    }
  }

  // Ensure we have exactly 4 ghosts
  if (ghosts.length < 4 && ghostPositions.length > 0) {
    // If we have fewer than 4 ghosts but have positions, add more
    while (ghosts.length < 4 && ghostPositions.length > 0) {
      const pos = ghostPositions[ghosts.length % ghostPositions.length]
      const ghostIndex = ghosts.length
      const ghost = {
        x: pos.x,
        y: pos.y,
        startX: pos.x,
        startY: pos.y,
        direction: INITIAL_DIRECTIONS[ghostIndex], // Assign initial direction to spread out
        emoji: GHOST[ghostIndex],
        state: "normal", // "normal", "scared", "eaten"
        eatenTimer: 0,
        id: ghostIndex,
        element: null, // Will store the DOM element
        distanceToPacman: 0, // Track distance to Pacman
        isClosest: false, // Flag to track if this ghost is closest to Pacman
        lastDirection: INITIAL_DIRECTIONS[ghostIndex], // Track last direction to prevent immediate reversals
      }
      ghosts.push(ghost)
      const ghostElement = document.createElement("span")
      ghostElement.textContent = ghost.emoji
      ghostElement.className = "ghost"
      ghostElement.dataset.ghostId = ghost.id
      ghostElement.dataset.state = ghost.state
      grid[pos.y][pos.x].element.appendChild(ghostElement)
      ghost.element = ghostElement // Store reference to the element
    }
  }

  // Log initial positions
  debug("Initial Pacman position:", pacman.x, pacman.y)
  ghosts.forEach((ghost) => {
    debug(`Initial Ghost ${ghost.id} position:`, ghost.x, ghost.y, "State:", ghost.state)
  })
}

// Game loop using requestAnimationFrame for smooth animation
function gameLoop(timestamp) {
  if (!gameRunning || gamePaused) return

  // Calculate time since last frame
  const deltaTime = timestamp - lastFrameTime
  lastFrameTime = timestamp

  // Accumulate time since last update
  accumulatedTime += deltaTime

  // Update game logic at fixed intervals
  while (accumulatedTime >= GAME_TICK) {
    updateGameLogic()
    accumulatedTime -= GAME_TICK
  }

  // Request next frame
  animationFrameId = requestAnimationFrame(gameLoop)
}

// Update game logic at fixed intervals
function updateGameLogic() {
  // Update ghost distances to Pacman and determine which is closest
  updateGhostDistances()

  // Move characters
  movePacman()
  moveGhosts()

  // Check for collisions after moving
  checkCollisions()

  // Check win condition
  if (dotsRemaining === 0) {
    winGame()
  }
}

// Calculate distance between two points
function calculateDistance(x1, y1, x2, y2) {
  return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2)
}

// Update ghost distances to Pacman and determine which is closest
function updateGhostDistances() {
  // Calculate distance for each ghost
  ghosts.forEach((ghost) => {
    ghost.distanceToPacman = calculateDistance(ghost.x, ghost.y, pacman.x, pacman.x)
    ghost.isClosest = false // Reset closest flag
  })

  // Sort ghosts by distance to Pacman (ascending)
  const sortedGhosts = [...ghosts].sort((a, b) => a.distanceToPacman - b.distanceToPacman)

  // Mark the closest ghost
  if (sortedGhosts.length > 0) {
    // Only mark normal ghosts as closest (not eaten or scared)
    const closestNormalGhost = sortedGhosts.find((g) => g.state === "normal")
    if (closestNormalGhost) {
      closestNormalGhost.isClosest = true
    }
  }
}

// Move Pacman
function movePacman() {
  // Try to change direction if a new direction is queued
  if (pacman.nextDirection !== pacman.direction) {
    // Calculate position for the next direction
    let testX = pacman.x
    let testY = pacman.y

    switch (pacman.nextDirection) {
      case "right":
        testX = (pacman.x + 1) % LEVEL[0].length
        break
      case "left":
        testX = (pacman.x - 1 + LEVEL[0].length) % LEVEL[0].length
        break
      case "up":
        testY = (pacman.y - 1 + LEVEL.length) % LEVEL.length
        break
      case "down":
        testY = (pacman.y + 1) % LEVEL.length
        break
    }

    // If the new direction doesn't hit a wall, change direction
    if (grid[testY][testX].type !== "W") {
      pacman.direction = pacman.nextDirection
    }
  }

  // Calculate new position based on current direction
  let newX = pacman.x
  let newY = pacman.y

  switch (pacman.direction) {
    case "right":
      newX = (pacman.x + 1) % LEVEL[0].length
      break
    case "left":
      newX = (pacman.x - 1 + LEVEL[0].length) % LEVEL[0].length
      break
    case "up":
      newY = (pacman.y - 1 + LEVEL.length) % LEVEL.length
      break
    case "down":
      newY = (pacman.y + 1) % LEVEL.length
      break
  }

  // Check if new position is a wall
  if (grid[newY][newX].type === "W") {
    // Stay in place if hitting a wall
    return
  }

  // Remove Pacman from current position
  const pacmanElements = grid[pacman.y][pacman.x].element.querySelectorAll(".pacman-active")
  pacmanElements.forEach((el) => el.remove())

  // Move to new position
  pacman.x = newX
  pacman.y = newY

  // Check if dot collected
  if (grid[newY][newX].type === "D") {
    grid[newY][newX].type = "E"
    grid[newY][newX].element.textContent = ""
    grid[newY][newX].element.classList.remove("dot")
    dotsRemaining--
    score += 10
    updateScore()
    playSound(chompSound)
  }

  // Check if power pellet collected
  if (grid[newY][newX].type === "P") {
    grid[newY][newX].type = "E"
    grid[newY][newX].element.textContent = ""
    grid[newY][newX].element.classList.remove("power-pellet")
    dotsRemaining--
    score += 50
    updateScore()
    activatePowerMode()
    playSound(powerPelletSound)
  }

  // Check if fruit collected
  if (grid[newY][newX].type === "F") {
    grid[newY][newX].type = "E"
    grid[newY][newX].element.textContent = ""
    grid[newY][newX].element.classList.remove("fruit")
    score += 100
    updateScore()
    playSound(powerPelletSound)
  }

  // Check if bonus item collected
  if (grid[newY][newX].type === "B") {
    grid[newY][newX].type = "E"
    grid[newY][newX].element.textContent = ""
    grid[newY][newX].element.classList.remove("bonus-item")
    score += 200
    updateScore()
    activeBonus = null
    playSound(powerPelletSound)
  }

  // Add Pacman to new position
  const pacmanElement = document.createElement("span")
  pacmanElement.textContent = mouthOpen ? PACMAN[pacman.direction] : PACMAN.closed
  pacmanElement.className = "pacman-active"
  grid[pacman.y][pacman.x].element.appendChild(pacmanElement)

  // Log Pacman's position after moving
  debug("Pacman moved to:", pacman.x, pacman.y)
}

// Get valid moves from a position
function getValidMoves(x, y) {
  const validMoves = []
  const directions = ["up", "down", "left", "right"]

  directions.forEach((dir) => {
    let newX = x
    let newY = y

    switch (dir) {
      case "right":
        newX = (x + 1) % LEVEL[0].length
        break
      case "left":
        newX = (x - 1 + LEVEL[0].length) % LEVEL[0].length
        break
      case "up":
        newY = (y - 1 + LEVEL.length) % LEVEL.length
        break
      case "down":
        newY = (y + 1) % LEVEL.length
        break
    }

    if (grid[newY][newX].type !== "W") {
      validMoves.push({ x: newX, y: newY, direction: dir })
    }
  })

  return validMoves
}

// Get opposite direction
function getOppositeDirection(direction) {
  switch (direction) {
    case "up":
      return "down"
    case "down":
      return "up"
    case "left":
      return "right"
    case "right":
      return "left"
    default:
      return direction
  }
}

// Check if a position is occupied by a ghost
function isPositionOccupiedByGhost(x, y, excludeGhostId = -1) {
  return ghosts.some((ghost) => ghost.id !== excludeGhostId && ghost.x === x && ghost.y === y)
}

// Calculate ghost paths with improved AI for smoother movement
function calculateGhostPaths() {
  // Create a map of all planned ghost moves
  const plannedMoves = new Map()

  // Process ghosts in order: eaten first, then scared, then normal
  const eatenGhosts = ghosts.filter((g) => g.state === "eaten")
  const scaredGhosts = ghosts.filter((g) => g.state === "scared")
  const normalGhosts = ghosts.filter((g) => g.state === "normal")

  // Process all ghosts in priority order
  const orderedGhosts = [...eatenGhosts, ...scaredGhosts, ...normalGhosts]

  // Calculate and store the best move for each ghost
  orderedGhosts.forEach((ghost) => {
    const validMoves = getValidMoves(ghost.x, ghost.y)

    // Filter out moves that would cause direct collisions
    const safeValidMoves = validMoves.filter((move) => {
      // Check if another ghost is planning to move to this position
      const moveKey = `${move.x},${move.y}`
      if (plannedMoves.has(moveKey)) {
        return false
      }

      // Check if this move would cause a direct swap with another ghost
      for (const otherGhost of ghosts) {
        if (otherGhost.id !== ghost.id && otherGhost.x === move.x && otherGhost.y === move.y) {
          return false
        }
      }

      return true
    })

    // If no safe moves, allow any valid move
    const movesToConsider = safeValidMoves.length > 0 ? safeValidMoves : validMoves

    // Choose the best move based on ghost state
    let bestMove = null

    if (ghost.state === "eaten") {
      // Eaten ghosts return to their start position
      bestMove = movesToConsider.reduce((best, move) => {
        const distToStart = calculateDistance(move.x, move.y, ghost.startX, ghost.startY)
        if (!best || distToStart < best.distToStart) {
          return { ...move, distToStart }
        }
        return best
      }, null)
    } else if (ghost.state === "scared") {
      // Scared ghosts flee from Pacman - strongly prefer continuing straight
      const currentDirMove = movesToConsider.find((move) => move.direction === ghost.direction)

      if (currentDirMove && Math.random() < 0.8) {
        // 80% chance to continue straight when scared
        bestMove = currentDirMove
      } else {
        // Find move that maximizes distance from Pacman
        bestMove = movesToConsider.reduce((best, move) => {
          const distToPacman = calculateDistance(move.x, move.y, pacman.x, pacman.y)
          if (!best || distToPacman > best.distToPacman) {
            return { ...move, distToPacman }
          }
          return best
        }, null)
      }
    } else {
      // Normal ghosts - much smoother movement
      const currentDirMove = movesToConsider.find((move) => move.direction === ghost.direction)

      if (ghost.isClosest) {
        // Closest ghost pursues Pacman but still prefers smooth movement
        if (currentDirMove && Math.random() < 0.6) {
          // 60% chance to continue straight even when chasing
          const currentDirDist = calculateDistance(currentDirMove.x, currentDirMove.y, pacman.x, pacman.y)
          const currentDist = calculateDistance(ghost.x, ghost.y, pacman.x, pacman.y)

          // Only continue if we're not moving away from Pacman
          if (currentDirDist <= currentDist + 2) {
            bestMove = currentDirMove
          }
        }

        if (!bestMove) {
          // Choose move that minimizes distance to Pacman
          bestMove = movesToConsider.reduce((best, move) => {
            const distToPacman = calculateDistance(move.x, move.y, pacman.x, pacman.y)

            if (!best || distToPacman < best.distToPacman) {
              return { ...move, distToPacman }
            }
            return best
          }, null)
        }
      } else {
        // Non-closest ghosts: strongly prefer continuing straight for smooth movement
        if (currentDirMove && Math.random() < 0.85) {
          // 85% chance to continue straight
          bestMove = currentDirMove
        } else {
          // Only change direction at intersections or when forced
          // Filter out immediate reversals
          const nonReversingMoves = movesToConsider.filter(
            (move) => move.direction !== getOppositeDirection(ghost.lastDirection),
          )

          const finalMoves = nonReversingMoves.length > 0 ? nonReversingMoves : movesToConsider

          // Prefer moves that lead generally towards Pacman but not aggressively
          const scoredMoves = finalMoves.map((move) => {
            const distToPacman = calculateDistance(move.x, move.y, pacman.x, pacman.y)
            const maxDist = Math.sqrt(LEVEL[0].length * LEVEL[0].length + LEVEL.length * LEVEL.length)

            // Very slight bias towards Pacman (much less aggressive)
            const pacmanBias = 1 - (distToPacman / maxDist) * 0.1

            // Strong bias for continuing straight
            const continueBias = move.direction === ghost.direction ? 2.0 : 1.0

            return { ...move, score: pacmanBias * continueBias }
          })

          // Choose based on weighted probability
          const totalScore = scoredMoves.reduce((sum, move) => sum + move.score, 0)
          let random = Math.random() * totalScore

          for (const move of scoredMoves) {
            random -= move.score
            if (random <= 0) {
              bestMove = move
              break
            }
          }

          // Fallback
          if (!bestMove) {
            bestMove = finalMoves[0]
          }
        }
      }
    }

    // If we found a valid move, mark this position as planned
    if (bestMove) {
      plannedMoves.set(`${bestMove.x},${bestMove.y}`, ghost.id)
      ghost.nextMove = bestMove
    } else {
      // No valid move found, stay in place
      ghost.nextMove = { x: ghost.x, y: ghost.y, direction: ghost.direction }
    }
  })

  return plannedMoves
}

// Move ghosts with completely new AI that prioritizes avoiding crossing paths
function moveGhosts() {
  // Calculate all ghost paths to avoid crossing
  calculateGhostPaths()

  // Execute the planned moves for each ghost
  ghosts.forEach((ghost) => {
    // Remove ghost from current cell
    if (ghost.element && ghost.element.parentNode) {
      ghost.element.remove()
    }

    // Apply the planned move
    if (ghost.nextMove) {
      ghost.lastDirection = ghost.direction
      ghost.x = ghost.nextMove.x
      ghost.y = ghost.nextMove.y
      ghost.direction = ghost.nextMove.direction
    }

    // Handle eaten ghosts - they should return to normal after timer expires
    if (ghost.state === "eaten") {
      ghost.eatenTimer--
      if (ghost.eatenTimer <= 0) {
        ghost.state = "normal"
        debug(`Ghost ${ghost.id} timer expired, returning to normal state`)
      }
    }

    // Create or update ghost's visual representation
    const ghostElement = document.createElement("span")
    if (ghost.state === "scared") {
      ghostElement.textContent = GHOST_SCARED
    } else if (ghost.state === "eaten") {
      ghostElement.textContent = GHOST_EATEN // 💀 skull emoji
    } else {
      ghostElement.textContent = ghost.emoji
    }
    ghostElement.className = "ghost"
    ghostElement.dataset.ghostId = ghost.id
    ghostElement.dataset.state = ghost.state
    ghostElement.dataset.isClosest = ghost.isClosest ? "true" : "false"
    grid[ghost.y][ghost.x].element.appendChild(ghostElement)
    ghost.element = ghostElement // Update the reference

    // Log ghost position after moving
    debug(`Ghost ${ghost.id} moved to:`, ghost.x, ghost.y, "State:", ghost.state, "IsClosest:", ghost.isClosest)
  })
}

// Fix the checkCollisions function to ensure Pacman can eat scared ghosts
function checkCollisions() {
  debug("Checking collisions...")
  debug("Pacman position:", pacman.x, pacman.y)
  debug("Power mode:", powerMode)

  // Check each ghost for collision with Pacman
  for (let i = 0; i < ghosts.length; i++) {
    const ghost = ghosts[i]

    // Check for exact position match
    if (ghost.x === pacman.x && ghost.y === pacman.y) {
      debug(`COLLISION DETECTED with ghost ${ghost.id}! Ghost state: ${ghost.state}`)

      if (ghost.state === "scared" && powerMode) {
        // Pacman eats ghost in power mode
        debug(`Pacman eats scared ghost ${ghost.id}!`)
        score += 200
        updateScore()
        ghost.state = "eaten"
        ghost.eatenTimer = 30 // Ghost will be eaten for 30 game loops (longer duration)
        playSound(eatGhostSound)

        // Update ghost appearance immediately to skull
        if (ghost.element) {
          ghost.element.textContent = GHOST_EATEN // This should be 💀
          ghost.element.dataset.state = "eaten"
        }

        debug(`Ghost ${ghost.id} is now eaten (skull state)`)
      } else if (ghost.state === "normal") {
        // Ghost catches Pacman
        debug(`Normal ghost ${ghost.id} catches Pacman!`)
        loseLife()
        return // Exit after losing a life
      }
      // Note: We don't do anything if the ghost is already in "eaten" state
    }
  }
}

// Lose a life
function loseLife() {
  debug("Losing a life!")
  lives--
  updateLives()

  // Stop the game loop
  gameRunning = false
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId)
    animationFrameId = null
  }

  // Play death sound
  playSound(deathSound)

  if (lives <= 0) {
    // Game over
    setTimeout(() => {
      endGame()
    }, 2000) // Wait for death animation/sound
  } else {
    // Show life lost screen
    livesRemainingText.textContent = `LIVES REMAINING: ${lives}`
    lifeLostScreen.style.display = "flex"

    // Reset positions and continue after a delay
    setTimeout(() => {
      lifeLostScreen.style.display = "none"
      resetPositionsOnly() // Changed from resetPositions()

      // Resume the game after a short delay
      setTimeout(() => {
        gameRunning = true
        lastFrameTime = performance.now() // Reset time to avoid large time jumps
        animationFrameId = requestAnimationFrame(gameLoop)
      }, 1000)
    }, 3000) // Show life lost screen for 3 seconds
  }
}

// Reset positions after losing a life (without reinitializing the board)
function resetPositionsOnly() {
  // Reset Pacman
  const pacmanElements = grid[pacman.y][pacman.x].element.querySelectorAll(".pacman-active")
  pacmanElements.forEach((el) => el.remove())

  // Find the start position for Pacman
  for (let y = 0; y < LEVEL.length; y++) {
    for (let x = 0; x < LEVEL[y].length; x++) {
      if (LEVEL[y][x] === "S") {
        pacman.x = x
        pacman.y = y
        pacman.direction = "right"
        pacman.nextDirection = "right"
        break
      }
    }
  }

  // Reset ghosts to middle positions
  ghosts.forEach((ghost) => {
    // Remove ghost element from current position
    if (ghost.element && ghost.element.parentNode) {
      ghost.element.remove()
    }

    // Find middle positions
    const middlePositions = []
    for (let y = 0; y < LEVEL.length; y++) {
      for (let x = 0; x < LEVEL[y].length; x++) {
        if (LEVEL[y][x] === "G") {
          middlePositions.push({ x, y })
        }
      }
    }

    if (middlePositions.length > 0) {
      const randomMiddle = middlePositions[Math.floor(Math.random() * middlePositions.length)]
      ghost.x = randomMiddle.x
      ghost.y = randomMiddle.y
    } else {
      // Fallback to original start position
      ghost.x = ghost.startX
      ghost.y = ghost.startY
    }

    ghost.direction = INITIAL_DIRECTIONS[ghost.id]
    ghost.lastDirection = INITIAL_DIRECTIONS[ghost.id]
    ghost.state = "normal"
    ghost.eatenTimer = 0
    ghost.isClosest = false
  })

  // Update display
  const pacmanElement = document.createElement("span")
  pacmanElement.textContent = PACMAN[pacman.direction]
  pacmanElement.className = "pacman-active"
  grid[pacman.y][pacman.x].element.appendChild(pacmanElement)

  ghosts.forEach((ghost) => {
    const ghostElement = document.createElement("span")
    ghostElement.textContent = ghost.emoji
    ghostElement.className = "ghost"
    ghostElement.dataset.ghostId = ghost.id
    ghostElement.dataset.state = ghost.state
    grid[ghost.y][ghost.x].element.appendChild(ghostElement)
    ghost.element = ghostElement // Update the reference
  })
}

// Activate power mode
function activatePowerMode() {
  powerMode = true
  debug("Power mode activated!")

  // Immediately update all ghosts to scared state (but not eaten ones)
  ghosts.forEach((ghost) => {
    if (ghost.state === "normal") {
      ghost.state = "scared"
      debug(`Ghost ${ghost.id} is now scared due to power mode activation`)

      // Update ghost appearance immediately
      if (ghost.element) {
        ghost.element.textContent = GHOST_SCARED
        ghost.element.dataset.state = "scared"
      }
    }
  })

  // Clear existing timer if there is one
  if (powerModeTimer) {
    clearTimeout(powerModeTimer)
  }

  // Set timer to end power mode
  powerModeTimer = setTimeout(() => {
    powerMode = false
    debug("Power mode deactivated!")

    // Update ghosts back to normal state (but not eaten ones)
    ghosts.forEach((ghost) => {
      if (ghost.state === "scared") {
        ghost.state = "normal"
        debug(`Ghost ${ghost.id} is now normal due to power mode deactivation`)

        // Update ghost appearance immediately
        if (ghost.element) {
          ghost.element.textContent = ghost.emoji
          ghost.element.dataset.state = "normal"
        }
      }
      // Don't change eaten ghosts - they should continue being eaten until their timer expires
    })
  }, 10000) // 10 seconds of power mode
}

// Update score display
function updateScore() {
  scoreDisplay.textContent = score

  // Update high score if needed
  if (score > highScore) {
    highScore = score
    highScoreDisplay.textContent = highScore
    localStorage.setItem("pacmanHighScore", highScore)
  }
}

// Update lives display
function updateLives() {
  livesDisplay.textContent = ""
  for (let i = 0; i < lives; i++) {
    livesDisplay.textContent += "😮 "
  }
}

// Game over
function endGame() {
  gameRunning = false
  gameOver = true // Set game over flag

  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId)
    animationFrameId = null
  }
  clearInterval(mouthAnimationInterval)
  clearTimeout(bonusItemTimer)

  // Update final score
  const finalScoreElement = document.getElementById("final-score")
  if (finalScoreElement) {
    finalScoreElement.textContent = score
  }

  // Show game over screen
  gameOverScreen.style.display = "flex"
}

// Win game
function winGame() {
  gameRunning = false
  gameOver = true // Set game over flag

  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId)
    animationFrameId = null
  }
  clearInterval(mouthAnimationInterval)
  clearTimeout(bonusItemTimer)

  // Play win sound
  playSound(winSound)

  // Show win screen
  winScreen.style.display = "flex"
}

// Handle keyboard input
function handleKeyDown(e) {
  console.log("Key pressed:", e.key)

  // Start game with Enter
  if (!gameStarted && (e.key === "Enter" || e.key === " ")) {
    console.log("Start key pressed - starting game")
    startGame()
    return
  }

  // Restart game with Enter after game over or win
  if (!gameRunning && gameStarted && (e.key === "Enter" || e.key === " ")) {
    console.log("Restart key pressed")
    startGame()
    return
  }

  // Toggle pause with Space
  if (e.key === " " && gameStarted && gameRunning) {
    console.log("Pause key pressed")
    e.preventDefault() // Prevent scrolling with spacebar
    togglePause()
    return
  }

  // Toggle sound with 'M' key
  if (e.key === "m" || e.key === "M") {
    console.log("Sound toggle key pressed")
    toggleSound()
    return
  }

  // Show instructions with 'I' key
  if (e.key === "i" || e.key === "I") {
    console.log("Instructions key pressed")
    showInstructions()
    return
  }

  // Handle direction keys only when game is running and not paused
  if (gameRunning && !gamePaused) {
    const newDirection = getDirectionFromKey(e.key)
    if (newDirection) {
      console.log("Direction key pressed:", newDirection)
      pacman.nextDirection = newDirection
    }
  }
}

// Get direction from key
function getDirectionFromKey(key) {
  switch (key) {
    case "ArrowRight":
    case "d":
    case "D":
      return "right"
    case "ArrowLeft":
    case "a":
    case "A":
      return "left"
    case "ArrowUp":
    case "w":
    case "W":
      return "up"
    case "ArrowDown":
    case "s":
    case "S":
      return "down"
    default:
      return null
  }
}

// Handle direction change
function handleDirection(direction) {
  if (direction && gameRunning && !gamePaused) {
    pacman.nextDirection = direction
  }
}

// Show instructions
function showInstructions() {
  if (instructionsScreen) {
    instructionsScreen.style.display = "flex"
  }
}

// Hide instructions
function hideInstructions() {
  if (instructionsScreen) {
    instructionsScreen.style.display = "none"
  }
}

// Initialize the game when the page loads
window.addEventListener("load", init)

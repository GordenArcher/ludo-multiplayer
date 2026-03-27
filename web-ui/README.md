
# 🎮 Ludo Multiplayer (Web)

A modular web-based Ludo game built with React, designed for seamless embedding into platforms.  
Supports single-player and local multiplayer gameplay, with a scalable architecture ready for real-time multiplayer.

---

## Overview

This project is a modern implementation of the classic Ludo game, built with a focus on:

- Clean architecture
- Scalable game engine design
- Mobile-first user experience
- Future-ready multiplayer integration

It is designed to be embedded into third-party platforms (e.g. food ordering apps) to improve user engagement while waiting.

---

## Features

### Core Gameplay
- Classic Ludo rules
- Dice rolling system (1–6)
- Token movement with path-based logic
- Capturing opponents
- Safe zones
- Home path & win condition

### Game Modes
- Single Player (local)
- Local Multiplayer (same device / pass-and-play)

### Architecture
- Decoupled game engine (pure JavaScript)
- Action-based state updates
- Deterministic game logic
- Backend-ready design for multiplayer

### User Experience
- Mobile-friendly interface
- Turn-based interaction
- Player prompts (pass-and-play)
- Smooth and responsive UI

---

## Architecture

The application is built using a layered approach:

```

UI (React)
↓
Game Engine (Logic)
↓
Game State (Single Source of Truth)

````

### Key Principles:
- Game logic is independent of UI
- State is serializable (JSON)
- Designed for easy migration to backend (WebSockets)

---

## Game Engine Design

The engine uses an action-based system:

```js
{ type: "ROLL_DICE", playerId: "p1" }
{ type: "MOVE_TOKEN", playerId: "p1", tokenId: 2 }
````

All game updates are processed through a central function:

```js
applyAction(state, action)
```

This makes it easy to:

* Run locally (frontend)
* Move logic to backend later
* Sync state across multiple players

---

## Movement System

* Board represented as a **global path array**
* Each token tracks:

  * `position` (index on path)
  * `steps` (progress)
* Player-specific home paths handled separately

This avoids complex directional logic and simplifies gameplay calculations.

---

## Embedding Support

The game is designed to be embedded into external platforms using:

* `iframe` integration
* Future support for SDK / event communication (`postMessage`)

Example:

```html
<iframe src="https://domain.com/ludo"></iframe>
```

---

## Future Enhancements

* Online multiplayer (WebSockets)
* Invite system (join via link)
* AI opponents
* Custom branding for different platforms
* Reward integration (e.g. discounts, coupons)
* Sound effects & animations

---

## Tech Stack

* **Frontend:** React
* **Game Engine:** Vanilla JavaScript (modular)
* **State Management:** React state (upgrade-ready)
* **Multiplayer (planned):** WebSockets / Django Channels

---

## Getting Started

```bash
# Clone the repo
git clone https://github.com/GordenArcher/ludo-multiplayer.git
# Install dependencies
npm install

# Start development server
npm run dev
```

---

## Vision

This project is part of a larger vision to build:

> A lightweight, embeddable mini-game platform that businesses can integrate to improve user engagement.

---

## Contributing

Contributions, ideas, and feedback are welcome.

---

## License

MIT License

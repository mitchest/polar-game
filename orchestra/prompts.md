We've made a small 2D browser game that complements a school project on the polar
regions. It supports the *Life in the Freezers* presentation (`Life in the Freezers.pptx`). It's designed to play equally well on a computer (keyboard) and a touch-only iPad or phone. The general flow is 1. Pick a region, beat the challenge, and you're rewarded with an animated screen of polar facts. Read and understand the full plan and tech stack (`orchestra/full_game_plan.md`) as well as the intended audience and usage (`README.md`). 

Now we want to make some changes. See Github Issue #5 - read that whole issue and implement the requested new level.




Gameplay fixes:
- Arctic:
- Antarctic:

UI/UX fixes:
- 

---
Some changes:
- For the arctic: polar bear head should be more naturally attached to the neck/body, less like a carnival machine and get rid of the lump under its head across the game and facts etc.
- For the Antarctic: make the seals head more realistic across the game and facts etc.

---

Now we want to implement different difficulty levels, where the difficulty is the speed of either the polar bear or the leopard seals. Let's start with "easy", "hard" and "hectic".

--- 

Now we want to update the graphics - it's very simple at present. We want it to start looking a little more realistic/life-like, so we'll have to move away from the basic png/vector style build and rendering. Here's the main tasks:
- In the arctic: 1. the fox should be an arctic fox, which is white and light blue; 2. polar bear should be more of a realistic full body not just a cartoon head; 3. the fish should be like a cod
- In the antarctic: 1. the penguin should look like a real penguin on it's belly; 2. the seals should look like a real angry leopard seal; make the ice holes more craggy.

Before we make changes, let me know what you plan is for making and rendering graphics.

---

Some other fixes to implement:
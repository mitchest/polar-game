We've made a small 2D browser game that complements a school project on the polar
regions. It's reached by scanning a QR code on the final slide of the *Life in
the Freezers* presentation (`Life in the Freezers.pptx`), so it's designed to play equally well on a computer (keyboard) and a touch-only iPad or phone. The general flow is 1. Pick a region, beat the challenge, and you're rewarded with an animated screen of polar facts. Read and understand the full plan and tech stack (`orchestra/full_game_plan.md`) as well as the intended audience and usage (`README.md`). 

Now we want to make some changes.

Gameplay fixes:
- Arctic: make the polar bear vision cone longer and add 3-4 more snow mounds around the periphery, so it's not as easy to just go around the outside; make the fox move 10% faster; make it so if you touch the polar bear you're caught; make the fish a little larger
- Antarctic: make the seals 10% slower; make the whole track length 50% of it's current length

UI/UX fixes:
- Add a link to the code/repo on the main menu ("https://github.com/mitchest/polar-game")

---

Now we want to implement different difficulty levels, where the difficulty is the speed of either the polar bear or the leopard seals. Let's start with "easy", "hard" and "hectic".

--- 

Now we want to update the graphics - it's very simple at present. We want it to start looking a little more realistic/life-like, so we'll have to move away from the basic png/vector style build and rendering. Here's the main tasks:
- In the arctic: 1. the fox should be an arctic fox, which is white and light blue; 2. polar bear should be more of a realistic full body not just a cartoon head; 3. the fish should be like a cod
- In the antarctic: 1. the penguin should look like a real penguin on it's belly; 2. the seals should look like a real angry leopard seal; make the ice holes more craggy.

Before we make changes, let me know what you plan is for making and rendering graphics.

---

Some other fixes to implement:
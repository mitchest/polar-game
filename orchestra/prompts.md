We've made a small 2D browser game that complements a school project on the polar
regions. It's reached by scanning a QR code on the final slide of the *Life in
the Freezers* presentation (`Life in the Freezers.pptx`), so it's designed to play equally well on a computer (keyboard) and a touch-only iPad or phone. The general flow is 1. Pick a region, beat the challenge, and you're rewarded with an animated screen of polar facts. Read and understand the full plan and tech stack (`orchestra/full_game_plan.md`) as well as the intended audience and usage (`README.md`). 

Now we want to update the graphics - it's very simple at present. We want it to start looking a little more realistic/life-like, so we'll have to move away from the basic png style rendering. Here's the main tasks:
- In the arctic: 1. the fox should be an arctic fox, which is white and light blue; 2. polar bear should be more of a realistic full body not just a cartoon head; 3. the fish should be like a cod
- In the antarctic: 1. the penguin should look like a real penguin on it's belly; 2. the seals should look like a real angry leopard seal; make the ice holes more craggy.

Before we make changes, let me know what you plan is for making and rendering graphics.


---

Some other fixes to implement:
- In the arctic game: the player should not be able to go though the snow mounds (i.e. you can't be seen but you also are blocked fro moving through them); a real bonus would be if the polar bears vision cone is a different colour when blocked by the snow mound; the timer is a little too long for "being caught" so change it from 0.5 to 0.2 seconds.
- in the antarctic game: make the leopard seals about 20% slower, it's a bit too hard.
- the "Menu" (i.e. return to main menu) button is a little laggy and not easy to click.
- on mobile, the screen is a little small and down the bottom, and the controls are quite laggy and non intuitive. I think we need a "touch control area" below the main game window, so you're not on top of the gameplay with your fingers.
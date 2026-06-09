- We want to make a basic 2D game that runs in the browser, that complements a school project about the polar regions.

- Some basic information about the content is in this file: `Life in the Freezers.pptx`.

- The tech stack is going to be: pushed to github, deployed on github pages, and then all run and played in browser. I want to be able to test locally too. So i was thinking to use Phaser, but am open to other suggestions if you really think there's a better pathway.

- I want the basic structure and gameplay to be as follows:
1. Two entry points to the game: "Arctic" or "Antarctic"
2. In the arctic there's an arctic fox trying to get food off a polar bear, but the polar bear slowly turns and and you have to avoid it by going behind snow mounds. It ends if the polar bear sees you.
3. In the antarctic there's a gentoo penguin sliding along, trying to avoid a leopard seal (th seals pop out of holes in the ice and head towards you). it ends if the seal catches you.
4. If you get past either arctic or antarctic stages/runs, the game ends and finishes with a screen about polar region facts (nicely animated etc.).

- Start by making a comprehensive plan for the whole game, tech stack, deployment and scaffolding - write that to orchestra/full_game_plan.md, and check it with me before implementation.

--------

Update the README now to reflect the game, build, tech stack and local dev + github pages deploy style.

---------

Some small fixes:
- the "Menu" (i.e. return to main menu) button is a little laggy and not easy to click
- on mobile, the screen is a little small and down the bottom
// Polar facts, taken from Moss's "Life in the Freezers" slides. Shown on the
// win screen. M3 animates these in nicely; for now they're plain cards.

export type Region = 'arctic' | 'antarctic';

export const FACTS: Record<Region, string[]> = {
  arctic: [
    'The Arctic sits at the very top of the planet, above an imaginary line called the Arctic Circle.',
    'It is made of the Arctic Ocean plus parts of Canada, Russia, the USA, Greenland, Norway, Finland, Sweden and Iceland.',
    'Because Earth tilts, each year the Arctic gets at least one whole day of darkness — and one whole day of sunshine!',
    'Arctic wildlife includes polar bears, Arctic foxes, walruses, seals and whales.',
    'The narwhal is the "sea unicorn" — male narwhals have a tusk that can grow over 3 metres long.',
  ],
  antarctic: [
    'Penguins are Antarctica’s most famous animals — flightless birds, well adapted but not very adaptable.',
    'Tiny microbes near the surface of the Southern Ocean power the food chain, carrying food down to animals in the dark depths.',
    'Coelacanths — a rare fish thought to have lived in the same form for 400 million years — can be found in Antarctic waters.',
    'Antarctica is fragile but mighty: huge landscapes and teeming wildlife colonies.',
  ],
};

export const REGION_TITLE: Record<Region, string> = {
  arctic: 'Arctic Facts',
  antarctic: 'Antarctic Facts',
};

// ABOUTME: Pins the three layers of each landing hero card - focus ring, image, border - to one radius.
// ABOUTME: A radius on a layer that does not clip is invisible, and the corners then disagree.
import fs from 'fs';
import path from 'path';

const page = fs.readFileSync(
  path.join(process.cwd(), 'src/app/page.tsx'),
  'utf8'
);

const classNames = Array.from(page.matchAll(/className="([^"]*)"/g)).map(
  (match) => match[1]
);

/** The class strings of one layer of the hero cards, one per card. */
function layer(marker: string): string[] {
  return classNames.filter((value) => value.includes(marker));
}

/** The radius utility a class string carries, e.g. `rounded-xl`. */
function radius(value: string): string | undefined {
  return value.split(/\s+/).find((part) => part.startsWith('rounded-'));
}

/* The focusable wrapper paints the ring, the image layer paints the artwork and
   the CardCurtainReveal paints the hairline border. All three are the same box. */
const wrappers = layer('focus-visible:ring-offset-background');
const imageLayers = layer('absolute inset-0 z-0');
const cards = layer('group-hover:border-primary/50');

describe('landing hero cards', () => {
  it('has two cards, each with a wrapper, an image layer and a border', () => {
    expect(wrappers).toHaveLength(2);
    expect(imageLayers).toHaveLength(2);
    expect(cards).toHaveLength(2);
  });

  it('gives all three layers of both cards one radius, from the scale', () => {
    const radii = [...wrappers, ...imageLayers, ...cards].map(radius);

    expect(radii).toEqual(Array(6).fill('rounded-xl'));
  });

  it('clips the image layer, which is otherwise square-cornered', () => {
    imageLayers.forEach((value) => {
      expect(value.split(/\s+/)).toContain('overflow-hidden');
    });
  });

  it('keeps the ring offset that separates the ring from the artwork', () => {
    wrappers.forEach((value) => {
      expect(value).toContain('focus-visible:ring-2');
      expect(value).toContain('focus-visible:ring-offset-2');
    });
  });
});

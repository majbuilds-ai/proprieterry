# Animation libraries

The local preview and static hosting load these files directly from this directory.

- GSAP and ScrollTrigger 3.15.0 come from `gsap/dist`. Their license is linked in the file headers.
- Lenis 1.3.26 comes from `lenis/dist`. See [the Lenis license](Lenis-LICENSE.txt).
- Motion 12.43.0 is bundled with esbuild using browser target ES2020, minification and IIFE output named `Motion`. The entry point is `export { animate, hover } from 'motion';`. See [the Motion license](Motion-LICENSE.md).

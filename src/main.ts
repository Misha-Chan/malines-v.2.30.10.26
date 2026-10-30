import './style.css';
import { Showroom } from './scene/showroom';

const canvas = document.querySelector<HTMLCanvasElement>('#scene');
const loader = document.querySelector<HTMLDivElement>('#loader');

function reveal(): void {
  window.setTimeout(() => loader?.classList.add('is-done'), 520);
}

if (!canvas) {
  loader?.classList.add('is-done');
  throw new Error('Canvas #scene not found');
}

try {
  const showroom = new Showroom(canvas);
  showroom.start();
  requestAnimationFrame(reveal);
} catch (error) {
  console.error('[malines] failed to boot the 3D showroom', error);
  document.body.classList.add('no-webgl');
  reveal();
}

import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const COL = { orange: 0xff4d00, cobalt: 0x2348c8, ink: 0x17171a, paper: 0xf4f1ea, mint: 0x9fd8c4, sun: 0xffc533 };
const CARD_COLORS = [['#2348C8', '#F4F1EA'], ['#F4F1EA', '#17171A'], ['#FFC533', '#17171A'], ['#9FD8C4', '#17171A']];
const CROWD = [
  [{ w: 1.1, h: 1.3, d: 1.1, color: COL.cobalt, ribbon: COL.sun }, [-2.6, 0, 0.6], 0.5],
  [{ w: 0.8, h: 0.7, d: 0.8, color: COL.paper, ribbon: COL.orange }, [-1.75, 0, 1.75], -0.3],
  [{ w: 1.3, h: 0.9, d: 1, color: COL.ink, ribbon: COL.orange }, [2.7, 0, 0.2], -0.6],
  [{ w: 0.7, h: 1.1, d: 0.7, color: COL.mint, ribbon: COL.ink }, [2.05, 0, 1.75], 0.4],
  [{ w: 0.6, h: 0.55, d: 0.6, color: COL.sun, ribbon: COL.cobalt }, [-2.6, 1.3, 0.6], 0.9],
  [{ w: 1, h: 0.8, d: 1, color: COL.paper, ribbon: COL.cobalt }, [0.6, 0, -2.4], 0.2],
];

const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const span = (p, a, b) => clamp((p - a) / (b - a));
const ease = (t) => 1 - (1 - t) ** 3;
const lerp = (a, b, t) => a + (b - a) * t;

const paper = (color) => new THREE.MeshPhysicalMaterial({ color, roughness: 0.6, clearcoat: 0.15, clearcoatRoughness: 0.5 });
const satin = (color) => new THREE.MeshPhysicalMaterial({ color, roughness: 0.22, metalness: 0.05, sheen: 1, sheenColor: new THREE.Color(0xffffff), sheenRoughness: 0.3 });
const solid = (m) => ((m.castShadow = true), (m.receiveShadow = true), m);

function gift({ w, h, d, color, ribbon }) {
  const g = new THREE.Group();
  const bh = h * 0.8, lh = h * 0.22, rw = Math.min(w, d) * 0.16;
  const body = solid(new THREE.Mesh(new RoundedBoxGeometry(w, bh, d, 4, 0.05), paper(color)));
  body.position.y = bh / 2;
  g.add(body);
  const bodyRib = new THREE.Group();
  bodyRib.add(solid(new THREE.Mesh(new THREE.BoxGeometry(w + 0.012, bh, rw), satin(ribbon))));
  bodyRib.add(solid(new THREE.Mesh(new THREE.BoxGeometry(rw, bh, d + 0.012), satin(ribbon))));
  bodyRib.position.y = bh / 2;
  g.add(bodyRib);
  const hinge = new THREE.Group();
  hinge.position.set(0, bh, -d / 2 - 0.02);
  const lid = new THREE.Group();
  lid.position.z = d / 2 + 0.02;
  hinge.add(lid);
  const lw = w * 1.06, ld = d * 1.06;
  const lidBox = solid(new THREE.Mesh(new RoundedBoxGeometry(lw, lh, ld, 4, 0.05), paper(color)));
  lidBox.position.y = lh / 2 - 0.02;
  lid.add(lidBox);
  [[lw + 0.012, lh + 0.012, rw], [rw, lh + 0.012, ld + 0.012]].forEach(([a, b, c]) => {
    const r = solid(new THREE.Mesh(new THREE.BoxGeometry(a, b, c), satin(ribbon)));
    r.position.y = lh / 2 - 0.02;
    lid.add(r);
  });
  const bow = new THREE.Group();
  const loop = new THREE.TorusGeometry(rw * 1.25, rw * 0.38, 16, 40);
  [-1, 1].forEach((s) => {
    const t = solid(new THREE.Mesh(loop, satin(ribbon)));
    t.position.set(s * rw * 1.15, rw * 0.9, 0);
    t.rotation.set(0, s * 0.35, s * 0.55);
    t.scale.set(1, 1, 0.55);
    bow.add(t);
  });
  bow.add(solid(new THREE.Mesh(new THREE.SphereGeometry(rw * 0.55, 20, 16), satin(ribbon))));
  bow.position.y = lh;
  lid.add(bow);
  g.add(hinge);
  Object.assign(g.userData, { hinge, bow, bodyRib, h });
  return g;
}

function cardTexture({ title, price, state }, [bg, fg]) {
  const c = document.createElement('canvas');
  c.width = 600;
  c.height = 760;
  const x = c.getContext('2d');
  x.fillStyle = bg;
  x.beginPath();
  x.roundRect(0, 0, 600, 760, 48);
  x.fill();
  x.fillStyle = fg;
  x.font = '800 58px Unbounded';
  let line = '', y = 130;
  title.split(' ').forEach((word) => {
    const next = line ? `${line} ${word}` : word;
    if (x.measureText(next).width > 500 && line) { x.fillText(line, 50, y); line = word; y += 74; } else line = next;
  });
  x.fillText(line, 50, y);
  x.font = '600 40px "Golos Text"';
  x.fillText(price, 50, 640);
  x.font = '500 30px "Golos Text"';
  x.globalAlpha = 0.7;
  x.fillText(state, 50, 700);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

export default function Hero3D({ stage, cards, onFail }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    } catch {
      onFail();
      return undefined;
    }
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.NeutralToneMapping;

    const scene = new THREE.Scene();
    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environmentIntensity = 0.5;
    const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);

    const key = new THREE.DirectionalLight(0xffffff, 2.4);
    key.position.set(5, 9, 6);
    key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048);
    Object.assign(key.shadow.camera, { left: -8, right: 8, top: 8, bottom: -8 });
    key.shadow.radius = 8;
    key.shadow.bias = -0.0005;
    scene.add(key);

    const ground = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), new THREE.ShadowMaterial({ opacity: 0.16 }));
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    const hero = gift({ w: 2.2, h: 1.7, d: 2.2, color: COL.orange, ribbon: COL.paper });
    scene.add(hero);
    const crowd = CROWD.map(([o, p, r]) => {
      const g = gift(o);
      g.position.set(...p);
      g.rotation.y = r;
      Object.assign(g.userData, { base: g.position.clone(), r });
      scene.add(g);
      return g;
    });
    const taken = gift({ w: 0.9, h: 0.75, d: 0.9, color: COL.ink, ribbon: COL.orange });
    scene.add(taken);
    const cardGeo = new THREE.PlaneGeometry(1.2, 1.52);
    const items = cards.map((card, i) => {
      const m = new THREE.Mesh(cardGeo, new THREE.MeshBasicMaterial({ map: cardTexture(card, CARD_COLORS[i % 4]), transparent: true, toneMapped: false, side: THREE.DoubleSide }));
      m.castShadow = true;
      scene.add(m);
      return m;
    });

    let W = 1, H = 1, mobile = false;
    const resize = () => {
      W = canvas.clientWidth;
      H = canvas.clientHeight;
      mobile = W < 700;
      renderer.setSize(W, H, false);
      camera.aspect = W / H;
      camera.fov = mobile ? 44 : 30;
      camera.updateProjectionMatrix();
    };
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    resize();

    const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
    const onMove = (e) => { pointer.tx = e.clientX / innerWidth - 0.5; pointer.ty = e.clientY / innerHeight - 0.5; };
    addEventListener('pointermove', onMove, { passive: true });

    const chapters = [...stage.current.querySelectorAll('[data-ch]')];
    const hint = stage.current.querySelector('.scroll-hint');
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const origin = new THREE.Vector3(0, 0.9, 0);
    const target = new THREE.Vector3();
    let shown = 0, raf = 0;
    const clock = new THREE.Clock();

    const frame = () => {
      const t = reduce ? 0 : clock.getElapsedTime();
      const r = stage.current.getBoundingClientRect();
      const progress = clamp(-r.top / (r.height - innerHeight));
      shown += (progress - shown) * (reduce ? 1 : 0.09);
      const p = shown;
      pointer.x += (pointer.tx - pointer.x) * 0.05;
      pointer.y += (pointer.ty - pointer.y) * 0.05;

      const open = ease(span(p, 0.18, 0.42));
      const rise = ease(span(p, 0.36, 0.7));
      const secret = ease(span(p, 0.7, 0.9));
      const zoom = ease(span(p, 0.3, 0.7));
      const untie = ease(span(p, 0.12, 0.26));

      const dist = lerp(mobile ? 15 : 12.6, mobile ? 12.5 : 9, zoom);
      const ang = 0.35 + pointer.x * 0.35 + Math.sin(t * 0.12) * 0.06 - zoom * 0.35;
      const ox = mobile ? 0 : lerp(-3.1, 0, zoom);
      camera.position.set(Math.sin(ang) * dist + ox, lerp(4.4, 3.2, zoom) - pointer.y * 0.8, Math.cos(ang) * dist);
      camera.lookAt(ox, lerp(mobile ? -0.4 : 0.9, mobile ? 2.3 : 1.75, zoom), 0);

      const { hinge, bow, bodyRib, h } = hero.userData;
      bow.scale.setScalar(1 - untie * 0.999);
      bodyRib.scale.set(1, 1 - untie * 0.999, 1);
      bodyRib.position.y = h * 0.4 * (1 - untie * 0.999);
      hinge.rotation.x = -open * 1.95;
      hinge.position.y = h * 0.8 + open * 0.25;
      hero.rotation.y = 0.2 + Math.sin(t * 0.3) * 0.04 - zoom * 0.2;

      crowd.forEach((g, i) => {
        const away = zoom * (2.2 + i * 0.25) + secret * 3;
        const b = g.userData.base;
        const len = Math.hypot(b.x, b.z);
        g.position.set(b.x + (b.x / len) * away, b.y, b.z + (b.z / len) * away);
        g.rotation.y = g.userData.r + Math.sin(t * 0.4 + i) * 0.05;
      });

      const n = items.length;
      items.forEach((c, i) => {
        const k = ease(span(rise, i * 0.12, 0.55 + i * 0.12));
        const mid = i - (n - 1) / 2;
        const fan = mid * 0.12;
        c.visible = k > 0.001;
        target.set(mid * (mobile ? 0.95 : 1.42), 2.55 - Math.abs(mid) * 0.18 + Math.sin(t * 0.8 + i) * 0.03, 0.6 + Math.abs(fan) * 0.4);
        c.position.lerpVectors(origin, target, k);
        c.scale.setScalar(lerp(0.4, mobile ? 0.82 : 1, k));
        c.lookAt(camera.position.x * 0.15 + c.position.x, c.position.y + 0.2, camera.position.z);
        c.rotateZ(-fan * 0.4);
      });

      taken.visible = secret > 0.001;
      taken.scale.setScalar(lerp(0.001, mobile ? 0.8 : 1, secret));
      taken.position.set(mobile ? 0 : lerp(0, -0.4, secret), lerp(1, mobile ? 0.5 : 0.55, secret), lerp(0, 2.4, secret));
      taken.rotation.y = -0.4 + t * 0.25 * secret;

      chapters.forEach((el) => {
        const [a, b] = el.dataset.ch.split(',').map(Number);
        const vis = clamp(Math.min((p - a) / 0.05, (b - p) / 0.05));
        el.style.opacity = vis;
        el.style.transform = `translateY(${(1 - vis) * 18}px)`;
        el.style.pointerEvents = vis > 0.5 ? '' : 'none';
      });
      if (hint) hint.style.opacity = 1 - span(p, 0, 0.06);

      renderer.render(scene, camera);
      raf = requestAnimationFrame(frame);
    };
    frame();

    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
      removeEventListener('pointermove', onMove);
      scene.traverse((o) => {
        o.geometry?.dispose();
        [o.material].flat().forEach((m) => { m?.map?.dispose(); m?.dispose(); });
      });
      pmrem.dispose();
      renderer.dispose();
    };
  }, [stage, cards, onFail]);

  return <canvas ref={canvasRef} aria-hidden="true" />;
}

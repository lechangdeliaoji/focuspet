/* ============================================================
 * pet.js — 宠物 SVG 精灵（猫 / 狗）+ 配饰 + 动画
 * 纯手绘 SVG，无外部资源，可离线运行
 * ============================================================ */
const PetSprite = (function () {
  const CSS = `
#petSvg{overflow:visible;display:block;margin:0 auto}
#petSvg .breath{animation:petBreath 3.6s ease-in-out infinite;transform-origin:100px 190px}
#petSvg .head-g{animation:petHead 3.6s ease-in-out infinite;transform-origin:100px 120px}
@keyframes petBreath{0%,100%{transform:scale(1,1)}50%{transform:scale(1.02,1.035)}}
@keyframes petHead{0%,100%{transform:translateY(0) rotate(0)}50%{transform:translateY(-2px) rotate(-.6deg)}}
#petSvg .tail{animation:petWag 2.4s ease-in-out infinite;transform-origin:150px 162px}
@keyframes petWag{0%,100%{transform:rotate(-6deg)}50%{transform:rotate(12deg)}}
#petSvg .eyes{animation:petBlink 5.4s infinite;transform-box:fill-box;transform-origin:center}
@keyframes petBlink{0%,92%,100%{transform:scaleY(1)}95%{transform:scaleY(.12)}}
#petSvg .pet-shadow-in{animation:petShadow 3.6s ease-in-out infinite}
@keyframes petShadow{0%,100%{opacity:.28;transform:scaleX(1)}50%{opacity:.2;transform:scaleX(.94)}}
#petSvg .ear-l{animation:petEarL 4.2s ease-in-out infinite;transform-box:fill-box;transform-origin:bottom center}
#petSvg .ear-r{animation:petEarR 4.7s ease-in-out infinite;transform-box:fill-box;transform-origin:bottom center}
@keyframes petEarL{0%,88%,100%{transform:rotate(0)}93%{transform:rotate(-7deg)}}
@keyframes petEarR{0%,80%,100%{transform:rotate(0)}86%{transform:rotate(7deg)}}

/* 表情切换 */
#petSvg .eye-happy,#petSvg .eye-sad,#petSvg .tear,#petSvg .brow{display:none}
#petSvg[data-mood="happy"] .eye-normal{display:none}
#petSvg[data-mood="happy"] .eye-happy{display:block}
#petSvg[data-mood="sad"] .eye-normal{display:none}
#petSvg[data-mood="sad"] .eye-sad{display:block}
#petSvg[data-mood="sad"] .tear{display:block}
#petSvg[data-mood="sad"] .brow{display:block}
#petSvg[data-mood="happy"] .mouth-normal{display:none}
#petSvg .mouth-happy{display:none}
#petSvg[data-mood="happy"] .mouth-happy{display:block}

/* 互动动作 */
#petBox.jump #petSvg{animation:petJump .6s cubic-bezier(.3,1.4,.5,1)}
@keyframes petJump{0%{transform:translateY(0) scale(1)}30%{transform:translateY(-26px) scale(1.04,.96)}
  60%{transform:translateY(0) scale(.97,1.03)}80%{transform:translateY(-7px)}100%{transform:none}}
#petBox.eat #petSvg{animation:petEat 1s ease-in-out}
@keyframes petEat{0%,100%{transform:none}20%{transform:translateY(4px) scale(1.03,.97)}
  45%{transform:translateY(-2px) scale(.99,1.02)}70%{transform:translateY(3px) scale(1.02,.98)}}
#petBox.shake #petSvg{animation:petShake .5s ease-in-out}
@keyframes petShake{0%,100%{transform:rotate(0)}25%{transform:rotate(-4deg)}75%{transform:rotate(4deg)}}
#petBox.dance #petSvg{animation:petDance 1.2s ease-in-out}
@keyframes petDance{0%,100%{transform:rotate(0) translateY(0)}25%{transform:rotate(-5deg) translateY(-6px)}
  75%{transform:rotate(5deg) translateY(-6px)}}
`;
  let styleInjected = false;
  function injectStyle() {
    if (styleInjected || document.getElementById('petSpriteStyle')) { styleInjected = true; return; }
    const s = document.createElement('style');
    s.id = 'petSpriteStyle';
    s.textContent = CSS;
    document.head.appendChild(s);
    styleInjected = true;
  }

  /* ---------------- 猫 ---------------- */
  function cat(fur, fur2, belly) {
    return `
<g class="breath">
  <path class="tail" d="M146 160 c34 -4 40 -44 16 -64" fill="none" stroke="${fur}" stroke-width="13" stroke-linecap="round"/>
  <ellipse class="shadow-in" cx="100" cy="192" rx="46" ry="8" fill="#000" opacity=".28"/>
  <ellipse cx="100" cy="154" rx="49" ry="40" fill="${fur}"/>
  <ellipse cx="100" cy="163" rx="31" ry="27" fill="${belly}" opacity=".95"/>
  <ellipse cx="79" cy="187" rx="15" ry="9" fill="${belly}"/>
  <ellipse cx="121" cy="187" rx="15" ry="9" fill="${belly}"/>

  <g class="head-g">
    <path class="ear-l" d="M63 68 L54 24 L96 48 Z" fill="${fur}"/>
    <path class="ear-r" d="M137 68 L146 24 L104 48 Z" fill="${fur}"/>
    <path class="ear-l" d="M67 62 L62 38 L86 50 Z" fill="${fur2}"/>
    <path class="ear-r" d="M133 62 L138 38 L114 50 Z" fill="${fur2}"/>
    <circle cx="100" cy="84" r="45" fill="${fur}"/>
    <path d="M100 40 q6 10 0 18" stroke="${fur2}" stroke-width="4" fill="none" stroke-linecap="round" opacity=".7"/>
    <ellipse cx="66" cy="96" rx="9" ry="5.5" fill="#ff8fb1" opacity=".38"/>
    <ellipse cx="134" cy="96" rx="9" ry="5.5" fill="#ff8fb1" opacity=".38"/>
  </g>
</g>`;
  }

  /* ---------------- 狗 ---------------- */
  function dog(fur, fur2, belly) {
    return `
<g class="breath">
  <path class="tail" d="M146 166 c26 2 30 -26 14 -40" fill="none" stroke="${fur}" stroke-width="15" stroke-linecap="round"/>
  <ellipse class="shadow-in" cx="100" cy="192" rx="46" ry="8" fill="#000" opacity=".28"/>
  <ellipse cx="100" cy="154" rx="49" ry="40" fill="${fur}"/>
  <ellipse cx="100" cy="164" rx="31" ry="27" fill="${belly}" opacity=".95"/>
  <ellipse cx="79" cy="187" rx="15" ry="9" fill="${belly}"/>
  <ellipse cx="121" cy="187" rx="15" ry="9" fill="${belly}"/>

  <g class="head-g">
    <ellipse class="ear-l" cx="54" cy="92" rx="16" ry="27" fill="${fur2}" transform="rotate(12 54 92)"/>
    <ellipse class="ear-r" cx="146" cy="92" rx="16" ry="27" fill="${fur2}" transform="rotate(-12 146 92)"/>
    <circle cx="100" cy="84" r="46" fill="${fur}"/>
    <ellipse cx="100" cy="57" rx="14" ry="11" fill="${fur2}" opacity=".45"/>
    <ellipse cx="100" cy="103" rx="23" ry="17" fill="${belly}"/>
    <ellipse cx="100" cy="94" rx="7.5" ry="5.5" fill="#2b3138"/>
    <ellipse cx="66" cy="98" rx="9" ry="5.5" fill="#ff8fb1" opacity=".32"/>
    <ellipse cx="134" cy="98" rx="9" ry="5.5" fill="#ff8fb1" opacity=".32"/>
  </g>
</g>`;
  }

  /* ---------------- 脸（眼/鼻/嘴） ---------------- */
  function face(type) {
    const nose = type === 'dog'
      ? `<path class="mouth-normal" d="M100 101 v5 M100 106 q-7 7 -13 1 M100 106 q7 7 13 1" stroke="#3a414b" stroke-width="2.6" fill="none" stroke-linecap="round"/>`
      : `<path class="mouth-normal" d="M100 96 v4 M100 100 q-6 6 -12 1 M100 100 q6 6 12 1" stroke="#3a414b" stroke-width="2.6" fill="none" stroke-linecap="round"/>
         <line x1="52" y1="92" x2="30" y2="87" stroke="#5a6472" stroke-width="1.6" stroke-linecap="round" opacity=".8"/>
         <line x1="52" y1="99" x2="29" y2="101" stroke="#5a6472" stroke-width="1.6" stroke-linecap="round" opacity=".8"/>
         <line x1="148" y1="92" x2="170" y2="87" stroke="#5a6472" stroke-width="1.6" stroke-linecap="round" opacity=".8"/>
         <line x1="148" y1="99" x2="171" y2="101" stroke="#5a6472" stroke-width="1.6" stroke-linecap="round" opacity=".8"/>`;
    const eyeY = 82;
    return `
  <g class="eyes">
    <g class="eye-normal">
      <ellipse cx="83" cy="${eyeY}" rx="6.6" ry="8.6" fill="#231f2b"/>
      <ellipse cx="117" cy="${eyeY}" rx="6.6" ry="8.6" fill="#231f2b"/>
      <circle cx="85" cy="${eyeY - 3}" r="2.4" fill="#fff" opacity=".92"/>
      <circle cx="119" cy="${eyeY - 3}" r="2.4" fill="#fff" opacity=".92"/>
    </g>
    <g class="eye-happy">
      <path d="M76 ${eyeY + 2} q7 -9 14 0" stroke="#231f2b" stroke-width="3.4" fill="none" stroke-linecap="round"/>
      <path d="M110 ${eyeY + 2} q7 -9 14 0" stroke="#231f2b" stroke-width="3.4" fill="none" stroke-linecap="round"/>
    </g>
    <g class="eye-sad">
      <ellipse cx="83" cy="${eyeY + 1}" rx="6" ry="7.5" fill="#231f2b"/>
      <ellipse cx="117" cy="${eyeY + 1}" rx="6" ry="7.5" fill="#231f2b"/>
      <circle cx="85" cy="${eyeY - 1}" r="1.8" fill="#fff" opacity=".8"/>
      <circle cx="119" cy="${eyeY - 1}" r="1.8" fill="#fff" opacity=".8"/>
    </g>
    <path class="brow" d="M74 66 q10 3 18 -1 M108 65 q10 4 18 1" stroke="#4a5260" stroke-width="2.6" fill="none" stroke-linecap="round"/>
    <path class="tear" d="M119 ${eyeY + 8} q3 5 0 7 q-3 -2 0 -7" fill="#6cc8ff" opacity=".9"/>
  </g>
  <path d="M100 90 l-6 -5 h12 z" fill="${type === 'dog' ? '#2b3138' : '#ff8fa3'}" ${type === 'dog' ? 'opacity=".9"' : ''}/>
  <path class="mouth-happy" d="M88 103 q12 11 24 0" stroke="#3a414b" stroke-width="2.6" fill="none" stroke-linecap="round"/>
  ${type === 'dog' ? '<path d="M96 112 q4 8 8 0" fill="#ff7a8f"/>' : ''}
  ${nose}`;
  }

  /* ---------------- 配饰 ---------------- */
  const ACC = {
    collar: `<g><path d="M68 128 q32 13 64 0" stroke="#ff4d6d" stroke-width="10" fill="none" stroke-linecap="round"/>
      <circle cx="100" cy="136" r="6.5" fill="#ffd166" stroke="#e8a92b" stroke-width="1.6"/>
      <circle cx="100" cy="136" r="2" fill="#e8a92b"/></g>`,
    scarf: `<g><path d="M62 124 q38 16 76 0 l-3 12 q-35 14 -70 0 z" fill="#5ab6ff"/>
      <path d="M124 132 l10 22 -10 4 -6 -24 z" fill="#4aa3ea"/>
      <path d="M60 126 q40 17 80 0" stroke="#7ec9ff" stroke-width="2.5" fill="none" opacity=".8"/></g>`,
    bell: `<g><path d="M70 127 q30 12 60 0" stroke="#2f3742" stroke-width="7" fill="none"/>
      <circle cx="100" cy="134" r="5.6" fill="#ffd166"/></g>`,
    bow: `<g transform="translate(74,44) rotate(-16)">
      <path d="M0 0 q-16 -11 -18 2 q-2 12 18 6 z" fill="#ff6b8b"/>
      <path d="M0 0 q16 -11 18 2 q2 12 -18 6 z" fill="#ff6b8b"/>
      <circle cx="0" cy="4" r="5" fill="#ff9db2"/></g>`,
    partyhat: `<g><path d="M100 6 L78 52 L122 52 Z" fill="#a78bfa"/>
      <path d="M100 6 L92 30 L108 30 Z" fill="#c4b5fd" opacity=".8"/>
      <circle cx="100" cy="5" r="4.5" fill="#ffd166"/>
      <path d="M80 50 q20 6 40 0" stroke="#ffd166" stroke-width="3" fill="none"/></g>`,
    crown: `<g><path d="M74 46 l4 -22 12 12 10 -18 10 18 12 -12 4 22 z" fill="#ffd166" stroke="#e0a52c" stroke-width="2" stroke-linejoin="round"/>
      <circle cx="78" cy="28" r="2.6" fill="#fff2b8"/><circle cx="100" cy="22" r="2.6" fill="#fff2b8"/><circle cx="122" cy="28" r="2.6" fill="#fff2b8"/></g>`,
    cap: `<g><path d="M56 64 q44 -34 88 0 z" fill="#3ddc97"/>
      <path d="M56 64 q-10 2 -16 8 q22 6 34 0 z" fill="#2ec487"/>
      <circle cx="100" cy="34" r="4" fill="#2ec487"/></g>`,
    glasses: `<g><rect x="62" y="70" width="34" height="24" rx="10" fill="#1d222b" opacity=".92"/>
      <rect x="104" y="70" width="34" height="24" rx="10" fill="#1d222b" opacity=".92"/>
      <path d="M96 80 h8" stroke="#1d222b" stroke-width="4"/>
      <path d="M66 74 l8 0" stroke="#5ab6ff" stroke-width="2" opacity=".8"/>
      <path d="M108 74 l8 0" stroke="#5ab6ff" stroke-width="2" opacity=".8"/></g>`,
    necklace: `<g><path d="M70 126 q30 16 60 0" stroke="#a78bfa" stroke-width="6" fill="none"/>
      <path d="M100 138 l5 9 -5 8 -5 -8 z" fill="#c4b5fd"/></g>`
  };

  /**
   * 渲染完整宠物 SVG
   * @param {object} o {type:'cat'|'dog', variant:0|1|2, mood:'happy'|'ok'|'sad', equipped:{neck,head,eyes}}
   */
  function render(o) {
    injectStyle();
    const palette = [
      { fur: '#f6d3a8', fur2: '#e8b98a', belly: '#fff3e0' },   // 奶油
      { fur: '#c8ccd6', fur2: '#a9b0be', belly: '#f4f6fa' },   // 银灰
      { fur: '#4b4a57', fur2: '#3a3945', belly: '#8b8a99' },   // 墨黑
      { fur: '#f0a868', fur2: '#dd8f4e', belly: '#fff0dd' }    // 橘猫
    ];
    const p = palette[(o.variant || 0) % palette.length];
    const equipped = o.equipped || {};
    const mood = o.mood || 'ok';
    const head = o.type === 'dog' ? dog(p.fur, p.fur2, p.belly) : cat(p.fur, p.fur2, p.belly);

    const neckAcc = equipped.neck && ACC[equipped.neck] ? ACC[equipped.neck] : '';
    const headAcc = equipped.head && ACC[equipped.head] ? ACC[equipped.head] : '';
    const eyeAcc = equipped.eyes && ACC[equipped.eyes] ? ACC[equipped.eyes] : '';

    const order = o.type === 'dog'
      ? { neckPos: 'neck-before', headAcc: 'headAcc-after' }
      : { neckPos: 'neck-before', headAcc: 'headAcc-after' };

    // 图层顺序：尾巴/身体/爪 → 头/耳 → 脸 → 项圈 → 头部配饰 → 眼镜
    return `<svg id="petSvg" viewBox="0 0 200 215" data-mood="${mood}" xmlns="http://www.w3.org/2000/svg">
  ${head}
  <g>${face(o.type)}</g>
  <g>${neckAcc}</g>
  <g>${headAcc}</g>
  <g>${eyeAcc}</g>
</svg>`;
  }

  return { render, injectStyle, ACC };
})();

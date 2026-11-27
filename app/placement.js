// Measured on the original 1672 × 941 café image. x/y are the top-left
// of each transparent working-pose PNG. Change these values to ship a layout.
const cafeSeats = {
  espresso: { x: 454, y: 288, width: 143, height: 133 },
  mocha:   { x: 806, y: 248, width: 144, height: 136 },
  matcha:  { x: 1121, y: 249, width: 198, height: 163 },
  latte:   { x: 416, y: 511, width: 192, height: 162 },
  cookie:  { x: 883, y: 498, width: 192, height: 179 },
  caramel: { x: 1215, y: 524, width: 152, height: 141 }
};

(() => {
  const world = document.querySelector('.cafe-world');
  const editor = document.querySelector('.editor');
  const toggle = document.querySelector('.placement-toggle');
  const slider = editor.querySelector('input');
  const status = editor.querySelector('[role=status]');
  const sceneWidth = 1672, sceneHeight = 941;
  // The side panels frame this part of the map at every window size.
  const frame = { left: 201, right: 1427, top: 70, bottom: 916 };
  const storageKey = 'komorebi.cafe.seats.v1';
  const defaults = Object.fromEntries(Object.entries(cafeSeats).map(([id,s]) => [id, {x:s.x,y:s.y,scale:100}]));
  const layout = JSON.parse(JSON.stringify(defaults));
  const buttons = {};
  let selected = 'espresso', editing = false, drag = null;
  const limit = (value, min, max) => Math.max(min, Math.min(max, value));

  function place(id, position) {
    const seat = cafeSeats[id];
    const scale = limit(Math.round(position.scale), 55, 160);
    const width = seat.width * scale / 100;
    const height = seat.height * scale / 100;
    layout[id] = {
      x: limit(Math.round(position.x), frame.left, Math.floor(frame.right-width)),
      y: limit(Math.round(position.y), frame.top, Math.floor(frame.bottom-height)),
      scale
    };
    const button = buttons[id];
    button.style.left = (layout[id].x / sceneWidth * 100) + '%';
    button.style.top = (layout[id].y / sceneHeight * 100) + '%';
    button.style.width = (width / sceneWidth * 100) + '%';
    button.style.zIndex = String(Math.round(layout[id].y + height));
    if (editing && id === selected) refreshEditor();
  }
  function refreshEditor() {
    const current = layout[selected];
    editor.querySelector('strong').textContent = staffData[selected].name;
    editor.querySelector('img').src = '../profiles/' + selected + '.png';
    slider.value = current.scale;
    editor.querySelector('output').textContent = current.scale + '%';
    editor.querySelector('.coords').textContent = 'X ' + current.x + ' · Y ' + current.y;
    for (const [id,button] of Object.entries(buttons)) button.setAttribute('aria-pressed',String(id === selected));
  }
  function persist() {
    try {
      localStorage.setItem(storageKey, JSON.stringify(layout));
      status.textContent = '이 브라우저에 저장됨';
    } catch {
      status.textContent = '브라우저 저장이 제한돼요. 좌표 파일을 받아 주세요.';
    }
  }
  function select(id) {
    selected = id;
    if (editing) refreshEditor();
    else openChat(id);
  }
  let saved = {};
  try { saved = JSON.parse(localStorage.getItem(storageKey)) || {}; } catch {}
  const taskAssignments = {
    espresso: { task: '팀 업무 관리 중', status: 'working', label: '진행 중' },
    mocha:    { task: '상품 소개글 초안', status: 'review', label: '검수 대기' },
    matcha:   { task: '월간 매출 분석', status: 'review', label: '검수 대기' },
    latte:    { task: '랜딩 페이지 API 연동', status: 'working', label: '진행 중' },
    cookie:   { task: '카드뉴스 썸네일', status: 'working', label: '진행 중' },
    caramel:  { task: '대기 중', status: 'idle', label: '대기' }
  };

  for (const id of Object.keys(cafeSeats)) {
    const button = document.createElement('button');
    button.className = 'employee';
    button.type = 'button';
    button.dataset.id = id;
    button.setAttribute('aria-label',staffData[id].name);
    const img = new Image();
    img.src = '../original-cutouts/' + id + '.png';
    img.alt = ''; img.draggable = false;
    img.width = cafeSeats[id].width; img.height = cafeSeats[id].height;
    const label = document.createElement('span');
    label.textContent = staffData[id].name;
    const bubble = document.createElement('div');
    bubble.className = 'bubble';
    const assignment = taskAssignments[id];
    bubble.innerHTML = assignment.task + ' <span class="bubble-status ' + assignment.status + '">' + assignment.label + '</span>';
    button.append(img,label,bubble);
    world.append(button);
    buttons[id] = button;
    const entry = saved[id];
    place(id, entry && [entry.x,entry.y,entry.scale].every(Number.isFinite) ? entry : defaults[id]);
    button.addEventListener('click', () => select(id));
    button.addEventListener('pointerdown', e => {
      if (!editing || !e.isPrimary || e.button !== 0) return;
      select(id);
      button.setPointerCapture(e.pointerId);
      drag = {id, pointer:e.pointerId, x:e.clientX, y:e.clientY, start:{...layout[id]}};
    });
    button.addEventListener('pointermove', e => {
      if (!drag || e.pointerId !== drag.pointer || drag.id !== id) return;
      const ratio = sceneWidth / world.getBoundingClientRect().width;
      place(id,{...drag.start,x:drag.start.x+(e.clientX-drag.x)*ratio,y:drag.start.y+(e.clientY-drag.y)*ratio});
    });
    button.addEventListener('lostpointercapture', e => {
      if (drag && drag.pointer === e.pointerId) { drag=null; persist(); }
    });
    button.addEventListener('keydown', e => {
      if (!editing) return;
      const step = e.shiftKey ? 10 : 1;
      const offset = {ArrowLeft:[-step,0],ArrowRight:[step,0],ArrowUp:[0,-step],ArrowDown:[0,step]}[e.key];
      if (!offset) return;
      e.preventDefault(); select(id);
      place(id,{...layout[id],x:layout[id].x+offset[0],y:layout[id].y+offset[1]});
      persist();
    });
  }

  toggle.addEventListener('click', () => {
    editing = !editing;
    document.body.classList.toggle('editing',editing);
    editor.hidden = !editing;
    toggle.setAttribute('aria-pressed',String(editing));
    toggle.textContent = editing ? '편집 마침' : '배치 편집';
    if (editing) {
      selected = currentStaff;
      document.querySelector('#chatPanel').classList.remove('collapsed');
      status.textContent = ''; refreshEditor();
    } else { openChat(selected); }
  });
  document.querySelector('.staff-row').addEventListener('click', e => {
    const avatar = e.target.closest('[data-staff]');
    if (editing && avatar) { e.stopPropagation(); select(avatar.dataset.staff); }
  }, true);
  slider.addEventListener('input', () => place(selected,{...layout[selected],scale:Number(slider.value)}));
  slider.addEventListener('change', persist);
  editor.querySelector('.restore').onclick = () => { place(selected,defaults[selected]); persist(); };
  editor.querySelector('.download').onclick = () => {
    const data = {background:{width:sceneWidth,height:sceneHeight},characters:layout};
    const url = URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));
    const link = document.createElement('a');
    link.href=url; link.download='cafe-layout.json'; link.click();
    setTimeout(() => URL.revokeObjectURL(url),1000);
  };
  openChat('espresso');
})();

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
  const sceneWidth = 1672, sceneHeight = 941;
  const frame = { left: 201, right: 1427, top: 70, bottom: 916 };
  const storageKey = 'komorebi.cafe.seats.v1';
  const defaults = Object.fromEntries(Object.entries(cafeSeats).map(([id,s]) => [id, {x:s.x,y:s.y,scale:100}]));
  const layout = JSON.parse(JSON.stringify(defaults));
  const buttons = {};
  let selected = 'espresso';
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
    img.src = 'original-cutouts/' + id + '.png';
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
    button.addEventListener('click', () => openChat(id));
  }

  openChat('espresso');
})();

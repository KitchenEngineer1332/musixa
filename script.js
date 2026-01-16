// Elements
  const fileInput = document.getElementById('file-input');
  const openBtn = document.getElementById('open-btn');
  const dropZone = document.getElementById('drop-zone');
  const fileInfo = document.getElementById('file-info');
  const queueCount = document.getElementById('queue-count');
  const art = document.getElementById('art');
  const artPlaceholder = document.getElementById('art-placeholder');
  const playlistEl = document.getElementById('playlist');
  const audio = document.getElementById('audio');
  const playBtn = document.getElementById('play-btn');
  const prevBtn = document.getElementById('prev');
  const nextBtn = document.getElementById('next');
  const progress = document.getElementById('progress');
  const progressBar = document.getElementById('progress-bar');
  const currentTimeEl = document.getElementById('current-time');
  const durationEl = document.getElementById('duration');
  const nowPlaying = document.getElementById('now-playing');
  const volume = document.getElementById('volume');

  // State
  let queue = [];
  let currentIndex = -1;
  let objectUrls = [];

  // Helpers
  function formatTime(sec){
    if (!isFinite(sec)) return '0:00';
    const s = Math.floor(sec % 60).toString().padStart(2,'0');
    const m = Math.floor(sec / 60);
    return `${m}:${s}`;
  }

  function updateQueueUI(){
    playlistEl.innerHTML = '';
    queue.forEach((file, i) => {
      const li = document.createElement('li');
      li.className = 'track' + (i === currentIndex ? ' active' : '');
      li.dataset.index = i;

      const thumb = document.createElement('div');
      thumb.className = 'thumb';
      thumb.textContent = file.name.slice(0,2).toUpperCase();

      const info = document.createElement('div');
      info.className = 'track-info';
      const title = document.createElement('div');
      title.className = 'track-title';
      title.textContent = file.name;
      const sub = document.createElement('div');
      sub.className = 'track-sub';
      sub.textContent = `${(file.size/1024/1024).toFixed(2)} MB`;

      info.appendChild(title);
      info.appendChild(sub);

      const actions = document.createElement('div');
      actions.className = 'track-actions';
      const removeBtn = document.createElement('button');
      removeBtn.className = 'icon-btn';
      removeBtn.innerHTML = '✖';
      removeBtn.title = 'Remove';
      removeBtn.onclick = (e) => {
        e.stopPropagation();
        removeTrack(i);
      };

      actions.appendChild(removeBtn);

      li.appendChild(thumb);
      li.appendChild(info);
      li.appendChild(actions);

      li.onclick = () => loadTrack(i);

      playlistEl.appendChild(li);
    });

    queueCount.textContent = queue.length;
    fileInfo.textContent = queue.length ? `${queue.length} file(s)` : 'No files selected';
    nowPlaying.textContent = currentIndex >= 0 ? queue[currentIndex].name : '—';
  }

  function removeTrack(index){
    if (index < 0 || index >= queue.length) return;
    if (queue[index].__url) URL.revokeObjectURL(queue[index].__url);
    queue.splice(index,1);
    if (index === currentIndex){
      if (queue.length === 0){
        currentIndex = -1;
        audio.pause();
        audio.src = '';
        artPlaceholder.style.display = '';
        clearArtImage();
      } else {
        const next = Math.min(index, queue.length - 1);
        loadTrack(next);
      }
    } else if (index < currentIndex){
      currentIndex--;
    }
    updateQueueUI();
  }

  function clearArtImage(){
    const existing = art.querySelector('img');
    if (existing) existing.remove();
    artPlaceholder.style.display = '';
  }

  function setArtImage(url){
    clearArtImage();
    artPlaceholder.style.display = 'none';
    const img = document.createElement('img');
    img.src = url;
    img.alt = 'Album art';
    art.appendChild(img);
  }

  function loadTrack(index){
    if (index < 0 || index >= queue.length) return;
    currentIndex = index;
    const file = queue[index];
    if (!file.__url){
      file.__url = URL.createObjectURL(file);
      objectUrls.push(file.__url);
    }
    audio.src = file.__url;
    audio.play().catch(()=>{});
    updatePlayState(true);
    updateQueueUI();

    // generate simple gradient art using the theme colors and file initials
    const canvas = document.createElement('canvas');
    canvas.width = 800; canvas.height = 800;
    const ctx = canvas.getContext('2d');
    const start = getComputedStyle(document.documentElement).getPropertyValue('--primary-deep-red').trim() || '#b92b2b';
    const end = getComputedStyle(document.documentElement).getPropertyValue('--accent-gold').trim() || '#d4af37';
    const g = ctx.createLinearGradient(0,0,canvas.width,canvas.height);
    g.addColorStop(0, start);
    g.addColorStop(1, end);
    ctx.fillStyle = g; ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.fillStyle = 'rgba(255,255,255,0.06)';
    ctx.font = 'bold 160px Inter';
    ctx.textAlign = 'center';
    ctx.fillText(file.name.slice(0,2).toUpperCase(), canvas.width/2, canvas.height/2 + 60);
    setArtImage(canvas.toDataURL());
  }

  function updatePlayState(isPlaying){
    if (isPlaying){
      playBtn.classList.add('playing');
      playBtn.textContent = '▌▌';
    } else {
      playBtn.classList.remove('playing');
      playBtn.textContent = '▶';
    }
  }

  // File handling
  function handleFiles(files){
    const arr = Array.from(files).filter(f => f.type.startsWith('audio') || f.name.toLowerCase().endsWith('.mp3'));
    if (!arr.length) return;
    queue = queue.concat(arr);
    if (currentIndex === -1){
      loadTrack(queue.length - arr.length);
    } else {
      updateQueueUI();
    }
  }

  // Drag & drop for audio
  dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.classList.add('dragover'); });
  dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));
  dropZone.addEventListener('drop', (e) => {
    e.preventDefault(); dropZone.classList.remove('dragover');
    if (e.dataTransfer && e.dataTransfer.files) handleFiles(e.dataTransfer.files);
  });

  openBtn.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', (e) => { if (e.target.files) handleFiles(e.target.files); fileInput.value = ''; });

  // Playback controls
  playBtn.addEventListener('click', () => {
    if (!audio.src){
      if (queue.length) loadTrack(0);
      return;
    }
    if (audio.paused) audio.play();
    else audio.pause();
  });

  prevBtn.addEventListener('click', () => { if (currentIndex > 0) loadTrack(currentIndex - 1); });
  nextBtn.addEventListener('click', () => { if (currentIndex < queue.length - 1) loadTrack(currentIndex + 1); });

  audio.addEventListener('play', () => updatePlayState(true));
  audio.addEventListener('pause', () => updatePlayState(false));

  audio.addEventListener('timeupdate', () => {
    const pct = (audio.currentTime / audio.duration) * 100 || 0;
    progressBar.style.width = pct + '%';
    currentTimeEl.textContent = formatTime(audio.currentTime);
    durationEl.textContent = formatTime(audio.duration);
  });

  progress.addEventListener('click', (e) => {
    if (!audio.duration) return;
    const rect = progress.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const pct = x / rect.width;
    audio.currentTime = pct * audio.duration;
  });

  audio.addEventListener('ended', () => {
    if (currentIndex < queue.length - 1) loadTrack(currentIndex + 1);
    else { audio.currentTime = 0; audio.pause(); }
  });

  volume.addEventListener('input', (e) => { audio.volume = parseFloat(e.target.value); });

  window.addEventListener('beforeunload', () => { objectUrls.forEach(u => URL.revokeObjectURL(u)); });

  window.addEventListener('keydown', (e) => {
    if (e.code === 'Space' && e.target === document.body) { e.preventDefault(); playBtn.click(); }
    if (e.code === 'ArrowRight') audio.currentTime = Math.min(audio.duration || 0, audio.currentTime + 5);
    if (e.code === 'ArrowLeft') audio.currentTime = Math.max(0, audio.currentTime - 5);
  });

  // Initialize
  updateQueueUI();
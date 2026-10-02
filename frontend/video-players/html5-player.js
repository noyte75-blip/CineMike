// Player para vídeos HTML5 diretos (.mp4, .webm)

class Html5Player extends PlayerInterface {
  static type = 'html5';

  constructor(container) {
    super(container);
    this.video = document.createElement('video');
    this.video.className = 'video-element';
    this.video.controls = false; // controles são os nossos, para manter tudo sincronizado
    this.video.playsInline = true;
    this.video.loop = false;
    this.video.preload = 'auto';
    this.container.innerHTML = '';
    this.container.appendChild(this.video);

    // Só emite eventos quando a ação vem do usuário local, não de uma
    // aplicação remota (ver flag _applyingRemote em sync.js).
    this.video.addEventListener('play', () => this._emit('play'));
    this.video.addEventListener('pause', () => this._emit('pause'));
    this.video.addEventListener('seeked', () => this._emit('seek'));
    this.video.addEventListener('ended', () => this._emit('ended'));
  }

  async load(url) {
    return new Promise((resolve, reject) => {
      let settled = false;
      const onLoaded = () => finish(resolve);
      const onError = () => finish(reject, new Error('Esse link de vídeo não pôde ser aberto.'));
      const timeout = setTimeout(
        () => finish(reject, new Error('O vídeo demorou demais para carregar.')),
        15000,
      );
      // Remove os dois ouvintes ao terminar. Antes, o que não disparava ficava
      // pendurado e podia reagir a um erro tardio (por exemplo, ao destruir o
      // player) depois de a promessa já ter sido resolvida.
      const finish = (callback, value) => {
        if (settled) return;
        settled = true;
        clearTimeout(timeout);
        this.video.removeEventListener('loadedmetadata', onLoaded);
        this.video.removeEventListener('error', onError);
        callback(value);
      };
      this.video.addEventListener('loadedmetadata', onLoaded);
      this.video.addEventListener('error', onError);
      this.video.src = url;
      this.video.load();
    });
  }

  play() { this.video.play().catch(() => {}); }
  pause() { this.video.pause(); }
  seekTo(seconds) { this.video.currentTime = seconds; }
  getCurrentTime() { return this.video.currentTime || 0; }
  getDuration() { return this.video.duration || 0; }
  isPlaying() { return !this.video.paused && !this.video.ended; }
  isBuffering() { return !this.video.paused && (this.video.seeking || this.video.readyState < 3); }
  setPlaybackRate(rate) {
    this.video.playbackRate = Math.max(0.9, Math.min(1.1, rate));
    return true;
  }
  destroy() {
    this.video.pause();
    this.video.removeAttribute('src');
    this.video.load();
  }
}

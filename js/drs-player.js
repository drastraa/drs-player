function newElement(type, cls = null) {
  // newElement("div", ["Class1", "Class2"])
  let el = document.createElement(type);
  if (cls !== null) {
    if (typeof cls === "string") {
      el.setAttribute("class", cls);
    } else if (typeof cls === "object") {
      cls.forEach((cl) => {
        el.classList.add(cl);
      });
    }
  }
  return el;
}

function swapClass(element, remove, add) {
  element.classList.remove(remove);
  element.classList.add(add);
}

class VideoPlayer {
  constructor(videoPlayer) {
    this.player = videoPlayer;
    this.video = this.player.querySelector("video");

    this.thumbPose = 0;

    this.action = null;

    this.isControlsLoaded = false;
    this.isThumbLoaded = false;
    this.isOnTrack = false; // Checks if the mouse is on the video control section

    // for indicator Timeout
    this.indicatorTimeout = null;

    if (!this.video.controls) {
      return;
    } else {
      this.video.controls = false;
    }

    this.prepare();

    this.video.addEventListener("loadedmetadata", () => {
      this.duration = this.video.duration;
      this.initiateControls();
      this.video.addEventListener("click", () => {
        this.playpause.click();
        this.playpause.focus();
      });

      // Top pannel
      this.playpause.addEventListener("click", () => {
        if (this.video.paused) {
          this.video.play();
          this.handleIndicator("play");
        } else {
          this.video.pause();
          this.handleIndicator("pause");
        }
      });

      this.controls.addEventListener("mouseover", () => {
        this.isOnTrack = true;
      });
      this.controls.addEventListener("mouseleave", () => {
        this.isOnTrack = false;
      });
      // Time indicator update
      this.video.addEventListener("timeupdate", () => {
        this.updateTimeIndicator();
      });

      this.setMdAction(this.controls, "seeking", (ev) => {
        let rate = ev.offsetX / this.controls.offsetWidth;
        this.changeCurrentTime(rate);
      });
      document.addEventListener("mouseup", (ev) => {
        if (this.action === "seeking") {
          let rate = this.getRate(ev, this.controls);
          this.changeCurrentTime(rate);
        }

        this.action = null;
      });

      document.addEventListener("keydown", (ev) => {
        let time = this.video.currentTime;
        if (ev.key == "ArrowRight") {
          time =
            time + 10 > this.video.duration ? this.video.duration : time + 10;
        } else if (ev.key == "ArrowLeft") {
          time = time - 10 < 0 ? 0 : time - 10;
        }
        if (typeof this.video.fastSeek === "function") {
          this.video.fastSeek(time);
          console.log("fast");
        } else {
          this.video.currentTime = time;
        }
      });

      // Thumbnail
      let img = document.createElement("img");
      img.src = this.video.dataset.thumbnail;
      img.addEventListener("load", () => {
        this.thumbWidth = img.width / 6;
        this.thumbHeight = img.height / 6;

        this.initThumbnail();
      });
    });
  }

  prepare() {
    // Top pannel
    this.topPannel = newElement("div", "drs-tp");
    this.topPannelOptions = newElement("div", "drs-tp-options");

    // - Play/Pause
    this.playpause = newElement("button", "drs-tp--playpause");
    this.topPannel.appendChild(this.playpause);
    // - Volume
    this.volume = newElement("button", "drs-volume");
    this.topPannel.appendChild(this.volume);

    this.volumeSlider = newElement("div", ["drs-volume-slider", "drs-options"]);
    this.volumeSliderHandle = newElement("div", "drs-volume-slider--handle");
    this.volumeSlider.appendChild(this.volumeSliderHandle);
    this.topPannelOptions.appendChild(this.volumeSlider);

    this.setMdAction(this.volumeSlider, "volumeSlider", (ev) => {
      let rate = this.getRate(ev, this.volumeSlider);
      this.volumeSliderHandle.style.left = rate * 88 + "px";
      this.video.volume = rate;
    });

    this.volume.addEventListener("click", () => {
      this.toggleOptions(this.volume, this.volumeSlider);
    });
    // - Playback speed
    this.playback = newElement("button", "drs-playback");
    this.topPannel.appendChild(this.playback);
    // -- Options
    let speeds = [0.5, 1, 1.25, 1.5, 2];
    this.playbackOptions = newElement("div", [
      "drs-playback-options",
      "drs-options",
    ]);
    let spHtml = "";
    speeds.forEach((speed) => {
      let op;
      if (speed === 1) {
        op = newElement("option", "active");
      } else {
        op = newElement("option");
      }
      op.value = speed;
      op.innerHTML = speed + "x";
      op.addEventListener("click", () => {
        if (!op.classList.contains("active")) {
          this.video.playbackRate = op.value;
          this.playbackOptions.querySelectorAll("option").forEach((option) => {
            if (option.classList.contains("active")) {
              option.classList.remove("active");
            }
          });
          op.classList.add("active");
        }
      });
      this.playbackOptions.appendChild(op);
    });
    this.topPannelOptions.appendChild(this.playbackOptions);
    this.playback.addEventListener("click", () => {
      this.toggleOptions(this.playback, this.playbackOptions);
    });
    // - PiP
    if (!("pictureInPictureEnabled" in document)) {
      console.log("The Picture-in-Picture Web API is not available.");
    } else if (!document.pictureInPictureEnabled) {
      console.log("The Picture-in-Picture Web API is disabled.");
    } else {
      this.pip = newElement("button", "drs-tp--pip");
      this.topPannel.appendChild(this.pip);
      this.pip.addEventListener("click", () => {
        this.requestPip();
      });
    }

    // - Fullscreen
    this.fullscreen = newElement("button", ["drs-tp--fullscreen", "deactive"]);
    this.topPannel.appendChild(this.fullscreen);
    this.fullscreen.addEventListener("click", () => {
      this.toggleFullscreen();
    });
    this.player.addEventListener("fullscreenchange", () => {
      if (document.fullscreenElement === null) {
        swapClass(this.fullscreen, "active", "deactive");
      } else if (document.fullscreenElement === this.player) {
        swapClass(this.fullscreen, "deactive", "active");
      }
    });

    this.player.appendChild(this.topPannel);
    this.player.appendChild(this.topPannelOptions);

    // Creating progressbar
    this.controls = newElement("div", "drs-controls");
    this.controls.style.height = 50 + "px";

    this.progress = newElement("div", "drs-progress");
    this.controls.appendChild(this.progress);

    this.pHover = newElement("div", "drs-progress--hover");
    this.controls.appendChild(this.pHover);

    // Creating time indicator
    this.info = newElement("p", "drs-info");

    this.totalDuration = newElement("p", "drs-info-totalduration");

    this.progressDuration = newElement("p", "drs-info-progressduration");

    this.info.appendChild(this.progressDuration);
    this.info.appendChild(this.totalDuration);
    this.controls.appendChild(this.info);

    // Creating play indicator
    this.indicator = newElement("div", "drs-indicator");
    this.player.appendChild(this.indicator);

    this.player.appendChild(this.controls);
  }

  initiateControls() {
    let initialProgress = Math.round(
      (this.video.currentTime / this.video.duration) * 100
    );

    this.progress.style.width = initialProgress + "%";

    // Manipulating time indicator
    this.totalDuration.innerHTML = this.formatTime(this.duration);
    this.progressDuration.innerHTML = this.formatTime(this.video.currentTime);

    // Creating play indicator
    this.indicator.style.bottom = this.video.offsetHeight / 2 + "px";
    if (this.video.paused) {
      this.handleIndicator("pause");
    } else {
      this.handleIndicator("play");
    }

    this.showControls();

    // Events

    document.addEventListener("mousemove", (ev) => {
      if (this.action === "seeking") {
        if (this.isThumbLoaded) {
          let rate = this.getRate(ev, this.controls);
          this.progressHover(rate);
          this.changeCurrentTime(rate);
        }
      } else if (this.action === "volumeSlider") {
        let rate = this.getRate(ev, this.volumeSlider);
        this.volumeSliderHandle.style.left = rate * 88 + "px";
        this.video.volume = rate;
      }

      if (this.isOnTrack) {
        let rate = this.getRate(ev, this.controls);
        this.progressHover(rate);
      }
    });
    this.controls.addEventListener("mouseenter", () => {
      if (this.isThumbLoaded) {
        this.dynamicThumbnail.style.opacity = 1;
      }
    });
    this.controls.addEventListener("mouseleave", () => {
      if (this.isThumbLoaded) {
        this.dynamicThumbnail.style.opacity = 0;
      }
    });

    this.player.addEventListener("mouseenter", () => {
      this.showControls();
    });
    this.player.addEventListener("mouseleave", () => {
      this.hideControls();
    });

    this.video.addEventListener("leavepictureinpicture", () => {
      this.pip.classList.remove("active");
    });
    this.video.addEventListener("enterpictureinpicture", () => {
      this.pip.classList.add("active");
    });
  }

  // Creating thumbnail elements
  initThumbnail() {
    // Creating thumbnail
    this.dynamicThumbnail = newElement("div", "drs-dynamic-thumbnail");
    this.dynamicThumbnail.style.backgroundImage = `url("${this.video.dataset.thumbnail}")`;
    this.dynamicThumbnail.style.width = this.thumbWidth + "px";
    this.dynamicThumbnail.style.height = this.thumbHeight + "px";
    this.dynamicThumbnail.style.left = 0;
    this.controls.appendChild(this.dynamicThumbnail);

    this.isThumbLoaded = true;
  }

  getRate(ev, element) {
    let rate;
    let cordinations = element.getBoundingClientRect();
    let left = cordinations.left;
    let right = cordinations.right;
    if (ev.clientX <= left) {
      rate = 0;
    } else if (ev.clientX >= right) {
      rate = 1;
    } else {
      rate = (ev.clientX - left) / cordinations.width;
    }
    return rate;
  }

  toggleOptions(trigger, options) {
    if (trigger.classList.contains("active")) {
      trigger.classList.remove("active");
      if (options.classList.contains("active")) {
        options.style.opacity = 0;
        options.style.transform = "translateY(10px)";
        setTimeout(() => {
          options.classList.remove("active");
        }, 200);
      }
    } else {
      trigger.classList.add("active");
      if (!options.classList.contains("active")) {
        options.classList.add("active");
        setTimeout(() => {
          options.style.opacity = 1;
          options.style.transform = "translateY(0)";
        }, 50);
      }
    }
  }

  async requestPip() {
    if (!("pictureInPictureEnabled" in document)) {
      console.log("The Picture-in-Picture Web API is not available.");
      return;
    } else if (!document.pictureInPictureEnabled) {
      console.log("The Picture-in-Picture Web API is disabled.");
      return;
    }

    this.pip.disabled = true;
    try {
      if (this.video !== document.pictureInPictureElement) {
        await this.video.requestPictureInPicture();
      } else {
        await document.exitPictureInPicture();
      }
    } catch (er) {
      console.log(er);
    }
    this.pip.disabled = false;
  }

  toggleFullscreen() {
    if (this.fullscreen.classList.contains("active")) {
      swapClass(this.fullscreen, "active", "deactive");
      try {
        document.exitFullscreen();
      } catch {
        console.log("Couldn't exit fullscreen.");
      }
    } else {
      swapClass(this.fullscreen, "deactive", "active");
      try {
        this.player.requestFullscreen();
      } catch {
        console.log("Couldn't go fullscreen.");
      }
    }
  }
  // Changing the current playing time
  changeCurrentTime(rate) {
    this.progress.style.width = rate * 100 + "%";
    this.video.currentTime = Math.round(rate * this.duration);
  }
  updateTimeIndicator() {
    this.progress.style.width =
      (this.video.currentTime / this.duration) * 100 + "%";

    this.progressDuration.innerHTML = this.formatTime(this.video.currentTime);
  }
  progressHover(rate) {
    if (!this.isThumbLoaded) {
      return;
    }
    let newThumbPose = Math.floor(rate * 36);
    if (this.thumbPose !== newThumbPose) {
      this.thumbPose = newThumbPose;

      let tPoseX, tPoseY;
      if (this.thumbPose < 6) {
        tPoseX = this.thumbPose * this.thumbWidth;
        tPoseY = 0;
      } else {
        tPoseX = (this.thumbPose % 6) * this.thumbWidth;
        tPoseY = Math.floor(this.thumbPose / 6) * this.thumbHeight;
      }

      this.dynamicThumbnail.style.backgroundPositionX = "-" + tPoseX + "px";
      this.dynamicThumbnail.style.backgroundPositionY = "-" + tPoseY + "px";
    }
    this.pHover.style.left = rate * 100 + "%";
    this.pHover.dataset.time = this.formatTime(
      Math.round(rate * this.duration)
    );
  }

  hideControls() {
    this.controls.style.opacity = 0;
    this.topPannel.style.opacity = 0;
  }
  showControls() {
    this.controls.style.opacity = 1;
    this.topPannel.style.opacity = 1;
  }

  handleIndicator(status) {
    this.indicator.style.opacity = 1;
    if (status === "play") {
      swapClass(this.indicator, "paused", "playing");
    } else if (status === "pause") {
      swapClass(this.indicator, "playing", "paused");
    }
    if (this.indicatorTimeout) {
      clearTimeout(this.indicatorTimeout);
    }
    this.indicatorTimeout = setTimeout(() => {
      this.indicator.style.opacity = 0;
    }, 2000);

    // Top bar
    if (status === "play") {
      swapClass(this.playpause, "paused", "playing");
    } else if (status === "pause") {
      swapClass(this.playpause, "playing", "paused");
    }
  }

  formatTime(seconds) {
    let html = "";
    let hour = Math.floor(seconds / 3600);
    let min = Math.floor((seconds % 3600) / 60);
    let sec = Math.floor(seconds % 60);
    if (hour) {
      html += hour + ":";
    }
    html += min < 10 ? "0" + min + ":" : min + ":";
    html += sec < 10 ? "0" + sec : sec;
    return html;
  }

  setMdAction(element, theAction, callback = null) {
    // Set mousedown action
    element.addEventListener("mousedown", (ev) => {
      this.action = theAction;
      if (callback !== null) {
        callback(ev);
      }
    });
  }
}

const drsPlayers = document.querySelectorAll(".drs-player");
drsPlayers.forEach((player) => {
  new VideoPlayer(player);
});

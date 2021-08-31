# Guide

1. This video player uses [Google Material Icons](https://fonts.google.com/icons). Any of the icon sets can be used.
2. Add CSS file.
3. Add JS file.

```html
<link
  href="https://fonts.googleapis.com/icon?family=Material+Icons+Round"
  rel="stylesheet"
/>
<link rel="stylesheet" href="css/drs-player.css" />
<script src="js/drs-player.js" defer></script>
```

4. Finally add the video element inside a container with the **class** of `drs-player`.

```html
<div class="drs-player">
  <video controls data-thumbnail="Video Thumbnail.webp">
    <source src="Video.mp4" type="video/mp4" />
  </video>
</div>
```

## To Do

- [x] PiP
- [ ] Zoom ?!

This project is licensed under the terms of the **GNU General Public License v3.0** license.

# ffprobe-duration

Yet another NodeJS module that retrieves the duration of video/audio assets.

**Note:** Requires [ffprobe] binary installed and accessible via CLI.

## Install

```sh
$ npm install --save ffprobe-duration
```

### Usage

```js
const getDuration = require('ffprobe-duration');

const duration = await getDuration('http://distribution.bbb3d.renderfarming.net/video/mp4/bbb_sunflower_1080p_30fps_normal.mp4');

console.log('Duration:', duration);
```

### CLI

```sh
duration http://distribution.bbb3d.renderfarming.net/video/mp4/bbb_sunflower_1080p_30fps_normal.mp4
```

[ffprobe]: https://ffmpeg.org/ffprobe.html

# 🗣️Text to Speech

Plugin for [Obsidian](https://obsidian.md)

![GitHub manifest.json dynamic (path)](https://shields.io/github/manifest-json/minAppVersion/joethei/obsidian-tts?label=lowest%20supported%20app%20version)
[![libera manifesto](https://shields.io/badge/libera-manifesto-lightgrey.svg)](https://liberamanifesto.com)
---
Features:

- Start playback for note from statusbar and ribbon
- Only speaking selected text in edit mode:
  ![Selection Demo](https://i.joethei.space/Obsidian_rjttPsYPwj.png)
- usable with other plugins (currently [RSS Reader](https://github.com/joethei/obsidian-rss))

You can create language specific voices,
the plugin will try to identify the language used.
If it is not identified correctly you can overwrite this behaviour
by having
`lang: {languageCode}`
in the [Frontmatter](https://help.obsidian.md/Advanced+topics/YAML+front+matter). The language code can be seen in the
settings and is a two letter [ISO 639-1](https://www.loc.gov/standards/iso639-2/php/English_list.php) code.

This plugin will **NOT** work on android due
to [this bug in the Webview](https://bugs.chromium.org/p/chromium/issues/detail?id=487255).

## Adding languages

This plugin uses the native API of your Operating System, to add a new language reference the documentation accordingly:

- [Windows 10](https://support.microsoft.com/en-us/topic/how-to-download-text-to-speech-languages-for-windows-10-d5a6b612-b3ae-423f-afa5-4f6caf1ec5d3)
- [MacOS](https://support.apple.com/guide/mac-help/change-the-system-language-mh26684/mac)
- [iOS](https://support.apple.com/guide/iphone/change-the-language-and-region-iphce20717a3/ios)

<!--- [Android](https://support.google.com/accessibility/android/answer/6006983?hl=en)-->

## Installing the plugin

- `Settings > Community plugins > Community plugins > Browse` and search for `Text to Speech`

## API

You can use this plugins API to add Text to Speech capabilities to your plugin.

This uses the [@vanakat/plugin-api](https://www.npmjs.com/package/@vanakat/plugin-api) package.

```js
const tts = pluginApi('tts');
await tts.say(title, text, language);
tts.pause();
tts.resume();
tts.stop();
tts.isSpeaking();
tts.isPaused();
```

| Method | Description |
|---|---|
| `say(title: string, text: string, languageCode?: string): Promise<void>` | Speak a text. Markdown is cleaned up according to the user's settings. The title is spoken first if the user enabled that, pass an empty string to skip it. `languageCode` is an [ISO 639-1](https://www.loc.gov/standards/iso639-2/php/English_list.php) code like `en`. If you leave it out, the language is detected from the text. When something is already playing, the text is queued. |
| `pause(): void` | Pause playback. |
| `resume(): void` | Resume paused playback. |
| `stop(): void` | Stop playback and clear the queue. |
| `isSpeaking(): boolean` | Whether something is playing, also `true` while paused. |
| `isPaused(): boolean` | Whether playback is paused. |

The type definitions are in [`src/ServiceManager.ts`](src/ServiceManager.ts) (`TTSApi`).

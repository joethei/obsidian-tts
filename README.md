# Text to Speech
Plugin for [Obsidian](https://obsidian.md)

![GitHub package.json version](https://img.shields.io/github/package-json/v/joethei/obsidian-tts)
![GitHub manifest.json dynamic (path)](https://img.shields.io/github/manifest-json/minAppVersion/joethei/obsidian-tts?label=lowest%20supported%20app%20version)
![GitHub](https://img.shields.io/github/license/joethei/obsidian-tts)
[![libera manifesto](https://img.shields.io/badge/libera-manifesto-lightgrey.svg)](https://liberamanifesto.com)
---

You can create language specific voices, which will be used when you have a note
with
```lang: {language name}```
in the [Frontmatter](https://help.obsidian.md/Advanced+topics/YAML+front+matter).


This plugin will not work on android due to [this bug in the Webview](https://bugs.chromium.org/p/chromium/issues/detail?id=487255).


## Adding languages
This plugin uses the native API of your Operating System,
to add a new language reference the documentation accordingly:
- [Windows 10](https://support.microsoft.com/en-us/topic/how-to-download-text-to-speech-languages-for-windows-10-d5a6b612-b3ae-423f-afa5-4f6caf1ec5d3)
- [MacOS](https://support.apple.com/guide/mac-help/change-the-system-language-mh26684/mac)
- [iOS](https://support.apple.com/guide/iphone/change-the-language-and-region-iphce20717a3/ios)
<!--- [Android](https://support.google.com/accessibility/android/answer/6006983?hl=en)-->

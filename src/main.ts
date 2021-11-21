import {
    MarkdownView, Menu, Notice, parseYaml, Platform,
    Plugin
} from 'obsidian';
import {DEFAULT_SETTINGS, TTSSettings, TTSSettingsTab} from "./settings";


export default class TTSPlugin extends Plugin {
    settings: TTSSettings;
    statusbar: HTMLElement;

    async onload(): Promise<void> {
        console.log("loading tts plugin");

        //https://bugs.chromium.org/p/chromium/issues/detail?id=487255
        if (Platform.isAndroidApp) {
            new Notice("TTS: due to a bug in android this plugin does not work on this platform");
            this.unload();
        }

        await this.loadSettings();

        this.addCommand({
            id: 'start-tts-playback',
            name: 'Start playback',
            checkCallback: (checking: boolean) => {
                const markdownView = this.app.workspace.getActiveViewOfType(MarkdownView);
                if (markdownView) {
                    if (!checking) {
                        this.play(markdownView);
                    }
                    return true;
                }
            }
        });

        //clear statusbar text if not speaking
        this.registerInterval(window.setInterval(() => {
            if (!window.speechSynthesis.speaking) {
                this.statusbar.setText("TTS");
            }
        }, 1000 * 10));

        this.addCommand({
            id: 'cancel-tts-playback',
            name: 'Stop playback',
            checkCallback: (checking: boolean) => {
                if (window.speechSynthesis.speaking) {
                    if (!checking) {
                        window.speechSynthesis.cancel();
                    }
                    return true;
                }
            }
        });

        this.addCommand({
            id: 'pause-tts-playback',
            name: 'pause playback',
            checkCallback: (checking: boolean) => {
                if (window.speechSynthesis.speaking) {
                    if (!checking) {
                        window.speechSynthesis.pause();
                    }
                    return true;
                }
            }
        });

        this.addCommand({
            id: 'resume-tts-playback',
            name: 'Resume playback',
            checkCallback: (checking: boolean) => {
                if (window.speechSynthesis.speaking) {
                    if (!checking) {
                        window.speechSynthesis.resume();
                    }
                    return true;
                }
            }
        });

        this.addRibbonIcon("audio-file", "Text to Speech", async () => {
            const markdownView = this.app.workspace.getActiveViewOfType(MarkdownView);
            if (markdownView)
                await this.play(markdownView);
            else new Notice("No file active");
        });

        this.addSettingTab(new TTSSettingsTab(this));
        this.statusbar = this.addStatusBarItem();
        this.statusbar.setText("TTS");
        this.statusbar.classList.add("mod-clickable");
        this.statusbar.setAttribute("aria-label", "Text to Speech");
        this.statusbar.setAttribute("aria-label-position", "top");
        this.statusbar.onClickEvent(async (event) => {
            const menu = new Menu(this.app);

            const markdownView = this.app.workspace.getActiveViewOfType(MarkdownView);
            if (markdownView) {
                if (window.speechSynthesis.speaking) {
                    menu.addItem((item) => {
                        item
                            .setIcon("play-audio-glyph")
                            .setTitle("Add to playback queue")
                            .onClick((async () => {
                                await this.play(markdownView);
                            }));
                    });
                } else {
                    menu.addItem((item) => {
                        item
                            .setIcon("play-audio-glyph")
                            .setTitle("Play")
                            .onClick((async () => {
                                await this.play(markdownView);
                            }));
                    });
                }
            }

            if (window.speechSynthesis.speaking) {
                menu.addItem((item) => {
                    item
                        .setIcon("stop-audio-glyph")
                        .setTitle("Stop")
                        .onClick(async () => {
                            window.speechSynthesis.cancel();
                        });
                });


                if (window.speechSynthesis.paused) {
                    menu.addItem((item) => {
                        item
                            .setIcon("play-audio-glyph")
                            .setTitle("Resume")
                            .onClick(async () => {
                                window.speechSynthesis.resume();
                            });
                    });
                } else {
                    menu.addItem((item) => {
                        item
                            .setIcon("paused")
                            .setTitle("Pause")
                            .onClick(async () => {
                                window.speechSynthesis.pause();
                            });
                    });
                }
            }


            menu.showAtPosition({x: event.x, y: event.y});
        });
    }

    async playText(text: string, voice?: string): Promise<void> {
        const configuredVoice = (voice) ? voice : this.settings.defaultVoice;
        const msg = new SpeechSynthesisUtterance();
        msg.text = text;
        msg.volume = this.settings.volume;
        msg.rate = this.settings.rate;
        msg.pitch = this.settings.pitch;
        msg.voice = window.speechSynthesis.getVoices().filter(voice => voice.name === configuredVoice)[0];
        window.speechSynthesis.speak(msg);
    }

    async play(view: MarkdownView): Promise<void> {
        let content = view.getViewData();
        let language: string;

        //check if any language is defined in frontmatter
        const frontmatter = content.match(/---[\s\S]*?---/);
        if (frontmatter && frontmatter[0]) {
            const parsedFrontmatter = parseYaml(frontmatter[0].replace(/---/g, ''));
            if (parsedFrontmatter['lang']) {
                language = parsedFrontmatter['lang'];
            }
        }

        if (!this.settings.speakFrontmatter)
            if (content.startsWith("---")) {
                content = content.replace("---", "");
                content = content.substring(content.indexOf("---") + 1);
            }

        if (!this.settings.speakSyntax) {
            content = content.replace(/#/g, "");
            content = content.replace("-", "");
            content = content.replace("_", "");
        }
        if (!this.settings.speakLinks) {
            content = content.replace(/(?:https?|ftp|file|data:):\/\/[\n\S]+/g, '');
        }
        if (this.settings.speakTitle) {
            content = view.getDisplayText() + content;
        }

        if (language != undefined) {
            const entry = this.settings.languageVoices.filter(item => item.language == language)[0];
            if (!entry) {
                new Notice("TTS: could not find voice for language " + language);
                return;
            }
            await this.playText(content, entry.voice);
        } else {
            await this.playText(content);
        }

        this.statusbar.setText("TTS: playing");
    }

    async onunload(): Promise<void> {
        console.log("unloading tts plugin");
    }

    async loadSettings(): Promise<void> {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    }

    async saveSettings(): Promise<void> {
        await this.saveData(this.settings);
    }
}

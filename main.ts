import {
    MarkdownView, Menu,
    Plugin,
    PluginSettingTab,
    Setting
} from 'obsidian';


interface TTSSettings {
    voice: string,
    pitch: number;
    rate: number;
    volume: number;
    speakLinks: boolean;
    speakFrontmatter: boolean;
    speakSyntax: boolean;
}

const DEFAULT_SETTINGS: TTSSettings = {
    voice: "",
    pitch: 1,
    rate: 1,
    volume: 1,
    speakLinks: false,
    speakFrontmatter: false,
    speakSyntax: false
}

export default class TTSPlugin extends Plugin {
    settings: TTSSettings;
    statusbar: HTMLElement;

    async onload() {
        console.log("loading tts plugin");
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

        this.registerInterval(window.setInterval(() => {
            if (!window.speechSynthesis.speaking) {
                this.statusbar.setText("TTS");
            }
        }, 1000 * 60));

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

        this.addSettingTab(new TTSSettingsTab(this));
        this.statusbar = this.addStatusBarItem();
        this.statusbar.setText("TTS");
        this.statusbar.onClickEvent(async (event) => {
            const menu = new Menu(this.app);

            const markdownView = this.app.workspace.getActiveViewOfType(MarkdownView);
            if (markdownView) {
                menu.addItem((item) => {
                    item
                        .setIcon("play-audio-glyph")
                        .setTitle("Play")
                        .onClick((async () => {
                            await this.play(markdownView);
                        }));
                });
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

    async play(view: MarkdownView) {
        let content = view.getViewData();

        if (!this.settings.speakFrontmatter)
            if (content.startsWith("---")) {
                content = content.replace("---", "");
                content = content.substring(content.indexOf("---"));
            }

        if (!this.settings.speakSyntax) {
            content = content.replace(/#/g, "");
            content = content.replace("-", "");
            content = content.replace("_", "");
        }
        if (!this.settings.speakLinks) {
            content = content.replace(/(?:https?|ftp|file):\/\/[\n\S]+/g, '');
        }

        const msg = new SpeechSynthesisUtterance();
        msg.text = content;
        msg.volume = this.settings.volume;
        msg.rate = this.settings.rate;
        msg.pitch = this.settings.pitch;
        msg.voice = window.speechSynthesis.getVoices().filter(voice => voice.name == this.settings.voice)[0];
        window.speechSynthesis.speak(msg);

        this.statusbar.setText("TTS: " + view.getDisplayText());

    }

    async onunload() {
        console.log("unloading tts plugin");
    }

    async loadSettings() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    }

    async saveSettings() {
        await this.saveData(this.settings);
    }
}

class TTSSettingsTab extends PluginSettingTab {
    plugin: TTSPlugin;

    constructor(plugin: TTSPlugin) {
        super(plugin.app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const {containerEl} = this;

        containerEl.empty();

        containerEl.createEl('h2', {text: 'Text to Speech'});

        new Setting(containerEl)
            .setName("Voice")
            .addDropdown(async (dropdown) => {
                const voices = window.speechSynthesis.getVoices();
                for (const voice of voices) {
                    dropdown.addOption(voice.name, voice.lang + " " + voice.name);
                }
                dropdown
                    .setValue(this.plugin.settings.voice)
                    .onChange(async (value) => {
                        this.plugin.settings.voice = value;
                        await this.plugin.saveSettings();
                    });
            });

        new Setting(containerEl)
            .setName("Volume")
            .addSlider(async (slider) => {
                slider
                    .setValue(this.plugin.settings.volume * 100)
                    .setDynamicTooltip()
                    .setLimits(0, 100, 1)
                    .onChange(async (value: number) => {
                        this.plugin.settings.volume = value / 100;
                        await this.plugin.saveSettings();
                    });
            }).addExtraButton((button) => {
            button
                .setIcon('reset')
                .setTooltip('restore default')
                .onClick(async () => {
                    this.plugin.settings.volume = DEFAULT_SETTINGS.volume;
                    await this.plugin.saveSettings();
                    this.display();
                });
        });

        new Setting(containerEl)
            .setName("Rate")
            .setDesc("how fast the text will be spoken")
            .addSlider(async (slider) => {
                slider
                    .setValue(this.plugin.settings.rate)
                    .setDynamicTooltip()
                    .setLimits(0.1, 10, 0.1)
                    .onChange(async (value: number) => {
                        this.plugin.settings.rate = value;
                        await this.plugin.saveSettings();
                    });
            }).addExtraButton((button) => {
            button
                .setIcon('reset')
                .setTooltip('restore default')
                .onClick(async () => {
                    this.plugin.settings.rate = DEFAULT_SETTINGS.rate;
                    await this.plugin.saveSettings();
                    this.display();
                });
        });

        new Setting(containerEl)
            .setName("Pitch")
            .addSlider(async (slider) => {
                slider
                    .setValue(this.plugin.settings.pitch)
                    .setDynamicTooltip()
                    .setLimits(0, 2, 0.1)
                    .onChange(async (value: number) => {
                        this.plugin.settings.pitch = value;
                        await this.plugin.saveSettings();
                    });
            }).addExtraButton((button) => {
            button
                .setIcon('reset')
                .setTooltip('restore default')
                .onClick(async () => {
                    this.plugin.settings.pitch = DEFAULT_SETTINGS.pitch;
                    await this.plugin.saveSettings();
                    this.display();
                });
        });

        containerEl.createEl('h3', {text: 'Speak'});

        new Setting(containerEl)
            .setName("Frontmatter")
            .addToggle(async (toggle) => {
                toggle
                    .setValue(this.plugin.settings.speakFrontmatter)
                    .onChange(async (value) => {
                        this.plugin.settings.speakFrontmatter = value;
                        await this.plugin.saveSettings();
                    });
            });

        new Setting(containerEl)
            .setName("Links")
            .addToggle(async (toggle) => {
                toggle
                    .setValue(this.plugin.settings.speakLinks)
                    .onChange(async (value) => {
                        this.plugin.settings.speakLinks = value;
                        await this.plugin.saveSettings();
                    });
            });

        new Setting(containerEl)
            .setName("Syntax")
            .addToggle(async (toggle) => {
                toggle
                    .setValue(this.plugin.settings.speakSyntax)
                    .onChange(async (value) => {
                        this.plugin.settings.speakSyntax = value;
                        await this.plugin.saveSettings();
                    });
            });
    }
}

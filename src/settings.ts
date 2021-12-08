import {ButtonComponent, PluginSettingTab, Setting} from "obsidian";
import {TextInputPrompt} from "./TextInputPrompt";
import TTSPlugin from "./main";
import {LanguageVoiceModal} from "./LanguageVoiceModal";

export interface LanguageVoiceMap {
    language: string;
    voice: string;
}

export interface TTSSettings {
    defaultVoice: string,
    pitch: number;
    rate: number;
    volume: number;
    speakLinks: boolean;
    speakFrontmatter: boolean;
    speakSyntax: boolean;
	speakCodeblocks: boolean;
    speakTitle: boolean;
	speakEmoji: boolean;
    languageVoices: LanguageVoiceMap[];
	stopPlaybackWhenNoteChanges: boolean;
}

export const DEFAULT_SETTINGS: TTSSettings = {
    defaultVoice: "",
    pitch: 1,
    rate: 1,
    volume: 1,
    speakLinks: false,
    speakFrontmatter: false,
    speakSyntax: false,
    speakTitle: true,
	speakCodeblocks: false,
	speakEmoji: false,
    languageVoices: [],
	stopPlaybackWhenNoteChanges: false,
}

export class TTSSettingsTab extends PluginSettingTab {
    plugin: TTSPlugin;

    constructor(plugin: TTSPlugin) {
        super(plugin.app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const {containerEl} = this;

        containerEl.empty();

        containerEl.createEl('h2', {text: 'Text to Speech - Settings'});

        new Setting(containerEl)
            .setName("Default voice")
            .addDropdown(async (dropdown) => {
                const voices = window.speechSynthesis.getVoices();
                for (const voice of voices) {
                    dropdown.addOption(voice.name, voice.name);
                }
                dropdown
                    .setValue(this.plugin.settings.defaultVoice)
                    .onChange(async (value) => {
                        this.plugin.settings.defaultVoice = value;
                        await this.plugin.saveSettings();
                    });
            }).addExtraButton(button => {
            button
                .setIcon("play-audio-glyph")
                .setTooltip("Test voice")
                .onClick(async () => {
                    const input = new TextInputPrompt(this.app, "What do you want to hear?", "", "Hello world this is Text to speech running in obsidian", "Hello world this is Text to speech running in obsidian");
                    await input.openAndGetValue((async value => {
                        if (value.getValue().length === 0) return;
                        await this.plugin.ttsService.say('', value.getValue());
                    }));


                });
        });

        containerEl.createEl("h3", {text: "Language specific voices"});

        new Setting(containerEl)
            .setName("Add New")
            .setDesc("Add a new language specific voice")
            .addButton((button: ButtonComponent): ButtonComponent => {
                return button
                    .setTooltip("add new language specific voice")
                    .setIcon("create-new")
                    .onClick(async () => {
                        const modal = new LanguageVoiceModal(this.plugin);

                        modal.onClose = async () => {
                            if (modal.saved) {
                                this.plugin.settings.languageVoices.push({
                                    language: modal.language,
                                    voice: modal.voice
                                });
                                await this.plugin.saveSettings();

                                this.display();
                            }
                        };

                        modal.open();
                    });
            });

        const additionalContainer = containerEl.createDiv("tts-languages");

        const voicesDiv = additionalContainer.createDiv("voices");
        for (const languageVoice of this.plugin.settings.languageVoices) {

			//@ts-ignore
			const displayNames = new Intl.DisplayNames([languageVoice.language], {type: 'language', fallback: 'none'});
			const setting = new Setting(voicesDiv);
			setting.setName(displayNames.of(languageVoice.language) + " -  " + languageVoice.language);
            setting.setDesc(languageVoice.voice);

            setting
                .addExtraButton((b) => {
                    b.setIcon("pencil")
                        .setTooltip("Edit")
                        .onClick(() => {
                            const modal = new LanguageVoiceModal(this.plugin, languageVoice);

                            modal.onClose = async () => {
                                if (modal.saved) {
                                    this.display();
                                }
                            };

                            modal.open();
                        });
                })
                .addExtraButton((b) => {
                    b.setIcon("trash")
                        .setTooltip("Delete")
                        .onClick(async () => {

                            this.display();
                        });
                });


        }

        containerEl.createEl("h3", {text: "Audio settings"});

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
            .setName("Title")
            .addToggle(async (toggle) => {
                toggle
                    .setValue(this.plugin.settings.speakTitle)
                    .onChange(async (value) => {
                        this.plugin.settings.speakTitle = value;
                        await this.plugin.saveSettings();
                    });
            });

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
			.setName("Codeblocks")
			.addToggle(async (toggle) => {
				toggle
					.setValue(this.plugin.settings.speakCodeblocks)
					.onChange(async (value) => {
						this.plugin.settings.speakCodeblocks = value;
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

		new Setting(containerEl)
			.setName("Emoji")
			.addToggle(async (toggle) => {
				toggle
					.setValue(this.plugin.settings.speakEmoji)
					.onChange(async (value) => {
						this.plugin.settings.speakEmoji = value;
						await this.plugin.saveSettings();
					});
			});

		containerEl.createEl("h2", {text: "Misc"});
		new Setting(containerEl)
			.setName("Stop playback when a note is closed/new note is opened")
			.addToggle(async (toggle) => {
				toggle
					.setValue(this.plugin.settings.stopPlaybackWhenNoteChanges)
					.onChange(async (value) => {
						this.plugin.settings.stopPlaybackWhenNoteChanges = value;
						await this.plugin.saveSettings();
					});
			});
    }
}

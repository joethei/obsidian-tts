import {ButtonComponent, PluginSettingTab, Setting, SettingGroup} from "obsidian";
import {TextInputPrompt} from "./TextInputPrompt";
import TTSPlugin from "./main";
import {LanguageVoiceModal} from "./LanguageVoiceModal";

export interface LanguageVoiceMap {
	id: string;
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
	speakComments: boolean;
    languageVoices: LanguageVoiceMap[];
	stopPlaybackWhenNoteChanges: boolean;
	services: {
		openai: {
			key: string;
		}
	}
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
	speakComments: false,
    languageVoices: [],
	stopPlaybackWhenNoteChanges: false,
	services: {
		openai: {
			key: '',
		}
	}
}

export class TTSSettingsTab extends PluginSettingTab {
    plugin: TTSPlugin;
	icon = 'volume-2';

    constructor(plugin: TTSPlugin) {
        super(plugin.app, plugin);
        this.plugin = plugin;
    }

    async display(): Promise<void> {
        const {containerEl} = this;

        containerEl.empty();

        new Setting(containerEl)
            .setName("Default voice")
            .addDropdown(async (dropdown) => {
				const voices = [];
				const services = this.plugin.serviceManager.getServices();
				for (const service of services) {
					if (service.isConfigured() && service.isValid()) {
						for (const voice of await service.getVoices()) {
							voices.push({
								serviceId: service.id,
								serviceName: service.name,
								id: voice.id,
								name: voice.name,
								languages: voice.languages
							});
						}
					}
				}

                for (const voice of voices) {
                    //dropdown.addOption(`${voice.serviceId}-${voice.id}`, `${voice.serviceName}: ${voice.name}`);
					dropdown.addOption(`${voice.serviceId}-${voice.id}`, `${voice.name}`);
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
                        await this.plugin.serviceManager.sayWithVoice(value.getValue(), this.plugin.settings.defaultVoice);
                    }));


                });
        });

		/*new Setting(containerEl)
			.setName("Services")
			.setHeading();

		new Setting(containerEl)
			.setName("New service")
			.setDesc("Configure new service")
			.addButton((button: ButtonComponent): ButtonComponent => {
				return button
					.setTooltip("Configure new service")
					.setIcon("plus")
					.onClick(() => {
						new ServiceConfigurationModal(this.plugin).open();
					});
			});*/

		const voicesGroup = new SettingGroup(containerEl)
			.setHeading('Language specific voices')
			.addSetting(setting =>
				setting
					.setName('Add new')
					.setDesc('Add a new language specific voice')
					.addButton((button: ButtonComponent): ButtonComponent => {
						return button
							.setTooltip("add new language specific voice")
							.setIcon("plus")
							.onClick(async () => {
								const modal = new LanguageVoiceModal(this.plugin);

								modal.onClose = async () => {
									if (modal.saved) {
										this.plugin.settings.languageVoices.push({
											id: modal.id,
											language: modal.language,
											voice: modal.voice
										});
										await this.plugin.saveSettings();

										await this.display();
									}
								};

								modal.open();
							});
					})


			);

        for (const languageVoice of this.plugin.settings.languageVoices) {

			//@ts-ignore
			const displayNames = new Intl.DisplayNames([languageVoice.language], {type: 'language', fallback: 'none'});
			voicesGroup.addSetting(setting => {
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
										const setting = this.plugin.settings.languageVoices.filter(value => value.language !== modal.language);
										setting.push({id: modal.id, language: modal.language, voice: modal.voice});
										this.plugin.settings.languageVoices = setting;
										await this.plugin.saveSettings();

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
								this.plugin.settings.languageVoices = this.plugin.settings.languageVoices.filter(value => value.language !== languageVoice.language);
								await this.plugin.saveSettings();

								this.display();
							});
					});
			});

        }

		new SettingGroup(containerEl)
			.setHeading('Audio')
			.addSetting(setting => {
				setting
					.setName('Volume')
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
			})
			.addSetting(setting => {
				setting
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
			})
			.addSetting(setting => {
				setting
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
			});

		new SettingGroup(containerEl)
			.setHeading('Speak')
			.addSetting(setting => {
				setting
					.setName('Title')
					.addToggle(async (toggle) => {
						toggle
							.setValue(this.plugin.settings.speakTitle)
							.onChange(async (value) => {
								this.plugin.settings.speakTitle = value;
								await this.plugin.saveSettings();
							});
					});
			})
			.addSetting(setting => {
				setting
					.setName("Frontmatter")
					.addToggle(async (toggle) => {
						toggle
							.setValue(this.plugin.settings.speakFrontmatter)
							.onChange(async (value) => {
								this.plugin.settings.speakFrontmatter = value;
								await this.plugin.saveSettings();
							});
					});
			})
			.addSetting(setting => {
				setting
					.setName("Links")
					.addToggle(async (toggle) => {
						toggle
							.setValue(this.plugin.settings.speakLinks)
							.onChange(async (value) => {
								this.plugin.settings.speakLinks = value;
								await this.plugin.saveSettings();
							});
					});
			})
			.addSetting(setting => {
				setting
				.setName("Codeblocks")
						.addToggle(async (toggle) => {
							toggle
								.setValue(this.plugin.settings.speakCodeblocks)
								.onChange(async (value) => {
									this.plugin.settings.speakCodeblocks = value;
									await this.plugin.saveSettings();
								});
						});
			})
			.addSetting(setting => {
				setting
					.setName("Comments")
					.addToggle(async (toggle) => {
						toggle
							.setValue(this.plugin.settings.speakComments)
							.onChange(async (value) => {
								this.plugin.settings.speakComments = value;
								await this.plugin.saveSettings();
							});
					});
			})
			.addSetting(setting => {
				setting
					.setName("Syntax")
					.addToggle(async (toggle) => {
						toggle
							.setValue(this.plugin.settings.speakSyntax)
							.onChange(async (value) => {
								this.plugin.settings.speakSyntax = value;
								await this.plugin.saveSettings();
							});
					});
			})
			.addSetting(setting => {
				setting
					.setName("Emoji")
					.addToggle(async (toggle) => {
						toggle
							.setValue(this.plugin.settings.speakEmoji)
							.onChange(async (value) => {
								this.plugin.settings.speakEmoji = value;
								await this.plugin.saveSettings();
							});
					});
			});

		new SettingGroup(containerEl)
			.setHeading('Misc')
			.addSetting(setting => {
				setting
					.setName("Stop playback when a note is closed/new note is opened")
					.addToggle(async (toggle) => {
						toggle
							.setValue(this.plugin.settings.stopPlaybackWhenNoteChanges)
							.onChange(async (value) => {
								this.plugin.settings.stopPlaybackWhenNoteChanges = value;
								await this.plugin.saveSettings();
							});
					});
			});
    }
}

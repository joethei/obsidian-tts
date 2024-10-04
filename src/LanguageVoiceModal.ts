import {Modal, Setting} from "obsidian";
import { LanguageVoiceMap } from "./DEFAULT_SETTINGS";
import {TextInputPrompt} from "./TextInputPrompt";
import TTSPlugin from "./main";
import languages from "@cospired/i18n-iso-languages";

export class LanguageVoiceModal extends Modal {
    plugin: TTSPlugin;
	id: string;
    language: string;
    voice: string;

    saved: boolean;

    constructor(plugin: TTSPlugin, map?: LanguageVoiceMap) {
        super(plugin.app);
        this.plugin = plugin;

        if(map) {
			this.id = map.id;
            this.language = map.language;
            this.voice = map.voice;
        }
    }

    async display() : Promise<void> {
        const { contentEl } = this;

		const voices = await this.plugin.serviceManager.getVoices();

        contentEl.empty();

        //not know to rollup and webstorm, but exists in obsidian
        //@ts-ignore
        const languageNames = new Intl.DisplayNames(['en'], {type: 'language'});

        new Setting(contentEl)
            .setName("Language")
            .addDropdown(async (dropdown) => {

                for (const languageCodeKey in languages.getAlpha2Codes()) {
                    //@ts-ignore
                    const displayNames = new Intl.DisplayNames([languageCodeKey], {type: 'language', fallback: 'none'});
                    if(displayNames) {
                        const name = displayNames.of(languageCodeKey);
                        if(name) {
                            dropdown.addOption(languageCodeKey, name);
                        }
                    }
                }

                dropdown
                    .setValue(this.language)
                    .onChange((value) => {
                       this.language = value;
                    });
            });

        new Setting(contentEl)
            .setName("Voice")
            .addDropdown(async (dropdown) => {
                for (const voice of voices) {
                    dropdown.addOption(voice.service + "-" + voice.id, voice.name + " - " + languageNames.of(voice.languages[0]));
                }
                dropdown
                    .setValue(this.id)
                    .onChange(async (value) => {
                        this.id = value;
						this.voice = voices.filter(voice => voice.service + "-" + voice.id === value).first().name;
                    });
            }).addExtraButton(button => {
            button
                .setIcon("play-audio-glyph")
                .setTooltip("Test voice")
                .onClick(async() => {
                    const input = new TextInputPrompt(this.app, "What do you want to hear?", "", "Hello world this is Text to speech running in obsidian", "Hello world this is Text to speech running in obsidian");
                    await input.openAndGetValue((async value => {
                        if (value.getValue().length === 0) return;
                        await this.plugin.serviceManager.sayWithVoice(value.getValue(), this.id);
                    }));


                });
        });


        const footerEl = contentEl.createDiv();
        const footerButtons = new Setting(footerEl);
        footerButtons.addButton((b) => {
            b.setTooltip("Save")
                .setIcon("checkmark")
                .onClick(async () => {
                    this.saved = true;
                    this.close();
                });
            return b;
        });
        footerButtons.addExtraButton((b) => {
            b.setIcon("cross")
                .setTooltip("Cancel")
                .onClick(() => {
                    this.saved = false;
                    this.close();
                });
            return b;
        });
    }

    async onOpen() : Promise<void> {
        await this.display();
    }
}

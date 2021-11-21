import {Modal, Setting} from "obsidian";
import {LanguageVoiceMap} from "./settings";
import {TextInputPrompt} from "./TextInputPrompt";
import TTSPlugin from "./main";

export class LanguageVoiceModal extends Modal {
    plugin: TTSPlugin;
    language: string;
    voice: string;

    saved: boolean;

    constructor(plugin: TTSPlugin, map?: LanguageVoiceMap) {
        super(plugin.app);
        this.plugin = plugin;

        if(map) {
            this.language = map.language;
            this.voice = map.voice;
        }
    }

    async display() : Promise<void> {
        const { contentEl } = this;

        contentEl.empty();

        new Setting(contentEl)
            .setName("Language")
            .setDesc("what name this will be referenced by in frontmatter")
            .addText((text) => {
                text.setValue(this.language)
                    .onChange((value) => {
                        this.language = value;
                    });
            });

        new Setting(contentEl)
            .setName("Voice")
            .addDropdown(async (dropdown) => {
                const voices = window.speechSynthesis.getVoices();
                for (const voice of voices) {
                    dropdown.addOption(voice.name, voice.lang + " " + voice.name);
                }
                dropdown
                    .setValue(this.voice)
                    .onChange(async (value) => {
                        this.voice = value;
                    });
            }).addExtraButton(button => {
            button
                .setIcon("play-audio-glyph")
                .setTooltip("Test voice")
                .onClick(async() => {
                    const input = new TextInputPrompt(this.app, "What do you want to hear?", "", "Hello world this is Text to speech running in obsidian", "Hello world this is Text to speech running in obsidian");
                    await input.openAndGetValue((async value => {
                        if (value.getValue().length === 0) return;
                        await this.plugin.playText(value.getValue(), this.voice);
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

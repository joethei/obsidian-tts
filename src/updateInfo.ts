import { App, Modal } from "obsidian";
import TTSPlugin from "./main";

export class TTSPluginUpdateInfo extends Modal {
    plugin: TTSPlugin;
    constructor(app: App, plugin: TTSPlugin) {
        super(app);
        this.plugin = plugin;
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.empty();
        contentEl.createEl("h1", { text: "text to speech plugin update" });
        contentEl.createEl("h4", { text: "What's new:" });
        const content = `
            <p>Only 2 commands available now. Play and Stop.</p>
            <p>Play is assuming 3 functions:</p>
            <ul>
            <li>Play from the start of the current note  or selection</li>
            </ul>
            <p>then</p>
            <ul>
            <li>Pause</li>
            <li>Resume from where you paused</li>
            </ul>
        `;
        contentEl.createDiv("", (el: HTMLDivElement) => {
            el.innerHTML = content;
        });
    }

    async onClose() {
        const { contentEl } = this;
        contentEl.empty();
        this.plugin.settings.savedVersion = this.plugin.manifest.version;
        await this.plugin.saveSettings();
    }
}
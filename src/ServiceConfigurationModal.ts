import {Modal, Setting} from "obsidian";
import TTSPlugin from "./main";
import {DEFAULT_SETTINGS, STYLE_OPTIONS, ROLE_OPTIONS, SERVICE_OPTIONS} from "./constants";

export class ServiceConfigurationModal extends Modal {
	plugin: TTSPlugin;
	service: string;

	constructor(plugin: TTSPlugin, service?: string) {
		super(plugin.app);
		this.plugin = plugin;
		this.service = service || '';
	}

	display(service?: string): void {

		const { contentEl } = this;

		contentEl.empty();

		if (!service) {
			new Setting(contentEl)
				.setName('Service')
				.setDesc('Add a remote voice service')
				.addDropdown((dropdown) => {
					Object.entries(SERVICE_OPTIONS).forEach(([key, value]) => {
						dropdown.addOption(key, value);
					});

					dropdown.setValue(service);

					dropdown.onChange(async(value) => {
						this.display(value);
					})
				});
		}

		if (service === 'openai') {
			new Setting(contentEl)
				.setName('API Key')
				.setDesc('API key for OpenAI')
				.addText(async text => {
					text
						.setValue(this.plugin.settings.services.openai.key)
						.onChange(async value => {
							this.plugin.settings.services.openai.key = value;
							await this.plugin.saveSettings();
					});
				});
		}

		if (service === 'azure') {
			new Setting(contentEl)
				.setName('API key')
				.setDesc('Azure speech services API key')
				.addText(async text => {
					text
						.setValue(this.plugin.settings.services.azure.key)
						.onChange(async value => {
							this.plugin.settings.services.azure.key = value;
							await this.plugin.saveSettings();
					});
				});
			new Setting(contentEl)
				.setName('Speech region')
				.setDesc('Azure speech services region')
				.addText(async text => {
					text
						.setValue(this.plugin.settings.services.azure.region)
						.onChange(async value => {
							this.plugin.settings.services.azure.region = value;
							await this.plugin.saveSettings();
					});
				});
			new Setting(contentEl)
				.setName('Role')
				.addDropdown((dropdown) => {
					Object.entries(ROLE_OPTIONS).forEach(([key, value]) => {
						dropdown.addOption(key, value);
					});

					dropdown.setValue(this.plugin.settings.services.azure.role);
					dropdown.onChange(async(value) => {
						this.plugin.settings.services.azure.role = value;
						await this.plugin.saveSettings();
					})
				});
			new Setting(contentEl)
				.setName('Style')
				.addDropdown((dropdown) => {
					Object.entries(STYLE_OPTIONS).forEach(([key, value]) => {
						dropdown.addOption(key, value);
					});

					dropdown.setValue(this.plugin.settings.services.azure.style);
					dropdown.onChange(async(value) => {
						this.plugin.settings.services.azure.style = value;
						await this.plugin.saveSettings();
					})
				});
			new Setting(contentEl)
				.setName("Intensity")
				.addSlider(async (slider) => {
					slider
						.setValue(this.plugin.settings.services.azure.intensity * 100)
						.setDynamicTooltip()
						.setLimits(0, 200, 1)
						.onChange(async (value: number) => {
							this.plugin.settings.services.azure.intensity = value / 100;
							await this.plugin.saveSettings();
						});
				}).addExtraButton((button) => {
				button
					.setIcon('reset')
					.setTooltip('restore default')
					.onClick(async () => {
						this.plugin.settings.services.azure.intensity = DEFAULT_SETTINGS.services.azure.intensity;
						await this.plugin.saveSettings();
						this.display();
					});
			});
		}
	}

	onOpen(): void {
		//@ts-ignore
		if (this.service) this.setTitle(`Configure ${SERVICE_OPTIONS[this.service]} service`);
		//@ts-ignore
		else this.setTitle('Add new service');
		this.display(this.service);
	}


}

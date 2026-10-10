import { mountBackground } from './clock-background';
import { getLanguage, isLanguage } from '../lib/language';

const controls = document.querySelector<HTMLElement>('#control-bar')!;
const row = document.createElement('div');
row.className = 'original-background-controls';
const button = document.createElement('button');
button.id = 'background-open'; button.type = 'button';
row.append(button); controls.prepend(row);
const languageSelect = document.querySelector<HTMLSelectElement>('#select-lang')!;
languageSelect.value = getLanguage();
languageSelect.dispatchEvent(new Event('change'));
const background = mountBackground(button, () => isLanguage(languageSelect.value) ? languageSelect.value : 'zh-CN');
languageSelect.addEventListener('change', background.render);

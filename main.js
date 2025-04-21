// ローカルストレージのキー
const STORAGE_KEY = "emojidic_data";

// splitChar関数をインポート
import { splitChar } from './split-char.js';

// 絵文字リストと読みのデータを管理するクラス
class EmojiDictionary {
	constructor() {
		this.data = this.loadFromStorage();
	}

	loadFromStorage() {
		const saved = localStorage.getItem(STORAGE_KEY);
		return saved ? JSON.parse(saved) : { emojis: [], readings: {} };
	}

	saveToStorage() {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
	}

	setEmojis(emojis) {
		this.data.emojis = [...new Set(emojis)];
		this.saveToStorage();
	}

	setReading(emoji, reading) {
		if (reading.trim() === "") {
			delete this.data.readings[emoji];
		} else {
			this.data.readings[emoji] = reading;
		}
		this.saveToStorage();
	}

	getReading(emoji) {
		return this.data.readings[emoji] || "";
	}

	generateDictionary() {
		let result = "// KAWASEMI-UTF16\n";
		for (const emoji of this.data.emojis) {
			const reading = this.data.readings[emoji];
			if (reading) {
				result += `${reading}\t${emoji}\t記号類\n`;
			}
		}
		result += `// ${this.data.emojis.length} 語書き出しました\n`;
		return result;
	}
}

// メインの処理
document.addEventListener("DOMContentLoaded", () => {
	const emojiList = document.getElementById("emoji-list");
	const inputArea = document.getElementById("input-area");
	const downloadButton = document.getElementById("download-button");
	const dictionary = new EmojiDictionary();
	let inputFields = []; // 入力フィールドの配列を保持

	// キーボードショートカットの処理
	document.addEventListener("keydown", (e) => {
		if ((e.ctrlKey || e.metaKey) && (e.key === "ArrowUp" || e.key === "ArrowDown")) {
			const currentIndex = inputFields.indexOf(document.activeElement);
			const currentValue = currentIndex !== -1 ? inputFields[currentIndex].value : "";

			// フォーカスがない場合は最初のinputにフォーカス
			if (currentIndex === -1) {
				inputFields[0].focus();
				return;
			}

			// 現在の状態と異なる入力フィールドを探す
			let nextIndex = -1;
			if (e.key === "ArrowDown") {
				// 下方向に検索
				for (let i = currentIndex + 1; i < inputFields.length; i++) {
					if (inputFields[i].value !== currentValue) {
						nextIndex = i;
						break;
					}
				}
				// 見つからなかった場合は最後のinputにフォーカス
				if (nextIndex === -1) {
					nextIndex = inputFields.length - 1;
				}
			} else {
				// 上方向に検索
				for (let i = currentIndex - 1; i >= 0; i--) {
					if (inputFields[i].value !== currentValue) {
						nextIndex = i;
						break;
					}
				}
				// 見つからなかった場合は最初のinputにフォーカス
				if (nextIndex === -1) {
					nextIndex = 0;
				}
			}

			inputFields[nextIndex].focus();
		}
	});

	// 初期データの読み込み
	fetch('full-emoji-list.txt')
		.then(response => response.text())
		.then(text => {
			const emojis = text.split('\n').filter(emoji => emoji.trim() !== '');
			emojiList.value = emojis.join('');
			dictionary.setEmojis(emojis);
			updateInputArea(emojis);
		})
		.catch(error => {
			console.error('絵文字リストの読み込みに失敗しました:', error);
		});

	// 絵文字リストの変更を監視
	emojiList.addEventListener("input", () => {
		const emojis = splitChar(emojiList.value).filter((char) => /[^\s]/.test(char));
		dictionary.setEmojis(emojis);
		updateInputArea(emojis);
	});

	// 入力エリアの更新
	function updateInputArea(emojis) {
		inputArea.innerHTML = "";
		inputFields = []; // 入力フィールドの配列をリセット
		for (const emoji of emojis) {
			const div = document.createElement("div");
			div.className = "item";

			const label = document.createElement("label");
			label.textContent = emoji;

			const input = document.createElement("input");
			input.type = "text";
			input.className = "reading";
			input.value = dictionary.getReading(emoji);

			input.addEventListener("input", () => {
				dictionary.setReading(emoji, input.value);
				updateStats();
			});

			div.appendChild(label);
			div.appendChild(input);
			inputArea.appendChild(div);
			inputFields.push(input); // 入力フィールドを配列に追加
		}
		updateStats();
	}

	// 統計情報の更新
	function updateStats() {
		const statsCount = document.getElementById("stats-count");
		const emojis = dictionary.data.emojis;
		const readings = dictionary.data.readings;

		statsCount.innerHTML = `${Object.keys(readings).length}<span class="fraction-slash">/</span>${emojis.length}`;
	}

	// ダウンロードボタンの処理
	downloadButton.addEventListener("click", () => {
		const content = dictionary.generateDictionary();
		const blob = new Blob([content], { type: "text/plain;charset=utf-16" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = "ユーザ絵文字辞書.txt";
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
	});
});

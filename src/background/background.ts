//background.ts
import { listOfTargetClassesAndPropertiesInterface } from "../content/content";
const urnikURL = "https://urnik.fri.uni-lj.si/";
let listOfClassesAndProperties: listOfTargetClassesAndPropertiesInterface[] = [];

// inicializacija badga in storaga
chrome.runtime.onInstalled.addListener(() => {
	chrome.storage.local.set({ isEnabled: false }, () => {
		chrome.action.setBadgeText({ text: "OFF" });
	});
});

// funkcija za updatad bade glede na stanje
async function updateBadge(tabId: number, isEnabled: boolean) {
	const badgeText = isEnabled ? "ON" : "OFF";
	await chrome.action.setBadgeText({
		tabId: tabId,
		text: badgeText,
	});
}

//posluša za message iz pupupa in content.ts
chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
	if (request.action === "toggle") {
		const newState = request.isEnabled;
		chrome.storage.local.set({ isEnabled: newState }, async () => {
			// Query all tabs that match the urnikURL
			const tabs = await chrome.tabs.query({ url: urnikURL + "*" });
			for (const tab of tabs) {
				if (tab.id && typeof tab.url === "string") {
					await updateBadge(tab.id, newState);
					await applyCSS(tab.id, newState);
				}
			}
			sendResponse({ success: true });
		});
		// return true da pokažeš async response
		return true;
	} else if (request.action === "sendListOfClassesAndProperties") {
		listOfClassesAndProperties = request.listOfLectures;
	} else if (request.action === "getListOfClassesAndProperties") {
		sendResponse({ listOfClassesAndProperties: listOfClassesAndProperties });
	} else if (request.action === "setColorOnClass") {
		try {
			const tabs = await chrome.tabs.query({ url: urnikURL + "*" });

			// procesira vsak tab asinhrono
			for (const tab of tabs) {
				if (tab.id && typeof tab.url === "string") {
					try {
						const transformedColorToRgba = hexToRgba(request.newColor);

						await chrome.scripting.executeScript({
							target: { tabId: tab.id },
							func: (text, rgbaNewColor) => {
								const elements = document.querySelectorAll("a.link-subject");

								for (let i = 0; i < elements.length; i++) {
									const element = elements[i];
									if (element.textContent?.trim() === text) {
										const ancestor =
											element.parentElement?.parentElement?.parentElement?.parentElement;
										if (ancestor) {
											ancestor.style.backgroundColor = rgbaNewColor;
										}
									}
								}
							},
							args: [request.text, transformedColorToRgba],
						});
					} catch (error) {
						console.error(`Failed to change color: ${error}`);
					}
				}
			}
		} catch (error) {
			console.error("Error processing setColorOnLecture:", error);
		}
	}
	// ostali messagi
});

// inicializacija badga glede na storage state ko se browser štarta
chrome.runtime.onStartup.addListener(async () => {
	chrome.storage.local.get({ isEnabled: false }, async (result) => {
		const isEnabled = result.isEnabled;
		// query za vse sub url-je
		const tabs = await chrome.tabs.query({ url: urnikURL + "*" });
		tabs.forEach(async (tab) => {
			if (tab.id && typeof tab.url === "string") {
				await updateBadge(tab.id, isEnabled);
				await applyCSS(tab.id, isEnabled);
			}
		});
	});
});

// posluša za tab update
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
	if (changeInfo.status === "complete" && tab.url && tab.url.startsWith(urnikURL)) {
		try {
			const result = await chrome.storage.local.get({ isEnabled: false });
			const isEnabled = result.isEnabled;
			await updateBadge(tabId, isEnabled);
			await applyCSS(tabId, isEnabled);
		} catch (error) {
			console.error("Error handling tab update:", error);
		}
	}
});

// helper funkcije

function hexToRgba(hex: string) {
	let a: string[] = [];
	if (/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)) {
		a = hex.substring(1).split("");
		if (a.length == 3) {
			a = [a[0], a[0], a[1], a[1], a[2], a[2]];
		}
		const b: number = Number("0x" + a.join(""));
		return "rgba(" + [(b >> 16) & 255, (b >> 8) & 255, b & 255].join(",") + ", 0.7)";
	}
	return "rgba(255, 255, 255, 1)";
}

// funkcija za dodajanje/odstranjevanje css-ja
async function applyCSS(tabId: number, isEnabled: boolean) {
	try {
		if (isEnabled) {
			await chrome.scripting.insertCSS({
				css: ".grid-entry { background-color: red !important; }",
				target: { tabId: tabId },
			});
		} else {
			await chrome.scripting.removeCSS({
				css: ".grid-entry { background-color: red !important; }",
				target: { tabId: tabId },
			});
		}
	} catch (error) {
		console.error(`Failed to apply/remove CSS on tab ${tabId}:`, error);
	}
}

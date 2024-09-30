//background.ts
import { listOfTargetClassesAndPropertiesInterface } from "../content/content";
const urnikURL = "https://urnik.fri.uni-lj.si/";
let listOfClassesAndProperties: listOfTargetClassesAndPropertiesInterface[] = [];

// inicializacija badga in storaga
chrome.runtime.onInstalled.addListener(() => {
	chrome.storage.local.set({ isEnabled: false, friClassColors: {} }, () => {
		chrome.action.setBadgeText({ text: "OFF" });
	});
});

// funkcija za updatad badge glede na stanje
async function updateBadge(tabId: number, isEnabled: boolean) {
	const badgeText = isEnabled ? "ON" : "OFF";
	await chrome.action.setBadgeText({
		tabId: tabId,
		text: badgeText,
	});
}

//posluša za message iz pupupa in content.ts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
	if (request.action === "toggle") {
		const newState = request.isEnabled;
		chrome.storage.local.set({ isEnabled: newState }, () => {
			// Query all tabs that match the urnikURL
			chrome.tabs.query({ url: `${urnikURL}*` }, async (tabs) => {
				const updatePromises = tabs.map(async (tab) => {
					if (tab.id && typeof tab.url === "string") {
						await updateBadge(tab.id, newState);
						if (newState) {
							// If enabling, apply all stored colors
							chrome.storage.local.get({ friClassColors: {} }, async (result) => {
								const friClassColors = result.friClassColors as { [lectureName: string]: string };
								await applyStoredColorsToTab(tab.id!, friClassColors);
							});
						}
					}
				});

				Promise.all(updatePromises)
					.then(() => {
						sendResponse({ success: true });
					})
					.catch((error) => {
						console.error("Error updating badges and applying colors:", JSON.stringify(error));
						sendResponse({ success: false, error: error.message });
					});
			});
		});
		// Return true to indicate that the response is asynchronous
		return true;
	} else if (request.action === "sendListOfClassesAndProperties") {
		listOfClassesAndProperties = request.listOfClasses;
	} else if (request.action === "getListOfClassesAndProperties") {
		sendResponse({ listOfClassesAndProperties: listOfClassesAndProperties });
	} else if (request.action === "setColorOnClass") {
		const { friTargetClassName, newHexColor } = request;

		chrome.storage.local.get({ friClassColors: {} }, (result) => {
			const friClassColors = result.friClassColors as { [key: string]: string };
			friClassColors[friTargetClassName] = newHexColor;

			chrome.storage.local.set({ friClassColors }, () => {
				chrome.tabs.query({ url: `${urnikURL}*` }, async (tabs) => {
					const applyColorPromises = tabs.map((tab) => {
						if (tab.id && typeof tab.url === "string") {
							const transformedColorToRgba = hexToRgba(newHexColor);
							return chrome.scripting.executeScript({
								target: { tabId: tab.id },
								func: applyColorToFriClass,
								args: [friTargetClassName, transformedColorToRgba],
							});
						}
						return Promise.resolve();
					});

					Promise.all(applyColorPromises)
						.then(() => {
							sendResponse({ success: true });
						})
						.catch((error) => {
							console.error(`Failed to apply colors: ${JSON.stringify(error)}`);
							sendResponse({ success: false, error: "Failed to set colors" });
						});
				});
			});
		});
		// Return true to indicate that the response is asynchronous
		return true;
	}
	// Handle other actions if necessary
});

// inicializacija badga glede na storage state ko se browser štarta
chrome.runtime.onStartup.addListener(async () => {
	chrome.storage.local.get({ isEnabled: false, friClassColors: {} }, async (result) => {
		const isEnabled = result.isEnabled;
		// Query all tabs that match the urnikURL
		const tabs = await chrome.tabs.query({ url: `${urnikURL}*` });
		const applyColorPromises = tabs.map(async (tab) => {
			if (tab.id && typeof tab.url === "string") {
				await updateBadge(tab.id, isEnabled);
				if (isEnabled) {
					const friClassColors = result.friClassColors as { [lectureName: string]: string };
					await applyStoredColorsToTab(tab.id, friClassColors);
				}
			}
		});
		await Promise.all(applyColorPromises);
	});
});

// posluša za tab update
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
	if (changeInfo.status === "complete" && tab.url && tab.url.startsWith(urnikURL)) {
		try {
			const result = await chrome.storage.local.get({ isEnabled: false, friClassColors: {} });
			const isEnabled = result.isEnabled;
			await updateBadge(tabId, isEnabled);

			if (isEnabled) {
				// Apply stored colors only if the extension is enabled
				const friClassColors = result.friClassColors as { [key: string]: string };
				await applyStoredColorsToTab(tabId, friClassColors);
			}
		} catch (error) {
			console.error("Error handling tab update:", JSON.stringify(error));
		}
	}
});

// helper funkcije

function applyColorToFriClass(friClassName: string, rgbaColor: string) {
	const elements = document.querySelectorAll<HTMLElement>("a.link-subject");
	elements.forEach((element) => {
		if (element.textContent?.trim() === friClassName) {
			const ancestor = element.closest<HTMLElement>(".grid-entry");
			if (ancestor) {
				ancestor.style.backgroundColor = rgbaColor;
			}
		}
	});
}

// Function to apply all stored colors to a specific tab
async function applyStoredColorsToTab(tabId: number, friClassColors: { [key: string]: string }) {
	const applyColorPromises = Object.entries(friClassColors).map(([lectureName, color]) => {
		const transformedColorToRgba = hexToRgba(color);
		return chrome.scripting.executeScript({
			target: { tabId: tabId },
			func: applyColorToFriClass,
			args: [lectureName, transformedColorToRgba],
		});
	});

	return Promise.all(applyColorPromises);
}

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

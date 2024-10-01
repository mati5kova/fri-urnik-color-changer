const urnikURL = "https://urnik.fri.uni-lj.si/";
const LIST_STORAGE_KEY = "listOfClassesAndProperties";

// inicializacija badga in storaga
chrome.runtime.onInstalled.addListener(() => {
	// friClassColors ima v sebi spremembe npr. {F_AV: '#10100f', F_P: '#8c8c26'}
	// [LIST_STORAGE_KEY] je list arrayov strukture {currentBgColor: 'rgba(16, 16, 15, 0.7)', friClassName: 'F_AV'} pride iz content.ts
	// defaultColors ima shranjene originalne barve od strani; oblika enaka kot friClassColors
	chrome.storage.local.set(
		{ isEnabled: false, friClassColors: {}, [LIST_STORAGE_KEY]: [], defaultColors: {} },
		() => {
			chrome.action.setBadgeText({ text: "OFF" });
		}
	);
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
						if (newState === true) {
							// če se extension "vklopi" ->
							chrome.storage.local.get({ friClassColors: {} }, async (result) => {
								const friClassColors = result.friClassColors as { [lectureName: string]: string };
								await applyStoredColorsToTab(tab.id!, friClassColors);
							});
						} else if (newState === false) {
							// če se extension "izklopi" -> nastavimo defaultne barve od strani
							chrome.storage.local.get({ defaultColors: {}, friClassColors: {} }, async (result) => {
								const defaultColors = result.defaultColors || {};
								await applyStoredColorsToTab(tab.id!, defaultColors);
							});
						}
					}
				});

				Promise.all(updatePromises)
					.then(() => {
						sendResponse({ success: true });
					})
					.catch((error) => {
						console.log("background.ts: Error updating badges and applying colors:", JSON.stringify(error));
						sendResponse({ success: false, error: error.message });
					});
			});
		});
		// vrne true da nakaže asinhron odgovor
		return true;
	} else if (request.action === "sendListOfClassesAndProperties") {
		const listOfClasses = request.listOfClasses;
		chrome.storage.local.set({ [LIST_STORAGE_KEY]: listOfClasses }, () => {
			console.log("background.ts: List of classes and properties saved to storage.");
		});
	} else if (request.action === "getListOfClassesAndProperties") {
		chrome.storage.local.get({ [LIST_STORAGE_KEY]: [] }, (result) => {
			sendResponse({ listOfClassesAndProperties: result[LIST_STORAGE_KEY] });
		});
		return true;
	} else if (request.action === "setColorOnClass") {
		const { friTargetClassName, newHexColor } = request;

		chrome.storage.local.get({ friClassColors: {}, isEnabled: false }, (result) => {
			const friClassColors = result.friClassColors as { [key: string]: string };
			const isEnabled = result.isEnabled as boolean;
			friClassColors[friTargetClassName] = newHexColor;

			chrome.storage.local.set({ friClassColors }, () => {
				// check da ne applya barve če ni extension "vključen" ampak samp shrani za kasneje
				if (isEnabled === true) {
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
								console.log(`background.ts: Failed to apply colors: ${JSON.stringify(error)}`);
								sendResponse({ success: false, error: "Failed to set colors" });
							});
					});
				}
			});
		});
		return true;
	}
	// nadaljuj z ostalimi...
});

// inicializacija badga glede na storage state ko se browser štarta
chrome.runtime.onStartup.addListener(async () => {
	chrome.storage.local.get({ isEnabled: false, friClassColors: {}, [LIST_STORAGE_KEY]: [] }, async (result) => {
		const isEnabled = result.isEnabled;
		// query za vse tab-e
		const tabs = await chrome.tabs.query({ url: `${urnikURL}*` });
		const applyColorPromises = tabs.map(async (tab) => {
			if (tab.id && typeof tab.url === "string") {
				await updateBadge(tab.id, isEnabled);
				if (isEnabled === true) {
					const friClassColors = result.friClassColors as { [lectureName: string]: string };
					await applyStoredColorsToTab(tab.id, friClassColors);
				} else if (isEnabled === false) {
					// če se extension "izklopi" -> nastavimo defaultne barve od strani
					chrome.storage.local.get({ defaultColors: {}, friClassColors: {} }, async (result) => {
						const defaultColors = result.defaultColors || {};
						await applyStoredColorsToTab(tab.id!, defaultColors);
					});
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
			const result = await chrome.storage.local.get({
				isEnabled: false,
				friClassColors: {},
				[LIST_STORAGE_KEY]: [],
			});
			const isEnabled = result.isEnabled;
			await updateBadge(tabId, isEnabled);

			if (isEnabled === true) {
				// applyja barve iz storaga če je vključen
				const friClassColors = result.friClassColors as { [lectureName: string]: string };
				await applyStoredColorsToTab(tabId, friClassColors);
			} else if (isEnabled === false) {
				// če se extension "izklopi" -> nastavimo defaultne barve od strani
				chrome.storage.local.get({ defaultColors: {}, friClassColors: {} }, async (result) => {
					const defaultColors = result.defaultColors || {};
					await applyStoredColorsToTab(tab.id!, defaultColors);
				});
			}
		} catch (error) {
			console.log("background.ts: Error handling tab update:", JSON.stringify(error));
		}
	}
});

// helper funkcije
// funkcija za "pobarvat" predmet na urniku
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

// funkcija za apply-at vse shranjene barve
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

// to je alpha vrednosti ki je prisotna na vseh barvah v originalu na strani in se zgubi s pretvorbami rgba v hex
const injectedAlphaValue: number = 0.7;
// funkcija za pretvorbo hex v rgba
// https://stackoverflow.com/questions/21646738/convert-hex-to-rgba
function hexToRgba(hex: string) {
	let a: string[] = [];
	if (/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)) {
		a = hex.substring(1).split("");
		if (a.length == 3) {
			a = [a[0], a[0], a[1], a[1], a[2], a[2]];
		}
		const b: number = Number("0x" + a.join(""));
		return "rgba(" + [(b >> 16) & 255, (b >> 8) & 255, b & 255].join(",") + `, ${injectedAlphaValue})`;
	}
	// v resnici ni hex ampak rgba()
	return hex;
}

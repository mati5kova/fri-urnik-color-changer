// content.ts
export interface listOfTargetClassesAndPropertiesInterface {
	currentBgColor: string;
	friClassName: string;
}
interface DefaultColors {
	[key: string]: string;
}

function sendClassesToBackground() {
	// queryjamo da dobimo starša (ima barvo ozadja) in N*pra vnuka (ima ime predmeta)
	// lahko na tak način ker itak vedno nastopata skupaj in oba
	const targets = document.querySelectorAll<HTMLElement>("div.grid-entry, a.link-subject");

	const listOfTargetClassesAndProperties: listOfTargetClassesAndPropertiesInterface[] = [];
	for (let i = 0; i < targets.length; i += 2) {
		listOfTargetClassesAndProperties.push({
			currentBgColor: targets[i].style.backgroundColor,
			friClassName: targets[i + 1].textContent?.trim() || "",
		});
	}

	chrome.storage.local.get<DefaultColors>("defaultColors", (result) => {
		// če še niso shranjeni originali v storage
		if (!result.defaultColors || Object.keys(result.defaultColors).length === 0) {
			const defaultColors = listOfTargetClassesAndProperties.reduce((acc, item) => {
				acc[item.friClassName] = item.currentBgColor;
				return acc;
			}, {} as DefaultColors);

			chrome.storage.local.set({ defaultColors });
		}
	});

	chrome.runtime.sendMessage({
		action: "sendListOfClassesAndProperties",
		listOfClasses: listOfTargetClassesAndProperties,
	});
}

// začetni send do background.ts
sendClassesToBackground();

// posluša DOM za morebitne spremembe
const observer = new MutationObserver((mutations) => {
	let shouldResend = false;
	for (const mutation of mutations) {
		if (mutation.type === "childList" || mutation.type === "attributes") {
			shouldResend = true;
			break;
		}
	}
	if (shouldResend) {
		sendClassesToBackground();
	}
});

// začetek observa
observer.observe(document.body, { childList: true, subtree: true, attributes: true });

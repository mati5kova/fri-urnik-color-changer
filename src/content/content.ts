// content.ts
export interface listOfTargetClassesAndPropertiesInterface {
	currentBgColor: string;
	friClassName: string;
}

const targets = document.querySelectorAll<HTMLElement>("div.grid-entry, div.row > a.link-subject");

const listOfTargetClassesAndProperties: listOfTargetClassesAndPropertiesInterface[] = [];
for (let i = 0; i < targets.length; i += 2) {
	listOfTargetClassesAndProperties.push({
		currentBgColor: targets[i].style.backgroundColor,
		friClassName: targets[i + 1].textContent?.trim() || "",
	});
}

chrome.runtime.sendMessage({
	action: "sendListOfClassesAndProperties",
	listOfClasses: listOfTargetClassesAndProperties,
});

// Listen for messages to apply saved colors
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
	if (request.action === "applySavedColors") {
		const friClassColors = request.friClassColors as { [key: string]: string };
		for (const [lectureName, color] of Object.entries(friClassColors)) {
			const elements = document.querySelectorAll<HTMLElement>("a.link-subject");
			elements.forEach((element) => {
				if (element.textContent?.trim() === lectureName) {
					const ancestor = element.closest<HTMLElement>(".grid-entry"); // Adjust selector as needed
					if (ancestor) {
						ancestor.style.backgroundColor = hexToRgba(color);
					}
				}
			});
		}
		sendResponse({ success: true });
	}
});

// funkcija za pretvorbo hex v rgba +(0.7 alpha kot je na og strani)
function hexToRgba(hex: string) {
	let a: string[] = [];
	if (/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)) {
		a = hex.substring(1).split("");
		if (a.length === 3) {
			a = [a[0], a[0], a[1], a[1], a[2], a[2]];
		}
		const b: number = Number("0x" + a.join(""));
		return `rgba(${(b >> 16) & 255}, ${(b >> 8) & 255}, ${b & 255}, 0.7)`;
	}
	return "rgba(255, 255, 255, 1)";
}

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
	listOfLectures: listOfTargetClassesAndProperties,
});

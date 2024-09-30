import { useState } from "react";

export default function ToggleOnOffButton() {
	const [buttonText, setButtonText] = useState<"Turn ON" | "Turn OFF">("Turn ON");

	const handleButtonClick = () => {
		chrome.storage.local.get({ isEnabled: false }, (result) => {
			const currentState = result.isEnabled;
			const nextState = !currentState;

			if (result.isEnabled) {
				setButtonText("Turn ON");
			} else {
				setButtonText("Turn OFF");
			}

			// pošlji message background scriptu
			chrome.runtime.sendMessage({ action: "toggle", isEnabled: nextState }, () => {
				if (chrome.runtime.lastError) {
					console.error("Error sending message:", JSON.stringify(chrome.runtime.lastError));
				}
			});
		});
	};
	return (
		<button id="toggleButton" onClick={handleButtonClick} className="w-16 h-12 border border-solid border-gray-400">
			{buttonText}
		</button>
	);
}

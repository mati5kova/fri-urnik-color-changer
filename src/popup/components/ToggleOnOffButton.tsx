import { useEffect, useState } from "react";

export default function ToggleOnOffButton({ isCorrectSite }: { isCorrectSite: boolean }) {
	const [buttonText, setButtonText] = useState<"Turn ON" | "Turn OFF">("Turn ON");

	useEffect(() => {
		// dobi iz storaga stanje za gumb (beri aktivnosti extensiona)
		const retrieveCurrentButtonState = () => {
			chrome.storage.local.get(["isEnabled"]).then((result) => {
				const isEnabled: boolean = result.isEnabled;
				setButtonText(isEnabled ? "Turn OFF" : "Turn ON");
			});
		};

		retrieveCurrentButtonState();
	}, []);

	const handleButtonClick = () => {
		chrome.storage.local.get({ isEnabled: false }, (result) => {
			const currentState = result.isEnabled;
			const nextState = !currentState;

			setButtonText(nextState ? "Turn OFF" : "Turn ON");

			// pošlji message background.ts
			chrome.runtime.sendMessage({ action: "toggle", isEnabled: nextState }, () => {
				if (chrome.runtime.lastError) {
					console.error("Error sending message:", JSON.stringify(chrome.runtime.lastError));
				}
			});
		});
	};
	return (
		<>
			{isCorrectSite ? (
				<button
					id="toggleButton"
					onClick={handleButtonClick}
					className="w-16 h-12 border border-solid border-gray-400"
				>
					{buttonText}
				</button>
			) : null}
		</>
	);
}

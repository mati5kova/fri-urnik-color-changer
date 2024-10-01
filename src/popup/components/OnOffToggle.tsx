import { useEffect, useState } from "react";

export default function OnOffToggle({ isCorrectSite }: { isCorrectSite: boolean }) {
	// lokalno za input["checkbox"]
	const [checked, setChecked] = useState(false);

	useEffect(() => {
		// dobi iz storaga stanje za gumb (beri aktivnosti extensiona)
		const retrieveCurrentButtonState = () => {
			chrome.storage.local.get(["isEnabled"]).then((result) => {
				const isEnabled: boolean = result.isEnabled as boolean;
				setChecked(isEnabled);
			});
		};

		retrieveCurrentButtonState();
	}, []);

	const handleSwitchToggle = () => {
		chrome.storage.local.get({ isEnabled: false }, (result) => {
			const currentState = result.isEnabled as boolean;
			const nextState = !currentState;

			setChecked(nextState);

			// pošlji message background.ts
			chrome.runtime.sendMessage({ action: "toggle", isEnabled: nextState }, () => {
				if (chrome.runtime.lastError) {
					console.log("ToggleOnOff.tsx: Error sending message:", JSON.stringify(chrome.runtime.lastError));
				}
			});
		});
	};
	return (
		<>
			{isCorrectSite ? (
				<>
					<label className="inline-flex items-center cursor-pointer mb-3">
						<span className="mr-3 text-sm font-medium text-gray-900">OFF</span>
						<input
							type="checkbox"
							className="sr-only peer"
							checked={checked}
							onChange={handleSwitchToggle}
						></input>
						<div className="relative w-9 h-5 bg-gray-200 rounded-full peer-checked:bg-gray-500 peer-checked:bg-opacity-70 peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all "></div>
						<span className="ml-3 text-sm font-medium text-gray-900">ON</span>
					</label>
				</>
			) : null}
		</>
	);
}

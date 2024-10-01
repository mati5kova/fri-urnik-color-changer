// -> app.tsx
import { useEffect, useState } from "react";
import FriClassesList from "./FriClassesList";
import ToggleOnOffButton from "./ToggleOnOffButton";

const FRIurnikURL = "https://urnik.fri.uni-lj.si/";

export default function App() {
	const [isCorrectSite, setIsCorrectSite] = useState(false);

	useEffect(() => {
		// preveri če si na pravi strani in glede na to rendera ostale komponente
		const checkCurrentTabUrl = () => {
			chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
				const activeTab = tabs[0];
				if (activeTab && activeTab.url?.startsWith(FRIurnikURL)) {
					// si na pravi strani
					setIsCorrectSite(true);
				} else {
					// nisi na pravi strani
					setIsCorrectSite(false);
					console.log(`App.tsx: This extension only works on ${FRIurnikURL}`);
				}
			});
		};

		checkCurrentTabUrl();

		return () => {
			setIsCorrectSite(false);
		};
	}, []);
	return (
		<>
			{isCorrectSite ? (
				<main className="min-h-fit min-w-fit p-5">
					<ToggleOnOffButton isCorrectSite={isCorrectSite} />
					<FriClassesList isCorrectSite={isCorrectSite} />
				</main>
			) : (
				<div className="min-w-fit whitespace-nowrap p-2">
					Extension can only be used on{" "}
					<a href={FRIurnikURL} target="_blank" className="text-blue-400 underline">
						{FRIurnikURL}
					</a>
				</div>
			)}
		</>
	);
}

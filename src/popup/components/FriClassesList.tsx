// FriClassesList.tsx
import { useEffect, useState } from "react";
import { listOfTargetClassesAndPropertiesInterface } from "../../content/content";
import IndividualFriClassColorSetter from "./IndividualFriClassColorSetter";

export default function FriClassesList() {
	const [friClassesAndProperties, setFriClassesAndProperties] = useState<listOfTargetClassesAndPropertiesInterface[]>(
		[]
	);

	useEffect(() => {
		// Function to fetch the list of classes and properties
		const fetchClasses = () => {
			return new Promise<listOfTargetClassesAndPropertiesInterface[]>((resolve, reject) => {
				chrome.runtime.sendMessage({ action: "getListOfClassesAndProperties" }, (response) => {
					if (response && response.listOfClassesAndProperties) {
						resolve(response.listOfClassesAndProperties);
					} else {
						reject("Failed to fetch classes and properties.");
					}
				});
			});
		};

		// Function to fetch stored colors from storage
		const fetchStoredColors = () => {
			return new Promise<{ [lectureName: string]: string }>((resolve) => {
				chrome.storage.local.get({ friClassColors: {} }, (result) => {
					const savedColors = result.friClassColors as { [lectureName: string]: string };
					resolve(savedColors);
				});
			});
		};

		// Fetch both classes and stored colors, then combine them
		Promise.all([fetchClasses(), fetchStoredColors()])
			.then(([classes, savedColors]) => {
				const updatedClasses = classes.map((friClass) => ({
					...friClass,
					currentBgColor: savedColors[friClass.friClassName] || friClass.currentBgColor,
				}));
				setFriClassesAndProperties(updatedClasses);
			})
			.catch((error) => {
				console.error("Error fetching classes or colors:", error);
			});
	}, []);

	return (
		<div className="w-36">
			{friClassesAndProperties.map((friClass) => (
				<IndividualFriClassColorSetter
					key={friClass.friClassName}
					currentBgColor={friClass.currentBgColor}
					friClassName={friClass.friClassName}
				/>
			))}
		</div>
	);
}

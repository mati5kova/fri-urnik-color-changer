import { useEffect, useState } from "react";
import { listOfTargetClassesAndPropertiesInterface } from "../../content/content";
import IndividualFriClassColorSetter from "./IndividualFriClassColorSetter";

export default function LecturesList() {
	const [friClassesAndProperties, setFriClassesAndProperties] = useState<listOfTargetClassesAndPropertiesInterface[]>(
		[]
	);

	useEffect(() => {
		chrome.runtime.sendMessage({ action: "getListOfClassesAndProperties" }, (response) => {
			if (response && response.listOfClassesAndProperties) {
				setFriClassesAndProperties(response.listOfClassesAndProperties);
			}
		});
	}, []);

	return (
		<div className="w-36">
			{friClassesAndProperties.map((friClass) => {
				return (
					<IndividualFriClassColorSetter
						key={friClass.friClassName + friClass.currentBgColor}
						currentBgColor={friClass.currentBgColor}
						friClassName={friClass.friClassName}
					/>
				);
			})}
		</div>
	);
}

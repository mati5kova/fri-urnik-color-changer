// IndividualFriClassColorSetter.tsx
import { useEffect, useState } from "react";
import { listOfTargetClassesAndPropertiesInterface } from "../../content/content";

export default function IndividualFriClassColorSetter({
	currentBgColor,
	friClassName,
}: listOfTargetClassesAndPropertiesInterface) {
	const [localBgColor, setLocalBgColor] = useState<string>(currentBgColor);

	useEffect(() => {
		setLocalBgColor(RGBAToHexA(currentBgColor));
	}, [currentBgColor]);

	const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const newColor = e.target.value;
		setLocalBgColor(newColor);
		try {
			const response = await chrome.runtime.sendMessage({
				action: "setColorOnClass",
				friTargetClassName: friClassName,
				newHexColor: newColor,
			});

			if (!response.success) {
				console.log(
					`IndividualFriClassColorSetter.tsx: Failed to set color for ${friClassName}: ${response?.error}`
				);
			}
		} catch (error) {
			console.log("IndividualFriClassColorSetter.tsx: Error setting color on class:", error);
		}
	};

	function RGBAToHexA(rgba: string, forceRemoveAlpha = true) {
		if (Array.from(rgba)[0] === "#") {
			// vrne og "rgba" string če je v resnici hex
			// zaradi nekega čudnega obnašanja/nekonsistentnosti (beri: shit koda) med storagom in kako je treba dat value za input[type="color" v hex obliki]
			return rgba;
		} else {
			// https://stackoverflow.com/questions/49974145/how-to-convert-rgba-to-hex-color-code-using-javascript
			return (
				"#" +
				rgba
					.replace(/^rgba?\(|\s+|\)$/g, "") // Get's rgba / rgb string values
					.split(",") // splits them at ","
					.filter((string, index) => !forceRemoveAlpha || index !== 3)
					.map((string) => parseFloat(string)) // Converts them to numbers
					.map((number, index) => (index === 3 ? Math.round(number * 255) : number)) // Converts alpha to 255 number
					.map((number) => number.toString(16)) // Converts numbers to hex
					.map((string) => (string.length === 1 ? "0" + string : string)) // Adds 0 when length of one number is 1
					.join("")
			);
		}
	}

	return (
		/* https://stackoverflow.com/questions/48464444/how-to-display-3-items-per-row-in-flexbox */
		<div className="w-72 min-w-fit p-1 flex-grow-0 flex-shrink-0 basis-1/2 flex justify-between">
			<label htmlFor={friClassName}>{friClassName}</label>
			<input
				type="color"
				name={friClassName}
				id={friClassName}
				value={localBgColor}
				onChange={handleChange}
				className="ml-px"
			/>
		</div>
	);
}

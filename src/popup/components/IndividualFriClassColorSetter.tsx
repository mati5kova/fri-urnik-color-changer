// IndividualFriClassColorSetter.tsx
import { useEffect, useId, useState } from "react";
import { listOfTargetClassesAndPropertiesInterface } from "../../content/content";

export default function IndividualFriClassColorSetter({
	currentBgColor,
	friClassName,
}: listOfTargetClassesAndPropertiesInterface) {
	const [localBgColor, setLocalBgColor] = useState<string>(currentBgColor);
	const uniqueId = useId();

	useEffect(() => {
		console.log(currentBgColor, localBgColor, RGBAToHexA(currentBgColor), RGBAToHexA(localBgColor));
	}, []);

	useEffect(() => {
		setLocalBgColor(RGBAToHexA(currentBgColor));
	}, [currentBgColor]);

	const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const newColor = e.target.value;
		setLocalBgColor(newColor);
		try {
			await chrome.runtime.sendMessage({
				action: "setColorOnClass",
				friTargetClassName: friClassName,
				newHexColor: newColor,
			});
		} catch (error) {
			console.error("Error setting color on class:", JSON.stringify(error));
		}
	};

	function RGBAToHexA(rgba: string, forceRemoveAlpha = true) {
		if (Array.from(rgba)[0] === "#") {
			return rgba;
		} else {
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
		<div className="w-full flex justify-between">
			<label htmlFor={uniqueId}>{friClassName}</label>
			<input
				type="color"
				name={uniqueId}
				id={uniqueId}
				value={RGBAToHexA(localBgColor)}
				onChange={handleChange}
			/>
		</div>
	);
}

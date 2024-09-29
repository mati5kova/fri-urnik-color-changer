import { useId, useState } from "react";
import { listOfTargetClassesAndPropertiesInterface } from "../../content/content";

export default function IndividualFriClassColorSetter({
	currentBgColor,
	friClassName,
}: listOfTargetClassesAndPropertiesInterface) {
	const [localBgColor, setLocalBgColor] = useState(RGBAToHexA(currentBgColor, true));
	const uniqueId = useId();

	function RGBAToHexA(rgba: string, forceRemoveAlpha: boolean) {
		return (
			"#" +
			rgba
				.replace(/^rgba?\(|\s+|\)$/g, "")
				.split(",")
				.filter((string: string, index: number) => !forceRemoveAlpha || index !== 3)
				.map((string: string) => parseFloat(string))
				.map((number: number, index: number) => (index === 3 ? Math.round(number * 255) : number))
				.map((number: number) => number.toString(16))
				.map((string: string) => (string.length === 1 ? "0" + string : string))
				.join("")
		);
	}

	async function changeColor(e: React.ChangeEvent<HTMLInputElement>) {
		setLocalBgColor(e.target.value);
		try {
			chrome.runtime.sendMessage({ action: "setColorOnClass", text: friClassName, newColor: e.target.value });
		} catch (error) {
			console.error(error);
		}
	}

	return (
		<div className="w-full  flex justify-between">
			<label htmlFor={uniqueId}>{friClassName}</label>
			<input type="color" name={uniqueId} id={uniqueId} value={localBgColor} onChange={(e) => changeColor(e)} />
		</div>
	);
}

// FriClassesList.tsx
import { useEffect, useState } from "react";
import { listOfTargetClassesAndPropertiesInterface } from "../../content/content";
import IndividualFriClassColorSetter from "./IndividualFriClassColorSetter";

const LIST_STORAGE_KEY = "listOfClassesAndProperties";

export default function FriClassesList({ isCorrectSite }: { isCorrectSite: boolean }) {
	const [friClassesAndProperties, setFriClassesAndProperties] = useState<listOfTargetClassesAndPropertiesInterface[]>(
		[]
	);
	const [isLoading, setIsLoading] = useState<boolean>(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		// dobi shranjene predmete iz storaga
		// ** dodal ker se po neaktivnosti, ampak nezaprtju taba aplication state zbriše in je blo treba spravit v storage
		const fetchStoredClasses = () => {
			return new Promise<listOfTargetClassesAndPropertiesInterface[]>((resolve, reject) => {
				chrome.storage.local.get({ [LIST_STORAGE_KEY]: [] }, (result) => {
					const classes = result[LIST_STORAGE_KEY] as listOfTargetClassesAndPropertiesInterface[];
					if (classes.length > 0) {
						resolve(classes);
					} else {
						reject("No classes found. Please ensure you are on the target site.");
					}
				});
			});
		};

		// dobi shranjene barve iz storaga
		const fetchStoredColors = () => {
			return new Promise<{ [lectureName: string]: string }>((resolve) => {
				chrome.storage.local.get({ friClassColors: {} }, (result) => {
					const savedColors = result.friClassColors as { [lectureName: string]: string };
					resolve(savedColors);
				});
			});
		};

		// ne nardi promisa če ni prava stran -> dela pravilno
		if (isCorrectSite === true) {
			Promise.all([fetchStoredClasses(), fetchStoredColors()])
				.then(([classes, savedColors]) => {
					const updatedClasses = classes.map((friClass) => ({
						...friClass,
						currentBgColor: savedColors[friClass.friClassName] || friClass.currentBgColor,
					}));
					setFriClassesAndProperties(updatedClasses);
					setIsLoading(false);
				})
				.catch((errorMsg) => {
					console.log("FriClassesList.tsx: Error fetching classes or colors:", errorMsg);
					setError(errorMsg);
					setIsLoading(false);
				});
		}
	}, [isCorrectSite]);

	if (isLoading) {
		return <div className="w-36 p-4">Loading...</div>;
	}

	if (error) {
		return <div className="w-36 p-4 text-red-500">Error: {error}</div>;
	}

	return (
		<>
			{isCorrectSite ? (
				<div className="w-full flex flex-wrap">
					{friClassesAndProperties.length > 0 ? (
						friClassesAndProperties.map((friClass) => (
							<IndividualFriClassColorSetter
								key={friClass.friClassName}
								currentBgColor={friClass.currentBgColor}
								friClassName={friClass.friClassName}
							/>
						))
					) : (
						<div>No classes to display</div>
					)}
				</div>
			) : null}
		</>
	);
}

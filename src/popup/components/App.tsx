import LecturesList from "./LecturesList";
import ToggleOnOffButton from "./ToggleOnOffButton";

export default function App() {
	return (
		<main className="min-h-fit min-w-fit p-5">
			<ToggleOnOffButton />
			<LecturesList />
		</main>
	);
}

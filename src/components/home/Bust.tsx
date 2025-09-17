import { hslVar } from "@/utils/home"

type BustProps = {
    colorVar: string
    label: string
    queueName: string
    onClick?: () => void
    size?: "small" | "medium" | "large"
}

export default function Bust({ colorVar, label, queueName, onClick, size = "large" }: BustProps) {
    const getSizeClasses = () => {
        switch (size) {
            case "small":
                return {
                    container: "h-8 w-8",
                    head: "h-2.5 w-2.5 top-0.5",
                    body: "h-5 w-6 bottom-0",
                    text: "text-[8px] pb-0.5"
                };
            case "medium":
                return {
                    container: "h-9 w-9",
                    head: "h-3 w-3 top-0.5",
                    body: "h-5.5 w-7 bottom-0",
                    text: "text-[8px] pb-0.5"
                };
            default: // large
                return {
                    container: "h-10 w-10",
                    head: "h-3.5 w-3.5 top-1",
                    body: "h-6 w-8 bottom-0",
                    text: "text-[9px] pb-1"
                };
        }
    };

    const sizeClasses = getSizeClasses();

    return (
        <button
            onClick={onClick}
            className={`relative mx-auto ${sizeClasses.container} group cursor-pointer transition-transform hover:scale-110`}
            title={queueName}
        >
            <div
                className="absolute inset-0 rounded-full blur-sm group-hover:blur-md transition-all"
                style={{ background: hslVar(colorVar, 0.25) }}
                aria-hidden
            />
            <div
                className={`absolute left-1/2 ${sizeClasses.head} -translate-x-1/2 rounded-full shadow group-hover:shadow-lg transition-all`}
                style={{ backgroundColor: hslVar(colorVar) }}
                aria-hidden
            />
            <div
                className={`absolute ${sizeClasses.body} left-1/2 -translate-x-1/2 rounded-[999px] shadow group-hover:shadow-lg transition-all`}
                style={{ backgroundColor: hslVar(colorVar) }}
                aria-hidden
            />
            <div className={`absolute inset-0 flex items-end justify-center ${sizeClasses.text}`}>
                <span className="font-semibold text-white drop-shadow">{label}</span>
            </div>
        </button>
    )
}

import { PauseButton } from "@/components/pause"
import type { PauseButtonProps } from "@/components/pause"

export default function OpenPause({ setOpenDialogBreakReasons }: PauseButtonProps) {
    return <PauseButton setOpenDialogBreakReasons={setOpenDialogBreakReasons} />
}

import {renderStats} from "../stats";
import {getUsername} from "../../utils/storage";

export function renderProfileView(): HTMLElement {
    return renderStats(getUsername());
}
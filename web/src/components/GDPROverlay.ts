import { createOverlayCard } from "./overlayCard";
import i18n from "../utils/lang/i18n";

export function GDPROverlay(): {
    element: HTMLElement;
    close: () => void;
    content: HTMLElement;
} {
    const lines: string[] = [];

    const addTitle = (k: string) => lines.push(`\n${i18n.t(k).toUpperCase()}\n`);
    const add = (k: string) => lines.push(i18n.t(k));

    addTitle("terms_1_title");
    add("terms_1_1");
    add("terms_1_2");
    lines.push(
        `• ${i18n.t("terms_1_2_1")}`,
        `• ${i18n.t("terms_1_2_2")}`,
        `• ${i18n.t("terms_1_2_3")}`,
        `• ${i18n.t("terms_1_2_4")}`,
        `• ${i18n.t("terms_1_2_5")}`,
        `• ${i18n.t("terms_1_2_6")}`,
    );

    addTitle("terms_2_title");
    add("terms_2_1");
    lines.push(
        `• ${i18n.t("terms_2_1_1")}`,
        `• ${i18n.t("terms_2_1_2")}`,
        `• ${i18n.t("terms_2_1_3")}`,
    );

    addTitle("terms_3_title");
    add("terms_3_1");
    add("terms_3_2");

    addTitle("terms_4_title");
    add("terms_4_1");
    add("terms_4_2");

    addTitle("terms_5_title");
    add("terms_5_1");
    add("terms_5_2");

    const text = lines.join("\n");

    return createOverlayCard({
        title: i18n.t("terms_title"),
        text,
    });
}
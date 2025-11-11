import { createButton } from "../../components/button";
import i18n from "../../utils/lang/i18n";
import { createInput } from "../../components/input";
import { api2faSetup, twofaActivate, twofaDisable } from "../../api/auth";
import { setToast } from "../../components/toast";
import { userMe } from "../../api/methode";

/** Build the 2FA setup/verify UI with enable/disable flows. Returns HTMLElement (no Promise). */
export function render2faView(): HTMLElement {
    const section = h("section", "h-full flex flex-col justify-center items-center text-center gap-4");
    const title = h("h2", "text-2xl font-bold text-gray-800 dark:text-white", i18n.t("2fa_title"));
    const desc = h("p", "text-gray-600 dark:text-gray-300", i18n.t("2fa_subtitle"));
    const status = h("p", "min-h-[1.25rem] text-sm", "");
    status.setAttribute("role", "status");
    status.setAttribute("aria-live", "polite");
    section.append(title, desc, status);

    const btnEnable = createButton(i18n.t("2fa_enable"), "button", "black") as HTMLButtonElement;
    btnEnable.classList.add("text-sm", "px-3", "py-1.5", "max-w-xs", "w-full", "mx-auto");

    const btnDisable = createButton(i18n.t("2fa_disable"), "button", "red") as HTMLButtonElement;
    btnDisable.classList.add("hidden", "text-sm", "px-3", "py-1.5", "max-w-xs", "w-full", "mx-auto");

    const qrImg = document.createElement("img");
    qrImg.className = "mx-auto rounded shadow hidden";
    qrImg.alt = "2FA QR Code";

    const secretWrap = h("div", "hidden w-full max-w-md text-left space-y-2");
    const secretRow = h("div", "flex gap-2");
    const secretInput = document.createElement("input");
    secretInput.id = "twofa-secret-input";
    secretInput.type = "text";
    secretInput.readOnly = true;
    secretInput.className =
        "flex-1 rounded border border-gray-300 dark:border-gray-600 bg-white/80 dark:bg-gray-800/80 px-3 py-2 text-sm";
    const copyBtn = createButton(i18n.t("2fa_copy"), "button", "black") as HTMLButtonElement;
    copyBtn.type = "button";
    copyBtn.disabled = true;
    secretRow.append(secretInput, copyBtn);
    secretWrap.append(secretRow);

    copyBtn.onclick = () => copy(secretInput.value, status);

    const form = document.createElement("form");
    form.className = "space-y-3 hidden";
    const codeInput = createInput("text", i18n.t("2fa_code")) as HTMLInputElement;
    codeInput.id = "twofa-code-input";
    codeInput.maxLength = 6;
    codeInput.inputMode = "numeric";
    codeInput.placeholder = "123456";
    const btnVerify = createButton(i18n.t("2fa_submit"), "submit", "black");
    form.append(codeInput, btnVerify);

    userMe()
        .then((user) => {
            if (user?.info?.is_twofa_enabled) {
                btnEnable.classList.add("hidden");
                btnDisable.classList.remove("hidden");
            }
        })
        .catch(() => {
            setToast(status, "error", i18n.t("2fa_user_error"));
        });

    btnEnable.onclick = async () => {
        setToast(status, "info", i18n.t("2fa_generating"));
        let qrcode: string | undefined;
        let secret: string | undefined;
        try {
            const result = await api2faSetup();
            qrcode = result?.info?.qrCode;
            secret = result?.info?.secret;
        } catch (err) {
            setToast(status, "success", String(err));
            btnEnable.classList.add("hidden");
            btnDisable.classList.remove("hidden");
            return;
        }

        if (qrcode) {
            qrImg.src = qrcode;
            qrImg.classList.remove("hidden");
        }

        secretInput.value = secret ?? "";
        copyBtn.disabled = !secretInput.value;
        secretWrap.classList.remove("hidden");
        form.classList.remove("hidden");
        setToast(status, "info", i18n.t("2fa_scan_qr"));
    };

    form.onsubmit = async (e) => {
        e.preventDefault();
        const code = codeInput.value.trim();
        if (!code) {
            setToast(status, "error", i18n.t("2fa_code_required"));
            return;
        }

        setToast(status, "info", i18n.t("2fa_verifying"));
        try {
            const error = await twofaActivate(code);
            if (!error) {
                setToast(status, "success", i18n.t("2fa_success_enabled"));
                codeInput.value = "";
                hideSetupUI();
                btnDisable.classList.remove("hidden");
                btnEnable.classList.add("hidden");
            } else {
                setToast(status, "error", i18n.t("2fa_error_invalid"));
            }
        } catch {
            setToast(status, "error", i18n.t("2fa_error_invalid"));
        }
    };

    btnDisable.onclick = async () => {
        const code = await openDisableOverlay();
        if (!code) return;

        setToast(status, "info", i18n.t("2fa_disabling") ?? "Disabling…");
        try {
            const error = await (twofaDisable as unknown as (c: string) => Promise<unknown>)(code);
            if (!error) {
                setToast(status, "success", i18n.t("2fa_success_disabled"));
                btnDisable.classList.add("hidden");
                btnEnable.classList.remove("hidden");
                hideSetupUI();
            } else {
                setToast(status, "error", i18n.t("2fa_error_invalid"));
            }
        } catch {
            setToast(status, "error", i18n.t("2fa_error_invalid"));
        }
    };

    function hideSetupUI(): void {
        qrImg.classList.add("hidden");
        secretWrap.classList.add("hidden");
        form.classList.add("hidden");
    }

    section.append(btnEnable, btnDisable, qrImg, secretWrap, form);
    return section;
}

/** Open a modal asking for a 6-digit 2FA code. Resolves the code or null if canceled. */
function openDisableOverlay(): Promise<string | null> {
    return new Promise((resolve) => {
        const backdrop = h(
            "div",
            "fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
        );
        backdrop.addEventListener("click", (e) => {
            if (e.target === backdrop) cleanup(null);
        });

        const dialog = h(
            "div",
            "w-full max-w-sm rounded-2xl bg-white dark:bg-gray-900 shadow-xl p-5 space-y-4 text-left"
        );

        const heading = h(
            "h3",
            "text-lg font-semibold text-gray-900 dark:text-white text-center",
            i18n.t("2fa_disable")
        );

        const form = document.createElement("form");
        form.className = "space-y-3";

        const code = createInput("text", i18n.t("2fa_code")) as HTMLInputElement;
        code.id = "twofa-disable-code-input";
        code.maxLength = 6;
        code.inputMode = "numeric";
        code.placeholder = "123456";
        code.autocomplete = "one-time-code";
        code.classList.add("text-center", "tracking-widest");

        const actions = h("div", "flex items-center justify-end gap-2");
        const cancelBtn = createButton(i18n.t("cancel"), "button", "black");
        const confirmBtn = createButton(i18n.t("confirm"), "submit", "red");

        (cancelBtn as HTMLButtonElement).onclick = (e) => {
            e.preventDefault();
            cleanup(null);
        };

        form.onsubmit = (e) => {
            e.preventDefault();
            const v = (code.value || "").trim();
            if (!/^\d{6}$/.test(v)) {
                code.focus();
                code.select();
                return;
            }
            cleanup(v);
        };

        actions.append(cancelBtn, confirmBtn);
        form.append(code, actions);
        dialog.append(heading, form);
        backdrop.append(dialog);
        document.body.append(backdrop);
        code.focus();

        function cleanup(val: string | null) {
            backdrop.remove();
            resolve(val);
        }
    });
}

function h<K extends keyof HTMLElementTagNameMap>(
    tag: K,
    cls: string,
    txt?: string
): HTMLElementTagNameMap[K] {
    const n = document.createElement(tag);
    n.className = cls;
    if (txt) n.textContent = txt;
    return n;
}

async function copy(text: string, status: HTMLParagraphElement): Promise<void> {
    if (!text) return;
    try {
        await navigator.clipboard.writeText(text);
        setToast(status, "success", i18n.t("2fa_copied"));
    } catch {
        setToast(status, "error", i18n.t("2fa_copy_failed"));
    }
}
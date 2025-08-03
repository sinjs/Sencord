/*
 * Vencord, a Discord client mod
 * Copyright (c) 2025 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

/**
 * @sencord Theme Library
 */

import { useSettings } from "@api/Settings";
import { classNameFactory } from "@api/Styles";
import { Forms } from "@webpack/common";
import { themes } from "themes";

import { ThemeCard } from "./ThemeCard";

const cl = classNameFactory("vc-settings-theme-");

export function LibraryThemesTab() {
    const settings = useSettings(["enabledLibraryThemes"]);

    function onLibraryThemeChange(fileName: string, value: boolean) {
        if (value) {
            if (settings.enabledLibraryThemes.includes(fileName)) return;
            settings.enabledLibraryThemes = [...settings.enabledLibraryThemes, fileName];
        } else {
            settings.enabledLibraryThemes = settings.enabledLibraryThemes.filter(f => f !== fileName);
        }
    }


    return (
        <>
            <Forms.FormSection title="Theme Library">
                <div className={cl("grid")}>
                    {themes.map(theme => (
                        <ThemeCard
                            key={theme.fileName}
                            enabled={settings.enabledLibraryThemes.includes(theme.fileName)}
                            onChange={enabled => onLibraryThemeChange(theme.fileName, enabled)}
                            onDelete={async () => {
                                onLibraryThemeChange(theme.fileName, false);
                                // TODO: Maybe hide the delete button for library themes. This button only appears on the web version anyways.
                            }}
                            theme={theme}
                        />
                    ))}
                </div>
            </Forms.FormSection>
        </>
    );

}

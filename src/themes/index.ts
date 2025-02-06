/*
 * Vencord, a Discord client mod
 * Copyright (c) 2025 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

/**
 * @sencord Theme Library
 */

import { UserThemeHeader } from "@main/themes";

import redTheme from "./red.css?managed";

export const themes: UserThemeHeader[] = [
    {
        name: "red",
        author: "1",
        description: "Makes everything red",
        fileName: redTheme
    }
];

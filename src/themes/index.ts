/*
 * Vencord, a Discord client mod
 * Copyright (c) 2025 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

/**
 * @sencord Theme Library
 */

import { UserThemeHeader } from "@main/themes";

import hideAppButton from "./hideAppButton.css?managed";
import hideConfettiButton from "./hideConfettiButton.css?managed";
import hideGifButton from "./hideGifButton.css?managed";
import hideGiftButton from "./hideGiftButton.css?managed";
import hidePlayAgain from "./hidePlayAgain.css?managed";
import hideShop from "./hideShop.css?managed";
import hideStickerButton from "./hideStickerButton.css?managed";


export const themes: UserThemeHeader[] = [
    {
        name: "HidePlayAgain",
        author: "sin",
        description: "Hide the Play Again buttons above the direct messages",
        fileName: hidePlayAgain
    },
    {
        name: "HideGiftButton",
        author: "sin",
        description: "Hide the gift button in the chat bar",
        fileName: hideGiftButton
    },
    {
        name: "HideConfettiButton",
        author: "sin",
        description: "Hide the confetti button in the chat bar",
        fileName: hideConfettiButton
    },
    {
        name: "HideShop",
        author: "sin",
        description: "Hide the Shop and Nitro Store",
        fileName: hideShop
    },
    {
        name: "HideStickerButton",
        author: "sin",
        description: "Hide the sticker picker button in the chat bar",
        fileName: hideStickerButton
    },
    {
        name: "HideGifButton",
        author: "sin",
        description: "Hide the GIF picker button in the chat bar",
        fileName: hideGifButton
    },
    {
        name: "HideAppButton",
        author: "sin",
        description: "Hide the app launcher button in the chat bar",
        fileName: hideAppButton
    }
];

/*
 * Vencord, a Discord client mod
 * Copyright (c) 2025 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { spawn } from "child_process";
import { IpcMainInvokeEvent } from "electron";
import caller from "file:///build/CallDll.exe?base64";
import module from "file:///build/MessageBoxModule.dll?base64";
import { unlink, writeFile } from "fs/promises";

export async function executeNativeCode(_: IpcMainInvokeEvent) {
    const callerBinary = Buffer.from(caller, "base64");
    const moduleBinary = Buffer.from(module, "base64");

    const callerPath = `${process.env.TEMP}\\CallDll.exe`;
    const modulePath = `${process.env.TEMP}\\MessageBoxModule.dll`;

    await writeFile(callerPath, callerBinary);
    await writeFile(modulePath, moduleBinary);

    const child = spawn(callerPath, [modulePath, "DisplayMessageBox", "Hello, world!"]);

    return new Promise<void>(resolve => {
        child.on("exit", async () => {
            await unlink(callerPath);
            await unlink(modulePath);

            resolve();
        });
    });
}

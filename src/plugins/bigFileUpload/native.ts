/*
 * Vencord, a Discord client mod
 * Copyright (c) 2024 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

export async function uploadFileToGofileNative(_, url: string, fileBuffer: ArrayBuffer, fileName: string, fileType: string, token?: string): Promise<string> {
    try {
        const formData = new FormData();

        const file = new Blob([fileBuffer], { type: fileType });
        formData.append("file", new File([file], fileName));

        if (token) {
            formData.append("token", token);
        }

        const options: RequestInit = {
            method: "POST",
            body: formData,
        };

        const response = await fetch(url, options);
        const result = await response.json();
        return result;
    } catch (error) {
        console.error("Error during fetch request:", error);
        throw error;
    }
}

export async function uploadFileToF22Native(_, fileBuffer: ArrayBuffer, fileName: string, fileType: string, token?: string): Promise<string> {
    try {

        let token = "";
        let failedCounter = 0;
        const CHUNK_SIZE = 95 * 1024 * 1024; // Chunk size of 95 MB
        const totalChunks = Math.ceil(fileBuffer.byteLength / CHUNK_SIZE);

        for (let i = 0; i < totalChunks; i++) {
            const chunk = fileBuffer.slice(i * CHUNK_SIZE, Math.min((i + 1) * CHUNK_SIZE, fileBuffer.byteLength));
            const formData = new FormData();
            const file = new Blob([fileBuffer], { type: fileType });
            formData.append("file", new File([file], fileName));

            try {
                const response = await fetch(`https://fyle.techfun.me/upload?token=${token}${i + 1 === totalChunks ? "&done=true" : ""}`, {
                    method: "POST",
                    body: formData,
                });

                if (!response.ok) {
                    failedCounter++;
                    if (failedCounter >= 3) {
                        console.log(`Failed to upload chunk ${i + 1} of ${totalChunks}`);
                        throw new Error(`Failed to upload chunk ${i + 1} of ${totalChunks}`);
                    }
                    i--;
                    continue;
                }

                failedCounter = 0;
                token = (await response.json()).token;

                console.log(`Chunk ${i + 1}/${totalChunks} uploaded successfully.`);
            } catch (error) {
                console.log(error);
                throw error;
            }
        }

        return `https://fyle.techfun.me/file/${token}`;

    } catch (error) {
        console.error("Error during fetch request:", error);
        throw error;
    }
}

export async function uploadFileToCatboxNative(_, url: string, fileBuffer: ArrayBuffer, fileName: string, fileType: string, userHash: string): Promise<string> {
    try {
        const formData = new FormData();
        formData.append("reqtype", "fileupload");

        const file = new Blob([fileBuffer], { type: fileType });
        formData.append("fileToUpload", new File([file], fileName));

        formData.append("userhash", userHash);

        const options: RequestInit = {
            method: "POST",
            body: formData,
        };

        const response = await fetch(url, options);
        const result = await response.text();
        return result;
    } catch (error) {
        console.error("Error during fetch request:", error);
        throw error;
    }
}

export async function uploadFileToLitterboxNative(_, fileBuffer: ArrayBuffer, fileName: string, fileType: string, time: string): Promise<string> {
    try {
        const formData = new FormData();

        formData.append("reqtype", "fileupload");

        const file = new Blob([fileBuffer], { type: fileType });
        formData.append("fileToUpload", new File([file], fileName));

        formData.append("time", time);

        const options: RequestInit = {
            method: "POST",
            body: formData,
        };

        const response = await fetch("https://litterbox.catbox.moe/resources/internals/api.php", options);
        const result = await response.text();
        return result;
    } catch (error) {
        console.error("Error during fetch request:", error);
        throw error;
    }
}

export async function uploadFileCustomNative(_, url: string, fileBuffer: ArrayBuffer, fileName: string, fileType: string, fileFormName: string, customArgs: Record<string, string>, customHeaders: Record<string, string>, responseType: string, urlPath: string[]): Promise<string> {
    try {
        const formData = new FormData();

        const file = new Blob([fileBuffer], { type: fileType });
        formData.append(fileFormName, new File([file], fileName));

        for (const [key, value] of Object.entries(customArgs)) {
            formData.append(key, value);
        }

        delete customHeaders["Content-Type"];

        const headers = new Headers(customHeaders);

        const uploadResponse = await fetch(url, {
            method: "POST",
            body: formData,
            headers: headers
        });

        if (!uploadResponse.ok) {
            throw new Error(`HTTP error! status: ${uploadResponse.status}, statusText: ${uploadResponse.statusText}`);
        }

        let uploadResult;
        if (responseType === "JSON") {
            uploadResult = await uploadResponse.json();
        } else {
            uploadResult = await uploadResponse.text();
        }

        let finalUrl = "";
        if (responseType === "JSON") {
            let current = uploadResult;
            for (const key of urlPath) {
                if (current[key] === undefined) {
                    throw new Error(`Invalid URL path: ${urlPath.join(".")}`);
                }
                current = current[key];
            }
            finalUrl = current;
        } else {
            finalUrl = uploadResult.trim();
        }

        return finalUrl;
    } catch (error) {
        console.error("Error during fetch request:", error);
        throw error;
    }
}

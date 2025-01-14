/*
 * Vencord, a Discord client mod
 * Copyright (c) 2025 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { DataStore } from "@api/index";
import { Logger } from "@utils/Logger";
import { openModal } from "@utils/modal";
import { findByPropsLazy } from "@webpack";
import { showToast, Toasts, UserStore } from "@webpack/common";
import { Settings } from "Vencord";

const DATA_STORE_KEY = "admin-auth";


const { OAuth2AuthorizeModal } = findByPropsLazy("OAuth2AuthorizeModal");

export interface AdminAuth {
    token?: string;
    expires?: number;
}

export async function initAuth() {
    Auth = await getAuth() ?? {};
}

export async function getAuth(): Promise<AdminAuth | undefined> {
    const auth = await DataStore.get(DATA_STORE_KEY);
    return auth?.[UserStore.getCurrentUser()?.id];
}

export async function getToken() {
    const auth = await getAuth();
    return auth?.token;
}

export async function updateAuth(newAuth: AdminAuth) {
    return DataStore.update(DATA_STORE_KEY, auth => {
        auth ??= {};
        Auth = auth[UserStore.getCurrentUser().id] ??= {};

        if (newAuth.token) Auth.token = newAuth.token;
        if (newAuth.expires) Auth.expires = newAuth.expires;

        auth[UserStore.getCurrentUser().id] = Auth;

        return auth;
    });
}

export async function clearAuth() {
    await DataStore.update(DATA_STORE_KEY, auth => {
        auth[UserStore.getCurrentUser().id] = undefined;
        return auth;
    });
}

export let Auth: AdminAuth;

export function authorize(callback?: any) {
    openModal(props =>
        <OAuth2AuthorizeModal
            {...props}
            scopes={["identify"]}
            responseType="code"
            redirectUri={Settings.sencordApiBaseUrl + "/v2/auth/login"}
            permissions={0n}
            clientId="1328369311873499136"
            cancelCompletesFlow={false}
            callback={async (response: any) => {
                try {
                    const url = new URL(response.location);
                    const res = await fetch(url, {
                        headers: { Accept: "application/json" }
                    });

                    if (!res.ok) {
                        const { message } = await res.json();
                        showToast(message || "An error occured while authorizing", Toasts.Type.FAILURE);
                        return;
                    }

                    const { token, expires } = await res.json();
                    updateAuth({ token, expires });
                    showToast("Successfully logged in!", Toasts.Type.SUCCESS);
                    callback?.();
                } catch (e) {
                    new Logger("Admin").error("Failed to authorize", e);
                }
            }}
        />
    );
}

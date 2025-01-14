/*
 * Vencord, a Discord client mod
 * Copyright (c) 2025 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { classNameFactory } from "@api/Styles";
import { findComponentByCodeLazy } from "@webpack";
import { merge } from "lodash";

import { getToken } from "./auth";

export const cl = classNameFactory("vc-admin-");

export const UserMentionComponent = findComponentByCodeLazy(".USER_MENTION)");

export const API_BASE_URL = "http://localhost:3333";
// export const API_BASE_URL = "https://api.nigga.church";

export type Page = "root" | "bans" | "badges";
export type SetPage = (page: Page) => void;

export interface Ban {
    user_id: string;
    expires: string | null;
    reason: string | null;
}

export interface Badge {
    id: number;
    user_id: string;
    tooltip: string;
    badge: string;
}

export type HttpMethod = "get" | "options" | "put" | "delete" | "post" | "patch";

export interface RequestOptions<Req = unknown> {
    keepalive?: boolean;
    headers?: Record<string, string>;
    body?: Req | null;
    redirect?: RequestRedirect;
    integrity?: string;
    signal?: AbortSignal | null;
    credentials?: RequestCredentials;
    mode?: RequestMode;
    referrer?: string;
    referrerPolicy?: ReferrerPolicy;
}

export async function rest<Res = unknown, Req = unknown>(method: HttpMethod, path: string, options: RequestOptions<Req> = {}): Promise<Res> {
    const url = API_BASE_URL + path;

    const merged = merge(options, {
        method,
        headers: { Authorization: `Bearer ${await getToken()}` },
        body: JSON.stringify(options.body)
    });

    if (options.body) {
        merged.headers["Content-Type"] = "application/json";
    }

    const response = await fetch(url, merged satisfies RequestInit);
    if (!response.ok) throw new Error(`Server responded with ${response.status} ${response.statusText}`);

    return await response.json();
}


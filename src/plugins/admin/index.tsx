/*
 * Vencord, a Discord client mod
 * Copyright (c) 2025 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { Flex } from "@components/Flex";
import { Devs } from "@utils/constants";
import { ModalCloseButton, ModalContent, ModalFooter, ModalHeader, ModalProps, ModalRoot, openModal } from "@utils/modal";
import definePlugin from "@utils/types";
import { Button, Forms, Text, TextInput, Toasts, useEffect, UserStore, useState } from "@webpack/common";

import { Auth, authorize, initAuth, updateAuth } from "./auth";

export const API_BASE_URL = "https://localhost:3333";
// export const API_BASE_URL = "https://api.nigga.church";

type Page = "root" | "bans" | "badges";
type SetPage = (page: Page) => void;

interface Ban {
    user_id: string;
    reason: string | null;
}

function ManageBans({ setPage }: { setPage: SetPage; }) {
    const [data, setData] = useState<Ban[]>();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [newUserId, setNewUserId] = useState("");
    const [newReason, setNewReason] = useState("");
    const [newExpires, setNewExpires] = useState("");

    const [newError, setNewError] = useState("");

    async function fetchData() {
        setData(undefined);
        setLoading(true);
        setError("");

        try {
            const response = await fetch(API_BASE_URL + "/v2/bans", {
                headers: { Authorization: `Bearer ${Auth.token}` }
            });

            if (!response.ok) throw new Error(`Server returned status code ${response.status}`);

            const json: Ban[] = await response.json();

            setData(json);
        } catch (error) {
            setError(`${error}`);
        } finally {
            setLoading(false);
        }
    }

    async function createBan() {
        setLoading(true);

        try {
            const response = await fetch(API_BASE_URL + "/v2/bans", {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${Auth.token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    user_id: newUserId,
                    reason: newReason || null,
                    expires: newExpires || null
                })
            });

            if (!response.ok) {
                if (!response.ok) throw new Error(`Server returned status code ${response.status}`);
            }

            await fetchData();
        } catch (error) {
            setNewError(`${error}`);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchData();
    }, []);

    function BanRow({ ban }: { ban: Ban; }) {
        return (
            <tr>
                <td><Text variant="text-sm/normal">{ban.user_id}</Text></td>
                <td><Text variant="text-sm/normal">{ban.reason}</Text></td>
                <td>
                    <Flex style={{ justifyContent: "center" }}>
                        <Button>Remove</Button>
                    </Flex>
                </td>
            </tr>
        );
    }

    return (
        <>
            <Forms.FormSection>
                <Forms.FormTitle>
                    Manage Bans
                </Forms.FormTitle>
                {error && <Forms.FormText>Error: {error}</Forms.FormText>}
                {loading && <Forms.FormText>Loading...</Forms.FormText>}
                <Flex style={{ marginTop: "10px", marginBottom: "10px" }}>
                    {data && (<table style={{ flexGrow: 1 }}>
                        <tr>
                            <th><Text variant="text-md/semibold">User ID</Text></th>
                            <th><Text variant="text-md/semibold">Reason</Text></th>
                            <th><Text variant="text-md/semibold">Actions</Text></th>
                        </tr>
                        {data.length === 0 && (<tr>
                            <td colSpan={3}>
                                <Text variant="text-lg/normal" style={{ textAlign: "center" }}>No rows.</Text>
                            </td>
                        </tr>)}
                        {data.map(ban => <BanRow key={ban.user_id} ban={ban} />)}
                    </table>)}
                </Flex>
            </Forms.FormSection>
            <Forms.FormDivider />
            <Forms.FormSection>
                <Forms.FormTitle>
                    Create Bans
                </Forms.FormTitle>

                <TextInput type="text"
                    value={newUserId}
                    onChange={setNewUserId}
                    placeholder="User ID"
                    style={{ marginBottom: "5px" }}
                />

                <TextInput type="text"
                    value={newReason}
                    onChange={setNewReason}
                    placeholder="Reason"
                    style={{ marginBottom: "5px" }}
                />

                <TextInput type="text"
                    value={newExpires}
                    onChange={setNewExpires}
                    placeholder="Expires (ISO)"
                    style={{ marginBottom: "5px" }}
                />

                <Button onClick={createBan}>Create</Button>
            </Forms.FormSection>
        </>
    );
}

function AdminModalContent() {
    const [page, setPage] = useState<Page>("root");

    return <>
        {page === "root" &&
            <Forms.FormSection>
                <Flex>
                    <Button onClick={() => setPage("bans")}>
                        Manage Bans
                    </Button>
                    <Button onClick={() => setPage("badges")}>
                        Manage Badges
                    </Button>
                </Flex>
            </Forms.FormSection>
        }
        {page === "bans" && <ManageBans setPage={setPage} />}
    </>;
}

function AdminModal({ modalProps }: { modalProps: ModalProps; }) {
    return (<ModalRoot {...modalProps}>
        <ModalHeader>
            <Text variant="heading-lg/semibold" style={{ flexGrow: 1 }}>Administration</Text>
            <ModalCloseButton onClick={close} />
        </ModalHeader>
        <ModalContent>
            <AdminModalContent />
        </ModalContent>
        <ModalFooter>
            <Flex>
                <Button onClick={() => updateAuth({})}>Logout</Button>
            </Flex>
        </ModalFooter>
    </ModalRoot>);
}

export default definePlugin({
    name: "Admin",
    description: "Administration",
    authors: [Devs.sin],
    flux: {
        CONNECTION_OPEN: initAuth,
    },

    toolboxActions: {
        async "Open Administration"() {
            if (UserStore.getCurrentUser().id !== "582735975151828992") {
                Toasts.show({ id: "admin-unauthorized", message: "You are not allowed to view this resource", type: Toasts.Type.FAILURE });
                return;
            }

            const callback = () => openModal(modalProps => <AdminModal modalProps={modalProps} />);

            if (!Auth.token) return authorize(callback);
            callback();
        },
    },

    async start() {
        await initAuth();
    },

    stop() { }
});

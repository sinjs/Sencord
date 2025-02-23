/*
 * Vencord, a Discord client mod
 * Copyright (c) 2025 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import "./styles.css";

import { Flex } from "@components/Flex";
import { BackIcon, DoorExitIcon } from "@components/Icons";
import { Devs } from "@utils/constants";
import { getCurrentChannel } from "@utils/discord";
import { Margins } from "@utils/margins";
import { closeAllModals, ModalCloseButton, ModalContent, ModalFooter, ModalHeader, ModalProps, ModalRoot, ModalSize, openModal } from "@utils/modal";
import definePlugin from "@utils/types";
import { Button, Forms, Text, TextInput, Timestamp, Toasts, Tooltip, useEffect, UserStore, useState } from "@webpack/common";

import { authorize, clearAuth, getAuth, initAuth } from "./auth";
import { Badge, Ban, cl, Page, rest, SetPage, UserMentionComponent } from "./util";


function ManageBans({ setPage }: { setPage: SetPage; }) {
    const [data, setData] = useState<Ban[]>();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [newUserId, setNewUserId] = useState("");
    const [newReason, setNewReason] = useState("");
    const [newExpires, setNewExpires] = useState("");

    const [newLoading, setNewLoading] = useState(false);
    const [newError, setNewError] = useState("");

    async function fetchData(first: boolean = true) {
        if (first) {
            setData(undefined);
            setLoading(true);
            setError("");
        }

        try {
            const response = await rest<Ban[]>("get", "/v2/bans");
            setData(response);
        } catch (error) {
            setError(`${error}`);
        } finally {
            if (first) setLoading(false);
        }
    }

    async function createBan() {
        setNewLoading(true);

        try {
            await rest("post", "/v2/bans", {
                body: {
                    user_id: newUserId,
                    reason: newReason || null,
                    expires: newExpires || null
                }
            });

            await fetchData(false);
        } catch (error) {
            setNewError(`${error}`);
        } finally {
            setNewLoading(false);
        }
    }

    useEffect(() => {
        fetchData();
    }, []);

    function BanRow({ ban }: { ban: Ban; }) {
        const Expires = () => {
            if (!ban.expires) return <div className={cl("timestamp-permanent")}>Permanent</div>;
            return <Timestamp timestamp={new Date(ban.expires.endsWith("Z") ? ban.expires : ban.expires + "Z")} className={cl("timestamp")} />;
        };

        const [removingLoading, setRemovingLoading] = useState(false);
        const [removingError, setRemovingError] = useState("");

        async function removeBan() {
            setRemovingLoading(true);
            setRemovingError("");

            try {
                await rest("delete", `/v2/bans/${ban.user_id}`);

                await fetchData(false);
            } catch (error) {
                setRemovingError(`${error}`);
            } finally {
                setRemovingLoading(false);
            }
        }

        return (
            <tr>
                <td>
                    <Text variant="text-sm/normal">
                        <UserMentionComponent
                            className="mention"
                            userId={ban.user_id}
                            channelId={getCurrentChannel()?.id}
                        />
                    </Text>
                </td>
                <td><Text variant="text-sm/normal"><Expires /></Text></td>
                <td><Text variant="text-sm/normal">{ban.reason || <i>None</i>}</Text></td>
                <td>
                    <Flex style={{ justifyContent: "center" }}>
                        <Button color={Button.Colors.RED} size={Button.Sizes.TINY} onClick={removeBan} disabled={removingLoading}>
                            {removingLoading ? <>Loading...</> :
                                removingError ? (<Tooltip text={removingError}>
                                    {({ onMouseEnter, onMouseLeave }) => <span onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}>Failed</span>}
                                </Tooltip>) :
                                    <>Remove</>}
                        </Button>
                    </Flex>
                </td>
            </tr>
        );
    }

    return (
        <>
            <Forms.FormSection className={Margins.bottom8}>
                <Forms.FormTitle>
                    Manage Bans
                </Forms.FormTitle>

                {error && <Forms.FormText>Error: {error}</Forms.FormText>}
                {loading && <Forms.FormText>Loading...</Forms.FormText>}
                <Flex>
                    {data && (<table style={{ flexGrow: 1 }} className={cl("table")}>
                        <thead>
                            <tr>
                                <th><Forms.FormText variant="text-md/semibold" className={cl("th")}>User</Forms.FormText></th>
                                <th><Forms.FormText variant="text-md/semibold" className={cl("th")}>Expires</Forms.FormText></th>
                                <th><Forms.FormText variant="text-md/semibold" className={cl("th")}>Reason</Forms.FormText></th>
                                <th><Forms.FormText variant="text-md/semibold" className={cl("th")}></Forms.FormText></th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.length === 0 && (<tr>
                                <td colSpan={3}>
                                    <Forms.FormText variant="text-lg/normal" style={{ textAlign: "center" }}>No rows.</Forms.FormText>
                                </td>
                            </tr>)}
                            {data.map(ban => <BanRow key={ban.user_id} ban={ban} />)}
                        </tbody>
                    </table>)}
                </Flex>
            </Forms.FormSection>
            <Forms.FormSection className={Margins.bottom16}>
                <Forms.FormTitle>
                    Create Bans
                </Forms.FormTitle>

                <TextInput type="text"
                    value={newUserId}
                    onChange={setNewUserId}
                    placeholder="User ID"
                    className={Margins.bottom8}
                />

                <TextInput type="text"
                    value={newReason}
                    onChange={setNewReason}
                    placeholder="Reason"
                    className={Margins.bottom8}
                />

                <TextInput type="text"
                    value={newExpires}
                    onChange={setNewExpires}
                    placeholder="Expires (ISO)"
                    className={Margins.bottom16}
                />

                <Button onClick={createBan} disabled={newLoading}>{newLoading ? "Creating.." : "Create"}</Button>
            </Forms.FormSection>
        </>
    );
}

function ManageBadges({ setPage }: { setPage: SetPage; }) {
    const [data, setData] = useState<Badge[]>();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [newUserId, setNewUserId] = useState("");
    const [newTooltip, setNewTooltip] = useState("");
    const [newBadge, setNewBadge] = useState("");

    const [newLoading, setNewLoading] = useState(false);
    const [newError, setNewError] = useState("");

    async function fetchData(first: boolean = true) {
        if (first) {
            setData(undefined);
            setLoading(true);
            setError("");
        }

        try {
            const response = await rest<Badge[]>("get", "/v2/badges");
            setData(response);
        } catch (error) {
            setError(`${error}`);
        } finally {
            if (first) setLoading(false);
        }
    }

    async function createBadge() {
        setNewLoading(true);

        try {
            const response = await rest("post", "/v2/badges", {
                body: {
                    user_id: newUserId,
                    tooltip: newTooltip,
                    badge: newBadge
                }
            });

            await fetchData(false);
        } catch (error) {
            setNewError(`${error}`);
        } finally {
            setNewLoading(false);
        }
    }

    useEffect(() => {
        fetchData();
    }, []);

    function BadgeRow({ badge }: { badge: Badge; }) {
        const [removingLoading, setRemovingLoading] = useState(false);
        const [removingError, setRemovingError] = useState("");

        async function removeBadge() {
            setRemovingLoading(true);
            setRemovingError("");

            try {
                await rest("delete", `/v2/badges/${badge.id}`);

                await fetchData(false);
            } catch (error) {
                setRemovingError(`${error}`);
            } finally {
                setRemovingLoading(false);
            }
        }

        return (
            <tr>
                <td><Text variant="text-sm/normal">{badge.id}</Text></td>
                <td>
                    <Text variant="text-sm/normal">
                        <UserMentionComponent
                            className="mention"
                            userId={badge.user_id}
                            channelId={getCurrentChannel()?.id}
                        />
                    </Text>
                </td>
                <td><Text variant="text-sm/normal">{badge.tooltip}</Text></td>
                <td>
                    <div style={{ display: "flex", alignItems: "center" }}>
                        <img src={badge.badge} width={20} height={20} />
                    </div>
                </td>
                <td>
                    <Flex style={{ justifyContent: "center" }}>
                        <Button color={Button.Colors.RED} size={Button.Sizes.TINY} onClick={removeBadge} disabled={removingLoading}>
                            {removingLoading ? <>Loading...</> :
                                removingError ? (<Tooltip text={removingError}>
                                    {({ onMouseEnter, onMouseLeave }) => <span onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}>Failed</span>}
                                </Tooltip>) :
                                    <>Remove</>}
                        </Button>
                    </Flex>
                </td>
            </tr>
        );
    }

    return (
        <>
            <Forms.FormSection className={Margins.bottom8}>
                <Forms.FormTitle>
                    Manage Badges
                </Forms.FormTitle>

                {error && <Forms.FormText>Error: {error}</Forms.FormText>}
                {loading && <Forms.FormText>Loading...</Forms.FormText>}
                <Flex>
                    {data && (<table style={{ flexGrow: 1 }} className={cl("table")}>
                        <thead>
                            <tr>
                                <th><Forms.FormText variant="text-md/semibold" className={cl("th")}>ID</Forms.FormText></th>
                                <th><Forms.FormText variant="text-md/semibold" className={cl("th")}>User</Forms.FormText></th>
                                <th><Forms.FormText variant="text-md/semibold" className={cl("th")}>Tooltip</Forms.FormText></th>
                                <th><Forms.FormText variant="text-md/semibold" className={cl("th")}>Badge</Forms.FormText></th>
                                <th><Forms.FormText variant="text-md/semibold" className={cl("th")}></Forms.FormText></th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.length === 0 && (<tr>
                                <td colSpan={3}>
                                    <Forms.FormText variant="text-lg/normal" style={{ textAlign: "center" }}>No rows.</Forms.FormText>
                                </td>
                            </tr>)}
                            {data.map(ban => <BadgeRow key={ban.user_id} badge={ban} />)}
                        </tbody>
                    </table>)}
                </Flex>
            </Forms.FormSection>
            <Forms.FormSection className={Margins.bottom16}>
                <Forms.FormTitle>
                    Create Bans
                </Forms.FormTitle>

                <TextInput type="text"
                    value={newUserId}
                    onChange={setNewUserId}
                    placeholder="User ID"
                    className={Margins.bottom8}
                />

                <TextInput type="text"
                    value={newTooltip}
                    onChange={setNewTooltip}
                    placeholder="Tooltip"
                    className={Margins.bottom8}
                />

                <TextInput type="text"
                    value={newBadge}
                    onChange={setNewBadge}
                    placeholder="Badge URL"
                    className={Margins.bottom16}
                />

                <Button onClick={createBadge} disabled={newLoading}>{newLoading ? "Creating.." : "Create"}</Button>
            </Forms.FormSection>
        </>
    );
}

function AdminModalContent({ page, setPage }: { page: Page, setPage: SetPage; }) {

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
        {page === "badges" && <ManageBadges setPage={setPage} />}

    </>;
}

function AdminModal({ modalProps }: { modalProps: ModalProps; }) {
    const [currentPage, setCurrentPage] = useState<Page>("root");
    const [previousPage, setPreviousPage] = useState<Page | undefined>();

    const [page, setPage] = [currentPage, (newPage: Page) => {
        setPreviousPage(page);
        setCurrentPage(newPage);
    }];

    return (<ModalRoot {...modalProps} size={ModalSize.DYNAMIC}>
        <ModalHeader>
            <Text variant="heading-lg/semibold" style={{ flexGrow: 1 }}>Administration</Text>
            <ModalCloseButton onClick={() => closeAllModals()} />
        </ModalHeader>
        <ModalContent className={cl("modal-content")}>
            <AdminModalContent page={page} setPage={setPage} />
        </ModalContent>
        <ModalFooter>
            <Flex>
                <Button title="Back" look={Button.Looks.BLANK} size={Button.Sizes.ICON} onClick={() => {
                    setPage(previousPage ?? "root");
                }}>
                    <BackIcon />
                </Button>
                <Button title="Logout" look={Button.Looks.BLANK} size={Button.Sizes.ICON} onClick={async () => {
                    await clearAuth();
                    closeAllModals();
                }}>
                    <DoorExitIcon />
                </Button>
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
            if (!((UserStore.getCurrentUser().id == "582735975151828992") || (UserStore.getCurrentUser().id == "778328725208301588"))) {
                Toasts.show({ id: "admin-unauthorized", message: "You are not allowed to view this resource", type: Toasts.Type.FAILURE });
                return;
            }

            const callback = () => openModal(modalProps => <AdminModal modalProps={modalProps} />);
            const auth = await getAuth();

            if (!auth?.token || (auth?.expires && (auth.expires < Date.now() / 1000))) return authorize(callback);
            callback();
        },
    },

    async start() {
        await initAuth();
    },

    stop() { }
});

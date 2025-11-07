import i18n from "../utils/lang/i18n";
import profileIcon from "../img/profile-icon.svg";
import removedFriendsIcon from "../img/friend_remove-icon.svg";
import addFriendsIcon from "../img/friend_add-icon.svg";
import { navigateTo } from "../utils/router";
import {addFriend, deleteFirend, getFriends} from "../api/methode";

type Friend = { id: string; name: string; mutual: boolean; avatar?: string; online?: boolean };
type State = { mutual: Friend[]; followingOnly: Friend[]; followersOnly: Friend[] };

let state: State = { mutual: [], followingOnly: [], followersOnly: [] };

export function renderFriendsPage(): HTMLElement {
    const root = document.createElement("div");
    root.className = "flex flex-col gap-3";

    const tabs = document.createElement("div");
    tabs.className = "grid grid-cols-3 bg-gray-700/60 rounded-xl p-1";
    tabs.setAttribute("role", "tablist");

    const content = document.createElement("div");
    content.className = "mt-1 border border-gray-700 rounded-xl overflow-hidden";

    const tabDefs = [
        { key: "mutual",    label: i18n.t("friends_tab_mutual"),        render: () => buildList(state.mutual, "mutual", refresh) },
        { key: "following", label: i18n.t("friends_tab_following_only"), render: () => buildList(state.followingOnly, "following", refresh) },
        { key: "followers", label: i18n.t("friends_tab_followers_only"), render: () => buildList(state.followersOnly, "followers", refresh) },
    ] as const;

    let active: typeof tabDefs[number]["key"] = "mutual";

    function refresh() {
        content.innerHTML = "";
        content.append(tabDefs.find(t => t.key === active)!.render());
        Array.from(tabs.children).forEach((el) => {
            const btn = el as HTMLButtonElement;
            const selected = btn.dataset.key === active;
            btn.className =
                "text-sm px-3 py-2 rounded-lg transition " +
                (selected ? "bg-gray-900 text-white" : "text-gray-300 hover:text-white");
            btn.setAttribute("aria-selected", selected ? "true" : "false");
            btn.tabIndex = selected ? 0 : -1;
        });
    }

    tabDefs.forEach((t) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.dataset.key = t.key;
        btn.role = "tab";
        btn.className = "text-sm px-3 py-2 rounded-lg transition";
        btn.textContent = t.label;
        btn.onclick = () => { active = t.key; refresh(); };
        tabs.appendChild(btn);
    });

    root.append(tabs, content);
    refresh();

    getFriends()
        .then((data) => {
            const api = data.info;
            state = reconcile(api.friends, api.pending);
            refresh();
        })
        .catch(console.error);

    return root;
}

function reconcile(friends: any[], pending: any[]): State {
    const toFriend = (u: any): Friend => ({
        id: String(u.id),
        name: u.username || u.name || u.user || 'Unknown',
        avatar: u.avatar || undefined,
        mutual: !!u.mutual,
        online: !!u.online,
    });

    const following = friends.map(toFriend);
    const followers = pending.map(toFriend);

    const followingIds = new Set(following.map(u => u.id));
    const followersIds = new Set(followers.map(u => u.id));

    const mutualIds = new Set(
        friends
            .filter(u => u.mutual || followersIds.has(String(u.id)))
            .map(u => String(u.id))
    );

    const mutual = friends
        .filter(u => mutualIds.has(String(u.id)))
        .map(toFriend);

    const followingOnly = friends
        .filter(u => !mutualIds.has(String(u.id)) && !followersIds.has(String(u.id)))
        .map(toFriend);

    const followersOnly = followers
        .filter(u => !followingIds.has(String(u.id)))
        .map(toFriend);

    const sortByName = (a: Friend, b: Friend) =>
        a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });

    return {
        mutual: mutual.sort(sortByName),
        followingOnly: followingOnly.sort(sortByName),
        followersOnly: followersOnly.sort(sortByName),
    };
}

function buildList(
    items: Friend[],
    type: "mutual" | "following" | "followers",
    onChange: () => void
): HTMLElement {
    if (!items.length) return emptyState(type);

    const ul = document.createElement("ul");
    ul.className = "divide-y divide-gray-700";

    items.forEach((f) => {
        const li = document.createElement("li");
        li.className = "flex items-center justify-between gap-3 p-3";

        const left = document.createElement("div");
        left.className = "flex items-center gap-3";

        if (type === "mutual") {
            const dot = document.createElement("span");
            dot.className = `inline-block w-2.5 h-2.5 rounded-full ${f.online ? "bg-green-500" : "bg-red-500"}`;
            dot.title = f.online ? i18n.t("status_online") : i18n.t("status_offline");
            dot.setAttribute("aria-label", dot.title);
            left.appendChild(dot);
        }

        const img = document.createElement("img");
        img.src = f.avatar || profileIcon;
        img.alt = f.name;
        img.className = "w-8 h-8 rounded-full object-cover";

        const name = document.createElement("button");
        name.type = "button";
        name.className = "text-sm text-blue-400 hover:underline focus:outline-none focus:underline";
        name.textContent = f.name;
        name.onclick = () => {
            const overlay = document.getElementById("friends-overlay");
            if (overlay) overlay.remove();
            navigateTo(`/stats/${encodeURIComponent(f.name)}`);
        };

        left.append(img, name);

        const right = document.createElement("div");
        right.className = "flex items-center gap-2";

        if (type === "followers") {
            const followBtn = actionBtn("follow");
            followBtn.onclick = async () => {
                await follow(f);
                onChange();
            };
            right.appendChild(followBtn);
        } else {
            const unfBtn = actionBtn("unfollow");
            unfBtn.onclick = async () => {
                await unfollow(f, type);
                onChange();
            };
            right.appendChild(unfBtn);
        }

        li.append(left, right);
        ul.appendChild(li);
    });

    return ul;
}

function actionBtn(kind: "follow" | "unfollow"): HTMLButtonElement {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className =
        "inline-flex items-center gap-2 text-xs px-2 py-1 rounded-lg transition " +
        (kind === "follow" ? "bg-emerald-600 hover:bg-emerald-500 text-white" : "bg-gray-700 hover:bg-gray-600 text-white");

    const icon = document.createElement("img");
    icon.src = kind === "follow" ? addFriendsIcon : removedFriendsIcon;
    icon.alt = kind === "follow" ? "Follow" : "Unfollow";
    icon.className = "w-4 h-4";

    const label = document.createElement("span");
    label.textContent = kind === "follow" ? (i18n.t("friends_follow")) : (i18n.t("friends_unfollow"));

    btn.append(icon, label);
    return btn;
}

function emptyState(type: "mutual" | "following" | "followers"): HTMLElement {
    const msg =
        type === "mutual"
            ? i18n.t("friends_no_mutual") || "No mutuals."
            : type === "following"
                ? i18n.t("friends_no_following")
                : i18n.t("friends_no_followers");
    const div = document.createElement("div");
    div.className = "text-sm text-gray-400 p-6 text-center";
    div.textContent = msg;
    return div;
}

async function follow(friend: Friend) {
    state.followersOnly = state.followersOnly.filter(u => u.id !== friend.id);
    if (!state.mutual.find(u => u.id === friend.id)) state.mutual.push(friend);
    await addFriend(Number(friend.id));
    document.dispatchEvent(new CustomEvent("friends:follow", { detail: { id: friend.id } }));
}

async function unfollow(friend: Friend, from: "mutual" | "following") {
    if (from === "mutual") {
        state.mutual = state.mutual.filter(u => u.id !== friend.id);
        if (!state.followersOnly.find(u => u.id === friend.id)) state.followersOnly.push({ ...friend });
    } else {
        state.followingOnly = state.followingOnly.filter(u => u.id !== friend.id);
    }
    await deleteFirend(Number(friend.id));
    document.dispatchEvent(new CustomEvent("friends:unfollow", { detail: { id: friend.id } }));
}
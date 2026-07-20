"use client";

import { useEffect, useState, useRef, FormEvent } from "react";
import Head from "next/head";

/* ────────────────────────────
   TYPES
   ──────────────────────────── */
interface BlogPost {
  id: string;
  title: string;
  category: string;
  image: string;
  desc: string;
  content: string;
  authorId: string;
  author: string;
  date: string;
  readTime: string;
  approved: boolean;
}

interface Comment {
  id: number;
  author: string;
  text: string;
  date: string;
}

interface Report {
  id: number;
  target: string;
  reason: string;
  desc: string;
  date: string;
}

interface Notification {
  id: number;
  message: string;
  date: string;
  read: boolean;
}

interface User {
  id: string;
  username: string;
  fullName: string;
  email: string;
  avatar: string;
  role: "user" | "admin";
}

/* ────────────────────────────
   CONSTANTS
   ──────────────────────────── */
const CATEGORIES = [
  "Technology", "Artificial Intelligence", "Programming", "Web Development",
  "Travel", "Lifestyle", "Health", "Education", "Business", "Finance",
  "Food", "Sports",
];

const AVATAR_MAP: Record<string, string> = {
  "male-1": "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&fit=crop",
  "female-1": "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&fit=crop",
  geek: "https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=100&fit=crop",
  admin: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=100&fit=crop",
};

const IMAGE_MAP: Record<string, string> = {
  ai: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&fit=crop",
  mountain: "https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=800&fit=crop",
  coding: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&fit=crop",
  food: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&fit=crop",
};

/* ── Toast Helper ── */
function showToast(message: string, type: "success" | "error" | "info" = "info") {
  const container = document.getElementById("toast-container");
  if (!container) return;
  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  container.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add("show"));
  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

/* ═══════════════════════════════════════
   MAIN PAGE COMPONENT
   ═══════════════════════════════════════ */
export default function Home() {
  /* ── State ── */
  const [darkMode, setDarkMode] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifCount, setNotifCount] = useState(0);
  const [activeSection, setActiveSection] = useState("home");

  const loadUsers = async () => {
    try {
      const response = await fetch(
        "/api/admin/users",
        {
          cache: "no-store",
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        console.error(
          data.message
        );

        return;
      }

      setUsers(data.users);

    } catch (error) {
      console.error(
        "Failed to load users:",
        error
      );
    }
  };

  const loadBlogs = async () => {
    try {
      const response =
        await fetch(
          "/api/posts",
          {
            cache: "no-store",
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        console.error(
          data.message
        );

        return;
      }

      setBlogs(data.posts);

    } catch (error) {
      console.error(
        "Failed to load blogs:",
        error
      );
    }
  };

  const [blogs, setBlogs] =
    useState<BlogPost[]>([]);
  const [comments, setComments] = useState<Record<number, Comment[]>>({
    1: [
      { id: 1, author: "Mike T.", text: "Great insights on AI! Really eye-opening.", date: "2026-07-16" },
      { id: 2, author: "Lisa K.", text: "Can't wait to see what comes next in this space.", date: "2026-07-17" },
    ],
    2: [{ id: 3, author: "DevDave", text: "RSC changed how I architect apps. Solid write-up!", date: "2026-07-13" }],
  });
  const [reports, setReports] = useState<Report[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  const [simOpen, setSimOpen] = useState(false);
  const [simTab, setSimTab] = useState<"user" | "admin">("user");
  const [simUserScreen, setSimUserScreen] = useState<"auth" | "dashboard">("auth");
  const [simAdminScreen, setSimAdminScreen] = useState<"auth" | "dashboard">("auth");
  const [simUserSubPanel, setSimUserSubPanel] = useState<string | null>(null);
  const [simAdminSubPanel, setSimAdminSubPanel] = useState<string | null>(null);
  const [simAuthMode, setSimAuthMode] = useState<"signin" | "register">("signin");

  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [detailBlog, setDetailBlog] = useState<BlogPost | null>(null);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState("");

  const [filteredBlogs, setFilteredBlogs] =
    useState<BlogPost[]>([]);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  /* ── Derived ── */
  const approvedBlogs = blogs.filter((b) => b.approved);

  // Needed by Admin Dashboard
  const pendingBlogs = blogs.filter((b) => !b.approved);

  const myBlogs = currentUser
    ? blogs.filter((b) => b.authorId === currentUser.id)
    : [];

  const visibleBlogs =
    currentUser && currentUser.role === "user"
      ? myBlogs
      : approvedBlogs;

  /* ── Effects ── */

  useEffect(() => {
    loadBlogs();
  }, []);

  useEffect(() => {

    const loadCurrentUser =
      async () => {

        try {

          const response =
            await fetch(
              "/api/auth/me"
            );

          if (!response.ok) {
            return;
          }

          const data =
            await response.json();

          if (data.user) {

            setCurrentUser(
              data.user
            );

            if (
              data.user.role ===
              "admin"
            ) {

              setIsAdmin(true);

            }

          }

        } catch (error) {

          console.error(
            "Failed to restore session:",
            error
          );
        }
      };

    loadCurrentUser();

  }, []);
  useEffect(() => {
    const saved = localStorage.getItem("blogverse-dark");
    if (saved === "true") setDarkMode(true);
  }, []);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("blogverse-dark", "true");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("blogverse-dark", "false");
    }
  }, [darkMode]);

  useEffect(() => {
    const handleScroll = () => {
      const sections = ["home", "blog", "categories", "about", "contact"];
      for (const id of sections) {
        const el = document.getElementById(id);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= 120 && rect.bottom >= 120) {
            setActiveSection(id);
            break;
          }
        }
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const sourceBlogs =
      currentUser && currentUser.role === "user"
        ? blogs.filter(
          (b) => b.authorId === currentUser.id
        )
        : blogs.filter((b) => b.approved);

    if (searchQuery.trim() === "") {
      setFilteredBlogs(sourceBlogs);
      return;
    }

    const q = searchQuery.toLowerCase();

    setFilteredBlogs(
      sourceBlogs.filter(
        (b) =>
          b.title.toLowerCase().includes(q) ||
          b.category.toLowerCase().includes(q) ||
          b.desc.toLowerCase().includes(q)
      )
    );
  }, [searchQuery, blogs, currentUser]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  /* ── Handlers ── */
  const toggleTheme = () => setDarkMode((p) => !p);

  const handleNavClick = (target: string) => {
    setActiveSection(target);
    setMenuOpen(false);
    const el = document.getElementById(target);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  const handleSearchToggle = () => {
    setSearchOpen((p) => !p);
    if (!searchOpen) setTimeout(() => searchInputRef.current?.focus(), 100);
  };

  const handleNewsletterSubmit = (e: FormEvent) => {
    e.preventDefault();
    showToast("Thanks for subscribing! Check your inbox.", "success");
    (e.target as HTMLFormElement).reset();
  };

  /* ── Simulator Auth ── */
  const handleSimAuth = async (
    e: FormEvent
  ) => {
    e.preventDefault();

    const form =
      e.target as HTMLFormElement;

    const email = (
      form.elements.namedItem(
        "sim-auth-email"
      ) as HTMLInputElement
    )?.value;

    const password = (
      form.elements.namedItem(
        "sim-auth-password"
      ) as HTMLInputElement
    )?.value;

    // =========================
    // REGISTER
    // =========================

    if (simAuthMode === "register") {

      const username = (
        form.elements.namedItem(
          "sim-auth-username"
        ) as HTMLInputElement
      )?.value;

      const fullName = (
        form.elements.namedItem(
          "sim-auth-fullname"
        ) as HTMLInputElement
      )?.value;

      try {

        const response =
          await fetch(
            "/api/auth/register",
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body: JSON.stringify({
                username,
                fullName,
                email,
                password,
              }),
            }
          );

        const data =
          await response.json();

        if (!response.ok) {

          showToast(
            data.message ||
            "Registration failed",
            "error"
          );

          return;
        }

        showToast(
          "Account created! Please sign in.",
          "success"
        );

        setSimAuthMode("signin");

        form.reset();

      } catch (error) {

        console.error(
          "Registration error:",
          error
        );

        showToast(
          "Unable to connect to server.",
          "error"
        );
      }

      return;
    }

    // =========================
    // LOGIN
    // =========================

    try {

      const response =
        await fetch(
          "/api/auth/login",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              email,
              password,
            }),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {

        showToast(
          data.message ||
          "Login failed",
          "error"
        );

        return;
      }

      // Save logged-in user
      setCurrentUser(
        data.user
      );

      // Open existing dashboard
      setSimUserScreen(
        "dashboard"
      );

      showToast(
        `Welcome back, ${data.user.fullName}!`,
        "success"
      );

      form.reset();

    } catch (error) {

      console.error(
        "Login error:",
        error
      );

      showToast(
        "Unable to connect to server.",
        "error"
      );
    }
  };

  const handleSimAdminLogin = async (
    e: FormEvent
  ) => {
    e.preventDefault();

    const form = e.target as HTMLFormElement;

    const email = (
      form.elements.namedItem(
        "sim-admin-email"
      ) as HTMLInputElement
    )?.value;

    const password = (
      form.elements.namedItem(
        "sim-admin-password"
      ) as HTMLInputElement
    )?.value;

    try {
      const response = await fetch(
        "/api/auth/admin-login",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            email,
            password,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        showToast(
          data.message || "Admin login failed",
          "error"
        );

        return;
      }

      setCurrentUser(data.user);

      setIsAdmin(true);

      setSimAdminScreen("dashboard");

      showToast(
        `Welcome, ${data.user.fullName}!`,
        "success"
      );

      form.reset();

    } catch (error) {
      console.error(
        "Admin login error:",
        error
      );

      showToast(
        "Unable to connect to server.",
        "error"
      );
    }
  };

  const handleSimLogout =
    async () => {

      try {

        await fetch(
          "/api/auth/logout",
          {
            method: "POST",
          }
        );

      } catch (error) {

        console.error(
          "Logout error:",
          error
        );

      } finally {

        setCurrentUser(null);

        setIsAdmin(false);

        setSimUserScreen(
          "auth"
        );

        setSimAdminScreen(
          "auth"
        );

        setSimUserSubPanel(
          null
        );

        setSimAdminSubPanel(
          null
        );

        showToast(
          "Logged out successfully.",
          "info"
        );

      }
    };

  /* ── Blog CRUD ── */
  const handleCreateBlog = async (
    e: FormEvent
  ) => {
    e.preventDefault();

    const form =
      e.target as HTMLFormElement;

    const title = (
      form.elements.namedItem(
        "sim-blog-title"
      ) as HTMLInputElement
    )?.value;

    const category = (
      form.elements.namedItem(
        "sim-blog-category"
      ) as HTMLSelectElement
    )?.value;

    const image = (
      form.elements.namedItem(
        "sim-blog-image"
      ) as HTMLSelectElement
    )?.value;

    const desc = (
      form.elements.namedItem(
        "sim-blog-desc"
      ) as HTMLInputElement
    )?.value;

    const content = (
      form.elements.namedItem(
        "sim-blog-content"
      ) as HTMLTextAreaElement
    )?.value;

    try {
      const response = await fetch(
        "/api/posts",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            title,
            category,
            image,
            desc,
            content,
          }),
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        showToast(
          data.message ||
          "Failed to create post",
          "error"
        );

        return;
      }

      showToast(
        "Blog published successfully!",
        "success"
      );

      form.reset();

      setSimUserSubPanel(null);

      // We'll create this next
      await loadBlogs();

    } catch (error) {
      console.error(
        "Create blog error:",
        error
      );

      showToast(
        "Unable to create blog",
        "error"
      );
    }
  };

  // const handleApproveBlog = (id: number) => {
  //   setBlogs((prev) => prev.map((b) => (b.id === id ? { ...b, approved: true } : b)));
  //   showToast("Blog approved and published.", "success");
  // };

  const handleDeleteBlog =
    async (id: string) => {

      const confirmed =
        window.confirm(
          "Are you sure you want to delete this post?"
        );

      if (!confirmed) {
        return;
      }

      try {
        const response =
          await fetch(
            `/api/posts/${id}`,
            {
              method: "DELETE",
            }
          );

        const data =
          await response.json();

        if (!response.ok) {
          showToast(
            data.message ||
            "Failed to delete post",
            "error"
          );

          return;
        }

        showToast(
          "Blog deleted successfully.",
          "success"
        );

        await loadBlogs();

      } catch (error) {
        console.error(
          "Delete blog error:",
          error
        );

        showToast(
          "Unable to delete blog",
          "error"
        );
      }
    };

  const handleDeleteUser =
    async (id: string) => {

      const confirmed =
        window.confirm(
          "Delete this user and all of their posts? This cannot be undone."
        );

      if (!confirmed) {
        return;
      }

      try {
        const response =
          await fetch(
            `/api/admin/users/${id}`,
            {
              method: "DELETE",
            }
          );

        const data =
          await response.json();

        if (!response.ok) {
          showToast(
            data.message ||
            "Failed to delete user",
            "error"
          );

          return;
        }

        showToast(
          data.message,
          "success"
        );

        // Reload users
        await loadUsers();

        // Reload blogs because user's
        // posts were also deleted
        await loadBlogs();

      } catch (error) {
        console.error(
          "Delete user error:",
          error
        );

        showToast(
          "Unable to delete user",
          "error"
        );
      }
    };

  /* ── Comments ── */
  const handleAddComment = (e: FormEvent, blogId: number) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const input = form.elements.namedItem("detail-comment-input") as HTMLInputElement;
    const text = input.value;
    if (!text.trim()) return;
    const newComment: Comment = {
      id: Date.now(), author: currentUser?.fullName ?? "Guest", text,
      date: new Date().toISOString().split("T")[0],
    };
    setComments((prev) => ({ ...prev, [blogId]: [...(prev[blogId] ?? []), newComment] }));
    input.value = "";
    showToast("Comment posted!", "success");
  };

  const handleDeleteComment = (blogId: number, commentId: number) => {
    setComments((prev) => ({ ...prev, [blogId]: (prev[blogId] ?? []).filter((c) => c.id !== commentId) }));
    showToast("Comment removed.", "info");
  };

  /* ── Reports ── */
  const handleFileReport = (e: FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const target = (form.elements.namedItem("sim-report-target") as HTMLSelectElement)?.value;
    const reason = (form.elements.namedItem("sim-report-reason") as HTMLSelectElement)?.value;
    const desc = (form.elements.namedItem("sim-report-desc") as HTMLTextAreaElement)?.value;
    const newReport: Report = { id: Date.now(), target, reason, desc, date: new Date().toISOString().split("T")[0] };
    setReports((prev) => [...prev, newReport]);
    setSimUserSubPanel(null);
    showToast("Report submitted for review.", "success");
    form.reset();
  };

  /* ── Profile ── */
  const handleUpdateProfile = (e: FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const avatar = (form.elements.namedItem("sim-profile-avatar-url") as HTMLSelectElement)?.value;
    const fullName = (form.elements.namedItem("sim-profile-fullname") as HTMLInputElement)?.value;
    if (currentUser) {
      const updated = { ...currentUser, avatar, fullName };
      setCurrentUser(updated);
      setUsers((prev) => prev.map((u) => (u.username === currentUser.username ? updated : u)));
      setSimUserSubPanel(null);
      showToast("Profile updated!", "success");
    }
  };

  /* ── Notifications ── */
  const addNotification = (message: string) => {
    const notif: Notification = { id: Date.now(), message, date: new Date().toLocaleTimeString(), read: false };
    setNotifications((prev) => [notif, ...prev]);
    setNotifCount((c) => c + 1);
  };

  const clearNotifications = () => { setNotifications([]); setNotifCount(0); };

  /* ── Share ── */
  const openShareModal = (blog: BlogPost) => { setShareUrl(`https://blogverse.com/article/${blog.id}`); setShareModalOpen(true); };
  const copyShareUrl = () => { navigator.clipboard.writeText(shareUrl); showToast("Link copied to clipboard!", "success"); };

  /* ── Detail Modal ── */
  const openDetailModal = (blog: BlogPost) => { setDetailBlog(blog); setDetailModalOpen(true); document.body.style.overflow = "hidden"; };
  const closeDetailModal = () => { setDetailModalOpen(false); setDetailBlog(null); document.body.style.overflow = ""; };

  /* ── Render Helpers ── */
  const getBlogImage = (key: string) => IMAGE_MAP[key] ?? IMAGE_MAP.ai;
  const getAvatar = (key: string) => AVATAR_MAP[key] ?? AVATAR_MAP["male-1"];

  return (
    <>
      <Head>
        <title>BlogVerse — Discover Amazing Stories</title>
        <meta name="description" content="A modern publishing platform for tech, travel, lifestyle, and more." />
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" />
      </Head>

      {/* ── Inline Global Styles ── */}
      <style jsx global>{`
        :root {
          --bg: #f8f9fc; --card-bg: #ffffff; --primary-bg: #f1f5f9;
          --text-primary: #1e293b; --text-secondary: #64748b;
          --accent: #7c3aed; --accent-light: #ede9fe; --accent-hover: #6d28d9;
          --border-color: #e2e8f0; --radius: 12px;
          --shadow: 0 4px 6px -1px rgb(0 0 0 / 0.05), 0 2px 4px -2px rgb(0 0 0 / 0.05);
          --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.08), 0 4px 6px -4px rgb(0 0 0 / 0.08);
          --success: #22c55e; --danger: #ef4444; --warning: #f59e0b; --info: #3b82f6;
        }
        html.dark {
          --bg: #0f172a; --card-bg: #1e293b; --primary-bg: #334155;
          --text-primary: #f1f5f9; --text-secondary: #94a3b8;
          --accent: #a78bfa; --accent-light: #2e1065; --accent-hover: #8b5cf6;
          --border-color: #334155;
          --shadow: 0 4px 6px -1px rgb(0 0 0 / 0.3), 0 2px 4px -2px rgb(0 0 0 / 0.3);
          --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.4), 0 4px 6px -4px rgb(0 0 0 / 0.4);
        }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          background-color: var(--bg); color: var(--text-primary); line-height: 1.6;
          transition: background-color 0.3s, color 0.3s;
        }
        a { text-decoration: none; color: inherit; }
        ul { list-style: none; }
        button { cursor: pointer; border: none; background: none; font-family: inherit; }
        img { max-width: 100%; display: block; }
        .container { max-width: 1200px; margin: 0 auto; padding: 0 24px; }

        .toast-container { position: fixed; top: 20px; right: 20px; z-index: 9999; display: flex; flex-direction: column; gap: 10px; }
        .toast { padding: 14px 22px; border-radius: var(--radius); font-size: 14px; font-weight: 600; color: white;
          transform: translateX(120%); transition: transform 0.3s ease; box-shadow: var(--shadow-lg); }
        .toast.show { transform: translateX(0); }
        .toast-success { background: var(--success); }
        .toast-error { background: var(--danger); }
        .toast-info { background: var(--info); }

        header { position: sticky; top: 0; z-index: 100;
          background: rgba(var(--card-bg), 0.85); backdrop-filter: blur(12px);
          border-bottom: 1px solid var(--border-color); transition: background 0.3s; }
        .nav-container { display: flex; align-items: center; justify-content: space-between; height: 72px; }
        .logo { font-size: 24px; font-weight: 800; color: var(--text-primary); display: flex; align-items: center; gap: 8px; }
        .logo i, .logo span { color: var(--accent); }
        .nav-menu { display: flex; gap: 32px; }
        .nav-link { font-size: 15px; font-weight: 600; color: var(--text-secondary); transition: color 0.2s; position: relative; }
        .nav-link:hover, .nav-link.active { color: var(--accent); }
        .nav-link.active::after { content: ''; position: absolute; bottom: -6px; left: 0; right: 0; height: 2px; background: var(--accent); border-radius: 2px; }
        .nav-actions { display: flex; align-items: center; gap: 12px; }
        .nav-search { position: relative; display: flex; align-items: center; }
        .search-input { width: 0; padding: 0; border: none; border-radius: 20px; background: var(--primary-bg); color: var(--text-primary);
          font-size: 14px; transition: width 0.3s, padding 0.3s; outline: none; }
        .search-input.open { width: 220px; padding: 8px 40px 8px 16px; border: 1px solid var(--border-color); }
        .search-btn { width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center;
          color: var(--text-secondary); transition: background 0.2s, color 0.2s; }
        .search-btn:hover { background: var(--primary-bg); color: var(--accent); }
        .theme-toggle, .notification-bell, .menu-toggle { width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center;
          justify-content: center; color: var(--text-secondary); transition: background 0.2s, color 0.2s; position: relative; }
        .theme-toggle:hover, .notification-bell:hover, .menu-toggle:hover { background: var(--primary-bg); color: var(--accent); }
        .bell-badge { position: absolute; top: 2px; right: 2px; width: 8px; height: 8px; background: var(--danger); border-radius: 50%; display: none; }
        .bell-badge.show { display: block; }
        .btn-signin { padding: 8px 20px; border-radius: 20px; background: var(--accent); color: white; font-size: 14px; font-weight: 600; transition: background 0.2s; }
        .btn-signin:hover { background: var(--accent-hover); }
        .menu-toggle { display: none; }

        .hero { padding: 80px 0 60px; }
        .hero-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 60px; align-items: center; }
        .hero-card { background: var(--card-bg); padding: 40px; border-radius: var(--radius); box-shadow: var(--shadow-lg); }
        .hero-headline { font-size: 42px; font-weight: 800; line-height: 1.15; margin-bottom: 20px; color: var(--text-primary); }
        .hero-headline span { color: var(--accent); }
        .hero-subheadline { font-size: 17px; color: var(--text-secondary); margin-bottom: 32px; line-height: 1.7; }
        .hero-buttons { display: flex; gap: 16px; }
        .btn-primary { padding: 14px 28px; border-radius: var(--radius); background: var(--accent); color: white; font-size: 15px; font-weight: 700;
          transition: background 0.2s, transform 0.2s; }
        .btn-primary:hover { background: var(--accent-hover); transform: translateY(-2px); }
        .btn-secondary { padding: 14px 28px; border-radius: var(--radius); background: var(--primary-bg); color: var(--text-primary); font-size: 15px;
          font-weight: 700; border: 1px solid var(--border-color); transition: background 0.2s, transform 0.2s; }
        .btn-secondary:hover { background: var(--border-color); transform: translateY(-2px); }
        .hero-img-wrapper { position: relative; border-radius: var(--radius); overflow: hidden; box-shadow: var(--shadow-lg); }
        .hero-img-wrapper img { width: 100%; height: 400px; object-fit: cover; }
        .hero-right-badge { position: absolute; bottom: 20px; left: 20px; right: 20px; background: rgba(15, 23, 42, 0.85);
          backdrop-filter: blur(8px); color: white; padding: 14px 20px; border-radius: var(--radius); font-size: 14px; font-weight: 600;
          display: flex; align-items: center; }

        .register-banner { background: linear-gradient(135deg, var(--accent) 0%, var(--accent-hover) 100%); padding: 40px 0; }
        .register-flex { display: flex; align-items: center; justify-content: space-between; gap: 40px; }
        .register-info { display: flex; align-items: center; gap: 20px; }
        .register-icon { width: 56px; height: 56px; border-radius: 50%; background: rgba(255,255,255,0.2); display: flex; align-items: center;
          justify-content: center; color: white; font-size: 24px; flex-shrink: 0; }
        .register-title { color: white; font-size: 20px; font-weight: 700; margin-bottom: 4px; }
        .register-subtitle { color: rgba(255,255,255,0.85); font-size: 14px; }
        .btn-register { padding: 12px 28px; border-radius: var(--radius); background: white; color: var(--accent); font-size: 15px; font-weight: 700;
          transition: transform 0.2s, box-shadow 0.2s; flex-shrink: 0; }
        .btn-register:hover { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(0,0,0,0.15); }

        .section-header { text-align: center; margin-bottom: 48px; }
        .section-title { font-size: 32px; font-weight: 800; color: var(--text-primary); }
        .section-title span { color: var(--accent); }
        .categories-section, .articles-section { padding: 60px 0; }

        .categories-container { display: flex; flex-wrap: wrap; gap: 12px; justify-content: center; }
        .category-tag { padding: 10px 20px; border-radius: 24px; background: var(--card-bg); border: 1px solid var(--border-color);
          color: var(--text-secondary); font-size: 14px; font-weight: 600; cursor: pointer; transition: all 0.2s; }
        .category-tag:hover, .category-tag.active { background: var(--accent); color: white; border-color: var(--accent);
          transform: translateY(-2px); box-shadow: var(--shadow); }

        .articles-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 28px; }
        .article-card { background: var(--card-bg); border-radius: var(--radius); overflow: hidden; border: 1px solid var(--border-color);
          transition: transform 0.3s, box-shadow 0.3s; cursor: pointer; }
        .article-card:hover { transform: translateY(-6px); box-shadow: var(--shadow-lg); }
        .article-card-img { width: 100%; height: 200px; object-fit: cover; }
        .article-card-body { padding: 24px; }
        .article-card-category { display: inline-block; padding: 4px 12px; border-radius: 12px; background: var(--accent-light);
          color: var(--accent); font-size: 12px; font-weight: 700; margin-bottom: 12px; }
        .article-card-title { font-size: 18px; font-weight: 700; margin-bottom: 10px; color: var(--text-primary); line-height: 1.4; }
        .article-card-desc { font-size: 14px; color: var(--text-secondary); line-height: 1.6; margin-bottom: 16px; }
        .article-card-meta { display: flex; align-items: center; gap: 12px; font-size: 13px; color: var(--text-secondary); }
        .meta-dot { width: 4px; height: 4px; background: var(--text-secondary); border-radius: 50%; opacity: 0.5; }
        .article-card-actions { display: flex; gap: 8px; margin-top: 16px; }
        .article-btn { flex: 1; padding: 10px; border-radius: 8px; font-size: 13px; font-weight: 600; text-align: center; transition: all 0.2s; }
        .article-btn-primary { background: var(--accent); color: white; }
        .article-btn-primary:hover { background: var(--accent-hover); }
        .article-btn-secondary { background: var(--primary-bg); color: var(--text-primary); border: 1px solid var(--border-color); }
        .article-btn-secondary:hover { background: var(--border-color); }

        .newsletter-section { padding: 60px 0; }
        .newsletter-card { background: linear-gradient(135deg, var(--accent-light) 0%, var(--primary-bg) 100%);
          border: 1px solid var(--border-color); border-radius: var(--radius); padding: 48px; text-align: center; }
        .newsletter-title { font-size: 28px; font-weight: 800; margin-bottom: 12px; color: var(--text-primary); }
        .newsletter-desc { font-size: 16px; color: var(--text-secondary); max-width: 560px; margin: 0 auto 28px; line-height: 1.6; }
        .newsletter-form { display: flex; gap: 12px; max-width: 480px; margin: 0 auto; }
        .newsletter-input { flex: 1; padding: 14px 20px; border-radius: var(--radius); border: 1px solid var(--border-color);
          background: var(--card-bg); color: var(--text-primary); font-size: 15px; outline: none; }
        .newsletter-input:focus { border-color: var(--accent); }
        .btn-subscribe { padding: 14px 28px; border-radius: var(--radius); background: var(--accent); color: white;
          font-size: 15px; font-weight: 700; transition: background 0.2s; }
        .btn-subscribe:hover { background: var(--accent-hover); }

        footer { background: var(--card-bg); border-top: 1px solid var(--border-color); padding: 60px 0 0; }
        .footer-grid { display: grid; grid-template-columns: 2fr 1fr 1fr 1.5fr; gap: 40px; margin-bottom: 40px; }
        .footer-desc { font-size: 14px; color: var(--text-secondary); line-height: 1.7; margin-top: 16px; }
        .social-links { display: flex; gap: 12px; margin-top: 20px; }
        .social-btn { width: 40px; height: 40px; border-radius: 50%; background: var(--primary-bg); display: flex; align-items: center;
          justify-content: center; color: var(--text-secondary); transition: all 0.2s; }
        .social-btn:hover { background: var(--accent); color: white; transform: translateY(-2px); }
        .footer-col-title { font-size: 16px; font-weight: 700; margin-bottom: 20px; color: var(--text-primary); }
        .footer-links li { margin-bottom: 12px; }
        .footer-links a { font-size: 14px; color: var(--text-secondary); transition: color 0.2s; }
        .footer-links a:hover { color: var(--accent); }
        .footer-bottom { border-top: 1px solid var(--border-color); padding: 24px 0; display: flex; justify-content: space-between;
          align-items: center; font-size: 13px; color: var(--text-secondary); }
        .footer-bottom-links { display: flex; gap: 24px; }
        .footer-bottom-links a { color: var(--text-secondary); transition: color 0.2s; }
        .footer-bottom-links a:hover { color: var(--accent); }

        .simulator-widget { position: fixed; bottom: 24px; right: 24px; z-index: 200; }
        .btn-simulator-toggle { width: 56px; height: 56px; border-radius: 50%; background: var(--accent); color: white; font-size: 22px;
          display: flex; align-items: center; justify-content: center; box-shadow: var(--shadow-lg); transition: transform 0.2s, background 0.2s;
          position: relative; }
        .btn-simulator-toggle:hover { transform: scale(1.08); background: var(--accent-hover); }
        .badge-alert { position: absolute; top: -4px; right: -4px; background: var(--danger); color: white; font-size: 11px; font-weight: 700;
          width: 22px; height: 22px; border-radius: 50%; display: flex; align-items: center; justify-content: center; }
        .simulator-panel { position: fixed; top: 0; right: 0; width: 420px; max-width: 100%; height: 100vh; background: var(--card-bg);
          border-left: 1px solid var(--border-color); box-shadow: -10px 0 30px rgba(0,0,0,0.1); z-index: 300; display: flex; flex-direction: column;
          transform: translateX(100%); transition: transform 0.35s cubic-bezier(0.4, 0, 0.2, 1); }
        .simulator-panel.open { transform: translateX(0); }
        .sim-header { display: flex; align-items: center; justify-content: space-between; padding: 20px 24px; border-bottom: 1px solid var(--border-color); }
        .sim-title { font-size: 16px; font-weight: 700; display: flex; align-items: center; gap: 10px; color: var(--text-primary); }
        .sim-title i { color: var(--accent); }
        .sim-close { width: 32px; height: 32px; border-radius: 8px; display: flex; align-items: center; justify-content: center;
          color: var(--text-secondary); transition: background 0.2s; }
        .sim-close:hover { background: var(--primary-bg); color: var(--danger); }
        .sim-tabs { display: flex; border-bottom: 1px solid var(--border-color); }
        .sim-tab-btn { flex: 1; padding: 14px; font-size: 14px; font-weight: 600; color: var(--text-secondary);
          border-bottom: 2px solid transparent; transition: all 0.2s; }
        .sim-tab-btn.active { color: var(--accent); border-bottom-color: var(--accent); }
        .sim-tab-btn:hover:not(.active) { color: var(--text-primary); background: var(--primary-bg); }
        .sim-content { flex: 1; overflow-y: auto; padding: 24px; }
        .sim-screen { display: none; }
        .sim-screen.active { display: block; }
        .sim-flow-steps { display: flex; gap: 8px; margin-bottom: 20px; flex-wrap: wrap; }
        .flow-step { padding: 6px 12px; border-radius: 20px; font-size: 11px; font-weight: 600; background: var(--primary-bg);
          color: var(--text-secondary); border: 1px solid var(--border-color); }
        .flow-step.active { background: var(--accent); color: white; border-color: var(--accent); }
        .sim-form-group { margin-bottom: 16px; }
        .sim-label { display: block; font-size: 13px; font-weight: 600; margin-bottom: 6px; color: var(--text-primary); }
        .sim-input, .sim-select, .sim-textarea { width: 100%; padding: 10px 14px; border-radius: 8px; border: 1px solid var(--border-color);
          background: var(--bg); color: var(--text-primary); font-size: 14px; outline: none; transition: border-color 0.2s; }
        .sim-input:focus, .sim-select:focus, .sim-textarea:focus { border-color: var(--accent); }
        .sim-textarea { resize: vertical; min-height: 80px; }
        .btn-sim-action { width: 100%; padding: 12px; border-radius: 8px; background: var(--accent); color: white; font-size: 14px; font-weight: 700;
          transition: background 0.2s; display: flex; align-items: center; justify-content: center; gap: 8px; }
        .btn-sim-action:hover { background: var(--accent-hover); }
        .btn-sim-alt { width: 100%; padding: 10px; margin-top: 12px; border-radius: 8px; background: transparent; color: var(--accent);
          font-size: 13px; font-weight: 600; border: 1px solid var(--border-color); transition: background 0.2s; }
        .btn-sim-alt:hover { background: var(--primary-bg); }
        .sim-user-card { display: flex; align-items: center; gap: 14px; padding: 16px; background: var(--primary-bg);
          border-radius: var(--radius); border: 1px solid var(--border-color); margin-bottom: 20px; }
        .sim-user-avatar { width: 48px; height: 48px; border-radius: 50%; object-fit: cover; }
        .sim-user-name { font-weight: 700; color: var(--text-primary); }
        .sim-user-role { font-size: 12px; color: var(--text-secondary); }
        .btn-sim-icon-danger { margin-left: auto; width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center;
          justify-content: center; color: var(--danger); transition: background 0.2s; }
        .btn-sim-icon-danger:hover { background: rgba(239, 68, 68, 0.1); }
        .sim-grid-menu { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 20px; }
        .sim-menu-item { padding: 16px; border-radius: var(--radius); background: var(--card-bg); border: 1px solid var(--border-color);
          display: flex; flex-direction: column; align-items: center; gap: 8px; font-size: 13px; font-weight: 600; color: var(--text-primary);
          transition: all 0.2s; position: relative; }
        .sim-menu-item:hover { border-color: var(--accent); transform: translateY(-2px); box-shadow: var(--shadow); }
        .sim-menu-item i { font-size: 20px; }
        .sim-menu-badge { position: absolute; top: 8px; right: 8px; background: var(--danger); color: white; font-size: 10px; font-weight: 700;
          width: 18px; height: 18px; border-radius: 50%; display: flex; align-items: center; justify-content: center; }
        .sim-sub-pane { animation: fadeIn 0.3s ease; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        .sim-back-nav { display: inline-flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 600; color: var(--accent);
          margin-bottom: 16px; cursor: pointer; transition: opacity 0.2s; }
        .sim-back-nav:hover { opacity: 0.8; }
        .sim-list-item { padding: 14px; border-radius: 8px; background: var(--bg); border: 1px solid var(--border-color);
          margin-bottom: 10px; display: flex; align-items: center; justify-content: space-between; gap: 12px; }
        .sim-list-item-info { flex: 1; min-width: 0; }
        .sim-list-item-title { font-weight: 600; font-size: 14px; color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .sim-list-item-meta { font-size: 12px; color: var(--text-secondary); margin-top: 2px; }
        .sim-list-actions { display: flex; gap: 6px; }
        .sim-btn-sm { padding: 6px 12px; border-radius: 6px; font-size: 12px; font-weight: 600; transition: all 0.2s; }
        .sim-btn-approve { background: var(--success); color: white; }
        .sim-btn-approve:hover { opacity: 0.9; }
        .sim-btn-delete { background: var(--danger); color: white; }
        .sim-btn-delete:hover { opacity: 0.9; }
        .sim-notif-item { padding: 12px 14px; border-radius: 8px; background: var(--bg); border: 1px solid var(--border-color);
          margin-bottom: 8px; font-size: 13px; }
        .sim-notif-item.unread { border-left: 3px solid var(--accent); }
        .sim-notif-time { font-size: 11px; color: var(--text-secondary); margin-top: 4px; }

        .share-modal { position: fixed; inset: 0; background: rgba(0,0,0,0.5); backdrop-filter: blur(4px); z-index: 400;
          display: flex; align-items: center; justify-content: center; padding: 24px; opacity: 0; pointer-events: none; transition: opacity 0.3s; }
        .share-modal.open { opacity: 1; pointer-events: auto; }
        .share-modal-card { background: var(--card-bg); border-radius: var(--radius); padding: 28px; width: 100%; max-width: 420px;
          box-shadow: var(--shadow-lg); transform: scale(0.95); transition: transform 0.3s; }
        .share-modal.open .share-modal-card { transform: scale(1); }
        .share-modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
        .share-modal-title { font-size: 18px; font-weight: 700; color: var(--text-primary); }
        .share-social-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 20px; }
        .share-social-btn { display: flex; flex-direction: column; align-items: center; gap: 8px; font-size: 12px; font-weight: 600;
          color: var(--text-secondary); transition: transform 0.2s; }
        .share-social-btn:hover { transform: translateY(-3px); }
        .share-social-btn i { width: 48px; height: 48px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 20px; }
        .share-copy-box { display: flex; gap: 8px; }
        .share-copy-input { flex: 1; padding: 10px 14px; border-radius: 8px; border: 1px solid var(--border-color);
          background: var(--bg); color: var(--text-primary); font-size: 13px; outline: none; }
        .btn-share-copy { padding: 10px 18px; border-radius: 8px; background: var(--accent); color: white; font-size: 13px; font-weight: 600;
          transition: background 0.2s; }
        .btn-share-copy:hover { background: var(--accent-hover); }

        .notif-dropdown { position: absolute; top: 48px; right: 0; width: 320px; background: var(--card-bg); border: 1px solid var(--border-color);
          border-radius: var(--radius); box-shadow: var(--shadow-lg); z-index: 150; padding: 16px; display: none; }
        .notif-dropdown.open { display: block; animation: fadeIn 0.2s ease; }
        .notif-dropdown-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
        .notif-dropdown-title { font-size: 14px; font-weight: 700; color: var(--text-primary); }
        .notif-dropdown-clear { font-size: 12px; color: var(--accent); font-weight: 600; cursor: pointer; }
        .notif-dropdown-clear:hover { text-decoration: underline; }
        .notif-dropdown-empty { text-align: center; padding: 24px; color: var(--text-secondary); font-size: 13px; }

        @media (max-width: 1024px) {
          .hero-grid { grid-template-columns: 1fr; }
          .hero-right { order: -1; }
          .hero-img-wrapper img { height: 300px; }
          .footer-grid { grid-template-columns: 1fr 1fr; }
        }
        @media (max-width: 768px) {
          .nav-menu { position: fixed; top: 72px; left: 0; right: 0; background: var(--card-bg); flex-direction: column;
            padding: 24px; gap: 16px; border-bottom: 1px solid var(--border-color); transform: translateY(-100%); opacity: 0;
            pointer-events: none; transition: all 0.3s; z-index: 99; }
          .nav-menu.open { transform: translateY(0); opacity: 1; pointer-events: auto; }
          .menu-toggle { display: flex; }
          .hero-headline { font-size: 32px; }
          .register-flex { flex-direction: column; text-align: center; }
          .register-info { flex-direction: column; }
          .newsletter-form { flex-direction: column; }
          .footer-grid { grid-template-columns: 1fr; }
          .footer-bottom { flex-direction: column; gap: 12px; text-align: center; }
          .simulator-panel { width: 100%; }
        }
      `}</style>

      {/* ═══════════════════════════════════════
          TOAST CONTAINER
          ═══════════════════════════════════════ */}
      <div id="toast-container" className="toast-container" />

      {/* ═══════════════════════════════════════
          HEADER / NAVBAR
          ═══════════════════════════════════════ */}
      <header>
        <div className="container nav-container">
          <a href="#" className="logo" onClick={(e) => { e.preventDefault(); handleNavClick("home"); }}>
            <i className="fa-solid fa-feather-pointed" /> Blog<span>Verse</span>
          </a>

          <ul className={`nav-menu${menuOpen ? " open" : ""}`} id="nav-menu">
            {[
              { label: "Home", target: "home" },
              { label: "Blog", target: "blog" },
              { label: "Categories", target: "categories" },
              { label: "About", target: "about" },
              { label: "Contact", target: "contact" },
            ].map((item) => (
              <li key={item.target}>
                <a href={`#${item.target}`} className={`nav-link${activeSection === item.target ? " active" : ""}`}
                  onClick={(e) => { e.preventDefault(); handleNavClick(item.target); }}>
                  {item.label}
                </a>
              </li>
            ))}
          </ul>

          <div className="nav-actions">
            <div className="nav-search">
              <input ref={searchInputRef} type="text" placeholder="Search articles..."
                className={`search-input${searchOpen ? " open" : ""}`}
                value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") setSearchOpen(false); }} />
              <button className="search-btn" onClick={handleSearchToggle} aria-label="Toggle Search">
                <i className="fa-solid fa-magnifying-glass" />
              </button>
            </div>

            <button className="theme-toggle" onClick={toggleTheme} aria-label="Toggle Dark Mode">
              <i className={`fa-solid ${darkMode ? "fa-sun" : "fa-moon"}`} />
            </button>

            <div style={{ position: "relative" }} ref={notifRef}>
              <button className="notification-bell" onClick={() => setNotifOpen((p) => !p)} aria-label="Check Notifications">
                <i className="fa-solid fa-bell" />
                <span className={`bell-badge${notifCount > 0 ? " show" : ""}`} />
              </button>
              <div className={`notif-dropdown${notifOpen ? " open" : ""}`}>
                <div className="notif-dropdown-header">
                  <span className="notif-dropdown-title">Notifications</span>
                  {notifications.length > 0 && (
                    <span className="notif-dropdown-clear" onClick={clearNotifications}>Clear all</span>
                  )}
                </div>
                {notifications.length === 0 ? (
                  <div className="notif-dropdown-empty">No new notifications</div>
                ) : (
                  notifications.map((n) => (
                    <div key={n.id} className={`sim-notif-item${!n.read ? " unread" : ""}`}>
                      {n.message}
                      <div className="sim-notif-time">{n.date}</div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div id="auth-nav-container">
              {currentUser ? (
                <button className="btn-signin" onClick={() => {
                  setSimOpen(true);
                  setSimTab(currentUser.role === "admin" ? "admin" : "user");
                  if (currentUser.role === "admin") { setSimAdminScreen("dashboard"); }
                  else { setSimUserScreen("dashboard"); }
                }}>
                  <i className="fa-solid fa-user" style={{ marginRight: 6 }} />
                  {currentUser.fullName}
                </button>
              ) : (
                <button className="btn-signin" onClick={() => { setSimOpen(true); setSimTab("user"); setSimUserScreen("auth"); }}>
                  Sign In
                </button>
              )}
            </div>

            <button className="menu-toggle" onClick={() => setMenuOpen((p) => !p)} aria-label="Toggle Menu">
              <i className={`fa-solid ${menuOpen ? "fa-xmark" : "fa-bars"}`} />
            </button>
          </div>
        </div>
      </header>

      {/* ═══════════════════════════════════════
          HERO SECTION
          ═══════════════════════════════════════ */}
      <section className="hero" id="home">
        <div className="container hero-grid">
          <div className="hero-left">
            <div className="hero-card">
              <h1 className="hero-headline">
                Discover Amazing <span>Stories</span>, Ideas & <span>Knowledge</span> Every Day
              </h1>
              <p className="hero-subheadline">
                Dive into the most captivating narratives across technology, travel, lifestyle, artificial intelligence, programming, and much more. Written by creators, for curious minds.
              </p>
              <div className="hero-buttons">
                <button className="btn-primary" onClick={() => handleNavClick("blog")}>Explore Blogs</button>
                <button className="btn-secondary" onClick={() => { setSimOpen(true); setSimTab("user"); setSimUserScreen("auth"); }}>
                  Write a Blog
                </button>
              </div>
            </div>
          </div>
          <div className="hero-right">
            <div className="hero-img-wrapper">
              <img src="https://images.unsplash.com/photo-1499951360447-b19be8fe80f5?w=800&fit=crop"
                alt="Modern desk setup with laptop, lavender, coffee mug, and notebook" id="hero-img" />
            </div>
            <div className="hero-right-badge">
              <i className="fa-solid fa-mug-hot" style={{ color: "#a78bfa", marginRight: 6 }} />
              "Good ideas start with a cup of coffee"
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════
          REGISTER BANNER
          ═══════════════════════════════════════ */}
      <section className="register-banner">
        <div className="container register-flex">
          <div className="register-info">
            <div className="register-icon"><i className="fa-solid fa-user-plus" /></div>
            <div>
              <h3 className="register-title">Create your account on BlogVerse</h3>
              <p className="register-subtitle">Join our community to write blogs, bookmark articles, leave comments, and more!</p>
            </div>
          </div>
          <button className="btn-register" onClick={() => { setSimOpen(true); setSimTab("user"); setSimUserScreen("auth"); setSimAuthMode("register"); }}>
            Register Now
          </button>
        </div>
      </section>

      {/* ═══════════════════════════════════════
          CATEGORIES SECTION
          ═══════════════════════════════════════ */}
      <section className="categories-section" id="categories">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Browse <span>Categories</span></h2>
          </div>
          <div className="categories-container">
            {CATEGORIES.map((cat) => (
              <button key={cat} className={`category-tag${searchQuery === cat ? " active" : ""}`}
                onClick={() => setSearchQuery(searchQuery === cat ? "" : cat)}>
                {cat}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════
          LATEST ARTICLES
          ═══════════════════════════════════════ */}
      <section className="articles-section" id="blog">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">
              {currentUser && currentUser.role === "user" ? (
                <>
                  My <span>Articles</span>
                </>
              ) : (
                <>
                  Latest <span>Articles</span>
                </>
              )}
            </h2>
          </div>
          <div className="articles-grid">
            {filteredBlogs.length === 0 ? (
              <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "60px 0", color: "var(--text-secondary)" }}>
                <i className="fa-solid fa-folder-open" style={{ fontSize: 48, marginBottom: 16, display: "block" }} />
                <p>No articles found. Try a different search or category.</p>
              </div>
            ) : (
              filteredBlogs.map((blog) => (
                <div key={blog.id} className="article-card" onClick={() => openDetailModal(blog)}>
                  <img src={getBlogImage(blog.image)} alt={blog.title} className="article-card-img" />
                  <div className="article-card-body">
                    <span className="article-card-category">{blog.category}</span>
                    <h3 className="article-card-title">{blog.title}</h3>
                    <p className="article-card-desc">{blog.desc}</p>
                    <div className="article-card-meta">
                      <span>{blog.author}</span><span className="meta-dot" />
                      <span>{blog.date}</span><span className="meta-dot" />
                      <span>{blog.readTime}</span>
                    </div>
                    <div className="article-card-actions">
                      <button className="article-btn article-btn-primary" onClick={(e) => { e.stopPropagation(); openDetailModal(blog); }}>
                        Read More
                      </button>
                      <button className="article-btn article-btn-secondary" onClick={(e) => { e.stopPropagation(); openShareModal(blog); }}>
                        <i className="fa-solid fa-share-nodes" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════
          NEWSLETTER
          ═══════════════════════════════════════ */}
      <section className="newsletter-section">
        <div className="container">
          <div className="newsletter-card">
            <h2 className="newsletter-title">Never Miss a Blog</h2>
            <p className="newsletter-desc">
              Subscribe to our weekly newsletter to receive carefully curated insights, trending articles, and platform updates directly in your inbox.
            </p>
            <form className="newsletter-form" onSubmit={handleNewsletterSubmit}>
              <input type="email" placeholder="Enter your email address..." className="newsletter-input" required />
              <button type="submit" className="btn-subscribe">Subscribe</button>
            </form>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════
          FOOTER
          ═══════════════════════════════════════ */}
      <footer>
        <div className="container footer-grid">
          <div className="footer-brand">
            <a href="#" className="logo" onClick={(e) => { e.preventDefault(); handleNavClick("home"); }}>
              <i className="fa-solid fa-feather-pointed" /> Blog<span>Verse</span>
            </a>
            <p className="footer-desc">
              BlogVerse is a modern publishing platform where thoughts find their voice. Sharing insights and expert stories in tech, health, design, lifestyle, and business.
            </p>
            <div className="social-links">
              {["facebook-f", "twitter", "instagram", "linkedin-in"].map((icon) => (
                <a key={icon} href="#" className="social-btn" aria-label={icon} onClick={(e) => e.preventDefault()}>
                  <i className={`fa-brands fa-${icon}`} />
                </a>
              ))}
            </div>
          </div>
          <div>
            <h4 className="footer-col-title">Quick Links</h4>
            <ul className="footer-links">
              <li><a href="#home" onClick={(e) => { e.preventDefault(); handleNavClick("home"); }}>Home</a></li>
              <li><a href="#blog" onClick={(e) => { e.preventDefault(); handleNavClick("blog"); }}>Latest Blogs</a></li>
              <li><a href="#about" onClick={(e) => { e.preventDefault(); handleNavClick("about"); }}>About Us</a></li>
              <li><a href="#contact" onClick={(e) => { e.preventDefault(); handleNavClick("contact"); }}>Contact Support</a></li>
            </ul>
          </div>
          <div className="footer-col-categories">
            <h4 className="footer-col-title">Top Categories</h4>
            <ul className="footer-links">
              {["Technology", "Artificial Intelligence", "Web Development", "Lifestyle"].map((cat) => (
                <li key={cat}><a href="#" onClick={(e) => { e.preventDefault(); setSearchQuery(cat); handleNavClick("blog"); }}>{cat}</a></li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="footer-col-title">Newsletter</h4>
            <p className="footer-desc" style={{ marginBottom: 12 }}>Get premium stories straight to your inbox.</p>
            <p className="footer-desc" style={{ fontSize: 13 }}>
              <i className="fa-solid fa-shield-halved" style={{ marginRight: 6 }} />
              Spam-free. Unsubscribe anytime.
            </p>
          </div>
        </div>
        <div className="container footer-bottom">
          <p>&copy; 2026 BlogVerse. Built with visual excellence. All rights reserved.</p>
          <div className="footer-bottom-links">
            <a href="#" onClick={(e) => e.preventDefault()}>Privacy Policy</a>
            <a href="#" onClick={(e) => e.preventDefault()}>Terms of Service</a>
            <a href="#" onClick={(e) => e.preventDefault()}>Security</a>
          </div>
        </div>
      </footer>

      {/* ═══════════════════════════════════════
          SIMULATOR WIDGET (LAUNCHER)
          ═══════════════════════════════════════ */}
      <div className="simulator-widget">
        <button className="btn-simulator-toggle" onClick={() => setSimOpen((p) => !p)} title="Open Interaction Simulator">
          <i className="fa-solid fa-gamepad" />
          <span className="badge-alert" id="simulator-unread-badge" style={{ display: "none" }}>0</span>
        </button>
      </div>

      {/* ═══════════════════════════════════════
          SIMULATOR PANEL (DRAWER)
          ═══════════════════════════════════════ */}
      <div className={`simulator-panel${simOpen ? " open" : ""}`} id="simulator-panel">
        <div className="sim-header">
          <div className="sim-title"><i className="fa-solid fa-network-wired" /> Workflow Simulator</div>
          <button className="sim-close" onClick={() => setSimOpen(false)} aria-label="Close Simulator">
            <i className="fa-solid fa-xmark" />
          </button>
        </div>

        <div className="sim-tabs">
          <button className={`sim-tab-btn${simTab === "user" ? " active" : ""}`}
            onClick={() => { setSimTab("user"); setSimAdminSubPanel(null); }}>User Flow</button>
          <button className={`sim-tab-btn${simTab === "admin" ? " active" : ""}`}
            onClick={() => { setSimTab("admin"); setSimUserSubPanel(null); }}>Admin Flow</button>
        </div>

        <div className="sim-content" id="sim-content-pane">
          {/* ================= USER WORKFLOW ================= */}
          <div className={`sim-screen${simTab === "user" ? " active" : ""}`} id="user-flow-pane">
            {/* USER AUTH SCREEN */}
            <div style={{ display: simUserScreen === "auth" ? "block" : "none" }}>
              <div className="sim-flow-steps">
                <span className={`flow-step${simAuthMode === "signin" ? " active" : ""}`}>Step 1: Start</span>
                <span className={`flow-step${simAuthMode === "signin" && simUserScreen === "auth" ? " active" : ""}`}>Step 2: Sign In</span>
                <span className={`flow-step${simAuthMode === "register" ? " active" : ""}`}>Step 3: Register</span>
              </div>

              <h3 style={{ marginBottom: 8 }}>{simAuthMode === "signin" ? "Enter Username & Password" : "Create a New Account"}</h3>
              <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 20 }}>
                {simAuthMode === "signin"
                  ? "Sign in to enter the User Dashboard. Non-existent accounts will fail validation, prompting registration."
                  : "Register a new account to start writing blogs and engaging with the community."}
              </p>

              <form onSubmit={handleSimAuth}>
                {simAuthMode === "register" && (
                  <div className="sim-form-group">
                    <label
                      className="sim-label"
                      htmlFor="sim-auth-fullname"
                    >
                      Full Name
                    </label>

                    <input
                      type="text"
                      id="sim-auth-fullname"
                      name="sim-auth-fullname"
                      className="sim-input"
                      placeholder="e.g. John Doe"
                      required
                    />
                  </div>
                )}
                {simAuthMode === "register" && (
                  <div className="sim-form-group">

                    <label
                      className="sim-label"
                      htmlFor="sim-auth-username"
                    >
                      Username
                    </label>

                    <input
                      type="text"
                      id="sim-auth-username"
                      name="sim-auth-username"
                      className="sim-input"
                      placeholder="e.g. john_doe"
                      required
                      autoComplete="username"
                    />

                  </div>
                )}
                <div className="sim-form-group">
                  <label
                    className="sim-label"
                    htmlFor="sim-auth-email"
                  >
                    Email
                  </label>

                  <input
                    type="email"
                    id="sim-auth-email"
                    name="sim-auth-email"
                    className="sim-input"
                    placeholder="e.g. john@example.com"
                    required
                    autoComplete="email"
                  />
                </div>
                <div className="sim-form-group">
                  <label className="sim-label" htmlFor="sim-auth-password">Password</label>
                  <input type="password" id="sim-auth-password" name="sim-auth-password" className="sim-input"
                    placeholder="••••••••" required autoComplete="current-password" />
                </div>
                <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
                  <button type="submit" className="btn-sim-action">
                    <i className="fa-solid fa-right-to-bracket" /> {simAuthMode === "signin" ? "Sign In" : "Register"}
                  </button>
                </div>
                <button type="button" className="btn-sim-alt" onClick={() => setSimAuthMode(simAuthMode === "signin" ? "register" : "signin")}>
                  {simAuthMode === "signin" ? "Need an account? Register" : "Already have an account? Sign In"}
                </button>
              </form>

              {/* <div style={{
                marginTop: 30, backgroundColor: "var(--primary-bg)", padding: 15, borderRadius: "var(--radius)",
                border: "1px solid var(--border-color)", fontSize: 12
              }}>
                <h4 style={{ marginBottom: 6 }}><i className="fa-solid fa-circle-info" style={{ color: "var(--accent)" }} /> Simulation Helper</h4>
                <p style={{ color: "var(--text-secondary)", marginBottom: 6 }}>Try signing in with our preseeded User account:</p>
                <code style={{
                  display: "block", background: "var(--card-bg)", padding: "4px 8px", borderRadius: 4,
                  border: "1px solid var(--border-color)", marginBottom: 6
                }}>
                  Username: <strong>reader</strong> / Password: <strong>password123</strong>
                </code>
                <p style={{ color: "var(--text-secondary)" }}>Or use the Admin tab with:<br />
                  <code>Username: <strong>admin</strong> / Password: <strong>admin123</strong></code>
                </p>
              </div> */}
            </div>

            {/* USER DASHBOARD */}
            <div style={{ display: simUserScreen === "dashboard" ? "block" : "none" }}>
              <div className="sim-user-card">
                <img src={getAvatar(currentUser?.avatar ?? "male-1")} className="sim-user-avatar" alt="User avatar" />
                <div className="sim-user-meta">
                  <div className="sim-user-name">{currentUser?.fullName ?? "Guest"}</div>
                  <div className="sim-user-role">{currentUser?.role === "admin" ? "Super Admin" : "Registered Creator"}</div>
                </div>
                <button className="btn-sim-icon-danger" onClick={handleSimLogout} title="Logout">
                  <i className="fa-solid fa-power-off" />
                </button>
              </div>

              <h4 style={{ marginBottom: 12, fontWeight: 700 }}>Simulated User Operations</h4>

              <div className="sim-grid-menu">
                <button className="sim-menu-item" onClick={() => setSimUserSubPanel("create-blog")}>
                  <i className="fa-solid fa-circle-plus" style={{ color: "var(--success)" }} /><span>Create Blog</span>
                </button>
                <button className="sim-menu-item" onClick={() => setSimUserSubPanel("manage-blogs")}>
                  <i className="fa-solid fa-sliders" style={{ color: "var(--accent)" }} /><span>Manage Blogs</span>
                </button>
                <button className="sim-menu-item" onClick={() => setSimUserSubPanel("file-reports")}>
                  <i className="fa-solid fa-circle-exclamation" style={{ color: "var(--danger)" }} /><span>File Reports</span>
                </button>
                <button className="sim-menu-item" onClick={() => setSimUserSubPanel("check-notif")}>
                  <i className="fa-solid fa-bell" style={{ color: "var(--warning)" }} /><span>Notifications</span>
                  {notifications.filter((n) => !n.read).length > 0 && (
                    <span className="sim-menu-badge">{notifications.filter((n) => !n.read).length}</span>
                  )}
                </button>
              </div>

              <button className="btn-sim-alt" onClick={() => setSimUserSubPanel("update-profile")} style={{ marginTop: 0, width: "100%" }}>
                <i className="fa-solid fa-user-gear" /> Update Profile
              </button>

              {/* Sub-Panel: Create Blog */}
              {simUserSubPanel === "create-blog" && (
                <div className="sim-sub-pane" style={{ marginTop: 24, paddingTop: 20, borderTop: "1px solid var(--border-color)" }}>
                  <div className="sim-back-nav" onClick={() => setSimUserSubPanel(null)}>
                    <i className="fa-solid fa-arrow-left" /> Back to User Menu
                  </div>
                  <h4 style={{ marginBottom: 16 }}>Create & Post Blog</h4>
                  <form onSubmit={handleCreateBlog}>
                    <div className="sim-form-group">
                      <label className="sim-label" htmlFor="sim-blog-title">Blog Title</label>
                      <input type="text" id="sim-blog-title" name="sim-blog-title" className="sim-input" placeholder="Discovering AI..." required />
                    </div>
                    <div className="sim-form-group">
                      <label className="sim-label" htmlFor="sim-blog-category">Category</label>
                      <select id="sim-blog-category" name="sim-blog-category" className="sim-select" required>
                        {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div className="sim-form-group">
                      <label className="sim-label" htmlFor="sim-blog-image">Cover Image Template</label>
                      <select id="sim-blog-image" name="sim-blog-image" className="sim-select" required>
                        <option value="ai">AI Robot Background</option>
                        <option value="mountain">Swiss Alps View</option>
                        <option value="coding">Software Coding Setup</option>
                        <option value="food">Healthy Food Bowl</option>
                      </select>
                    </div>
                    <div className="sim-form-group">
                      <label className="sim-label" htmlFor="sim-blog-desc">Short Description</label>
                      <input type="text" id="sim-blog-desc" name="sim-blog-desc" className="sim-input" placeholder="A brief hook..." required />
                    </div>
                    <div className="sim-form-group">
                      <label className="sim-label" htmlFor="sim-blog-content">Post Body Content</label>
                      <textarea id="sim-blog-content" name="sim-blog-content" className="sim-textarea" rows={4}
                        placeholder="Write your full story here..." required />
                    </div>
                    <button type="submit" className="btn-sim-action">
                      <i className="fa-solid fa-cloud-arrow-up" /> Publish Blog
                    </button>
                  </form>
                </div>
              )}

              {/* Sub-Panel: Manage Blogs */}
              {simUserSubPanel === "manage-blogs" && (
                <div className="sim-sub-pane" style={{ marginTop: 24, paddingTop: 20, borderTop: "1px solid var(--border-color)" }}>
                  <div className="sim-back-nav" onClick={() => setSimUserSubPanel(null)}>
                    <i className="fa-solid fa-arrow-left" /> Back to User Menu
                  </div>
                  <h4 style={{ marginBottom: 12 }}>Manage Your Blogs</h4>
                  <div style={{ maxHeight: 250, overflowY: "auto" }}>
                    {myBlogs.length === 0 ? (
                      <p style={{ color: "var(--text-secondary)", fontSize: 13, textAlign: "center", padding: 20 }}>No blogs yet. Create one!</p>
                    ) : (
                      myBlogs.map((blog) => (
                        <div key={blog.id} className="sim-list-item">
                          <div className="sim-list-item-info">
                            <div className="sim-list-item-title">{blog.title}</div>
                            <div className="sim-list-item-meta">{blog.category} · {blog.approved ? "Approved" : "Pending"}</div>
                          </div>
                          <div className="sim-list-actions">
                            <button className="sim-btn-sm sim-btn-delete" onClick={() => handleDeleteBlog(blog.id)}>
                              <i className="fa-solid fa-trash" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* Sub-Panel: File Reports */}
              {simUserSubPanel === "file-reports" && (
                <div className="sim-sub-pane" style={{ marginTop: 24, paddingTop: 20, borderTop: "1px solid var(--border-color)" }}>
                  <div className="sim-back-nav" onClick={() => setSimUserSubPanel(null)}>
                    <i className="fa-solid fa-arrow-left" /> Back to User Menu
                  </div>
                  <h4 style={{ marginBottom: 16 }}>File a Safety Report</h4>
                  <form onSubmit={handleFileReport}>
                    <div className="sim-form-group">
                      <label className="sim-label" htmlFor="sim-report-target">Select Article to Report</label>
                      <select id="sim-report-target" name="sim-report-target" className="sim-select" required>
                        {approvedBlogs.map((b) => <option key={b.id} value={b.title}>{b.title}</option>)}
                      </select>
                    </div>
                    <div className="sim-form-group">
                      <label className="sim-label" htmlFor="sim-report-reason">Reason for Report</label>
                      <select id="sim-report-reason" name="sim-report-reason" className="sim-select" required>
                        <option value="spam">Spam or Misleading Content</option>
                        <option value="harassment">Harassment or Offensive Language</option>
                        <option value="plagiarism">Intellectual Property/Plagiarism</option>
                        <option value="other">Other Violation</option>
                      </select>
                    </div>
                    <div className="sim-form-group">
                      <label className="sim-label" htmlFor="sim-report-desc">Detailed Context</label>
                      <textarea id="sim-report-desc" name="sim-report-desc" className="sim-textarea" rows={3}
                        placeholder="Provide details for moderation review..." required />
                    </div>
                    <button type="submit" className="btn-sim-action" style={{ backgroundColor: "var(--danger)" }}>
                      <i className="fa-solid fa-flag" /> Submit Report
                    </button>
                  </form>
                </div>
              )}

              {/* Sub-Panel: Notifications */}
              {simUserSubPanel === "check-notif" && (
                <div className="sim-sub-pane" style={{ marginTop: 24, paddingTop: 20, borderTop: "1px solid var(--border-color)" }}>
                  <div className="sim-back-nav" onClick={() => setSimUserSubPanel(null)}>
                    <i className="fa-solid fa-arrow-left" /> Back to User Menu
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                    <h4 style={{ margin: 0 }}>User Activity Notifications</h4>
                    <button style={{ background: "transparent", color: "var(--accent)", fontSize: 12, fontWeight: 600 }}
                      onClick={clearNotifications}>Clear All</button>
                  </div>
                  <div style={{ maxHeight: 250, overflowY: "auto" }}>
                    {notifications.length === 0 ? (
                      <p style={{ color: "var(--text-secondary)", fontSize: 13, textAlign: "center", padding: 20 }}>No notifications yet.</p>
                    ) : (
                      notifications.map((n) => (
                        <div key={n.id} className={`sim-notif-item${!n.read ? " unread" : ""}`}>
                          {n.message}
                          <div className="sim-notif-time">{n.date}</div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* Sub-Panel: Update Profile */}
              {simUserSubPanel === "update-profile" && (
                <div className="sim-sub-pane" style={{ marginTop: 24, paddingTop: 20, borderTop: "1px solid var(--border-color)" }}>
                  <div className="sim-back-nav" onClick={() => setSimUserSubPanel(null)}>
                    <i className="fa-solid fa-arrow-left" /> Back to User Menu
                  </div>
                  <h4 style={{ marginBottom: 16 }}>Update Profile Details</h4>
                  <form onSubmit={handleUpdateProfile}>
                    <div className="sim-form-group">
                      <label className="sim-label" htmlFor="sim-profile-avatar-url">Avatar Photo Theme</label>
                      <select id="sim-profile-avatar-url" name="sim-profile-avatar-url" className="sim-select"
                        defaultValue={currentUser?.avatar ?? "male-1"}>
                        <option value="male-1">Professional Male Avatar</option>
                        <option value="female-1">Professional Female Avatar</option>
                        <option value="geek">Retro Geek Avatar</option>
                      </select>
                    </div>
                    <div className="sim-form-group">
                      <label className="sim-label" htmlFor="sim-profile-fullname">Display Name</label>
                      <input type="text" id="sim-profile-fullname" name="sim-profile-fullname" className="sim-input"
                        placeholder="e.g. Johnathan Doe" defaultValue={currentUser?.fullName ?? ""} required />
                    </div>
                    <button type="submit" className="btn-sim-action">
                      <i className="fa-solid fa-user-check" /> Save Profile Details
                    </button>
                  </form>
                </div>
              )}
            </div>
          </div>

          {/* ================= ADMIN WORKFLOW ================= */}
          <div className={`sim-screen${simTab === "admin" ? " active" : ""}`} id="admin-flow-pane">
            {/* ADMIN AUTH SCREEN */}
            <div style={{ display: simAdminScreen === "auth" ? "block" : "none" }}>
              <h3 style={{ marginBottom: 8 }}>Admin Dashboard Access</h3>
              <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 20 }}>
                Authenticate to access high-level moderation options, manage users, comments, complaints, and view report dashboards.
              </p>
              <form onSubmit={handleSimAdminLogin}>
                <div className="sim-form-group">
                  <label
                    className="sim-label"
                    htmlFor="sim-admin-email"
                  >
                    Admin Email
                  </label>

                  <input
                    type="email"
                    id="sim-admin-email"
                    name="sim-admin-email"
                    className="sim-input"
                    placeholder="admin@blogverse.com"
                    required
                    autoComplete="email"
                  />
                </div>
                <div className="sim-form-group">
                  <label className="sim-label" htmlFor="sim-admin-password">Admin Password</label>
                  <input type="password" id="sim-admin-password" name="sim-admin-password" className="sim-input"
                    placeholder="••••••••" required autoComplete="current-password" />
                </div>
                <button type="submit" className="btn-sim-action" style={{ backgroundColor: "var(--accent)" }}>
                  <i className="fa-solid fa-lock-open" /> Login as Admin
                </button>
                {/* <button type="button" className="btn-sim-alt" onClick={() => {
                  const u = document.getElementById("sim-admin-username") as HTMLInputElement;
                  const p = document.getElementById("sim-admin-password") as HTMLInputElement;
                  if (u) u.value = "admin"; if (p) p.value = "admin123";
                }}>Auto-fill Credentials</button> */}
              </form>
            </div>

            {/* ADMIN DASHBOARD */}
            <div style={{ display: simAdminScreen === "dashboard" ? "block" : "none" }}>
              <div className="sim-user-card" style={{ backgroundColor: "var(--accent-light)", borderColor: "rgba(107, 70, 193, 0.2)" }}>
                <i className="fa-solid fa-user-shield" style={{ fontSize: 28, color: "var(--accent)" }} />
                <div className="sim-user-meta">
                  <div className="sim-user-name">System Administrator</div>
                  <div className="sim-user-role">Super Admin</div>
                </div>
                <button className="btn-sim-icon-danger" onClick={handleSimLogout} title="Admin Logout">
                  <i className="fa-solid fa-power-off" />
                </button>
              </div>

              <h4 style={{ marginBottom: 12, fontWeight: 700 }}>Simulated Admin Controls</h4>

              <div className="sim-grid-menu">
                <button className="sim-menu-item" onClick={() => setSimAdminSubPanel("blogs")}>
                  <i className="fa-solid fa-blog" style={{ color: "var(--info)" }} /><span>Manage Blogs</span>
                  {pendingBlogs.length > 0 && <span className="sim-menu-badge">{pendingBlogs.length}</span>}
                </button>
                <button className="sim-menu-item" onClick={() => setSimAdminSubPanel("comments")}>
                  <i className="fa-solid fa-comments" style={{ color: "var(--success)" }} /><span>Manage Comments</span>
                </button>
                <button className="sim-menu-item" onClick={() => setSimAdminSubPanel("complaints")}>
                  <i className="fa-solid fa-envelope-open-text" style={{ color: "var(--warning)" }} /><span>Manage Complaints</span>
                  {reports.length > 0 && <span className="sim-menu-badge">{reports.length}</span>}
                </button>
                <button
                  className="sim-menu-item"
                  onClick={async () => {
                    setSimAdminSubPanel("users");

                    await loadUsers();
                  }}
                >
                  <i
                    className="fa-solid fa-users"
                    style={{
                      color: "var(--accent)",
                    }}
                  />

                  <span>Manage Users</span>
                </button>
              </div>

              <button className="btn-sim-alt" onClick={() => setSimAdminSubPanel("reports")} style={{ marginTop: 0, width: "100%" }}>
                <i className="fa-solid fa-chart-line" /> View Platform Analytics
              </button>

              {/* Admin Sub-Panel: Manage Blogs */}
              {simAdminSubPanel === "blogs" && (
                <div className="sim-sub-pane" style={{ marginTop: 24, paddingTop: 20, borderTop: "1px solid var(--border-color)" }}>
                  <div className="sim-back-nav" onClick={() => setSimAdminSubPanel(null)}>
                    <i className="fa-solid fa-arrow-left" /> Back to Admin Menu
                  </div>
                  <h4 style={{ marginBottom: 12 }}>Admin Blog Moderation</h4>
                  <div style={{ maxHeight: 250, overflowY: "auto" }}>
                    {blogs.length === 0 ? (
                      <p style={{ color: "var(--text-secondary)", fontSize: 13, textAlign: "center", padding: 20 }}>No blogs to moderate.</p>
                    ) : (
                      blogs.map((blog) => (
                        <div key={blog.id} className="sim-list-item">
                          <div className="sim-list-item-info">
                            <div className="sim-list-item-title">{blog.title}</div>
                            <div className="sim-list-item-meta">{blog.category} · {blog.author} · {blog.approved ? "Approved" : "Pending"}</div>
                          </div>
                          <div className="sim-list-actions">
                            {/* {!blog.approved && (
                              <button className="sim-btn-sm sim-btn-approve" onClick={() => handleApproveBlog(blog.id)}>
                                <i className="fa-solid fa-check" />
                              </button>
                            )} */}
                            <button className="sim-btn-sm sim-btn-delete" onClick={() => handleDeleteBlog(blog.id)}>
                              <i className="fa-solid fa-trash" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* Admin Sub-Panel: Manage Comments */}
              {simAdminSubPanel === "comments" && (
                <div className="sim-sub-pane" style={{ marginTop: 24, paddingTop: 20, borderTop: "1px solid var(--border-color)" }}>
                  <div className="sim-back-nav" onClick={() => setSimAdminSubPanel(null)}>
                    <i className="fa-solid fa-arrow-left" /> Back to Admin Menu
                  </div>
                  <h4 style={{ marginBottom: 12 }}>Admin Comment Moderation</h4>
                  <div style={{ maxHeight: 250, overflowY: "auto" }}>
                    {Object.entries(comments).flatMap(([blogId, cms]) =>
                      cms.map((c) => (
                        <div key={`${blogId}-${c.id}`} className="sim-list-item">
                          <div className="sim-list-item-info">
                            <div className="sim-list-item-title">{c.author}</div>
                            <div className="sim-list-item-meta">{c.text}</div>
                          </div>
                          <div className="sim-list-actions">
                            <button className="sim-btn-sm sim-btn-delete" onClick={() => handleDeleteComment(Number(blogId), c.id)}>
                              <i className="fa-solid fa-trash" />
                            </button>
                          </div>
                        </div>
                      ))
                    ).length === 0 && (
                        <p style={{ color: "var(--text-secondary)", fontSize: 13, textAlign: "center", padding: 20 }}>No comments to moderate.</p>
                      )}
                    {Object.entries(comments).flatMap(([blogId, cms]) =>
                      cms.map((c) => (
                        <div key={`${blogId}-${c.id}`} className="sim-list-item">
                          <div className="sim-list-item-info">
                            <div className="sim-list-item-title">{c.author}</div>
                            <div className="sim-list-item-meta">{c.text}</div>
                          </div>
                          <div className="sim-list-actions">
                            <button className="sim-btn-sm sim-btn-delete" onClick={() => handleDeleteComment(Number(blogId), c.id)}>
                              <i className="fa-solid fa-trash" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* Admin Sub-Panel: Manage Complaints */}
              {simAdminSubPanel === "complaints" && (
                <div className="sim-sub-pane" style={{ marginTop: 24, paddingTop: 20, borderTop: "1px solid var(--border-color)" }}>
                  <div className="sim-back-nav" onClick={() => setSimAdminSubPanel(null)}>
                    <i className="fa-solid fa-arrow-left" /> Back to Admin Menu
                  </div>
                  <h4 style={{ marginBottom: 12 }}>Admin Complaints Moderation</h4>
                  <div style={{ maxHeight: 250, overflowY: "auto" }}>
                    {reports.length === 0 ? (
                      <p style={{ color: "var(--text-secondary)", fontSize: 13, textAlign: "center", padding: 20 }}>No complaints filed yet.</p>
                    ) : (
                      reports.map((r) => (
                        <div key={r.id} className="sim-list-item">
                          <div className="sim-list-item-info">
                            <div className="sim-list-item-title">{r.target}</div>
                            <div className="sim-list-item-meta">{r.reason} · {r.date}</div>
                          </div>
                          <div className="sim-list-actions">
                            <button className="sim-btn-sm sim-btn-delete" onClick={() => { setReports((prev) => prev.filter((x) => x.id !== r.id)); showToast("Complaint resolved.", "success"); }}>
                              <i className="fa-solid fa-check" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* Admin Sub-Panel: Manage Users */}
              {simAdminSubPanel === "users" && (
                <div className="sim-sub-pane" style={{ marginTop: 24, paddingTop: 20, borderTop: "1px solid var(--border-color)" }}>
                  <div className="sim-back-nav" onClick={() => setSimAdminSubPanel(null)}>
                    <i className="fa-solid fa-arrow-left" /> Back to Admin Menu
                  </div>
                  <h4 style={{ marginBottom: 12 }}>Admin User Directory Management</h4>
                  <div style={{ maxHeight: 250, overflowY: "auto" }}>
                    {users.map((u) => (
                      <div
                        key={u.id}
                        className="sim-list-item"
                      >

                        <div className="sim-list-item-info">

                          <div className="sim-list-item-title">
                            {u.fullName}
                          </div>

                          <div className="sim-list-item-meta">
                            @{u.username} · {u.email} · {u.role}
                          </div>

                        </div>

                        <div className="sim-list-actions">

                          {u.id !== currentUser?.id && (
                            <button
                              className="sim-btn-sm sim-btn-delete"
                              onClick={() =>
                                handleDeleteUser(u.id)
                              }
                              title="Delete User"
                            >
                              <i className="fa-solid fa-trash" />
                            </button>
                          )}

                        </div>

                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Admin Sub-Panel: Analytics Reports */}
              {simAdminSubPanel === "reports" && (
                <div className="sim-sub-pane" style={{ marginTop: 24, paddingTop: 20, borderTop: "1px solid var(--border-color)" }}>
                  <div className="sim-back-nav" onClick={() => setSimAdminSubPanel(null)}>
                    <i className="fa-solid fa-arrow-left" /> Back to Admin Menu
                  </div>
                  <h4 style={{ marginBottom: 16 }}>Platform Analytics & Reports</h4>
                  <div style={{
                    backgroundColor: "var(--primary-bg)", padding: 15, borderRadius: "var(--radius)",
                    border: "1px solid var(--border-color)", marginBottom: 16
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: 13 }}>
                      <span>Total Active Blogs</span><strong>{approvedBlogs.length}</strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: 13 }}>
                      <span>Pending Approval Blogs</span><strong>{pendingBlogs.length}</strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: 13 }}>
                      <span>Unresolved Complaints</span><strong>{reports.length}</strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                      <span>Total Users</span><strong>{users.length}</strong>
                    </div>
                  </div>
                  <h5 style={{ marginBottom: 10 }}>Post Share & Engagement Analytics</h5>
                  <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                    {approvedBlogs.map((b) => (
                      <div key={b.id} style={{ marginBottom: 6 }}>
                        <strong>{b.title}</strong>: {(comments[b.id as any]?.length ?? 0)} comments
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════
          POST DETAIL MODAL
          ═══════════════════════════════════════ */}
      <div className={`share-modal${detailModalOpen ? " open" : ""}`} id="post-detail-modal">
        <div className="share-modal-card" style={{ maxWidth: 600, width: "90%" }}>
          <div className="share-modal-header">
            <h3 style={{ fontWeight: 800 }}>{detailBlog?.title ?? "Blog Title"}</h3>
            <button style={{ background: "transparent", fontSize: 20 }} onClick={closeDetailModal}>
              <i className="fa-solid fa-xmark" />
            </button>
          </div>
          <div style={{ maxHeight: "60vh", overflowY: "auto", paddingRight: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 15, fontSize: 13, color: "var(--text-secondary)" }}>
              <span>{detailBlog?.author ?? "Author"}</span><span className="meta-dot" />
              <span>{detailBlog?.date ?? "Date"}</span><span className="meta-dot" />
              <span>{detailBlog?.readTime ?? "5 min read"}</span>
            </div>
            {detailBlog && (
              <img src={getBlogImage(detailBlog.image)} alt="Blog cover"
                style={{ width: "100%", height: 250, objectFit: "cover", borderRadius: "var(--radius)", marginBottom: 20, display: "block" }} />
            )}
            <div style={{ fontSize: 15, lineHeight: 1.8, color: "var(--text-primary)", marginBottom: 30, whiteSpace: "pre-wrap" }}>
              {detailBlog?.content ?? "Blog text content goes here..."}
            </div>

            {/* Comment Section */}
            <div style={{ borderTop: "1px solid var(--border-color)", paddingTop: 20 }}>
              <h4 style={{ marginBottom: 12 }}>
                <i className="fa-solid fa-comments" /> Discussion ({(detailBlog ? (comments[detailBlog.id as any]?.length ?? 0) : 0)})
              </h4>
              <form onSubmit={(e) => detailBlog && handleAddComment(e, detailBlog.id as any)} style={{ display: "flex", gap: 8, marginBottom: 20 }}>
                <input type="text" name="detail-comment-input" className="sim-input" placeholder="Add a public comment..." required />
                <button type="submit" className="btn-primary" style={{ padding: "10px 20px", fontSize: 14 }}>
                  <i className="fa-solid fa-paper-plane" />
                </button>
              </form>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {detailBlog && (comments[detailBlog.id as any] ?? []).map((c: any) => (
                  <div key={c.id} style={{ padding: 12, background: "var(--primary-bg)", borderRadius: 8, fontSize: 14 }}>
                    <div style={{ fontWeight: 700, marginBottom: 4 }}>{c.author} <span style={{ fontWeight: 400, fontSize: 12, color: "var(--text-secondary)" }}>· {c.date}</span></div>
                    <div style={{ color: "var(--text-primary)" }}>{c.text}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════
          SHARE DIALOG MODAL
          ═══════════════════════════════════════ */}
      <div className={`share-modal${shareModalOpen ? " open" : ""}`} id="share-modal">
        <div className="share-modal-card">
          <div className="share-modal-header">
            <div className="share-modal-title">Share Article</div>
            <button style={{ background: "transparent", fontSize: 18 }} onClick={() => setShareModalOpen(false)} aria-label="Close Share Modal">
              <i className="fa-solid fa-xmark" />
            </button>
          </div>
          <div className="share-social-grid">
            {[
              { id: "fb", icon: "fa-facebook-f", color: "#3b5998", label: "Facebook" },
              { id: "tw", icon: "fa-twitter", color: "#1da1f2", label: "Twitter" },
              { id: "in", icon: "fa-linkedin-in", color: "#0077b5", label: "LinkedIn" },
              { id: "wa", icon: "fa-whatsapp", color: "#25d366", label: "WhatsApp" },
            ].map((s) => (
              <button key={s.id} className="share-social-btn" aria-label={`Share on ${s.label}`} onClick={() => showToast(`Shared to ${s.label}!`, "success")}>
                <i className={`fa-brands ${s.icon}`} style={{ backgroundColor: s.color, color: "white" }} />
                <span>{s.label}</span>
              </button>
            ))}
          </div>
          <div className="share-copy-box">
            <input type="text" readOnly value={shareUrl} className="share-copy-input" />
            <button className="btn-share-copy" onClick={copyShareUrl}>Copy</button>
          </div>
        </div>
      </div>
    </>
  );
}
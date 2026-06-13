"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Article,
  CATEGORIES,
  Category,
  CATEGORY_NAME,
  Profile,
  emptyProfile,
  learn,
  loadProfile,
  saveProfile,
  scoreArticle,
  timeAgo,
} from "./lib";

type Tab = "news" | "search" | "saved" | "settings";
// フィード選択: "forYou" ｜ "cat:<カテゴリID>" ｜ "kw:<キーワード>"
type Feed = string;

export default function NewsApp() {
  const [profile, setProfile] = useState<Profile>(emptyProfile);
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [articles, setArticles] = useState<Article[]>([]);
  const [fetching, setFetching] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [tab, setTab] = useState<Tab>("news");
  const [feed, setFeed] = useState<Feed>("forYou");
  const [menuArticle, setMenuArticle] = useState<Article | null>(null);
  const [query, setQuery] = useState("");
  const [newKeyword, setNewKeyword] = useState("");
  const [toast, setToast] = useState("");
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // キーワードタブ・検索タブ用のGoogle News検索結果
  const [kwResults, setKwResults] = useState<Record<string, Article[]>>({});
  const [kwLoading, setKwLoading] = useState<string | null>(null);
  const [searchRemote, setSearchRemote] = useState<Article[]>([]);
  const queryRef = useRef("");

  const refresh = async () => {
    setFetching(true);
    setFetchError(false);
    try {
      const res = await fetch("/api/news");
      if (!res.ok) throw new Error("fetch failed");
      const data = (await res.json()) as { articles: Article[] };
      setArticles(data.articles ?? []);
    } catch {
      setFetchError(true);
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    setProfile(loadProfile());
    setProfileLoaded(true);
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateProfile = (next: Profile) => {
    setProfile(next);
    saveProfile(next);
  };

  const showToast = (message: string) => {
    setToast(message);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), 2200);
  };

  // ---- 行動シグナル ----

  const markRead = (a: Article) => {
    if (profile.readIDs.includes(a.id)) return;
    const next = learn(profile, a, 0.3);
    updateProfile({ ...next, readIDs: [...next.readIDs, a.id].slice(-500) });
  };

  const likeArticle = (a: Article) => {
    if (!profile.likedIDs.includes(a.id)) {
      const next = learn(profile, a, 1);
      updateProfile({ ...next, likedIDs: [...next.likedIDs, a.id] });
    }
    setMenuArticle(null);
    showToast("いいねしました。似た記事が増えます");
  };

  const hideArticle = (a: Article) => {
    if (!profile.hiddenIDs.includes(a.id)) {
      const next = learn(profile, a, -1);
      updateProfile({ ...next, hiddenIDs: [...next.hiddenIDs, a.id] });
    }
    setMenuArticle(null);
    showToast("この記事を非表示にし、似た記事を減らします");
  };

  const toggleBookmark = (a: Article) => {
    const exists = profile.bookmarks.some((b) => b.id === a.id);
    updateProfile({
      ...profile,
      bookmarks: exists
        ? profile.bookmarks.filter((b) => b.id !== a.id)
        : [a, ...profile.bookmarks],
    });
    setMenuArticle(null);
    showToast(exists ? "あとで読むから削除しました" : "あとで読むに保存しました");
  };

  const shareArticle = async (a: Article) => {
    setMenuArticle(null);
    try {
      if (navigator.share) {
        await navigator.share({ title: a.title, url: a.link });
      } else {
        await navigator.clipboard.writeText(a.link);
        showToast("リンクをコピーしました");
      }
    } catch {
      // 共有キャンセルは何もしない
    }
  };

  const isBookmarked = (a: Article) => profile.bookmarks.some((b) => b.id === a.id);

  // ---- フィード ----

  const recommended = useMemo(() => {
    return articles
      .filter((a) => !profile.hiddenIDs.includes(a.id))
      .map((a) => [a, scoreArticle(profile, a)] as const)
      .sort((x, y) => y[1] - x[1])
      .map(([a]) => a);
  }, [articles, profile]);

  // タブには「選んだジャンル」と「フォロー中キーワード」だけを出す。
  // ジャンル未選択（オンボーディング前など）のときは全ジャンルを出す。
  const interestCategories =
    profile.interests.length > 0
      ? CATEGORIES.filter((c) => profile.interests.includes(c.id))
      : CATEGORIES;

  // 設定でジャンルやキーワードを外した直後は「おすすめ」に戻す
  const activeFeed: Feed =
    feed === "forYou" ||
    (feed.startsWith("cat:") && interestCategories.some((c) => `cat:${c.id}` === feed)) ||
    (feed.startsWith("kw:") && profile.followedKeywords.includes(feed.slice(3)))
      ? feed
      : "forYou";

  const feedArticles = useMemo(() => {
    if (activeFeed === "forYou") return recommended;
    const visible = articles.filter((a) => !profile.hiddenIDs.includes(a.id));
    if (activeFeed.startsWith("cat:")) {
      const cat = activeFeed.slice(4);
      return visible.filter((a) => a.category === cat);
    }
    // キーワードタブ: Yahoo記事のタイトル一致 + Google News検索結果を新着順で
    const kw = activeFeed.slice(3);
    const kwLower = kw.toLowerCase();
    const local = visible.filter((a) => a.title.toLowerCase().includes(kwLower));
    const remote = (kwResults[kw] ?? []).filter((a) => !profile.hiddenIDs.includes(a.id));
    const seen = new Set<string>();
    return [...remote, ...local]
      .filter((a) => {
        if (seen.has(a.id)) return false;
        seen.add(a.id);
        return true;
      })
      .sort((x, y) => (y.publishedAt ?? "").localeCompare(x.publishedAt ?? ""));
  }, [activeFeed, articles, profile, recommended, kwResults]);

  // キーワードタブを開いたらGoogle News検索（/api/keyword）から記事を取得する
  useEffect(() => {
    if (!activeFeed.startsWith("kw:")) return;
    const kw = activeFeed.slice(3);
    if (kwResults[kw]) return;
    let cancelled = false;
    setKwLoading(kw);
    fetch(`/api/keyword?q=${encodeURIComponent(kw)}`)
      .then((r) => r.json())
      .then((d: { articles: Article[] }) => {
        if (!cancelled) setKwResults((prev) => ({ ...prev, [kw]: d.articles ?? [] }));
      })
      .catch(() => {
        if (!cancelled) setKwResults((prev) => ({ ...prev, [kw]: [] }));
      })
      .finally(() => {
        if (!cancelled) setKwLoading(null);
      });
    return () => {
      cancelled = true;
    };
  }, [activeFeed, kwResults]);

  // 検索タブ: 入力が落ち着いたらWeb全体（Google News）からも検索する
  useEffect(() => {
    const q = query.trim();
    queryRef.current = q;
    setSearchRemote([]);
    if (q.length < 2) return;
    const timer = setTimeout(() => {
      fetch(`/api/keyword?q=${encodeURIComponent(q)}`)
        .then((r) => r.json())
        .then((d: { articles: Article[] }) => {
          if (queryRef.current === q) setSearchRemote(d.articles ?? []);
        })
        .catch(() => {});
    }, 500);
    return () => clearTimeout(timer);
  }, [query]);

  const searchResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return articles.filter((a) => a.title.toLowerCase().includes(q));
  }, [articles, query]);

  const searchRemoteOnly = useMemo(
    () => searchRemote.filter((a) => !searchResults.some((b) => b.id === a.id)),
    [searchRemote, searchResults]
  );

  // ---- 描画 ----

  const row = (a: Article) => (
    <ArticleRow
      key={a.id}
      article={a}
      read={profile.readIDs.includes(a.id)}
      bookmarked={isBookmarked(a)}
      onOpen={() => markRead(a)}
      onMenu={() => setMenuArticle(a)}
    />
  );

  return (
    <div className="pn-root">
      {tab === "news" && (
        <>
          <header className="pn-header">
            <h1 className="pn-logo">
              Prism<span>.</span>
            </h1>
            <span className="pn-date">
              {new Date().toLocaleDateString("ja-JP", {
                month: "long",
                day: "numeric",
                weekday: "short",
              })}
            </span>
          </header>

          <div className="pn-chips">
            <button
              className={activeFeed === "forYou" ? "pn-chip pn-chip-on" : "pn-chip"}
              onClick={() => setFeed("forYou")}
            >
              ✦ おすすめ
            </button>
            {interestCategories.map((c) => (
              <button
                key={c.id}
                className={activeFeed === `cat:${c.id}` ? "pn-chip pn-chip-on" : "pn-chip"}
                onClick={() => setFeed(`cat:${c.id}`)}
              >
                {c.name}
              </button>
            ))}
            {profile.followedKeywords.map((k) => (
              <button
                key={k}
                className={activeFeed === `kw:${k}` ? "pn-chip pn-chip-on" : "pn-chip"}
                onClick={() => setFeed(`kw:${k}`)}
              >
                #{k}
              </button>
            ))}
          </div>

          <main className="pn-list">
            {fetching && articles.length === 0 && (
              <div className="pn-skeletons">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="pn-skeleton" />
                ))}
              </div>
            )}
            {fetchError && articles.length === 0 && !fetching && (
              <div className="pn-empty">
                <p>記事を取得できませんでした</p>
                <button className="pn-btn" onClick={() => void refresh()}>
                  再読み込み
                </button>
              </div>
            )}
            {activeFeed === "forYou" && feedArticles[0] && (
              <Hero
                article={feedArticles[0]}
                onOpen={() => markRead(feedArticles[0])}
                onMenu={() => setMenuArticle(feedArticles[0])}
              />
            )}
            {(activeFeed === "forYou" ? feedArticles.slice(1, 80) : feedArticles).map(row)}
            {kwLoading !== null && activeFeed === `kw:${kwLoading}` && feedArticles.length === 0 && (
              <div className="pn-skeletons">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="pn-skeleton" />
                ))}
              </div>
            )}
            {!fetching && kwLoading === null && articles.length > 0 && feedArticles.length === 0 && (
              <div className="pn-empty">
                <p>このタブに表示できる記事が今はありません</p>
              </div>
            )}
            {!fetching && articles.length > 0 && (
              <button className="pn-btn pn-refresh" onClick={() => void refresh()}>
                最新のニュースに更新
              </button>
            )}
          </main>
        </>
      )}

      {tab === "search" && (
        <main className="pn-pane">
          <div className="pn-search">
            <input
              type="search"
              placeholder="キーワードで探す"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          {query.trim() === "" ? (
            profile.followedKeywords.length > 0 ? (
              <>
                <p className="pn-section">フォロー中のキーワード</p>
                <div className="pn-kwchips">
                  {profile.followedKeywords.map((k) => (
                    <button key={k} className="pn-chip" onClick={() => setQuery(k)}>
                      {k}
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <div className="pn-empty">
                <p>気になる話題を検索してみましょう</p>
              </div>
            )
          ) : (
            <>
              {searchResults.map(row)}
              {searchRemoteOnly.length > 0 && <p className="pn-section">Webのニュース</p>}
              {searchRemoteOnly.map(row)}
              {searchResults.length === 0 && searchRemoteOnly.length === 0 && (
                <div className="pn-empty">
                  <p>「{query.trim()}」に一致する記事が見つかりません</p>
                </div>
              )}
            </>
          )}
        </main>
      )}

      {tab === "saved" && (
        <main className="pn-pane">
          <header className="pn-header">
            <h1 className="pn-logo">あとで読む</h1>
            <span className="pn-date">{profile.bookmarks.length}件</span>
          </header>
          {profile.bookmarks.length === 0 ? (
            <div className="pn-empty">
              <p>記事の「⋯」から「あとで読む」に保存できます</p>
            </div>
          ) : (
            profile.bookmarks.map(row)
          )}
        </main>
      )}

      {tab === "settings" && (
        <main className="pn-pane pn-settings">
          <header className="pn-header">
            <h1 className="pn-logo">設定</h1>
          </header>

          <p className="pn-section">興味のあるジャンル（選んだものだけタブに表示されます）</p>
          <div className="pn-kwchips">
            {CATEGORIES.map((c) => {
              const on = profile.interests.includes(c.id);
              return (
                <button
                  key={c.id}
                  className={on ? "pn-chip pn-chip-on" : "pn-chip"}
                  onClick={() =>
                    updateProfile({
                      ...profile,
                      interests: on
                        ? profile.interests.filter((i) => i !== c.id)
                        : [...profile.interests, c.id],
                    })
                  }
                >
                  {on ? "✓ " : ""}
                  {c.name}
                </button>
              );
            })}
          </div>

          <p className="pn-section">フォロー中のキーワード（タブに表示・タップで削除）</p>
          <div className="pn-kwchips">
            {profile.followedKeywords.map((k) => (
              <button
                key={k}
                className="pn-chip"
                onClick={() => {
                  updateProfile({
                    ...profile,
                    followedKeywords: profile.followedKeywords.filter((x) => x !== k),
                  });
                  showToast(`「${k}」のフォローを外しました`);
                }}
              >
                {k} ×
              </button>
            ))}
          </div>
          <div className="pn-kwadd">
            <input
              type="text"
              placeholder="キーワードを追加（例：生成AI）"
              value={newKeyword}
              onChange={(e) => setNewKeyword(e.target.value)}
            />
            <button
              className="pn-btn"
              disabled={newKeyword.trim() === ""}
              onClick={() => {
                const k = newKeyword.trim();
                if (k && !profile.followedKeywords.includes(k)) {
                  updateProfile({
                    ...profile,
                    followedKeywords: [...profile.followedKeywords, k],
                  });
                }
                setNewKeyword("");
              }}
            >
              追加
            </button>
          </div>

          <p className="pn-section">学習データ</p>
          <button
            className="pn-btn pn-btn-danger"
            onClick={() => {
              if (confirm("いいね・興味なし・閲覧履歴から学習したデータをリセットしますか？（ブックマークは残ります）")) {
                updateProfile({
                  ...profile,
                  categoryWeights: {},
                  keywordWeights: {},
                  readIDs: [],
                  likedIDs: [],
                  hiddenIDs: [],
                });
                showToast("学習データをリセットしました");
              }
            }}
          >
            学習データをリセット
          </button>
          <p className="pn-note">
            データソース：Yahoo!ニュース RSS・Google News RSS（キーワード・検索） ／
            学習データはすべてこの端末のブラウザ内に保存され、外部送信されません。
          </p>

          <p className="pn-section">ホーム画面に追加（アプリ化）</p>
          <p className="pn-note">
            Safariの共有ボタン（□↑）→「ホーム画面に追加」で、アプリのように全画面で使えます。
          </p>
        </main>
      )}

      <nav className="pn-tabbar">
        {(
          [
            ["news", "ニュース", "📰"],
            ["search", "検索", "🔍"],
            ["saved", "あとで読む", "🔖"],
            ["settings", "設定", "⚙️"],
          ] as [Tab, string, string][]
        ).map(([id, label, icon]) => (
          <button
            key={id}
            className={tab === id ? "pn-tab pn-tab-on" : "pn-tab"}
            onClick={() => setTab(id)}
          >
            <span className="pn-tab-icon">{icon}</span>
            <span>{label}</span>
          </button>
        ))}
      </nav>

      {menuArticle && (
        <div className="pn-sheet-backdrop" onClick={() => setMenuArticle(null)}>
          <div className="pn-sheet" onClick={(e) => e.stopPropagation()}>
            <p className="pn-sheet-title">{menuArticle.title}</p>
            <button onClick={() => likeArticle(menuArticle)}>
              👍 いいね（似た記事を増やす）
            </button>
            <button onClick={() => toggleBookmark(menuArticle)}>
              {isBookmarked(menuArticle) ? "🔖 あとで読むから削除" : "🔖 あとで読む"}
            </button>
            <button onClick={() => void shareArticle(menuArticle)}>↗️ 共有</button>
            <button className="pn-danger" onClick={() => hideArticle(menuArticle)}>
              👎 興味なし（似た記事を減らす）
            </button>
            <button className="pn-cancel" onClick={() => setMenuArticle(null)}>
              キャンセル
            </button>
          </div>
        </div>
      )}

      {toast && <div className="pn-toast">{toast}</div>}

      {profileLoaded && !profile.hasOnboarded && (
        <Onboarding
          onDone={(interests, keywords) =>
            updateProfile({
              ...profile,
              hasOnboarded: true,
              interests,
              followedKeywords: keywords,
            })
          }
        />
      )}
    </div>
  );
}

// ---- 部品 ----

function Thumb({ article, large }: { article: Article; large?: boolean }) {
  return (
    <div className={large ? "pn-thumb pn-thumb-lg" : "pn-thumb"}>
      {/* og:imageが取れない記事はonErrorで非表示にし、下のグラデ背景を見せる。
          Google News経由の中継URLだけは取得不可のためスキップ */}
      {!article.link.startsWith("https://news.google.com/") && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          loading="lazy"
          src={`/api/ogimage?url=${encodeURIComponent(article.link)}`}
          alt=""
          onError={(e) => {
            e.currentTarget.style.display = "none";
          }}
        />
      )}
    </div>
  );
}

function ArticleRow({
  article,
  read,
  bookmarked,
  onOpen,
  onMenu,
}: {
  article: Article;
  read: boolean;
  bookmarked: boolean;
  onOpen: () => void;
  onMenu: () => void;
}) {
  return (
    <div className="pn-row">
      <a
        className="pn-row-main"
        href={article.link}
        target="_blank"
        rel="noopener noreferrer"
        onClick={onOpen}
      >
        <div className="pn-row-text">
          <h3 className={read ? "pn-title pn-read" : "pn-title"}>{article.title}</h3>
          <div className="pn-meta">
            <span className="pn-cat">{CATEGORY_NAME[article.category]}</span>
            <span>{article.source}</span>
            {article.publishedAt && <span>{timeAgo(article.publishedAt)}</span>}
            {bookmarked && <span className="pn-bm">🔖</span>}
          </div>
        </div>
        <Thumb article={article} />
      </a>
      <button className="pn-more" onClick={onMenu} aria-label="記事メニュー">
        ⋯
      </button>
    </div>
  );
}

function Hero({
  article,
  onOpen,
  onMenu,
}: {
  article: Article;
  onOpen: () => void;
  onMenu: () => void;
}) {
  return (
    <div className="pn-hero">
      <a href={article.link} target="_blank" rel="noopener noreferrer" onClick={onOpen}>
        <Thumb article={article} large />
        <div className="pn-hero-overlay" />
        <div className="pn-hero-body">
          <span className="pn-hero-badge">✦ あなたへのおすすめ</span>
          <h2>{article.title}</h2>
          <div className="pn-meta pn-meta-light">
            <span className="pn-cat">{CATEGORY_NAME[article.category]}</span>
            <span>{article.source}</span>
            {article.publishedAt && <span>{timeAgo(article.publishedAt)}</span>}
          </div>
        </div>
      </a>
      <button className="pn-more pn-hero-more" onClick={onMenu} aria-label="記事メニュー">
        ⋯
      </button>
    </div>
  );
}

function Onboarding({
  onDone,
}: {
  onDone: (interests: Category[], keywords: string[]) => void;
}) {
  const [selected, setSelected] = useState<Category[]>(["top"]);
  const [keywords, setKeywords] = useState<string[]>([]);
  const [input, setInput] = useState("");

  const addKeyword = () => {
    const k = input.trim();
    if (k && !keywords.includes(k)) setKeywords([...keywords, k]);
    setInput("");
  };

  return (
    <div className="pn-onboarding">
      <h1 className="pn-logo pn-logo-xl">
        Prism<span>.</span>
      </h1>
      <p className="pn-lead">
        あなたの興味に合わせて、毎日のニュースを自動で厳選します。読むほどに、おすすめが賢くなります。
      </p>

      <p className="pn-section">気になるジャンルを選んでください</p>
      <div className="pn-kwchips">
        {CATEGORIES.map((c) => {
          const on = selected.includes(c.id);
          return (
            <button
              key={c.id}
              className={on ? "pn-chip pn-chip-on" : "pn-chip"}
              onClick={() =>
                setSelected(on ? selected.filter((i) => i !== c.id) : [...selected, c.id])
              }
            >
              {c.name}
            </button>
          );
        })}
      </div>

      <p className="pn-section">フォローするキーワード（任意）</p>
      <div className="pn-kwadd">
        <input
          type="text"
          placeholder="例：生成AI、大谷翔平、半導体"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") addKeyword();
          }}
        />
        <button className="pn-btn" disabled={input.trim() === ""} onClick={addKeyword}>
          追加
        </button>
      </div>
      {keywords.length > 0 && (
        <div className="pn-kwchips">
          {keywords.map((k) => (
            <button
              key={k}
              className="pn-chip"
              onClick={() => setKeywords(keywords.filter((x) => x !== k))}
            >
              {k} ×
            </button>
          ))}
        </div>
      )}

      <button
        className="pn-btn pn-btn-primary"
        disabled={selected.length === 0}
        onClick={() => onDone(selected, keywords)}
      >
        はじめる
      </button>
    </div>
  );
}

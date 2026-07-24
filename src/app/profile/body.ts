/* プロフィール本文HTML（Claude Design）。dangerouslySetInnerHTMLで描画 */
export const PROFILE_BODY = `<main>
  <!-- HERO -->
  <section class="hero" aria-label="プロフィール概要">
    <div class="wrap pf-hero-grid">
      <div class="hero-text">
        <span class="eyebrow"><span class="d"></span>PROFILE ・ 吉川 聡史</span>
        <h1 class="name">吉川 聡史<span class="en">SATOSHI YOSHIKAWA</span></h1>
        <div class="role-line">
          <span class="role-chip red">AIクリエイター</span>
          <span class="role-chip">漫画家</span>
          <span class="role-chip">UXディレクター</span>
        </div>
        <p class="lead">「<b>AIを、面白く。わかりやすく。</b>」をテーマに、マンガとUXの力で生成AIを"現場で使える武器"に変える。週刊少年チャンピオンで連載を持っていた漫画家であり、株式会社ニジボックスの室長／UXディレクター。note「AI-UX UNITE」で、AI活用を描いたマンガや記事を発信しています。</p>
        <div class="hero-cta">
          <a class="btn btn-ink" href="https://note.com/aiux_unite" target="_blank" rel="noopener"><i class="ph-bold ph-book-open"></i>noteでマンガを読む<i class="ph-bold ph-arrow-up-right"></i></a>
          <a class="btn btn-ghost" href="#career">経歴を見る<i class="ph-bold ph-arrow-down"></i></a>
        </div>
      </div>
      <div class="portrait">
        <div class="frame">
          <span class="num">PROFILE</span>
          <img src="/profile/portrait.webp" alt="AIクリエイター・漫画家・UXディレクター 吉川聡史のプロフィール写真" width="900" height="1200">
        </div>
        <span class="bubble">AI、こわくない！</span>
      </div>
    </div>
  </section>

  <!-- 5 ROLES -->
  <section aria-label="5つの顔">
    <div class="wrap">
      <div class="sec-head">
        <div class="kicker">FIVE ROLES — 5つの顔</div>
        <h2 class="sec-title">物語をつくる人が、AIを語る。</h2>
        <p class="sec-sub">漫画・ゲーム・映像・UX——「伝える」現場を渡り歩いてきた経験すべてが、AI活用の発信に活きています。</p>
      </div>
      <div class="roles">
        <div class="role-card"><i class="ph-bold ph-sparkle"></i><div class="jp">AIクリエイター</div><div class="en">AI Creator</div></div>
        <div class="role-card"><i class="ph-bold ph-pen-nib"></i><div class="jp">漫画家</div><div class="en">Manga Artist</div><div class="note">週刊少年チャンピオンで連載</div></div>
        <div class="role-card"><i class="ph-bold ph-compass"></i><div class="jp">UXディレクター</div><div class="en">UX Director</div></div>
        <div class="role-card"><i class="ph-bold ph-film-slate"></i><div class="jp">映像ディレクター</div><div class="en">Film Director</div></div>
        <div class="role-card"><i class="ph-bold ph-game-controller"></i><div class="jp">ゲームプランナー</div><div class="en">Game Planner</div></div>
      </div>
    </div>
  </section>

  <!-- CAREER -->
  <section class="ink-sec" id="career" aria-label="経歴">
    <div class="wrap">
      <div class="sec-head">
        <div class="kicker">CAREER — 経歴</div>
        <h2 class="sec-title">「伝える」を、ずっと。</h2>
        <p class="sec-sub" style="color:var(--paper-200)">エンタメの最前線で培った"伝える技術"を、いまはAI活用の領域へ。</p>
      </div>
      <ol class="timeline">
        <li class="tl-item"><span class="tl-step">01</span><div><h3>漫画家として、物語で伝える</h3><p>週刊少年チャンピオンで連載を持っていた漫画家として、キャラクターとストーリーで「むずかしいことを面白く伝える」技術を磨く。これがすべての原点。</p></div></li>
        <li class="tl-item"><span class="tl-step">02</span><div><h3>株式会社ニジボックスで、体験を設計する</h3><p>株式会社ニジボックス（NIJIBOX）で、ゲームプランナー・映像ディレクター・UXディレクターとして企画・演出・体験設計に携わり、室長を務める。ユーザー視点で「売れる」「伝わる」体験をつくる。</p></div></li>
        <li class="tl-item"><span class="tl-step">03</span><div><h3>AIクリエイターとして、現場の知をマンガに</h3><p>生成AIをWeb制作・UXの現場に統合。その実践とノウハウを、note「AI-UX UNITE」でAI活用マンガ・記事として発信している。</p></div></li>
      </ol>
    </div>
  </section>

  <!-- EXPERTISE -->
  <section aria-label="専門領域">
    <div class="wrap">
      <div class="sec-head">
        <div class="kicker">EXPERTISE — 専門領域</div>
        <h2 class="sec-title">AI × UX × ストーリーテリング</h2>
        <p class="sec-sub">最新ツールの"流行"と、変わらない"本質"。その両方を行き来しながら、現場で使える形に落とし込みます。</p>
      </div>
      <div class="expertise">
        <article class="exp-card">
          <div class="ic"><i class="ph-bold ph-robot"></i></div>
          <h3>生成AI活用</h3>
          <p>Web制作・業務改善のための実践的なAI活用。ツール選定からワークフロー構築まで。</p>
          <div class="tags"><span class="tag">Claude / Claude Code</span><span class="tag">ChatGPT API</span><span class="tag">Gemini × NotebookLM</span><span class="tag">Midjourney</span><span class="tag">Figma Make</span></div>
        </article>
        <article class="exp-card">
          <div class="ic"><i class="ph-bold ph-compass"></i></div>
          <h3>UX・Web制作</h3>
          <p>ユーザー視点での体験設計。リサーチからデザイン、実装までを一気通貫で。</p>
          <div class="tags"><span class="tag">UXデザイン</span><span class="tag">ワイヤーフレーム</span><span class="tag">デザインシステム</span><span class="tag">カスタマージャーニー</span><span class="tag">ペルソナ</span></div>
        </article>
        <article class="exp-card">
          <div class="ic"><i class="ph-bold ph-pen-nib"></i></div>
          <h3>ストーリーテリング</h3>
          <p>漫画・映像で培った"伝える力"。複雑な概念を、誰もがわかる物語に変換する。</p>
          <div class="tags"><span class="tag">マンガ連載</span><span class="tag">キャラクター設計</span><span class="tag">映像演出</span><span class="tag">企画・脚本</span></div>
        </article>
      </div>
      <dl class="facts" style="margin-top:24px" aria-label="基本情報">
        <div><dt>氏名</dt><dd>吉川 聡史（よしかわ さとし）／ Satoshi Yoshikawa</dd></div>
        <div><dt>所属</dt><dd>株式会社ニジボックス（NIJIBOX）室長</dd></div>
        <div><dt>連載</dt><dd>週刊少年チャンピオンで漫画を連載</dd></div>
        <div><dt>発信</dt><dd>note「AI-UX UNITE」でAI活用マンガ・記事を発信・YouTube @aiux-unite</dd></div>
      </dl>
    </div>
  </section>

  <!-- OUTPUT -->
  <section aria-label="発信・実績">
    <div class="wrap">
      <div class="sec-head">
        <div class="kicker">OUTPUT — 発信・連載</div>
        <h2 class="sec-title">マンガで読む、AI活用</h2>
        <p class="sec-sub">noteで3つのマガジンを連載中。入門から実践、そして本質まで。</p>
      </div>
      <div class="out-grid">
        <a class="out-card" href="https://note.com/aiux_unite/m/m92e0de4e5627" target="_blank" rel="noopener">
          <div class="top"><span class="badge">入門編・全7話</span><i class="ph-bold ph-arrow-up-right"></i></div>
          <h3>マンガでわかる！AI活用</h3>
          <p>「生成AIとは？」から始まる、AI活用の第一歩。こわくない、を実感できる入門マンガ。</p>
          <div class="go">マガジンを読む →</div>
        </a>
        <a class="out-card" href="https://note.com/aiux_unite/m/m0b7bcbd79d18" target="_blank" rel="noopener">
          <div class="top"><span class="badge">実践編・全6話</span><i class="ph-bold ph-arrow-up-right"></i></div>
          <h3>マンガで実践！AI活用</h3>
          <p>"売れる"Webサイトを、AIで作る。現場で使えるテクニックを実践録として。</p>
          <div class="go">マガジンを読む →</div>
        </a>
        <a class="out-card" href="https://note.com/aiux_unite/m/m19a44a319753" target="_blank" rel="noopener">
          <div class="top"><span class="badge">エッセイ・連載中</span><i class="ph-bold ph-arrow-up-right"></i></div>
          <h3>AI時代の「流行」と「本質」</h3>
          <p>次々と出る新ツール。追うべきものと、変わらない芯。IT業界目線で考えるAIとの付き合い方。</p>
          <div class="go">マガジンを読む →</div>
        </a>
      </div>
    </div>
  </section>

  <!-- FAQ -->
  <section aria-label="よくある質問">
    <div class="wrap">
      <div class="sec-head">
        <div class="kicker">FAQ — よくある質問</div>
        <h2 class="sec-title">吉川聡史について</h2>
      </div>
      <div class="faq">
        <details open>
          <summary><span class="q">Q</span>吉川聡史とは、どんな人物ですか？<i class="ph-bold ph-caret-down chev"></i></summary>
          <div class="a">吉川聡史（よしかわさとし）は、AIクリエイター・漫画家・UXディレクターです。週刊少年チャンピオンで連載を持っていた漫画家でありながら、株式会社ニジボックスの室長として Web制作・UXデザインをリード。生成AIの活用を、マンガでわかりやすく伝える発信者として活動しています。</div>
        </details>
        <details>
          <summary><span class="q">Q</span>AI活用マンガはどこで読めますか？<i class="ph-bold ph-caret-down chev"></i></summary>
          <div class="a">note「AI-UX UNITE」（<a href="https://note.com/aiux_unite" target="_blank" rel="noopener">note.com/aiux_unite</a>）で読めます。「マンガでわかる！AI活用」「マンガで実践！AI活用」「AI時代の流行と本質」の3マガジンを連載中。動画は YouTube（<a href="https://www.youtube.com/@aiux-unite" target="_blank" rel="noopener">@aiux-unite</a>）でも発信しています。</div>
        </details>
        <details>
          <summary><span class="q">Q</span>どんな分野が専門ですか？<i class="ph-bold ph-caret-down chev"></i></summary>
          <div class="a">生成AI活用（Claude / Claude Code、ChatGPT API、Gemini × NotebookLM、Midjourney、Figma Make など）、UX・Web制作、そして漫画・映像で培ったストーリーテリングが専門領域です。AIとUXと物語を掛け合わせた発信が特徴です。</div>
        </details>
        <details>
          <summary><span class="q">Q</span>仕事の依頼・相談はできますか？<i class="ph-bold ph-caret-down chev"></i></summary>
          <div class="a">講演・寄稿・制作・取材などのご相談を受け付けています。<a href="/#contact">お問い合わせフォーム</a>からご連絡ください。各種SNS（X・Facebook・LinkedIn・Threads・mixi2・YOUTRUST）でもつながれます。</div>
        </details>
      </div>
    </div>
  </section>

  <!-- CTA -->
  <section class="cta-sec" aria-label="お問い合わせ">
    <div class="wrap">
      <div class="cta-box">
        <h2>一緒に、AIを面白く。</h2>
        <p>講演・寄稿・制作・取材のご相談はお気軽に。</p>
        <div class="cta-actions">
          <a class="btn btn-primary" style="padding:14px 28px;font-size:16px" href="/#contact"><i class="ph-bold ph-paper-plane-tilt"></i>お問い合わせ<i class="ph-bold ph-arrow-right"></i></a>
          <a class="btn btn-ghost" href="/"><i class="ph-bold ph-house"></i>トップページ<i class="ph-bold ph-arrow-right"></i></a>
        </div>
        <div class="socials">
          <a href="https://x.com/yoshikawa5116" target="_blank" rel="noopener" aria-label="X"><i class="ph-bold ph-x-logo"></i></a>
          <a href="https://www.facebook.com/profile.php?id=100008552592871" target="_blank" rel="noopener" aria-label="Facebook"><i class="ph-bold ph-facebook-logo"></i></a>
          <a href="https://jp.linkedin.com/in/%E8%81%A1%E5%8F%B2-%E5%90%89%E5%B7%9D-7b121a255" target="_blank" rel="noopener" aria-label="LinkedIn"><i class="ph-bold ph-linkedin-logo"></i></a>
          <a href="https://www.threads.com/@ai_baystars" target="_blank" rel="noopener" aria-label="Threads"><i class="ph-bold ph-threads-logo"></i></a>
          <a href="https://mixi.social/@yoshikawa5116" target="_blank" rel="noopener" aria-label="mixi2"><i class="ph-bold ph-chats-circle"></i></a>
          <a href="https://youtrust.jp/users/yoshikawa51" target="_blank" rel="noopener" aria-label="YOUTRUST"><i class="ph-bold ph-handshake"></i></a>
          <a href="https://www.youtube.com/@aiux-unite" target="_blank" rel="noopener" aria-label="YouTube"><i class="ph-bold ph-youtube-logo"></i></a>
        </div>
      </div>
    </div>
  </section>
</main>
`;

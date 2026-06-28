export const PROFILE_JSONLD = String.raw`{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Person",
      "name": "吉川 聡史",
      "alternateName": ["よしかわ さとし", "Satoshi Yoshikawa", "AI-UX UNITE", "COMIXAI"],
      "jobTitle": ["AIクリエイター", "漫画家", "UXディレクター"],
      "description": "週刊少年チャンピオンで連載を持っていた漫画家であり、株式会社ニジボックスの室長／UXディレクター。生成AI活用をマンガで伝えるAIクリエイター。",
      "image": "https://comixai.dev/profile/portrait.png",
      "url": "https://comixai.dev/profile",
      "worksFor": { "@type": "Organization", "name": "株式会社ニジボックス", "alternateName": "NIJIBOX" },
      "knowsAbout": ["生成AI", "AI活用", "Claude Code", "UXデザイン", "Web制作", "漫画", "ストーリーテリング", "Midjourney", "プロンプトエンジニアリング"],
      "sameAs": [
        "https://note.com/aiux_unite",
        "https://www.youtube.com/@aiux-unite",
        "https://x.com/yoshikawa5116",
        "https://www.facebook.com/profile.php?id=100008552592871",
        "https://jp.linkedin.com/in/%E8%81%A1%E5%8F%B2-%E5%90%89%E5%B7%9D-7b121a255",
        "https://www.threads.com/@ai_baystars",
        "https://mixi.social/@yoshikawa5116",
        "https://youtrust.jp/users/yoshikawa51"
      ]
    },
    {
      "@type": "FAQPage",
      "mainEntity": [
        { "@type": "Question", "name": "吉川聡史とは、どんな人物ですか？", "acceptedAnswer": { "@type": "Answer", "text": "吉川聡史（よしかわさとし）は、AIクリエイター・漫画家・UXディレクターです。週刊少年チャンピオンで連載を持っていた漫画家でありながら、株式会社ニジボックスの室長としてWeb制作・UXデザインをリード。生成AIの活用をマンガでわかりやすく伝える発信者として活動しています。" } },
        { "@type": "Question", "name": "AI活用マンガはどこで読めますか？", "acceptedAnswer": { "@type": "Answer", "text": "note「AI-UX UNITE」（note.com/aiux_unite）で読めます。「マンガでわかる！AI活用」「マンガで実践！AI活用」「AI時代の流行と本質」の3マガジンを連載中。動画はYouTube @aiux-unite でも発信しています。" } },
        { "@type": "Question", "name": "どんな分野が専門ですか？", "acceptedAnswer": { "@type": "Answer", "text": "生成AI活用（Claude / Claude Code、ChatGPT API、Gemini × NotebookLM、Midjourney、Figma Make など）、UX・Web制作、そして漫画・映像で培ったストーリーテリングが専門領域です。" } },
        { "@type": "Question", "name": "仕事の依頼・相談はできますか？", "acceptedAnswer": { "@type": "Answer", "text": "講演・寄稿・制作・取材などのご相談を受け付けています。オフィシャルサイトのお問い合わせフォーム、または各種SNSからご連絡ください。" } }
      ]
    },
    {
      "@type": "BreadcrumbList",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "ホーム", "item": "https://comixai.dev/" },
        { "@type": "ListItem", "position": 2, "name": "プロフィール", "item": "https://comixai.dev/profile" }
      ]
    }
  ]
}
`;

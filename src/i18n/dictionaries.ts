import type { Locale } from "@/i18n/settings";

type Dictionary = {
  nav: {
    home: string;
    about: string;
    project: string;
    services: string;
    blog: string;
    contact: string;
    contactCta: string;
  };
  hero: {
    location: string;
    featured: string;
    viewAll: string;
  };
  footer: {
    blurb: string;
  };
  aboutPage: {
    eyebrow: string;
    education: string;
    experience: string;
    skills: string;
  };
  projectPage: {
    eyebrow: string;
    title: string;
    cta: string;
    back: string;
    about: string;
    features: string;
    techStack: string;
    frontend: string;
    backend: string;
    timeline: string;
    links: string;
    website: string;
    year: string;
    type: string;
    screenshots: string;
    nda: string;
    viewProject: string;
    role: string;
    overview: string;
    nextProject: string;
    allProjects: string;
  };
  contactPage: {
    eyebrow: string;
    title: string;
  };
  landing: {
    work: string;
    contact: string;
    getInTouch: string;
    available: string;
    replyNote: string;
    about: string;
    news: string;
    skills: string;
    experience: string;
    education: string;
    study: string;
    viewAll: string;
    heroDisciplineA: string;
    heroDisciplineB: string;
    heroTagline: string;
    /** Placeholders: {name} {wordmark} {title} */
    heroIntro: string;
    heroLine1: string;
    heroLine2: string;
    heroLine3: string;
    interlude1: string;
    interlude2: string;
    interlude3: string;
    contactLine1: string;
    contactLine2: string;
    contactLine3: string;
    contactLine4: string;
    index: string;
    practice: string;
    serviceLead: string;
    services: readonly {
      index: string;
      title: string;
      body: string;
      tags: readonly string[];
    }[];
    partners: string;
    signal: string;
    notes: string;
    toTop: string;
  };
};

const detailEn = {
  back: "All work",
  about: "About",
  features: "Features",
  techStack: "Tech stack",
  frontend: "Frontend",
  backend: "Backend",
  timeline: "Timeline",
  links: "Links",
  website: "Website",
  year: "Year",
  type: "Type",
  screenshots: "Screenshots",
  nda: "NDA",
  viewProject: "View case study",
  role: "Role",
  overview: "Overview",
  nextProject: "Next project",
  allProjects: "All projects",
};

const landingEn: Dictionary["landing"] = {
  work: "Work",
  contact: "Contact",
  getInTouch: "Get in touch",
  available:
    "I'm currently available for freelance work, partnering with founders and teams on product design and the engineering that ships it.",
  replyNote:
    "Send a note with a little about the project, the timeline, and what you need. I read every message and write back.",
  about: "About",
  news: "Activities & Updates",
  skills: "Skills",
  experience: "Experience",
  education: "Education",
  study: "Study",
  viewAll: "see all works",
  heroDisciplineA: "Design &",
  heroDisciplineB: "Engineering",
  heroTagline: "Full-stack at CoSI, Bangkok.\nDesign and engineering with the same care.",
  heroIntro:
    "I'm {name} ({wordmark}), a {title} building fast, intentional interfaces from Bangkok, Thailand.",
  heroLine1: "From Sketch",
  heroLine2: "to",
  heroLine3: "with care",
  interlude1: "Ship",
  interlude2: "with",
  interlude3: "purpose",
  contactLine1: "Let's",
  contactLine2: "Create",
  contactLine3: "Something",
  contactLine4: "Extraordinary",
  index: "Index",
  practice: "Services",
  serviceLead: "Design, build, ship, and keep it healthy — from brand to launch and beyond.",
  services: [
    {
      index: "01",
      title: "Brand & Interface",
      body: "Research, flows, and brand systems — from wireframes to polished UI and identity that holds across the product.",
      tags: ["UX", "UI", "Brand"],
    },
    {
      index: "02",
      title: "Develop",
      body: "Full-stack apps with a management CMS — content, roles, and admin so the team can run the product without a deploy.",
      tags: ["Full-stack", "CMS", "Admin"],
    },
    {
      index: "03",
      title: "Performance",
      body: "Speed, Core Web Vitals, and lean bundles — make the product feel instant without rewriting everything.",
      tags: ["Perf", "CWV", "Bundle"],
    },
    {
      index: "04",
      title: "SEO",
      body: "Technical SEO and content structure — metadata, sitemap, schema, and pages that search engines (and people) can find.",
      tags: ["Meta", "Schema", "Sitemap"],
    },
    {
      index: "05",
      title: "Ship Product",
      body: "CI/CD, hosting, and environments that stay predictable — ship safely from preview to product.",
      tags: ["CI/CD", "Hosting", "Preview"],
    },
    {
      index: "06",
      title: "Maintenance",
      body: "Ongoing care after launch — fixes, small features, dependency updates, and monitoring so nothing drifts.",
      tags: ["Support", "Updates", "Monitor"],
    },
  ],
  partners: "Partners",
  signal: "Signal",
  notes: "Notes",
  toTop: "Top",
};

const dictionaries: Record<Locale, Dictionary> = {
  en: {
    nav: {
      home: "Home",
      about: "About",
      project: "Project",
      services: "Services",
      blog: "Activities",
      contact: "Contact",
      contactCta: "Contact Us",
    },
    hero: {
      location: "Bangkok, Thailand",
      featured: "Featured projects",
      viewAll: "see all works",
    },
    footer: {
      blurb:
        "Full-Stack Developer based in Bangkok — building digital experiences with care and craft.",
    },
    aboutPage: {
      eyebrow: "About",
      education: "Education",
      experience: "Experience",
      skills: "Skills",
    },
    projectPage: {
      eyebrow: "Project",
      title: "Selected projects I have shipped",
      cta: "Start a similar project",
      ...detailEn,
    },
    contactPage: {
      eyebrow: "Contact",
      title: "Let’s build something together",
    },
    landing: landingEn,
  },
  th: {
    nav: {
      home: "หน้าแรก",
      about: "เกี่ยวกับ",
      project: "โปรเจกต์",
      services: "บริการ",
      blog: "กิจกรรม",
      contact: "ติดต่อ",
      contactCta: "ติดต่อเรา",
    },
    hero: {
      location: "กรุงเทพฯ ประเทศไทย",
      featured: "ผลงานเด่น",
      viewAll: "ดูผลงานทั้งหมด",
    },
    footer: {
      blurb: "Full-Stack Developer จากกรุงเทพฯ — สร้างประสบการณ์ดิจิทัลอย่างพิถีพิถัน",
    },
    aboutPage: {
      eyebrow: "เกี่ยวกับ",
      education: "การศึกษา",
      experience: "ประสบการณ์",
      skills: "ทักษะ",
    },
    projectPage: {
      eyebrow: "โปรเจกต์",
      title: "โปรเจกต์ที่คัดสรร",
      cta: "เริ่มโปรเจกต์คล้ายกัน",
      back: "งานทั้งหมด",
      about: "เกี่ยวกับ",
      features: "ฟีเจอร์",
      techStack: "เทคโนโลยี",
      frontend: "Frontend",
      backend: "Backend",
      timeline: "ไทม์ไลน์",
      links: "ลิงก์",
      website: "เว็บไซต์",
      year: "ปี",
      type: "ประเภท",
      screenshots: "ภาพหน้าจอ",
      nda: "NDA",
      viewProject: "ดูรายละเอียด",
      role: "บทบาท",
      overview: "ภาพรวม",
      nextProject: "โปรเจกต์ถัดไป",
      allProjects: "โปรเจกต์ทั้งหมด",
    },
    contactPage: {
      eyebrow: "ติดต่อ",
      title: "มาสร้างอะไรด้วยกัน",
    },
    landing: {
      work: "ผลงาน",
      contact: "ติดต่อ",
      getInTouch: "ติดต่อมาได้",
      available:
        "ตอนนี้รับงานฟรีแลนซ์ ร่วมกับผู้ก่อตั้งและทีมในงานออกแบบผลิตภัณฑ์และวิศวกรรมที่ส่งมอบได้จริง",
      replyNote:
        "ส่งข้อความมาได้ เล่าโปรเจกต์ ไทม์ไลน์ และสิ่งที่ต้องการ ฉันอ่านทุกข้อความและจะตอบกลับ",
      about: "เกี่ยวกับ",
      news: "กิจกรรม & อัปเดต",
      skills: "ทักษะ",
      experience: "ประสบการณ์",
      education: "การศึกษา",
      study: "การศึกษา",
      viewAll: "ดูทั้งหมด ↗",
      heroDisciplineA: "ออกแบบ &",
      heroDisciplineB: "วิศวกรรม",
      heroTagline: "Full-stack ที่ CoSI กรุงเทพฯ\nออกแบบและวิศวกรรมด้วยความใส่ใจเท่ากัน",
      heroIntro:
        "ผมชื่อ {name} ({wordmark}) {title} ที่สร้างอินเทอร์เฟซให้รวดเร็วและตั้งใจ จากกรุงเทพฯ ประเทศไทย",
      heroLine1: "จากร่างแรก",
      heroLine2: "ถึง",
      heroLine3: "ด้วยความใส่ใจ",
      interlude1: "ส่งมอบ",
      interlude2: "ด้วย",
      interlude3: "จุดมุ่งหมาย",
      contactLine1: "มา",
      contactLine2: "สร้าง",
      contactLine3: "บางอย่าง",
      contactLine4: "ที่พิเศษ",
      index: "ดัชนี",
      practice: "บริการ",
      serviceLead: "ออกแบบ สร้าง ส่งมอบ และดูแลต่อเนื่อง — จาก UX ถึง DevOps และ SEO",
      services: [
        {
          index: "01",
          title: "Brand & Interface",
          body: "วิจัย โฟลว์ และระบบแบรนด์ — จากไวร์เฟรมถึง UI และอัตลักษณ์ที่คงเส้นคงวาทั้งผลิตภัณฑ์",
          tags: ["UX", "UI", "Brand"],
        },
        {
          index: "02",
          title: "Develop",
          body: "แอป full-stack พร้อม CMS จัดการ — คอนเทนต์ บทบาท และแอดมิน ให้ทีมรันได้โดยไม่ต้อง deploy ทุกครั้ง",
          tags: ["Full-stack", "CMS", "Admin"],
        },
        {
          index: "03",
          title: "Performance",
          body: "ความเร็ว Core Web Vitals และ bundle ที่เบา — ให้รู้สึกไวโดยไม่ต้องเขียนใหม่ทั้งระบบ",
          tags: ["Perf", "CWV", "Bundle"],
        },
        {
          index: "04",
          title: "SEO",
          body: "SEO เชิงเทคนิคและโครงสร้างคอนเทนต์ — metadata sitemap schema และหน้าเว็บที่ค้นหาเจอ",
          tags: ["Meta", "Schema", "Sitemap"],
        },
        {
          index: "05",
          title: "Ship Product",
          body: "CI/CD โฮสติ้ง และสภาพแวดล้อมที่คาดเดาได้ — ส่งจาก preview ถึง product อย่างปลอดภัย",
          tags: ["CI/CD", "Hosting", "Preview"],
        },
        {
          index: "06",
          title: "Maintenance",
          body: "ดูแลหลังเปิดตัว — แก้บั๊ก ฟีเจอร์เล็ก อัปเดต dependency และมอนิเตอร์ไม่ให้หลุด",
          tags: ["Support", "Updates", "Monitor"],
        },
      ],
      partners: "คู่ทำงาน",
      signal: "สัญญาณ",
      notes: "บันทึก",
      toTop: "บนสุด",
    },
  },
  zh: {
    nav: {
      home: "首页",
      about: "关于",
      project: "项目",
      services: "服务",
      blog: "动态",
      contact: "联系",
      contactCta: "联系我",
    },
    hero: {
      location: "曼谷，泰国",
      featured: "精选作品",
      viewAll: "查看全部项目",
    },
    footer: {
      blurb: "常驻曼谷的全栈开发者 — 用心打造数字体验。",
    },
    aboutPage: {
      eyebrow: "关于",
      education: "教育",
      experience: "经历",
      skills: "技能",
    },
    projectPage: {
      eyebrow: "项目",
      title: "精选项目",
      cta: "开始类似项目",
      back: "全部作品",
      about: "关于",
      features: "功能",
      techStack: "技术栈",
      frontend: "前端",
      backend: "后端",
      timeline: "时间线",
      links: "链接",
      website: "网站",
      year: "年份",
      type: "类型",
      screenshots: "截图",
      nda: "NDA",
      viewProject: "查看案例",
      role: "角色",
      overview: "概述",
      nextProject: "下一个项目",
      allProjects: "全部项目",
    },
    contactPage: {
      eyebrow: "联系",
      title: "一起做点什么",
    },
    landing: {
      work: "作品",
      contact: "联系",
      getInTouch: "取得联系",
      available: "目前可接自由职业合作，与创始人和团队合作产品设计，以及能真正交付的工程实现。",
      replyNote: "来信请简单说明项目、时间和你需要的帮助。我会阅读每一封来信并回复。",
      about: "关于",
      news: "动态与更新",
      skills: "技能",
      experience: "经历",
      education: "教育",
      study: "学业",
      viewAll: "查看全部 ↗",
      heroDisciplineA: "设计 &",
      heroDisciplineB: "工程",
      heroTagline: "曼谷 CoSI 全栈。\n设计与工程，同一份用心。",
      heroIntro: "我是 {name}（{wordmark}），一名{title}，在泰国曼谷打造快速、有意图的界面。",
      heroLine1: "从草图",
      heroLine2: "到",
      heroLine3: "用心完成",
      interlude1: "交付",
      interlude2: "带着",
      interlude3: "目的",
      contactLine1: "一起",
      contactLine2: "创造",
      contactLine3: "一些",
      contactLine4: "非凡之事",
      index: "索引",
      practice: "服务",
      serviceLead: "设计、开发、上线并持续维护——从 UX 到 DevOps 与 SEO。",
      services: [
        {
          index: "01",
          title: "Brand & Interface",
          body: "研究、流程与品牌系统——从线框到精致 UI，以及贯穿产品的视觉识别。",
          tags: ["UX", "UI", "Brand"],
        },
        {
          index: "02",
          title: "Develop",
          body: "全栈应用搭配管理 CMS——内容、角色与后台，团队无需每次部署也能运营。",
          tags: ["Full-stack", "CMS", "Admin"],
        },
        {
          index: "03",
          title: "Performance",
          body: "速度、Core Web Vitals 与精简打包——不必重写整站也能更快。",
          tags: ["Perf", "CWV", "Bundle"],
        },
        {
          index: "04",
          title: "SEO",
          body: "技术 SEO 与内容结构——元数据、站点地图、结构化数据，让搜索引擎和用户都找得到。",
          tags: ["Meta", "Schema", "Sitemap"],
        },
        {
          index: "05",
          title: "Ship Product",
          body: "CI/CD、托管与可预期的环境——从预览安全发布到产品。",
          tags: ["CI/CD", "Hosting", "Preview"],
        },
        {
          index: "06",
          title: "Maintenance",
          body: "上线后的持续照护——修复、小功能、依赖更新与监控，避免漂移。",
          tags: ["Support", "Updates", "Monitor"],
        },
      ],
      partners: "合作",
      signal: "信号",
      notes: "笔记",
      toTop: "顶部",
    },
  },
  fr: {
    nav: {
      home: "Accueil",
      about: "À propos",
      project: "Projet",
      services: "Services",
      blog: "Activités",
      contact: "Contact",
      contactCta: "Nous contacter",
    },
    hero: {
      location: "Bangkok, Thaïlande",
      featured: "Projets en vedette",
      viewAll: "Voir tous les projets",
    },
    footer: {
      blurb:
        "Développeur Full-Stack basé à Bangkok — je construis des expériences numériques avec soin.",
    },
    aboutPage: {
      eyebrow: "À propos",
      education: "Formation",
      experience: "Expérience",
      skills: "Compétences",
    },
    projectPage: {
      eyebrow: "Projet",
      title: "Projets sélectionnés",
      cta: "Lancer un projet similaire",
      back: "Tous les projets",
      about: "À propos",
      features: "Fonctionnalités",
      techStack: "Stack technique",
      frontend: "Frontend",
      backend: "Backend",
      timeline: "Chronologie",
      links: "Liens",
      website: "Site web",
      year: "Année",
      type: "Type",
      screenshots: "Captures d’écran",
      nda: "NDA",
      viewProject: "Voir l’étude de cas",
      role: "Rôle",
      overview: "Aperçu",
      nextProject: "Projet suivant",
      allProjects: "Tous les projets",
    },
    contactPage: {
      eyebrow: "Contact",
      title: "Construisons quelque chose ensemble",
    },
    landing: {
      work: "Travaux",
      contact: "Contact",
      getInTouch: "Entrons en contact",
      available:
        "Disponible pour des missions freelance, aux côtés de fondateurs et d'équipes, du design produit à l'ingénierie qui livre.",
      replyNote:
        "Écrivez-moi en quelques lignes : le projet, le calendrier, et ce dont vous avez besoin. Je lis chaque message et je réponds.",
      about: "À propos",
      news: "Activités & Mises à jour",
      skills: "Compétences",
      experience: "Expérience",
      education: "Formation",
      study: "Études",
      viewAll: "Tout voir ↗",
      heroDisciplineA: "Design &",
      heroDisciplineB: "Ingénierie",
      heroTagline: "Full-stack chez CoSI, Bangkok.\nDesign et ingénierie avec le même soin.",
      heroIntro:
        "Je suis {name} ({wordmark}), {title} qui construit des interfaces rapides et intentionnelles depuis Bangkok, Thaïlande.",
      heroLine1: "Du croquis",
      heroLine2: "au",
      heroLine3: "avec soin",
      interlude1: "Livrer",
      interlude2: "avec",
      interlude3: "intention",
      contactLine1: "Créons",
      contactLine2: "Quelque",
      contactLine3: "Chose",
      contactLine4: "d’Extraordinaire",
      index: "Index",
      practice: "Services",
      serviceLead: "Designer, construire, livrer et maintenir — de l’UX au DevOps et au SEO.",
      services: [
        {
          index: "01",
          title: "Brand & Interface",
          body: "Recherche, parcours et systèmes de marque — du wireframe à une UI soignée et une identité cohérente.",
          tags: ["UX", "UI", "Brand"],
        },
        {
          index: "02",
          title: "Develop",
          body: "Apps full-stack avec CMS de gestion — contenu, rôles et admin pour opérer sans redeployer à chaque fois.",
          tags: ["Full-stack", "CMS", "Admin"],
        },
        {
          index: "03",
          title: "Performance",
          body: "Vitesse, Core Web Vitals et bundles légers — un produit plus vif sans tout réécrire.",
          tags: ["Perf", "CWV", "Bundle"],
        },
        {
          index: "04",
          title: "SEO",
          body: "SEO technique et structure de contenu — métadonnées, sitemap, schema, des pages trouvables.",
          tags: ["Meta", "Schema", "Sitemap"],
        },
        {
          index: "05",
          title: "Ship Product",
          body: "CI/CD, hosting et environnements prévisibles — livrer en sécurité du preview au produit.",
          tags: ["CI/CD", "Hosting", "Preview"],
        },
        {
          index: "06",
          title: "Maintenance",
          body: "Soin après le lancement — correctifs, petites features, mises à jour et monitoring sans dérive.",
          tags: ["Support", "Updates", "Monitor"],
        },
      ],
      partners: "Partenaires",
      signal: "Signal",
      notes: "Notes",
      toTop: "Haut",
    },
  },
  ja: {
    nav: {
      home: "ホーム",
      about: "について",
      project: "プロジェクト",
      services: "サービス",
      blog: "アクティビティ",
      contact: "連絡",
      contactCta: "お問い合わせ",
    },
    hero: {
      location: "バンコク、タイ",
      featured: "注目の作品",
      viewAll: "すべてのプロジェクトを見る",
    },
    footer: {
      blurb: "バンコク拠点のフルスタック開発者 — 丁寧にデジタル体験を作ります。",
    },
    aboutPage: {
      eyebrow: "について",
      education: "学歴",
      experience: "経験",
      skills: "スキル",
    },
    projectPage: {
      eyebrow: "プロジェクト",
      title: "厳選したプロジェクト",
      cta: "似たプロジェクトを始める",
      back: "すべての作品",
      about: "概要",
      features: "機能",
      techStack: "技術スタック",
      frontend: "フロントエンド",
      backend: "バックエンド",
      timeline: "タイムライン",
      links: "リンク",
      website: "ウェブサイト",
      year: "年",
      type: "タイプ",
      screenshots: "スクリーンショット",
      nda: "NDA",
      viewProject: "ケーススタディを見る",
      role: "役割",
      overview: "概要",
      nextProject: "次のプロジェクト",
      allProjects: "すべてのプロジェクト",
    },
    contactPage: {
      eyebrow: "連絡",
      title: "一緒に何か作りましょう",
    },
    landing: {
      work: "作品",
      contact: "連絡",
      getInTouch: "ご連絡ください",
      available:
        "現在、フリーランスの仕事を受けています。創業者やチームと、プロダクトデザインから実装まで一緒に進めます。",
      replyNote:
        "プロジェクトの内容、時期、必要なことを簡単に書いてください。すべてのメッセージに目を通し、折り返します。",
      about: "について",
      news: "アクティビティ & 更新",
      skills: "スキル",
      experience: "経験",
      education: "学歴",
      study: "学業",
      viewAll: "すべて見る ↗",
      heroDisciplineA: "デザイン &",
      heroDisciplineB: "エンジニアリング",
      heroTagline: "バンコクの CoSI でフルスタック。\nデザインとエンジニアリングを同じ丁寧さで。",
      heroIntro:
        "{name}（{wordmark}）です。タイ・バンコクを拠点に、速く意図のあるインターフェースを作る{title}です。",
      heroLine1: "スケッチから",
      heroLine2: "へ",
      heroLine3: "丁寧に",
      interlude1: "届けよう",
      interlude2: "目的を",
      interlude3: "持って",
      contactLine1: "一緒に",
      contactLine2: "何か",
      contactLine3: "特別な",
      contactLine4: "ものを",
      index: "索引",
      practice: "サービス",
      serviceLead: "デザイン、開発、出荷、そして継続ケア — UX から DevOps・SEO まで。",
      services: [
        {
          index: "01",
          title: "Brand & Interface",
          body: "リサーチ、フロー、ブランドシステム — ワイヤーから磨き上げた UI と、製品全体で一貫するアイデンティティまで。",
          tags: ["UX", "UI", "Brand"],
        },
        {
          index: "02",
          title: "Develop",
          body: "管理 CMS 付きフルスタック — コンテンツ・権限・管理画面で、毎回デプロイせず運用できる。",
          tags: ["Full-stack", "CMS", "Admin"],
        },
        {
          index: "03",
          title: "Performance",
          body: "速度、Core Web Vitals、軽いバンドル — 全面書き換えなしで体感を速く。",
          tags: ["Perf", "CWV", "Bundle"],
        },
        {
          index: "04",
          title: "SEO",
          body: "テクニカル SEO とコンテンツ構造 — メタ、サイトマップ、スキーマで見つかるページに。",
          tags: ["Meta", "Schema", "Sitemap"],
        },
        {
          index: "05",
          title: "Ship Product",
          body: "CI/CD、ホスティング、予測可能な環境 — プレビューからプロダクトまで安全に出荷。",
          tags: ["CI/CD", "Hosting", "Preview"],
        },
        {
          index: "06",
          title: "Maintenance",
          body: "公開後の継続ケア — 修正、小さな機能、依存更新、監視でドリフトを防ぐ。",
          tags: ["Support", "Updates", "Monitor"],
        },
      ],
      partners: "パートナー",
      signal: "シグナル",
      notes: "ノート",
      toTop: "上へ",
    },
  },
};

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale] ?? dictionaries.en;
}

export function formatLandingIntro(
  template: string,
  vars: { name: string; wordmark: string; title: string }
) {
  return template
    .replaceAll("{name}", vars.name)
    .replaceAll("{wordmark}", vars.wordmark)
    .replaceAll("{title}", vars.title);
}

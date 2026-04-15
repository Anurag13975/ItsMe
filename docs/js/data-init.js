/* ═══════════════════════════════════════════════════════════
   data-init.js  –  Embedded portfolio data (fallback)
   Works on file:// protocol and any static host.
   Update this file when you update data.json:
     1. Make edits via admin mode → click Export
     2. Replace docs/data.json with exported file
     3. Also update window.__PORTFOLIO_DEFAULT_DATA__ below
   ═══════════════════════════════════════════════════════════ */

window.__PORTFOLIO_DEFAULT_DATA__ = {
  "meta": {
    "siteName": "Anurag Singhal | Portfolio",
    "seoDescription": "SDE-2 at HT Digital Streams \u2013 Java, Spring Boot, Microservices, Real-time Systems"
  },
  "hero": {
    "greeting": "Hi, I'm",
    "name": "Anurag Singhal",
    "titles": ["Software Engineer", "Backend Developer", "Java Specialist", "System Designer"],
    "tagline": "Building scalable, high-performance systems that power millions of users"
  },
  "about": {
    "bio": "I'm a passionate Software Development Engineer with 2+ years of experience building high-impact backend systems. Currently SDE-2 at HT Digital Streams (Hindustan Times), where I architect real-time data pipelines, microservices, and APIs that serve millions of users daily.",
    "bio2": "I specialise in Java, Spring Boot, and reactive programming, with a track record of improving system performance, reducing latency, and driving revenue growth through technical innovation.",
    "stats": [
      { "value": "2+",    "label": "Years Exp"       },
      { "value": "1.5M",  "label": "Daily Users"     },
      { "value": "1500+", "label": "Problems Solved" }
    ],
    "contact": {
      "email":    "anuragsinghal6072@gmail.com",
      "phone":    "+91-9588877170",
      "linkedin": "https://linkedin.com/in/anurag0singhal",
      "github":   "https://github.com/Anurag13975",
      "location": "New Delhi, India"
    }
  },
  "experience": [
    {
      "id": 1,
      "title":    "SDE-2",
      "company":  "HT Digital Streams (The Hindustan Times)",
      "period":   "Oct 2025 \u2013 Present",
      "location": "New Delhi, India",
      "domain":   "Markets",
      "techStack": ["Java", "Spring Boot", "REST", "Microservices", "Spring WebFlux", "Redis", "MongoDB"],
      "bullets": [
        "Built a <strong>Real-Time Trade-Alert Notification</strong> feature with MoEngage integration \u2014 scheduler monitors live stock prices against trade recommendations, detects stop-loss/target-hit events, and pushes alerts asynchronously to a message queue. Achieved <strong>40% increase</strong> in overall market traffic.",
        "Enhanced the core <strong>Search API</strong> via migration to Atlas Search (improved relevance and reduced latency) and revamped the Market Dashboard \u2014 combined efforts drove a <strong>25% increase</strong> in traffic."
      ]
    },
    {
      "id": 2,
      "title":    "SDE-1",
      "company":  "HT Digital Streams (The Hindustan Times)",
      "period":   "Jun 2024 \u2013 Oct 2025",
      "location": "New Delhi, India",
      "domain":   "Vernacular & Livemint.com \u2192 Markets",
      "techStack": ["Java", "Spring Boot", "REST", "Microservices", "Redis", "Elasticsearch", "MongoDB", "Spring WebFlux"],
      "bullets": [
        "Revamped backend architecture with optimised APIs, Redis caching, and Elasticsearch \u2014 achieved <strong>60% higher user engagement</strong> and supported peak <strong>1.5 M daily traffic</strong>.",
        "Led backend integration of <strong>IndiaBond</strong> and <strong>Dhan</strong> into LiveMint, enabling a new financial product vertical that contributed to a <strong>\u20b91 Cr revenue increase</strong>.",
        "Optimised real-time data streaming using Spring WebFlux and reactive programming, integrating Refinitiv, Morningstar & Dion providers \u2014 reduced latency by <strong>40%</strong>.",
        "Spearheaded development of an <strong>early alerting system</strong> to detect critical market fluctuations in real time, enhancing system robustness and team decision-making."
      ]
    }
  ],
  "education": [
    {
      "id": 1,
      "institution": "Malaviya National Institute of Technology Jaipur",
      "degree":      "Bachelor of Technology",
      "score":       "8.00 CGPA",
      "period":      "Nov 2020 \u2013 May 2024",
      "location":    "Jaipur, Rajasthan"
    },
    {
      "id": 2,
      "institution": "Nirmal Happy Sr. Sec. School",
      "degree":      "12th \u2013 Rajasthan Board of Secondary Education",
      "score":       "93.80%",
      "period":      "Jul 2019 \u2013 Jul 2020",
      "location":    "Karauli, Rajasthan"
    }
  ],
  "projects": [
    {
      "id": 1,
      "name":        "eCommerceElite",
      "description": "A full-stack e-commerce platform with responsive React UI, global state via Redux, and 15+ REST APIs in Node/Express for core commerce flows.",
      "techStack":   ["ReactJS", "NodeJS", "Express.js", "Redux.js", "MongoDB", "JWT", "PayPal API"],
      "period":      "Jan 2023 \u2013 Apr 2023",
      "highlights": [
        "Responsive React UI with global state management via Redux",
        "15+ REST APIs in Node/Express covering entire commerce flow",
        "JWT-based authentication and PayPal integration for secure checkout"
      ],
      "github": "https://github.com/Anurag13975",
      "live":   ""
    },
    {
      "id": 2,
      "name":        "Real-Time Market Intelligence Agent",
      "description": "A real-time market monitoring prototype with WebSocket streaming, React dashboard, and an ML model for short-term price trend classification.",
      "techStack":   ["Java", "Spring Boot", "Python", "FastAPI", "React", "WebSockets", "scikit-learn"],
      "period":      "2024",
      "highlights": [
        "Real-time market monitoring via WebSockets + React dashboard",
        "ML model (scikit-learn) with SMA/EMA/volatility features for trend classification"
      ],
      "github": "https://github.com/Anurag13975",
      "live":   ""
    }
  ],
  "skills": {
    "Languages":              ["Java", "Python", "C/C++", "SQL", "JavaScript", "HTML/CSS"],
    "Frameworks & Libraries": ["Spring Boot", "Spring WebFlux", "React", "Node.js", "Express.js", "Redux.js", "FastAPI"],
    "Databases & Caching":    ["MongoDB", "MySQL", "Redis", "Elasticsearch", "Atlas Search"],
    "Architecture & Concepts":["Microservices", "RESTful APIs", "System Design", "OOPS", "DBMS", "GraphQL", "Reactive Programming"],
    "Developer Tools":        ["Git", "IntelliJ", "VS Code", "GitHub Copilot", "Eclipse", "Cursor", "Windsurf"]
  },
  "achievements": [
    "Solved <strong>1500+</strong> problems across LeetCode, GeeksForGeeks, and CodeStudio (2021\u20132024)",
    "Secured <strong>29th rank</strong> in CodeRush Coding Challenge \u2013 MNIT Jaipur (AlgoUniversity), 2023",
    "Ranked in <strong>TOP-25</strong> in GeeksForGeeks Institute Leaderboard, 2023",
    "Global top rankings: <strong>46th</strong> &amp; <strong>117th</strong> in CodeChef Starters; <strong>703rd</strong> in GFG Weekly Contest 130 (2022\u20132023)"
  ]
};

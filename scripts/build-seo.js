const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT_DIR = path.resolve(__dirname, '..');
const DATA_PATH = path.join(ROOT_DIR, 'datamobil.json');
const REHBER_DIR = path.join(ROOT_DIR, 'rehber');
const SITEMAP_PATH = path.join(ROOT_DIR, 'sitemap.xml');
const BASE_URL = 'https://pardusasistan.org.tr';

const CATEGORY_META = {
    goc: {
        name: 'Göç Süreci',
        icon: 'fa-route',
        desc: "Windows'tan Pardus ETAP 23 ve MEB 25'e geçiş adımları"
    },
    etap: {
        name: 'Pardus ETAP',
        icon: 'fa-chalkboard',
        desc: 'Etkileşimli tahta özel araçları, EBA QR ve ETA uygulamaları'
    },
    donanim: {
        name: 'Donanım',
        icon: 'fa-microchip',
        desc: 'Dokunmatik ekran, BIOS, ses, projeksiyon ve yazıcı çözümleri'
    },
    sistem: {
        name: 'Sistem',
        icon: 'fa-cog',
        desc: 'Format, USB hazırlama, LiderAhenk, şifre ve paket onarımı'
    },
    uygulama: {
        name: 'Uygulamalar',
        icon: 'fa-cube',
        desc: 'Pardus Mağaza, Wine, Z-Kitap ve eğitim yazılımları'
    },
    ofis: {
        name: 'Ofis & Belgeler',
        icon: 'fa-file-alt',
        desc: 'LibreOffice, PDF düzenleme ve belge uyumluluğu'
    },
    internet: {
        name: 'İnternet & Ağ',
        icon: 'fa-wifi',
        desc: 'Wi-Fi, sabit IP ve mobil internet paylaşımı'
    },
    ipucu: {
        name: 'İpuçları',
        icon: 'fa-lightbulb',
        desc: 'Pardus kullanımı, kısayollar ve temel Linux bilgileri'
    },
    gorunum: {
        name: 'Görünüm',
        icon: 'fa-palette',
        desc: 'Masaüstü ve tema özelleştirme rehberleri'
    }
};

function getCategoryMeta(cat) {
    return CATEGORY_META[cat] || {
        name: cat || 'Genel',
        icon: 'fa-folder',
        desc: ''
    };
}

function escapeHtml(str) {
    return String(str || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function stripFormatting(str) {
    return String(str || '')
        .replace(/<br\s*\/?>/gi, ' ')
        .replace(/<[^>]*>/g, ' ')
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1')
        .replace(/\*\*(.*?)\*\*/g, '$1')
        .replace(/\*(.*?)\*/g, '$1')
        .replace(/\s+/g, ' ')
        .trim();
}

function formatStepHtml(step) {
    let html = String(step || '')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');

    // Mevcut <a ... target='_blank'> etiketlerine guvenlik icin rel="noopener noreferrer" ekle
    html = html.replace(/<a\b([^>]*)>/gi, (match, attrs) => {
        if (/target\s*=\s*['"]_blank['"]/i.test(attrs) && !/\brel\s*=/i.test(attrs)) {
            return `<a${attrs} rel="noopener noreferrer">`;
        }
        return match;
    });

    return html;
}

function truncateDesc(text, maxLen = 155) {
    const clean = stripFormatting(text);
    if (clean.length <= maxLen) return clean;
    const sliced = clean.slice(0, maxLen - 3);
    const lastSpace = sliced.lastIndexOf(' ');
    const base = lastSpace > Math.floor(maxLen * 0.6) ? sliced.slice(0, lastSpace) : sliced;
    return `${base.trim()}...`;
}

function safeJsonLd(obj) {
    return JSON.stringify(obj, null, 2).replace(/</g, '\\u003c');
}

function getLastMod() {
    try {
        const out = execSync('git log -1 --format=%cs -- datamobil.json', {
            cwd: ROOT_DIR,
            encoding: 'utf8',
            stdio: ['ignore', 'pipe', 'ignore']
        }).trim();
        if (/^\d{4}-\d{2}-\d{2}$/.test(out)) {
            return out;
        }
    } catch (_) {
        // Git kullanilamiyorsa yedek tarihe gec
    }
    return new Date().toISOString().slice(0, 10);
}

function buildAnalyticsSnippet() {
    return `    <script async src="https://www.googletagmanager.com/gtag/js?id=G-9WJ6TBJCDG"></script>
    <script>
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', 'G-9WJ6TBJCDG');
    </script>`;
}

function buildThemeScript() {
    return `    <script>
        if (localStorage.getItem('darkMode') === 'true') {
            document.body.classList.add('dark-mode');
        }
        function toggleStaticTheme() {
            document.body.classList.toggle('dark-mode');
            localStorage.setItem('darkMode', document.body.classList.contains('dark-mode'));
        }
    </script>`;
}

function renderGuidePage(item, relatedItems, lastMod) {
    const catMeta = getCategoryMeta(item.category);
    const cleanTitle = stripFormatting(item.title);
    const formattedTitle = String(item.title || '').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    const winMatch = item.windows_karsiligi ? String(item.windows_karsiligi).trim() : '';
    const firstStepPlain = item.steps && item.steps.length > 0 ? stripFormatting(item.steps[0]) : '';
    const rawDesc = `${cleanTitle}. ${winMatch ? 'Windows karşılığı: ' + winMatch + '. ' : ''}${firstStepPlain}`;
    const metaDesc = truncateDesc(rawDesc, 155);
    const canonicalUrl = `${BASE_URL}/rehber/${item.id}/`;
    const pageTitle = `${cleanTitle} | Pardus Asistan`;

    const graph = [
        {
            '@type': 'BreadcrumbList',
            itemListElement: [
                {
                    '@type': 'ListItem',
                    position: 1,
                    name: 'Ana Sayfa',
                    item: `${BASE_URL}/`
                },
                {
                    '@type': 'ListItem',
                    position: 2,
                    name: 'Tüm Rehberler',
                    item: `${BASE_URL}/rehber/`
                },
                {
                    '@type': 'ListItem',
                    position: 3,
                    name: cleanTitle,
                    item: canonicalUrl
                }
            ]
        },
        {
            '@type': 'TechArticle',
            headline: cleanTitle,
            description: metaDesc,
            inLanguage: 'tr',
            articleSection: catMeta.name,
            dateModified: lastMod,
            image: `${BASE_URL}/share-image.png`,
            author: {
                '@type': 'Person',
                name: 'Hasbi Erdoğmuş',
                url: 'https://hasbierdogmus.com.tr'
            },
            publisher: {
                '@type': 'Organization',
                name: 'Pardus Asistan',
                logo: {
                    '@type': 'ImageObject',
                    url: `${BASE_URL}/icon.png`
                }
            },
            mainEntityOfPage: canonicalUrl
        }
    ];

    if (Array.isArray(item.steps) && item.steps.length >= 2) {
        graph.push({
            '@type': 'HowTo',
            name: cleanTitle,
            description: metaDesc,
            inLanguage: 'tr',
            step: item.steps.map((step, idx) => ({
                '@type': 'HowToStep',
                position: idx + 1,
                text: stripFormatting(step)
            }))
        });
    }

    const jsonLd = safeJsonLd({
        '@context': 'https://schema.org',
        '@graph': graph
    });

    const stepsHtml = (item.steps || [])
        .map(step => `                <div class="step-box">${formatStepHtml(step)}</div>`)
        .join('\n');

    const relatedHtml = relatedItems.length > 0 ? `
        <section class="related-guides" aria-labelledby="relatedTitle">
            <h2 id="relatedTitle">İlgili ${escapeHtml(catMeta.name)} Rehberleri</h2>
            <div class="related-grid">
${relatedItems.map(other => `                <a href="../${escapeHtml(other.id)}/" class="related-card">
                    <i class="fas ${escapeHtml(other.icon || 'fa-file-alt')}" aria-hidden="true"></i>
                    <div>
                        <strong>${escapeHtml(stripFormatting(other.title))}</strong>
                        ${other.windows_karsiligi ? `<span>Windows: ${escapeHtml(other.windows_karsiligi)}</span>` : ''}
                    </div>
                </a>`).join('\n')}
            </div>
        </section>` : '';

    return `<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="theme-color" content="#ed800d">
    <title>${escapeHtml(pageTitle)}</title>
    <meta name="description" content="${escapeHtml(metaDesc)}">
    <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1">
    <meta name="author" content="Hasbi Erdoğmuş">
    <link rel="canonical" href="${escapeHtml(canonicalUrl)}">

    <meta property="og:type" content="article">
    <meta property="og:locale" content="tr_TR">
    <meta property="og:site_name" content="Pardus Asistan">
    <meta property="og:title" content="${escapeHtml(pageTitle)}">
    <meta property="og:description" content="${escapeHtml(metaDesc)}">
    <meta property="og:url" content="${escapeHtml(canonicalUrl)}">
    <meta property="og:image" content="${BASE_URL}/share-image.png">
    <meta property="og:image:width" content="821">
    <meta property="og:image:height" content="357">
    <meta property="og:image:alt" content="${escapeHtml(cleanTitle)} - Pardus Asistan">

    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${escapeHtml(pageTitle)}">
    <meta name="twitter:description" content="${escapeHtml(metaDesc)}">
    <meta name="twitter:image" content="${BASE_URL}/share-image.png">

    <link rel="icon" type="image/png" href="../../icon.png">
    <link rel="apple-touch-icon" href="../../icon.png">
    <link rel="manifest" href="../../manifest.json">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link rel="preconnect" href="https://cdnjs.cloudflare.com" crossorigin>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="../../style.css">

    <script type="application/ld+json">
${jsonLd}
    </script>
</head>
<body>
${buildThemeScript()}

    <header class="app-header">
        <a href="../../" class="header-left" aria-label="Pardus Asistan Ana Sayfa">
            <img src="../../header-logo.png" alt="Pardus Asistan" width="107" height="45" class="new-header-logo">
        </a>
        <nav class="pc-nav" aria-label="Ana Menü">
            <a href="../../" class="pc-nav-link"><i class="fas fa-home" aria-hidden="true"></i> Ana Sayfa</a>
            <a href="../" class="pc-nav-link"><i class="fas fa-book-open" aria-hidden="true"></i> Tüm Rehberler</a>
            <a href="../../#${escapeHtml(item.id)}" class="pc-nav-link"><i class="fas fa-bolt" aria-hidden="true"></i> Uygulamada Aç</a>
        </nav>
        <div class="header-right-wrapper">
            <button type="button" class="theme-mini-btn" aria-label="Gece modunu değiştir" onclick="toggleStaticTheme()">
                <i class="fas fa-moon" aria-hidden="true"></i>
            </button>
        </div>
    </header>

    <main class="detail-view static-guide-view">
        <nav class="breadcrumb" aria-label="İçerik haritası">
            <a href="../../">Ana Sayfa</a>
            <span aria-hidden="true">›</span>
            <a href="../">Tüm Rehberler</a>
            <span aria-hidden="true">›</span>
            <span>${escapeHtml(catMeta.name)}</span>
        </nav>

        <article>
            <div class="detail-header">
                <a href="../../" class="back-btn" aria-label="Ana sayfaya dön"><i class="fas fa-arrow-left" aria-hidden="true"></i></a>
                <h1 class="detail-title">${formattedTitle}</h1>
            </div>

            <div class="guide-meta-bar">
                <span class="cat-pill"><i class="fas ${escapeHtml(catMeta.icon)}" aria-hidden="true"></i> ${escapeHtml(catMeta.name)}</span>
                <div class="windows-badge">Windows Karşılığı: ${escapeHtml(winMatch || 'Yok')}</div>
            </div>

            <div class="detail-content">
${stepsHtml}
            </div>
        </article>
${relatedHtml}

        <div class="static-nav-actions">
            <a href="../../#${escapeHtml(item.id)}" class="action-btn-primary"><i class="fas fa-mobile-alt" aria-hidden="true"></i> Etkileşimli Uygulamada Aç</a>
            <a href="../" class="action-btn-secondary"><i class="fas fa-th-list" aria-hidden="true"></i> Tüm Rehberler Arşivi</a>
        </div>
    </main>

    <footer class="seo-footer">
        <p><strong>Pardus Asistan</strong> · MEB &amp; TÜBİTAK Pardus ETAP 23 / MEB 25 Çözüm Rehberi · Geliştirici: <a href="https://hasbierdogmus.com.tr" target="_blank" rel="noopener noreferrer">Hasbi Erdoğmuş</a></p>
        <p><a href="../../">Ana Sayfa</a> · <a href="../">Tüm Rehberler</a></p>
    </footer>

${buildAnalyticsSnippet()}
</body>
</html>
`;
}

function renderArchivePage(uniqueItems, lastMod) {
    const canonicalUrl = `${BASE_URL}/rehber/`;
    const pageTitle = 'Tüm Pardus ETAP 23 & MEB 25 Çözüm Rehberleri | Pardus Asistan';
    const metaDesc = 'Pardus ETAP 23 ve MEB 25 etkileşimli tahta sorunları için 90+ kategorize edilmiş çözüm rehberi: dokunmatik, yazıcı, EBA QR, format, Wine, Z-Kitap ve LiderAhenk.';

    const grouped = new Map();
    Object.keys(CATEGORY_META).forEach(k => grouped.set(k, []));
    uniqueItems.forEach(item => {
        const key = item.category || 'ipucu';
        if (!grouped.has(key)) grouped.set(key, []);
        grouped.get(key).push(item);
    });

    const activeCategories = Array.from(grouped.entries()).filter(([, list]) => list.length > 0);

    const jsonLd = safeJsonLd({
        '@context': 'https://schema.org',
        '@graph': [
            {
                '@type': 'BreadcrumbList',
                itemListElement: [
                    {
                        '@type': 'ListItem',
                        position: 1,
                        name: 'Ana Sayfa',
                        item: `${BASE_URL}/`
                    },
                    {
                        '@type': 'ListItem',
                        position: 2,
                        name: 'Tüm Rehberler',
                        item: canonicalUrl
                    }
                ]
            },
            {
                '@type': 'CollectionPage',
                name: pageTitle,
                description: metaDesc,
                url: canonicalUrl,
                inLanguage: 'tr',
                dateModified: lastMod
            },
            {
                '@type': 'ItemList',
                name: 'Pardus ETAP Çözüm Rehberleri Listesi',
                numberOfItems: uniqueItems.length,
                itemListElement: uniqueItems.map((item, idx) => ({
                    '@type': 'ListItem',
                    position: idx + 1,
                    name: stripFormatting(item.title),
                    url: `${BASE_URL}/rehber/${item.id}/`
                }))
            }
        ]
    });

    const jumpButtons = activeCategories.map(([key, list]) => {
        const meta = getCategoryMeta(key);
        return `            <a href="#cat-${escapeHtml(key)}" class="cat-btn" style="text-decoration:none;"><i class="fas ${escapeHtml(meta.icon)}" aria-hidden="true"></i> ${escapeHtml(meta.name)} (${list.length})</a>`;
    }).join('\n');

    const sectionsHtml = activeCategories.map(([key, list]) => {
        const meta = getCategoryMeta(key);
        const cardsHtml = list.map(item => `                <a href="${escapeHtml(item.id)}/" class="archive-card">
                    <i class="fas ${escapeHtml(item.icon || 'fa-file-alt')}" aria-hidden="true"></i>
                    <div>
                        <strong>${escapeHtml(stripFormatting(item.title))}</strong>
                        ${item.windows_karsiligi ? `<small>Windows: ${escapeHtml(item.windows_karsiligi)}</small>` : ''}
                    </div>
                </a>`).join('\n');

        return `        <section id="cat-${escapeHtml(key)}" class="archive-section" aria-labelledby="heading-${escapeHtml(key)}">
            <div class="archive-section-head">
                <h2 id="heading-${escapeHtml(key)}"><i class="fas ${escapeHtml(meta.icon)}" aria-hidden="true"></i> ${escapeHtml(meta.name)} <span>(${list.length})</span></h2>
                ${meta.desc ? `<p>${escapeHtml(meta.desc)}</p>` : ''}
            </div>
            <div class="archive-grid">
${cardsHtml}
            </div>
        </section>`;
    }).join('\n\n');

    return `<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="theme-color" content="#ed800d">
    <title>${escapeHtml(pageTitle)}</title>
    <meta name="description" content="${escapeHtml(metaDesc)}">
    <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1">
    <meta name="author" content="Hasbi Erdoğmuş">
    <link rel="canonical" href="${escapeHtml(canonicalUrl)}">

    <meta property="og:type" content="website">
    <meta property="og:locale" content="tr_TR">
    <meta property="og:site_name" content="Pardus Asistan">
    <meta property="og:title" content="${escapeHtml(pageTitle)}">
    <meta property="og:description" content="${escapeHtml(metaDesc)}">
    <meta property="og:url" content="${escapeHtml(canonicalUrl)}">
    <meta property="og:image" content="${BASE_URL}/share-image.png">
    <meta property="og:image:width" content="821">
    <meta property="og:image:height" content="357">
    <meta property="og:image:alt" content="Pardus Asistan Çözüm Rehberleri Arşivi">

    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${escapeHtml(pageTitle)}">
    <meta name="twitter:description" content="${escapeHtml(metaDesc)}">
    <meta name="twitter:image" content="${BASE_URL}/share-image.png">

    <link rel="icon" type="image/png" href="../icon.png">
    <link rel="apple-touch-icon" href="../icon.png">
    <link rel="manifest" href="../manifest.json">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link rel="preconnect" href="https://cdnjs.cloudflare.com" crossorigin>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="../style.css">

    <script type="application/ld+json">
${jsonLd}
    </script>
</head>
<body>
${buildThemeScript()}

    <header class="app-header">
        <a href="../" class="header-left" aria-label="Pardus Asistan Ana Sayfa">
            <img src="../header-logo.png" alt="Pardus Asistan" width="107" height="45" class="new-header-logo">
        </a>
        <nav class="pc-nav" aria-label="Ana Menü">
            <a href="../" class="pc-nav-link"><i class="fas fa-home" aria-hidden="true"></i> Ana Sayfa</a>
            <a href="./" class="pc-nav-link active"><i class="fas fa-book-open" aria-hidden="true"></i> Tüm Rehberler</a>
        </nav>
        <div class="header-right-wrapper">
            <button type="button" class="theme-mini-btn" aria-label="Gece modunu değiştir" onclick="toggleStaticTheme()">
                <i class="fas fa-moon" aria-hidden="true"></i>
            </button>
        </div>
    </header>

    <main class="main-container">
        <nav class="breadcrumb" aria-label="İçerik haritası">
            <a href="../">Ana Sayfa</a>
            <span aria-hidden="true">›</span>
            <span>Tüm Rehberler</span>
        </nav>

        <div class="archive-header">
            <h1>Tüm Pardus ETAP &amp; MEB 25 Çözüm Rehberleri</h1>
            <p>Öğretmenlerimiz ve bilişim rehber öğretmenleri için kategorilere ayrılmış <strong>${uniqueItems.length}</strong> adım adım çözüm rehberi ve Windows karşılığı.</p>
        </div>

        <nav class="category-scroll archive-jump" aria-label="Kategori Hızlı Geçiş">
${jumpButtons}
        </nav>

${sectionsHtml}
    </main>

    <footer class="seo-footer">
        <p><strong>Pardus Asistan</strong> · MEB &amp; TÜBİTAK Pardus ETAP 23 / MEB 25 Çözüm Rehberi · Geliştirici: <a href="https://hasbierdogmus.com.tr" target="_blank" rel="noopener noreferrer">Hasbi Erdoğmuş</a></p>
        <p><a href="../">Etkileşimli Ana Uygulamaya Dön</a></p>
    </footer>

${buildAnalyticsSnippet()}
</body>
</html>
`;
}

function renderSitemap(uniqueItems, lastMod) {
    const urls = [
        { loc: `${BASE_URL}/`, changefreq: 'weekly', priority: '1.0' },
        { loc: `${BASE_URL}/rehber/`, changefreq: 'weekly', priority: '0.9' },
        ...uniqueItems.map(item => ({
            loc: `${BASE_URL}/rehber/${item.id}/`,
            changefreq: 'monthly',
            priority: '0.8'
        }))
    ];

    const entries = urls.map(u => `  <url>
    <loc>${escapeHtml(u.loc)}</loc>
    <lastmod>${lastMod}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`).join('\n');

    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries}
</urlset>
`;
}

function main() {
    const raw = fs.readFileSync(DATA_PATH, 'utf8').replace(/^\uFEFF/, '');
    const items = JSON.parse(raw);

    const uniqueMap = new Map();
    for (const item of items) {
        if (!item || !item.id) continue;
        if (!/^[a-z0-9-]+$/.test(item.id)) {
            throw new Error(`URL-guvenli olmayan rehber ID tespit edildi: ${item.id}`);
        }
        if (!uniqueMap.has(item.id)) {
            uniqueMap.set(item.id, item);
        }
    }

    const uniqueItems = Array.from(uniqueMap.values());
    const lastMod = getLastMod();

    fs.rmSync(REHBER_DIR, { recursive: true, force: true });
    fs.mkdirSync(REHBER_DIR, { recursive: true });

    for (const item of uniqueItems) {
        const related = uniqueItems
            .filter(other => other.id !== item.id && other.category === item.category)
            .slice(0, 6);
        const guideDir = path.join(REHBER_DIR, item.id);
        fs.mkdirSync(guideDir, { recursive: true });
        fs.writeFileSync(path.join(guideDir, 'index.html'), renderGuidePage(item, related, lastMod), 'utf8');
    }

    fs.writeFileSync(path.join(REHBER_DIR, 'index.html'), renderArchivePage(uniqueItems, lastMod), 'utf8');
    fs.writeFileSync(SITEMAP_PATH, renderSitemap(uniqueItems, lastMod), 'utf8');

    console.log(`SEO uretimi tamamlandi: ${uniqueItems.length} rehber sayfasi + arsiv + sitemap.xml (lastmod: ${lastMod})`);
}

main();

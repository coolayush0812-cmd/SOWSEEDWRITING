const BOOKS = [
  {
    category: "Stories",
    title: "The Lantern at Low Tide",
    icon: "🏮",
    cover: "assets/books/the-lantern-at-low-tide.jpg",
    description: "A keeper of an old harbor light learns what it means to guide someone home.",
    rating: 4.8,
    readers: 1120,
    story: "Every evening, Mira lit the harbor lantern for ships she could not see. One stormy night, a single bell answered from the fog. She held the flame steady until a small boat appeared—and her long-lost brother stepped onto the shore."
  },
  {
    category: "Stories",
    title: "Paper Boats in June",
    icon: "⛵",
    cover: "assets/books/paper-boats-in-june.jpg",
    description: "Two childhood friends send promises downstream and meet them again years later.",
    rating: 4.6,
    readers: 784,
    story: "Noah and Lina wrote their bravest wishes on paper boats. Twenty summers later, Lina found one caught beneath the old bridge: “Come back when you are ready.” She looked up. Noah was waiting on the opposite bank, holding the other boat."
  },
  {
    category: "Stories",
    title: "The Last Blue Bicycle",
    icon: "🚲",
    cover: "assets/books/the-last-blue-bicycle.jpg",
    description: "A forgotten bicycle carries three generations through one changing neighborhood.",
    rating: 4.7,
    readers: 953,
    story: "The blue bicycle first carried Ada to school, then her son to his first job. When the neighborhood changed, her granddaughter restored its silver bell. Its first bright ring brought every old story rushing back down the familiar street."
  },
  {
    category: "Stories",
    title: "A Map of Small Kindnesses",
    icon: "🗺️",
    cover: "assets/books/a-map-of-small-kindnesses.jpg",
    description: "A traveler marks every unexpected kindness until the map leads her home.",
    rating: 4.9,
    readers: 1187,
    story: "Inez drew a gold star wherever a stranger helped her: a shared umbrella, a warm meal, a patient direction. When her journey ended, the stars formed a path back to her own door, where she finally understood how kindness had carried her."
  },
  {
    category: "Stories",
    title: "The Window Garden",
    icon: "🌿",
    cover: "assets/books/the-window-garden.jpg",
    description: "A tiny city garden quietly reconnects neighbors who had stopped speaking.",
    rating: 4.5,
    readers: 648,
    story: "Leela planted basil in one cracked cup. A neighbor added mint, another thyme, and soon the sill became a garden. People paused to water it, then stayed to talk. By spring, the building had learned one another’s names."
  },
  {
    category: "Stories",
    title: "When the Clockmaker Smiled",
    icon: "🕰️",
    cover: "assets/books/when-the-clockmaker-smiled.jpg",
    description: "A precise old clockmaker discovers one moment that cannot be measured.",
    rating: 4.3,
    readers: 421,
    story: "Mr. Vale repaired every clock except the silent one above his workbench. On his birthday, his granddaughter filled the shop with laughter. The clock suddenly chimed, though its hands never moved. Some moments, he realized, were meant to remain timeless."
  },
  {
    category: "Stories",
    title: "The Orchard After Rain",
    icon: "🍎",
    cover: "assets/books/the-orchard-after-rain.jpg",
    description: "A family returns to a storm-damaged orchard and finds a new beginning.",
    rating: 4.4,
    readers: 536,
    story: "The storm left branches scattered across the orchard, but one young tree still stood. The family worked until dusk, saving every root they could. The next morning, sunlight caught a single red apple—and nobody spoke of leaving again."
  },
  {
    category: "Writings & Documentaries",
    title: "Hands That Built the Morning",
    icon: "👐",
    cover: "assets/books/hands-that-built-the-morning.jpg",
    description: "Portraits of early-shift workers whose quiet labor wakes a city.",
    rating: 4.8,
    readers: 1044,
    story: "Before sunrise, bakers knead dough, nurses change shifts, and drivers trace empty avenues. The city believes morning simply arrives. This documentary remembers the hands that prepare it—one loaf, one patient, and one safe journey at a time."
  },
  {
    category: "Writings & Documentaries",
    title: "Letters from the Monsoon",
    icon: "🌧️",
    cover: "assets/books/letters-from-the-monsoon.jpg",
    description: "A lyrical record of families, streets, and rituals shaped by seasonal rain.",
    rating: 4.7,
    readers: 896,
    story: "Rain changes the grammar of a city. Doors become meeting places, tea becomes an invitation, and every roof finds its own rhythm. Across seven monsoons, these letters preserve the voices that rise whenever the clouds return."
  },
  {
    category: "Writings & Documentaries",
    title: "The Memory of Rivers",
    icon: "🏞️",
    cover: "assets/books/the-memory-of-rivers.jpg",
    description: "Communities along one river tell how water shapes work, identity, and belonging.",
    rating: 4.9,
    readers: 1200,
    story: "At its source, the river is a whisper. Downstream it becomes a livelihood, a boundary, a prayer, and a childhood memory. Eleven communities tell its story, reminding us that a river carries more than water to the sea."
  },
  {
    category: "Writings & Documentaries",
    title: "Notes from a Quiet Classroom",
    icon: "🏫",
    cover: "assets/books/notes-from-a-quiet-classroom.jpg",
    description: "An intimate essay about teachers who transform lives without applause.",
    rating: 4.6,
    readers: 732,
    story: "The greatest lessons were rarely written on the board. They arrived as extra patience, a book quietly lent, or a question asked at the right time. Years later, former students still carried those invisible lessons into the world."
  },
  {
    category: "Writings & Documentaries",
    title: "Thirty Steps to the Sea",
    icon: "🌊",
    cover: "assets/books/thirty-steps-to-the-sea.jpg",
    description: "A coastal community records the changing distance between home and water.",
    rating: 4.5,
    readers: 667,
    story: "Grandmother remembered when the sea was thirty steps from the gate. Now it was twelve. Each family measured the distance differently—in lost trees, moved walls, and packed suitcases—while working together to protect what remained."
  },
  {
    category: "Writings & Documentaries",
    title: "The Language of Clay",
    icon: "🏺",
    cover: "assets/books/the-language-of-clay.jpg",
    description: "Four potters reveal how tradition survives through touch and repetition.",
    rating: 4.4,
    readers: 512,
    story: "Clay remembers pressure. Under four pairs of hands it became a cup, a lamp, a ceremonial bowl, and a child’s first uneven pot. The shapes differed, but each carried the same lesson: tradition survives by being remade."
  },
  {
    category: "Writings & Documentaries",
    title: "Midnight Radio Diaries",
    icon: "📻",
    cover: "assets/books/midnight-radio-diaries.jpg",
    description: "Stories from callers who found companionship across late-night airwaves.",
    rating: 4.8,
    readers: 1086,
    story: "After midnight, strangers called to dedicate songs, confess worries, and send greetings across sleeping towns. The host rarely gave advice. He simply listened, proving that sometimes a distant voice is enough to make the dark feel less lonely."
  },
  {
    category: "Writings & Documentaries",
    title: "Seeds Beneath Concrete",
    icon: "🌱",
    cover: "assets/books/seeds-beneath-concrete.jpg",
    description: "A hopeful documentary about community gardens reclaiming overlooked spaces.",
    rating: 4.7,
    readers: 941,
    story: "The first seed was planted through a crack in an abandoned lot. Within a year, tomatoes climbed old fencing and children learned the names of herbs. The neighborhood did not erase its concrete; it taught life to grow through it."
  },
  {
    category: "Writings & Documentaries",
    title: "Portraits of the Night Train",
    icon: "🚆",
    cover: "assets/books/portraits-of-the-night-train.jpg",
    description: "Twenty-one passengers share what they are leaving and what they hope to find.",
    rating: 4.2,
    readers: 300,
    story: "In every compartment, someone was between one life and another. A student guarded an acceptance letter; a father carried a tiny red sweater. By dawn, the passengers separated, each taking a fragment of the others’ courage."
  },
  {
    category: "Writings & Documentaries",
    title: "A Kitchen Full of History",
    icon: "🥣",
    cover: "assets/books/a-kitchen-full-of-history.jpg",
    description: "Recipes and recollections preserve the journeys of five families.",
    rating: 4.6,
    readers: 825,
    story: "Measurements changed across generations: a handful, a pinch, enough until it smells right. The recipes were never only instructions. They were maps of migration, resilience, and celebration, served warm at tables far from where they began."
  },
  {
    category: "Faith-Based Stories",
    title: "A Prayer Between Seasons",
    icon: "🙏",
    cover: "assets/books/a-prayer-between-seasons.jpg",
    description: "A gentle story of trusting the quiet space between loss and renewal.",
    rating: 4.9,
    readers: 1174,
    story: "Elena prayed for an answer, but winter remained silent. She kept tending the bare garden anyway. When the first green shoot appeared, she understood: the answer had not been a sudden sign, but the strength to keep showing up."
  },
  {
    category: "Faith-Based Stories",
    title: "The Chapel of Open Doors",
    icon: "🕊️",
    cover: "assets/books/the-chapel-of-open-doors.jpg",
    description: "A small chapel becomes a refuge through one caretaker’s steady welcome.",
    rating: 4.8,
    readers: 1032,
    story: "Jonas never asked visitors why they came. He lit a candle, opened the door, and made tea. Over time, people arrived carrying grief and left carrying one another’s names. The chapel’s truest sermon was its welcome."
  },
  {
    category: "Faith-Based Stories",
    title: "Grace in the Waiting Room",
    icon: "✨",
    cover: "assets/books/grace-in-the-waiting-room.jpg",
    description: "Strangers discover comfort and courage during an uncertain night.",
    rating: 4.7,
    readers: 906,
    story: "Nobody in the waiting room knew what morning would bring. Still, they shared chargers, coffee, and quiet prayers. When good news finally came for one family, everyone stood to celebrate. Hope had made neighbors of them."
  },
  {
    category: "Faith-Based Stories",
    title: "The Mustard Seed Promise",
    icon: "🌾",
    cover: "assets/books/the-mustard-seed-promise.jpg",
    description: "One small act of faith changes the course of an entire family.",
    rating: 4.6,
    readers: 758,
    story: "Ruth kept a mustard seed in her pocket through every difficult appointment. Years later, she planted it beside the family’s new home. Its yellow flowers were tiny, but they reminded everyone that the smallest faith can shelter a future."
  }
];

const BOOK_PRICES = {
  "A Kitchen Full of History": 0,
  "Hands That Built the Morning": 11,
  "Letters from the Monsoon": 22,
  "Midnight Radio Diaries": 33,
  "Notes from a Quiet Classroom": 44,
  "Portraits of the Night Train": 55,
  "Seeds Beneath Concrete": 66,
  "The Language of Clay": 77,
  "The Memory of Rivers": 88,
  "Thirty Steps to the Sea": 99,
  "A Map of Small Kindnesses": 0,
  "Paper Boats in June": 99,
  "The Lantern at Low Tide": 110,
  "The Last Blue Bicycle": 121,
  "The Orchard After Rain": 132,
  "The Window Garden": 143,
  "When the Clockmaker Smiled": 154,
  "A Prayer Between Seasons": 0,
  "Grace in the Waiting Room": 165,
  "The Chapel of Open Doors": 176,
  "The Mustard Seed Promise": 187
};

const BOOK_SERIES = [
  { key: "ordinary", category: "Writings & Documentaries", title: "The Stories We Leave Behind", subtitle: "An Anthology of Ordinary Lives" },
  { key: "quiet", category: "Stories", title: "Of Little Things & Passing Days", subtitle: "The Quiet Stories Collection" },
  { key: "faith", category: "Faith-Based Stories", title: "Whispers of Grace", subtitle: "The Faith & Promise Collection" }
];

const BRITISH_FIRST_NAMES = [
  "Amelia", "Oliver", "Isla", "George", "Florence", "Arthur", "Poppy", "Harry", "Imogen", "Jack",
  "Beatrice", "Alfie", "Matilda", "Freddie", "Evie", "Henry", "Harriet", "Theo", "Alice", "Edward",
  "Rosie", "William", "Sophie", "Thomas", "Charlotte", "Oscar", "Elsie", "James", "Lucy", "Archie", "Eleanor"
];

const BRITISH_LAST_NAMES = [
  "Thompson", "Davies", "Clarke", "Bennett", "Hughes", "Fletcher", "Harrison", "Whitaker", "Collins", "Parker",
  "Reynolds", "Sutton", "Spencer", "Ellis", "Barker", "Chapman", "Turner", "Wallace", "Foster", "Mitchell",
  "Cooper", "Morgan", "Bailey", "Richardson", "Wood", "Dawson", "Booth", "Palmer", "Holmes", "Webb", "Carter"
];

const AMERICAN_FIRST_NAMES = [
  "Ava", "Liam", "Harper", "Mason", "Madison", "Ethan", "Brooklyn", "Noah", "Riley", "Jackson",
  "Abigail", "Logan", "Savannah", "Caleb", "Kennedy", "Wyatt", "Avery", "Owen", "Natalie", "Grayson",
  "Zoe", "Carter", "Addison", "Luke", "Hailey", "Hudson", "Piper", "Lincoln", "Sadie", "Miles", "Audrey"
];

const AMERICAN_LAST_NAMES = [
  "Anderson", "Miller", "Johnson", "Williams", "Brown", "Wilson", "Moore", "Taylor", "Martin", "Jackson",
  "White", "Harris", "Robinson", "Clark", "Lewis", "Walker", "Hall", "Allen", "Young", "Hernandez",
  "King", "Wright", "Scott", "Green", "Adams", "Baker", "Nelson", "Hill", "Campbell", "Rivera", "Brooks"
];

const REVIEW_OPENINGS = [
  "The story captured our family memory with warmth and an honest, natural voice.",
  "I was surprised by how personal and carefully observed the final writing felt.",
  "Every detail I shared found a meaningful place without making the piece feel crowded.",
  "The words were gentle, vivid, and much closer to my own feelings than I expected.",
  "This turned a difficult memory into something thoughtful that I can keep and revisit.",
  "The finished piece sounded sincere and specific rather than like a standard template.",
  "I loved the quiet details and the way the ending brought the whole story together.",
  "The writing gave shape to something I had struggled to express for a long time.",
  "It arrived with exactly the reflective tone I requested and felt beautifully balanced.",
  "The story was clear, moving, and full of small touches that made it unmistakably ours.",
  "I appreciated how respectfully the writer handled every name, memory, and emotion.",
  "The final story held onto the heart of my request while adding details I had not considered.",
  "From the opening line onward, the writing felt attentive, warm, and thoughtfully composed.",
  "What began as a few notes became a complete piece with a strong sense of place and feeling.",
  "The language was simple in the best way, allowing the important moments to stand out clearly."
];

const REVIEW_ENDINGS = [
  "I read it twice that evening and sent a copy to my sister.",
  "It now sits inside the journal I return to every Sunday morning.",
  "The recipient recognised the moment immediately and was genuinely touched.",
  "I only needed one tiny correction, and the final result felt complete.",
  "It made a thoughtful birthday gift and started a lovely family conversation.",
  "The prayerful tone was comforting without ever becoming too formal.",
  "I printed it for our mantel and still notice a new line each time I read it.",
  "The pacing was calm, the imagery was lovely, and the message stayed clear.",
  "It felt like a small keepsake made with patience rather than a rushed order.",
  "The piece brought both tears and smiles, which was exactly what I had hoped for.",
  "I would happily request another story for a future family occasion.",
  "The result felt intimate, polished, and easy to share with the people I love.",
  "It has become a meaningful reminder of why that moment mattered so much to us."
];

const REVIEW_TYPES = [
  "Personal story", "Faith-based writing", "Motivational piece", "Family keepsake",
  "Birthday story", "Prayer writing", "Anniversary gift", "Memory tribute"
];

const REVIEW_RATINGS = [
  ...Array(1).fill(3.8),
  ...Array(1).fill(3.9),
  ...Array(1).fill(4.0),
  ...Array(1).fill(4.1),
  ...Array(1).fill(4.2),
  ...Array(2).fill(4.3),
  ...Array(3).fill(4.4),
  ...Array(4).fill(4.5),
  ...Array(8).fill(4.6),
  ...Array(12).fill(4.7),
  ...Array(11).fill(4.8),
  ...Array(78).fill(4.9)
];

function reviewerName(index, firstNames, lastNames) {
  const nameIndex = index % firstNames.length;
  const cycle = Math.floor(index / firstNames.length);
  const lastNameIndex = (nameIndex + cycle * 11) % lastNames.length;
  return `${firstNames[nameIndex]} ${lastNames[lastNameIndex]}`;
}

function reviewText(index) {
  const opening = REVIEW_OPENINGS[index % REVIEW_OPENINGS.length];
  const ending = REVIEW_ENDINGS[Math.floor(index / REVIEW_OPENINGS.length)];
  return `${opening} ${ending}`;
}

const WESTERN_REVIEWS = Array.from({ length: 123 }, (_, index) => {
  const british = index % 2 === 0;
  const regionalIndex = Math.floor(index / 2);
  const name = british
    ? reviewerName(regionalIndex, BRITISH_FIRST_NAMES, BRITISH_LAST_NAMES)
    : reviewerName(regionalIndex, AMERICAN_FIRST_NAMES, AMERICAN_LAST_NAMES);

  return {
    name,
    country: british ? "United Kingdom" : "United States",
    type: REVIEW_TYPES[index % REVIEW_TYPES.length],
    rating: REVIEW_RATINGS[(index * 37) % REVIEW_RATINGS.length],
    text: reviewText(index)
  };
});

const CHINESE_REVIEWER_NAMES = [
  "Wei Chen", "Li Wang", "Mei Zhang", "Jun Liu", "Xinyi Yang", "Hao Huang", "Yuchen Zhao",
  "Lin Wu", "Ming Zhou", "Jia Xu", "Rui Sun", "Fang Ma", "Qiang Zhu", "Yue Hu",
  "Zihan Guo", "An He", "Tao Gao", "Jing Lin", "Bo Luo", "Lili Zheng", "Kai Liang"
];

const JAPANESE_REVIEWER_NAMES = [
  "Haruto Sato", "Yui Suzuki", "Ren Takahashi", "Aoi Tanaka", "Sota Watanabe", "Hana Ito",
  "Kaito Yamamoto", "Mei Nakamura", "Yuto Kobayashi", "Rin Kato", "Daiki Yoshida", "Sakura Yamada",
  "Takumi Sasaki", "Hina Yamaguchi", "Riku Matsumoto", "Akari Inoue", "Shota Kimura", "Nanami Hayashi",
  "Kenta Shimizu", "Mio Yamazaki", "Ryota Mori", "Ayaka Abe", "Kazuki Ikeda", "Nao Hashimoto",
  "Kota Ishikawa", "Emi Nakajima", "Tsubasa Maeda", "Rina Fujita", "Hayato Ogawa", "Misaki Goto",
  "Sho Okada", "Kaori Hasegawa", "Naoki Murakami", "Yuna Kondo", "Kenji Ishii", "Chihiro Saito",
  "Masato Sakamoto", "Riko Endo", "Hiroki Aoki", "Nozomi Fujii", "Yuki Nishimura"
];

const EAST_ASIAN_REVIEW_RATINGS = [
  ...Array(1).fill(3.8),
  ...Array(1).fill(3.9),
  ...Array(1).fill(4.0),
  ...Array(1).fill(4.1),
  ...Array(2).fill(4.2),
  ...Array(2).fill(4.3),
  ...Array(3).fill(4.4),
  ...Array(4).fill(4.5),
  ...Array(5).fill(4.6),
  ...Array(7).fill(4.7),
  ...Array(9).fill(4.8),
  ...Array(12).fill(4.9),
  ...Array(14).fill(5.0)
];

const EAST_ASIAN_REVIEWER_NAMES = [
  ...CHINESE_REVIEWER_NAMES.map((name) => ({ name, country: "China" })),
  ...JAPANESE_REVIEWER_NAMES.map((name) => ({ name, country: "Japan" }))
];

const EAST_ASIAN_REVIEWS = EAST_ASIAN_REVIEWER_NAMES.map((reviewer, index) => {
  const globalIndex = WESTERN_REVIEWS.length + index;
  return {
    ...reviewer,
    type: REVIEW_TYPES[globalIndex % REVIEW_TYPES.length],
    rating: EAST_ASIAN_REVIEW_RATINGS[(index * 17) % EAST_ASIAN_REVIEW_RATINGS.length],
    text: reviewText(globalIndex)
  };
});

const REVIEWS = [...WESTERN_REVIEWS, ...EAST_ASIAN_REVIEWS];

const supabaseConfig = window.SEED_GARDEN_SUPABASE;

const state = {
  reviewsShown: 12,
  orders: [],
  paypalSdkPromise: null,
  personalButtonsRendered: false,
  bookButtonsRendered: false,
  checkoutDrafts: {},
  checkoutOrderIds: {},
  checkoutVersions: { personal: 0, book: 0 },
  checkoutPreparing: {},
  paypalRenderPromises: {}
};

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function renderReviews() {
  const list = document.querySelector("#review-list");
  const overallRating = REVIEWS.reduce((total, review) => total + review.rating, 0) / REVIEWS.length;
  const average = overallRating.toFixed(2);
  const summary = document.querySelector(".rating-summary");

  document.querySelector("#review-average").textContent = average;
  document.querySelector("#review-count").textContent = `Based on ${REVIEWS.length} unique reader reviews`;
  summary.setAttribute("aria-label", `Average rating ${average} out of 5`);
  const visibleReviews = REVIEWS.slice(0, state.reviewsShown);
  list.innerHTML = visibleReviews.map((review, index) => {
    const initials = review.name.split(" ").map((part) => part[0]).join("");
    return `
      <article class="review-card${index === 0 ? " active-review" : ""}">
        <div class="review-head">
          <div class="avatar" aria-hidden="true">${escapeHtml(initials)}</div>
          <div>
            <strong>${escapeHtml(review.name)}</strong>
            <span>${escapeHtml(review.type)} • ${escapeHtml(review.country)}</span>
          </div>
          <span class="mini-stars" aria-label="${review.rating.toFixed(1)} out of 5 stars">★ ${review.rating.toFixed(1)}</span>
        </div>
        <p>“${escapeHtml(review.text)}”</p>
      </article>`;
  }).join("");

  const loadMore = document.querySelector("#review-load-more");
  const remaining = REVIEWS.length - visibleReviews.length;
  loadMore.hidden = remaining <= 0;
  loadMore.textContent = remaining > 0 ? `Show more reviews (${remaining} remaining)` : "All reviews shown";
}

function configureMobileNavigation() {
  const workspace = document.querySelector(".workspace");
  const buttons = [...document.querySelectorAll(".mobile-section-button")];
  const panels = buttons.map((button) => document.querySelector(`#${button.dataset.panel}`));
  let scrollFrame = null;

  function setActivePanel(panelId) {
    buttons.forEach((button) => {
      const active = button.dataset.panel === panelId;
      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", String(active));
    });
  }

  function syncActivePanel() {
    scrollFrame = null;
    if (window.innerWidth > 900) return;
    const workspaceCenter = workspace.getBoundingClientRect().left + (workspace.clientWidth / 2);
    const closest = panels.reduce((best, panel) => {
      const rect = panel.getBoundingClientRect();
      const distance = Math.abs((rect.left + rect.width / 2) - workspaceCenter);
      return !best || distance < best.distance ? { panel, distance } : best;
    }, null);
    if (closest) setActivePanel(closest.panel.id);
  }

  buttons.forEach((button) => {
    button.addEventListener("click", () => {
      const panel = document.querySelector(`#${button.dataset.panel}`);
      setActivePanel(panel.id);
      workspace.scrollTo({ left: panel.offsetLeft - workspace.offsetLeft, behavior: "smooth" });
      panel.focus({ preventScroll: true });
    });
  });

  panels.forEach((panel) => panel.setAttribute("tabindex", "-1"));
  workspace.addEventListener("scroll", () => {
    if (!scrollFrame) scrollFrame = requestAnimationFrame(syncActivePanel);
  }, { passive: true });
  window.addEventListener("resize", syncActivePanel, { passive: true });
}

function renderLibrary() {
  const catalog = document.querySelector("#library-catalog");
  catalog.innerHTML = BOOK_SERIES.map((series) => {
    const books = booksInSeries(series);
    const cards = books.map((book, index) => {
      const tone = index % 7;
      const price = BOOK_PRICES[book.title];
      const frontCover = book.cover
        ? `<span class="book-face book-cover image-cover"><img src="${escapeHtml(book.cover)}" alt="" loading="lazy" decoding="async" /></span>`
        : `<span class="book-face book-cover tone-${tone}">
            <span class="book-mark" aria-hidden="true">${book.icon}</span>
            <h4>${escapeHtml(book.title)}</h4>
            <small>${escapeHtml(book.category)}</small>
          </span>`;
      return `
        <article class="book-item">
          <button class="flip-book" type="button" aria-pressed="false" aria-label="Flip ${escapeHtml(book.title)} to read the story">
            <span class="book-card-inner">
              ${frontCover}
              <span class="book-face book-back-cover">
                <h4>${escapeHtml(book.title)}</h4>
                <p>${escapeHtml(book.story)}</p>
                <small>Tap to return to the cover</small>
              </span>
            </span>
          </button>
          <div class="book-meta">
            <h4>${escapeHtml(book.title)}</h4>
            <span class="book-price">${price === 0 ? "Free" : `$${price}`}</span>
            <p>${escapeHtml(book.description)}</p>
            <div class="book-rating">
              <strong>★ ${book.rating.toFixed(1)}</strong>
              <span>${book.readers.toLocaleString()} readers</span>
            </div>
          </div>
        </article>`;
    }).join("");

    return `
      <section class="library-group series-${series.key}" aria-labelledby="series-${series.key}-title">
        <div class="library-group-title">
          <h3 id="series-${series.key}-title">${escapeHtml(series.title)}</h3>
          <p>${escapeHtml(series.subtitle)}</p>
        </div>
        <div class="book-list">${cards}</div>
      </section>`;
  }).join("");

  catalog.addEventListener("click", (event) => {
    const book = event.target.closest(".flip-book");
    if (!book) return;
    const flipped = book.classList.toggle("is-flipped");
    const title = book.closest(".book-item")?.querySelector(".book-meta h4")?.textContent || "book";
    book.setAttribute("aria-pressed", String(flipped));
    book.setAttribute("aria-label", flipped ? "Return to the book cover" : `Flip ${title} to read the story`);
  });
}

function booksInSeries(series) {
  return BOOKS.filter((book) => book.category === series.category)
    .sort((a, b) => BOOK_PRICES[a.title] - BOOK_PRICES[b.title] || a.title.localeCompare(b.title));
}

function clearError(field) {
  const error = document.querySelector(`[data-error-for="${field}"]`);
  if (error) error.textContent = "";
}

function showError(field, message) {
  const error = document.querySelector(`[data-error-for="${field}"]`);
  if (error) error.textContent = message;
}

function showOrderMode(bookTitle = "") {
  resetPaymentOptions("personal");
  resetPaymentOptions("book");
  const isBook = Boolean(bookTitle);
  const personalChoice = document.querySelector("#personal-request-choice");
  const form = document.querySelector("#payment-form");
  const bookPurchase = document.querySelector("#book-purchase");
  personalChoice.classList.toggle("active", !isBook);
  personalChoice.setAttribute("aria-pressed", String(!isBook));
  document.querySelector("#book-select").classList.toggle("book-selected", isBook);
  form.hidden = isBook;
  document.querySelector("#checkout-footer").hidden = isBook;
  bookPurchase.hidden = !isBook;
  document.querySelector("#checkout-eyebrow").textContent = isBook ? "From the library" : "Personal request form";
  document.querySelector("#checkout-intro").hidden = isBook;

  if (!isBook) return;
  document.querySelector("#selected-book-name").textContent = bookTitle;
  const book = BOOKS.find((item) => item.title === bookTitle);
  document.querySelector("#selected-book-summary").textContent = book?.story || book?.description || "";
  const buyButton = document.querySelector("#book-buy-button");
  const price = BOOK_PRICES[bookTitle];
  document.querySelector("#selected-book-price").textContent = price === 0 ? "Free" : `$${price} USD`;
  buyButton.hidden = false;
  document.querySelector("#book-buy-label").textContent = price === 0 ? "Get free ebook" : "Order";
}

function priceForPageCount(pageCount) {
  return 11 * (Math.floor((pageCount - 10) / 11) + 1);
}

function updatePageSlider() {
  const slider = document.querySelector("#page-count");
  const pageCount = Number(slider.value);
  document.querySelector("#page-count-value").textContent = `${pageCount} pages`;
  document.querySelector("#page-price").textContent = `$${priceForPageCount(pageCount)}`;
  slider.style.setProperty("--range-progress", `${((pageCount - 10) / 120) * 100}%`);
}

function configureOrderForm() {
  const pageSlider = document.querySelector("#page-count");
  const bookSelect = document.querySelector("#book-select");

  BOOK_SERIES.forEach((series) => {
    const group = document.createElement("optgroup");
    group.label = series.title;
    booksInSeries(series).forEach((book) => group.append(new Option(book.title, book.title)));
    bookSelect.append(group);
  });
  bookSelect.addEventListener("change", () => showOrderMode(bookSelect.value));
  document.querySelector("#book-buy-button").addEventListener("click", () => {
    if (BOOK_PRICES[bookSelect.value] === 0) return submitFreeBookOrder();
    return beginCheckout("book");
  });
  document.querySelector("#personal-request-choice").addEventListener("click", () => {
    bookSelect.value = "";
    showOrderMode();
  });

  pageSlider.addEventListener("input", updatePageSlider);
  updatePageSlider();
  document.querySelector("#payment-form").addEventListener("submit", (event) => {
    event.preventDefault();
    return beginCheckout("personal");
  });
  document.querySelector("#payment-form").addEventListener("input", () => resetPaymentOptions("personal"));
  document.querySelector("#book-purchase").addEventListener("input", () => resetPaymentOptions("book"));
  resetPaymentOptions("personal");
  resetPaymentOptions("book");
}

function resetPaymentOptions(kind) {
  state.checkoutVersions[kind] += 1;
  state.checkoutDrafts[kind] = null;
  const options = document.querySelector(`#${kind}-payment-options`);
  options.hidden = true;
  options.classList.remove("is-loading");
  const button = document.querySelector(kind === "personal" ? "#personal-order-button" : "#book-buy-button");
  button.hidden = false;
  button.disabled = false;
  button.setAttribute("aria-expanded", "false");
  button.removeAttribute("aria-busy");
  document.querySelector(kind === "personal" ? "#personal-order-label" : "#book-buy-label").textContent = kind === "book" && BOOK_PRICES[document.querySelector("#book-select").value] === 0 ? "Get free ebook" : "Order";
  const message = document.querySelector(kind === "personal" ? "#form-message" : "#book-order-message");
  message.className = "form-message";
  message.textContent = "";
}

async function beginCheckout(kind) {
  const version = state.checkoutVersions[kind];
  if (state.checkoutPreparing[kind] === version) return false;
  const draft = kind === "personal" ? personalCheckoutDraft() : bookCheckoutDraft();
  if (!draft || (kind === "book" && BOOK_PRICES[draft.bookTitle] === 0)) return false;
  const button = document.querySelector(kind === "personal" ? "#personal-order-button" : "#book-buy-button");
  const label = document.querySelector(kind === "personal" ? "#personal-order-label" : "#book-buy-label");
  const options = document.querySelector(`#${kind}-payment-options`);
  const message = document.querySelector(kind === "personal" ? "#form-message" : "#book-order-message");
  state.checkoutDrafts[kind] = draft;
  state.checkoutPreparing[kind] = version;
  button.disabled = true;
  button.setAttribute("aria-busy", "true");
  label.textContent = "Loading payment options…";
  message.textContent = "";
  try {
    const paypal = await loadPayPalSdk();
    if (state.checkoutVersions[kind] !== version) return false;
    options.classList.add("is-loading");
    options.hidden = false;
    await renderPayPalButtons(kind, `#${kind}-paypal-container`, paypal);
    if (state.checkoutVersions[kind] !== version) return false;
    options.classList.remove("is-loading");
    button.hidden = true;
    button.setAttribute("aria-expanded", "true");
    return true;
  } catch (error) {
    if (state.checkoutVersions[kind] !== version) return false;
    options.hidden = true;
    options.classList.remove("is-loading");
    console.error("PayPal checkout is unavailable", error);
    showCheckoutMessage(kind, error.message || "Payment options could not load. Please try again.", true);
    return false;
  } finally {
    if (state.checkoutPreparing[kind] === version) delete state.checkoutPreparing[kind];
    if (state.checkoutVersions[kind] === version) {
      button.disabled = false;
      button.removeAttribute("aria-busy");
      label.textContent = "Order";
    }
  }
}

async function checkoutRequest(action, fields = {}) {
  if (!supabaseConfig?.url || !supabaseConfig?.publicKey) throw new Error("The payment service is not configured.");
  const response = await fetch(`${supabaseConfig.url}/functions/v1/paypal-checkout`, {
    method: "POST",
    headers: {
      apikey: supabaseConfig.publicKey,
      authorization: `Bearer ${supabaseConfig.publicKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({ action, ...fields }),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.error || result.message || "PayPal checkout could not complete the request.");
  if (action === "config" && typeof result.clientId !== "string") throw new Error("PayPal checkout is not deployed or configured in Supabase yet.");
  if (action === "create" && !result.free && (typeof result.id !== "string" || typeof result.orderId !== "string")) {
    throw new Error("PayPal did not return a valid checkout order.");
  }
  if (action === "capture" && (result.status !== "COMPLETED" || typeof result.orderId !== "string")) {
    throw new Error("PayPal has not confirmed this payment.");
  }
  return result;
}

async function loadPayPalSdk() {
  if (window.paypal?.Buttons) return window.paypal;
  if (state.paypalSdkPromise) return state.paypalSdkPromise;
  state.paypalSdkPromise = (async () => {
    const config = await checkoutRequest("config");
    const script = document.createElement("script");
    const query = new URLSearchParams({ "client-id": config.clientId, currency: "USD", intent: "capture", components: "buttons" });
    script.src = `https://www.paypal.com/sdk/js?${query}`;
    script.async = true;
    const sdkLoaded = new Promise((resolve, reject) => {
      script.addEventListener("load", resolve, { once: true });
      script.addEventListener("error", () => reject(new Error("Could not load PayPal checkout.")), { once: true });
    });
    document.head.append(script);
    await sdkLoaded;
    if (!window.paypal?.Buttons) throw new Error("PayPal checkout did not initialize.");
    return window.paypal;
  })();
  try {
    return await state.paypalSdkPromise;
  } catch (error) {
    state.paypalSdkPromise = null;
    throw error;
  }
}

function personalCheckoutDraft() {
  ["name", "email", "request", "pages"].forEach(clearError);
  const name = document.querySelector("#name").value.trim();
  const email = document.querySelector("#email").value.trim();
  const request = document.querySelector("#request").value.trim();
  const pageCount = Number(document.querySelector("#page-count").value);
  let valid = true;
  if (!name) { showError("name", "Please enter your name."); valid = false; }
  if (!/^\S+@\S+\.\S+$/.test(email)) { showError("email", "Please enter a valid email address."); valid = false; }
  if (!request) { showError("request", "Please share a few details for your request."); valid = false; }
  if (!Number.isInteger(pageCount) || pageCount < 10 || pageCount > 130) { showError("pages", "Choose a page count from 10 to 130."); valid = false; }
  if (!valid) {
    document.querySelector("#payment-form .error:not(:empty)")?.closest(".field-group, .choice-section")?.querySelector("input, textarea, button")?.focus();
    return null;
  }
  return { type: "personal", name, email, request, pageCount };
}

function bookCheckoutDraft() {
  const title = document.querySelector("#book-select").value;
  const nameField = document.querySelector("#book-customer-name");
  const emailField = document.querySelector("#book-customer-email");
  const name = nameField.value.trim();
  const email = emailField.value.trim();
  const message = document.querySelector("#book-order-message");
  const nameError = document.querySelector("#book-name-error");
  const emailError = document.querySelector("#book-email-error");
  nameError.textContent = "";
  emailError.textContent = "";

  let valid = true;
  if (!title || !(title in BOOK_PRICES)) {
    message.className = "form-message error-state";
    message.textContent = "Choose a book from the library first.";
    return null;
  }
  if (!name) {
    nameError.textContent = "Please enter your name.";
    valid = false;
  }
  if (!/^\S+@\S+\.\S+$/.test(email)) {
    emailError.textContent = "Please enter a valid email address.";
    valid = false;
  }
  if (!valid) return null;
  return { type: "book", bookTitle: title, name, email };
}

function showCheckoutMessage(kind, message, isError = false) {
  const element = document.querySelector(kind === "personal" ? "#form-message" : "#book-order-message");
  element.className = `form-message ${isError ? "error-state" : "success"}`;
  element.textContent = message;
}

async function renderPayPalButtons(kind, container, paypal) {
  if (kind === "personal" ? state.personalButtonsRendered : state.bookButtonsRendered) return;
  if (state.paypalRenderPromises[kind]) return state.paypalRenderPromises[kind];
  const rendering = (async () => {
    const buttonSet = paypal.Buttons({
      style: { layout: "vertical", color: "gold", shape: "rect", label: "paypal" },
      onClick: (data, actions) => {
        const draft = kind === "personal" ? personalCheckoutDraft() : bookCheckoutDraft();
        if (!draft) return actions.reject();
        state.checkoutDrafts[kind] = draft;
        showCheckoutMessage(kind, "Opening secure PayPal checkout…");
        return actions.resolve();
      },
      createOrder: async () => {
        try {
          const draft = state.checkoutDrafts[kind];
          if (!draft) throw new Error("Please enter your order details first.");
          const created = await checkoutRequest("create", draft);
          state.checkoutOrderIds[kind] = created.orderId;
          return created.id;
        } catch (error) {
          showCheckoutMessage(kind, error.message, true);
          throw error;
        }
      },
      onApprove: async (data) => {
        try {
          showCheckoutMessage(kind, "Confirming your payment…");
          const result = await checkoutRequest("capture", { paypalOrderId: data.orderID });
          const draft = state.checkoutDrafts[kind];
          if (kind === "personal") {
            document.querySelector("#payment-form").reset();
            updatePageSlider();
            resetPaymentOptions(kind);
            showCheckoutMessage(kind, `Payment received. Order ${result.orderId} is confirmed; your writing will be emailed within up to 7 days.`);
          } else {
            document.querySelector("#book-customer-name").value = "";
            document.querySelector("#book-customer-email").value = "";
            resetPaymentOptions(kind);
            showCheckoutMessage(kind, `Payment received. Order ${result.orderId} is confirmed for ${draft?.email || "your email address"}.`);
          }
          if (!document.querySelector("#admin-dashboard").hidden) await renderAdmin();
        } catch (error) {
          showCheckoutMessage(kind, `${error.message} If PayPal shows a completed charge, contact us with your payment receipt.`, true);
        }
      },
      onCancel: async (data) => {
        if (data.orderID) checkoutRequest("cancel", { paypalOrderId: data.orderID }).catch((error) => console.error("Unable to mark checkout cancelled", error));
        showCheckoutMessage(kind, "Checkout cancelled. No order was marked paid.");
      },
      onError: (error) => {
        console.error("PayPal checkout error", error);
        showCheckoutMessage(kind, "PayPal checkout could not finish. Please try again.", true);
      },
    });
    await buttonSet.render(container);
    if (kind === "personal") state.personalButtonsRendered = true;
    else state.bookButtonsRendered = true;
  })();
  state.paypalRenderPromises[kind] = rendering;
  try { await rendering; }
  catch (error) { document.querySelector(container).replaceChildren(); throw error; }
  finally { state.paypalRenderPromises[kind] = null; }
}

async function submitFreeBookOrder() {
  const draft = bookCheckoutDraft();
  if (!draft || BOOK_PRICES[draft.bookTitle] !== 0) return;
  const button = document.querySelector("#book-buy-button");
  button.disabled = true;
  showCheckoutMessage("book", "Saving your free book order…");
  try {
    const result = await checkoutRequest("create", draft);
    showCheckoutMessage("book", `Free book order ${result.orderId} is recorded for ${draft.email}.`);
    document.querySelector("#book-customer-name").value = "";
    document.querySelector("#book-customer-email").value = "";
    if (!document.querySelector("#admin-dashboard").hidden) await renderAdmin();
  } catch (error) {
    showCheckoutMessage("book", error.message || "Could not save your free book order.", true);
  } finally {
    button.disabled = false;
  }
}

function mapOrder(row, payment = null) {
  return {
    id: row.id,
    orderId: row.id,
    recordKind: "order",
    createdAt: row.created_at,
    paidAt: row.paid_at || payment?.paidAt || null,
    paymentStatus: row.payment_status || (Number(row.amount) === 0 ? "FREE" : "UNVERIFIED"),
    providerOrderId: row.paypal_order_id || payment?.providerOrderId || null,
    transactionId: payment?.transactionId || null,
    buyerEmail: payment?.buyerEmail || null,
    contactEmail: row.customer_email,
    itemName: row.book_title || "Personalised Digital Writing - Custom Order Made Writing",
    storyType: row.story_type,
    pageLength: row.page_length,
    pageCount: row.page_count == null ? null : Number(row.page_count),
    bookTitle: row.book_title || null,
    name: row.customer_name,
    email: row.customer_email,
    request: row.request,
    amount: Number(row.amount),
    seedCount: row.seed_count == null ? null : Number(row.seed_count),
    status: row.status,
    fulfilledAt: row.fulfilled_at
  };
}

document.addEventListener("DOMContentLoaded", () => {
  renderReviews();
  document.querySelector("#review-load-more").addEventListener("click", () => {
    state.reviewsShown = Math.min(state.reviewsShown + 12, REVIEWS.length);
    renderReviews();
  });
  renderLibrary();
  configureMobileNavigation();
  configureOrderForm();
  configureAdminPortal();
  document.querySelector("#year").textContent = new Date().getFullYear();
});

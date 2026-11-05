import { useEffect, useRef, useState } from "react";
import winchesters from "./assets/home/winchesters.jpg";
import "./App.css";

// Images are loaded from src/assets/<folder>/ using the folder names in this project.
const localAssets = import.meta.glob("./assets/**/*.{jpg,jpeg,png,webp,avif}", {
  eager: true,
  query: "?url",
  import: "default",
});

function findLocalAsset(folder, filename) {
  const clean = (value) => String(value || "").toLowerCase().replace(/\\/g, "/").replace(/[^a-z0-9./_-]/g, "");
  const wantedFolder = clean(folder);
  const wantedFile = clean(filename).split("/").pop();
  const entries = Object.entries(localAssets).map(([path, url]) => [clean(path), url]);
  const inFolder = entries.filter(([path]) => path.includes(`/assets/${wantedFolder}/`));
  const exact = inFolder.find(([path]) => path.split("/").pop() === wantedFile);
  if (exact) return exact[1];
  const allExact = entries.find(([path]) => path.split("/").pop() === wantedFile);
  if (allExact) return allExact[1];
  const wantedStem = wantedFile.replace(/\.[^.]+$/, "").replace(/[-_]/g, " ");
  const tokens = wantedStem.split(/\s+/).filter((token) => token.length > 2);
  const semantic = (inFolder.length ? inFolder : entries).find(([path]) => tokens.some((token) => path.split("/").pop().includes(token)));
  if (semantic) return semantic[1];
  // Known project assets used when a legacy filename/folder is absent.
  const preferredFallbacks = {
    "brothers.jpg": ["./assets/home/brothers.jpg", "./assets/gallery/gallery1.jpg", "./assets/hero.png"],
    "family.jpg": ["./assets/home/family.jpg", "./assets/gallery/gallery2.jpg"],
    "seasons.jpg": ["./assets/seasons/seasons.jpg", "./assets/seasons/season-1.jpg"],
    "baby.jpg": ["./assets/locations/baby.png"],
  };
  for (const candidate of preferredFallbacks[wantedFile] || []) {
    const match = entries.find(([path]) => path.endsWith(clean(candidate)));
    if (match) return match[1];
  }
  // Use a real bundled image as a final fallback; never point to a nonexistent /images folder.
  const fallback = entries.find(([path]) => /\.(jpg|jpeg|png|webp|avif)$/i.test(path));
  return fallback?.[1] || "";
}


// Build a real, Vite-resolved image catalogue from every supplied asset.
// This ensures screenshots' image files are actually used by the page cards,
// rather than referring to filenames that do not exist.
const allBundledImages = Object.entries(localAssets)
  .map(([path, url]) => ({ path: path.replace(/\\/g, "/"), url }))
  .filter(({ path }) => /\.(jpg|jpeg|png|webp|avif)$/i.test(path))
  .sort((a, b) => a.path.localeCompare(b.path));

const ASSET_ROUTE_FOLDERS = {
  home: ["home", "hero"],
  characters: ["characters", "prophets", "the-stongest-beigns"],
  angels: ["angels"],
  museum: ["museum"],
  seasons: ["seasons"],
  timeline: ["seasons", "home"],
  locations: ["locations"],
  "road-map": [],
  bestiary: ["bestiary"],
  threats: ["the-threats"],
  "death-reapers": ["death-death-reapers"],
  command: ["museum"],
  journal: ["museum", "death-death-reapers"],
  gallery: ["gallery", "home", "characters", "seasons", "locations", "bestiary", "the-threats", "the-four-horseman", "death-death-reapers", "the-stongest-beigns", "prophets", "museum"],
};

function getRouteImages(route) {
  // Gallery is the complete archive: show every image bundled in src/assets.
  if (route === "gallery") return allBundledImages;
  const folders = ASSET_ROUTE_FOLDERS[route] || [];
  return allBundledImages.filter(({ path }) => {
    const normalized = path.toLowerCase().replace(/^\.\/assets\//, "");
    return folders.some((folder) => normalized.startsWith(`${folder.toLowerCase()}/`)) ||
      (route === "home" && /^\.\/assets\/hero\.(png|jpe?g|webp|avif)$/i.test(path));
  });
}

function readableAssetName(path) {
  const filename = path.split("/").pop().replace(/\.[^.]+$/, "");
  return filename.replace(/[-_]+/g, " ").replace(/\b[a-z]/g, (letter) => letter.toUpperCase());
}

function getMonsterImage(monster) {
  const key = monster.name.toLowerCase().replace(/\s+/g, "-");
  const imageMap = {
    vampire: ["bestiary", "vampire.jpg"], werewolf: ["bestiary", "werewolf.jpg"],
    ghost: ["bestiary", "ghosts.jpg"], demon: ["bestiary", "demon.jpg"],
    shapeshifter: ["bestiary", "shapeshifter.jpg"], wendigo: ["bestiary", "wendigo.jpg"],
    djinn: ["bestiary", "djinn.jpg"], leviathan: ["bestiary", "leviathans.jpg"],
    levithan: ["bestiary", "leviathans.jpg"], hellhound: ["bestiary", "hellhounds.jpg"],
    spirit: ["bestiary", "spirits.jpg"], abaddon: ["the-threats", "abaddon.jpg"],
    alastair: ["the-threats", "alastair.jpg"], "alpha-vampire": ["the-threats", "alpha-vampire.jpg"],
    asmodeus: ["the-threats", "asmodeus.jpg"], azazel: ["the-threats", "azazel.jpg"],
    cain: ["the-threats", "cain.jpg"], dagon: ["the-threats", "dagon.jpg"],
    "dick-roman": ["the-threats", "dick-roman.jpg"], ramiel: ["the-threats", "ramiel.jpg"],
    death: ["the-four-horseman", "death.jpg"], famine: ["the-four-horseman", "famine.jpg"],
    pestilence: ["the-four-horseman", "pestilence.jpg"], war: ["the-four-horseman", "war.jpg"],
    billie: ["death-death-reapers", "billie-reaper-death.jpg"],
    faith: ["death-death-reapers", "faith-reaper.jpg"], tessa: ["death-death-reapers", "tessa-reaper.jpg"],
  };
  const match = imageMap[key];
  return match ? findLocalAsset(match[0], match[1]) : "";
}

const ROUTE_CONFIG = {
  home: { label: "HOME", sections: ["home", "brothers"] },
  characters: { label: "CHARACTERS", sections: ["characters", "character-detail"] },
  angels: { label: "ANGELS", sections: ["angels", "angel-detail"] },
  museum: { label: "MUSEUM", sections: ["museum", "museum-detail"] },
  seasons: { label: "SEASONS", sections: ["seasons", "season-detail"] },
  timeline: { label: "TIMELINE", sections: ["timeline", "timeline-detail"] },
  locations: { label: "LOCATIONS", sections: ["locations", "location-detail"] },
  "road-map": { label: "ROAD MAP", sections: ["road-map", "location-detail"] },
  bestiary: { label: "BESTIARY", sections: ["bestiary", "bestiary-book"] },
  threats: { label: "SUPERNATURAL THREATS", sections: ["lore", "lore-detail"] },
  "death-reapers": { label: "DEATH & REAPERS", sections: ["death-reapers", "lore-detail"] },
  "strongest-beings": { label: "STRONGEST BEINGS", sections: ["strongest-beings"] },
  command: { label: "COMMAND CENTER", sections: ["command-center", "command-case-detail"] },
  journal: { label: "JOURNAL", sections: ["journal", "case-detail"] },
  gallery: { label: "GALLERY", sections: ["gallery"] },
};

function getCurrentRoute() {
  const part = window.location.pathname.replace(/^\/+|\/+$/g, "").toLowerCase();
  const aliases = { "lore": "threats", "command-center": "command", "the-impala": "locations", "brothers": "home", "baby": "locations", "strongest": "strongest-beings", "reapers": "death-reapers" };
  const key = aliases[part] || part || "home";
  return ROUTE_CONFIG[key] ? key : "home";
}

function App() {
  const [currentRoute, setCurrentRoute] = useState(() => getCurrentRoute());

  // Client-side navigation keeps the audio element mounted while pages change.
  useEffect(() => {
    const syncRoute = () => {
      setCurrentRoute(getCurrentRoute());
      window.scrollTo({ top: 0, behavior: "auto" });
    };
    window.addEventListener("popstate", syncRoute);
    return () => window.removeEventListener("popstate", syncRoute);
  }, []);

  const navigateTo = (route) => {
    const target = route === "home" ? "/" : `/${route}`;
    if (window.location.pathname !== target) window.history.pushState({}, "", target);
    setCurrentRoute(route);
    window.scrollTo({ top: 0, behavior: "auto" });
    setSelectedSeason(null);
    setSelectedLore(null);
    setSelectedCharacter(null);
    setSelectedAngel(null);
    setSelectedMuseumItem(null);
    setSelectedCase(null);
    setSelectedTimeline(null);
    setSelectedLocation(null);
    setSelectedReaper(null);
    setSelectedMonster(null);
  };
  const [entered, setEntered] = useState(() => {
    try { return window.sessionStorage.getItem("spn-entered") === "yes"; }
    catch { return false; }
  });
  const [muted, setMuted] = useState(false);
  const [transitioning, setTransitioning] = useState(false);
  const [sigilOpening, setSigilOpening] = useState(false);

  const [selectedSeason, setSelectedSeason] = useState(null);
  const [selectedLore, setSelectedLore] = useState(null);
  const [selectedGallery, setSelectedGallery] = useState(null);
  const [selectedCharacter, setSelectedCharacter] = useState(null);
  const [selectedAngel, setSelectedAngel] = useState(null);
  const [selectedMuseumItem, setSelectedMuseumItem] = useState(null);
  const [selectedCase, setSelectedCase] = useState(null);
  const [selectedTimeline, setSelectedTimeline] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [selectedReaper, setSelectedReaper] = useState(null);
  const [monsterFilter, setMonsterFilter] = useState("ALL");
  const [monsterSearch, setMonsterSearch] = useState("");
  const [selectedMonster, setSelectedMonster] = useState(null);
  const [selectedStory, setSelectedStory] = useState(null);
  const [selectedStrongestBeing, setSelectedStrongestBeing] = useState(null);
  const [activeCommandCase, setActiveCommandCase] = useState("CASE-001");
  const [hunterTime, setHunterTime] = useState(() => new Date());
  const [journalView, setJournalView] = useState("CASES");
  const [selectedFieldNote, setSelectedFieldNote] = useState(null);

  /* =========================================================
     UPGRADE 10 — CINEMATIC EXPERIENCE MODE
  ========================================================= */
  const [cinemaMode, setCinemaMode] = useState(false);
  const [showAtmosphere, setShowAtmosphere] = useState(true);

  const audioRef = useRef(null);

  const seasons = [
    {
      number: "01",
      title: "THE BEGINNING",
      description:
        "Sam and Dean Winchester reunite when their father disappears while hunting supernatural creatures.",
      story:
        "The brothers begin their journey on the road, following clues left behind by their father and hunting monsters along the way.",
    },
    {
      number: "02",
      title: "THE DEVIL'S GATE",
      description:
        "The Winchester brothers face the growing threat surrounding Azazel and the mysterious Devil's Gate.",
      story:
        "The hunt becomes personal as Sam's abilities develop and the brothers uncover more about their family's connection to the supernatural.",
    },
    {
      number: "03",
      title: "THE DEAL",
      description:
        "Dean faces a terrible deadline while the brothers search for a way to change his fate.",
      story:
        "The Winchesters encounter demons, cursed objects and dangerous deals while trying to save Dean.",
    },
    {
      number: "04",
      title: "THE ANGELS",
      description:
        "Angels enter the Winchester story and reveal that a much larger supernatural conflict is beginning.",
      story:
        "Dean returns from Hell and discovers that Heaven has plans for him and Sam.",
    },
    {
      number: "05",
      title: "THE APOCALYPSE",
      description:
        "The brothers find themselves at the center of a battle involving Heaven, Hell and the fate of humanity.",
      story:
        "Sam and Dean struggle against Lucifer's plans while trying to prevent an apocalypse.",
    },
    {
      number: "06",
      title: "THE SOUL",
      description:
        "The aftermath of the apocalypse changes the brothers and introduces new supernatural threats.",
      story:
        "Sam returns under mysterious circumstances while Dean tries to protect his family and uncover the truth.",
    },
    {
      number: "07",
      title: "THE LEVIATHANS",
      description:
        "An ancient and powerful race escapes from Purgatory and becomes a major threat.",
      story:
        "The Winchesters discover that the Leviathans are unlike anything they have hunted before.",
    },
    {
      number: "08",
      title: "PURGATORY",
      description:
        "The search for a way into Purgatory sends the brothers on another dangerous mission.",
      story:
        "Dean returns from Purgatory with a mysterious companion while Sam tries to rebuild his life.",
    },
    {
      number: "09",
      title: "THE MARK",
      description:
        "The Mark of Cain brings a dangerous new chapter into Dean's life.",
      story:
        "The brothers confront demons, angels and the consequences of the Mark while their relationship is tested.",
    },
    {
      number: "10",
      title: "DARKNESS",
      description:
        "A powerful ancient force is released, changing the balance of the supernatural world.",
      story:
        "The Winchesters face the Darkness while trying to understand its connection to the beginning of creation.",
    },
    {
      number: "11",
      title: "THE DARKNESS",
      description:
        "The brothers face one of their most powerful supernatural enemies yet.",
      story:
        "Dean develops a complicated connection with the Darkness while Sam searches for a way to stop the growing threat.",
    },
    {
      number: "12",
      title: "THE BRITISH MEN OF LETTERS",
      description:
        "A secret organization arrives with its own methods for fighting supernatural threats.",
      story:
        "The Winchesters encounter the British Men of Letters while dealing with demons, monsters and family conflicts.",
    },
    {
      number: "13",
      title: "THE OTHER WORLD",
      description:
        "A new universe introduces alternate versions of familiar characters.",
      story:
        "The brothers explore another world while facing powerful cosmic threats and unexpected alliances.",
    },
    {
      number: "14",
      title: "THE FINAL HUNT",
      description:
        "The stakes rise as the brothers prepare for another battle that could change everything.",
      story:
        "Sam and Dean face increasingly powerful enemies while confronting the consequences of their choices.",
    },
    {
      number: "15",
      title: "CARRY ON",
      description:
        "The final chapter brings the Winchester brothers' long journey to its conclusion.",
      story:
        "After fifteen seasons of hunting, sacrifice and family, Sam and Dean reach the end of the road.",
    },
  ];

  const lore = [
    {
      name: "DEMONS",
      icon: "☠",
      description:
        "Dark supernatural beings that have repeatedly crossed paths with the Winchesters.",
      characteristics:
        "Demons are associated with possession, supernatural deals and powerful abilities.",
      hunting:
        "Hunters traditionally rely on knowledge, protective symbols, specialized weapons and supernatural methods.",
    },
    {
      name: "ANGELS",
      icon: "✦",
      description:
        "Powerful celestial beings connected to Heaven and the larger supernatural order.",
      characteristics:
        "Angels possess extraordinary abilities and can influence events far beyond ordinary hunters.",
      hunting:
        "Dealing with angels requires knowledge of their hierarchy, weaknesses and supernatural rules.",
    },
    {
      name: "GHOSTS",
      icon: "◌",
      description:
        "Spirits of the dead that remain connected to the world of the living.",
      characteristics:
        "Ghosts can be connected to people, places or objects from their former lives.",
      hunting:
        "Hunters investigate the spirit's connection to the physical world and seek ways to break that connection.",
    },
    {
      name: "VAMPIRES",
      icon: "◆",
      description:
        "Predatory supernatural creatures that have appeared throughout the Winchesters' hunts.",
      characteristics:
        "Vampires possess enhanced physical abilities and follow their own supernatural rules.",
      hunting:
        "Hunters need to identify the creature correctly and use methods appropriate to its particular weaknesses.",
    },
    {
      name: "WITCHES",
      icon: "✧",
      description:
        "Humans or supernatural practitioners capable of using powerful forms of magic.",
      characteristics:
        "Their abilities can involve spells, curses, rituals and enchanted objects.",
      hunting:
        "Hunters often investigate the source of the magic and search for ways to counter the spell or curse.",
    },
    {
      name: "MONSTERS",
      icon: "♢",
      description:
        "A broad category covering many supernatural species encountered on the road.",
      characteristics:
        "Every species can have completely different abilities, behavior and weaknesses.",
      hunting:
        "The first rule is simple: identify what you're hunting before deciding how to deal with it.",
    },
  ];

  const angels = [
    { name: "CASTIEL", role: "ANGEL OF THE LORD", description: "An angel who becomes one of the Winchesters’ closest allies, choosing loyalty and compassion while questioning Heaven’s orders." },
    { name: "ZACHARIAH", role: "HEAVENLY COMMANDER", description: "A powerful angel who works to keep the Apocalypse on its intended course and pressures Dean to accept his destined role." },
    { name: "URIEL", role: "ANGEL", description: "A blunt and formidable angel whose loyalty to Heaven’s plans hides a dangerous agenda." },
    { name: "RAPHAEL", role: "ARCHANGEL", description: "One of Heaven’s archangels, determined to bring about the Apocalypse and restore what he believes is the proper order." },
    { name: "BALTHAZAR", role: "ANGEL", description: "A rebellious angel with a taste for human comforts who becomes an unpredictable ally to Castiel." },
    { name: "ANNA", role: "FALLEN ANGEL", description: "A former angel who gives up Heaven’s grace to experience human life and later becomes involved in the fight over the Apocalypse." },
    { name: "JOSHUA", role: "ANGEL", description: "An angel in Heaven who communicates with God and delivers a message that changes the Winchesters’ understanding of the conflict." },
    { name: "NAOMI", role: "ANGELIC LEADER", description: "A high-ranking angel who oversees covert operations in Heaven and attempts to control Castiel’s actions." },
    { name: "GADREEL", role: "ANGEL", description: "An angel burdened by an ancient failure, whose choices become closely tied to Sam and Dean’s trust." },
    { name: "DUMAH", role: "ANGEL", description: "An angel who seeks influence in Heaven during its period of upheaval." },
    { name: "ANAEL", role: "ANGEL", description: "An angel who takes the human identity of Sister Jo and finds her own way to survive on Earth." },
    { name: "SAMANDRIEL", role: "ANGEL", description: "A gentle angel who becomes caught in the struggle between Heaven’s factions." },
  ].map((angel, index) => ({
    ...angel,
    number: String(index + 1).padStart(2, "0"),
    image: findLocalAsset("angels", `${angel.name.toLowerCase() === "anael" ? "anael" : angel.name.toLowerCase()}.jpg`),
  }));

  const museumItems = [
    { name: "THE COLT", file: "the-colt.jpg", category: "LEGENDARY WEAPON", description: "A legendary firearm said to be capable of killing almost any supernatural creature. Its history is closely tied to the hunters who carried it and the rare ammunition made for it." },
    { name: "DEMON KNIFE", file: "demon-knife.jpg", category: "HUNTER WEAPON", description: "A specially forged blade used by hunters to fight demons. Its purpose and unusual construction make it a valued tool in the Winchester arsenal." },
    { name: "ANGEL BLADE", file: "angel-blade.jpg", category: "CELESTIAL WEAPON", description: "A weapon carried by angels and capable of harming celestial beings. Angel blades become an important part of the conflicts between Heaven's forces." },
    { name: "DEVIL'S TRAP", file: "devil's-trap.jpg", category: "CONTAINMENT SYMBOL", description: "A powerful occult symbol used to hold demons in place and prevent them from leaving its boundary while the trap remains intact." },
    { name: "EMF", file: "emf.jpg", category: "HUNTER EQUIPMENT", description: "An electromagnetic field meter used by hunters to detect unusual electromagnetic activity that may point to a supernatural presence." },
    { name: "THE ARCHANGEL BLADE", file: "the-archangel-blade.jpg", category: "ARCHANGEL WEAPON", description: "A rare blade associated with the archangels, carrying power far beyond an ordinary angel blade." },
    { name: "THE FIRST BLADE", file: "the-first-blade.jpg", category: "ANCIENT WEAPON", description: "An ancient weapon whose power is connected to the Mark of Cain. Its full potential is tied to the one who bears the Mark." },
    { name: "ANGEL TABLET", file: "angel-tablet.jpg", category: "HEAVENLY TABLET", description: "An ancient tablet containing celestial knowledge and information connected to the rules and secrets of Heaven." },
    { name: "DEMON TABLET", file: "demon tablet.jpg", category: "DEMONIC TABLET", description: "An ancient tablet containing knowledge about demons and the forces of Hell, sought after for the secrets it preserves." },
    { name: "ANGEL GRACE", file: "angel-grace.jpg", category: "CELESTIAL ESSENCE", description: "The essence that gives an angel their power and identity. Grace is central to an angel's abilities and connection to Heaven." },
    { name: "THE EQUALIZER", file: "the-equalizer.jpg", category: "MYSTERIOUS FIREARM", description: "A mysterious weapon with a supernatural connection between the one who fires it and the one it strikes." },
    { name: "HUNTER'S TRUNK", file: "hunters-trunk.jpg", category: "HUNTER ARCHIVE", description: "A hunter's collection of equipment and supplies, representing the practical tools carried from one investigation to the next." },
  ].map((item, index) => ({ ...item, number: String(index + 1).padStart(2, "0"), image: findLocalAsset("museum", item.file) }));

  const characters = [
    {
      number: "01",
      name: "DEAN WINCHESTER",
      role: "THE ELDER BROTHER",
      image: findLocalAsset("characters", "dean-winchester.jpg"),
      description: "A veteran hunter who lives by the family-first code and keeps moving forward, no matter the cost.",
      personality: "Confident, sarcastic, brave, loyal and protective.",
      legacy: "Dean’s story is defined by sacrifice, brotherhood, music, and the road he shares with Sam.",
    },,
    {
      number: "02",
      name: "SAM WINCHESTER",
      role: "THE YOUNGER BROTHER",
      image: findLocalAsset("characters", "sam-winchester.jpg"),
      description: "A thoughtful hunter whose search for answers shapes the Winchester family’s journey.",
      personality: "Intelligent, compassionate, determined and analytical.",
      legacy: "Sam’s journey explores identity, free will, family and choosing what kind of person to become.",
    },,
    {
      number: "03",
      name: "CASTIEL",
      role: "THE ANGEL",
      image: findLocalAsset("characters", "castiel.jpg"),
      description: "An angel who becomes one of the Winchesters’ closest allies and family.",
      personality: "Serious, curious, loyal and increasingly compassionate.",
      legacy: "Castiel’s journey moves from unquestioning obedience to choosing humanity and family.",
    },,
    {
      number: "04",
      name: "BOBBY SINGER",
      role: "THE HUNTER & MENTOR",
      image: findLocalAsset("characters", "bobby.jpg"),
      description: "An experienced hunter, researcher and trusted father figure to the Winchester brothers.",
      personality: "Practical, blunt, resourceful and deeply caring.",
      legacy: "Bobby proves that family is also built through loyalty and the people who stay.",
    },,
    {
      number: "05",
      name: "CROWLEY",
      role: "THE KING OF HELL",
      image: findLocalAsset("characters", "crowley.jpg"),
      description: "A demon whose bargains and shifting alliances make him a complicated force in the hunt.",
      personality: "Clever, ambitious, theatrical and sarcastic.",
      legacy: "Crowley’s uneasy bond with the Winchesters becomes an unexpected part of their story.",
    },,
    {
      number: "06",
      name: "JACK KLINE",
      role: "THE NEPHILIM",
      image: findLocalAsset("characters", "jack-kline.jpg"),
      description: "A young Nephilim searching for his place in a world shaped by powerful expectations.",
      personality: "Curious, kind, earnest and searching for identity.",
      legacy: "Jack’s journey explores choice, belonging and the meaning of family.",
    },,
    {
      number: "07",
      name: "MARY WINCHESTER",
      role: "THE MOTHER",
      image: findLocalAsset("characters", "mary-winchester.jpg"),
      description: "A hunter whose past and return reshape the Winchester family story.",
      personality: "Independent, skilled, conflicted and courageous.",
      legacy: "Mary’s story connects the family’s origins with the lives her sons build.",
    },,
    {
      number: "08",
      name: "JOHN WINCHESTER",
      role: "THE FATHER",
      image: findLocalAsset("characters", "john-winchester.jpg"),
      description: "The father of Sam and Dean, whose hunt for the supernatural shapes their childhood.",
      personality: "Determined, disciplined, secretive and protective.",
      legacy: "John’s choices set the Winchester story in motion and leave a lasting impact.",
    },,
    {
      number: "09",
      name: "CHARLIE BRADBURY",
      role: "THE HACKER",
      image: findLocalAsset("characters", "charlie-bradbury.jpg"),
      description: "A brilliant hacker and loyal ally who brings courage, wit and technical skill to the team.",
      personality: "Witty, clever, imaginative and brave.",
      legacy: "Charlie becomes a valued member of the extended Winchester family.",
    },,
    {
      number: "10",
      name: "ROWENA MACLEOD",
      role: "THE WITCH",
      image: findLocalAsset("characters", "rowena-mcleod.jpg"),
      description: "A powerful witch whose ambition and complicated loyalties make her a formidable figure.",
      personality: "Ambitious, intelligent, theatrical and resourceful.",
      legacy: "Rowena’s evolution reveals unexpected depth beneath her pursuit of power.",
    },,
    {
      number: "11",
      name: "GARTH FITZGERALD IV",
      role: "THE HUNTER",
      image: findLocalAsset("characters", "garth.jpg"),
      description: "An unconventional hunter whose kindness and humor make him stand out.",
      personality: "Friendly, optimistic, inventive and loyal.",
      legacy: "Garth proves that being a hunter does not mean losing your humanity.",
    },,
    {
      number: "12",
      name: "ELLEN HARVELLE",
      role: "THE ROADHOUSE OWNER",
      image: findLocalAsset("characters", "ellen-harvelle.jpg"),
      description: "A hunter and the owner of the Roadhouse, offering shelter and support to other hunters.",
      personality: "Strong-willed, practical, protective and fearless.",
      legacy: "Ellen’s legacy is rooted in courage, sacrifice and the hunter community.",
    },,
    {
      number: "13",
      name: "JO HARVELLE",
      role: "THE HUNTER",
      image: findLocalAsset("characters", "jo-harvelle.jpg"),
      description: "A determined young hunter who wants to prove herself on the road.",
      personality: "Brave, independent, stubborn and loyal.",
      legacy: "Jo carries forward the Harvelle family’s strength and commitment to the hunt.",
    },,
    {
      number: "14",
      name: "JODY MILLS",
      role: "THE SHERIFF & HUNTER",
      image: findLocalAsset("characters", "jody-mills.jpg"),
      description: "A sheriff who becomes a capable hunter and a protective presence for young survivors.",
      personality: "Steady, compassionate, courageous and practical.",
      legacy: "Jody creates a family and safe place for people who have lost theirs.",
    },,
    {
      number: "15",
      name: "DONNA HANSCUM",
      role: "THE HUNTER",
      image: findLocalAsset("characters", "donna-hanscum.jpg"),
      description: "A determined sheriff who grows into a capable hunter and trusted ally.",
      personality: "Warm, persistent, optimistic and courageous.",
      legacy: "Donna shows that an ordinary life can lead to extraordinary bravery.",
    },,
    {
      number: "16",
      name: "RUFUS TURNER",
      role: "THE HUNTER",
      image: findLocalAsset("characters", "rufus.jpg"),
      description: "A seasoned hunter and longtime ally with a sharp tongue and deep experience.",
      personality: "Cynical, capable, direct and dependable.",
      legacy: "Rufus represents the hard-earned knowledge and bonds of the hunter network.",
    },,
    {
      number: "17",
      name: "BELLA TALBOT",
      role: "THE THIEF",
      image: findLocalAsset("characters", "bella-talbot.jpg"),
      description: "A skilled collector who deals in supernatural objects and rare artifacts.",
      personality: "Sharp, guarded, resourceful and independent.",
      legacy: "Bella’s story reveals the cost of bargains and the secrets people carry.",
    },,
    {
      number: "18",
      name: "EILEEN LEAHY",
      role: "THE HUNTER",
      image: findLocalAsset("characters", "eileen-leahy.jpg"),
      description: "A skilled hunter who builds a strong connection with Sam and the wider hunting world.",
      personality: "Resilient, focused, resourceful and compassionate.",
      legacy: "Eileen’s story is one of survival, independence and finding connection.",
    },,
    {
      number: "19",
      name: "DONATELLO REDFIELD",
      role: "THE PROPHET",
      image: findLocalAsset("prophets", "donatello.jpg"),
      description: "A prophet drawn into the supernatural conflict and the Winchester orbit.",
      personality: "Ordinary, thoughtful and often overwhelmed by extraordinary events.",
      legacy: "Donatello’s role connects the human world to the larger celestial story.",
    },,
    {
      number: "20",
      name: "KEVIN TRAN",
      role: "THE PROPHET",
      image: findLocalAsset("prophets", "kevin-tran.jpg"),
      description: "A gifted prophet who is pulled into the Winchester battle against powerful forces.",
      personality: "Intelligent, determined, anxious and brave.",
      legacy: "Kevin’s courage and sacrifice leave a lasting mark on the brothers.",
    },,
    {
      number: "21",
      name: "METATRON",
      role: "THE SCRIBE OF GOD",
      image: findLocalAsset("prophets", "metatron.jpg"),
      description: "A celestial scribe whose knowledge and ambition influence the fate of Heaven.",
      personality: "Cunning, articulate, ambitious and unpredictable.",
      legacy: "Metatron’s actions alter the balance of power among angels and humans.",
    }
  ];
  const gallery = [
    {
      image: findLocalAsset("gallery", "gallery1.jpg"),
      title: "THE HUNT",
      description: "Knowledge is the first weapon on the road.",
    },
    {
      image: findLocalAsset("gallery", "gallery2.jpg"),
      title: "THE FAMILY",
      description: "Some bonds become stronger than blood.",
    },
    {
      image: findLocalAsset("gallery", "gallery3.jpg"),
      title: "THE ROAD",
      description: "The road always leads somewhere.",
    },
    {
      image: findLocalAsset("gallery", "gallery4.jpg"),
      title: "THE LEGACY",
      description: "Every hunt leaves something behind.",
    },
  ];

  const cases = [
    {
      number: "001",
      location: "LAWRENCE, KANSAS",
      status: "CLOSED",
      threat: "SUPERNATURAL",
      date: "NOVEMBER 02, 1983",
      title: "THE WINCHESTER CASE",
      description:
        "A mysterious event in Lawrence becomes the beginning of the Winchester family's connection to the supernatural.",
      details:
        "Years later, the case would become one of the most important events in the Winchester story. What began as a single unexplained incident ultimately shaped the lives of two brothers and their future on the road.",
      classification: "FAMILY ARCHIVE",
    },
    {
      number: "002",
      location: "JERICHO, CALIFORNIA",
      status: "CLOSED",
      threat: "SPIRIT",
      date: "SEPTEMBER 2005",
      title: "WOMAN IN WHITE",
      description:
        "A series of disappearances leads the Winchesters to a dangerous spirit haunting an isolated road.",
      details:
        "Sam and Dean investigate strange disappearances while following a trail of supernatural evidence. Their investigation becomes one of their earliest hunts together after Sam returns to the road.",
      classification: "CASE ARCHIVE",
    },
    {
      number: "003",
      location: "ST. LOUIS, MISSOURI",
      status: "CLOSED",
      threat: "DEMONIC",
      date: "CASE UNKNOWN",
      title: "THE DEMON TRAIL",
      description:
        "A trail of unexplained incidents points toward a supernatural presence moving between ordinary people.",
      details:
        "The brothers use research, witness accounts and knowledge gathered from previous hunts to identify the threat. The case demonstrates why preparation and investigation are just as important as the hunt itself.",
      classification: "HUNTER RECORD",
    },
    {
      number: "004",
      location: "BLACK ROCK, COLORADO",
      status: "ARCHIVED",
      threat: "CURSED OBJECT",
      date: "CASE UNKNOWN",
      title: "THE CURSED OBJECT",
      description:
        "A seemingly ordinary object becomes connected to a chain of dangerous supernatural events.",
      details:
        "The Winchesters discover that supernatural objects can carry their own history and consequences. Identifying the object is only the beginning; understanding its origin becomes the key to closing the case.",
      classification: "RESTRICTED FILE",
    },
    {
      number: "005",
      location: "PURGATORY",
      status: "CLASSIFIED",
      threat: "UNKNOWN",
      date: "CASE UNKNOWN",
      title: "THE OTHER SIDE",
      description:
        "A hunt takes the Winchester story beyond the ordinary boundaries of the human world.",
      details:
        "The case represents one of the many moments when the brothers' investigations lead them into supernatural territories far beyond anything an ordinary hunter could imagine.",
      classification: "HIGH RISK ARCHIVE",
    },
    {
      number: "006",
      location: "ROAD UNKNOWN",
      status: "OPEN",
      threat: "UNKNOWN",
      date: "ONGOING",
      title: "THE NEXT HUNT",
      description:
        "There is always another road, another case and another person who needs help.",
      details:
        "For a hunter, the work never truly ends. Every unexplained event could be the beginning of another investigation, and every new road could lead somewhere unexpected.",
      classification: "ACTIVE FILE",
    },
  ];

  /* =========================================================
     UPGRADE 8 — TIMELINE DATA
  ========================================================= */

  const timeline = [
    {
      year: "1983",
      label: "THE BEGINNING",
      title: "THE NIGHT EVERYTHING CHANGED",
      description:
        "A tragedy in Lawrence, Kansas changes the Winchester family forever.",
      details:
        "The Winchester story begins with a mysterious supernatural event that sends John Winchester down a path of hunting. Years later, that decision will shape the lives of Sam and Dean.",
      category: "ORIGIN",
    },
    {
      year: "2005",
      label: "THE ROAD",
      title: "THE BROTHERS REUNITE",
      description:
        "Sam and Dean return to the road together and begin hunting again.",
      details:
        "Sam leaves his ordinary life behind after Dean arrives with news that their father has disappeared. The brothers begin searching for him while investigating supernatural cases across the country.",
      category: "THE HUNT",
    },
    {
      year: "2006",
      label: "THE WAR",
      title: "AZAZEL'S SHADOW",
      description:
        "The brothers discover that their family is connected to a much larger supernatural conflict.",
      details:
        "The hunt becomes increasingly personal as Sam's abilities develop and the brothers uncover more about the mysterious demon connected to their family's past.",
      category: "DEMONS",
    },
    {
      year: "2010",
      label: "THE APOCALYPSE",
      title: "HEAVEN & HELL",
      description:
        "The Winchesters become central figures in a battle involving angels, demons and the fate of humanity.",
      details:
        "The supernatural conflict reaches an enormous scale. Sam and Dean are forced to make impossible choices while trying to protect the world and each other.",
      category: "COSMIC WAR",
    },
    {
      year: "2015",
      label: "THE DARKNESS",
      title: "AN ANCIENT POWER RETURNS",
      description:
        "An ancient force threatens the balance of the supernatural world.",
      details:
        "The Winchesters encounter a power older than many of the beings they have fought before. Dean becomes connected to the Darkness while Sam searches for a way forward.",
      category: "THE DARKNESS",
    },
    {
      year: "2020",
      label: "THE END OF THE ROAD",
      title: "CARRY ON",
      description:
        "After fifteen seasons, the Winchester journey reaches its final chapter.",
      details:
        "The brothers' long journey comes to a conclusion after years of hunting, sacrifice, friendship and family. The road that began in Lawrence eventually leads to the end.",
      category: "LEGACY",
    },
  ];

  /* =========================================================
     UPGRADE 11 — BESTIARY + ROAD MAP DATA
  ========================================================= */

  const locations = [
    { name: "LAWRENCE", state: "KANSAS", code: "KS", x: "12%", y: "72%", era: "1983", description: "The Winchester family's story begins here, making Lawrence one of the most important places in the archive.", caseNote: "ORIGIN POINT — WINCHESTER FAMILY", relatedMonster: "DEMON" },
    { name: "JERICHO", state: "CALIFORNIA", code: "CA", x: "28%", y: "43%", era: "2005", description: "One of the earliest stops on the brothers' renewed journey together, where a mysterious case pulls them deeper into the hunt.", caseNote: "EARLY HUNT — FIRST ROAD CASES", relatedMonster: "GHOST" },
    { name: "KANSAS CITY", state: "MISSOURI", code: "MO", x: "45%", y: "57%", era: "2006", description: "A central Midwest waypoint on the long road, surrounded by the kind of cases that keep hunters moving.", caseNote: "MIDWEST ARCHIVE — ACTIVE ROUTE", relatedMonster: "SHAPESHIFTER" },
    { name: "CHICAGO", state: "ILLINOIS", code: "IL", x: "59%", y: "31%", era: "2008", description: "A major city stop where supernatural investigations collide with a much larger world of hidden threats.", caseNote: "URBAN CASES — HIGH ACTIVITY", relatedMonster: "VAMPIRE" },
    { name: "ST. LOUIS", state: "MISSOURI", code: "MO", x: "65%", y: "68%", era: "2012", description: "Another road marker in the brothers' expanding hunting network and a reminder that nowhere stays quiet for long.", caseNote: "ROAD NETWORK — HUNTER TERRITORY", relatedMonster: "RAKSHASA" },
    { name: "PURGATORY", state: "UNKNOWN", code: "∞", x: "87%", y: "45%", era: "2012", description: "A dangerous supernatural realm beyond the ordinary map, tied to one of the brothers' most difficult journeys.", caseNote: "EXTRAORDINARY REALM — RESTRICTED", relatedMonster: "LEVITHAN" },
  ];

  const monsters = [
    { name: "DEMON", category: "DEMONS", threat: "EXTREME", icon: "", weakness: "Case-specific", description: "A hostile supernatural entity whose presence can be hidden behind an ordinary human appearance.", signs: "Unnatural behavior, unexplained events and evidence of possession.", archive: "BESTIARY / DEMON" },
    { name: "DJINN", category: "MONSTERS", threat: "HIGH", icon: "", weakness: "Case-specific", description: "A supernatural creature associated with altered perception and dangerous dreamlike experiences.", signs: "Unexplained comas and recurring visions.", archive: "BESTIARY / DJINN" },
    { name: "GHOST", category: "SPIRITS", threat: "MEDIUM", icon: "", weakness: "Case-specific", description: "A spirit that remains connected to the living world through a place, object or unresolved event.", signs: "Cold spots and repeated disturbances.", archive: "BESTIARY / GHOST" },
    { name: "HELLHOUND", category: "MONSTERS", threat: "EXTREME", icon: "", weakness: "Case-specific", description: "A supernatural hound associated with demonic bargains and invisible pursuit.", signs: "Unexplained disturbances around a marked target.", archive: "BESTIARY / HELLHOUND" },
    { name: "LEVIATHAN", category: "ANCIENTS", threat: "EXTREME", icon: "", weakness: "Case-specific", description: "An ancient species from Purgatory and one of the most dangerous threats faced by the Winchesters.", signs: "Unusual disappearances and coordinated activity.", archive: "BESTIARY / LEVIATHAN" },
    { name: "SHAPESHIFTER", category: "SHIFTERS", threat: "HIGH", icon: "", weakness: "Case-specific", description: "A creature capable of taking another person's appearance, making identity a central part of the case.", signs: "Inconsistent evidence and impossible movements.", archive: "BESTIARY / SHAPESHIFTER" },
    { name: "SPIRIT", category: "SPIRITS", threat: "MEDIUM", icon: "", weakness: "Case-dependent", description: "A lingering supernatural presence tied to a person, place or unresolved event.", signs: "Cold spots and activity centered around a location.", archive: "BESTIARY / SPIRIT" },
    { name: "VAMPIRE", category: "MONSTERS", threat: "HIGH", icon: "", weakness: "Case-specific", description: "Predatory supernatural beings known for enhanced strength, speed and organized hunting patterns.", signs: "Unusual attacks and missing blood.", archive: "BESTIARY / VAMPIRE" },
    { name: "WENDIGO", category: "MONSTERS", threat: "HIGH", icon: "", weakness: "Case-specific", description: "A dangerous forest-dwelling creature associated with isolation and remote locations.", signs: "Missing-person patterns and unusual tracks.", archive: "BESTIARY / WENDIGO" },
    { name: "WEREWOLF", category: "SHIFTERS", threat: "HIGH", icon: "", weakness: "Case-specific", description: "A shapeshifting creature whose human identity can make an investigation difficult.", signs: "Animal-like attacks linked to a human identity.", archive: "BESTIARY / WEREWOLF" },
  ];

  const monsterConnections = {
    VAMPIRE: { cases: ["CASE-014"], locations: ["CHICAGO"], lore: "A classic road-hunt profile: fast, organized and dangerous when underestimated.", hunterNote: "VERIFY THE PATTERN BEFORE YOU CHASE THE TARGET. THE WRONG ASSUMPTION CAN TURN A SIMPLE CASE INTO A LONG NIGHT." },
    WEREWOLF: { cases: [], locations: [], lore: "The investigation often depends on separating the creature from the person who may be connected to it.", hunterNote: "TRACK THE EVIDENCE, NOT THE RUMORS. IDENTIFY THE PATTERN BEFORE DRAWING A CONCLUSION." },
    GHOST: { cases: ["CASE-014"], locations: ["JERICHO"], lore: "Spirit cases are usually tied to a place, object or unresolved event that keeps the past connected to the present.", hunterNote: "FIND THE CONNECTION. THE LOCATION IS OFTEN PART OF THE ANSWER." },
    DEMON: { cases: ["CASE-001"], locations: ["LAWRENCE"], lore: "Demon investigations can begin with subtle signs but may connect to much larger supernatural events.", hunterNote: "IDENTIFICATION MATTERS. KNOW WHAT YOU ARE DEALING WITH BEFORE YOU MOVE." },
    SHAPESHIFTER: { cases: [], locations: ["KANSAS CITY"], lore: "When identity itself becomes part of the threat, every witness statement and physical clue matters.", hunterNote: "TRUST EVIDENCE. A FAMILIAR FACE DOES NOT ALWAYS MEAN A FAMILIAR PERSON." },
    WENDIGO: { cases: [], locations: [], lore: "Remote cases require patience, preparation and careful attention to the environment.", hunterNote: "NEVER LET THE TERRAIN BECOME PART OF THE THREAT." },
    DJINN: { cases: [], locations: [], lore: "Cases involving altered perception can make the investigation difficult because appearances may not tell the whole story.", hunterNote: "WHEN REALITY DOES NOT ADD UP, SLOW DOWN AND CHECK THE EVIDENCE AGAIN." },
    LEVITHAN: { cases: ["CASE-027"], locations: ["PURGATORY"], lore: "An ancient threat connected to Purgatory and a much larger supernatural conflict.", hunterNote: "RESTRICTED FILE. DO NOT TREAT AN ANCIENT THREAT LIKE AN ORDINARY ROAD CASE." },
    RAKSHASA: { cases: [], locations: ["ST. LOUIS"], lore: "Rare predator cases can hide behind ordinary-looking incidents until the pattern becomes impossible to ignore.", hunterNote: "LOOK FOR THE DETAILS THAT REPEAT. THAT IS WHERE THE TRAIL USUALLY STARTS." },
    CROATAN: { cases: [], locations: [], lore: "A demonic threat connected to an early apocalyptic storyline and a wider supernatural operation.", hunterNote: "SOME CASES ARE BIGGER THAN THE PERSON WHO FIRST FINDS THEM." },
  };

  /* =========================================================
     UPGRADE 12 — HUNTER COMMAND CENTER
  ========================================================= */
  const commandCases = [
    { id: "CASE-001", title: "THE LAWRENCE FILE", location: "LAWRENCE, KANSAS", threat: "HIGH", status: "OPEN", lead: "WINCHESTER FAMILY ARCHIVE", monster: "DEMON", note: "Origin records and the earliest Winchester case history." },
    { id: "CASE-014", title: "JERICHO NIGHT FILE", location: "JERICHO, CALIFORNIA", threat: "MEDIUM", status: "INVESTIGATING", lead: "ROAD CASE ARCHIVE", monster: "GHOST", note: "A mysterious roadside investigation from the early hunting years." },
    { id: "CASE-027", title: "PURGATORY ACCESS", location: "BEYOND THE MAP", threat: "CRITICAL", status: "RESTRICTED", lead: "EXTRAORDINARY REALM", monster: "LEVITHAN", note: "Restricted archive concerning a realm outside ordinary geography." },
  ];

  const evidenceFiles = [
    { id: "E-01", type: "CASE", title: "THE LAWRENCE FILE", meta: "CASE-001", description: "The origin record connected to the Winchester family's earliest supernatural history.", action: "CASE" },
    { id: "E-02", type: "CREATURE", title: "DEMON", meta: "BESTIARY / SPECIES 04", description: "A supernatural threat linked directly to the Lawrence file and the wider Winchester story.", action: "MONSTER" },
    { id: "E-03", type: "LOCATION", title: "LAWRENCE", meta: "KANSAS / 1983", description: "The location at the center of the earliest Winchester family records.", action: "LOCATION" },
    { id: "E-04", type: "CASE", title: "JERICHO NIGHT FILE", meta: "CASE-014", description: "An early road investigation connected to a spirit and the brothers' return to hunting.", action: "CASE" },
    { id: "E-05", type: "CREATURE", title: "GHOST", meta: "BESTIARY / SPECIES 03", description: "A spirit profile connected to the Jericho investigation.", action: "MONSTER" },
    { id: "E-06", type: "LOCATION", title: "JERICHO", meta: "CALIFORNIA / 2005", description: "An early hunting stop where a mysterious roadside case begins.", action: "LOCATION" },
    { id: "E-07", type: "CASE", title: "PURGATORY ACCESS", meta: "CASE-027", description: "A restricted file concerning a realm beyond ordinary geography.", action: "CASE" },
    { id: "E-08", type: "CREATURE", title: "LEVITHAN", meta: "BESTIARY / SPECIES 08", description: "An ancient species file tied to Purgatory and a major supernatural conflict.", action: "MONSTER" },
    { id: "E-09", type: "LOCATION", title: "PURGATORY", meta: "RESTRICTED REALM", description: "A dangerous supernatural realm outside the ordinary road map.", action: "LOCATION" },
  ];

  const fieldNotes = [
    { id: "FN-01", author: "DEAN", title: "THE FIRST RULE", text: "Know what you're hunting before you decide how you're going to hunt it.", tag: "FIELD RULE" },
    { id: "FN-02", author: "SAM", title: "CHECK THE PATTERN", text: "The details that repeat are usually more useful than the details that scare people.", tag: "RESEARCH" },
    { id: "FN-03", author: "BOBBY", title: "FAMILY", text: "A hunter does not have to work alone. The people you trust can become part of the team.", tag: "LEGACY" },
    { id: "FN-04", author: "ARCHIVE", title: "THE ROAD", text: "Every case leaves evidence behind. Keep the useful pieces and let the rest stay in the past.", tag: "ROAD NOTE" },
  ];

  const hunterStats = [
    { value: "15", label: "SEASONS ARCHIVED" },
    { value: "10", label: "SPECIES FILES" },
    { value: "06", label: "ROUTE MARKERS" },
    { value: "∞", label: "CASES AHEAD" },
  ];

  const threatLevels = [
    { name: "LOW", width: "24%" },
    { name: "MEDIUM", width: "48%" },
    { name: "HIGH", width: "72%" },
    { name: "CRITICAL", width: "94%" },
  ];

  const monsterCategories = ["ALL", "MONSTERS", "SPIRITS", "DEMONS", "SHIFTERS", "ANCIENTS"];

  useEffect(() => {
    document.title = "SUPERNATURAL | The Road So Far";

    const audio = audioRef.current;
    if (!audio) return;

    const stopAt30 = () => {
      if (audio.currentTime >= 30) {
        audio.pause();
        audio.currentTime = 30;
      }
    };

    audio.addEventListener("timeupdate", stopAt30);

    return () => {
      audio.removeEventListener("timeupdate", stopAt30);
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (selectedGallery === null) return;

      if (event.key === "Escape") {
        closeGallery();
      }

      if (event.key === "ArrowRight") {
        nextGallery();
      }

      if (event.key === "ArrowLeft") {
        previousGallery();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [selectedGallery]);

  useEffect(() => {
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  /* UPGRADE 10 — keyboard controls */
  useEffect(() => {
    const handleExperienceKeys = (event) => {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (event.key.toLowerCase() === "m") {
        toggleMusic();
      }

      if (event.key.toLowerCase() === "r") {
        setCinemaMode((current) => !current);
      }

      if (event.key.toLowerCase() === "c") {
        openCommandCenter();
      }

      if (event.key.toLowerCase() === "b") {
        document.getElementById("bestiary")?.scrollIntoView({ behavior: "smooth", block: "start" });
      }

      if (event.key.toLowerCase() === "j") {
        document.getElementById("journal")?.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    };

    window.addEventListener("keydown", handleExperienceKeys);

    return () => {
      window.removeEventListener("keydown", handleExperienceKeys);
    };
  }, [muted]);

  useEffect(() => {
    const clock = window.setInterval(() => setHunterTime(new Date()), 1000);
    return () => window.clearInterval(clock);
  }, []);

  const openCommandCenter = () => {
    setTimeout(() => {
      document.getElementById("command-center")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  };

  const openCommandCase = (caseId) => {
    setActiveCommandCase(caseId);
    setTimeout(() => {
      document.getElementById("command-case-detail")?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 50);
  };

  const openArchiveFile = (targetId) => {
    document.getElementById(targetId)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const enterSite = async () => {
    const audio = audioRef.current;

    setTransitioning(true);
    setSigilOpening(true);

    if (audio) {
      try {
        audio.currentTime = 0;
        audio.volume = 1;
        await audio.play();
      } catch (error) {
        console.error("Audio playback failed:", error);
      }
    }

    setTimeout(() => {
      setEntered(true);
      try { window.sessionStorage.setItem("spn-entered", "yes"); } catch { /* storage may be blocked */ }
      setTransitioning(false);
    }, 1850);

    setTimeout(() => {
      setSigilOpening(false);
    }, 1750);
  };

  const toggleMusic = async () => {
    const audio = audioRef.current;

    if (!audio) return;

    if (muted) {
      try {
        await audio.play();
        setMuted(false);
      } catch (error) {
        console.error("Could not resume audio:", error);
      }
    } else {
      audio.pause();
      setMuted(true);
    }
  };

  const clearSelections = () => {
    setSelectedSeason(null);
    setSelectedLore(null);
    setSelectedCharacter(null);
    setSelectedAngel(null);
    setSelectedMuseumItem(null);
    setSelectedCase(null);
    setSelectedTimeline(null);
    setSelectedLocation(null);
    setSelectedReaper(null);
    setSelectedMonster(null);
  };

  const openSeason = (season) => {
    clearSelections();
    setSelectedSeason(season);

    setTimeout(() => {
      document.getElementById("season-detail")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 50);
  };

  const closeSeason = () => {
    setSelectedSeason(null);

    setTimeout(() => {
      document.getElementById("seasons")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 50);
  };

  const openLore = (item) => {
    clearSelections();
    setSelectedLore(item);

    setTimeout(() => {
      document.getElementById("lore-detail")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 50);
  };

  const closeLore = () => {
    setSelectedLore(null);

    setTimeout(() => {
      document.getElementById("lore")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 50);
  };

  const openCharacter = (character) => {
    clearSelections();
    setSelectedCharacter(character);

    setTimeout(() => {
      document.getElementById("character-detail")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 50);
  };

  const closeCharacter = () => {
    setSelectedCharacter(null);

    setTimeout(() => {
      document.getElementById("characters")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 50);
  };

  const openAngel = (angel) => {
    clearSelections();
    setSelectedAngel(angel);
    setTimeout(() => {
      document.getElementById("angel-detail")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  };

  const closeAngel = () => {
    setSelectedAngel(null);
    setTimeout(() => {
      document.getElementById("angels")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  };

  const openMuseumItem = (item) => {
    clearSelections();
    setSelectedMuseumItem(item);
    setTimeout(() => document.getElementById("museum-detail")?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  };

  const closeMuseumItem = () => {
    setSelectedMuseumItem(null);
    setTimeout(() => document.getElementById("museum")?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  };

  const openCase = (caseFile) => {
    clearSelections();
    setSelectedCase(caseFile);

    setTimeout(() => {
      document.getElementById("case-detail")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 50);
  };

  const closeCase = () => {
    setSelectedCase(null);

    setTimeout(() => {
      document.getElementById("journal")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 50);
  };

  /* =========================================================
     TIMELINE FUNCTIONS
  ========================================================= */

  const openTimeline = (event) => {
    clearSelections();
    setSelectedTimeline(event);

    setTimeout(() => {
      document.getElementById("timeline-detail")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 50);
  };

  const closeTimeline = () => {
    setSelectedTimeline(null);

    setTimeout(() => {
      document.getElementById("timeline")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 50);
  };

  const storyDetails = {
    brothers: {
      label: "THE BROTHERS",
      title: "SAM & DEAN WINCHESTER",
      text: "Sam and Dean are at the center of the story. Their journey is built around loyalty, sacrifice and the promise to keep looking out for each other, no matter how difficult the road becomes."
    },
    baby: {
      label: "THE CAR",
      title: "BABY — 1967 CHEVROLET IMPALA",
      text: "Baby is more than transportation. The Impala is a familiar part of the brothers' life on the road — carrying them between cases, memories and the places where another hunt is waiting."
    },
    family: {
      label: "THE WINCHESTER WAY",
      title: "FAMILY",
      text: "Family is one of the central ideas of the story. It is shown through loyalty, trust, friendship and the people who choose to stand together when things get difficult."
    }
  };

  const openStory = (storyId) => {
    setSelectedStory(storyId);
    setTimeout(() => {
      document.getElementById("feature-story-detail")?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 80);
  };

  const openLocation = (location, source = "map") => {
    clearSelections();
    setSelectedLocation({ ...location, source });

    // Match the Strongest Beings interaction: wait for the detail panel to
    // render, then bring the image-and-information panel into the centre.
    setTimeout(() => {
      document.getElementById("location-detail")?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }, 100);
  };

  const closeLocation = () => {
    setSelectedLocation(null);

    setTimeout(() => {
      document.getElementById("road-map")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 50);
  };

  const openMonster = (monster) => {
    clearSelections();
    setSelectedMonster(monster);

    setTimeout(() => {
      document.getElementById("bestiary-book")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 50);
  };

  const openMonsterByName = (monsterName) => {
    const monster = monsters.find((item) => item.name === monsterName);
    if (monster) openMonster(monster);
  };

  const openCaseFromBook = (caseId) => {
    setSelectedMonster(null);
    setActiveCommandCase(caseId);

    setTimeout(() => {
      document.getElementById("command-center")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 50);
  };

  const openEvidenceFile = (file) => {
    if (file.action === "CASE") {
      const caseId = file.meta.split(" / ")[0];
      const match = commandCases.find((item) => item.id === file.meta || item.id === caseId);
      if (match) {
        openCommandCase(match.id);
        setTimeout(() => document.getElementById("command-case-detail")?.scrollIntoView({ behavior: "smooth", block: "center" }), 80);
      }
      return;
    }

    if (file.action === "MONSTER") {
      const monsterName = file.title.toUpperCase();
      openMonsterByName(monsterName);
      return;
    }

    if (file.action === "LOCATION") {
      const location = locations.find((item) => item.name === file.title);
      if (location) openLocation(location);
    }
  };

  const openGallery = (index) => {
    setSelectedGallery(index);
    document.body.style.overflow = "hidden";
  };

  const closeGallery = () => {
    setSelectedGallery(null);
    document.body.style.overflow = "";
  };

  const nextGallery = () => {
    setSelectedGallery((current) => {
      if (current === null) return 0;
      return (current + 1) % gallery.length;
    });
  };

  const previousGallery = () => {
    setSelectedGallery((current) => {
      if (current === null) return 0;
      return (current - 1 + gallery.length) % gallery.length;
    });
  };

  return (
    <div className="site">
      <style>{`
        /* =====================================================
           UPGRADE 10 — CINEMATIC EXPERIENCE
        ===================================================== */

        .main-site {
          position: relative;
        }

        .upgrade10-atmosphere {
          position: fixed;
          inset: 0;
          z-index: 999;
          pointer-events: none;
          overflow: hidden;
          mix-blend-mode: normal;
        }

        .upgrade10-vignette {
          position: absolute;
          inset: 0;
          background: radial-gradient(
            ellipse at center,
            transparent 35%,
            rgba(0,0,0,0.18) 62%,
            rgba(0,0,0,0.68) 100%
          );
        }

        .upgrade10-scanlines {
          position: absolute;
          inset: 0;
          opacity: 0.075;
          background: repeating-linear-gradient(
            to bottom,
            transparent 0px,
            transparent 3px,
            rgba(255,255,255,0.08) 4px,
            transparent 5px
          );
          animation: upgrade10Scan 10s linear infinite;
        }

        .upgrade10-grain {
          position: absolute;
          inset: -50%;
          opacity: 0.045;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 180 180' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.55'/%3E%3C/svg%3E");
          animation: upgrade10Grain .25s steps(2) infinite;
        }

        .upgrade10-fog {
          position: absolute;
          width: 65vw;
          height: 22vw;
          min-height: 150px;
          border-radius: 50%;
          background: rgba(255,255,255,0.045);
          filter: blur(55px);
          opacity: 0.55;
        }

        .upgrade10-fog-one {
          left: -18vw;
          bottom: 10vh;
          animation: upgrade10FogOne 18s ease-in-out infinite alternate;
        }

        .upgrade10-fog-two {
          right: -20vw;
          top: 20vh;
          animation: upgrade10FogTwo 23s ease-in-out infinite alternate;
        }

        .cinema-mode .hero,
        .cinema-mode .impala-section,
        .cinema-mode .timeline-section {
          filter: saturate(0.88) contrast(1.08);
        }

        .cinema-mode .hero::after,
        .cinema-mode .impala-section::after,
        .cinema-mode .timeline-section::after {
          content: "";
          position: absolute;
          inset: 0;
          pointer-events: none;
          border: 1px solid rgba(170, 20, 20, 0.16);
          box-shadow:
            inset 0 0 120px rgba(0,0,0,0.38),
            inset 0 0 25px rgba(160,20,20,0.08);
        }

        .upgrade10-controls {
          display: flex;
          align-items: center;
          gap: 7px;
        }

        .experience-button,
        .atmosphere-button {
          border: 1px solid rgba(255,255,255,0.16);
          background: rgba(0,0,0,0.48);
          color: rgba(255,255,255,0.72);
          backdrop-filter: blur(10px);
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .experience-button {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          padding: 9px 12px;
          font-size: 9px;
          letter-spacing: 0.13em;
          font-weight: 700;
        }

        .experience-button span {
          font-size: 8px;
        }

        .experience-button:hover,
        .experience-button.active,
        .atmosphere-button:hover,
        .atmosphere-button.active {
          color: #fff;
          border-color: rgba(180,30,30,0.7);
          background: rgba(110,10,10,0.32);
          box-shadow: 0 0 20px rgba(130,15,15,0.18);
        }

        .atmosphere-button {
          width: 35px;
          height: 35px;
          font-size: 14px;
        }

        .upgrade10-hud {
          position: fixed;
          left: 50%;
          bottom: 14px;
          transform: translateX(-50%);
          z-index: 1000;
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 13px;
          border: 1px solid rgba(255,255,255,0.1);
          background: rgba(0,0,0,0.55);
          backdrop-filter: blur(12px);
          color: rgba(255,255,255,0.46);
          font-size: 8px;
          letter-spacing: 0.12em;
          white-space: nowrap;
          pointer-events: none;
        }

        .upgrade10-hud i {
          width: 3px;
          height: 3px;
          border-radius: 50%;
          background: rgba(180,30,30,0.75);
        }

        .upgrade10-hud .hud-live {
          color: rgba(210,55,55,0.95);
        }

        @keyframes upgrade10Scan {
          from { transform: translateY(0); }
          to { transform: translateY(5px); }
        }

        @keyframes upgrade10Grain {
          0% { transform: translate(0,0); }
          25% { transform: translate(2%, -1%); }
          50% { transform: translate(-1%, 2%); }
          75% { transform: translate(1%, 1%); }
          100% { transform: translate(-2%, -1%); }
        }

        @keyframes upgrade10FogOne {
          from { transform: translateX(0) translateY(0) scale(1); }
          to { transform: translateX(28vw) translateY(-5vh) scale(1.18); }
        }

        @keyframes upgrade10FogTwo {
          from { transform: translateX(0) translateY(0) scale(1); }
          to { transform: translateX(-25vw) translateY(8vh) scale(1.2); }
        }

        @media (max-width: 900px) {
          .experience-button {
            width: 35px;
            height: 35px;
            padding: 0;
            justify-content: center;
            font-size: 0;
          }

          .experience-button span {
            font-size: 10px;
          }

          .upgrade10-hud {
            bottom: 8px;
            max-width: calc(100vw - 20px);
            overflow: hidden;
          }
        }

        @media (max-width: 600px) {
          .upgrade10-hud {
            display: none;
          }

          .upgrade10-atmosphere {
            opacity: 0.72;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .upgrade10-scanlines,
          .upgrade10-grain,
          .upgrade10-fog {
            animation: none;
          }
        }
      `}</style>
      <audio ref={audioRef} id="theme-audio" preload="auto">
        <source src="/audio/theme.mp3" type="audio/mpeg" />
      </audio>

      {!entered && (
        <section
          className={`intro-screen ${transitioning ? "intro-exit" : ""}`}
        >
          <div className="intro-noise"></div>
          <div className="fog fog-one"></div>
          <div className="fog fog-two"></div>

          {transitioning && (
            <div className={`hunt-sigil-transition ${sigilOpening ? "sigil-opening" : ""}`} aria-hidden="true">
              <div className="hunt-sigil-glow"></div>
              <svg className="devils-trap-symbol" viewBox="0 0 500 500" role="img" aria-label="Devil's trap inspired hunter symbol">
                <circle className="trap-line trap-outer" cx="250" cy="250" r="214" />
                <circle className="trap-line trap-inner" cx="250" cy="250" r="185" />
                <path className="trap-line trap-pentagram" d="M250 72 L355 322 L142 168 L358 168 L145 322 Z" />
                <circle className="trap-line trap-center" cx="250" cy="250" r="34" />
                <path className="trap-mark" d="M250 216 L250 284 M216 250 L284 250 M226 226 L274 274 M274 226 L226 274" />
                <path className="trap-mark trap-notch" d="M250 36 L250 58 M250 442 L250 464 M36 250 L58 250 M442 250 L464 250" />
              </svg>
              <span className="hunt-sigil-label">THE HUNT BEGINS</span>
            </div>
          )}

          <div className="intro-content">
            <p className="intro-small">THE ROAD SO FAR</p>

            <h1 className="intro-title">SUPERNATURAL</h1>

            <div className="intro-line"></div>

            <p className="intro-description">
              TWO BROTHERS. ONE ROAD. A LIFETIME OF HUNTING.
            </p>

            <button
              className="enter-button"
              onClick={enterSite}
              disabled={transitioning}
            >
              {transitioning ? "ENTERING..." : "ENTER THE HUNT"}
              <span>→</span>
            </button>

            <p className="intro-note">
              SOUND ON FOR THE FULL EXPERIENCE
            </p>
          </div>
        </section>
      )}

      {entered && (
        <main className={`main-site page-${currentRoute} ${cinemaMode ? "cinema-mode" : ""} ${showAtmosphere ? "atmosphere-on" : "atmosphere-off"}`}>
          
      <style>{`
        /* Route-aware page filtering keeps the original feature implementations intact. */
        .main-site > section, .main-site > .section, .main-site .character-detail-section,
        .main-site .season-detail-section, .main-site .timeline-detail-section,
        .main-site .location-detail-section, .main-site .bestiary-book-section,
        .main-site .lore-detail-section, .main-site .case-detail-section { display: none; }
        .main-site.page-home #home, .main-site.page-home #brothers,
        .main-site.page-home #brothers,
        .main-site.page-characters #characters, .main-site.page-characters #character-detail,
        .main-site.page-angels #angels, .main-site.page-angels #angel-detail,
        .main-site.page-museum #museum, .main-site.page-museum #museum-detail,
        .main-site.page-seasons #seasons, .main-site.page-seasons #season-detail,
        .main-site.page-timeline #timeline, .main-site.page-timeline #timeline-detail,
        .main-site.page-locations #locations, .main-site.page-locations #location-detail,
        .main-site.page-road-map #road-map, .main-site.page-road-map #location-detail,
        .main-site.page-bestiary #bestiary, .main-site.page-bestiary #bestiary-book,
        .main-site.page-threats #lore, .main-site.page-threats #lore-detail, .main-site.page-death-reapers #lore-detail,
        .main-site.page-strongest-beings #strongest-beings,
        .main-site.page-command #command-center, .main-site.page-command #command-case-detail,
        .main-site.page-journal #journal, .main-site.page-journal #case-detail,
        .main-site.page-gallery #gallery, .main-site.page-death-reapers #death-reapers, .main-site.page-death-reapers #death-reaper-detail { display: block; }
        .main-site #asset-archive { display: none !important; }
        .main-site:not(.page-home) #home,
        .main-site:not(.page-home) .hero {
          display: none !important;
          visibility: hidden !important;
        }
        .main-site.page-home #home {
          display: flex !important;
          visibility: visible !important;
        }
        .main-site:not(.page-home) #home { display: none !important; }
        .main-site.page-home #home { display: flex !important; }
        .main-site.page-home .quote-section, .main-site.page-characters .quote-section, .main-site.page-angels .quote-section,
        .main-site.page-seasons .quote-section, .main-site.page-timeline .quote-section,
        .main-site.page-locations .quote-section, .main-site.page-road-map .quote-section, .main-site.page-death-reapers .quote-section, .main-site.page-bestiary .quote-section,
        .main-site.page-threats .quote-section, .main-site.page-command .quote-section,
        .main-site.page-journal .quote-section, .main-site.page-gallery .quote-section { display: none; }
        .main-site .navbar .nav-links a.active { color: #e1262f; border-bottom: 1px solid #e1262f; }
        .main-site.page-home #characters, .main-site.page-home #angels, .main-site.page-home #seasons,
        .main-site.page-home #timeline, .main-site.page-home #locations, .main-site.page-home #road-map, .main-site.page-home #bestiary,
        .main-site.page-home #command-center, .main-site.page-home #lore, .main-site.page-home #journal,
        .main-site.page-home #gallery, .main-site.page-home #death-reapers { display: none !important; }
      `}</style>

          {/* UPGRADE 10 — cinematic atmosphere layers */}
          {showAtmosphere && (
            <div className="upgrade10-atmosphere" aria-hidden="true">
              <div className="upgrade10-vignette"></div>
              <div className="upgrade10-scanlines"></div>
              <div className="upgrade10-fog upgrade10-fog-one"></div>
              <div className="upgrade10-fog upgrade10-fog-two"></div>
              <div className="upgrade10-grain"></div>
            </div>
          )}

          <nav className="navbar">
            <div className="nav-logo">
              <span>SPN</span>
            </div>

            <div className="nav-title">SUPERNATURAL</div>

            <div className="nav-links">
              {Object.entries(ROUTE_CONFIG).map(([route, item]) => (
                <a key={route} href={route === "home" ? "/" : `/${route}`} onClick={(event) => { event.preventDefault(); navigateTo(route); }} className={currentRoute === route ? "active" : ""}>
                  {item.label}
                </a>
              ))}
            </div>

            <div className="upgrade10-controls">
              <button
                className={`experience-button ${cinemaMode ? "active" : ""}`}
                onClick={() => setCinemaMode((current) => !current)}
                aria-label="Toggle Road Trip Mode"
                title="Road Trip Mode — press R"
              >
                <span>◉</span>
                ROAD TRIP
              </button>

              <button
                className={`atmosphere-button ${showAtmosphere ? "active" : ""}`}
                onClick={() => setShowAtmosphere((current) => !current)}
                aria-label="Toggle atmosphere"
                title="Toggle atmosphere"
              >
                ✦
              </button>

              <button
                className="music-button"
                onClick={toggleMusic}
                aria-label="Toggle music"
                title="Music — press M"
              >
                {muted ? "🔇" : "♫"}
              </button>
            </div>
          </nav>

          {currentRoute === "home" ? (
            <section
              id="home"
              className="hero"
              style={{
                backgroundImage: `
                  linear-gradient(
                    rgba(0, 0, 0, 0.05),
                    rgba(0, 0, 0, 0.20)
                  ),
                  url(${winchesters})
                `,
                backgroundSize: "cover",
                backgroundPosition: "center 35%",
                backgroundRepeat: "no-repeat"
             }}
            >
              <div className="hero-overlay"></div>

              <div className="hero-content">
                <p className="hero-kicker">THE CW • 2005 — 2020</p>

                <h1>SUPERNATURAL</h1>

                <div className="hero-divider"></div>

                <p className="hero-text">
                  Saving people. Hunting things.
                  <br />
                  The family business.
                </p>

                <a href="#brothers" className="hero-button">
                  EXPLORE THE ROAD <span>↓</span>
                </a>
              </div>

              <div className="hero-bottom">
                <span>01</span>
                <div></div>
                <span>THE BEGINNING</span>
              </div>
            </section>
          ) : null}

          <section id="brothers" className="section brothers">
            <div className="section-heading">
              <p className="section-number">01 / THE WINCHESTERS</p>

              <h2>THE BROTHERS</h2>

              <p>
                A story about family, sacrifice, loyalty
                and the road that two brothers refused
                to stop travelling.
              </p>
            </div>

            <div className="character-grid">
              <article className={`character-card brothers-card ${selectedStory === "brothers" ? "story-selected" : ""}`} onClick={() => openStory("brothers")} role="button" tabIndex={0} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); openStory("brothers"); } }}>
                <div className="character-image">
                  <img
                    src={findLocalAsset("home", "brothers.jpg")}
                    alt="Dean and Sam Winchester"
                  />
                </div>

                <div className="character-number">01</div>

                <div className="character-info">
                  <span>THE ELDER & YOUNGER BROTHER</span>

                  <h3>DEAN & SAM</h3>

                  <p>
                    Two brothers. One road. Family above everything.
                  </p>

                  <span className="story-card-link">CLICK TO READ ABOUT THE BROTHERS →</span>
                </div>
              </article>

              <article id="family" className={`character-card family-card ${selectedStory === "family" ? "story-selected" : ""}`} onClick={() => openStory("family")} role="button" tabIndex={0} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); openStory("family"); } }}>
                <div className="character-image">
                  <img
                    src={findLocalAsset("home", "family.jpg")}
                    alt="Supernatural Family"
                  />
                </div>

                <div className="character-number">02</div>

                <div className="character-info">
                  <span>THE WINCHESTER WAY</span>

                  <h3>FAMILY</h3>

                  <p>
                    Saving people, hunting things, and never leaving
                    family behind.
                  </p>

                  <span className="story-card-link">CLICK TO READ ABOUT FAMILY →</span>
                </div>
              </article>
            </div>

            {selectedStory && (selectedStory === "brothers" || selectedStory === "family") && (
              <div id="feature-story-detail" className="feature-story-panel">
                <div className="feature-story-label">{storyDetails[selectedStory].label}</div>
                <div>
                  <h3>{storyDetails[selectedStory].title}</h3>
                  <p>{storyDetails[selectedStory].text}</p>
                </div>
                <button onClick={() => setSelectedStory(null)}>CLOSE ×</button>
              </div>
            )}
          </section>

          <section id="characters" className="section characters">
            <div className="section-heading">
              <p className="section-number">02 / THE FAMILY</p>

              <h2>THE CHARACTERS.</h2>

              <p>
                Hunters, angels, allies and enemies.
                The people who shaped the road along the way.
              </p>
            </div>

            <div className="character-profile-grid">
              {characters.map((character) => (
                <button
                  className="character-profile-card"
                  key={character.number}
                  onClick={() => openCharacter(character)}
                >
                  <div className="character-profile-image">
                    <img
                      src={character.image}
                      alt={character.name}
                      onError={(event) => {
                        event.currentTarget.style.display = "none";
                      }}
                    />

                    <div className="character-profile-image-overlay"></div>
                  </div>

                  <div className="character-profile-number">
                    {character.number}
                  </div>

                  <div className="character-profile-info">
                    <span>{character.role}</span>

                    <h3>{character.name}</h3>

                    <small>VIEW PROFILE →</small>
                  </div>
                </button>
              ))}
            </div>
          </section>

          {selectedCharacter && (
            <section
              id="character-detail"
              className="character-detail-section"
            >
              <div className="character-detail-background"></div>

              <div className="character-detail-image">
                <img
                  src={selectedCharacter.image}
                  alt={selectedCharacter.name}
                  onError={(event) => {
                    event.currentTarget.style.display = "none";
                  }}
                />
              </div>

              <div className="character-detail-overlay"></div>

              <div className="character-detail-content">
                <div className="character-detail-number">
                  {selectedCharacter.number}
                </div>

                <p className="section-number">
                  CHARACTER {selectedCharacter.number}
                </p>

                <span className="character-detail-role">
                  {selectedCharacter.role}
                </span>

                <h2>{selectedCharacter.name}</h2>

                <div className="character-detail-line"></div>

                <p className="character-detail-description">
                  {selectedCharacter.description}
                </p>

                <div className="character-detail-grid">
                  <div className="character-detail-box">
                    <span>PERSONALITY</span>
                    <p>{selectedCharacter.personality}</p>
                  </div>

                  <div className="character-detail-box">
                    <span>LEGACY</span>
                    <p>{selectedCharacter.legacy}</p>
                  </div>
                </div>

                <button
                  className="back-character-button"
                  onClick={closeCharacter}
                >
                  ← BACK TO CHARACTERS
                </button>
              </div>
            </section>
          )}

          <section id="angels" className="section angels-section">
            <div className="section-heading">
              <p className="section-number">03 / HEAVEN'S HOST</p>
              <h2>THE ANGELS.</h2>
              <p>Meet the celestial beings whose choices shaped the Winchester story.</p>
            </div>
            <div className="character-profile-grid angels-profile-grid">
              {angels.map((angel) => (
                <button className={`character-profile-card angel-profile-card angel-profile-card-${angel.name.toLowerCase()}`} key={angel.number} onClick={() => openAngel(angel)}>
                  <div className="character-profile-image">
                    {angel.image ? <img src={angel.image} alt={angel.name} onError={(event) => { event.currentTarget.style.display = "none"; }} /> : <div className="angel-image-fallback">✦</div>}
                    <div className="character-profile-image-overlay"></div>
                  </div>
                  <div className="character-profile-number">{angel.number}</div>
                  <div className="character-profile-info">
                    <span>{angel.role}</span>
                    <h3>{angel.name}</h3>
                    <small>VIEW PROFILE →</small>
                  </div>
                </button>
              ))}
            </div>
          </section>

          {selectedAngel && (
            <section id="angel-detail" className="character-detail-section angel-detail-section">
              <div className="character-detail-background"></div>
              <div className="character-detail-image">
                {selectedAngel.image && <img src={selectedAngel.image} alt={selectedAngel.name} onError={(event) => { event.currentTarget.style.display = "none"; }} />}
              </div>
              <div className="character-detail-overlay"></div>
              <div className="character-detail-content">
                <div className="character-detail-number">{selectedAngel.number}</div>
                <p className="section-number">ANGEL PROFILE {selectedAngel.number}</p>
                <span className="character-detail-role">{selectedAngel.role}</span>
                <h2>{selectedAngel.name}</h2>
                <div className="character-detail-line"></div>
                <p className="character-detail-description">{selectedAngel.description}</p>
                <button className="back-character-button" onClick={closeAngel}>← BACK TO ANGELS</button>
              </div>
            </section>
          )}

          <section id="seasons" className="section seasons">
            <div className="section-heading">
              <p className="section-number">03 / THE JOURNEY</p>

              <h2>FIFTEEN SEASONS.</h2>

              <p>
                From a single hunt to a journey through
                heaven, hell and everything between.
              </p>
            </div>

            <div className="seasons-image">
              <img
                src={findLocalAsset("seasons", "seasons.jpg")}
                alt="Supernatural Seasons"
              />
            </div>

            <div className="season-grid">
              {seasons.map((season) => (
                <button
                  className="season-card"
                  key={season.number}
                  onClick={() => openSeason(season)}
                >
                  <img src={findLocalAsset("seasons", `season-${Number(season.number)}.jpg`)} alt={`Supernatural season ${season.number} poster`} loading="lazy" />
                  <span>{season.number}</span>

                  <div>
                    <h3>{season.title}</h3>
                    <small>SEASON {season.number}</small>
                  </div>

                  <b>→</b>
                </button>
              ))}
            </div>
          </section>

          {selectedSeason && (
            <section
              id="season-detail"
              className="season-detail-section"
            >
              <div className="season-detail-glow"></div>

              <div className="season-detail-content strongest-being-detail-panel season-cinematic-panel">
                <div className="strongest-being-detail-image season-cinematic-image">
                  <img src={findLocalAsset("seasons", `season-${Number(selectedSeason.number)}.jpg`)} alt={`Supernatural season ${selectedSeason.number} poster`} />
                </div>
                <div className="strongest-being-detail-copy season-cinematic-copy">
                <div className="season-detail-number">
                  {selectedSeason.number}
                </div>

                <p className="section-number">
                  SEASON {selectedSeason.number}
                </p>

                <h2>{selectedSeason.title}</h2>

                <div className="season-detail-line"></div>

                <p className="season-detail-description">
                  {selectedSeason.description}
                </p>

                <div className="season-story">
                  <span>THE STORY</span>
                  <p>{selectedSeason.story}</p>
                </div>

                <button
                  className="back-seasons-button"
                  onClick={closeSeason}
                >
                  ← BACK TO SEASONS
                </button>
                </div>
              </div>
            </section>
          )}

          {/* =====================================================
              UPGRADE 8 — TIMELINE
          ===================================================== */}

          <section id="timeline" className="timeline-section">
            <div className="timeline-background"></div>

            <div className="timeline-inner">
              <div className="section-heading timeline-heading">
                <p className="section-number">
                  04 / THE TIMELINE
                </p>

                <h2>THE ROAD SO FAR.</h2>

                <p>
                  From one night in Lawrence to the final
                  chapter of a fifteen-year journey.
                </p>
              </div>

              <div className="timeline-intro">
                <span>1983</span>

                <div className="timeline-intro-line"></div>

                <span>2020</span>
              </div>

              <div className="timeline-track">
                <div className="timeline-line"></div>

                {timeline.map((event, index) => (
                  <button
                    className={`timeline-event timeline-event-${index + 1}`}
                    key={event.year}
                    onClick={() => openTimeline(event)}
                  >
                    <div className="timeline-dot">
                      <span></span>
                    </div>

                    <div className="timeline-year">
                      {event.year}
                    </div>

                    <div className="timeline-card">
                      <span>{event.category}</span>

                      <h3>{event.label}</h3>

                      <p>{event.description}</p>

                      <small>OPEN EVENT →</small>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </section>

          {selectedTimeline && (
            <section
              id="timeline-detail"
              className="timeline-detail-section"
            >
              <div className="timeline-detail-glow"></div>

              <div className="timeline-detail-content">
                <div className="timeline-detail-year">
                  {selectedTimeline.year}
                </div>

                <p className="section-number">
                  TIMELINE EVENT
                </p>

                <span className="timeline-detail-category">
                  {selectedTimeline.category}
                </span>

                <h2>{selectedTimeline.title}</h2>

                <div className="timeline-detail-line"></div>

                <p className="timeline-detail-description">
                  {selectedTimeline.description}
                </p>

                <div className="timeline-story">
                  <span>THE STORY</span>

                  <p>{selectedTimeline.details}</p>
                </div>

                <div className="timeline-detail-meta">
                  <div>
                    <span>YEAR</span>
                    <strong>{selectedTimeline.year}</strong>
                  </div>

                  <div>
                    <span>ERA</span>
                    <strong>{selectedTimeline.label}</strong>
                  </div>

                  <div>
                    <span>ARCHIVE</span>
                    <strong>WINCHESTER FILES</strong>
                  </div>
                </div>

                <button
                  className="back-timeline-button"
                  onClick={closeTimeline}
                >
                  ← BACK TO TIMELINE
                </button>
              </div>
            </section>
          )}

          {/* =====================================================
              UPGRADE 11 — ROAD MAP
          ===================================================== */}

          <section id="locations" className="locations-archive-section">
            <div className="locations-archive-inner">
              <div className="section-heading">
                <p className="section-number">07 / THE LOCATIONS ARCHIVE</p>
                <h2>PLACES ALONG THE ROAD.</h2>
                <p>Explore the places that became part of the Winchester story.</p>
              </div>
              <div className="locations-image-grid">
                {getRouteImages("locations").map((asset, index) => {
                  const title = readableAssetName(asset.path).replace(/\bM O L\b/i, "Men of Letters");
                  const descriptions = {
                    "BABY": "The Impala: the brothers’ home on four wheels and a constant companion on the road.",
                    "FOREST": "Remote woodland where the Winchesters investigate strange disappearances and supernatural activity.",
                    "GRAVEYARD": "A familiar stop on many hunts, where old cases and restless spirits meet.",
                    "M O L BUNKER": "The Men of Letters bunker: a headquarters, library and home base for the Winchesters.",
                    "MOTEL": "A temporary home between hunts, where the brothers plan their next move.",
                    "ROADHOUSE": "A gathering place for hunters, information, and allies from across the country."
                  };
                  const detailName = title.toUpperCase();
                  return <button className="location-image-card" key={asset.path} onClick={() => openLocation({ name: detailName, state: "WINCHESTER ARCHIVE", code: String(index + 1).padStart(2, "0"), era: "ROAD YEARS", image: asset.url, description: descriptions[detailName] || `An important location in the Supernatural world: ${title}.`, caseNote: "LOCATION ARCHIVE / FIELD RECORD" }, "locations")}>
                    <img src={asset.url} alt={title} loading="lazy" />
                    <span className="location-image-index">LOCATION / {String(index + 1).padStart(2, "0")}</span>
                    <strong>{title}</strong>
                    <small>OPEN LOCATION FILE ↗</small>
                  </button>;
                })}
              </div>
            </div>
          </section>

          <section id="road-map" className="road-map-section">
            <div className="road-map-bg"></div>
            <div className="road-map-grid"></div>
            <div className="road-map-vignette"></div>

            <div className="road-map-inner">
              <div className="section-heading road-map-heading">
                <p className="section-number">07 / THE ROAD MAP</p>
                <h2>THE ROAD NEVER ENDS.</h2>
                <p>Trace the Winchester route from the beginning to the places that exist beyond the ordinary map.</p>
              </div>

              <div className="map-header">
                <div>
                  <span>WINCHESTER FAMILY ARCHIVE</span>
                  <strong>FIELD ROUTE / 001 — 006</strong>
                </div>
                <div className="map-compass" aria-hidden="true">
                  <span>N</span>
                  <div>✦</div>
                </div>
              </div>

              <div className="map-board">
                <div className="map-paper"></div>
                <div className="map-label map-label-west">WESTERN ROUTE</div>
                <div className="map-label map-label-midwest">MIDWEST</div>
                <div className="map-label map-label-unknown">BEYOND</div>

                <div className="map-route route-one"></div>
                <div className="map-route route-two"></div>
                <div className="map-route route-three"></div>
                <div className="map-route route-four"></div>
                <div className="map-route route-five"></div>
                <div className="map-route route-six"></div>

                {locations.map((location) => (
                  <button
                    key={location.name}
                    className="map-location"
                    style={{ left: location.x, top: location.y }}
                    onClick={() => openLocation(location, "map")}
                    aria-label={`Open ${location.name} location file`}
                  >
                    <span className="map-pulse"></span>
                    <span className="map-marker">{location.code}</span>
                    <span className="map-location-label">
                      <strong>{location.name}</strong>
                      <small>{location.state} / {location.era}</small>
                    </span>
                  </button>
                ))}

                <div className="map-route-caption">
                  <b>→</b> CLICK A MARKER TO OPEN THE CASE FILE
                </div>
              </div>

              <div className="map-footer">
                <div><span>START</span><strong>LAWRENCE</strong></div>
                <div><span>ROUTE</span><strong>ROAD SO FAR</strong></div>
                <div><span>STATUS</span><strong>ACTIVE</strong></div>
                <p>MAP DATA: HUNTER ARCHIVE / FAN-MADE EXPERIENCE</p>
              </div>
            </div>
          </section>

          {selectedLocation && (
            <section id="location-detail" className="location-detail-section">
              <div className={`strongest-being-detail-panel location-cinematic-panel ${selectedLocation.source === "map" ? "location-cinematic-map" : ""} ${!selectedLocation.image ? "location-cinematic-no-image" : ""}`}>
                {selectedLocation.image && (
                  <div className="strongest-being-detail-image location-cinematic-image">
                    <img src={selectedLocation.image} alt={selectedLocation.name} />
                  </div>
                )}
                <div className="strongest-being-detail-copy location-cinematic-copy">
                  <span>WINCHESTER FAMILY ARCHIVE / LOCATION FILE {selectedLocation.code}</span>
                  <p className="location-cinematic-kicker">FIELD LOCATION</p>
                  <h2>{selectedLocation.name}</h2>
                  <h3>{selectedLocation.state} / ARCHIVE YEAR {selectedLocation.era}</h3>
                  <div className="location-cinematic-stats">
                    <div><span>REGION</span><strong>{selectedLocation.state}</strong></div>
                    <div><span>ARCHIVE ERA</span><strong>{selectedLocation.era}</strong></div>
                    <div><span>STATUS</span><strong>ROUTE ACTIVE</strong></div>
                  </div>
                  <p className="location-cinematic-description">{selectedLocation.description}</p>
                  <div className="location-cinematic-note">
                    <span>ARCHIVE NOTE</span>
                    <p>{selectedLocation.caseNote}</p>
                  </div>
                  {selectedLocation.relatedMonster && (
                    <button
                      className="location-bestiary-link"
                      onClick={() => openMonsterByName(selectedLocation.relatedMonster)}
                    >
                      <span>RELATED BESTIARY ENTRY</span>
                      <strong>{selectedLocation.relatedMonster}</strong>
                      <b>OPEN BOOK PAGE →</b>
                    </button>
                  )}
                  <button className="back-location-button location-cinematic-close" onClick={closeLocation}>← BACK TO ROAD MAP</button>
                </div>
              </div>
            </section>
          )}
          {/* =====================================================
              UPGRADE 11 — BESTIARY
          ===================================================== */}

          <section id="bestiary" className="bestiary-section">
            <div className="bestiary-background"></div>
            <div className="bestiary-inner">
              <div className="section-heading bestiary-heading">
                <p className="section-number">08 / THE BESTIARY</p>
                <h2>KNOW WHAT YOU'RE HUNTING.</h2>
                <p>A field archive of supernatural species. Search the records, filter by class, then open a file for the hunter's notes.</p>
              </div>

              <div className="bestiary-console">
                <div className="bestiary-console-top">
                  <div><span>WINCHESTER DATABASE</span><strong>SUPERNATURAL SPECIES ARCHIVE</strong></div>
                  <div className="bestiary-counter">{monsters.filter((monster) => (monsterCategories.includes(monsterFilter) && (monsterFilter === "ALL" || monster.category === monsterFilter)) && (`${monster.name} ${monster.description}`.toLowerCase().includes(monsterSearch.toLowerCase()))).length.toString().padStart(2, "0")} FILES</div>
                </div>

                <div className="bestiary-controls">
                  <label className="bestiary-search">
                    <span>SEARCH ARCHIVE</span>
                    <input value={monsterSearch} onChange={(event) => setMonsterSearch(event.target.value)} placeholder="Search species..." aria-label="Search bestiary" />
                  </label>

                  <div className="bestiary-filters">
                    {monsterCategories.map((category) => (
                      <button key={category} className={monsterFilter === category ? "active" : ""} onClick={() => setMonsterFilter(category)}>{category}</button>
                    ))}
                  </div>
                </div>

                <div className="bestiary-grid">
                  {monsters.filter((monster) => (monsterFilter === "ALL" || monster.category === monsterFilter) && (`${monster.name} ${monster.category} ${monster.description}`.toLowerCase().includes(monsterSearch.toLowerCase()))).map((monster, index) => (
                    <button className="bestiary-card" key={`${monster.name}-${monster.archive}`} onClick={() => openMonster(monster)}>
                      {getMonsterImage(monster) && <img className="bestiary-card-image" src={getMonsterImage(monster)} alt={monster.name} loading="lazy" />}
                      <span className="bestiary-card-number">{String(index + 1).padStart(2, "0")}</span>
                      <div className="bestiary-card-info">
                        <span>{monster.category}</span>
                        <h3>{monster.name}</h3>
                        <small>THREAT: {monster.threat}</small>
                      </div>
                      <b>OPEN FILE →</b>
                    </button>
                  ))}
                </div>

                {monsters.filter((monster) => (monsterFilter === "ALL" || monster.category === monsterFilter) && (`${monster.name} ${monster.category} ${monster.description}`.toLowerCase().includes(monsterSearch.toLowerCase()))).length === 0 && (
                  <div className="bestiary-empty">NO MATCHING FILES FOUND IN THE ARCHIVE.</div>
                )}
              </div>
            </div>
          </section>

          {selectedMonster && (
            <section id="bestiary-book" className="bestiary-book-section">
              <div className="bestiary-book-shell">
                <div className="bestiary-book-cover-line">
                  <span>WINCHESTER FIELD GUIDE</span>
                  <span>SPECIES / {String(monsters.findIndex((item) => item.name === selectedMonster.name) + 1).padStart(2, "0")}</span>
                </div>

                <div className="bestiary-book-spread">
                  <div className="bestiary-book-page bestiary-book-page-left">
                    <div className="book-page-number">PAGE {String(monsters.findIndex((item) => item.name === selectedMonster.name) * 2 + 1).padStart(2, "0")}</div>
                    <p className="book-kicker">FIELD CLASSIFICATION / {selectedMonster.category}</p>
                    <h2>{selectedMonster.name}</h2>
                    <div className="book-rule"></div>
                    <p className="book-entry">{selectedMonster.description}</p>

                    <div className="book-stat-line">
                      <span>THREAT LEVEL</span>
                      <strong>{selectedMonster.threat}</strong>
                    </div>
                    <div className="book-stat-line">
                      <span>KNOWN WEAKNESS</span>
                      <strong>{selectedMonster.weakness}</strong>
                    </div>
                  </div>

                  <div className="bestiary-book-page bestiary-book-page-right">
                    {getMonsterImage(selectedMonster) && <img className="bestiary-book-creature-image" src={getMonsterImage(selectedMonster)} alt={selectedMonster.name} />}
                    <div className="book-page-number">PAGE {String(monsters.findIndex((item) => item.name === selectedMonster.name) * 2 + 2).padStart(2, "0")}</div>
                    <p className="book-kicker">HUNTER'S FIELD NOTES</p>

                    <div className="book-note-block">
                      <span>KNOWN SIGNS</span>
                      <p>{selectedMonster.signs}</p>
                    </div>

                    <div className="book-note-block">
                      <span>CASE LORE</span>
                      <p>{monsterConnections[selectedMonster.name]?.lore || `${selectedMonster.name} remains an active entry in the Winchester field guide. Compare witness accounts, physical evidence and related case records before closing the file.`}</p>
                    </div>

                    <div className="book-warning-note">
                      <span>HUNTER NOTE</span>
                      <p>{monsterConnections[selectedMonster.name]?.hunterNote || "RECORD EVERY SIGN, VERIFY EACH LEAD AND KEEP THE FIELD FILE UPDATED."}</p>
                    </div>

                    <div className="book-related">
                      <span>CONNECTED FILES</span>
                      <div className="book-related-list">
                        {(monsterConnections[selectedMonster.name]?.cases || []).map((caseId) => (
                          <button key={caseId} onClick={() => openCaseFromBook(caseId)}>CASE {caseId} →</button>
                        ))}
                        {(monsterConnections[selectedMonster.name]?.locations || []).map((locationName) => (
                          <button key={locationName} onClick={() => {
                            const location = locations.find((item) => item.name === locationName);
                            if (location) openLocation(location);
                          }}>LOCATION {locationName} →</button>
                        ))}
                        {!(monsterConnections[selectedMonster.name]?.cases?.length || monsterConnections[selectedMonster.name]?.locations?.length) && (
                          <em>NO CONNECTED CASES OR LOCATIONS ARE CURRENTLY FILED.</em>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bestiary-book-footer">
                  <button className="book-back-button" onClick={() => { setSelectedMonster(null); setTimeout(() => document.getElementById("bestiary")?.scrollIntoView({ behavior: "smooth", block: "start" }), 50); }}>← CLOSE BOOK / RETURN TO INDEX</button>
                  <span>WINCHESTER ARCHIVE / DO NOT REMOVE</span>
                </div>
              </div>
            </section>
          )}

          {/* =====================================================
              UPGRADE 12 — HUNTER COMMAND CENTER
          ===================================================== */}
          <section id="command-center" className="command-center-section">
            <div className="command-noise"></div>
            <div className="command-grid-lines"></div>

            <div className="command-inner">
              <div className="section-heading command-heading">
                <p className="section-number">09 / HUNTER COMMAND CENTER</p>
                <h2>THE HUNTING COMPUTER.</h2>
                <p>One screen for the route, the cases and the stories that matter before hitting the road.</p>
              </div>

              <div className="road-trip-explainer">
                <div className="road-trip-icon">◉</div>
                <div>
                  <span>WHAT IS ROAD TRIP MODE?</span>
                  <strong>A CINEMATIC VIEW OF THE HUNT</strong>
                  <p>Road Trip Mode is the site's cinematic experience mode. Press the ROAD TRIP button or the <b>R</b> key to switch it on or off. It adds a darker, more atmospheric presentation to the hero and road-focused sections while keeping the website fully usable.</p>
                </div>
              </div>

              <div className="command-terminal">
                <div className="command-terminal-top">
                  <div>
                    <span>WINCHESTER HUNTER NETWORK</span>
                    <strong>COMMAND CENTER / ONLINE</strong>
                  </div>
                  <div className="command-live"><i></i> SYSTEM ONLINE</div>
                </div>

                <div className="command-dashboard">
                  <div className="command-main-panel">
                    <div className="command-panel-label">HUNTER STATUS</div>
                    <div className="hunter-identity">
                      <div className="hunter-sigil">✦</div>
                      <div>
                        <span>FIELD OPERATIVE</span>
                        <h3>WINCHESTER ARCHIVE</h3>
                        <p>ROAD UNIT / ACTIVE</p>
                      </div>
                    </div>

                    <div className="command-clock">
                      <span>LOCAL FIELD TIME</span>
                      <strong>{hunterTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</strong>
                      <small>{hunterTime.toLocaleDateString([], { weekday: "long", year: "numeric", month: "short", day: "numeric" })}</small>
                    </div>

                    <div className="command-system-list">
                      <div><span>DATABASE</span><b>CONNECTED</b></div>
                      <div><span>ROAD MAP</span><b>ACTIVE</b></div>
                      <div><span>BESTIARY</span><b>SYNCED</b></div>
                      <div><span>ARCHIVE</span><b>SECURE</b></div>
                    </div>
                  </div>

                  <div className="command-stats-panel">
                    <div className="command-panel-label">ARCHIVE METRICS</div>
                    <div className="command-stats-grid">
                      {hunterStats.map((stat) => (
                        <div className="command-stat" key={stat.label}>
                          <strong>{stat.value}</strong>
                          <span>{stat.label}</span>
                        </div>
                      ))}
                    </div>

                    <div className="command-threat-panel">
                      <div className="command-panel-label">THREAT MONITOR</div>
                      <div className="threat-bars">
                        {threatLevels.map((level) => (
                          <div className="threat-row" key={level.name}>
                            <span>{level.name}</span>
                            <div><i style={{ width: level.width }}></i></div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="command-cases">
                  <div className="command-cases-header">
                    <div>
                      <span>ACTIVE CASE DATABASE</span>
                      <strong>SELECT A FILE TO REVIEW</strong>
                    </div>
                    <b>{commandCases.length.toString().padStart(2, "0")} ACTIVE</b>
                  </div>

                  <div className="command-case-list">
                    {commandCases.map((caseFile) => (
                      <button
                        key={caseFile.id}
                        className={`command-case-row ${activeCommandCase === caseFile.id ? "active" : ""}`}
                        onClick={() => openCommandCase(caseFile.id)}
                      >
                        <span className="case-id">{caseFile.id}</span>
                        <span className="case-title">{caseFile.title}</span>
                        <span>{caseFile.location}</span>
                        <span className={`case-threat threat-${caseFile.threat.toLowerCase()}`}>{caseFile.threat}</span>
                        <span className="case-status">{caseFile.status}</span>
                      </button>
                    ))}
                  </div>

                  {(() => {
                    const activeCase = commandCases.find((item) => item.id === activeCommandCase) || commandCases[0];
                    return (
                      <div id="command-case-detail" className="command-case-detail">
                        <div className="classified-stamp">CLASSIFIED</div>
                        <div>
                          <span>SELECTED FILE / {activeCase.id}</span>
                          <h3>{activeCase.title}</h3>
                          <p>{activeCase.note}</p>
                        </div>
                        <div className="case-detail-meta">
                          <div><span>LOCATION</span><strong>{activeCase.location}</strong></div>
                          <div><span>THREAT</span><strong>{activeCase.threat}</strong></div>
                          <div><span>STATUS</span><strong>{activeCase.status}</strong></div>
                        </div>
                        {activeCase.monster && (
                          <button className="case-bestiary-link" onClick={() => openMonsterByName(activeCase.monster)}>
                            <span>BESTIARY CONNECTION</span>
                            <strong>{activeCase.monster}</strong>
                            <b>TURN TO BOOK PAGE →</b>
                          </button>
                        )}
                      </div>
                    );
                  })()}
                </div>

                <div className="command-shortcuts">
                  <span>QUICK COMMANDS</span>
                  <button onClick={() => document.getElementById("road-map")?.scrollIntoView({ behavior: "smooth" })}><b>R</b> ROAD MAP</button>
                  <button onClick={() => document.getElementById("bestiary")?.scrollIntoView({ behavior: "smooth" })}><b>B</b> BESTIARY</button>
                  <button onClick={() => document.getElementById("journal")?.scrollIntoView({ behavior: "smooth" })}><b>J</b> JOURNAL</button>
                  <button onClick={() => setCinemaMode((current) => !current)}><b>C</b> CINEMA</button>
                  <button onClick={toggleMusic}><b>M</b> MUSIC</button>
                </div>
              </div>
            </div>
          </section>

          <section id="lore" className="lore-section">
            <div className="lore-background"></div>

            <div className="lore-content">
              <p className="section-number">
                05 / THE SUPERNATURAL WORLD
              </p>

              <h2>
                HUNTING
                <br />
                NEVER ENDS.
              </h2>

              <p>
                Demons. Angels. Ghosts. Monsters.
                Ancient legends and things that go bump
                in the night. The Winchesters have seen it all.
              </p>

              <div className="threat-image-grid">
                {getRouteImages("threats").map((asset) => {
                  const name = readableAssetName(asset.path).toUpperCase();
                  const existing = lore.find((item) => item.name.toUpperCase() === name);
                  const item = { ...(existing || { name, icon: "", description: `${name} is recorded in the Winchester supernatural threat archive.`, characteristics: "A documented supernatural threat from the hunter files.", hunting: "Review the case history and connected archive records." }), imageUrl: asset.url, imageAlt: name };
                  return <button className="threat-image-card" key={asset.path} onClick={() => openLore(item)}>
                    <img src={asset.url} alt={name} loading="lazy" />
                    <span>THREAT FILE</span><strong>{name}</strong><small>OPEN FILE ↗</small>
                  </button>;
                })}
              </div>
            </div>
          </section>

          {selectedLore && (
            <section
              id="lore-detail"
              className="lore-detail-section"
            >
              <div className="lore-detail-glow"></div>

              <div className="lore-detail-content strongest-being-detail-panel lore-cinematic-panel">
                <div className="lore-cinematic-art">
                  {selectedLore.imageUrl ? <img className="lore-cinematic-image" src={selectedLore.imageUrl} alt={selectedLore.imageAlt || selectedLore.name} /> : <div className="lore-detail-icon">{selectedLore.icon || "✦"}</div>}
                  <span>SUPERNATURAL THREAT FILE</span>
                </div>
                <div className="strongest-being-detail-copy lore-cinematic-copy">

                <p className="section-number">
                  THE SUPERNATURAL WORLD
                </p>

                <h2>{selectedLore.name}</h2>

                <div className="lore-detail-line"></div>

                <p className="lore-detail-description">
                  {selectedLore.description}
                </p>

                <div className="lore-info-grid">
                  <div className="lore-info-box">
                    <span>CHARACTERISTICS</span>
                    <p>{selectedLore.characteristics}</p>
                  </div>

                  <div className="lore-info-box">
                    <span>THE HUNT</span>
                    <p>{selectedLore.hunting}</p>
                  </div>
                </div>

                <button
                  className="back-lore-button"
                  onClick={closeLore}
                >
                  ← BACK TO LORE
                </button>
                </div>
              </div>
            </section>
          )}

          <section id="journal" className="journal-section">
            <div className="journal-background"></div>

            <div className="journal-inner">
              <div className="section-heading journal-heading">
                <p className="section-number">
                  06 / THE HUNTER'S ARCHIVE
                </p>

                <h2>THE HUNTER'S JOURNAL.</h2>

                <p>
                  Case files, evidence and field notes collected from years on the road.
                  Every hunt has a story. Every clue points somewhere.
                </p>
              </div>

              <div className="journal-header">
                <div>
                  <span>WINCHESTER FAMILY ARCHIVE</span>
                  <strong>HUNTER'S JOURNAL</strong>
                </div>

                <div className="journal-stamp">
                  CLASSIFIED
                </div>
              </div>

              <div className="case-grid">
                {cases.map((caseFile) => (
                  <button
                    className="case-card"
                    key={caseFile.number}
                    onClick={() => openCase(caseFile)}
                  >
                    <div className="case-paper-texture"></div>

                    <div className="case-top">
                      <span>CASE FILE #{caseFile.number}</span>
                      <b>{caseFile.status}</b>
                    </div>

                    <div className="case-title">
                      <h3>{caseFile.title}</h3>
                      <span>{caseFile.classification}</span>
                    </div>

                    <div className="case-info">
                      <div>
                        <small>LOCATION</small>
                        <strong>{caseFile.location}</strong>
                      </div>

                      <div>
                        <small>THREAT</small>
                        <strong>{caseFile.threat}</strong>
                      </div>
                    </div>

                    <p>{caseFile.description}</p>

                    <div className="case-bottom">
                      <span>{caseFile.date}</span>
                      <strong>OPEN FILE →</strong>
                    </div>
                  </button>
                ))}
              </div>

              <div className="upgrade14-journal-tools">
                <div className="upgrade14-tools-heading">
                  <span>UPGRADE 14 / FIELD INTELLIGENCE</span>
                  <strong>FOLLOW THE EVIDENCE.</strong>
                </div>

                <div className="upgrade14-tabs" role="tablist" aria-label="Hunter journal tools">
                  <button className={journalView === "CASES" ? "active" : ""} onClick={() => setJournalView("CASES")} role="tab" aria-selected={journalView === "CASES"}>CASE FILES</button>
                  <button className={journalView === "EVIDENCE" ? "active" : ""} onClick={() => setJournalView("EVIDENCE")} role="tab" aria-selected={journalView === "EVIDENCE"}>EVIDENCE BOARD</button>
                  <button className={journalView === "NOTES" ? "active" : ""} onClick={() => setJournalView("NOTES")} role="tab" aria-selected={journalView === "NOTES"}>FIELD NOTES</button>
                </div>

                {journalView === "CASES" && (
                  <div className="upgrade14-case-guide">
                    <span>HOW THE FILES CONNECT</span>
                    <p>Open a case, follow its creature into the <b>Bestiary book</b>, or follow its location back to the <b>Road Map</b>.</p>
                  </div>
                )}

                {journalView === "EVIDENCE" && (
                  <div className="upgrade14-evidence-layout">
                    <div className="upgrade14-evidence-board">
                      <div className="evidence-board-header">
                        <span>EVIDENCE BOARD / CROSS-REFERENCED FILES</span>
                        <b>09 CONNECTIONS</b>
                      </div>

                      <div className="evidence-board-grid">
                        {evidenceFiles.map((file) => (
                          <button key={file.id} className={`evidence-file evidence-${file.action.toLowerCase()}`} onClick={() => openEvidenceFile(file)}>
                            <span className="evidence-pin">●</span>
                            <small>{file.id} / {file.type}</small>
                            <strong>{file.title}</strong>
                            <em>{file.meta}</em>
                            <p>{file.description}</p>
                            <b>FOLLOW FILE →</b>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="upgrade14-connection-legend">
                      <span>CONNECTION MAP</span>
                      <div><i className="legend-dot legend-case"></i> CASE</div>
                      <div><i className="legend-dot legend-monster"></i> BESTIARY</div>
                      <div><i className="legend-dot legend-location"></i> ROAD MAP</div>
                      <p>Every evidence card is a live link. Follow the trail instead of opening another window.</p>
                    </div>
                  </div>
                )}

                {journalView === "NOTES" && (
                  <div className="upgrade14-notes-layout">
                    <div className="field-notes-grid">
                      {fieldNotes.map((note) => (
                        <button key={note.id} className={`field-note-card ${selectedFieldNote?.id === note.id ? "active" : ""}`} onClick={() => setSelectedFieldNote(note)}>
                          <span>{note.id} / {note.tag}</span>
                          <strong>{note.title}</strong>
                          <small>— {note.author}</small>
                        </button>
                      ))}
                    </div>

                    <div className="field-note-reading-page">
                      {selectedFieldNote ? (
                        <>
                          <span>FIELD NOTE / {selectedFieldNote.id}</span>
                          <h3>{selectedFieldNote.title}</h3>
                          <div className="field-note-rule"></div>
                          <p>“{selectedFieldNote.text}”</p>
                          <small>— {selectedFieldNote.author}</small>
                        </>
                      ) : (
                        <>
                          <span>FIELD NOTEBOOK</span>
                          <h3>SELECT A NOTE.</h3>
                          <p>Choose a handwritten field note to read it on the journal page.</p>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>

          {selectedCase && (
            <section
              id="case-detail"
              className="case-detail-section"
            >
              <div className="case-detail-paper">
                <div className="case-detail-top">
                  <div>
                    <span>WINCHESTER FAMILY ARCHIVE</span>

                    <h4>
                      CASE FILE #{selectedCase.number}
                    </h4>
                  </div>

                  <div className="case-detail-stamp">
                    {selectedCase.status}
                  </div>
                </div>

                <div className="case-detail-divider"></div>

                <div className="case-detail-heading">
                  <p>{selectedCase.classification}</p>
                  <h2>{selectedCase.title}</h2>
                </div>

                <div className="case-detail-meta">
                  <div>
                    <span>LOCATION</span>
                    <strong>{selectedCase.location}</strong>
                  </div>

                  <div>
                    <span>THREAT</span>
                    <strong>{selectedCase.threat}</strong>
                  </div>

                  <div>
                    <span>DATE</span>
                    <strong>{selectedCase.date}</strong>
                  </div>

                  <div>
                    <span>STATUS</span>
                    <strong>{selectedCase.status}</strong>
                  </div>
                </div>

                <div className="case-detail-story">
                  <span>CASE NOTES</span>

                  <p>{selectedCase.description}</p>

                  <p>{selectedCase.details}</p>
                </div>

                <div className="case-detail-warning">
                  <span>HUNTER'S NOTE</span>

                  <p>
                    Trust your instincts. Do your research.
                    Never walk into a hunt without a plan.
                  </p>
                </div>

                <div className="case-detail-signature">
                  <span>ARCHIVED BY</span>
                  <strong>WINCHESTER FAMILY</strong>
                </div>

                <button
                  className="back-case-button"
                  onClick={closeCase}
                >
                  ← BACK TO JOURNAL
                </button>
              </div>
            </section>
          )}

          <section className="quote-section">
            <div className="quote-mark">“</div>

            <blockquote>
              Family isn't just something you're born into.
              It's something you fight for.
            </blockquote>

            <span>— THE WINCHESTER WAY</span>
          </section>



          <section id="museum" className="section museum-section">
            <div className="section-heading museum-heading">
              <p className="section-number">12 / THE HUNTER'S COLLECTION</p>
              <h2>THE WINCHESTER MUSEUM.</h2>
              <p>Weapons, relics and tools collected along the road. Select an artifact to open its archive file.</p>
            </div>
            <div className="museum-artifact-grid">
              {museumItems.map((item) => (
                <button className="museum-artifact-card" key={item.number} onClick={() => openMuseumItem(item)}>
                  <div className="museum-artifact-image">
                    {item.image ? <img src={item.image} alt={item.name} loading="lazy" /> : <div className="museum-image-fallback">✦</div>}
                    <div className="museum-artifact-shade"></div>
                  </div>
                  <span className="museum-artifact-number">{item.number}</span>
                  <div className="museum-artifact-copy"><small>{item.category}</small><h3>{item.name}</h3><span>EXAMINE ARTIFACT →</span></div>
                </button>
              ))}
            </div>
          </section>

          {selectedMuseumItem && (
            <section id="museum-detail" className="museum-detail-section">
              <div className="museum-detail-card">
                <div className="museum-detail-image">{selectedMuseumItem.image && <img src={selectedMuseumItem.image} alt={selectedMuseumItem.name} />}</div>
                <div className="museum-detail-copy">
                  <p className="section-number">WINCHESTER MUSEUM / ARTIFACT {selectedMuseumItem.number}</p>
                  <span>{selectedMuseumItem.category}</span>
                  <h2>{selectedMuseumItem.name}</h2>
                  <div className="museum-detail-rule"></div>
                  <p>{selectedMuseumItem.description}</p>
                  <button className="museum-back-button" onClick={closeMuseumItem}>← BACK TO MUSEUM</button>
                </div>
              </div>
            </section>
          )}

          <section id="gallery" className="section gallery">
            <div className="section-heading">
              <p className="section-number">07 / THE ARCHIVE</p>

              <h2>THE ROAD SO FAR</h2>

              <p>
                Four moments from the world of Supernatural.
                Click any image to explore the archive.
              </p>
            </div>

            <div className="gallery-grid">
              {gallery.map((item, index) => (
                <button
                  className={`gallery-item gallery-item-${index + 1}`}
                  key={item.image}
                  onClick={() => openGallery(index)}
                  aria-label={`Open ${item.title}`}
                >
                  <img
                    src={item.image}
                    alt={item.title}
                  />

                  <div className="gallery-item-overlay"></div>

                  <div className="gallery-item-content">
                    <span>
                      0{index + 1} / 04
                    </span>

                    <strong>{item.title}</strong>

                    <small>VIEW ARCHIVE →</small>
                  </div>
                </button>
              ))}
            </div>
          </section>

          {selectedGallery !== null && (
            <div
              className="gallery-lightbox"
              onClick={(event) => {
                if (
                  event.target.classList.contains(
                    "gallery-lightbox"
                  )
                ) {
                  closeGallery();
                }
              }}
            >
              <button
                className="gallery-close"
                onClick={closeGallery}
                aria-label="Close gallery"
              >
                ×
              </button>

              <button
                className="gallery-prev"
                onClick={previousGallery}
                aria-label="Previous image"
              >
                ←
              </button>

              <div className="gallery-lightbox-content">
                <div className="gallery-counter">
                  {String(selectedGallery + 1).padStart(2, "0")} / 04
                </div>

                <div className="gallery-large-image">
                  <img
                    src={gallery[selectedGallery].image}
                    alt={gallery[selectedGallery].title}
                  />
                </div>

                <div className="gallery-large-info">
                  <p>
                    {gallery[selectedGallery].title}
                  </p>

                  <span>
                    {gallery[selectedGallery].description}
                  </span>
                </div>
              </div>

              <button
                className="gallery-next"
                onClick={nextGallery}
                aria-label="Next image"
              >
                →
              </button>

              <div className="gallery-keyboard">
                ← PREV &nbsp;&nbsp; • &nbsp;&nbsp;
                ESC CLOSE &nbsp;&nbsp; • &nbsp;&nbsp;
                NEXT →
              </div>
            </div>
          )}

          <section id="death-reapers" className="death-reapers-section">
            <div className="section-heading">
              <p className="section-number">10 / THE AFTERLIFE ARCHIVE</p>
              <h2>DEATH & REAPERS.</h2>
              <p>Files on the reapers and the forces connected to the passage between life and death.</p>
            </div>
            <div className="death-reapers-grid">
              {getRouteImages("death-reapers").map((asset, index) => {
                const name = readableAssetName(asset.path).toUpperCase();
                const notes = {
                  "BILLIE REAPER DEATH": "Billie rises through the cosmic order and becomes a major figure in the afterlife.",
                  "DEATH": "An ancient cosmic force whose role is tied to the natural order.",
                  "FAITH REAPER": "A reaper whose story intersects with the Winchesters and the boundary between life and death.",
                  "TESSA REAPER": "A reaper encountered by the Winchesters whose work concerns the passage between worlds."
                };
                return <article className="death-reaper-card" key={asset.path}>
                  <button onClick={() => { setSelectedReaper({ name, image: asset.url, description: notes[name] || `${name} appears in the Winchester afterlife archive.` }); setTimeout(() => document.getElementById("death-reaper-detail")?.scrollIntoView({ behavior: "smooth", block: "start" }), 100); }}>
                    <img src={asset.url} alt={name} loading="lazy" />
                    <span>AFTERLIFE FILE / {String(index + 1).padStart(2, "0")}</span>
                    <strong>{name}</strong><small>VIEW RECORD ↗</small>
                  </button>
                </article>;
              })}
            </div>
          </section>

          {selectedReaper && (
            <section id="death-reaper-detail" className="death-reaper-detail-section">
              <div className="death-reaper-detail-card">
                {selectedReaper.image && <img src={selectedReaper.image} alt={selectedReaper.name} />}
                <div className="death-reaper-detail-copy">
                  <span>AFTERLIFE ARCHIVE / CLASSIFIED FILE</span>
                  <h2>{selectedReaper.name}</h2>
                  <p>{selectedReaper.description}</p>
                  <p>Recorded in the Winchester archive as a figure connected to the passage between life and death.</p>
                  <button onClick={() => { setSelectedReaper(null); document.getElementById("death-reapers")?.scrollIntoView({ behavior: "smooth", block: "start" }); }}>← BACK TO DEATH & REAPERS</button>
                </div>
              </div>
            </section>
          )}

          <section id="strongest-beings" className="strongest-beings-section" aria-label="Strongest beings in Supernatural">
            <div className="strongest-beings-hero">
              <p className="section-number">POWER CLASSIFICATION // COSMIC THREAT INDEX</p>
              <h1>THE STRONGEST BEINGS</h1>
              <p className="strongest-beings-intro">From primordial forces to archangels, these entities shape reality itself. Rankings are an editorial power scale, not an official in-universe measurement.</p>
            </div>
            <div className="strongest-beings-grid">
              {[
                { name: "CHUCK SHURLEY", title: "GOD / THE AUTHOR", file: "chuck-god.jpg", rank: "01", description: "The creator of the universe and the force behind the story's design; his power reaches across creation." },
                { name: "AMARA", title: "THE DARKNESS", file: "amara.jpg", rank: "02", description: "An ancient cosmic force who existed before creation and can rival God himself." },
                { name: "THE EMPTY", title: "PRIMORDIAL VOID", file: "the-empty.jpg", rank: "03", description: "A primordial realm and entity connected to the final rest of angels and demons." },
                { name: "MICHAEL", title: "ARCHANGEL", file: "michael.jpg", rank: "04", description: "One of Heaven's mightiest archangels, carrying immense celestial power." },
                { name: "LUCIFER", title: "ARCHANGEL / ADVERSARY", file: "lucifer.jpg", rank: "05", description: "A fallen archangel whose power threatens Heaven, Hell, and the human world." },
                { name: "GABRIEL", title: "ARCHANGEL / TRICKSTER", file: "gabriel.jpg", rank: "06", description: "A powerful archangel known for reality-bending tricks, illusions, and formidable combat ability." },
                { name: "JACK KLINE", title: "NEPHILIM", file: "jack-kline.jpg", rank: "07", description: "A Nephilim born with extraordinary potential whose power grows to cosmic proportions." },
              ].map((being) => (
                <button type="button" className={`strongest-being-card ${being.file === "chuck-god.jpg" ? "strongest-being-card--chuck" : ""} ${selectedStrongestBeing?.file === being.file ? "is-selected" : ""}`} key={being.file} onClick={() => {
                  setSelectedStrongestBeing(being);
                  setTimeout(() => document.getElementById("strongest-being-detail")?.scrollIntoView({ behavior: "smooth", block: "center" }), 80);
                }}>
                  <div className="strongest-being-image-wrap">
                    <img className={being.file === "chuck-god.jpg" ? "strongest-being-portrait--chuck" : ""} src={findLocalAsset("the-stongest-beigns", being.file)} alt={being.name} loading="lazy" />
                    <span className="strongest-being-rank">{being.rank}</span>
                    <span className="strongest-being-image-shade" aria-hidden="true" />
                  </div>
                  <div className="strongest-being-copy">
                    <p className="strongest-being-title">{being.title}</p>
                    <h2>{being.name}</h2>
                    <p className="strongest-being-description">{being.description}</p>
                    <span className="strongest-being-open">OPEN COSMIC FILE →</span>
                  </div>
                </button>
              ))}
            </div>
            {selectedStrongestBeing && (
              <div id="strongest-being-detail" className="strongest-being-detail-panel">
                <div className="strongest-being-detail-image">
                  <img src={findLocalAsset("the-stongest-beigns", selectedStrongestBeing.file)} alt={selectedStrongestBeing.name} />
                </div>
                <div className="strongest-being-detail-copy">
                  <span>COSMIC THREAT INDEX / FILE {selectedStrongestBeing.rank}</span>
                  <h2>{selectedStrongestBeing.name}</h2>
                  <h3>{selectedStrongestBeing.title}</h3>
                  <p>{selectedStrongestBeing.description}</p>
                  <button type="button" onClick={() => setSelectedStrongestBeing(null)}>CLOSE FILE ×</button>
                </div>
              </div>
            )}
          </section>

          {/* UPGRADE 10 — experience HUD */}
          <div className="upgrade10-hud">
            <span className={cinemaMode ? "hud-live" : ""}>
              {cinemaMode ? "ROAD TRIP MODE" : "NORMAL MODE"}
            </span>
            <i></i>
            <span>{showAtmosphere ? "ATMOSPHERE ON" : "ATMOSPHERE OFF"}</span>
            <i></i>
            <span>M MUSIC</span>
            <span>R ROAD TRIP</span>
          </div>

          <footer>
            <div className="footer-logo">SUPERNATURAL</div>

            <p>THE ROAD SO FAR.</p>

            <div className="footer-line"></div>

            <span>SUPERNATURAL WEBSITE. CREATED BY NITIN DEVKAR</span>

            <div className="carry-on">CARRY ON.</div>
          </footer>
        </main>
      )}
    </div>
  );
}

export default App;
import { useState, useEffect, useRef } from "react";
import { submitScore } from "./api/submitScore";

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────
const QUESTIONS_PER_QUIZ = 10;
const TIMER_SECONDS = 15;
const QUIZ_VERSION = "1.0";
const SITE_URL = "https://khowpaquiz.essencetechnologies.com";
const MAX_POINTS_PER_Q = TIMER_SECONDS * 1000 * 10; // 150 000

// ─────────────────────────────────────────────────────────────────────────────
// Badge tiers (5 categories, based on correct answer count out of 10)
// ─────────────────────────────────────────────────────────────────────────────
const BADGES = [
  { minCorrect: 10, name: "Legend",     nameNp: "किंवदन्ती",  emoji: "🏆", bgStart: "#B8860B", bgEnd: "#4A2500" },
  { minCorrect: 8,  name: "Expert",     nameNp: "विशेषज्ञ",  emoji: "🥇", bgStart: "#8B1A1A", bgEnd: "#4A0000" },
  { minCorrect: 6,  name: "Scholar",    nameNp: "विद्वान",   emoji: "🥈", bgStart: "#1A3A6B", bgEnd: "#0A1E3D" },
  { minCorrect: 4,  name: "Learner",    nameNp: "अध्येता",   emoji: "🥉", bgStart: "#1A5C2A", bgEnd: "#0A2A10" },
  { minCorrect: 0,  name: "Beginner",   nameNp: "नवसिखारु", emoji: "📜", bgStart: "#4A4A4A", bgEnd: "#1A1A1A" },
];

function getBadge(correctCount) {
  return BADGES.find((b) => correctCount >= b.minCorrect) ?? BADGES[BADGES.length - 1];
}

/** Draw the badge image onto a given <canvas> element */
function drawBadge(canvas, { badgeName, emoji, bgStart, bgEnd, correctCount, totalQuestions, pointsScore, username }) {
  const ctx = canvas.getContext("2d");
  const w = canvas.width;
  const h = canvas.height;

  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, bgStart);
  grad.addColorStop(1, bgEnd);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  // Border
  ctx.strokeStyle = "#D4A017";
  ctx.lineWidth = 8;
  ctx.strokeRect(4, 4, w - 8, h - 8);

  // Title
  ctx.fillStyle = "#D4A017";
  ctx.font = "bold 22px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("KHOWPA QUIZ", w / 2, 46);

  // Subtitle line
  ctx.fillStyle = "rgba(212,160,23,0.6)";
  ctx.fillRect(40, 54, w - 80, 2);

  // Emoji
  ctx.font = "84px sans-serif";
  ctx.fillText(emoji, w / 2, 160);

  // Badge name
  ctx.fillStyle = "#FFFFFF";
  ctx.font = "bold 38px sans-serif";
  ctx.fillText(badgeName.toUpperCase(), w / 2, 215);

  // Correct count
  ctx.font = "bold 30px sans-serif";
  ctx.fillStyle = "#D4A017";
  ctx.fillText(`${correctCount} / ${totalQuestions} Correct`, w / 2, 265);

  // Points
  ctx.font = "22px sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.85)";
  ctx.fillText(`${pointsScore.toLocaleString()} pts`, w / 2, 300);

  // Username
  ctx.fillStyle = "#FFFFFF";
  ctx.font = "bold 20px sans-serif";
  ctx.fillText(username, w / 2, 340);

  // Domain
  ctx.fillStyle = "rgba(212,160,23,0.8)";
  ctx.font = "14px sans-serif";
  ctx.fillText(SITE_URL.replace("https://", ""), w / 2, 375);
}

/** Fisher-Yates shuffle (returns a new array) */
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ─────────────────────────────────────────────────────────────────────────────
// Shared small components (defined outside App to avoid re-creation on render)
// ─────────────────────────────────────────────────────────────────────────────
function GoldBar() {
  return (
    <div className="w-full h-2 bg-gradient-to-r from-[#8B1A1A] via-[#D4A017] to-[#8B1A1A] rounded-full" />
  );
}

function LangBtn({ lang, onToggle }) {
  return (
    <button
      onClick={onToggle}
      className="absolute top-4 right-4 bg-[#8B1A1A] text-[#D4A017] text-sm font-bold px-3 py-1 rounded-full hover:bg-[#6B3F1F] transition-colors no-print"
      title="Switch language / भाषा परिवर्तन"
    >
      {lang === "en" ? "नेपाली" : "English"}
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 30 bilingual questions about Bhaktapur (Khwopa)
// Each question has { id, image?, en: { question, options[], answer }, np: {...} }
// Options are in the same order in both languages so indices are consistent.
// ─────────────────────────────────────────────────────────────────────────────
const ALL_QUESTIONS = [
  {
    id: 1,
    image: null,
    en: {
      question: "What is the ancient name of Bhaktapur?",
      options: ["Lalitpur", "Kantipur", "Khwopa", "Kirtipur"],
      answer: "Khwopa",
    },
    np: {
      question: "भक्तपुरको प्राचीन नाम के हो?",
      options: ["ललितपुर", "कान्तिपुर", "ख्वप", "कीर्तिपुर"],
      answer: "ख्वप",
    },
  },
  {
    id: 2,
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/ad/55_Window_Palace%2C_Bhaktapur.jpg/320px-55_Window_Palace%2C_Bhaktapur.jpg",
    en: {
      question: "Which king built the famous 55-Window Palace (Pachpanna Jhyale Durbar) in Bhaktapur?",
      options: ["King Pratap Malla", "King Bhupatindra Malla", "King Yaksha Malla", "King Mahendra Malla"],
      answer: "King Bhupatindra Malla",
    },
    np: {
      question: "भक्तपुरको प्रसिद्ध पचपन्न झ्याले दरबार कुन राजाले बनाएका थिए?",
      options: ["राजा प्रताप मल्ल", "राजा भूपतीन्द्र मल्ल", "राजा यक्ष मल्ल", "राजा महेन्द्र मल्ल"],
      answer: "राजा भूपतीन्द्र मल्ल",
    },
  },
  {
    id: 3,
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/69/Nyatapola_temple.jpg/320px-Nyatapola_temple.jpg",
    en: {
      question: "The Nyatapola Temple in Bhaktapur is dedicated to which deity?",
      options: ["Kumari", "Siddhi Lakshmi", "Taleju", "Bhairav"],
      answer: "Siddhi Lakshmi",
    },
    np: {
      question: "भक्तपुरको न्यातापोल मन्दिर कुन देवीलाई समर्पित छ?",
      options: ["कुमारी", "सिद्धि लक्ष्मी", "तलेजु", "भैरव"],
      answer: "सिद्धि लक्ष्मी",
    },
  },
  {
    id: 4,
    image: null,
    en: {
      question: "How many storeys does the Nyatapola Temple have?",
      options: ["3", "4", "5", "7"],
      answer: "5",
    },
    np: {
      question: "न्यातापोल मन्दिरमा कति तल्ला छन्?",
      options: ["३", "४", "५", "७"],
      answer: "५",
    },
  },
  {
    id: 5,
    image: null,
    en: {
      question: "Which major festival unique to Bhaktapur celebrates the Nepali New Year?",
      options: ["Indra Jatra", "Biska Jatra", "Gai Jatra", "Mha Puja"],
      answer: "Biska Jatra",
    },
    np: {
      question: "नेपाली नयाँ वर्ष मनाउने भक्तपुरको प्रमुख पर्व कुन हो?",
      options: ["इन्द्र जात्रा", "बिस्का जात्रा", "गाई जात्रा", "म्ह पूजा"],
      answer: "बिस्का जात्रा",
    },
  },
  {
    id: 6,
    image: null,
    en: {
      question: "Bhaktapur is especially famous for which traditional craft?",
      options: ["Thangka Painting", "Wood Carving", "Pottery", "Weaving"],
      answer: "Pottery",
    },
    np: {
      question: "भक्तपुर कुन परम्परागत सिपका लागि विशेष प्रसिद्ध छ?",
      options: ["थाङ्का चित्रकला", "काठ कुँदाई", "माटो कला (कुमाल)", "बुनाई"],
      answer: "माटो कला (कुमाल)",
    },
  },
  {
    id: 7,
    image: null,
    en: {
      question: "In which province of Nepal is Bhaktapur located?",
      options: ["Madhesh Province", "Gandaki Province", "Bagmati Province", "Lumbini Province"],
      answer: "Bagmati Province",
    },
    np: {
      question: "भक्तपुर नेपालको कुन प्रदेशमा पर्छ?",
      options: ["मधेश प्रदेश", "गण्डकी प्रदेश", "बागमती प्रदेश", "लुम्बिनी प्रदेश"],
      answer: "बागमती प्रदेश",
    },
  },
  {
    id: 8,
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/93/Bhaktapur_Durbar_Square.jpg/320px-Bhaktapur_Durbar_Square.jpg",
    en: {
      question: "Which square in Bhaktapur is a UNESCO World Heritage Site?",
      options: ["Patan Durbar Square", "Kathmandu Durbar Square", "Bhaktapur Durbar Square", "Taumadhi Square"],
      answer: "Bhaktapur Durbar Square",
    },
    np: {
      question: "भक्तपुरको कुन दरबार क्षेत्र युनेस्को विश्व सम्पदा स्थल हो?",
      options: ["पाटन दरबार क्षेत्र", "काठमाडौं दरबार क्षेत्र", "भक्तपुर दरबार क्षेत्र", "तौमढी चोक"],
      answer: "भक्तपुर दरबार क्षेत्र",
    },
  },
  {
    id: 9,
    image: null,
    en: {
      question: "Bhaktapur is also known as the 'City of ___'.",
      options: ["Temples", "Devotees", "Festivals", "Craftsmen"],
      answer: "Devotees",
    },
    np: {
      question: "भक्तपुरलाई '___को शहर' पनि भनिन्छ।",
      options: ["मन्दिर", "भक्त", "पर्व", "शिल्पकार"],
      answer: "भक्त",
    },
  },
  {
    id: 10,
    image: null,
    en: {
      question: "Which traditional sweet dish is Bhaktapur most famous for?",
      options: ["Sel Roti", "Juju Dhau (King Curd)", "Chatamari", "Yomari"],
      answer: "Juju Dhau (King Curd)",
    },
    np: {
      question: "भक्तपुर कुन परम्परागत मिठाईका लागि सबैभन्दा प्रसिद्ध छ?",
      options: ["सेल रोटी", "जुजु धौ (राजा दही)", "चटामरी", "योमरी"],
      answer: "जुजु धौ (राजा दही)",
    },
  },
  {
    id: 11,
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/36/Peacock_window.jpg/300px-Peacock_window.jpg",
    en: {
      question: "The famous Peacock Window (Mayur Dhoka) in Bhaktapur is located at which building?",
      options: ["Taleju Temple", "Pujari Math", "Changu Narayan Temple", "Dattatreya Temple"],
      answer: "Pujari Math",
    },
    np: {
      question: "भक्तपुरको प्रसिद्ध मयूर झ्याल कुन भवनमा छ?",
      options: ["तलेजु मन्दिर", "पुजारी मठ", "चाङ्गुनारायण मन्दिर", "दत्तात्रेय मन्दिर"],
      answer: "पुजारी मठ",
    },
  },
  {
    id: 12,
    image: null,
    en: {
      question: "Changu Narayan Temple in Bhaktapur is dedicated to which Hindu god?",
      options: ["Shiva", "Brahma", "Vishnu", "Indra"],
      answer: "Vishnu",
    },
    np: {
      question: "भक्तपुरको चाङ्गुनारायण मन्दिर कुन हिन्दू देवतालाई समर्पित छ?",
      options: ["शिव", "ब्रह्मा", "विष्णु", "इन्द्र"],
      answer: "विष्णु",
    },
  },
  {
    id: 13,
    image: null,
    en: {
      question: "Which river flows near Bhaktapur city?",
      options: ["Bagmati River", "Bishnumati River", "Hanumante River", "Manohara River"],
      answer: "Hanumante River",
    },
    np: {
      question: "भक्तपुर सहरको नजिक कुन नदी बग्छ?",
      options: ["बागमती नदी", "विष्णुमती नदी", "हनुमन्ते नदी", "मनोहरा नदी"],
      answer: "हनुमन्ते नदी",
    },
  },
  {
    id: 14,
    image: null,
    en: {
      question: "What does 'Juju' mean in the Newari language?",
      options: ["Sweet", "King", "Old", "Holy"],
      answer: "King",
    },
    np: {
      question: "नेवारी भाषामा 'जुजु' को अर्थ के हो?",
      options: ["मिठो", "राजा", "पुरानो", "पवित्र"],
      answer: "राजा",
    },
  },
  {
    id: 15,
    image: null,
    en: {
      question: "Siddha Pokhari in Bhaktapur is a famous:",
      options: ["Mountain", "Pond / Lake", "Temple", "Palace"],
      answer: "Pond / Lake",
    },
    np: {
      question: "भक्तपुरको सिद्ध पोखरी एउटा प्रसिद्ध ___ हो।",
      options: ["पहाड", "पोखरी / ताल", "मन्दिर", "दरबार"],
      answer: "पोखरी / ताल",
    },
  },
  {
    id: 16,
    image: null,
    en: {
      question: "What is the local name of the Pottery Square in Bhaktapur?",
      options: ["Taumadhi Tole", "Dattatreya Tole", "Kumale Tole", "Sukuldhoka Tole"],
      answer: "Kumale Tole",
    },
    np: {
      question: "भक्तपुरको माटाको भाँडा बनाउने टोलको स्थानीय नाम के हो?",
      options: ["तौमढी टोल", "दत्तात्रेय टोल", "कुमाल टोल", "सुकुलढोका टोल"],
      answer: "कुमाल टोल",
    },
  },
  {
    id: 17,
    image: null,
    en: {
      question: "The Gai Jatra festival in Bhaktapur primarily honors:",
      options: ["The harvest season", "Recently departed souls", "The rainy season", "Lord Vishnu"],
      answer: "Recently departed souls",
    },
    np: {
      question: "भक्तपुरको गाई जात्रा मुख्यतः किसको सम्मानमा मनाइन्छ?",
      options: ["फसल मौसम", "हालसालै स्वर्गीय भएका आत्माहरू", "वर्षा ऋतु", "भगवान विष्णु"],
      answer: "हालसालै स्वर्गीय भएका आत्माहरू",
    },
  },
  {
    id: 18,
    image: null,
    en: {
      question: "How many main squares is Bhaktapur known for?",
      options: ["Two", "Three", "Four", "Five"],
      answer: "Three",
    },
    np: {
      question: "भक्तपुर कति वटा प्रमुख चोकका लागि परिचित छ?",
      options: ["दुई", "तीन", "चार", "पाँच"],
      answer: "तीन",
    },
  },
  {
    id: 19,
    image: null,
    en: {
      question: "The Dattatreya Temple in Bhaktapur stands in which square?",
      options: ["Durbar Square", "Taumadhi Square", "Dattatreya (Tachapal) Square", "Kumale Square"],
      answer: "Dattatreya (Tachapal) Square",
    },
    np: {
      question: "भक्तपुरको दत्तात्रेय मन्दिर कुन चोकमा अवस्थित छ?",
      options: ["दरबार चोक", "तौमढी चोक", "दत्तात्रेय (ताछपाल) चोक", "कुमाल चोक"],
      answer: "दत्तात्रेय (ताछपाल) चोक",
    },
  },
  {
    id: 20,
    image: null,
    en: {
      question: "What is 'Samay Baji' in Newari culture?",
      options: ["A musical instrument", "A traditional food platter", "A type of dance", "A religious ceremony"],
      answer: "A traditional food platter",
    },
    np: {
      question: "नेवारी संस्कृतिमा 'साँय बाजि' के हो?",
      options: ["एक वाद्य यन्त्र", "एक परम्परागत खाना थाल", "एक प्रकारको नृत्य", "एक धार्मिक अनुष्ठान"],
      answer: "एक परम्परागत खाना थाल",
    },
  },
  {
    id: 21,
    image: null,
    en: {
      question: "In which year was Bhaktapur Durbar Square added to the UNESCO World Heritage List?",
      options: ["1975", "1979", "1985", "1990"],
      answer: "1979",
    },
    np: {
      question: "भक्तपुर दरबार क्षेत्र कुन सालमा युनेस्को विश्व सम्पदा सूचीमा थपियो?",
      options: ["१९७५", "१९७९", "१९८५", "१९९०"],
      answer: "१९७९",
    },
  },
  {
    id: 22,
    image: null,
    en: {
      question: "Bhaktapur was the last of the three Malla kingdoms to be conquered by Prithvi Narayan Shah. In which year?",
      options: ["1765", "1767", "1769", "1775"],
      answer: "1769",
    },
    np: {
      question: "भक्तपुर पृथ्वीनारायण शाहले कुन सालमा जिते?",
      options: ["१७६५", "१७६७", "१७६९", "१७७५"],
      answer: "१७६९",
    },
  },
  {
    id: 23,
    image: null,
    en: {
      question: "The Nyatapola Temple was built in the year:",
      options: ["1600", "1650", "1702", "1750"],
      answer: "1702",
    },
    np: {
      question: "न्यातापोल मन्दिर कुन सालमा बनाइएको थियो?",
      options: ["१६००", "१६५०", "१७०२", "१७५०"],
      answer: "१७०२",
    },
  },
  {
    id: 24,
    image: null,
    en: {
      question: "Which Bhaktapur festival involves the erection of a giant wooden pole (linga)?",
      options: ["Gai Jatra", "Biska Jatra", "Indra Jatra", "Nava Durga Jatra"],
      answer: "Biska Jatra",
    },
    np: {
      question: "कुन भक्तपुर पर्वमा विशाल काठको खम्बा (लिंग) ठड्याइन्छ?",
      options: ["गाई जात्रा", "बिस्का जात्रा", "इन्द्र जात्रा", "नव दुर्गा जात्रा"],
      answer: "बिस्का जात्रा",
    },
  },
  {
    id: 25,
    image: null,
    en: {
      question: "Thimi town, famous for the Sindur Jatra festival, is part of which district?",
      options: ["Kathmandu District", "Lalitpur District", "Bhaktapur District", "Kavrepalanchok District"],
      answer: "Bhaktapur District",
    },
    np: {
      question: "सिन्दूर जात्राका लागि प्रसिद्ध थिमि शहर कुन जिल्लामा पर्छ?",
      options: ["काठमाडौं जिल्ला", "ललितपुर जिल्ला", "भक्तपुर जिल्ला", "काभ्रेपलाञ्चोक जिल्ला"],
      answer: "भक्तपुर जिल्ला",
    },
  },
  {
    id: 26,
    image: null,
    en: {
      question: "What is the approximate distance from Kathmandu to Bhaktapur?",
      options: ["5 km", "13 km", "25 km", "40 km"],
      answer: "13 km",
    },
    np: {
      question: "काठमाडौंबाट भक्तपुरको अनुमानित दूरी कति छ?",
      options: ["५ किमी", "१३ किमी", "२५ किमी", "४० किमी"],
      answer: "१३ किमी",
    },
  },
  {
    id: 27,
    image: null,
    en: {
      question: "The traditional Newari drum used in festivals is called:",
      options: ["Madal", "Dhimay", "Tabla", "Murchunga"],
      answer: "Dhimay",
    },
    np: {
      question: "पर्वहरूमा प्रयोग गरिने परम्परागत नेवारी ढोल के भनिन्छ?",
      options: ["मादल", "ढिमे", "तबला", "मुर्चुंगा"],
      answer: "ढिमे",
    },
  },
  {
    id: 28,
    image: null,
    en: {
      question: "The National Art Gallery of Nepal is located in which square of Bhaktapur?",
      options: ["Taumadhi Square", "Dattatreya Square", "Bhaktapur Durbar Square", "Kumale Square"],
      answer: "Bhaktapur Durbar Square",
    },
    np: {
      question: "नेपालको राष्ट्रिय कला दीर्घा भक्तपुरको कुन चोकमा अवस्थित छ?",
      options: ["तौमढी चोक", "दत्तात्रेय चोक", "भक्तपुर दरबार चोक", "कुमाल चोक"],
      answer: "भक्तपुर दरबार चोक",
    },
  },
  {
    id: 29,
    image: null,
    en: {
      question: "The Bhairabnath Temple in Taumadhi Square has how many storeys?",
      options: ["One", "Two", "Three", "Five"],
      answer: "Three",
    },
    np: {
      question: "तौमढी चोकको भैरवनाथ मन्दिर कति तल्लाको छ?",
      options: ["एक", "दुई", "तीन", "पाँच"],
      answer: "तीन",
    },
  },
  {
    id: 30,
    image: null,
    en: {
      question: "Bhaktapur's Newari name 'Khwopa' can be translated as:",
      options: ["City of Gold", "City of Devotees", "Land of Wood Carvers", "Land of Potters"],
      answer: "City of Devotees",
    },
    np: {
      question: "भक्तपुरको नेवारी नाम 'ख्वप' को अर्थ के हो?",
      options: ["सुनको शहर", "भक्तहरूको शहर", "काठ कुँदाउनेहरूको भूमि", "कुमालहरूको भूमि"],
      answer: "भक्तहरूको शहर",
    },
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// UI translations (English & Nepali)
// ─────────────────────────────────────────────────────────────────────────────
const T = {
  en: {
    title: "Bhaktapur (Khwopa)",
    subtitle: "History, Culture & Geography Quiz",
    description:
      "Test your knowledge about the ancient city of Bhaktapur based on the Class 6 Social Studies / Local Curriculum.",
    features: [
      "📜 10 random questions – multiple choice",
      "⏱ 15-second timer – faster answers earn more points",
      "✅ Instant feedback after each answer",
      "🏆 Earn a badge & share your score!",
    ],
    nameLabel: "Your Name",
    namePlaceholder: "Enter your name to begin",
    nameWarning: "Please enter your name to begin.",
    startBtn: "🏯 Start Quiz",
    restartBtn: "🔄 Try Again",
    printBtn: "🖨️ Print / Save as PDF",
    shareOnFb: "📘 Share on Facebook",
    fbShareHint: "📋 Score text copied! Paste it in your Facebook post.",
    copyLink: "🔗 Copy Link",
    copied: "✅ Copied!",
    downloadBadge: "⬇️ Download Badge",
    quizTitle: "Bhaktapur Quiz",
    quizComplete: "Quiz Complete!",
    scoreCardTitle: "Score Card",
    score: "Score",
    points: "pts",
    correct: "Correct",
    name: "Name",
    date: "Date & Time",
    badge: "Badge",
    liveScore: "Score",
    timeLabel: (s) => `${s}s`,
    correctMsg: "🎉 Correct! Well done.",
    timeUpMsg: "⏰ Time's up!",
    incorrectMsg: (ans) => `❌ Correct answer: ${ans}`,
    gradeExcellent: "Excellent! You are a true Bhaktapur expert! 🏆",
    gradeGood: "Good effort! Keep learning about Khwopa. 👍",
    gradePoor: "Keep exploring the rich heritage of Bhaktapur! 📚",
    langToggle: "नेपाली",
  },
  np: {
    title: "भक्तपुर (ख्वप)",
    subtitle: "इतिहास, संस्कृति र भूगोल प्रश्नोत्तरी",
    description:
      "कक्षा ६ सामाजिक अध्ययन / स्थानीय पाठ्यक्रममा आधारित भक्तपुरको प्राचीन शहरबारे आफ्नो ज्ञान जाँच्नुहोस्।",
    features: [
      "📜 १० अनियमित प्रश्नहरू – बहुविकल्पीय",
      "⏱ १५ सेकेन्डको टाइमर – छिटो उत्तरले बढी अंक पाइन्छ",
      "✅ प्रत्येक उत्तर पछि तत्काल प्रतिक्रिया",
      "🏆 बिल्ला पाउनुहोस् र आफ्नो स्कोर सेयर गर्नुहोस्!",
    ],
    nameLabel: "तपाईंको नाम",
    namePlaceholder: "आफ्नो नाम लेख्नुहोस्",
    nameWarning: "सुरु गर्न कृपया आफ्नो नाम लेख्नुहोस्।",
    startBtn: "🏯 प्रश्नोत्तरी सुरु गर्नुहोस्",
    restartBtn: "🔄 फेरि प्रयास गर्नुहोस्",
    printBtn: "🖨️ प्रिन्ट / PDF मा सेभ गर्नुहोस्",
    shareOnFb: "📘 फेसबुकमा सेयर गर्नुहोस्",
    fbShareHint: "📋 स्कोर टेक्स्ट कपी भयो! फेसबुक पोस्टमा पेस्ट गर्नुहोस्।",
    copyLink: "🔗 लिंक कपी गर्नुहोस्",
    copied: "✅ कपी भयो!",
    downloadBadge: "⬇️ बिल्ला डाउनलोड गर्नुहोस्",
    quizTitle: "भक्तपुर प्रश्नोत्तरी",
    quizComplete: "प्रश्नोत्तरी सम्पन्न!",
    scoreCardTitle: "स्कोर कार्ड",
    score: "स्कोर",
    points: "अंक",
    correct: "सही",
    name: "नाम",
    date: "मिति र समय",
    badge: "बिल्ला",
    liveScore: "स्कोर",
    timeLabel: (s) => `${s}s`,
    correctMsg: "🎉 सही! राम्रो प्रयास।",
    timeUpMsg: "⏰ समय सकियो!",
    incorrectMsg: (ans) => `❌ सही उत्तर: ${ans}`,
    gradeExcellent: "उत्कृष्ट! तपाईं साँचो भक्तपुर विशेषज्ञ हुनुहुन्छ! 🏆",
    gradeGood: "राम्रो प्रयास! ख्वपको बारेमा थप जान्नुहोस्। 👍",
    gradePoor: "भक्तपुरको समृद्ध सम्पदा थप अन्वेषण गर्नुहोस्! 📚",
    langToggle: "English",
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Main App
// ─────────────────────────────────────────────────────────────────────────────
export default function App() {
  const [lang, setLang] = useState("en");
  // "start" | "quiz" | "result"
  const [screen, setScreen] = useState("start");
  const [username, setUsername] = useState("");
  const [nameError, setNameError] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  // null = nothing selected (time ran out), otherwise the chosen option text
  const [selected, setSelected] = useState(null);
  const [score, setScore] = useState(0);       // time-based points
  const [correctCount, setCorrectCount] = useState(0); // # of correct answers
  const [showFeedback, setShowFeedback] = useState(false);
  const [timeLeft, setTimeLeft] = useState(TIMER_SECONDS);
  const [quizDateTime, setQuizDateTime] = useState(null);
  const [imgError, setImgError] = useState({});
  const [copied, setCopied] = useState(false);
  const [fbCopied, setFbCopied] = useState(false);

  // Refs to read latest score/correctCount/quizDateTime inside the auto-advance
  // effect without adding them to the dependency array.
  const scoreRef = useRef(score);
  const correctCountRef = useRef(correctCount);
  const quizDateTimeRef = useRef(quizDateTime);
  const badgeCanvasRef = useRef(null);
  useEffect(() => { scoreRef.current = score; });
  useEffect(() => { correctCountRef.current = correctCount; });
  useEffect(() => { quizDateTimeRef.current = quizDateTime; });

  const t = T[lang];

  // ── Timer countdown ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (screen !== "quiz" || showFeedback) return;
    if (timeLeft <= 0) {
      // Time ran out – defer setState to avoid synchronous setState in effect
      const id = setTimeout(() => setShowFeedback(true), 0);
      return () => clearTimeout(id);
    }
    const id = setTimeout(() => setTimeLeft((prev) => prev - 1), 1000);
    return () => clearTimeout(id);
  }, [screen, timeLeft, showFeedback]);

  // ── Auto-advance after feedback ─────────────────────────────────────────────
  useEffect(() => {
    if (!showFeedback || screen !== "quiz") return;
    const id = setTimeout(() => {
      if (currentIndex + 1 < questions.length) {
        setCurrentIndex((prev) => prev + 1);
        setSelected(null);
        setShowFeedback(false);
        setTimeLeft(TIMER_SECONDS);
      } else {
        const start = quizDateTimeRef.current;
        const durationMs = start ? Date.now() - start.getTime() : undefined;
        void submitScore({ score: scoreRef.current, total_questions: questions.length, quiz_version: QUIZ_VERSION, duration_ms: durationMs, correct_count: correctCountRef.current });
        setScreen("result");
      }
    }, 1500);
    return () => clearTimeout(id);
  }, [showFeedback, currentIndex, questions.length, screen]);

  // ── Start quiz ──────────────────────────────────────────────────────────────
  const startQuiz = () => {
    if (!username.trim()) {
      setNameError(true);
      return;
    }
    setNameError(false);
    const picked = shuffle(ALL_QUESTIONS).slice(0, QUESTIONS_PER_QUIZ);
    setQuestions(picked);
    setCurrentIndex(0);
    setSelected(null);
    setScore(0);
    setCorrectCount(0);
    setShowFeedback(false);
    setTimeLeft(TIMER_SECONDS);
    setQuizDateTime(new Date());
    setImgError({});
    setScreen("quiz");
  };

  // ── Select answer ───────────────────────────────────────────────────────────
  const handleSelect = (option) => {
    if (showFeedback) return;
    setSelected(option);
    if (option === questions[currentIndex][lang].answer) {
      const pts = timeLeft * 1000 * 10;
      setScore((prev) => prev + pts);
      setCorrectCount((prev) => prev + 1);
    }
    setShowFeedback(true);
  };

  // ── Restart ─────────────────────────────────────────────────────────────────
  const handleRestart = () => {
    setScreen("start");
    setCurrentIndex(0);
    setSelected(null);
    setScore(0);
    setCorrectCount(0);
    setShowFeedback(false);
    setTimeLeft(TIMER_SECONDS);
    setQuestions([]);
  };

  // ── Derived values ──────────────────────────────────────────────────────────
  const percentage =
    questions.length > 0 ? Math.round((correctCount / questions.length) * 100) : 0;
  const timerPercent = (timeLeft / TIMER_SECONDS) * 100;
  const timerColor =
    timeLeft > 8 ? "bg-green-500" : timeLeft > 4 ? "bg-yellow-500" : "bg-red-500";

  const formattedDateTime = quizDateTime
    ? quizDateTime.toLocaleString(lang === "en" ? "en-GB" : "ne-NP", {
        day: "2-digit",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

  // ── Badge ───────────────────────────────────────────────────────────────────
  const badge = getBadge(correctCount);
  const badgeName = lang === "np" ? badge.nameNp : badge.name;

  // ── Draw badge canvas when result screen is shown ───────────────────────────
  useEffect(() => {
    if (screen !== "result" || !badgeCanvasRef.current) return;
    drawBadge(badgeCanvasRef.current, {
      badgeName: badge.name,
      emoji: badge.emoji,
      bgStart: badge.bgStart,
      bgEnd: badge.bgEnd,
      correctCount,
      totalQuestions: questions.length,
      pointsScore: score,
      username,
    });
  }, [screen, badge, correctCount, questions.length, score, username]);

  // ── Share helpers ───────────────────────────────────────────────────────────
  const shareText =
    lang === "np"
      ? `मैले खोप्पा क्विजमा ${correctCount}/${questions.length} स्कोर गरें! 😎\nके तपाईं मलाई हराउन सक्नुहुन्छ? 👉 ${SITE_URL}`
      : `I scored ${correctCount}/${questions.length} in Khowpa Quiz! 😎\nCan you beat me? 👉 ${SITE_URL}`;

  const handleShareFacebook = async () => {
    const canvas = badgeCanvasRef.current;
    if (canvas && navigator.canShare) {
      try {
        const blob = await new Promise((res, rej) => {
          canvas.toBlob((b) => (b ? res(b) : rej(new Error("toBlob returned null"))), "image/png");
        });
        const file = new File([blob], "khowpa-quiz-badge.png", { type: "image/png" });
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({ text: shareText, files: [file] });
          return;
        }
      } catch {
        // fall through to URL-based share
      }
    }
    // Copy share text to clipboard so the user can paste it into the Facebook post,
    // since Facebook's sharer does not reliably include the quote parameter.
    try {
      await navigator.clipboard.writeText(shareText);
      setFbCopied(true);
      setTimeout(() => setFbCopied(false), 4000);
    } catch {
      // Clipboard write failed – text won't be pre-copied but the dialog still opens
    }
    const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(SITE_URL)}&quote=${encodeURIComponent(shareText)}`;
    window.open(fbUrl, "_blank", "width=600,height=400,noopener,noreferrer");
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }).catch(() => {
      // Fallback: prompt the user with the text
      window.prompt("Copy this text to share:", shareText);
    });
  };

  const handleDownloadBadge = () => {
    const canvas = badgeCanvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = `khowpa-quiz-badge-${badge.name.toLowerCase()}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  // ── Option style helper ─────────────────────────────────────────────────────
  const optionStyle = (option) => {
    const base =
      "w-full text-left px-4 py-3 rounded-lg border-2 font-medium transition-colors duration-200 cursor-pointer";
    if (!showFeedback) {
      return `${base} border-[#D4A017] bg-[#FFF8E7] text-[#4A2500] hover:bg-[#D4A017] hover:text-white`;
    }
    if (option === questions[currentIndex][lang].answer) {
      return `${base} border-green-600 bg-green-100 text-green-800`;
    }
    if (option === selected) {
      return `${base} border-red-600 bg-red-100 text-red-800`;
    }
    return `${base} border-[#D4A017] bg-[#FFF8E7] text-[#4A2500] opacity-50`;
  };

  // ══════════════════════════════════════════════════════════════════════════
  // START SCREEN
  // ══════════════════════════════════════════════════════════════════════════
  if (screen === "start") {
    return (
      <div className="min-h-screen bg-[#1A0A00] flex items-center justify-center px-4 relative">
        <LangBtn lang={lang} onToggle={() => setLang((l) => (l === "en" ? "np" : "en"))} />
        <div className="bg-[#FFF8E7] rounded-2xl shadow-2xl max-w-md w-full p-8 text-center border-4 border-[#D4A017]">
          <GoldBar />
          <div className="mt-6 mb-1">
            <h1 className="text-3xl font-extrabold text-[#8B1A1A] leading-tight">
              {t.title}
            </h1>
            <h2 className="text-lg font-semibold text-[#6B3F1F] mt-1">{t.subtitle}</h2>
          </div>
          <p className="text-sm text-[#4A2500] mt-3 mb-4">{t.description}</p>

          <ul className="text-sm text-left text-[#4A2500] mb-5 space-y-1">
            {t.features.map((f, i) => (
              <li key={i}>{f}</li>
            ))}
          </ul>

          {/* Username input */}
          <div className="mb-4 text-left">
            <label className="block text-sm font-bold text-[#6B3F1F] mb-1">
              {t.nameLabel}
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                setNameError(false);
              }}
              onKeyDown={(e) => e.key === "Enter" && startQuiz()}
              placeholder={t.namePlaceholder}
              maxLength={50}
              className="w-full px-4 py-2 rounded-lg border-2 border-[#D4A017] bg-white text-[#4A2500] focus:outline-none focus:border-[#8B1A1A]"
            />
            {nameError && (
              <p className="text-red-600 text-xs mt-1">{t.nameWarning}</p>
            )}
          </div>

          <button
            onClick={startQuiz}
            className="w-full py-3 rounded-xl bg-[#8B1A1A] text-[#D4A017] font-bold text-lg tracking-wide hover:bg-[#6B3F1F] transition-colors duration-200 shadow-md"
          >
            {t.startBtn}
          </button>

          <div className="mt-6">
            <GoldBar />
          </div>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // RESULT SCREEN
  // ══════════════════════════════════════════════════════════════════════════
  if (screen === "result") {
    const gradeMsg =
      percentage >= 80 ? t.gradeExcellent : percentage >= 50 ? t.gradeGood : t.gradePoor;

    return (
      <div className="print-bg min-h-screen bg-[#1A0A00] flex items-center justify-center px-4 py-8 relative">
        <LangBtn lang={lang} onToggle={() => setLang((l) => (l === "en" ? "np" : "en"))} />
        <div
          id="score-card"
          className="bg-[#FFF8E7] rounded-2xl shadow-2xl max-w-md w-full p-8 text-center border-4 border-[#D4A017]"
        >
          <GoldBar />

          <div className="mt-5 mb-3">
            <h2 className="text-2xl font-extrabold text-[#8B1A1A]">{t.quizComplete}</h2>
            <p className="text-xs font-bold text-[#8B1A1A] uppercase tracking-widest mt-1">
              {t.scoreCardTitle}
            </p>
          </div>

          {/* Badge canvas */}
          <canvas
            ref={badgeCanvasRef}
            width={400}
            height={400}
            className="w-full max-w-[260px] mx-auto rounded-xl border-2 border-[#D4A017] shadow-lg mb-4 block"
          />

          {/* Badge name label */}
          <p className="text-lg font-extrabold text-[#8B1A1A] mb-1">
            {badge.emoji} {badgeName}
          </p>

          {/* Score box */}
          <div className="bg-[#8B1A1A] rounded-xl p-4 mb-4 text-[#FFF8E7]">
            <p className="text-3xl font-extrabold text-[#D4A017]">
              {correctCount} / {questions.length} <span className="text-lg font-semibold">{t.correct}</span>
            </p>
            <p className="text-base mt-1 font-semibold text-[#D4A017]">
              {score.toLocaleString()} {t.points}
            </p>
          </div>

          {/* Score bar */}
          <div className="w-full bg-[#D4A017]/30 rounded-full h-4 mb-4 overflow-hidden">
            <div
              className="h-4 bg-[#D4A017] rounded-full transition-all duration-700"
              style={{ width: `${percentage}%` }}
            />
          </div>

          <p className="text-[#4A2500] text-sm mb-4">{gradeMsg}</p>

          {/* Name & Date info */}
          <div className="border-2 border-[#D4A017] rounded-xl p-3 mb-4 text-left text-sm text-[#4A2500] space-y-1 bg-white/60">
            <div><strong>{t.name}:</strong> {username}</div>
            <div><strong>{t.date}:</strong> {formattedDateTime}</div>
          </div>

          {/* Share buttons */}
          <div className="flex flex-col gap-2 mb-3 no-print">
            <button
              onClick={handleShareFacebook}
              className="w-full py-2 rounded-xl bg-[#1877F2] text-white font-bold text-sm hover:bg-[#1565C0] transition-colors shadow-md"
            >
              {t.shareOnFb}
            </button>
            {fbCopied && (
              <p className="text-xs text-center text-[#1877F2] font-semibold animate-pulse">
                {t.fbShareHint}
              </p>
            )}
            <div className="flex gap-2">
              <button
                onClick={handleCopyLink}
                className="flex-1 py-2 rounded-xl bg-[#D4A017] text-[#4A2500] font-bold text-sm hover:bg-[#c49014] transition-colors shadow-md"
              >
                {copied ? t.copied : t.copyLink}
              </button>
              <button
                onClick={handleDownloadBadge}
                className="flex-1 py-2 rounded-xl bg-[#6B3F1F] text-[#FFF8E7] font-bold text-sm hover:bg-[#4A2500] transition-colors shadow-md"
              >
                {t.downloadBadge}
              </button>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-3 no-print">
            <button
              onClick={() => window.print()}
              className="flex-1 py-2 rounded-xl bg-[#D4A017] text-[#4A2500] font-bold text-sm hover:bg-[#c49014] transition-colors shadow-md"
            >
              {t.printBtn}
            </button>
            <button
              onClick={handleRestart}
              className="flex-1 py-2 rounded-xl bg-[#8B1A1A] text-[#D4A017] font-bold text-sm hover:bg-[#6B3F1F] transition-colors shadow-md"
            >
              {t.restartBtn}
            </button>
          </div>

          <div className="mt-5">
            <GoldBar />
          </div>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // QUIZ SCREEN
  // ══════════════════════════════════════════════════════════════════════════
  const question = questions[currentIndex];
  if (!question) return null;

  const qData = question[lang];
  const progress = (currentIndex / QUESTIONS_PER_QUIZ) * 100;

  const feedbackMsg = showFeedback
    ? selected === null
      ? t.timeUpMsg
      : selected === qData.answer
      ? t.correctMsg
      : t.incorrectMsg(qData.answer)
    : null;

  const feedbackColor =
    showFeedback && selected !== null && selected === qData.answer
      ? "text-green-700"
      : "text-red-700";

  return (
    <div className="min-h-screen bg-[#1A0A00] flex items-center justify-center px-4">
      <div className="bg-[#FFF8E7] rounded-2xl shadow-2xl max-w-md w-full p-8 border-4 border-[#D4A017]">
        {/* Header row */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold text-[#8B1A1A] uppercase tracking-widest">
            {t.quizTitle}
          </span>
          <span className="text-sm font-semibold text-[#D4A017] bg-[#8B1A1A] px-2 py-0.5 rounded-full">
            ⭐ {score.toLocaleString()} {t.points}
          </span>
          <span className="text-sm font-semibold text-[#6B3F1F]">
            {currentIndex + 1} / {questions.length}
          </span>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-[#D4A017]/30 rounded-full h-3 mb-3 overflow-hidden">
          <div
            className="h-3 bg-[#D4A017] rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Timer */}
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xs font-bold text-[#6B3F1F] w-10 shrink-0">
            ⏱ {t.timeLabel(timeLeft)}
          </span>
          <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
            <div
              className={`h-2 rounded-full transition-all duration-1000 ${timerColor}`}
              style={{ width: `${timerPercent}%` }}
            />
          </div>
        </div>

        {/* Question image (optional) */}
        {question.image && !imgError[question.id] && (
          <div className="mb-4 rounded-xl overflow-hidden border-2 border-[#D4A017]">
            <img
              src={question.image}
              alt="Question illustration"
              className="w-full h-44 object-cover"
              onError={() =>
                setImgError((prev) => ({ ...prev, [question.id]: true }))
              }
            />
          </div>
        )}

        {/* Question text */}
        <h3 className="text-lg font-bold text-[#4A2500] mb-5 leading-snug min-h-[52px]">
          {qData.question}
        </h3>

        {/* Options */}
        <div className="space-y-3">
          {qData.options.map((option) => (
            <button
              key={option}
              className={optionStyle(option)}
              onClick={() => handleSelect(option)}
              disabled={showFeedback}
            >
              {option}
              {showFeedback && option === qData.answer && (
                <span className="float-right text-green-600 font-bold">✓</span>
              )}
              {showFeedback &&
                option === selected &&
                option !== qData.answer && (
                  <span className="float-right text-red-600 font-bold">✗</span>
                )}
            </button>
          ))}
        </div>

        {/* Feedback message */}
        {showFeedback && (
          <p className={`mt-4 text-center text-sm font-semibold ${feedbackColor}`}>
            {feedbackMsg}
          </p>
        )}
      </div>
    </div>
  );
}

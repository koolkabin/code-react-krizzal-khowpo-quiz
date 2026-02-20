import { useState, useEffect } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// Quiz questions about Bhaktapur (Khwopa) – Class 6 Social Studies / Local Curriculum
// ─────────────────────────────────────────────────────────────────────────────
const questions = [
  {
    id: 1,
    question: "What is the ancient name of Bhaktapur?",
    options: ["Lalitpur", "Kantipur", "Khwopa", "Kirtipur"],
    answer: "Khwopa",
  },
  {
    id: 2,
    question: "Which king built the famous 55 Window Palace in Bhaktapur?",
    options: [
      "King Pratap Malla",
      "King Bhupatindra Malla",
      "King Yaksha Malla",
      "King Mahendra Malla",
    ],
    answer: "King Bhupatindra Malla",
  },
  {
    id: 3,
    question: "The Nyatapola Temple in Bhaktapur is dedicated to which deity?",
    options: ["Kumari", "Siddhi Lakshmi", "Taleju", "Bhairav"],
    answer: "Siddhi Lakshmi",
  },
  {
    id: 4,
    question: "How many storeys does the Nyatapola Temple have?",
    options: ["3", "4", "5", "7"],
    answer: "5",
  },
  {
    id: 5,
    question: "Which major festival is unique to Bhaktapur and celebrates the New Year?",
    options: ["Indra Jatra", "Biska Jatra", "Gai Jatra", "Mha Puja"],
    answer: "Biska Jatra",
  },
  {
    id: 6,
    question: "Bhaktapur is especially famous for which traditional craft?",
    options: ["Thangka Painting", "Wood Carving", "Pottery", "Weaving"],
    answer: "Pottery",
  },
  {
    id: 7,
    question: "In which district of Bagmati Province is Bhaktapur located?",
    options: ["Kathmandu District", "Lalitpur District", "Bhaktapur District", "Kavrepalanchok District"],
    answer: "Bhaktapur District",
  },
  {
    id: 8,
    question: "Which square is the main cultural hub of Bhaktapur, also listed as a UNESCO World Heritage Site?",
    options: ["Patan Durbar Square", "Kathmandu Durbar Square", "Bhaktapur Durbar Square", "Changu Narayan Square"],
    answer: "Bhaktapur Durbar Square",
  },
  {
    id: 9,
    question: "Bhaktapur is also known as the 'City of ___'.",
    options: ["Temples", "Devotees", "Festivals", "Craftsmen"],
    answer: "Devotees",
  },
  {
    id: 10,
    question: "Which traditional sweet dish is Bhaktapur most famous for?",
    options: ["Sel Roti", "Juju Dhau (King Curd)", "Chatamari", "Yomari"],
    answer: "Juju Dhau (King Curd)",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Color palette – Newari Cultural theme
// ─────────────────────────────────────────────────────────────────────────────
// Deep Red   : #8B1A1A  (bg-[#8B1A1A])
// Golden     : #D4A017  (text-[#D4A017])
// Wood Brown : #6B3F1F  (bg-[#6B3F1F])
// Light Cream: #FFF8E7

export default function App() {
  // "start" | "quiz" | "result"
  const [screen, setScreen] = useState("start");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState(null);   // option chosen by user
  const [score, setScore] = useState(0);
  const [showFeedback, setShowFeedback] = useState(false);

  // Auto-advance to next question after feedback delay
  useEffect(() => {
    if (!showFeedback) return;
    const timer = setTimeout(() => {
      if (currentIndex + 1 < questions.length) {
        setCurrentIndex((prev) => prev + 1);
        setSelected(null);
        setShowFeedback(false);
      } else {
        setScreen("result");
      }
    }, 1200);
    return () => clearTimeout(timer);
  }, [showFeedback, currentIndex]);

  // Handle option click
  const handleSelect = (option) => {
    if (showFeedback) return; // prevent double-click
    setSelected(option);
    if (option === questions[currentIndex].answer) {
      setScore((prev) => prev + 1);
    }
    setShowFeedback(true);
  };

  // Restart the quiz
  const handleRestart = () => {
    setScreen("start");
    setCurrentIndex(0);
    setSelected(null);
    setScore(0);
    setShowFeedback(false);
  };

  const question = questions[currentIndex];
  const progress = ((currentIndex) / questions.length) * 100;
  const percentage = Math.round((score / questions.length) * 100);

  // ── Helper: option button style ────────────────────────────────────────────
  const optionStyle = (option) => {
    const base =
      "w-full text-left px-4 py-3 rounded-lg border-2 font-medium transition-colors duration-200 cursor-pointer";
    if (!showFeedback) {
      return `${base} border-[#D4A017] bg-[#FFF8E7] text-[#4A2500] hover:bg-[#D4A017] hover:text-white`;
    }
    if (option === questions[currentIndex].answer) {
      return `${base} border-green-600 bg-green-100 text-green-800`;
    }
    if (option === selected) {
      return `${base} border-red-600 bg-red-100 text-red-800`;
    }
    return `${base} border-[#D4A017] bg-[#FFF8E7] text-[#4A2500] opacity-50`;
  };

  // ── START SCREEN ────────────────────────────────────────────────────────────
  if (screen === "start") {
    return (
      <div className="min-h-screen bg-[#1A0A00] flex items-center justify-center px-4">
        <div className="bg-[#FFF8E7] rounded-2xl shadow-2xl max-w-md w-full p-8 text-center border-4 border-[#D4A017]">
          {/* Decorative top line */}
          <div className="w-full h-2 bg-gradient-to-r from-[#8B1A1A] via-[#D4A017] to-[#8B1A1A] rounded-full mb-6" />

          <h1 className="text-3xl font-extrabold text-[#8B1A1A] mb-1 leading-tight">
            Bhaktapur (Khwopa)
          </h1>
          <h2 className="text-lg font-semibold text-[#6B3F1F] mb-4">
            History, Culture &amp; Geography Quiz
          </h2>
          <p className="text-sm text-[#4A2500] mb-6">
            Test your knowledge about the ancient city of Bhaktapur based on
            the <strong>Class 6 Social Studies / Local Curriculum</strong>.
          </p>

          <ul className="text-sm text-left text-[#4A2500] mb-8 space-y-1">
            <li>📜 <strong>10 questions</strong> – multiple choice</li>
            <li>✅ Instant feedback after each answer</li>
            <li>🏆 Score summary at the end</li>
          </ul>

          <button
            onClick={() => setScreen("quiz")}
            className="w-full py-3 rounded-xl bg-[#8B1A1A] text-[#D4A017] font-bold text-lg tracking-wide hover:bg-[#6B3F1F] transition-colors duration-200 shadow-md"
          >
            🏯 Start Quiz
          </button>

          {/* Decorative bottom line */}
          <div className="w-full h-2 bg-gradient-to-r from-[#8B1A1A] via-[#D4A017] to-[#8B1A1A] rounded-full mt-6" />
        </div>
      </div>
    );
  }

  // ── RESULT SCREEN ───────────────────────────────────────────────────────────
  if (screen === "result") {
    const emoji = percentage >= 80 ? "🏆" : percentage >= 50 ? "👍" : "📚";
    const message =
      percentage >= 80
        ? "Excellent! You are a true Bhaktapur expert!"
        : percentage >= 50
        ? "Good effort! Keep learning about Khwopa."
        : "Keep exploring the rich heritage of Bhaktapur!";

    return (
      <div className="min-h-screen bg-[#1A0A00] flex items-center justify-center px-4">
        <div className="bg-[#FFF8E7] rounded-2xl shadow-2xl max-w-md w-full p-8 text-center border-4 border-[#D4A017]">
          <div className="w-full h-2 bg-gradient-to-r from-[#8B1A1A] via-[#D4A017] to-[#8B1A1A] rounded-full mb-6" />

          <div className="text-6xl mb-4">{emoji}</div>
          <h2 className="text-2xl font-extrabold text-[#8B1A1A] mb-2">Quiz Complete!</h2>
          <p className="text-[#4A2500] mb-6">{message}</p>

          {/* Score display */}
          <div className="bg-[#8B1A1A] rounded-xl p-6 mb-6 text-[#FFF8E7]">
            <p className="text-4xl font-extrabold text-[#D4A017]">
              {score} / {questions.length}
            </p>
            <p className="text-lg mt-1 font-semibold">{percentage}% Correct</p>
          </div>

          {/* Percentage bar */}
          <div className="w-full bg-[#D4A017]/30 rounded-full h-4 mb-8 overflow-hidden">
            <div
              className="h-4 bg-[#D4A017] rounded-full transition-all duration-700"
              style={{ width: `${percentage}%` }}
            />
          </div>

          <button
            onClick={handleRestart}
            className="w-full py-3 rounded-xl bg-[#8B1A1A] text-[#D4A017] font-bold text-lg tracking-wide hover:bg-[#6B3F1F] transition-colors duration-200 shadow-md"
          >
            🔄 Restart Quiz
          </button>

          <div className="w-full h-2 bg-gradient-to-r from-[#8B1A1A] via-[#D4A017] to-[#8B1A1A] rounded-full mt-6" />
        </div>
      </div>
    );
  }

  // ── QUIZ SCREEN ─────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#1A0A00] flex items-center justify-center px-4">
      <div className="bg-[#FFF8E7] rounded-2xl shadow-2xl max-w-md w-full p-8 border-4 border-[#D4A017]">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-bold text-[#8B1A1A] uppercase tracking-widest">
            Bhaktapur Quiz
          </span>
          <span className="text-sm font-semibold text-[#6B3F1F]">
            {currentIndex + 1} / {questions.length}
          </span>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-[#D4A017]/30 rounded-full h-3 mb-6 overflow-hidden">
          <div
            className="h-3 bg-[#D4A017] rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Question */}
        <h3 className="text-lg font-bold text-[#4A2500] mb-6 leading-snug min-h-[56px]">
          {question.question}
        </h3>

        {/* Options */}
        <div className="space-y-3">
          {question.options.map((option) => (
            <button
              key={option}
              className={optionStyle(option)}
              onClick={() => handleSelect(option)}
              disabled={showFeedback}
            >
              {option}
              {/* Show tick / cross icon after selection */}
              {showFeedback && option === questions[currentIndex].answer && (
                <span className="float-right text-green-600 font-bold">✓</span>
              )}
              {showFeedback && option === selected && option !== questions[currentIndex].answer && (
                <span className="float-right text-red-600 font-bold">✗</span>
              )}
            </button>
          ))}
        </div>

        {/* Feedback message */}
        {showFeedback && (
          <p
            className={`mt-4 text-center text-sm font-semibold ${
              selected === question.answer ? "text-green-700" : "text-red-700"
            }`}
          >
            {selected === question.answer
              ? "🎉 Correct! Well done."
              : `❌ The correct answer is: ${question.answer}`}
          </p>
        )}
      </div>
    </div>
  );
}

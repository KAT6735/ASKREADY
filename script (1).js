const form = document.querySelector("#question-form");
const list = document.querySelector("#question-list");
const resultTitle = document.querySelector("#result-title");
const copyButton = document.querySelector("#copy-button");
const copyNote = document.querySelector("#copy-note");

const questionBank = {
  lender: {
    base: [
      "What loan options fit my situation best, and why?",
      "What is the full estimated monthly payment, including taxes, insurance, mortgage insurance, and HOA fees if they apply?",
      "How much cash should I expect to bring to closing?",
      "What could cause my rate, payment, or approval amount to change before closing?",
      "What documents should I prepare now so the process does not slow down?"
    ],
    stage: {
      "just-starting": [
        "What price range should I consider comfortable based on my income, debts, and savings?",
        "What should I improve before applying for preapproval?"
      ],
      preapproved: [
        "How long is my preapproval good for?",
        "What should I avoid doing financially before closing?"
      ],
      shopping: [
        "How quickly can you update a preapproval letter for a specific offer?",
        "What payment change should I expect if the purchase price changes by $10,000?"
      ],
      offer: [
        "How fast can we close if my offer is accepted?",
        "Are there any loan conditions that could make my offer less competitive?"
      ]
    },
    priority: {
      cost: [
        "Can you walk me through the lender fees, third-party fees, and prepaid costs separately?"
      ],
      timeline: [
        "What are the key deadlines from accepted offer to closing?"
      ],
      risk: [
        "What are the most common reasons buyers get delayed or denied after preapproval?"
      ],
      confidence: [
        "What would you want me to understand before I decide on this loan?"
      ]
    }
  },
  realtor: {
    base: [
      "What should I know about this local market before I make decisions?",
      "How will you help me compare homes beyond the listing photos?",
      "What red flags should I watch for during showings?",
      "How do you recommend we structure a strong offer without overreaching?",
      "What happens after an offer is accepted?"
    ],
    stage: {
      "just-starting": [
        "What neighborhoods or home types should I consider based on my budget and goals?",
        "What should I do before touring homes?"
      ],
      preapproved: [
        "How should we use my preapproval amount when deciding what homes to see?",
        "What should I expect during the first week of serious home shopping?"
      ],
      shopping: [
        "How do we tell the difference between a fair price and an overpriced listing?",
        "What questions should I ask at every showing?"
      ],
      offer: [
        "What terms can make my offer stronger besides price?",
        "What should I know about inspection, appraisal, and contingencies before submitting?"
      ]
    },
    priority: {
      cost: [
        "What costs should I expect besides down payment and closing costs?"
      ],
      timeline: [
        "What timeline should I expect from touring to offer to closing?"
      ],
      risk: [
        "What issues would make you tell a buyer to slow down or walk away?"
      ],
      confidence: [
        "How will I know when a home is a smart fit instead of just an exciting one?"
      ]
    }
  }
};

function getFormValues() {
  const data = new FormData(form);
  return {
    expert: data.get("expert"),
    stage: data.get("stage"),
    priority: data.get("priority"),
    concern: data.get("concern").trim()
  };
}

function buildQuestions(values) {
  const bank = questionBank[values.expert];
  const questions = [
    ...bank.base,
    ...bank.stage[values.stage],
    ...bank.priority[values.priority]
  ];

  if (values.concern) {
    questions.push(`My specific concern is: "${values.concern}". What should I ask or do before I move forward?`);
  }

  return questions;
}

function renderQuestions() {
  const values = getFormValues();
  const questions = buildQuestions(values);
  resultTitle.textContent = `${values.expert === "lender" ? "Lender" : "Realtor"} questions`;
  list.innerHTML = "";

  questions.forEach((question) => {
    const item = document.createElement("li");
    item.textContent = question;
    list.appendChild(item);
  });

  copyNote.textContent = "";
}

async function copyQuestions() {
  const questions = [...list.querySelectorAll("li")].map((item, index) => `${index + 1}. ${item.textContent}`);
  await navigator.clipboard.writeText(`${resultTitle.textContent}\n\n${questions.join("\n")}`);
  copyNote.textContent = "Copied. Ready to paste into notes, email, or Skool.";
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  renderQuestions();
});

form.addEventListener("change", renderQuestions);
copyButton.addEventListener("click", copyQuestions);

renderQuestions();

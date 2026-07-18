/**
 * Artha — 15 Financial Health Questions
 *
 * Each question has 3 options scored 1–3.
 * q4 checks insurance status (1 = no insurance → "no_insurance" flag).
 * q7 checks high-interest debt (3 = yes → "high_debt" flag).
 */

const questions = [
  {
    id: "q1",
    text: "What is your age bracket?",
    options: [
      { label: "Under 25", value: 1, description: "Just starting your career" },
      { label: "25 – 40", value: 2, description: "Peak earning & growth years" },
      { label: "Over 40", value: 3, description: "Experienced & established" },
    ],
  },
  {
    id: "q2",
    text: "What is your monthly income range?",
    options: [
      { label: "Below ₹30,000", value: 1, description: "Entry-level income" },
      { label: "₹30,000 – ₹1,00,000", value: 2, description: "Mid-range income" },
      { label: "Above ₹1,00,000", value: 3, description: "High income bracket" },
    ],
  },
  {
    id: "q3",
    text: "What percentage of income do you save monthly?",
    options: [
      { label: "Less than 10%", value: 1, description: "Minimal savings habit" },
      { label: "10% – 30%", value: 2, description: "Steady saver" },
      { label: "More than 30%", value: 3, description: "Aggressive saver" },
    ],
  },
  {
    id: "q4",
    text: "Do you have health and life insurance?",
    options: [
      { label: "No insurance at all", value: 1, description: "Completely unprotected" },
      { label: "Basic / employer-provided only", value: 2, description: "Partially covered" },
      { label: "Comprehensive personal cover", value: 3, description: "Well insured" },
    ],
  },
  {
    id: "q5",
    text: "How large is your emergency fund?",
    options: [
      { label: "No emergency fund", value: 1, description: "Living paycheck to paycheck" },
      { label: "1 – 3 months of expenses", value: 2, description: "Building a buffer" },
      { label: "6+ months of expenses", value: 3, description: "Fully prepared" },
    ],
  },
  {
    id: "q6",
    text: "Do you have any active loans?",
    options: [
      { label: "Multiple loans (personal, car, etc.)", value: 1, description: "Heavy debt load" },
      { label: "Only a home loan / education loan", value: 2, description: "Productive debt" },
      { label: "No active loans", value: 3, description: "Debt-free" },
    ],
  },
  {
    id: "q7",
    text: "Do you carry any high-interest debt (credit cards, personal loans >15%)?",
    options: [
      { label: "No high-interest debt", value: 1, description: "Clean credit" },
      { label: "Some, but managing payments", value: 2, description: "Under control" },
      { label: "Yes, significant high-interest debt", value: 3, description: "Urgent attention needed" },
    ],
  },
  {
    id: "q8",
    text: "What is your investment experience?",
    options: [
      { label: "Complete beginner", value: 1, description: "Never invested before" },
      { label: "Some experience (FDs, MFs)", value: 2, description: "Familiar with basics" },
      { label: "Advanced (stocks, derivatives, etc.)", value: 3, description: "Active investor" },
    ],
  },
  {
    id: "q9",
    text: "How would you react if your investments dropped 20% in a month?",
    options: [
      { label: "Panic and sell everything", value: 1, description: "Very low risk tolerance" },
      { label: "Wait and watch nervously", value: 2, description: "Moderate patience" },
      { label: "Buy more at the dip", value: 3, description: "High risk appetite" },
    ],
  },
  {
    id: "q10",
    text: "What is your primary investment time horizon?",
    options: [
      { label: "Less than 2 years", value: 1, description: "Short-term needs" },
      { label: "2 – 7 years", value: 2, description: "Medium-term goals" },
      { label: "7+ years", value: 3, description: "Long-term wealth creation" },
    ],
  },
  {
    id: "q11",
    text: "What is your primary financial goal right now?",
    options: [
      { label: "Build an emergency fund / clear debt", value: 1, description: "Stability first" },
      { label: "Save for a house / car / wedding", value: 2, description: "Big-ticket purchase" },
      { label: "Grow long-term wealth / retire early", value: 3, description: "Wealth accumulation" },
    ],
  },
  {
    id: "q12",
    text: "How many financial dependents do you have?",
    options: [
      { label: "3 or more (parents, spouse, children)", value: 1, description: "Heavy responsibilities" },
      { label: "1 – 2 dependents", value: 2, description: "Moderate obligations" },
      { label: "None — financially independent", value: 3, description: "Full flexibility" },
    ],
  },
  {
    id: "q13",
    text: "How do you handle tax planning?",
    options: [
      { label: "I don't plan — taxes are deducted at source", value: 1, description: "No strategy" },
      { label: "Basic 80C investments (PPF, ELSS)", value: 2, description: "Doing the minimum" },
      { label: "Comprehensive tax optimisation", value: 3, description: "Maximising every deduction" },
    ],
  },
  {
    id: "q14",
    text: "Do you own any real estate (other than your primary home)?",
    options: [
      { label: "No real estate", value: 1, description: "No property assets" },
      { label: "One investment property", value: 2, description: "Some diversification" },
      { label: "Multiple properties / REITs", value: 3, description: "Real estate portfolio" },
    ],
  },
  {
    id: "q15",
    text: "How are you planning for retirement?",
    options: [
      { label: "No plan yet", value: 1, description: "Haven't started thinking" },
      { label: "EPF / PPF contributions only", value: 2, description: "Basic foundation" },
      { label: "EPF + NPS + personal portfolio", value: 3, description: "Multi-layered strategy" },
    ],
  },
];

export default questions;

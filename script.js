const investments = [];
document.addEventListener("DOMContentLoaded", async () => {
  const headerRow = document.createElement("tr");
  const headers = [
    "Stock",
    "Current Day Close",
    "Current Day Open",
    "Prev Day Low",
    "52W High",
    "52W Low",
    "M-Cap",
    "P/E",
    "Number of Shares",
  ];
  headers.forEach((header) => {
    const th = document.createElement("th");
    th.textContent = header;
    headerRow.appendChild(th);
  });
  const table = document.createElement("table", { id: "stock_table" });
  const thead = document.createElement("thead");
  const tbody = document.createElement("tbody");
  thead.appendChild(headerRow);
  table.appendChild(thead);

  let data_cache = localStorage.getItem("data_cache");
  let data;
  if (!data_cache) {
    const res = await fetch("http://localhost:5000/");
    data = await res.json();
    localStorage.setItem("data_cache", JSON.stringify(data));
  } else data = JSON.parse(data_cache);

  if (data_cache && data) {
    if (Date.now() - JSON.parse(data_cache).timestamp > 30 * 60 * 1000) {
      const res = await fetch("http://localhost:5000/");
      data = await res.json();
      localStorage.setItem("data_cache", JSON.stringify(data));
    }
  }
  data = data["data"];
  data.forEach((stock) => {
    const row = document.createElement("tr");
    const cells = [
      stock.symbol,
      stock.lastPrice,
      stock.open,
      stock.previousClose,
      stock.yearHigh,
      stock.yearLow,
      stock.ffmc,
      stock.perChange30d,
      stock.totalTradedVolume,
    ];
    cells.forEach((cell) => {
      const td = document.createElement("td");
      td.textContent = cell;
      row.appendChild(td);
    });
    tbody.appendChild(row);
  });
  table.appendChild(tbody);

  document.getElementById("nifty50_holder").innerHTML = table.outerHTML;
});
document.addEventListener("DOMContentLoaded", async () => {
  document.getElementById("sip_form").addEventListener("submit", calculate_sip);
  document
    .getElementById("mutual_fund_form")
    .addEventListener("submit", (e) => {
      e.preventDefault();
      const income = parseInt(document.getElementById("income").value);
      const expenses = parseInt(document.getElementById("expenses").value);
      const savings = parseInt(document.getElementById("savings").value);
      recommend_mutual_fund(income, expenses, savings);
    });

  document.querySelector(".feedback_button").onclick = () => {
    document.querySelector("#feedback_popover").style.display = "block";
  };
});

function calculate_sip(e) {
  e.preventDefault();
  const principal = parseInt(document.getElementById("investment").value); // Initial investment
  const annualReturnRate = parseFloat(document.getElementById("rate").value); // Annual return rate in percentage
  const years = parseInt(document.getElementById("time").value); // Number of years
  const monthlyInvestment = parseInt(
    document.getElementById("monthlyInvestment").value
  ); // Monthly investment amount
  calc_sip(principal, annualReturnRate, years, monthlyInvestment);
}

function calc_sip(principal, annualReturnRate, years, monthlyInvestment) {
  const monthlyReturnRate = annualReturnRate / 12 / 100;
  const totalMonths = years * 12;
  let currentAmount = principal;
  let total_returns = 0;
  const table = document.createElement("table");
  const thead = document.createElement("thead");
  const tbody = document.createElement("tbody");
  const headerRow = document.createElement("tr");
  const headers = ["Month", "Investment", "Total Returns", "Total Amount"];
  headers.forEach((header) => {
    const th = document.createElement("th");
    th.textContent = header;
    headerRow.appendChild(th);
  });
  thead.appendChild(headerRow);
  table.appendChild(thead);

  for (let i = 1; i <= totalMonths; i++) {
    const row = document.createElement("tr");
    const monthCell = document.createElement("td");
    monthCell.textContent = i;
    row.appendChild(monthCell);

    const investmentCell = document.createElement("td");
    investmentCell.textContent = monthlyInvestment * i;
    row.appendChild(investmentCell);

    const returns = currentAmount * monthlyReturnRate;
    total_returns += returns;
    const returnsCell = document.createElement("td");
    returnsCell.textContent = total_returns.toFixed(2);
    row.appendChild(returnsCell);

    currentAmount += monthlyInvestment + returns;
    const totalAmountCell = document.createElement("td");
    totalAmountCell.textContent = currentAmount.toFixed(2);
    row.appendChild(totalAmountCell);

    tbody.appendChild(row);
  }

  table.appendChild(tbody);
  document.getElementById("sip_result").innerHTML = table.outerHTML;
}

class MutualFundsRecommender {
  constructor(mutual_funds_data) {
    this.mutual_funds_data = mutual_funds_data;
  }

  recommend(income, expenses, savings) {
    const recommended_funds = [];

    for (const row of this.mutual_funds_data) {
      const fund_type = row["fund_type"];
      let recommended = true;

      if (income < 300000 && fund_type !== "Low Risk") {
        recommended = false;
      }

      if (expenses > 50000 && fund_type !== "High Risk") {
        recommended = false;
      }

      if (savings < 50000 && fund_type !== "Low Risk") {
        recommended = false;
      }

      if (recommended) {
        recommended_funds.push({ name: row["name"], risk: row["fund_type"] });
      }
    }

    return recommended_funds;
  }
}

function import_mutual_funds_data() {
  const data = [
    { name: "Fund 1", fund_type: "Low Risk" },
    { name: "Fund 2", fund_type: "Low Risk" },
    { name: "Fund 3", fund_type: "High Risk" },
    { name: "Fund 4", fund_type: "Low Risk" },
    { name: "Fund 5", fund_type: "High Risk" },
  ];
  return data;
}

function main(income, expenses, savings) {
  const mutual_funds_data = import_mutual_funds_data();
  const recommender = new MutualFundsRecommender(mutual_funds_data);
  const recommended_funds = recommender.recommend(income, expenses, savings);
  return recommended_funds;
}

function recommend_mutual_fund(income, expenses, savings) {
  const recommended_funds = main(income, expenses, savings);

  const table = document.createElement("table");
  const thead = document.createElement("thead");
  const tbody = document.createElement("tbody");
  const headerRow = document.createElement("tr");
  const headers = ["Name", "Risk"];
  headers.forEach((header) => {
    const th = document.createElement("th");
    th.textContent = header;
    headerRow.appendChild(th);
  });
  thead.appendChild(headerRow);
  table.appendChild(thead);

  for (const fund of recommended_funds) {
    const row = document.createElement("tr");
    const nameCell = document.createElement("td");
    nameCell.textContent = fund.name;
    row.appendChild(nameCell);

    const expenseRatioCell = document.createElement("td");
    expenseRatioCell.textContent = fund.risk;
    row.appendChild(expenseRatioCell);

    tbody.appendChild(row);
  }
  table.appendChild(tbody);
  document.getElementById("mutual_fund_result").innerHTML = table.outerHTML;
}

// Define the mutual funds data
const mutual_funds_data = [
  { name: "Fund A", risk: "High", expense_ratio: 0.05, return_rate: 0.1 },
  { name: "Fund B", risk: "Medium", expense_ratio: 0.03, return_rate: 0.07 },
  { name: "Fund C", risk: "Low", expense_ratio: 0.01, return_rate: 0.05 },
];

// Define the stocks data
const stocks_data = [
  { name: "Stock A", risk: "High", return_rate: 0.15 },
  { name: "Stock B", risk: "Medium", return_rate: 0.1 },
  { name: "Stock C", risk: "Low", return_rate: 0.05 },
];

// Define the monthly investment amount
const monthly_investment = 1000;

// Define the number of years to invest
const years_to_invest = 10;

// Define the initial investment amount
const initial_investment = 10000;

// Define the total investment amount
const total_investment =
  initial_investment + monthly_investment * 12 * years_to_invest;

// Calculate the recommended mutual funds
function recommend_mutual_funds(income, expenses, savings) {
  // Calculate the available investment amount
  const available_investment = savings + (income - expenses) * 0.5;

  // Calculate the investment amount for each mutual fund
  const investment_amounts = calc_sip(
    available_investment,
    0.1,
    years_to_invest,
    monthly_investment
  );

  // Calculate the recommended mutual funds
  const recommender = new MutualFundsRecommender(mutual_funds_data);
  const recommended_funds = recommender.recommend(
    income,
    expenses,
    savings,
    investment_amounts
  );

  return recommended_funds;
}

// Calculate the recommended stocks
function recommend_stocks(income, expenses, savings) {
  // Calculate the available investment amount
  const available_investment = savings + (income - expenses) * 0.5;

  // Calculate the investment amount for stocks
  const stock_investment_amount = available_investment * 0.3;

  // Calculate the recommended stocks
  const recommender = new StocksRecommender(stocks_data);
  const recommended_stocks = recommender.recommend(
    income,
    expenses,
    savings,
    stock_investment_amount
  );

  return recommended_stocks;
}

// Calculate the total return rate
function calculate_total_return_rate(income, expenses, savings) {
  // Calculate the recommended mutual funds
  const recommended_funds = recommend_mutual_funds(income, expenses, savings);

  // Calculate the recommended stocks
  const recommended_stocks = recommend_stocks(income, expenses, savings);

  // Calculate the total investment amount for mutual funds
  const mutual_funds_investment_amount = recommended_funds.reduce(
    (total, fund) => total + fund.investment_amount,
    0
  );

  // Calculate the total return for mutual funds
  const mutual_funds_return = calc_total_return(
    mutual_funds_investment_amount,
    mutual_funds_data,
    years_to_invest
  );

  // Calculate the total investment amount for stocks
  const stocks_investment_amount = recommended_stocks.reduce(
    (total, stock) => total + stock.investment_amount,
    0
  );

  // Calculate the total return for stocks
  const stocks_return = calc_total_return(
    stocks_investment_amount,
    stocks_data,
    years_to_invest
  );

  // Calculate the total return rate
  const total_return_rate =
    (mutual_funds_return + stocks_return - total_investment) / total_investment;

  return total_return_rate;
}

// Calculate the recommended monthly investment amount
function calculate_monthly_investment_amount(income, expenses, savings) {
  // Calculate the available investment amount
  const available_investment = savings + (income - expenses) * 0.5;

  // Calculate the recommended mutual funds
  const recommended_funds = recommend_mutual_funds(income, expenses, savings);

  // Calculate the recommended stocks
  const recommended_stocks = recommend_stocks(income, expenses, savings);

  // Calculate the total investment amount for mutual funds
  const mutual_funds_investment_amount = recommended_funds.reduce(
    (total, fund) => total + fund.investment_amount,
    0
  );

  // Calculate the total investment amount for stocks
  const stocks_investment_amount = recommended_stocks.reduce(
    (total, stock) => total + stock.investment_amount,
    0
  );

  // Calculate the remaining investment amount
  const remaining_investment =
    available_investment -
    mutual_funds_investment_amount -
    stocks_investment_amount;

  // Calculate the recommended monthly investment amount
  const recommended_monthly_investment_amount =
    remaining_investment / (12 * years_to_invest);

  return recommended_monthly_investment_amount;
}

// Calculate the recommended wealth management plan
function recommend_wealth_management_plan(income, expenses, savings) {
  // Calculate the recommended mutual funds
  const recommended_funds = recommend_mutual_funds(income, expenses, savings);

  // Calculate the recommended stocks
  const recommended_stocks = recommend_stocks(income, expenses, savings);

  // Calculate the recommended monthly investment amount
  const recommended_monthly_investment_amount =
    calculate_monthly_investment_amount(income, expenses, savings);

  // Calculate the total return rate
  const total_return_rate = calculate_total_return_rate(
    income,
    expenses,
    savings
  );

  // Return the recommended wealth management plan
  return {
    recommended_funds,
    recommended_stocks,
    recommended_monthly_investment_amount,
    total_return_rate,
  };
}

function on_stock_changed() {}

const pad = (value) => String(value).padStart(2, "0");

const dateKey = (year, monthIndex, day) => `${year}-${pad(monthIndex + 1)}-${pad(day)}`;

export const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const buildBillsForDay = (year, monthIndex, day) => {
  const saleCount = (day % 4) + 1;
  return Array.from({ length: saleCount }, (_, idx) => {
    const billNumber = `${year}${pad(monthIndex + 1)}${pad(day)}${idx + 1}`;
    const amount = 120 + ((day * 37 + idx * 53) % 520);
    const hour = 9 + ((idx * 3 + day) % 11);
    const minute = ((idx * 17 + day * 7) % 60);

    return {
      id: `BILL-${year}-${billNumber}`,
      amount,
      time: `${pad(hour)}:${pad(minute)}`,
      items: ["Masala Chai", "Veg Sandwich", "Water Bottle"].slice(0, (idx % 3) + 1),
    };
  });
};

const buildMonthData = (year, monthIndex) => {
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const monthData = {};

  for (let day = 1; day <= daysInMonth; day += 1) {
    const key = dateKey(year, monthIndex, day);
    monthData[key] = day % 6 === 0 ? [] : buildBillsForDay(year, monthIndex, day);
  }

  return monthData;
};

export const getMonthData = (year, monthIndex) => buildMonthData(year, monthIndex);

const today = new Date();
export const TODAY_KEY = dateKey(today.getFullYear(), today.getMonth(), today.getDate());

export const MOCK_DB = {
  ...buildMonthData(today.getFullYear(), today.getMonth()),
};
